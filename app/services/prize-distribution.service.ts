// PrizeDistributionService: Orchestrates the prize settlement process.
// Coordinates with LeaderboardService, PrizePoolManager, and WalletService.
// Triggered by Vercel Cron Jobs.

import { LeaderboardService, LeaderboardEntry } from './leaderboard.service';
import { PrizePayout } from '@/app/types/wallet.types';
import { PrizePoolManager } from './prize-pool.service';
import { WalletService } from './wallet.service';
import { TransferResult } from '@/app/types/wallet.types';
import { FarcasterProfileService } from './farcaster-profile.service';
import { formatUnits } from 'viem';

import { createClient as createTursoClient, Client as TursoClient, InValue } from '@libsql/client';
import { getISOWeek, getISOWeekYear } from 'date-fns';
import { randomUUID } from 'crypto';

const PRIZE_DISTRIBUTION_PERCENTAGES = [
  0.40, // 1st Place
  0.24, // 2nd Place
  0.16, // 3rd Place
  0.12, // 4th Place
  0.08, // 5th Place
];

const DISTRIBUTION_SUMMARY_LOG_TABLE = 'distribution_summary_log';
const PRIZE_DISTRIBUTION_LOG_TABLE = 'prize_distribution_log';

export class PrizeDistributionService {
  private leaderboardService: LeaderboardService;
  private prizePoolManager: PrizePoolManager;
  private walletService: WalletService;
  private turso: TursoClient;
  private farcasterProfileService: FarcasterProfileService; // Placeholder

  constructor(
    leaderboardService: LeaderboardService,
    prizePoolManager: PrizePoolManager,
    walletService: WalletService,
    farcasterProfileService: FarcasterProfileService,
    tursoClient?: TursoClient // <-- optional for test injection
  ) {
    this.leaderboardService = leaderboardService;
    this.prizePoolManager = prizePoolManager;
    this.walletService = walletService;
    this.farcasterProfileService = farcasterProfileService;
    if (tursoClient) {
      this.turso = tursoClient;
    } else {
      if (!process.env.NEXT_PUBLIC_TURSO_URL || !process.env.NEXT_PUBLIC_TURSO_API_SECRET) {
        throw new Error('Turso URL or API secret is not defined in environment variables.');
      }
      this.turso = createTursoClient({
        url: process.env.NEXT_PUBLIC_TURSO_URL,
        authToken: process.env.NEXT_PUBLIC_TURSO_API_SECRET,
      });
      console.log('PrizeDistributionService initialized with Turso client.');
    }
  }

  // --- Public methods to be called by Cron Jobs ---

