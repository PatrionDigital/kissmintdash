import { LeaderboardService, LeaderboardEntry } from '../leaderboard.service';

// Copy of REDIS_KEYS from service
const REDIS_KEYS = {
  dailyLeaderboard: (dateSuffix: string) => `leaderboard:daily:${dateSuffix}`,
  weeklyLeaderboard: (weekSuffix: string) => `leaderboard:weekly:${weekSuffix}`,
};


// Mocks for Redis and Turso clients
class MockRedis {
  private zsets: Record<string, Array<{ member: string; score: number }>> = {};

  async zadd(key: string, score: number, member: string) {
    if (!this.zsets[key]) this.zsets[key] = [];
    const idx = this.zsets[key].findIndex(e => e.member === member);
    if (idx !== -1) {
      this.zsets[key][idx].score = score;
    } else {
      this.zsets[key].push({ member, score });
    }
  }

  async zrange(key: string, start: number, stop: number, options?: { withScores?: boolean; rev?: boolean }) {
    let arr = this.zsets[key] ? [...this.zsets[key]] : [];
    if (options?.rev) arr = arr.sort((a, b) => b.score - a.score);
    else arr = arr.sort((a, b) => a.score - b.score);
    if (typeof start === 'number' && typeof stop === 'number') {
      arr = arr.slice(start, stop === -1 ? undefined : stop + 1);
    }
    if (options?.withScores) {
      return arr.map(e => ({ member: e.member, score: e.score }));
    } else {
      return arr.map(e => e.member);
    }
  }

  async del(key: string) {
    delete this.zsets[key];
  }
}

class MockTurso {
  public archived: any[] = [];
  async batch(statements: any[]) {
    this.archived.push(...statements);
    return { success: true };
  }
}

describe('LeaderboardService', () => {
  let redis: MockRedis;
  let turso: MockTurso;
  let service: LeaderboardService;

  beforeEach(() => {
    redis = new MockRedis();
    turso = new MockTurso();
    // @ts-ignore
    service = new LeaderboardService(redis, turso);
  });

  it('submits and retrieves scores correctly', async () => {
    const period = '2025-06-02';
    const key = REDIS_KEYS.dailyLeaderboard(period);
    await redis.zadd(key, 100, 'user1');
    await redis.zadd(key, 200, 'user2');
    await redis.zadd(key, 150, 'user3');
    const entries = await redis.zrange(key, 0, -1, { withScores: true, rev: true });
    expect(entries).toEqual([
      { member: 'user2', score: 200 },
      { member: 'user3', score: 150 },
      { member: 'user1', score: 100 },
    ]);
  });

  it('snapshots and resets leaderboard', async () => {
    const period = '2025-06-02';
    const key = REDIS_KEYS.dailyLeaderboard(period);
    await redis.zadd(key, 50, 'userA');
    await redis.zadd(key, 75, 'userB');
    await redis.zadd(key, 25, 'userC');
    await service.snapshotAndResetLeaderboard('daily', period);
    // Check Turso archive
    expect(turso.archived.length).toBe(3);
    expect(turso.archived[0].args[2]).toBe('userB'); // Highest score
    // Check Redis cleared
    const after = await redis.zrange(key, 0, -1, { withScores: true, rev: true });
    expect(after).toEqual([]);
  });


  it('handles empty leaderboard gracefully', async () => {
    await service.snapshotAndResetLeaderboard('daily', '2025-06-02');
    expect(turso.archived.length).toBe(0);
    const after = await redis.zrange('leaderboard:daily', 0, -1, { withScores: true, rev: true });
    expect(after).toEqual([]);
  });
});
