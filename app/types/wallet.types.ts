export type TransactionStatus = 'success' | 'failed' | 'pending' | 'confirmed';

export interface TransferResult {
  status: TransactionStatus;
  transactionHash?: string;
  to?: string;
  error?: string;
}

export interface PrizePayout {
  userAddress: string;
  prizeAmount: string; // in wei/smallest unit
}