  public async settleDailyPrizes(): Promise<void> {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1); // Use UTC dates for consistency
    const periodIdentifier = this.getDailyPeriodIdentifier(yesterday);
    console.log(`[PrizeDistributionService] Initiating daily prize settlement for period: ${periodIdentifier}`);
    await this._settlePrizes('daily', periodIdentifier);
  }

  public async settleWeeklyPrizes(): Promise<void> {
    const dateInLastWeek = new Date();
    dateInLastWeek.setUTCDate(dateInLastWeek.getUTCDate() - 7); // Get a date from the previous week
    // getWeeklyPeriodIdentifier should correctly identify the full week based on this date
    const periodIdentifier = this.getWeeklyPeriodIdentifier(dateInLastWeek);
    console.log(`[PrizeDistributionService] Initiating weekly prize settlement for period: ${periodIdentifier}`);
    await this._settlePrizes('weekly', periodIdentifier);
  }

  /**
   * Public method for testing and automation: settle prizes for any period and type.
   */
  public async settlePrizesForPeriod(poolType: 'daily' | 'weekly', periodIdentifier: string): Promise<void> {
    return this._settlePrizes(poolType, periodIdentifier);
  }

  // --- Private core settlement logic ---

  private async _logAllIndividualPayoutAttempts(
    summaryId: string,
    originalTxs: Array<{ userId: string; userAddress: string; rank: number; score: number; prizeAmountGlicoSmallestUnit: string }>,
    results: TransferResult[]
  ): Promise<void> {
    const statements = [];
    for (const result of results) {
      const originalTx = originalTxs.find(tx => tx.userAddress === result.userAddress);
      if (!originalTx) {
        console.warn(`[PrizeDistributionService] Could not find original transaction details for payout result:`, result);
        continue;
      }

      let prizeAmountForLog: number | null = null;
      try {
        // Convert smallest unit string to a decimal string, then to number for REAL column
        prizeAmountForLog = Number(formatUnits(BigInt(originalTx.prizeAmountGlicoSmallestUnit), 18));
      } catch (conversionError) {
        console.error(`[PrizeDistributionService] Error converting prize amount for logging: ${originalTx.prizeAmountGlicoSmallestUnit}`, conversionError);
        // Decide how to handle, e.g., log as 0 or null, or skip this log entry
      }

      statements.push({
        sql: `INSERT INTO ${PRIZE_DISTRIBUTION_LOG_TABLE} 
                (summary_id, user_id, wallet_address, rank, score, prize_amount, tx_hash, status, error_message, distributed_at, logged_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        args: [
          summaryId,
          originalTx.userId,
          originalTx.userAddress,
          originalTx.rank,
          originalTx.score,
          prizeAmountForLog, // Human-readable for REAL column
          result.transactionHash || null,
          result.status, // 'success' or 'failed'
          result.error || null,
          result.status === 'confirmed' ? new Date().toISOString() : null, // distributed_at
        ],
      });
    }

    if (statements.length > 0) {
      try {
        await this.turso.batch(statements, 'write');
        console.log(`[PrizeDistributionService] Logged ${statements.length} individual payout attempts for summary ${summaryId}.`);
      } catch (dbError) {
        console.error(`[PrizeDistributionService] Turso error logging individual payout attempts for summary ${summaryId}:`, dbError);
      }
    }
  }

  private async _settlePrizes(poolType: 'daily' | 'weekly', periodIdentifier: string): Promise<void> {
    const distributionSummaryId = await this.logInitialDistributionAttempt(poolType, periodIdentifier);
    console.log(`[PrizeDistributionService] Distribution summary record created: ${distributionSummaryId}`);

    console.log(`[PrizeDistributionService] Starting ${poolType} settlement for ${periodIdentifier}.`);

    try {
      // 1. Claim prize pool from PrizePoolManager
      const totalClaimedPool = await this.prizePoolManager.claimPrizePool(poolType);
      console.log(`[PrizeDistributionService] Claimed ${totalClaimedPool} $GLICO from ${poolType} pool.`);

      // 2. Fetch top 5 winners from LeaderboardService
      const winners = await this.leaderboardService.getActiveLeaderboard(poolType, 5);
      console.log(`[PrizeDistributionService] Fetched ${winners.length} winners for ${poolType} period ${periodIdentifier}.`);

      if (winners.length === 0) {
        console.log(`[PrizeDistributionService] No winners found for ${poolType} period ${periodIdentifier}.`);
        await this.logSkippedDistribution(distributionSummaryId, 'No winners found', totalClaimedPool);
        return;
      }

      if (totalClaimedPool <= 0) {
        console.log(`[PrizeDistributionService] Prize pool for ${poolType} is empty.`);
        await this.logSkippedDistribution(distributionSummaryId, 'Prize pool was zero or negative', totalClaimedPool);
        return;
      }

      // 3. Calculate prize amounts for each winner
      const basePrize = poolType === 'daily' ? 50 : 500; // Base prize amount
      const totalPrizePool = basePrize + totalClaimedPool;
      console.log(`[PrizeDistributionService] Total prize pool: ${totalPrizePool} $GLICO (Base: ${basePrize} + Bonus: ${totalClaimedPool})`);

      const prizePayouts: PrizePayout[] = [];
      const originalTxsForLog = [];

      // 4. Calculate prize amounts and prepare payouts
      for (let i = 0; i < Math.min(winners.length, 5); i++) {
        const winner = winners[i];
        const rank = i + 1;
        const percentage = PRIZE_DISTRIBUTION_PERCENTAGES[i];
        const prizeAmount = Math.floor(totalPrizePool * percentage);
        
        // Resolve Farcaster ID to wallet address
        const walletAddress = await this.farcasterProfileService.getWalletAddressForFid(winner.userId);
        
        if (!walletAddress) {
          console.warn(`[PrizeDistributionService] Could not resolve wallet address for FID ${winner.userId}.`);
          continue;
        }

        // Convert to smallest unit (18 decimals)
        const prizeAmountSmallestUnit = BigInt(prizeAmount) * BigInt('1000000000000000000');
        
        prizePayouts.push({
          userAddress: walletAddress,
          prizeAmount: prizeAmountSmallestUnit.toString(),
          userId: winner.userId
        });

        originalTxsForLog.push({
          userId: winner.userId,
          userAddress: walletAddress,
          rank: rank,
          score: winner.score,
          prizeAmountGlicoSmallestUnit: prizeAmountSmallestUnit.toString()
        });

        console.log(`[PrizeDistributionService] Prepared prize for rank ${rank}: ${prizeAmount} $GLICO to ${walletAddress}`);
      }

      if (prizePayouts.length === 0) {
        console.log(`[PrizeDistributionService] No valid payouts to process.`);
        await this.logSkippedDistribution(distributionSummaryId, 'No valid payouts after wallet resolution', totalClaimedPool);
        return;
      }

      // 5. Execute payouts via WalletService
      console.log(`[PrizeDistributionService] Starting distribution of ${prizePayouts.length} prizes...`);
      const payoutResults = await this.walletService.distributePrizes(prizePayouts, {
        waitForConfirmation: true,
        confirmations: 3
      });

      // 6. Log individual payout attempts
      await this._logAllIndividualPayoutAttempts(distributionSummaryId, originalTxsForLog, payoutResults);

      // 7. Calculate total distributed amount
      const successfulPayouts = payoutResults.filter(r => r.status === 'confirmed');
      const totalDistributed = successfulPayouts.reduce((sum, p) => {
        return sum + (p.prizeAmount ? BigInt(p.prizeAmount) : 0n);
      }, 0n);

      // 8. Update distribution summary
      if (successfulPayouts.length > 0) {
        await this.logOverallSuccess(
          distributionSummaryId,
          totalDistributed.toString(),
          totalClaimedPool,
          successfulPayouts.length
        );
        console.log(`[PrizeDistributionService] Successfully distributed ${successfulPayouts.length} prizes`);
      } else {
        await this.logFailedDistribution(distributionSummaryId, 'No successful payouts', totalClaimedPool);
        throw new Error('No prizes were successfully distributed');
      }

    } catch (error) {
      console.error(`[PrizeDistributionService] Error during prize settlement:`, error);
      await this.logFailedDistribution(
        distributionSummaryId,
        error instanceof Error ? error.message : 'Unknown error during settlement',
        error instanceof Error && 'totalClaimedPool' in error ? (error as any).totalClaimedPool : 0
      );
      throw error;
    }
  }

  // --- Helper methods for date/period identifiers ---

  public getDailyPeriodIdentifier(date: Date): string {
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  public getWeeklyPeriodIdentifier(date: Date): string {
    const year = getISOWeekYear(date);
    const week = getISOWeek(date).toString().padStart(2, '0');
    return `${year}-W${week}`;
  }

  // --- Turso Logging Helper Methods ---

  private async logInitialDistributionAttempt(
    poolType: 'daily' | 'weekly',
    periodIdentifier: string,
    totalPoolClaimed: number = 0 // Can be updated later
  ): Promise<string> {
    const summaryId = randomUUID();
    const now = new Date().toISOString();
    try {
      await this.turso.execute({
        sql: `INSERT INTO ${DISTRIBUTION_SUMMARY_LOG_TABLE} 
                (id, period_identifier, board_type, status, total_prize_pool_claimed, started_at)
                VALUES (?, ?, ?, ?, ?, ?)`, 
        args: [summaryId, periodIdentifier, poolType, 'PENDING', totalPoolClaimed, now],
      });
      console.log(`[PrizeDistributionService] Logged initial distribution attempt: ${summaryId}`);
      return summaryId;
    } catch (dbError) {
      console.error(`[PrizeDistributionService] Turso error logging initial attempt for ${periodIdentifier}:`, dbError);
      throw dbError; // Re-throw to be caught by _settlePrizes
    }
  }

  private async updateDistributionStatus(
    summaryId: string,
    status: 'SUCCESS' | 'FAILED' | 'SKIPPED',
    details: { 
      txHash?: string; 
      totalDistributed?: number;
      numWinners?: number;
      errorMessage?: string; 
      totalPoolClaimed?: number;
    } = {}
  ): Promise<void> {
    const now = new Date().toISOString();
    const args: InValue[] = [status, now];
    
    // Build the SQL update statement dynamically based on provided fields
    const updates = [
      'status = ?',
      'completed_at = ?',
      details.txHash !== undefined && 'transaction_hash = ?',
      details.totalDistributed !== undefined && 'total_distributed = ?',
      details.numWinners !== undefined && 'num_winners = ?',
      details.errorMessage !== undefined && 'error_message = ?',
      details.totalPoolClaimed !== undefined && 'total_prize_pool_claimed = ?'
    ].filter(Boolean);
    
    // Add values in the same order as the placeholders
    if (details.txHash !== undefined) args.push(details.txHash);
    if (details.totalDistributed !== undefined) args.push(details.totalDistributed);
    if (details.numWinners !== undefined) args.push(details.numWinners);
    if (details.errorMessage !== undefined) args.push(details.errorMessage);
    if (details.totalPoolClaimed !== undefined) args.push(details.totalPoolClaimed);
    
    // Add the WHERE clause
    args.push(summaryId);
    
    const sql = `
      UPDATE ${DISTRIBUTION_SUMMARY_LOG_TABLE} 
      SET ${updates.join(', ')}
      WHERE id = ?
    `;

    try {
      await this.turso.execute({ sql, args });
      console.log(`[PrizeDistributionService] Updated distribution summary ${summaryId} to status ${status}`);
    } catch (dbError) {
      console.error(
        `[PrizeDistributionService] Turso error updating status for summary ${summaryId}:`,
        dbError
      );
      // Re-throw to allow callers to handle the error if needed
      throw new Error(`Failed to update distribution status: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
    }
  }

  // --- Methods to be called from _settlePrizes ---
  // (These are wrappers around updateDistributionStatus and logIndividualPayouts)

  private async logSkippedDistribution(summaryId: string, reason: string, totalPoolClaimed?: number): Promise<void> {
    await this.updateDistributionStatus(summaryId, 'SKIPPED', { errorMessage: reason, totalPoolClaimed });
  }

  private async logFailedDistribution(
    summaryId: string, 
    errorDetails: string, 
    totalPoolClaimed: number = 0
  ): Promise<void> {
    try {
      await this.updateDistributionStatus(summaryId, 'FAILED', { 
        errorMessage: errorDetails, 
        totalPoolClaimed,
        totalDistributed: 0,
        numWinners: 0
      });
      
      console.error(`[PrizeDistributionService] Distribution failed: ${errorDetails}`);
      
      // Log additional context for debugging
      if (totalPoolClaimed > 0) {
        console.error(`[PrizeDistributionService] Failed to distribute ${totalPoolClaimed} $GLICO from the prize pool.`);
      }
    } catch (logError) {
      console.error(`[PrizeDistributionService] Failed to log distribution failure:`, logError);
      // Don't rethrow to prevent masking the original error
    }
  }

  private async logOverallSuccess(
    summaryId: string,
    totalDistributedSmallestUnit: string,
    claimedPool: number,
    numSuccessfulPayouts: number
  ): Promise<void> {
    try {
      // Convert from smallest unit to human-readable format (18 decimals)
      const displayTotalDistributed = Number(formatUnits(BigInt(totalDistributedSmallestUnit), 18));
      
      await this.updateDistributionStatus(summaryId, 'SUCCESS', {
        totalDistributed: displayTotalDistributed,
        numWinners: numSuccessfulPayouts,
        totalPoolClaimed: claimedPool
      });
      
      console.log(`[PrizeDistributionService] Successfully logged distribution summary: ${summaryId}, Total Distributed: ${displayTotalDistributed} $GLICO, Winners: ${numSuccessfulPayouts}`);
    } catch (error) {
      console.error(`[PrizeDistributionService] Error logging overall success:`, error);
      // Don't throw here to prevent masking the original error
    }
  }
}
