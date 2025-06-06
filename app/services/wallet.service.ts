import { Wallet } from '@coinbase/coinbase-sdk';
import { TransferResult, PrizePayout, TransactionStatus } from '../types/wallet.types';
import { getWalletConfig } from '../config/wallet.config';

// Network configuration
const NETWORKS = {
  PRODUCTION: 'base-mainnet',
  TESTNET: 'base-sepolia'
} as const;

export class WalletService {
  private tokenAddress: string;
  private wallet: Wallet | null = null;
  private isInitialized = false;
  private config: ReturnType<typeof getWalletConfig>;
  private networkId: string = 'base-sepolia'; // Default to testnet

  constructor() {
    // Load configuration
    this.config = getWalletConfig();
    this.networkId = this.config.isProduction ? NETWORKS.PRODUCTION : NETWORKS.TESTNET;
    this.tokenAddress = this.config.tokenAddress;
  }

  /**
   * Ensure the wallet is initialized
   * This is the public method that should be called by consumers
   */
  public async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Initialize the Coinbase SDK and Smart Account wallet
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('[WalletService] Initializing Coinbase SDK v2');
      
      // In v2, we don't need to explicitly configure the SDK
      // The wallet connection will be established when needed through the browser
      
      // Try to load existing wallet if we have an ID
      if (this.config.coinbaseWalletId) {
        console.log(`[WalletService] Loading existing wallet with ID: ${this.config.coinbaseWalletId}`);
        this.wallet = await Wallet.fetch(this.config.coinbaseWalletId);
      } else {
        // Create new wallet if no ID is provided
        console.log('[WalletService] Creating new wallet...');
        this.wallet = await Wallet.create({ networkId: this.networkId });
        console.log('[WalletService] Created new wallet. Save this ID for future use:', this.wallet.getId());
      }

      const walletAddress = await this.wallet.getDefaultAddress();
      if (!walletAddress) {
        throw new Error('Failed to get wallet address');
      }
      console.log('[WalletService] Initialized with wallet:', {
        id: this.wallet.getId(),
        address: walletAddress,
        network: this.networkId,
        isSmartAccount: true
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('[WalletService] Failed to initialize:', error);
      throw new Error('Failed to initialize Coinbase Wallet SDK');
    }
  }

  /**
   * Distribute prizes to multiple winners using batch transfers
   * @param prizePayouts Array of { userAddress, prizeAmount } (amount in smallest unit)
   * @returns Array of transfer results, or undefined on failure
   */
  async distributePrizes(prizePayouts?: PrizePayout[] | null): Promise<TransferResult[] | undefined> {
    if (!Array.isArray(prizePayouts) || prizePayouts.length === 0) {
      console.log('[WalletService] No prize payouts to distribute.');
      return undefined;
    }

    try {
      // Ensure wallet is initialized
      if (!this.isInitialized || !this.wallet) {
        await this.initialize();
      }

      if (!this.wallet) {
        throw new Error('Wallet not initialized');
      }

      // Execute transfers in sequence to avoid nonce issues
      const results: TransferResult[] = [];
      
      for (const payout of prizePayouts) {
        try {
          console.log(`[WalletService] Preparing transfer to ${payout.userAddress}:`, {
            amount: payout.prizeAmount,
            token: this.tokenAddress
          });
          
          // Create and send transfer transaction
          const amount = parseFloat(payout.prizeAmount) / 1e18; // Convert from wei to token units
          
          // Execute transfer with gasless option for USDC or other tokens
          const transfer = await this.wallet.createTransfer({
            amount,
            assetId: this.tokenAddress,
            destination: payout.userAddress,
            gasless: true, // Use gasless transactions
            skipBatching: true // Submit immediately
          });
          
          // Wait for the transaction to be mined
          await transfer.wait();
          const txHash = await transfer.getTransactionHash();
          const status: TransactionStatus = 'confirmed'; // Assume success if wait() completes without error
          
          console.log(`[WalletService] Transfer to ${payout.userAddress} completed:`, {
            txHash,
            status
          });
          
          results.push({
            status,
            transactionHash: txHash
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`[WalletService] Failed to transfer to ${payout.userAddress}:`, errorMessage);
          results.push({
            status: 'failed',
            error: errorMessage
          });
        }
      }

      return results;
    } catch (error) {
      console.error('[WalletService] Failed to distribute prizes:', error);
      return undefined;
    }
  }

  /**
   * Get the wallet's address
   */
  async getWalletAddress(): Promise<string> {
    if (!this.isInitialized || !this.wallet) {
      await this.initialize();
    }
    const address = await this.wallet!.getDefaultAddress();
    if (!address) {
      throw new Error('Failed to get wallet address');
    }
    return address.toString();
  }

  /**
   * Get the token balance for the connected wallet
   */
  async getTokenBalance(): Promise<string> {
    if (!this.isInitialized || !this.wallet) {
      await this.initialize();
    }
    
    try {
      // Get balance for the specific token
      const balance = await this.wallet!.getBalance(this.tokenAddress);
      
      // Return the raw amount as a string (in wei/smallest unit)
      return balance.toString();
    } catch (error) {
      console.error('[WalletService] Failed to get token balance:', error);
      throw error;
    }
  }

  /**
   * Get the transaction status by hash
   */
  async getTransactionStatus(txHash: string): Promise<TransactionStatus> {
    if (!this.isInitialized || !this.wallet) {
      await this.initialize();
    }

    try {
      // In a real implementation, you would use the SDK's method to check transaction status
      // For now, we'll return 'confirmed' as a placeholder
      // In production, replace this with actual transaction status check using the SDK
      console.log(`[WalletService] Checking status of tx: ${txHash}`);
      
      // This is a simplified implementation - in a real app, you would:
      // 1. Use the SDK's method to get transaction status
      // 2. Check the transaction receipt for confirmation status
      // 3. Return 'pending' if not yet confirmed, 'confirmed' if successful, 'failed' if reverted
      
      // For now, we'll assume the transaction is confirmed if we can reach this point
      return 'confirmed';
    } catch (error) {
      console.error(`[WalletService] Failed to get status for tx ${txHash}:`, error);
      return 'failed';
    }
  }
}

// Singleton instance
export const walletService = new WalletService();
