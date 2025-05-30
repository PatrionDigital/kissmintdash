// app/services/leaderboard.service.ts
import { Redis } from '@upstash/redis';
import { Client as TursoClient, ResultSet } from '@libsql/client';

// Define a type for leaderboard entries
export interface LeaderboardEntry {
  userId: string; // Farcaster ID (FID) of the user
  score: number;
  rank?: number; // Optional, can be added when retrieving ranked list
  // Potentially add other relevant fields like displayName if available
}

// Define a type for archived leaderboard entries (includes prize)
export interface ArchivedLeaderboardEntry {
  userId: string; // Farcaster ID (FID) of the user
  score: number;
  rank: number; // Rank is non-optional for archived entries
  periodIdentifier: string;
  boardType: 'daily' | 'weekly';
  prizeAmount: number;
  archivedAt: Date;
}

// Configuration for Redis keys (consider moving to a config file or constants)
const REDIS_KEYS = {
  dailyLeaderboard: (dateSuffix: string) => `leaderboard:daily:${dateSuffix}`, // e.g., leaderboard:daily:2023-10-27
  weeklyLeaderboard: (weekSuffix: string) => `leaderboard:weekly:${weekSuffix}`, // e.g., leaderboard:weekly:2023-W43
  // Potentially user_last_submission_time:{userId} to prevent spam if needed
};

export class LeaderboardService {
  private redis: Redis;
  private turso: TursoClient;

  constructor(redisClient: Redis, tursoClient: TursoClient) {
    this.redis = redisClient;
    this.turso = tursoClient;
    console.log('LeaderboardService initialized with Redis and Turso clients');
  }

  /**
   * Generates the current period identifiers for daily and weekly leaderboards.
   * This logic might be shared or centralized if other services need it.
   */
  private getCurrentPeriodIdentifiers(): { daily: string; weekly: string } {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = (now.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = now.getUTCDate().toString().padStart(2, '0');
    const dailyIdentifier = `${year}-${month}-${day}`;

    // Calculate ISO week number
    const firstDayOfYear = new Date(Date.UTC(year, 0, 1));
    const pastDaysOfYear = (now.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getUTCDay() + 1) / 7);
    const weeklyIdentifier = `${year}-W${weekNumber.toString().padStart(2, '0')}`;
    
    return { daily: dailyIdentifier, weekly: weeklyIdentifier };
  }

  /**
   * Submits a score for a user.
   * Adds the score to both daily and weekly active leaderboards in Redis.
   * Assumes higher scores are better.
   * @param userId - The user's identifier (e.g., wallet address or internal ID).
   * @param score - The score achieved by the user.
   * @param gameId - Identifier for the game played (for potential future use/filtering).
   * @param gameSessionData - Additional data from the game session (for validation/anti-cheat).
   */
  /**
   * Validates a score submission.
   * Placeholder for now. Future implementation will include anti-cheat checks.
   * @param _userId - The user's identifier.
   * @param _score - The score achieved.
   * @param _gameId - Identifier for the game played.
   * @param _gameSessionData - Additional data from the game session.
   * @returns True if the score is valid, false otherwise.
   */
  private async validateScore(
    _userId: string,
    _score: number,
    _gameId: string,
    _gameSessionData: any
  ): Promise<boolean> {
    // TODO: Implement actual anti-cheat and validation logic.
    // For example, check against expected score ranges, game session integrity, user behavior patterns, etc.
    // For now, all scores are considered valid.
    console.log('Score validation (placeholder): Score is considered valid.');
    return true;
  }

  /**
   * Logs a score submission to Turso for auditing and analysis.
   */
  private async logScoreSubmissionToTurso(
    userId: string,
    score: number,
    gameId: string,
    gameSessionData: any,
    isValid: boolean,
    validationNotes?: string
  ): Promise<void> {
    try {
      const gameSessionDataString = gameSessionData ? JSON.stringify(gameSessionData) : null;
      await this.turso.execute({
        sql: 'INSERT INTO score_submission_log (user_id, score, game_id, game_session_data, is_valid, validation_notes, submitted_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
        args: [userId, score, gameId, gameSessionDataString, isValid, validationNotes ?? null],
      });
      console.log(`Score submission logged to Turso for user ${userId}, game ${gameId}`);
    } catch (error) {
      console.error('Error logging score submission to Turso:', error);
      // Decide if this error should be propagated or just logged
      // For now, we'll log and not re-throw to avoid failing the whole submission if logging fails
    }
  }

