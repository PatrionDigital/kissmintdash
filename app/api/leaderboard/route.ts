import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { redis } from "@/lib/redis"; // Existing Redis client
import { PrizePoolManager, PoolType } from "@/app/services/prize-pool.service"; // Adjusted path, verify this
import { createClient as createTursoClient, Client as TursoClient } from '@libsql/client/web'; // Assuming web client for edge

// --- Constants for Prize Calculation ---
const BASE_PRIZES: Record<PoolType, number> = {
  daily: 50,    // 50 $GLICO
  weekly: 500,  // 500 $GLICO
  // 'allTime' is not a prize pool type in PrizePoolManager or kissmint-leaderboard-plan.md
};

const PRIZE_DISTRIBUTION_PERCENTAGES = [
  0.40, // 1st Place: 40%
  0.24, // 2nd Place: 24%
  0.16, // 3rd Place: 16%
  0.12, // 4th Place: 12%
  0.08, // 5th Place: 8%
];
// --- End Constants ---

const LEADERBOARD_TABS = ["daily", "weekly", "allTime"] as const;
type LeaderboardTab = typeof LEADERBOARD_TABS[number];

// Updated LeaderboardEntry type
type LeaderboardEntry = {
  name: string;
  score: number;
  rank: number;
  prizeAmount?: number; // Optional: prize in $GLICO
};

type PostBody = {
  tab: LeaderboardTab;
  name: string | { username?: string; [key: string]: unknown };
  score: number;
};

const LEADERBOARD_SIZE = 25;

function leaderboardKey(tab: LeaderboardTab): string {
  // Ensure 'allTime' doesn't try to use a prize pool key if it's not a prize type
  if (tab === 'allTime') return `leaderboard:${tab}`;
  // For daily/weekly, the key in Redis for scores might be just 'leaderboard:daily' not 'leaderboard:daily:scores'
  // but prize pool keys are 'prize_pool:daily'. The existing code uses `leaderboard:${tab}` for scores.
  return `leaderboard:${tab as PoolType}`; 
}

// Helper to initialize Turso client (or import a shared instance if you have one)
let turso: TursoClient | null = null;
function getTursoClient(): TursoClient {
  if (turso) return turso;
  const url = process.env.NEXT_PUBLIC_TURSO_URL;
  const authToken = process.env.NEXT_PUBLIC_TURSO_API_SECRET; 

  if (!url || !authToken) {
    console.error("Turso URL or Auth Token is not defined in environment variables.");
    throw new Error("Turso client configuration missing.");
  }
  turso = createTursoClient({ url, authToken });
  return turso;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") as LeaderboardTab;

  if (!tab || !LEADERBOARD_TABS.includes(tab)) {
    return NextResponse.json({ error: "Invalid tab" }, { status: 400 });
  }
  if (!redis) {
    return NextResponse.json({ error: "Redis not available" }, { status: 500 });
  }

  let totalPrizePool = 0;
  // prizePoolTotalForResponse is used to avoid returning undefined if tab is 'allTime'
  let prizePoolTotalForResponse: number | undefined = undefined; 

  if (tab === "daily" || tab === "weekly") {
    try {
      const tursoClient = getTursoClient();
      const prizePoolManager = new PrizePoolManager(redis, tursoClient);

      const currentBasePrize = BASE_PRIZES[tab as PoolType];
      const dynamicBonusPool = await prizePoolManager.getPrizePoolValue(tab as PoolType);
      totalPrizePool = currentBasePrize + dynamicBonusPool;
      prizePoolTotalForResponse = totalPrizePool;

    } catch (error) {
      console.error(`Error initializing services or getting prize pool for tab ${tab}:`, error);
      return NextResponse.json({ error: "Failed to calculate prize pool." }, { status: 500 });
    }
  }

  const rawLeaderboard = await redis.zrange(leaderboardKey(tab), 0, LEADERBOARD_SIZE - 1, {
    withScores: true,
    rev: true,
  });
  
  const entries: LeaderboardEntry[] = [];
  for (let i = 0; i < rawLeaderboard.length; i += 2) {
    const name = rawLeaderboard[i];
    const score = Number(rawLeaderboard[i + 1]);
    const rank = Math.floor(i / 2) + 1;

    if (typeof name === 'string' && name.trim().length > 0) {
      const entry: LeaderboardEntry = { name, score, rank };
      if ((tab === "daily" || tab === "weekly") && rank >= 1 && rank <= PRIZE_DISTRIBUTION_PERCENTAGES.length) {
        // Ensure totalPrizePool is positive before calculating to avoid -0 issues if it's 0
        const calculatedPrize = totalPrizePool > 0 ? totalPrizePool * PRIZE_DISTRIBUTION_PERCENTAGES[rank - 1] : 0;
        entry.prizeAmount = parseFloat(calculatedPrize.toFixed(2));
      }
      entries.push(entry);
    }
  }

  return NextResponse.json({ entries, prizePoolTotal: prizePoolTotalForResponse });
}

export async function POST(req: NextRequest) {
  if (!redis) {
    return NextResponse.json({ error: "Redis not available" }, { status: 500 });
  }
  let body: PostBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { tab, name, score } = body;
  if (!tab || !LEADERBOARD_TABS.includes(tab) || !name || typeof score !== "number") {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }
  
  const nameStr = typeof name === 'object' ? 
    (name && 'username' in name ? String(name.username || 'Player') : 'Player') : 
    String(name);

  const keyForRedis = leaderboardKey(tab); 

  const currentScore = await redis.zscore(keyForRedis, nameStr);
  
  if (currentScore === null || score > Number(currentScore)) {
    await redis.zadd(keyForRedis, {
      score,
      member: nameStr,
    });
    return NextResponse.json({ 
      success: true, 
      updated: true,
      previousScore: currentScore ? Number(currentScore) : null
    });
  }
  
  return NextResponse.json({ 
    success: true, 
    updated: false,
    currentScore: Number(currentScore)
  });
}
