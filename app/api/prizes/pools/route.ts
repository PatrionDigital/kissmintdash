import { NextResponse } from 'next/server';
import { createClient as createTursoClient, type Client as TursoClient } from '@libsql/client';
import { PrizePoolManager } from '@/services/prize-pool.service';
import { ApiResponse, PrizePool } from '../types';
import { redis } from '@/lib/redis';



// Initialize Turso client
let turso: TursoClient | null = null;
try {
  turso = createTursoClient({
    url: process.env.NEXT_PUBLIC_TURSO_URL!,
    authToken: process.env.NEXT_PUBLIC_TURSO_API_SECRET!,
  });
} catch (error) {
  console.error('Failed to initialize Turso client:', error);
  // Turso client will be undefined and handled in the route
}

// Initialize PrizePoolManager with proper error handling
let prizePoolManager: PrizePoolManager | null = null;
try {
  if (!turso) {
    throw new Error('Turso client not initialized');
  }
  prizePoolManager = new PrizePoolManager(redis, turso);
} catch (error) {
  console.error('Failed to initialize PrizePoolManager:', error);
  prizePoolManager = null;
}

// GET /api/prizes/pools - Get current prize pool amounts
export async function GET() {
  // Return error if PrizePoolManager failed to initialize
  if (!prizePoolManager) {
    return NextResponse.json(
      { error: 'Failed to initialize services' },
      { status: 500 }
    );
  }

  try {
    // Get base prize amounts (from constants)
    const basePrizes = {
      daily: 50,    // 50 $GLICO
      weekly: 500,  // 500 $GLICO
    };

    // Get dynamic bonus amounts from Redis
    const [dailyBonus, weeklyBonus] = await Promise.all([
      prizePoolManager.getPrizePoolValue('daily'),
      prizePoolManager.getPrizePoolValue('weekly'),
    ]);

    const now = new Date().toISOString();
    
    const pools: PrizePool[] = [
      {
        type: 'daily',
        baseAmount: basePrizes.daily,
        bonusAmount: dailyBonus,
        totalAmount: basePrizes.daily + dailyBonus,
        currency: 'GLICO',
        lastUpdated: now,
      },
      {
        type: 'weekly',
        baseAmount: basePrizes.weekly,
        bonusAmount: weeklyBonus,
        totalAmount: basePrizes.weekly + weeklyBonus,
        currency: 'GLICO',
        lastUpdated: now,
      },
    ];

    const response: ApiResponse<PrizePool[]> = {
      data: pools,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch prize pools:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch prize pools' } },
      { status: 500 }
    );
  }
}
