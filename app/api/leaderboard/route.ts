import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const LEADERBOARD_TABS = ["daily", "weekly", "allTime"] as const;
type LeaderboardTab = typeof LEADERBOARD_TABS[number];
type LeaderboardEntry = {
  rank?: number;
  name: string;
  score: number;
  reward: string;
};
type PostBody = {
  tab: LeaderboardTab;
  name: string;
  score: number;
  reward: string;
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
    const value = raw[i];
    const score = Number(raw[i + 1]);
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        entries.push({ ...parsed, score });
      } catch {
        entries.push({ name: value, score, reward: "" });
      }
    } else {
      entries.push({ name: String(value), score, reward: "" });
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
  const { tab, name, score, reward } = body;
  if (!tab || !LEADERBOARD_TABS.includes(tab) || !name || typeof score !== "number") {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }
  await redis.zadd(leaderboardKey(tab), {
    score,
    member: JSON.stringify({ name, reward }),
  });
  return NextResponse.json({ success: true });
}
