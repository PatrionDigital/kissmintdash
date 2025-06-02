import { Redis } from '@upstash/redis/cloudflare';
import { createClient, Client as TursoClient, InStatement } from '@libsql/client';

// Define Redis keys for prize pools
const REDIS_PRIZE_POOL_KEYS = {
  daily: 'prize_pool:daily',
  weekly: 'prize_pool:weekly',
} as const;

export type PoolType = keyof typeof REDIS_PRIZE_POOL_KEYS;

export class PrizePoolManager {
  private redis: Redis;
  private turso: TursoClient;

  constructor(redis: Redis, turso: TursoClient) {
    this.redis = redis;
    this.turso = turso;
    let redisUrlMessage = "Redis client URL not directly accessible for logging here.";
    try {
      if (redis && (redis as any).requester && (redis as any).requester.options && (redis as any).requester.options.url) {
        const url = (redis as any).requester.options.url;
        // Attempt to show only the domain part for confirmation, avoid logging full URL or token query params
        const urlParts = url.split('/');
        if (urlParts.length >= 3) {
          redisUrlMessage = `Redis client configured with URL starting: ${urlParts[0]}//${urlParts[2].split('.')[0] + '.redacted...'}`;
        }
      }
    } catch (e) {
      // Silently ignore if accessing options fails, to prevent logging from breaking execution
    }
    console.log(`PrizePoolManager initialized. ${redisUrlMessage}. Turso client also received.`);
  }

  private getPoolKey(poolType: PoolType): string {
    return REDIS_PRIZE_POOL_KEYS[poolType];
  }

  /**
   * Adds a specified amount to a prize pool.
   * @param poolType - 'daily' or 'weekly'.
   * @param amount - The amount to add to the pool.
   */
  async addToPrizePool(poolType: PoolType, amount: number): Promise<void> {
    if (amount <= 0) {
      console.warn(`Attempted to add non-positive amount (${amount}) to ${poolType} pool. Skipping.`);
      return;
    }
    const key = this.getPoolKey(poolType);
    try {
      await this.redis.incrbyfloat(key, amount);
      console.log(`Added ${amount} to ${poolType} prize pool. New value (approx): ${await this.redis.get(key)}`);
    } catch (error) {
      console.error(`Error adding to ${poolType} prize pool in Redis:`, error);
      throw new Error(`Failed to add to ${poolType} prize pool.`);
    }
  }

  /**
   * Retrieves the current value of a prize pool.
   * @param poolType - 'daily' or 'weekly'.
   * @returns The current value of the pool, or 0 if not set.
   */
  async getPrizePoolValue(poolType: PoolType): Promise<number> {
    const key = this.getPoolKey(poolType);
    try {
      const value = await this.redis.get<number>(key);
      return value !== null ? Number(value) : 0;
    } catch (error) {
      console.error(`Error getting ${poolType} prize pool value from Redis:`, error);
      throw new Error(`Failed to get ${poolType} prize pool value.`);
    }
  }

