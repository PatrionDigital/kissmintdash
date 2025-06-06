// PrizeDistributionService: Orchestrates the prize settlement process.
// Coordinates with LeaderboardService, PrizePoolManager, and WalletService.
// Triggered by Vercel Cron Jobs.

import { LeaderboardService, LeaderboardEntry } from './leaderboard.service';
import { PrizePoolManager } from './prize-pool.service';
import { WalletService, PrizeDistributionResult, PrizePayout } from './wallet.service';
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
    results: PrizeDistributionResult[]
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
          result.status, // 'SUCCESS' or 'FAILED'
          result.error || null,
          result.status === 'SUCCESS' ? new Date().toISOString() : null, // distributed_at
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

    // Steps reordered: Claim pool first to log it correctly from the start.

    // 1. Claim prize pool from PrizePoolManager
    const totalClaimedPool = await this.prizePoolManager.claimPrizePool(poolType);
    console.log(`[PrizeDistributionService] Claimed ${totalClaimedPool} $GLICO from ${poolType} pool.`);

    // 2. Initial distribution attempt already logged with status 'PENDING' and totalClaimedPool.

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
    const walletServicePayouts: PrizePayout[] = prizePayouts.map(p => ({
      userAddress: p.userAddress,
      prizeAmount: p.prizeAmount, // This is already in smallest unit string
    }));

    let distributionResults: PrizeDistributionResult[] = [];
    try {
      distributionResults = await this.walletService.distributePrizes(walletServicePayouts);
    } catch (error) {
      console.error('[PrizeDistributionService] Critical error calling WalletService.distributePrizes:', error);
      // Log all as failed if the service call itself fails catastrophically
      const failedResults: PrizeDistributionResult[] = prizePayouts.map(p => ({
        userAddress: p.userAddress,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'WalletService call failed',
        transactionHash: undefined, // Changed from null to undefined
      }));
      await this._logAllIndividualPayoutAttempts(distributionSummaryId, prizePayouts.map(p => ({...p, prizeAmountGlicoSmallestUnit: p.prizeAmount})), failedResults);
      await this.logFailedDistribution(distributionSummaryId, `WalletService.distributePrizes call failed: ${error instanceof Error ? error.message : 'Unknown error'}`, totalClaimedPool);
      throw error; // Re-throw critical error
    }

    // 6. Log detailed results to Turso
    await this._logAllIndividualPayoutAttempts(distributionSummaryId, prizePayouts.map(p => ({...p, prizeAmountGlicoSmallestUnit: p.prizeAmount})), distributionResults);

    const successfulPayoutsResults = distributionResults.filter(r => r.status === 'SUCCESS');
    const totalDistributedSmallestUnitFromSuccess = successfulPayoutsResults.reduce((sum, result) => {
      const originalTx = prizePayouts.find(tx => tx.userAddress === result.userAddress);
      return sum + BigInt(originalTx?.prizeAmount || '0');
    }, BigInt(0));

    if (distributionResults.length > 0 && successfulPayoutsResults.length === distributionResults.length) {
      console.log(`[PrizeDistributionService] All ${distributionResults.length} prizes distributed successfully.`);
      await this.logOverallSuccess(
        distributionSummaryId,
        totalDistributedSmallestUnitFromSuccess.toString(),
        totalClaimedPool,
        successfulPayoutsResults.length
      );
    } else if (distributionResults.length > 0) { // Some or all failed
      const numFailed = distributionResults.length - successfulPayoutsResults.length;
      const errorMessage = `${numFailed} out of ${distributionResults.length} prize payouts failed. ${successfulPayoutsResults.length} succeeded. See individual logs.`;
      console.error(`[PrizeDistributionService] ${errorMessage}`);
      await this.updateDistributionStatus(distributionSummaryId, 'FAILED', {
          totalDistributed: Number(formatUnits(totalDistributedSmallestUnitFromSuccess, 18)),
          numWinners: successfulPayoutsResults.length,
          errorMessage: errorMessage,
          totalPoolClaimed: totalClaimedPool,
      });
    } else if (walletServicePayouts.length > 0 && distributionResults.length === 0) {
      console.warn('[PrizeDistributionService] WalletService returned no distribution results, though payouts were provided.');
      await this.logFailedDistribution(distributionSummaryId, 'WalletService returned no results for the provided payouts.', totalClaimedPool);
    } else {
      // This means walletServicePayouts was empty, so nothing was sent to WalletService.
      // This should be caught by earlier checks (e.g., no resolved winners).
      console.log('[PrizeDistributionService] No payouts were attempted as the list of transactions to process was empty.');
      await this.updateDistributionStatus(distributionSummaryId, 'SKIPPED', {
        errorMessage: 'No transactions were processed by WalletService because the input list was empty.',
        totalPoolClaimed: totalClaimedPool
      });
    }

    console.log(`[PrizeDistributionService] Distribution process for ${poolType} - ${periodIdentifier} completed.`);
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
    let sql = `UPDATE ${DISTRIBUTION_SUMMARY_LOG_TABLE} SET status = ?, completed_at = ?`;
    const args: InValue[] = [status, now];

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

  // --- Methods to be called from _settlePrizes ---
  // (These are wrappers around updateDistributionStatus and logIndividualPayouts)

  private async logSkippedDistribution(summaryId: string, reason: string, totalPoolClaimed?: number): Promise<void> {
    await this.updateDistributionStatus(summaryId, 'SKIPPED', { errorMessage: reason, totalPoolClaimed });
  }

  private async logFailedDistribution(summaryId: string, errorDetails: string, totalPoolClaimed?: number): Promise<void> {
    await this.updateDistributionStatus(summaryId, 'FAILED', { errorMessage: errorDetails, totalPoolClaimed });
  }

  private async logOverallSuccess(
    summaryId: string,
    totalDistributedSmallestUnit: string, // This is a string representing a BigInt
    claimedPool: number,
    numSuccessfulPayouts: number
  ): Promise<void> {
    let displayTotalDistributed = 0;
    try {
      displayTotalDistributed = Number(formatUnits(BigInt(totalDistributedSmallestUnit), 18));
    } catch (e) {
      console.error("[PrizeDistributionService] Error formatting total distributed amount for display:", e);
      // displayTotalDistributed remains 0 or could be set to a specific error indicator if preferred
    }
    await this.updateDistributionStatus(summaryId, 'SUCCESS', {
      // txHash: null, // No single transaction hash for the summary log
      totalDistributed: displayTotalDistributed, // Log the display amount
      numWinners: numSuccessfulPayouts,
      totalPoolClaimed: claimedPool
    });
  }
}
