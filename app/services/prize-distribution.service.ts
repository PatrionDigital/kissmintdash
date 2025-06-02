// PrizeDistributionService: Orchestrates the prize settlement process.
// Coordinates with LeaderboardService, PrizePoolManager, and WalletService.
// Triggered by Vercel Cron Jobs.

import { LeaderboardService, LeaderboardEntry } from './leaderboard.service';
import { PrizePoolManager } from './prize-pool.service';
import { WalletService } from './wallet.service';
import { FarcasterProfileService } from './farcaster-profile.service';

import { Client as TursoClient, createClient as createTursoClient, Value } from '@libsql/client';
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
      if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
        throw new Error('Turso database URL or auth token is not defined in environment variables.');
      }
      this.turso = createTursoClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
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

  private async _settlePrizes(poolType: 'daily' | 'weekly', periodIdentifier: string): Promise<void> {
    let distributionSummaryId: string | undefined;
    // periodIdentifier is now passed as an argument, no need to recalculate here

    try {
      console.log(`[PrizeDistributionService] Starting ${poolType} settlement for ${periodIdentifier}.`);

      // Steps reordered: Claim pool first to log it correctly from the start.

      // 1. Claim prize pool from PrizePoolManager
      const totalClaimedPool = await this.prizePoolManager.claimPrizePool(poolType);
      console.log(`[PrizeDistributionService] Claimed ${totalClaimedPool} $GLICO from ${poolType} pool.`);

      // 2. Log initial attempt to Turso, now including totalClaimedPool
      distributionSummaryId = await this.logInitialDistributionAttempt(poolType, periodIdentifier, totalClaimedPool);
      console.log(`[PrizeDistributionService] Distribution summary record created: ${distributionSummaryId}`);

      // 3. Fetch winners from LeaderboardService
      const winners: LeaderboardEntry[] = await this.leaderboardService.getActiveLeaderboard(poolType, PRIZE_DISTRIBUTION_PERCENTAGES.length);
      console.log(`[PrizeDistributionService] Fetched ${winners.length} potential winners for ${poolType} period ${periodIdentifier}.`);

      if (winners.length === 0) {
        console.log(`[PrizeDistributionService] No winners found for ${poolType} period ${periodIdentifier}. Skipping distribution.`);
        // totalClaimedPool is already known and logged in initial attempt if distributionSummaryId exists
        if (distributionSummaryId) await this.logSkippedDistribution(distributionSummaryId, 'No winners found'); 
        return;
      }
      
      // Check totalClaimedPool after initial log and winner check
      if (totalClaimedPool <= 0) {
        console.log(`[PrizeDistributionService] Prize pool for ${poolType} is 0. Skipping distribution.`);
        if (distributionSummaryId) await this.logSkippedDistribution(distributionSummaryId, 'Prize pool was zero or negative', totalClaimedPool);
        return;
      }

      // 4. Resolve FIDs to wallet addresses and calculate individual prize amounts
      // PrizePayout now expects prizeAmount as string (smallest unit)
      const prizePayouts: { userId: string; userAddress: string; rank: number; score: number; prizeAmount: string }[] = [];
      let totalDistributedAmountBigInt = BigInt(0); // Use BigInt for summing distributed amounts

      for (let i = 0; i < winners.length; i++) {
        const winner = winners[i]; // winner.userId is an FID
        const rankIndex = (winner.rank ?? winners.length + 1) - 1; // Use rank, default to out of bounds if no rank

        if (rankIndex < PRIZE_DISTRIBUTION_PERCENTAGES.length) {
          const prizePercentage = PRIZE_DISTRIBUTION_PERCENTAGES[rankIndex];
          // Calculate display prize amount first
          const prizeAmountDisplay = Math.floor(totalClaimedPool * prizePercentage);

          if (prizeAmountDisplay > 0) {
            // Convert to smallest unit (18 decimals)
            const prizeAmountSmallestUnit = BigInt(prizeAmountDisplay) * BigInt('1000000000000000000'); // 10^18
            // Resolve FID to wallet address
            const userWalletAddress = await this.farcasterProfileService.getWalletAddressForFid(winner.userId);

            if (userWalletAddress) {
              prizePayouts.push({
                userId: winner.userId, // FID
                userAddress: userWalletAddress, // Resolved wallet address
                rank: winner.rank ?? 0, 
                score: winner.score,
                prizeAmount: prizeAmountSmallestUnit.toString(),
              });
              totalDistributedAmountBigInt += prizeAmountSmallestUnit;
            } else {
              console.warn(`[PrizeDistributionService] Could not resolve wallet address for FID ${winner.userId}. Skipping prize for this user.`);
              // TODO: Log this skipped payout more formally, perhaps in prize_distribution_log with a special status or in a separate table.
              // The prize money for this user (prizeAmount) is effectively not allocated from totalClaimedPool for distribution.
            }
          }
        }
      }
      // Note: totalDistributedAmountBigInt now only includes successfully resolved payouts.
      const totalDistributedAmount = Number(totalDistributedAmountBigInt / BigInt('1000000000000000000')); // Convert back for logging if needed, or keep as BigInt string

      // Safety check: Ensure totalDistributedAmount (display value) does not exceed totalClaimedPool
      if (totalDistributedAmount > totalClaimedPool) {
        console.warn(`[PrizeDistributionService] Total distributed amount display (${totalDistributedAmount}) from BigInt sum (${totalDistributedAmountBigInt.toString()}) exceeds total claimed pool (${totalClaimedPool}). This indicates a logic error. Capping or re-evaluation needed.`);
      }

      if (prizePayouts.length === 0) {
        console.log(`[PrizeDistributionService] No valid payouts calculated. Skipping.`);
        if (distributionSummaryId) await this.logSkippedDistribution(distributionSummaryId, 'No payouts calculated (e.g., pool too small or no qualifying winners)', totalClaimedPool);
        return;
      }

      // 5. Execute payouts via WalletService
      let txHash: string | undefined;
      let payoutError: string | undefined;
      // totalDistributedAmountBigInt was calculated in the loop above, summing actual payouts

      try {
        // prizePayouts now contains prizeAmount as string in smallest unit
        txHash = await this.walletService.distributePrizes(prizePayouts); 
        if (txHash) {
          console.log(`[PrizeDistributionService] WalletService.distributePrizes successful. Tx Hash: ${txHash}. Total distributed (smallest unit): ${totalDistributedAmountBigInt.toString()}`);
        } else {
          // This case implies distributePrizes can return undefined/null on failure without throwing
          payoutError = 'WalletService.distributePrizes returned no txHash.';
          console.error(`[PrizeDistributionService] ${payoutError}`);
        }
      } catch (error) {
        console.error('[PrizeDistributionService] Error calling WalletService.distributePrizes:', error);
        payoutError = error instanceof Error ? error.message : 'Unknown error from WalletService';
        // txHash remains undefined
      }

      // 6. Log detailed results to Turso (prize_distribution_log and update distribution_summary_log)
      if (distributionSummaryId) {
        if (txHash) { // If txHash is defined, it was successful
          // For logging, pass totalDistributedAmountBigInt.toString() or the display value as appropriate
          await this.logSuccessfulDistribution(distributionSummaryId, txHash, totalDistributedAmountBigInt.toString(), totalClaimedPool, prizePayouts);
        } else {
          await this.logFailedDistribution(distributionSummaryId, payoutError || 'WalletService payout failed', totalClaimedPool);
        }
      } else {
        console.error('[PrizeDistributionService] CRITICAL: distributionSummaryId is undefined. Cannot log final status.');
      }
      console.log(`[PrizeDistributionService] Distribution process for ${poolType} - ${periodIdentifier} completed.`);

    } catch (error) {
      console.error(`[PrizeDistributionService] Error during ${poolType} settlement for ${periodIdentifier}:`, error);
      if (distributionSummaryId) {
        await this.logFailedDistribution(distributionSummaryId, error instanceof Error ? error.message : 'Unknown error during settlement');
      } else {
        console.error(`[PrizeDistributionService] CRITICAL: distributionSummaryId is undefined. Cannot log error for ${poolType} - ${periodIdentifier}. Error: ${error}`);
      }
    }
  }

  // --- Helper methods for date/period identifiers ---

  private getDailyPeriodIdentifier(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getWeeklyPeriodIdentifier(date: Date): string {
    // Basic week number calculation. For ISO 8601 week dates, a library like date-fns is recommended.
    // This is a simplified version and might not align perfectly with ISO weeks across year boundaries.
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    const weekNumber = Math.ceil(dayOfYear / 7);
    return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
    // Example using date-fns (if installed):
    // import { getISOWeek, getISOWeekYear } from 'date-fns';
    // return `${getISOWeekYear(date)}-W${getISOWeek(date).toString().padStart(2, '0')}`;
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
    let sql = `UPDATE ${DISTRIBUTION_SUMMARY_LOG_TABLE} SET status = ?, completed_at = ?`;
    const args: Value[] = [status, now];

    if (details.txHash !== undefined) { sql += ', transaction_hash = ?'; args.push(details.txHash); }
    if (details.totalDistributed !== undefined) { sql += ', total_distributed_amount = ?'; args.push(details.totalDistributed); }
    if (details.numWinners !== undefined) { sql += ', number_of_winners = ?'; args.push(details.numWinners); }
    if (details.errorMessage !== undefined) { sql += ', error_message = ?'; args.push(details.errorMessage); }
    if (details.totalPoolClaimed !== undefined) { sql += ', total_prize_pool_claimed = ?'; args.push(details.totalPoolClaimed); }

    sql += ' WHERE id = ?';
    args.push(summaryId);

    try {
      await this.turso.execute({ sql, args });
      console.log(`[PrizeDistributionService] Updated distribution summary ${summaryId} to status ${status}`);
    } catch (dbError) {
      console.error(`[PrizeDistributionService] Turso error updating status for summary ${summaryId}:`, dbError);
      // Log and continue if possible, or re-throw if critical
    }
  }

  private async logIndividualPayouts(
    summaryId: string,
    payouts: { userId: string; userAddress: string; rank: number; score: number; prizeAmount: string }[]
  ): Promise<void> {
    if (payouts.length === 0) return;
    const now = new Date().toISOString();
    const statements = payouts.map(payout => ({
      sql: `INSERT INTO ${PRIZE_DISTRIBUTION_LOG_TABLE} 
              (summary_id, user_id, wallet_address, rank, score, prize_amount, distributed_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)`, 
      args: [summaryId, payout.userId, payout.userAddress, payout.rank, payout.score, payout.prizeAmount, now],
    }));

    try {
      await this.turso.batch(statements, 'write'); // Removed BatchResult type annotation
      console.log(`[PrizeDistributionService] Logged ${statements.length} individual payouts for summary ${summaryId}.`);
    } catch (dbError) {
      console.error(`[PrizeDistributionService] Turso error logging individual payouts for summary ${summaryId}:`, dbError);
      // This is a critical error as it might lead to inconsistent state or double payouts if retried without care.
      // Consider how to handle this: mark summary as partially failed? Retry individual inserts?
    }
  }

  // --- Methods to be called from _settlePrizes ---
  // (These are wrappers around updateDistributionStatus and logIndividualPayouts)

  private async logSkippedDistribution(summaryId: string, reason: string, totalPoolClaimed?: number): Promise<void> {
    await this.updateDistributionStatus(summaryId, 'SKIPPED', { errorMessage: reason, totalPoolClaimed });
  }

  private async logFailedDistribution(summaryId: string, errorDetails: string, totalPoolClaimed?: number): Promise<void> {
    await this.updateDistributionStatus(summaryId, 'FAILED', { errorMessage: errorDetails, totalPoolClaimed });
  }

  private async logSuccessfulDistribution(
    summaryId: string,
    txHash: string,
    distributedAmountSmallestUnit: string, // This is a string representing a BigInt
    claimedPool: number,
    payouts: { userId: string; userAddress: string; rank: number; score: number; prizeAmount: string }[]
  ): Promise<void> {
    // Convert smallest unit string to BigInt, then divide, then convert to Number for logging display amount
    const displayTotalDistributed = Number(BigInt(distributedAmountSmallestUnit) / BigInt('1000000000000000000'));
    await this.updateDistributionStatus(summaryId, 'SUCCESS', {
      txHash,
      totalDistributed: displayTotalDistributed, // Log the display amount
      numWinners: payouts.length,
      totalPoolClaimed: claimedPool
      // Note: The actual amount logged in `distribution_summary_log.total_distributed_amount` via `updateDistributionStatus`
      // should ideally be the smallest unit (string or number) if precision is paramount for auditing.
      // Or, add another field for `total_distributed_amount_display`.
      // For now, logging display amount as per original intent.
    });
    await this.logIndividualPayouts(summaryId, payouts);
  }
}
