import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const LEADERBOARD_TABS = ["daily", "weekly", "allTime"] as const;
type LeaderboardTab = typeof LEADERBOARD_TABS[number];
type LeaderboardEntry = {
  name: string;
  score: number;
  rank: number;
};
type PostBody = {
  tab: LeaderboardTab;
  name: string | { username?: string; [key: string]: unknown };
  score: number;
};
const LEADERBOARD_SIZE = 25;
function leaderboardKey(tab: LeaderboardTab) {
  return `leaderboard:${tab}`;
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
  const raw = await redis.zrange(leaderboardKey(tab), 0, LEADERBOARD_SIZE - 1, {
    withScores: true,
    rev: true,
  });
  
  const entries: LeaderboardEntry[] = [];
  for (let i = 0; i < raw.length; i += 2) {
    const name = raw[i];
    const score = Number(raw[i + 1]);
    if (typeof name === 'string' && name.trim().length > 0) {
      entries.push({ name, score, rank: 0 });
    }
  }
  entries.forEach((entry, i) => (entry.rank = i + 1));
  return NextResponse.json({ entries });
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
  // Ensure name is a string before storing
  const nameStr = typeof name === 'object' ? 
    (name && 'username' in name ? String(name.username || 'Player') : 'Player') : 
    String(name);

  // Check if user already has a score
  const currentScore = await redis.zscore(leaderboardKey(tab), nameStr);
  
  // Only update if no score exists or new score is higher
  if (currentScore === null || score > Number(currentScore)) {
    await redis.zadd(leaderboardKey(tab), {
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
