import { NextResponse } from 'next/server';
import { createClient as createTursoClient } from '@libsql/client';
import { PrizeDistributionService } from '@/app/services/prize-distribution.service';
import { LeaderboardService } from '@/app/services/leaderboard.service';
import { PrizePoolManager } from '@/app/services/prize-pool.service';
import { WalletService } from '@/app/services/wallet.service';
import { FarcasterProfileService } from '@/app/services/farcaster-profile.service';
import { redis } from '@/lib/redis';
import type { Client as TursoClient } from '@libsql/client';

// Log environment variables for Redis BEFORE client instantiation using console.error
console.info(`[CRON /api/prize-distribution] INFO (diagnostic): Initializing Redis Client. process.env.REDIS_URL: ${process.env.REDIS_URL}`);
console.info(`[CRON /api/prize-distribution] INFO (diagnostic): Initializing Redis Client. process.env.REDIS_TOKEN is ${process.env.REDIS_TOKEN ? 'SET (token value not shown)' : 'NOT SET or empty'}`);

// Initialize Turso client
const turso: TursoClient = createTursoClient({
  url: process.env.NEXT_PUBLIC_TURSO_URL!,
  authToken: process.env.NEXT_PUBLIC_TURSO_API_SECRET!,
});

// Initialize services with required dependencies
// Using centralized Redis client from lib/redis
const leaderboardService = new LeaderboardService(redis, turso);
const prizePoolManager = new PrizePoolManager(redis, turso);
const walletService = WalletService.getInstance();
const farcasterProfileService = new FarcasterProfileService(process.env.NEYNAR_API_KEY);
// Initialize PrizeDistributionService with all required services
const prizeDistributionService = new PrizeDistributionService(
  leaderboardService,
  prizePoolManager,
  walletService,
  farcasterProfileService,
  turso
);





// Validate only the secret from the query string
function validateApiKey(request: Request): boolean {
  const url = new URL(request.url);
  const secret = url.searchParams.get('secret');
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    console.error('CRON_SECRET is not set in environment variables');
    return false;
  }
  if (!secret || secret !== expectedSecret) {
    console.warn('Unauthorized: Invalid or missing secret');
    return false;
  }
  return true;
}

export async function GET(request: Request) {
  // Secure the endpoint with API key
  console.log('[CRON API /api/cron/prize-distribution] Received request.');
  if (!validateApiKey(request)) {
    console.warn('[CRON API /api/cron/prize-distribution] Unauthorized access attempt.');
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const periodType = searchParams.get('periodType');

  console.log(`[CRON API /api/cron/prize-distribution] Requested periodType: ${periodType}`);

  if (!periodType || !['daily', 'weekly'].includes(periodType)) {
    console.error(`[CRON API /api/cron/prize-distribution] Invalid periodType: ${periodType}`);
    return NextResponse.json(
      { error: 'Invalid periodType. Must be "daily" or "weekly"' },
      { status: 400 }
    );
  }

  try {
    if (periodType === 'daily') {
      console.log('[CRON API /api/cron/prize-distribution] Initiating daily prize settlement...');
      await prizeDistributionService.settleDailyPrizes();
      console.log('[CRON API /api/cron/prize-distribution] Daily prize settlement process completed successfully.');
    } else if (periodType === 'weekly') {
      console.log('[CRON API /api/cron/prize-distribution] Initiating weekly prize settlement...');
      await prizeDistributionService.settleWeeklyPrizes();
      console.log('[CRON API /api/cron/prize-distribution] Weekly prize settlement process completed successfully.');
    }
    return NextResponse.json({ success: true, message: `${periodType} settlement process initiated successfully.` });
  } catch (error) {
    console.error(`[CRON API /api/cron/prize-distribution] ${periodType} prize distribution failed:`, error);
    const envVars = {
      REDIS_URL_IS_SET: !!process.env.REDIS_URL,
      REDIS_URL_VALUE: process.env.REDIS_URL || "NOT SET",
      REDIS_TOKEN_IS_SET: !!process.env.REDIS_TOKEN,
    };
    return NextResponse.json(
      {
        success: false,
        error: `${periodType} prize distribution failed`,
        details: error instanceof Error ? error.message : String(error),
        environmentDiagnostics: envVars
      },
      { status: 500 }
    );
  }
}
