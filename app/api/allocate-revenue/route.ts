import { NextResponse } from 'next/server';
import { PrizePoolManager } from '@/app/services';
import { createClient as createTursoClient, Client as TursoClient } from '@libsql/client';
import { redis } from '@/lib/redis';

// Define revenue split percentages based on the project plan
const REVENUE_SPLIT = {
  dailyPoolPercent: 0.09,  // 9% of total revenue (30% of 30% Prize Pool Contribution)
  weeklyPoolPercent: 0.21, // 21% of total revenue (70% of 30% Prize Pool Contribution)
  treasuryPercent: 0.70,   // 70% of total revenue to Project Treasury
};

export async function POST(request: Request) {
  console.log('[POST /api/allocate-revenue] Received request.');

  // Log environment variables for Redis (BE VERY CAREFUL with logging tokens in production)
  console.log(`[POST /api/allocate-revenue] DEBUG: process.env.REDIS_URL: ${process.env.REDIS_URL}`);
  console.log(`[POST /api/allocate-revenue] DEBUG: process.env.REDIS_TOKEN is ${process.env.REDIS_TOKEN ? 'SET (token value not shown)' : 'NOT SET or empty'}`);
  
  

  try {
    const body = await request.json();
    const { purchaseId, totalRevenue } = body;

    // Validate input
    if (!purchaseId || typeof purchaseId !== 'string' || purchaseId.trim() === '') {
      console.error('[POST /api/allocate-revenue] Missing or invalid purchaseId');
      return NextResponse.json({ message: 'Missing or invalid purchaseId' }, { status: 400 });
    }
    if (totalRevenue === undefined || typeof totalRevenue !== 'number' || totalRevenue <= 0) {
      console.error('[POST /api/allocate-revenue] Missing or invalid totalRevenue');
      return NextResponse.json({ message: 'Missing or invalid totalRevenue' }, { status: 400 });
    }
    console.log(`[POST /api/allocate-revenue] Processing purchaseId: ${purchaseId}, totalRevenue: ${totalRevenue}`);

    // Calculate contributions
    const dailyContribution = parseFloat((totalRevenue * REVENUE_SPLIT.dailyPoolPercent).toFixed(2));
    const weeklyContribution = parseFloat((totalRevenue * REVENUE_SPLIT.weeklyPoolPercent).toFixed(2));
    const treasuryShare = parseFloat((totalRevenue * REVENUE_SPLIT.treasuryPercent).toFixed(2));

    // Use centralized Redis client from lib/redis
    // Redis configuration is already validated during app startup

    // Instantiate Turso client
    if (!process.env.NEXT_PUBLIC_TURSO_URL || !process.env.NEXT_PUBLIC_TURSO_API_SECRET) {
      console.error('[POST /api/allocate-revenue] CRITICAL: Turso Database URL or Auth Token is not configured in environment variables.');
      throw new Error('Server configuration error: Turso connection details missing.');
    }
    const turso: TursoClient = createTursoClient({
        url: process.env.NEXT_PUBLIC_TURSO_URL,
        authToken: process.env.NEXT_PUBLIC_TURSO_API_SECRET,
    });

    // Instantiate PrizePoolManager with the clients
    const prizePoolManager = new PrizePoolManager(redis, turso);
    console.log('[POST /api/allocate-revenue] PrizePoolManager instantiated.');

    // Add to daily prize pool
    await redis.incrbyfloat('prize_pool:daily', dailyContribution);
    
    // Add to weekly prize pool
    await redis.incrbyfloat('prize_pool:weekly', weeklyContribution);

    // Add to treasury
    await prizePoolManager.addGamePassRevenueToPools(
      purchaseId,
      totalRevenue,
      dailyContribution,
      weeklyContribution,
      treasuryShare
    );
    console.log(`[POST /api/allocate-revenue] Revenue allocation successful for purchaseId: ${purchaseId}`);

    return NextResponse.json({ message: 'Revenue allocated successfully' }, { status: 200 });

  } catch (error) {
    console.error('[POST /api/allocate-revenue] Error processing request:', error);
    let errorMessage = 'An unexpected error occurred while allocating revenue.';
    if (error instanceof Error) {
        errorMessage = `Failed to allocate revenue: ${error.message}`;
    }
    return NextResponse.json({ message: errorMessage, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
