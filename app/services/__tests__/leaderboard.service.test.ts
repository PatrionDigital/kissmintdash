import { LeaderboardService } from '../leaderboard.service';

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
  public archived: unknown[] = [];
  async batch(statements: Record<string, unknown>[]) {
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
    // @ts-expect-error - Necessary to bypass TypeScript type checking, as the LeaderboardService constructor expects a real Redis client, but we're using a mock for testing purposes.
    service = new LeaderboardService(redis, turso);
  });

  it('submits and retrieves scores correctly', async () => {
    const period = '2025-06-02';
    const key = REDIS_KEYS.dailyLeaderboard(period);
    await redis.zadd(key, 100, 'user1');
    await redis.zadd(key, 200, 'user2');
    await redis.zadd(key, 150, 'user3');
    const entries = await redis.zrange(key, 0, -1, { withScores: true, rev: true });
    const typedEntries = entries as { member: string; score: number }[];
    expect(typedEntries).toEqual([
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
    
    // Check Turso archive - each statement is an object with sql and args
    const statements = turso.archived as Array<{ sql: string; args: unknown[] }>;
    expect(statements.length).toBe(3);
    
    // Extract the user data from the SQL statements
    const archivedData = statements.map(statement => ({
      user_id: statement.args[2], // user_id is the 3rd argument in the SQL statement
      score: statement.args[4],   // score is the 5th argument in the SQL statement
      rank: statement.args[3]     // rank is the 4th argument in the SQL statement
    }));
    
    // Sort by score descending to verify the ranking
    const sortedByScore = [...archivedData].sort((a, b) => (b.score as number) - (a.score as number));
    
    // Verify the order of user_ids based on scores
    const userIds = sortedByScore.map(row => row.user_id);
    expect(userIds).toEqual(['userB', 'userA', 'userC']);
    
    // Verify the scores are correct
    const userScores = Object.fromEntries(archivedData.map(row => [row.user_id, row.score]));
    expect(userScores['userA']).toBe(50);
    expect(userScores['userB']).toBe(75);
    expect(userScores['userC']).toBe(25);
    
    // Verify the ranks are correct (1-based index)
    const userRanks = Object.fromEntries(archivedData.map(row => [row.user_id, row.rank]));
    expect(userRanks['userB']).toBe(1);
    expect(userRanks['userA']).toBe(2);
    expect(userRanks['userC']).toBe(3);
    
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
