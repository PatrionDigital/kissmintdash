import { NextResponse } from 'next/server';
import { PrizePoolManager } from '@/app/services'; // Assuming services are correctly exported via barrel file and path alias is set

// Define revenue split percentages based on the project plan
const REVENUE_SPLIT = {
  dailyPoolPercent: 0.09,  // 9% of total revenue (30% of 30% Prize Pool Contribution)
  weeklyPoolPercent: 0.21, // 21% of total revenue (70% of 30% Prize Pool Contribution)
  treasuryPercent: 0.70,   // 70% of total revenue to Project Treasury
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { purchaseId, totalRevenue } = body;

    // Validate input
    if (!purchaseId || typeof purchaseId !== 'string' || purchaseId.trim() === '') {
      return NextResponse.json({ message: 'Missing or invalid purchaseId' }, { status: 400 });
    }
    if (totalRevenue === undefined || typeof totalRevenue !== 'number' || totalRevenue <= 0) {
      return NextResponse.json({ message: 'Missing or invalid totalRevenue' }, { status: 400 });
    }

    // Calculate contributions
    const dailyContribution = parseFloat((totalRevenue * REVENUE_SPLIT.dailyPoolPercent).toFixed(2));
    const weeklyContribution = parseFloat((totalRevenue * REVENUE_SPLIT.weeklyPoolPercent).toFixed(2));
    const treasuryShare = parseFloat((totalRevenue * REVENUE_SPLIT.treasuryPercent).toFixed(2));

    // Instantiate PrizePoolManager
    // IMPORTANT: Ensure that environment variables (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, 
    // TURSO_DATABASE_URL, TURSO_AUTH_TOKEN) are correctly set up and accessible 
    // in your Vercel deployment environment for this serverless function.
    const prizePoolManager = new PrizePoolManager();

    await prizePoolManager.addGamePassRevenueToPools(
      purchaseId,
      totalRevenue, // Log the original total revenue
      dailyContribution,
      weeklyContribution,
      treasuryShare
    );

    return NextResponse.json({ message: 'Revenue allocated successfully' }, { status: 200 });

  } catch (error) {
    console.error('Error in /api/allocate-revenue:', error);
    // Avoid exposing raw error details to the client in production
    let errorMessage = 'An unexpected error occurred while allocating revenue.';
    if (error instanceof Error && process.env.NODE_ENV === 'development') {
      // Provide more detail in development
      errorMessage = `Failed to allocate revenue: ${error.message}`;
    }
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
