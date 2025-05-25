import React, { useState } from "react";
import { Card, Button } from "./DemoComponents";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

type LeaderboardTab = "daily" | "weekly" | "allTime";
type LeaderboardEntry = { rank: number; name: string; score: number; reward: string };

const LEADERBOARD_TABS = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "allTime", label: "All-Time" },
];

export type LeaderboardProps = {
  setActiveTab: (tab: string) => void;
};

export const Leaderboard: React.FC<LeaderboardProps> = ({ setActiveTab }) => {
  const [leaderboardTab, setLeaderboardTab] = useState<LeaderboardTab>("daily");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    let ignore = false;
    async function fetchLeaderboard() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/leaderboard?tab=${leaderboardTab}`);
        if (!res.ok) throw new Error("Failed to fetch leaderboard");
        const data = await res.json();
        if (!ignore) {
          // Patch: ensure each entry is a flat object with rank, name, score, reward
          type ApiLeaderboardEntry = {
            rank?: number;
            name?: string | { name?: string };
            player?: string;
            score?: number;
            reward?: string;
          };
          const entries = (data.entries || []).map((entry: ApiLeaderboardEntry, idx: number) => {
            if (typeof entry.name === "object" && entry.name !== null) {
              return {
                rank: entry.rank ?? idx + 1,
                name: entry.name.name ?? String(entry.name),
                score: entry.score ?? 0,
                reward: entry.reward ?? "",
              };
            } else if (typeof entry.name === "string") {
              return {
                rank: entry.rank ?? idx + 1,
                name: entry.name,
                score: entry.score ?? 0,
                reward: entry.reward ?? "",
              };
            } else if (typeof entry.player === "string") {
              return {
                rank: entry.rank ?? idx + 1,
                name: entry.player,
                score: entry.score ?? 0,
                reward: entry.reward ?? "",
              };
            } else {
              return { rank: idx + 1, name: String(entry), score: 0, reward: "" };
            }
          });
          setEntries(entries);
        }
      } catch (err: unknown) {
        if (!ignore) setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchLeaderboard();
    return () => { ignore = true; };
  }, [leaderboardTab]);

  const { context } = useMiniKit();
  const farcasterUsername = context?.user?.username;

  return (
    <div className="space-y-6 animate-fade-in">
      <Card title="Leaderboard Panel">
        {farcasterUsername && (
          <div className="text-center mb-2 text-bubblegum font-semibold">
            Signed in as @{farcasterUsername}
          </div>
        )}
        <div className="flex justify-center mb-6">
          {LEADERBOARD_TABS.map((tab) => (
            <Button
              key={tab.key}
              variant={leaderboardTab === tab.key ? "primary" : "secondary"}
              className="mx-1 min-w-[96px]"
              onClick={() => setLeaderboardTab(tab.key as LeaderboardTab)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
        {/* Leaderboard Table */}
        <div className="overflow-x-auto mb-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : (
            <>
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-2 text-bubblegum">Rank</th>
                    <th className="py-2 px-2 text-bubblegum">Player</th>
                    <th className="py-2 px-2 text-bubblegum">Score</th>
                    <th className="py-2 px-2 text-bubblegum">Reward</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry: LeaderboardEntry, idx) => (
                    <tr key={idx} className="border-b last:border-b-0">
                      <td className="py-2 px-2 font-bold">{entry.rank}</td>
                      <td className="py-2 px-2">{entry.name}</td>
                      <td className="py-2 px-2">{entry.score}</td>
                      <td className="py-2 px-2 text-green-600">{entry.reward}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {entries.length === 0 && (
                <div className="text-gray-500 text-center py-8">No scores yet. Be the first to play!</div>
              )}
            </>
          )}
        </div>
        <Button variant="outline" onClick={() => setActiveTab("home")}>Back to Home</Button>
      </Card>
    </div>
  );
};

export default Leaderboard;
