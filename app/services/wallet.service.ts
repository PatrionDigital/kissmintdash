import { CdpClient } from '@coinbase/cdp-sdk';
import { formatUnits, parseUnits, createPublicClient, http, PublicClient, Chain } from 'viem';
import { base } from 'viem/chains';
import { sleep } from '@/app/utils/sleep';

// Constants
const DEFAULT_CONFIRMATIONS = 3;
const MAX_ACCOUNTS_PER_PAGE = 100;
const GLICO_TOKEN_DECIMALS = 18;

// Types
interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
}

interface TransferResult {
  status: 'submitted' | 'confirmed' | 'failed' | 'skipped';
  transactionHash?: string;
  userAddress: string;
  prizeAmount: string;
  userId?: string | number;
  timestamp: number;
  confirmations?: number;
  error?: string;
  retries?: number;
}

interface PrizePayout {
  userAddress: string;
  prizeAmount: string;
  userId?: string | number;
}

type TransactionStatus = 'success' | 'reverted' | 'confirmed' | 'failed' | 'skipped';

interface ExtendedEvmAccount {
  address: string;
  transfer: (params: {
    to: `0x${string}`;
    amount: bigint;
    token: string;
    network: string;
  }) => Promise<{ transactionHash: string }>;
  getBalance?: (params: {
    token: string;
    network: string;
  }) => Promise<bigint>;
}

class WalletServiceError extends Error {
  constructor(
    message: string, 
    public readonly code: string = 'WALLET_SERVICE_ERROR', 
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'WalletServiceError';
  }
}

class TransactionError extends WalletServiceError {
  constructor(
    message: string,
    public readonly transactionHash?: string,
    code: string = 'TRANSACTION_ERROR',
    details?: Record<string, unknown>
  ) {
    super(message, code, details);
    this.name = 'TransactionError';
  }
}

class AccountNotFoundError extends WalletServiceError {
  constructor(accountId: string) {
    super(`Account not found: ${accountId}`, 'ACCOUNT_NOT_FOUND');
    this.name = 'AccountNotFoundError';
  }
}





// Default retry configuration
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffFactor: 2,
};


export class WalletService {
  private static instance: WalletService;
  private client: CdpClient;
  private publicClient: PublicClient;
  private tokenAddress: `0x${string}`;
  private baseNetworkId: string;
  private payoutAccountId: string;

  private constructor() {
    if (!process.env.NEXT_PUBLIC_TOKEN_ADDRESS) {
      throw new WalletServiceError('NEXT_PUBLIC_TOKEN_ADDRESS environment variable is not set');
    }
    if (!process.env.CDP_PAYOUT_ACCOUNT_ID) {
      throw new WalletServiceError('CDP_PAYOUT_ACCOUNT_ID environment variable is not set');
    }
    if (!process.env.BASE_NETWORK_ID) {
      throw new WalletServiceError('BASE_NETWORK_ID environment variable is not set');
    }

    this.tokenAddress = process.env.NEXT_PUBLIC_TOKEN_ADDRESS as `0x${string}`;
    this.payoutAccountId = process.env.CDP_PAYOUT_ACCOUNT_ID;
    this.baseNetworkId = process.env.BASE_NETWORK_ID;

    this.client = new CdpClient({
      apiKeyId: process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || '',
    });

    this.publicClient = createPublicClient({
      chain: base as Chain, // Explicitly type the chain
      transport: http(),
      batch: {
        multicall: false
      }
    }) as PublicClient; // Explicitly type the client
  }

  public static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  /**
   * Distributes prizes to multiple users
   */
  public async distributePrizes(
    prizePayouts: PrizePayout[],
    options: {
      waitForConfirmation?: boolean;
      confirmations?: number;
      retryConfig?: Partial<RetryConfig>;
    } = {}
  ): Promise<TransferResult[]> {
    const results: TransferResult[] = [];
    const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...options.retryConfig };
    const confirmations = options.confirmations ?? DEFAULT_CONFIRMATIONS;
    
