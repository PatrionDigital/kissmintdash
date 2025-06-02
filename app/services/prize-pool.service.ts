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
    console.log('PrizePoolManager initialized with Redis and Turso clients.');
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
      // GETSET is atomic: gets the old value and sets a new one.
      const oldValue = await this.redis.getset<number>(key, 0);
      const claimedAmount = oldValue !== null ? Number(oldValue) : 0;
      console.log(`Claimed ${claimedAmount} from ${poolType} prize pool. Pool reset to 0.`);
      return claimedAmount;
    } catch (error) {
      console.error(`Error claiming ${poolType} prize pool from Redis:`, error);
      // If getset fails, the pool might not be reset. Consider implications.
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
