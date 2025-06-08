export type TransactionStatus = 
  | 'pending'    // Transaction created but not yet sent
  | 'submitted'  // Transaction submitted to network
  | 'confirmed'  // Transaction confirmed on chain
  | 'failed'     // Transaction failed
  | 'skipped';   // Transaction was skipped due to validation

export interface TransferResult {
  status: TransactionStatus;
  transactionHash?: string;
  userAddress: string; // The recipient's address for this specific transfer
  prizeAmount: string; // The amount for this specific transfer in wei/smallest unit
  userId?: string | number; // Original User ID (e.g., Farcaster ID)
  error?: string;
  retries?: number; // Number of retry attempts made
  timestamp?: number; // When the transfer was initiated (ms since epoch)
  confirmations?: number; // Number of confirmations (if applicable)
}

export interface PrizePayout {
  userAddress: string;
  prizeAmount: string; // in wei/smallest unit
  userId?: string | number; // Original User ID (e.g., Farcaster ID)
}

export interface RetryConfig {
  maxRetries: number; // Maximum number of retry attempts
  initialDelayMs: number; // Initial delay between retries in ms
  maxDelayMs: number; // Maximum delay between retries in ms
  backoffFactor: number; // Exponential backoff factor
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 30000, // 30 seconds
  backoffFactor: 2,
};
