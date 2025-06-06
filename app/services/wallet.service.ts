// WalletService: Manages secure $GLICO token transfers via the Coinbase Wallet API v2 (CDP API) for prize payouts.
import crypto from 'crypto';

// Interface for individual prize payout details provided to the service
export interface PrizePayout {
  userAddress: string; // Resolved wallet address of the recipient
  prizeAmount: string; // Amount of $GLICO to send (in the smallest unit, as a string)
}

// Interface for the request body when sending an ERC20 token via CDP API v2
interface SendTokenApiRequestBody {
  type: 'SEND_TOKEN';
  to_address: string;
  token_address: string;
  amount: string;
  network_id: string;
}

// Interface for the expected successful response from the SEND_TOKEN API call
interface SendTokenApiResponse {
  transaction_hash: string;
  // The API might return other fields like transaction_id, but transaction_hash is key.
}

// Interface for the result of each individual prize distribution attempt
export interface PrizeDistributionResult {
  userAddress: string;
  status: 'SUCCESS' | 'FAILED';
  transactionHash?: string;
  error?: string;
}

export class WalletService {
  private cdpApiKey: string;
  private apiSecret: string;
  private payoutAccountId: string;
  private tokenAddress: string;
  private cdpNetworkId: string;
  private cdpApiBaseUrl: string;

  constructor() {
    this.cdpApiKey = process.env.CDP_API_KEY_ID || '';
    this.apiSecret = process.env.CDP_API_KEY_SECRET || '';
    this.payoutAccountId = process.env.CDP_PAYOUT_ACCOUNT_ID || '';
    this.tokenAddress = process.env.NEXT_PUBLIC_TOKEN_ADDRESS || '';
    this.cdpNetworkId = process.env.CDP_BASE_NETWORK_ID || 'base-mainnet'; // Default to Base Mainnet (e.g., 8453)
    this.cdpApiBaseUrl = process.env.CDP_API_V2_BASE_URL || 'https://api.developer.coinbase.com/api/v2';

    const missingVars = [];
    if (!this.cdpApiKey) missingVars.push('CDP_API_KEY');
    if (!this.apiSecret) missingVars.push('CDP_API_SECRET');
    if (!this.payoutAccountId) missingVars.push('CDP_PAYOUT_ACCOUNT_ID');
    if (!this.tokenAddress) missingVars.push('NEXT_PUBLIC_TOKEN_ADDRESS');
    if (!this.cdpNetworkId) missingVars.push('CDP_BASE_NETWORK_ID');
    if (!this.cdpApiBaseUrl) missingVars.push('CDP_API_V2_BASE_URL');

    if (missingVars.length > 0) {
      throw new Error(`WalletService: Missing required environment variables: ${missingVars.join(', ')}`);
    }
    console.log('[WalletService] Initialized with CDP API v2 configurations.');
  }

  private async _coinbaseApiRequest<T>(
    method: 'GET' | 'POST',
    path: string, // Should be relative path, e.g., /v2/accounts/...
    body?: object
  ): Promise<T> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const bodyString = body ? JSON.stringify(body) : '';
    const prehashString = timestamp + method.toUpperCase() + path + bodyString;

    const hmac = crypto.createHmac('sha256', this.apiSecret);
    hmac.update(prehashString);
    const signature = hmac.digest('hex');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'CB-ACCESS-KEY': this.cdpApiKey,
      'CB-ACCESS-SIGNATURE': signature,
      'CB-ACCESS-TIMESTAMP': timestamp,
    };

    const url = `${this.cdpApiBaseUrl}${path}`;

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: method === 'POST' ? bodyString : undefined, // Only send body for POST
      });

      if (!response.ok) {
        const errorBodyText = await response.text();
        console.error(`[WalletService] Coinbase CDP API Error: ${response.status} ${response.statusText}`, `URL: ${url}`, `Response: ${errorBodyText}`);
        throw new Error(`Coinbase CDP API request failed: ${response.status} ${response.statusText} - ${errorBodyText}`);
      }
      // Handle cases where response might be empty (e.g., 204 No Content)
      const responseText = await response.text();
      return responseText ? JSON.parse(responseText) as T : ({} as T); 
    } catch (error) {
      console.error(`[WalletService] Error during API request to ${url}:`, error);
      throw error; // Re-throw to be caught by the calling method
    }
  }

  async distributePrizes(prizePayouts: PrizePayout[]): Promise<PrizeDistributionResult[]> {
    const results: PrizeDistributionResult[] = [];

    if (prizePayouts.length === 0) {
      console.log('[WalletService] No prize payouts to distribute.');
      return results;
    }

    console.log(`[WalletService] Starting distribution for ${prizePayouts.length} payouts.`);

    for (const payout of prizePayouts) {
      if (!payout.userAddress || !payout.prizeAmount) {
        console.warn('[WalletService] Skipping invalid payout entry:', payout);
        results.push({
          userAddress: payout.userAddress || 'UNKNOWN',
          status: 'FAILED',
          error: 'Invalid payout details (missing userAddress or prizeAmount)',
        });
        continue;
      }

      const requestBody: SendTokenApiRequestBody = {
        type: 'SEND_TOKEN',
        to_address: payout.userAddress,
        token_address: this.tokenAddress,
        amount: payout.prizeAmount, // Assumed to be in the smallest unit of the token
        network_id: this.cdpNetworkId,
      };

      const apiPath = `/v2/accounts/${this.payoutAccountId}/transactions`;

      try {
        console.log(`[WalletService] Attempting to send ${payout.prizeAmount} ${this.tokenAddress} to ${payout.userAddress} on network ${this.cdpNetworkId} via account ${this.payoutAccountId}`);
        const response = await this._coinbaseApiRequest<SendTokenApiResponse>(
          'POST',
          apiPath,
          requestBody
        );
        results.push({
          userAddress: payout.userAddress,
          status: 'SUCCESS',
          transactionHash: response.transaction_hash,
        });
        console.log(`[WalletService] Successfully sent prize to ${payout.userAddress}. TxHash: ${response.transaction_hash}`);
      } catch (error: unknown) {
        let errorMessage = 'Unknown error during prize distribution';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        console.error(`[WalletService] Failed to send prize to ${payout.userAddress}:`, errorMessage, error);
        results.push({
          userAddress: payout.userAddress,
          status: 'FAILED',
          error: errorMessage,
        });
      }
    }
    console.log('[WalletService] Finished prize distribution process.');
    return results;
  }
}