    // Process payouts sequentially to avoid rate limiting
    for (const payout of prizePayouts) {
      try {
        if (!payout.userAddress) {
          results.push({
            status: 'skipped',
            error: 'Missing user address',
            userAddress: '',
            prizeAmount: payout.prizeAmount,
            userId: payout.userId,
            timestamp: Date.now(),
          });
          continue;
        }

        if (!payout.prizeAmount) {
          results.push({
            status: 'skipped',
            error: 'Missing prize amount',
            userAddress: payout.userAddress,
            prizeAmount: '0',
            userId: payout.userId,
            timestamp: Date.now(),
          });
          continue;
        }

        // Convert prize amount to BigInt with proper decimal handling
        const amountAsBigInt = parseUnits(payout.prizeAmount, GLICO_TOKEN_DECIMALS);
        
        // Get the payout account
        const senderAccount = await this.getAccountById(this.payoutAccountId);
        if (!senderAccount) {
          throw new AccountNotFoundError(this.payoutAccountId);
        }

        // Execute transfer with retry logic
        const result = await this.executeWithRetry(
          async () => {
            const tx = await senderAccount.transfer({
              to: payout.userAddress as `0x${string}`,
              amount: amountAsBigInt,
              token: this.tokenAddress,
              network: this.baseNetworkId,
            });

            let confirmationsResult;
            if (options.waitForConfirmation) {
              confirmationsResult = await this.waitForTransactionConfirmations(
                tx.transactionHash,
                confirmations
              );
            }

            return {
              txHash: tx.transactionHash,
              confirmations: confirmationsResult?.confirmations,
            };
          },
          {
            description: `Transfer ${payout.prizeAmount} to ${payout.userAddress}`,
            ...retryConfig,
          }
        );

        results.push({
          status: options.waitForConfirmation ? 'confirmed' : 'submitted',
          transactionHash: result.txHash,
          userAddress: payout.userAddress,
          prizeAmount: payout.prizeAmount,
          userId: payout.userId,
          timestamp: Date.now(),
          confirmations: result.confirmations,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({
          status: 'failed',
          error: errorMessage,
          userAddress: payout.userAddress,
          prizeAmount: payout.prizeAmount,
          userId: payout.userId,
          timestamp: Date.now(),
          retries: error && typeof error === 'object' && 'retries' in error 
            ? Number(error.retries) 
            : undefined,
        });
      }
    }

    return results;
  }

  /**
   * Gets the balance of the payout account
   */
  public async getPayoutAccountBalance(): Promise<{
    address: string;
    balance: bigint;
    formatted: string;
  }> {
    const account = await this.getAccountById(this.payoutAccountId);
    if (!account) {
      throw new AccountNotFoundError(this.payoutAccountId);
    }

    try {
      const balance = await account.getBalance?.({
        token: this.tokenAddress,
        network: this.baseNetworkId,
      }) ?? BigInt(0);

      return {
        address: account.address,
        balance,
        formatted: formatUnits(balance, GLICO_TOKEN_DECIMALS),
      };
    } catch (error) {
      throw new WalletServiceError(
        `Failed to get balance for account ${this.payoutAccountId}`,
        'BALANCE_FETCH_ERROR',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Gets an account by ID
   */
  private async getAccountById(accountId: string): Promise<ExtendedEvmAccount | null> {
    try {
      // Use the EVM client to list accounts
      const { accounts } = await this.client.evm.listAccounts({
        pageSize: MAX_ACCOUNTS_PER_PAGE,
      });

      const account = accounts?.find(acc => acc.address === accountId);
      return account as unknown as ExtendedEvmAccount | null;
    } catch (error) {
      throw new WalletServiceError(
        `Failed to fetch account ${accountId}`,
        'ACCOUNT_FETCH_ERROR',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Waits for a transaction to be confirmed
   */
  private async waitForTransactionConfirmations(
    txHash: string,
    confirmations: number
  ): Promise<{ status: TransactionStatus; confirmations: number }> {
    try {
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash: txHash as `0x${string}`,
        confirmations,
      });

      return {
        status: receipt.status === 'success' ? 'confirmed' : 'reverted',
        confirmations,
      };
    } catch (error) {
      throw new TransactionError(
        `Failed to confirm transaction ${txHash}`,
        txHash,
        'TRANSACTION_CONFIRMATION_ERROR',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Executes a function with retry logic
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    config: RetryConfig & { description: string }
  ): Promise<T> {
    let lastError: Error | undefined;
    let attempt = 0;
    let delay = config.initialDelayMs;

    while (attempt <= config.maxRetries) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        attempt++;

        if (attempt > config.maxRetries) {
          break;
        }

        // Add jitter to avoid thundering herd problem
        const jitter = Math.random() * 0.2 + 0.9; // 0.9 to 1.1
        const delayWithJitter = Math.min(delay * jitter, config.maxDelayMs);
        
        console.warn(
          `Retry ${attempt}/${config.maxRetries} for ${config.description} after ${delayWithJitter}ms`,
          error
        );

        await sleep(delayWithJitter);
        delay *= config.backoffFactor;
      }
    }

    // Add retry information to the error
    const errorWithRetries = lastError as Error & { 
      retries?: number; 
      code?: string; 
      details?: Record<string, unknown>; 
      transactionHash?: string;
      [key: string]: unknown; // Allow additional properties
    } & Record<string, unknown>;
    errorWithRetries.retries = attempt - 1;
    
    throw errorWithRetries;
  }
}

// Export a singleton instance
export const walletService = WalletService.getInstance();

export default walletService;
