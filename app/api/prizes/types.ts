export type PoolType = 'daily' | 'weekly';

export type DistributionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface PrizeDistribution {
  id: string;
  type: PoolType;
  periodIdentifier: string;
  status: DistributionStatus;
  totalWinners: number;
  totalDistributed: string;
  currency: string;
  startedAt: string;
  completedAt: string | null;
  error?: string;
}

export interface PrizePayout {
  userId: string;
  userAddress: string;
  rank: number;
  score: number;
  prizeAmount: string;
  status: 'success' | 'failed' | 'skipped';
  transactionHash?: string;
  error?: string;
}

export interface PrizePool {
  type: PoolType;
  baseAmount: number;
  bonusAmount: number;
  totalAmount: number;
  currency: string;
  lastUpdated: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    page: number;
    pageSize: number;
    total: number;
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
