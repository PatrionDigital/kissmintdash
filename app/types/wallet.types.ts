export type TransactionStatus = 'success' | 'failed' | 'pending' | 'confirmed' | 'skipped';

export interface TransferResult {
  status: TransactionStatus;
  transactionHash?: string;
  userAddress: string; // The recipient's address for this specific transfer
  prizeAmount: string; // The amount for this specific transfer
  userId?: string | number; // Optional: Original User ID (e.g., Farcaster ID)
  error?: string;
}

export interface PrizePayout {
  userAddress: string;
  prizeAmount: string; // in wei/smallest unit
  userId?: string | number; // Optional: Original User ID (e.g., Farcaster ID) for tracking/logging
}