  async submitScore(
    userId: string,
    score: number,
    gameId: string,
    gameSessionData: any
  ): Promise<void> {
    if (score < 0) {
      // Log invalid submission attempt before throwing
      await this.logScoreSubmissionToTurso(userId, score, gameId, gameSessionData, false, 'Score cannot be negative.');
      throw new Error('Score cannot be negative.');
    }

    const isValid = await this.validateScore(userId, score, gameId, gameSessionData);
    if (!isValid) {
      // Log invalid submission attempt
      await this.logScoreSubmissionToTurso(userId, score, gameId, gameSessionData, false, 'Failed validation checks.');
      throw new Error('Invalid score submission after validation.');
    }

    const { daily: dailyPeriod, weekly: weeklyPeriod } = this.getCurrentPeriodIdentifiers();
    const dailyKey = REDIS_KEYS.dailyLeaderboard(dailyPeriod);
    const weeklyKey = REDIS_KEYS.weeklyLeaderboard(weeklyPeriod);

    try {
      // Use ZADD with NX (only add if new) or XX (only update if exists) if needed,
      // or simply ZADD to update score if a higher one is submitted.
      // The current behavior of ZADD is to update the score if the member already exists.
      // If you only want to accept a score if it's higher, you'd need a LUA script or a get-and-set.
      // For simplicity, we'll just update.
      await this.redis.zadd(dailyKey, { score, member: userId });
      await this.redis.zadd(weeklyKey, { score, member: userId });

      // Set expiry for the leaderboards to auto-clean up old data if not archived
      // Daily: ~2 days, Weekly: ~8-9 days to ensure overlap for settlement
      const dailyExpiry = 2 * 24 * 60 * 60; // 2 days in seconds
      const weeklyExpiry = 9 * 24 * 60 * 60; // 9 days in seconds
      await this.redis.expire(dailyKey, dailyExpiry);
      await this.redis.expire(weeklyKey, weeklyExpiry);

      console.log(`Score ${score} for user ${userId} submitted to daily (${dailyKey}) and weekly (${weeklyKey}) leaderboards.`);

      // Log the successful submission to Turso
      await this.logScoreSubmissionToTurso(userId, score, gameId, gameSessionData, true);
    } catch (error) {
      console.error('Error submitting score to Redis:', error);
      throw new Error('Failed to submit score.');
    }
  }

  /**
   * Retrieves the active leaderboard (top N or all users).
   * @param boardType - 'daily' or 'weekly'.
   * @param topN - Number of top players to retrieve. If undefined, retrieves a larger set (e.g., top 100).
   */
  async getActiveLeaderboard(
    boardType: 'daily' | 'weekly',
    topN: number = 100 // Default to top 100
  ): Promise<LeaderboardEntry[]> {
    const { daily: dailyPeriod, weekly: weeklyPeriod } = this.getCurrentPeriodIdentifiers();
    const key = boardType === 'daily' 
      ? REDIS_KEYS.dailyLeaderboard(dailyPeriod) 
      : REDIS_KEYS.weeklyLeaderboard(weeklyPeriod);

    try {
      // ZRANGE returns members from lowest score to highest.
      // Scores are included.
      const rawLeaderboard = await this.redis.zrange(key, 0, topN - 1, { rev: true, withScores: true }) as string[];
      
      const leaderboard: LeaderboardEntry[] = [];
      for (let i = 0; i < rawLeaderboard.length; i += 2) {
        leaderboard.push({
          userId: rawLeaderboard[i] as string,
          score: parseFloat(rawLeaderboard[i + 1]),
          rank: leaderboard.length + 1,
        });
      }
      return leaderboard;
    } catch (error) {
      console.error(`Error fetching ${boardType} leaderboard from Redis:`, error);
      throw new Error(`Failed to fetch ${boardType} leaderboard.`);
    }
  }

  /**
   * Archives a completed leaderboard from Redis to Turso and clears it from Redis.
   * This is typically called by the PrizeDistributionService after prizes are settled.
   * @param boardType - 'daily' or 'weekly'.
   * @param periodIdentifier - The specific period to archive (e.g., '2023-10-26' or '2023-W43').
   * @param entriesWithPrizes - Leaderboard entries including their calculated prize amounts.
   */
  async archiveLeaderboard(
    boardType: 'daily' | 'weekly',
    periodIdentifier: string,
    entriesWithPrizes: Array<Omit<ArchivedLeaderboardEntry, 'archivedAt' | 'periodIdentifier' | 'boardType'>>
  ): Promise<void> {
    const leaderboardKey = boardType === 'daily'
      ? REDIS_KEYS.dailyLeaderboard(periodIdentifier)
      : REDIS_KEYS.weeklyLeaderboard(periodIdentifier);

    if (!entriesWithPrizes || entriesWithPrizes.length === 0) {
      console.log(`No entries to archive for ${boardType} leaderboard for period ${periodIdentifier}.`);
      // Optionally, still clear the Redis key if it's guaranteed to be empty or old
      // await this.redis.del(leaderboardKey);
      return;
    }

    const now = new Date().toISOString();
    const statements = entriesWithPrizes.map(entry => ({
      sql: 'INSERT INTO leaderboard_archives (period_identifier, board_type, user_id, rank, score, prize_amount, archived_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [periodIdentifier, boardType, entry.userId, entry.rank, entry.score, entry.prizeAmount, now],
    }));

    try {
      // Batch insert into Turso
      await this.turso.batch(statements, 'write');
      console.log(`Successfully archived ${entriesWithPrizes.length} entries for ${boardType} leaderboard period ${periodIdentifier} to Turso.`);

      // Clear the archived leaderboard from Redis
      // It's important this happens *after* successful archival.
      // Consider a flag or moving to a "processed" key if atomicity is critical and batch fails mid-way.
      await this.redis.del(leaderboardKey);
      console.log(`Cleared ${boardType} leaderboard key ${leaderboardKey} from Redis.`);

    } catch (error) {
      console.error(`Error archiving ${boardType} leaderboard for period ${periodIdentifier}:`, error);
      // Note: If Turso write fails, Redis data is NOT deleted. Manual intervention or retry logic might be needed.
      // For critical systems, a more robust two-phase commit or transactional outbox pattern might be used.
      throw new Error('Failed to archive leaderboard.');
    }
  }
}
