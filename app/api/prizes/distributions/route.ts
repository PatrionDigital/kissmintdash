import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { createClient as createTursoClient } from '@libsql/client';
import { Redis } from '@upstash/redis';
import { PrizeDistributionService } from '@/app/services/prize-distribution.service';
import { LeaderboardService } from '@/app/services/leaderboard.service';
import { PrizePoolManager } from '@/app/services/prize-pool.service';
import { WalletService } from '@/app/services/wallet.service';
import { FarcasterProfileService } from '@/app/services/farcaster-profile.service';
import { ApiResponse, DistributionStatus, PrizeDistribution } from '../types';
import { withRateLimit } from '@/app/middleware/rate-limit';

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

// GET /api/prizes/distributions - List all distributions
const getDistributionsHandler = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const type = searchParams.get('type') as 'daily' | 'weekly' | null;
    const status = searchParams.get('status') as DistributionStatus | null;

    // Build query
    let query = 'SELECT * FROM distribution_summary_log';
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (type) {
      conditions.push('pool_type = ?');
      params.push(type);
    }
    
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Add pagination
    const offset = (page - 1) * pageSize;
    query += ' ORDER BY started_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);

    // Execute query
    const result = await turso.execute({
      sql: query,
      args: params,
    });

    // Get total count for pagination
    const countQuery = 'SELECT COUNT(*) as total FROM distribution_summary_log' + 
                      (conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '');
    const countResult = await turso.execute({
      sql: countQuery,
      args: params.slice(0, -2), // Remove LIMIT and OFFSET params
    });

    const total = countResult.rows[0]?.total as number || 0;

    // Map to response format
    const distributions: PrizeDistribution[] = result.rows.map((row: any) => ({
      id: row.id,
      type: row.pool_type,
      periodIdentifier: row.period_identifier,
      status: row.status,
      totalWinners: row.total_winners,
      totalDistributed: row.total_distributed,
      currency: row.currency,
      startedAt: new Date(row.started_at).toISOString(),
      completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
      error: row.error_message || undefined,
    }));

    const response: ApiResponse<PrizeDistribution[]> = {
      data: distributions,
      meta: {
        page,
        pageSize,
        total,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch prize distributions:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch prize distributions' } },
      { status: 500 }
    );
  }
}

// POST /api/prizes/distributions - Trigger a new prize distribution
const postDistributionsHandler = async (request: NextRequest) => {
  try {
    const { poolType, periodIdentifier } = await request.json();

    if (!['daily', 'weekly'].includes(poolType)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid pool type. Must be "daily" or "weekly"' } },
        { status: 400 }
      );
    }

    // Start the prize distribution in the background
    prizeDistributionService.settlePrizesForPeriod(poolType, periodIdentifier)
      .catch(error => {
        console.error(`Failed to process ${poolType} prize distribution for ${periodIdentifier}:`, error);
      });

    return NextResponse.json({
      message: `Started ${poolType} prize distribution for period ${periodIdentifier}`,
      poolType,
      periodIdentifier,
    }, { status: 202 });
  } catch (error) {
    console.error('Failed to initiate prize distribution:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to initiate prize distribution' } },
      { status: 500 }
    );
  }
}

// Export handlers with rate limiting
export const GET = withRateLimit(
  getDistributionsHandler,
  'distributions-list',
  {
    limit: 60, // 60 requests per 15 minutes per IP
    window: '15 m',
    errorMessage: 'Too many requests. Please try again in 15 minutes.'
  }
);

// More restrictive rate limiting for admin endpoints
export const POST = withRateLimit(
  postDistributionsHandler,
  'distributions-create',
  { 
    adminOnly: true,
    limit: 10, // Only 10 requests per 15 minutes for admin endpoints
    window: '15 m',
    errorMessage: 'Too many admin requests. Please wait before trying again.'
  }
);
