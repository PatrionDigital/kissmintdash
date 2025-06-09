import { NextResponse } from 'next/server';
import { createClient as createTursoClient } from '@libsql/client';
import { Redis } from '@upstash/redis';
import { PrizePoolManager } from '@/app/services/prize-pool.service';
import { ApiResponse, PrizePool } from '../types';

// Initialize services
const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
});

const turso = createTursoClient({
  url: process.env.NEXT_PUBLIC_TURSO_URL!,
  authToken: process.env.NEXT_PUBLIC_TURSO_API_SECRET!,
});

const prizePoolManager = new PrizePoolManager(redis, turso);

// GET /api/prizes/pools - Get current prize pool amounts
export async function GET() {
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