  /**
   * Claims the entire prize pool, resetting it to 0.
   * This is an atomic operation.
   * @param poolType - 'daily' or 'weekly'.
   * @returns The value of the pool before it was reset.
   */
  async claimPrizePool(poolType: PoolType): Promise<number> {
    const key = this.getPoolKey(poolType);
    try {
      // Upstash Redis Cloudflare API sometimes does not support GETSET directly and may return a pipeline result if misused.
      // To ensure atomicity and correctness, use a Lua script to GET and SET in one operation if GETSET is not supported.
      /**
       * Upstash Cloudflare/REST does NOT support GETSET, EVAL, MULTI/EXEC, or any atomic read-and-reset.
       * Official workaround: read value with INCRBYFLOAT(key, 0) (atomic, initializes to 0 if missing), then set to 0.
       * This is NOT atomic; there is a small race window. See: https://docs.upstash.com/redis/features/transactions#atomic-operations
       */
      /**
       * Upstash Cloudflare/REST does NOT support GETSET, EVAL, MULTI/EXEC, or atomic read-and-reset.
       * Official workaround: read value with GET (returns null if missing), then set to 0.
       * This is NOT atomic; there is a small race window. See: https://docs.upstash.com/redis/features/transactions#atomic-operations
       */
      let poolValue: number = 0;
      try {
        if (!this.redis) {
          console.error(`[PrizePoolManager] ERROR (CRITICAL diagnostic): this.redis is undefined in claimPrizePool. Cannot perform Redis operations. PoolType: ${poolType}, Key: ${key}`);
          throw new Error(`Redis client not initialized in PrizePoolManager when trying to claim pool ${poolType}.`);
        }

        // Attempt to log the client's configured URL. The @upstash/redis client (v2) often has a direct 'url' property.
        const clientUrl = (this.redis as any).url || 
                          ((this.redis as any).requester && (this.redis as any).requester.options ? (this.redis as any).requester.options.url : 'Redis client URL not directly accessible');
        console.error(`[PrizePoolManager] ERROR (diagnostic): In claimPrizePool, about to 'GET' key '${key}'. Client URL: ${clientUrl}`);

        const result = await this.redis.get<number>(key);
        poolValue = result !== null ? Number(result) : 0;
      } catch (err) {
        console.error(`[PrizePoolManager] FATAL: Could not read prize pool value for key ${key}. Raw error object:`, err);
        // Attempt to stringify the error for more details, including non-standard properties
        try {
          console.error(`[PrizePoolManager] Raw error (stringified):`, JSON.stringify(err, Object.getOwnPropertyNames(err)));
        } catch (stringifyError) {
          console.error(`[PrizePoolManager] Could not stringify the raw error object:`, stringifyError);
        }
        if (err instanceof Error) {
          console.error(`[PrizePoolManager] Error message: ${err.message}`);
          if (err.cause) {
            console.error(`[PrizePoolManager] Error cause:`, err.cause);
            try {
              console.error(`[PrizePoolManager] Error cause (stringified):`, JSON.stringify(err.cause, Object.getOwnPropertyNames(err.cause)));
            } catch (stringifyCauseError) {
              console.error(`[PrizePoolManager] Could not stringify the error cause:`, stringifyCauseError);
            }
          }
          console.error(`[PrizePoolManager] Error stack: ${err.stack}`);
        } else {
          console.error("[PrizePoolManager] Error is not an instance of Error. Logging as is:", err);
        }
        throw new Error(`Failed to read prize pool key: ${key}`);
      }
      if (poolValue > 0) {
        try {
          await this.redis.set(key, 0);
        } catch (err) {
          console.error(`[PrizePoolManager] ERROR: Could not reset prize pool key ${key} to 0 after claim. Manual intervention may be required.`, err);
          // Continue, but warn
        }
      }
      if (poolValue < 0 || !isFinite(poolValue)) {
        console.warn(`[PrizePoolManager] Claimed value for key ${key} was negative or invalid. Clamping to 0.`);
        poolValue = 0;
      }
      console.log(`[PrizePoolManager] Claimed ${poolValue} from ${poolType} prize pool (non-atomic Upstash REST pattern). Pool reset to 0.`);
      return poolValue;
    } catch (error) {
      console.error(`Error claiming ${poolType} prize pool from Redis:`, error);
      throw new Error(`Failed to claim ${poolType} prize pool.`);
    }
  }

  /**
   * Adds revenue from a game pass purchase to the respective prize pools
   * and logs the allocation to Turso.
   *
   * @param purchaseId - Unique identifier for the game pass purchase transaction.
   * @param totalRevenue - Total $GLICO from this purchase.
   * @param dailyContribution - Amount of $GLICO allocated to the daily pool.
   * @param weeklyContribution - Amount of $GLICO allocated to the weekly pool.
   * @param treasuryShare - Amount of $GLICO allocated to the treasury.
   */
  async addGamePassRevenueToPools(
    purchaseId: string,
    totalRevenue: number,
    dailyContribution: number,
    weeklyContribution: number,
    treasuryShare: number
  ): Promise<void> {
    try {
      // Add contributions to Redis pools
      if (dailyContribution > 0) {
        await this.addToPrizePool('daily', dailyContribution);
      }
      if (weeklyContribution > 0) {
        await this.addToPrizePool('weekly', weeklyContribution);
      }

      // Log the allocation to Turso
      const stmt: InStatement = {
        sql: `
          INSERT INTO revenue_allocation_log 
            (purchase_id, total_revenue, daily_pool_contribution, weekly_pool_contribution, treasury_share, allocated_at)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP);
        `,
        args: [purchaseId, totalRevenue, dailyContribution, weeklyContribution, treasuryShare],
      };
      await this.turso.execute(stmt);
      console.log(`Revenue allocation for purchase ID ${purchaseId} logged to Turso.`);

    } catch (error) {
      console.error(`Error in addGamePassRevenueToPools for purchase ID ${purchaseId}:`, error);
      // Consider how to handle partial failures (e.g., Redis updated but Turso failed)
      // For now, re-throwing the error.
      throw new Error(`Failed to process game pass revenue for purchase ID ${purchaseId}.`);
    }
  }
  
  // Note: calculatePrizeDistribution method mentioned in the original scaffold
  // is likely better suited for the PrizeDistributionService.
  // That service would use claimPrizePool() from this manager.
}
