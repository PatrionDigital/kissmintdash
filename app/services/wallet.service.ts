// WalletService: Manages secure $GLICO token transfers via the Base Smart Wallet for prize payouts.
import crypto from 'crypto';

interface PrizePayout {
  userAddress: string; // Resolved wallet address
  prizeAmount: string; // Amount of $GLICO to send (smallest unit, as string)
}

// Coinbase API Structures (simplified)
interface EvmContractInvocationAction {
  type: 'EVM_CONTRACT_INVOCATION';
  contractAddress: string;
  method: string;
  args: string[]; // [toAddress, amountString]
  value: string; // Usually '0' for ERC20 transfers
}

interface BuildTransactionRequest {
  accountId: string;
  networkId: string;
  actions: EvmContractInvocationAction[];
  feeLevel?: string; // e.g., 'LOW', 'MEDIUM', 'HIGH', or let Smart Wallet handle with paymaster
}

interface BuildTransactionResponse {
  transactionId: string;
  // ... other fields
}

interface BroadcastTransactionResponse {
  transactionHash: string;
  // ... other fields
}

export class WalletService {
  private apiKey: string;
  private apiSecret: string;
  private smartWalletAccountId: string;
  private glicoTokenAddress: string;
  private baseNetworkId: string;
  private coinbaseApiBaseUrl: string;

  constructor() {
    this.apiKey = process.env.COINBASE_API_KEY || '';
    this.apiSecret = process.env.COINBASE_API_SECRET || '';
    this.smartWalletAccountId = process.env.COINBASE_SMART_WALLET_ACCOUNT_ID || '';
    this.glicoTokenAddress = process.env.GLICO_TOKEN_ADDRESS || '';
    this.baseNetworkId = process.env.BASE_NETWORK_ID || 'base-mainnet'; // Default to Base Mainnet
    this.coinbaseApiBaseUrl = process.env.COINBASE_API_BASE_URL || 'https://api.developer.coinbase.com';

    if (!this.apiKey || !this.apiSecret || !this.smartWalletAccountId || !this.glicoTokenAddress) {
      throw new Error('Coinbase API credentials, Smart Wallet Account ID, or GLICO token address are not fully configured in environment variables.');
    }
    console.log('[WalletService] Initialized with necessary configurations.');
  }

  private async _coinbaseApiRequest<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: object
  ): Promise<T> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const bodyString = body ? JSON.stringify(body) : '';
    const message = timestamp + method.toUpperCase() + path + bodyString;
    const signature = crypto.createHmac('sha256', this.apiSecret).update(message).digest('hex');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'CB-ACCESS-KEY': this.apiKey,
      'CB-ACCESS-SIGN': signature,
      'CB-ACCESS-TIMESTAMP': timestamp,
    };

    const url = `${this.coinbaseApiBaseUrl}${path}`;
    console.log(`[WalletService] Making API ${method} request to ${url}`);

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
      return undefined;
    }

    const actions: EvmContractInvocationAction[] = prizePayouts.map(payout => ({
      type: 'EVM_CONTRACT_INVOCATION',
      contractAddress: this.glicoTokenAddress,
      method: 'transfer', // Standard ERC20 transfer method
      // prizeAmount is already a string representing the smallest unit
      args: [payout.userAddress, payout.prizeAmount], 
      value: '0', // Not sending ETH with the contract call
    }));

    const buildRequest: BuildTransactionRequest = {
      accountId: this.smartWalletAccountId,
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
