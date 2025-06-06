import { Wallet } from '@coinbase/coinbase-sdk';
import { TransferResult, PrizePayout, TransactionStatus } from '../types/wallet.types';
import { getWalletConfig } from '../config/wallet.config';

// Network configuration
const NETWORKS = {
  PRODUCTION: 'base-mainnet',
  TESTNET: 'base-sepolia'
} as const;

export class WalletService {
  private apiKey: string;

  private tokenAddress: string;
  private baseNetworkId: string;
  private coinbaseApiBaseUrl: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || '';

    this.tokenAddress = process.env.NEXT_PUBLIC_TOKEN_ADDRESS || '';
    this.baseNetworkId = process.env.BASE_NETWORK_ID || 'base-mainnet'; // Default to Base Mainnet
    this.coinbaseApiBaseUrl = process.env.COINBASE_API_BASE_URL || 'https://api.developer.coinbase.com';

    if (!this.apiKey || !this.tokenAddress) {
      throw new Error('OnchainKit API key or NEXT_PUBLIC_TOKEN_ADDRESS are not fully configured in environment variables.');
    }
    console.log('[WalletService] Initialized with necessary configurations.');
  }

  private async _coinbaseApiRequest<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: object
  ): Promise<T> {
    // NOTE: If Coinbase API requires authentication, add it here. Otherwise, use only the API key if needed.
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'CB-ACCESS-KEY': this.apiKey,
    };

    const url = `${this.coinbaseApiBaseUrl}${path}`;
    const bodyString = body ? JSON.stringify(body) : '';

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: bodyString || undefined,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[WalletService] Coinbase API Error: ${response.status} ${response.statusText}`, errorBody);
        throw new Error(`Coinbase API request failed: ${response.status} ${response.statusText} - ${errorBody}`);
      }
      return response.json() as Promise<T>;
    } catch (error) {
      console.error(`[WalletService] Error during API request to ${url}:`, error);
      throw error;
    }
  }

  async distributePrizes(prizePayouts: PrizePayout[]): Promise<string | undefined> {
    if (prizePayouts.length === 0) {
      console.log('[WalletService] No prize payouts to distribute.');
      return results;
    }

    const actions: EvmContractInvocationAction[] = prizePayouts.map(payout => ({
      type: 'EVM_CONTRACT_INVOCATION',
      contractAddress: this.tokenAddress,
      method: 'transfer', // Standard ERC20 transfer method
      // prizeAmount is already a string representing the smallest unit
      args: [payout.userAddress, payout.prizeAmount], 
      value: '0', // Not sending ETH with the contract call
    }));

    const buildRequest: BuildTransactionRequest = {
      accountId: '', // TODO: Supply the correct Smart Wallet accountId here if required by the API
      networkId: this.baseNetworkId,
      actions: actions,
      // feeLevel: 'MEDIUM', // Optional: Or rely on Smart Wallet paymaster if configured
    };

    try {
      console.log('[WalletService] Building transaction with actions:', JSON.stringify(actions, null, 2));
      const buildResponse = await this._coinbaseApiRequest<BuildTransactionResponse>(
        'POST',
        '/v1/transactions:build',
        buildRequest
      );
      console.log('[WalletService] Transaction built successfully:', buildResponse);

      const transactionId = buildResponse.transactionId;
      if (!transactionId) {
        throw new Error('Failed to get transactionId from build response.');
      }

      console.log(`[WalletService] Broadcasting transaction with ID: ${transactionId}`);
      const broadcastResponse = await this._coinbaseApiRequest<BroadcastTransactionResponse>(
        'POST',
        `/v1/transactions/${transactionId}:broadcast`,
        {} // Empty body for broadcast
      );
      console.log('[WalletService] Transaction broadcast successfully:', broadcastResponse);

      return broadcastResponse.transactionHash;
    } catch (error) {
      console.error('[WalletService] Failed to distribute prizes:', error);
      // Depending on desired behavior, you might want to re-throw or handle specific errors differently.
      return undefined; // Indicate failure
    }
  }
}

// Singleton instance
export const walletService = new WalletService();
