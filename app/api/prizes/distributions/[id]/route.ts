import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { createClient as createTursoClient, type Row } from '@libsql/client';
import { ApiResponse, PrizeDistribution, PrizePayout, DistributionStatus } from '../../types';

// Initialize Turso client
const turso = createTursoClient({
  url: process.env.NEXT_PUBLIC_TURSO_URL!,
  authToken: process.env.NEXT_PUBLIC_TURSO_API_SECRET!,
});

// GET /api/prizes/distributions/[id] - Get details of a specific distribution
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const distributionId = params.id;
    const { searchParams } = new URL(request.url);
    const includePayouts = searchParams.get('includePayouts') === 'true';

    // Get distribution summary
    const summaryResult = await turso.execute({
      sql: 'SELECT * FROM distribution_summary_log WHERE id = ?',
      args: [distributionId],
    });

    if (summaryResult.rows.length === 0) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Distribution not found' } },
        { status: 404 }
      );
    }

    const row = summaryResult.rows[0] as Row;
    
    // Safely extract and convert row data
    const summary = {
      id: String(row.id),
      pool_type: row.pool_type as 'daily' | 'weekly',
      period_identifier: String(row.period_identifier),
      status: String(row.status) as DistributionStatus,
      total_winners: Number(row.total_winners) || 0,
      total_distributed: String(row.total_distributed || '0'),
      currency: String(row.currency || 'GLICO'),
      started_at: row.started_at ? new Date(String(row.started_at)) : new Date(),
      completed_at: row.completed_at ? new Date(String(row.completed_at)) : null,
      error_message: row.error_message ? String(row.error_message) : null,
    };

    const distribution: PrizeDistribution = {
      id: summary.id,
      type: summary.pool_type,
      periodIdentifier: summary.period_identifier,
      status: summary.status,
      totalWinners: summary.total_winners,
      totalDistributed: summary.total_distributed,
      currency: summary.currency,
      startedAt: new Date(summary.started_at).toISOString(),
      completedAt: summary.completed_at ? new Date(summary.completed_at).toISOString() : null,
      error: summary.error_message || undefined,
    };

    let payouts: PrizePayout[] = [];
    
    if (includePayouts) {
      // Get individual payouts for this distribution
      const payoutsResult = await turso.execute({
        sql: `
          SELECT * FROM prize_distribution_log 
          WHERE distribution_summary_id = ?
          ORDER BY rank ASC
        `,
        args: [distributionId],
      });

      payouts = payoutsResult.rows.map((row: any) => {
        const payout: PrizePayout = {
          userId: String(row.user_id),
          userAddress: String(row.user_address),
          rank: Number(row.rank),
          score: Number(row.score),
          prizeAmount: String(row.prize_amount),
          status: row.status,
        };
        
        if (row.transaction_hash) {
          payout.transactionHash = String(row.transaction_hash);
        }
        
        if (row.error_message) {
          payout.error = String(row.error_message);
        }
        
        return payout;
      });
    }

    const response: ApiResponse<{
      distribution: PrizeDistribution;
      payouts?: PrizePayout[];
    }> = {
      data: {
        distribution,
        ...(includePayouts && { payouts }),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch distribution details:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch distribution details' } },
      { status: 500 }
    );
  }
}
