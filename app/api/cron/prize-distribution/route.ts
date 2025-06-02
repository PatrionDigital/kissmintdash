import { NextResponse } from 'next/server';
import { PrizeDistributionService } from '@/app/services/prize-distribution.service';
import { LeaderboardService } from '@/app/services/leaderboard.service';
import { PrizePoolManager } from '@/app/services/prize-pool.service';
import { WalletService } from '@/app/services/wallet.service';
import { FarcasterProfileService } from '@/app/services/farcaster-profile.service';
import { createClient as createTursoClient } from '@libsql/client';
import type { Client as TursoClient } from '@libsql/client';
import { Redis } from '@upstash/redis';

// Initialize Redis and Turso clients
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const turso: TursoClient = createTursoClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// Initialize services with required dependencies
const leaderboardService = new LeaderboardService(redis, turso);
const prizePoolManager = new PrizePoolManager();
const walletService = new WalletService();
const farcasterProfileService = new FarcasterProfileService(process.env.NEYNAR_API_KEY);
// Initialize PrizeDistributionService with all required services
const prizeDistributionService = new PrizeDistributionService(
  leaderboardService,
  prizePoolManager,
  walletService,
  farcasterProfileService,
  turso
);

// Validate API key from request headers
function validateApiKey(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const expectedApiKey = process.env.CRON_SECRET;
  return authHeader === `Bearer ${expectedApiKey}`;
}

export async function GET(request: Request) {
  // Secure the endpoint with API key
  if (!validateApiKey(request)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const periodType = searchParams.get('periodType');
  const periodIdentifier = searchParams.get('periodIdentifier');

  if (!periodType || !['daily', 'weekly'].includes(periodType)) {
    return NextResponse.json(
      { error: 'Invalid periodType. Must be "daily" or "weekly"' },
      { status: 400 }
    );
  }

  try {
    await prizeDistributionService.settlePrizesForPeriod(
      periodType as 'daily' | 'weekly', 
      periodIdentifier || new Date().toISOString().split('T')[0]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Prize distribution failed:', error);
    return NextResponse.json(
      { 
        error: 'Prize distribution failed', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
