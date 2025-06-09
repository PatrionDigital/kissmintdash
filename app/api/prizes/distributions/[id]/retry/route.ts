import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { createClient as createTursoClient } from '@libsql/client';
import { Redis } from '@upstash/redis';
import { PrizeDistributionService } from '@/app/services/prize-distribution.service';
import { LeaderboardService } from '@/app/services/leaderboard.service';
import { PrizePoolManager } from '@/app/services/prize-pool.service';
import { WalletService } from '@/app/services/wallet.service';
import { FarcasterProfileService } from '@/app/services/farcaster-profile.service';
import { ApiResponse, PrizeDistribution } from '../../../../types';

// Initialize services
const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
});

const turso = createTursoClient({
  url: process.env.NEXT_PUBLIC_TURSO_URL!,
  authToken: process.env.NEXT_PUBLIC_TURSO_API_SECRET!,
});

const leaderboardService = new LeaderboardService(redis, turso);
const prizePoolManager = new PrizePoolManager(redis, turso);
const walletService = WalletService.getInstance();
const farcasterProfileService = new FarcasterProfileService(process.env.NEYNAR_API_KEY || '');

const prizeDistributionService = new PrizeDistributionService(
  leaderboardService,
  prizePoolManager,
  walletService,
  farcasterProfileService,
  turso
);

// POST /api/prizes/distributions/[id]/retry - Retry a failed distribution
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check for admin authorization
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid API key' } },
      { status: 401 }
    );
  }

  try {
    const distributionId = params.id;

    // Get the failed distribution
    const result = await turso.execute({
      sql: 'SELECT * FROM distribution_summary_log WHERE id = ?',
      args: [distributionId],
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Distribution not found' } },
        { status: 404 }
      );
    }

    const distribution = result.rows[0];
    
    if (distribution.status !== 'failed') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Only failed distributions can be retried' } },
        { status: 400 }
      );
    }

    // Start the retry in the background
    prizeDistributionService.settlePrizesForPeriod(
      distribution.pool_type,
      distribution.period_identifier
    ).catch(error => {
      console.error(`Failed to retry distribution ${distributionId}:`, error);
    });

    return NextResponse.json({
      message: `Retrying ${distribution.pool_type} prize distribution for period ${distribution.period_identifier}`,
      distributionId,
      poolType: distribution.pool_type,
      periodIdentifier: distribution.period_identifier,
    }, { status: 202 });
  } catch (error) {
    console.error('Failed to retry distribution:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to retry distribution' } },
      { status: 500 }
    );
  }
}
