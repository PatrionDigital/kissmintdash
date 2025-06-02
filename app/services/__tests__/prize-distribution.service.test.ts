import { PrizeDistributionService } from '../prize-distribution.service';
import { LeaderboardService } from '../leaderboard.service';
import { PrizePoolManager } from '../prize-pool.service';
import { WalletService } from '../wallet.service';
import { FarcasterProfileService } from '../farcaster-profile.service';

// Mocks
class MockLeaderboardService {
  async getActiveLeaderboard(boardType: 'daily' | 'weekly', topN = 100) {
    // Simulate a leaderboard with 3 winners
    return [
      { userId: 'fid1', score: 100, rank: 1 },
      { userId: 'fid2', score: 80, rank: 2 },
      { userId: 'fid3', score: 60, rank: 3 },
    ];
  }
}

class MockPrizePoolManager {
  async claimPrizePool(poolType: 'daily' | 'weekly') {
    // Simulate a fixed pool
    return 3000; // In smallest unit
  }
}

class MockWalletService {
  distributed: any[] = [];
  async distributePrizes(prizePayouts: any[]) {
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

process.env.TURSO_DATABASE_URL = 'mock';
process.env.TURSO_AUTH_TOKEN = 'mock';

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
    // Provide a Jest mock for the Turso client
    const mockTursoClient = { execute: jest.fn(), batch: jest.fn() };
    // @ts-ignore
    service = new PrizeDistributionService(
      leaderboardService,
      prizePoolManager,
      walletService,
      farcasterProfileService,
      mockTursoClient
    );
  });

  it('distributes prizes to resolved wallet addresses', async () => {
    // Simulate a daily distribution
    await service.settlePrizesForPeriod('daily', '2025-06-02');
    // Check that distributePrizes was called with correct payouts
    expect(walletService.distributed.length).toBe(3);
    expect(walletService.distributed[0].userAddress).toBe('0xAAA');
    expect(walletService.distributed[1].userAddress).toBe('0xBBB');
    expect(walletService.distributed[2].userAddress).toBe('0xCCC');
  });

  it('skips users with missing wallet addresses', async () => {
    // Simulate fid2 has no wallet
    farcasterProfileService.getWalletAddressForFid = async (fid: string) => (fid === 'fid2' ? null : '0xAAA');
    await service.settlePrizesForPeriod('daily', '2025-06-02');
    // Only 2 distributed
    expect(walletService.distributed.length).toBe(2);
  });
});
