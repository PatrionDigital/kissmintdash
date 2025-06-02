import { PrizeDistributionService } from '../prize-distribution.service';
// Add this import
import { LeaderboardService } from '../leaderboard.service';
import { PrizePoolManager } from '../prize-pool.service';
import { WalletService } from '../wallet.service';
import { FarcasterProfileService } from '../farcaster-profile.service';
import { Client as TursoClient } from '@libsql/client';
import { Redis } from '@upstash/redis';
// Mocks
class MockLeaderboardService {
  // Add required properties and methods to match LeaderboardService
  redis = {} as unknown as Redis;
  turso = {} as unknown as TursoClient;
  async getActiveLeaderboard(boardType: 'daily' | 'weekly', topN = 100): Promise<{ userId: string; score: number; rank: number }[]> {
    void boardType;
    void topN;
    // Simulate a leaderboard with 3 winners
    return [
      { userId: 'fid1', score: 100, rank: 1 },
      { userId: 'fid2', score: 80, rank: 2 },
      { userId: 'fid3', score: 60, rank: 3 },
    ];
  }
  async snapshotAndResetLeaderboard(boardType: 'daily' | 'weekly', periodIdentifier: string): Promise<void> {
    void boardType;
    void periodIdentifier;
    // No-op mock
  }
  getCurrentPeriodIdentifiers(): { daily: string; weekly: string } {
    return { daily: 'mock-daily', weekly: 'mock-weekly' };
  }
  async validateScore(): Promise<boolean> {
    return true;
  }
  async logScoreSubmissionToTurso(): Promise<void> {
    // No-op mock
  }
  async submitScore(): Promise<void> {
    // No-op mock
  }
  async archiveLeaderboard(): Promise<void> {
    // No-op mock
  }
}

class MockPrizePoolManager {
  redis = {} as unknown as Redis;
  turso = {} as unknown as TursoClient;
  
  async claimPrizePool(poolType: 'daily' | 'weekly'): Promise<number> {
    void poolType;
    return 3000; // In smallest unit
  }

  // Add other required methods with minimal implementations
  getPoolKey(poolType: 'daily' | 'weekly'): string {
    return `prize_pool:${poolType}`;
  }

  async addToPrizePool(amount: number, poolType: 'daily' | 'weekly'): Promise<void> {
    void amount;
    void poolType;
  }

  async getCurrentPrizePool(poolType: 'daily' | 'weekly'): Promise<number> {
    void poolType;
    return 3000;
  }

  async logPrizePoolContribution(): Promise<void> {}
}

class MockWalletService {
  distributed: unknown[] = [];
  async distributePrizes(prizePayouts: Record<string, unknown>[]): Promise<string> {
    this.distributed.push(...prizePayouts);
    return 'mock_tx_hash';
  }
}

class MockFarcasterProfileService {
  async getWalletAddressForFid(fid: string) {
    // Map FIDs to wallet addresses
    const map: Record<string, string> = {
      fid1: '0xAAA',
      fid2: '0xBBB',
      fid3: '0xCCC',
    };
    return map[fid] || null;
  }
}

process.env.NEXT_PUBLIC_TURSO_URL = 'mock';
process.env.NEXT_PUBLIC_TURSO_API_SECRET = 'mock';

describe('PrizeDistributionService', () => {
  let leaderboardService: MockLeaderboardService;
  let prizePoolManager: MockPrizePoolManager;
  let walletService: MockWalletService;
  let farcasterProfileService: MockFarcasterProfileService;
  let service: PrizeDistributionService;

  beforeEach(() => {
    leaderboardService = new MockLeaderboardService();
    prizePoolManager = new MockPrizePoolManager();
    walletService = new MockWalletService();
    farcasterProfileService = new MockFarcasterProfileService();
    
    // Mock Turso client with proper typing and mock implementations
    const mockTursoClient = {
      execute: jest.fn().mockResolvedValue({ rows: [] }),
      batch: jest.fn().mockResolvedValue([])
    } as unknown as TursoClient;

    service = new PrizeDistributionService(
      leaderboardService as unknown as LeaderboardService,
      prizePoolManager as unknown as PrizePoolManager,
      walletService as unknown as WalletService,
      farcasterProfileService as unknown as FarcasterProfileService,
      mockTursoClient
    );
  });

  it('distributes prizes to resolved wallet addresses', async () => {
    // Simulate a daily distribution
    await service.settlePrizesForPeriod('daily', '2025-06-02');
    // Check that distributePrizes was called with correct payouts
    const typedDistributed = walletService.distributed as Array<{ userAddress: string }>;
    expect(typedDistributed.length).toBe(3);
    expect(typedDistributed[0].userAddress).toBe('0xAAA');
    expect(typedDistributed[1].userAddress).toBe('0xBBB');
    expect(typedDistributed[2].userAddress).toBe('0xCCC');
  });

  it('skips users with missing wallet addresses', async () => {
    // Simulate fid2 has no wallet
    farcasterProfileService.getWalletAddressForFid = async (fid: string) => (fid === 'fid2' ? null : '0xAAA');
    await service.settlePrizesForPeriod('daily', '2025-06-02');
    // Only 2 distributed
    expect(walletService.distributed.length).toBe(2);
  });
});
