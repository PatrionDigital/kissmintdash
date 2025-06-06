"use client";
import React, { useState } from "react";
import { Card, Button } from "./DemoComponents";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { FaHome } from "react-icons/fa";

type LeaderboardTab = "daily" | "weekly" | "allTime";
type LeaderboardEntry = { rank: number; name: string; score: number; prizeAmount?: number };

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
        console.log('Leaderboard data:', data); // Debug log
        if (!ignore) {
          // Define the expected entry type
          type LeaderboardApiEntry = {
            rank?: number;
            name?: string | { name?: string };
            score?: number;
            prizeAmount?: number; // Updated from reward
          };
          
          // Ensure each entry has the correct structure
          const entries = (data.entries || []).map((entry: LeaderboardApiEntry, idx: number) => ({
            rank: entry.rank ?? idx + 1,
            name: String(entry.name || ''), // Ensure name is always a string
            score: Number(entry.score) || 0, // Ensure score is always a number
            prizeAmount: typeof entry.prizeAmount === 'number' ? entry.prizeAmount : undefined // Ensure prizeAmount is a number or undefined
          }));
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
  const currentUserIdentifier = context?.user?.username; // Or context?.user?.fid?.toString() if API provides FID

  // Derived state for displaying leaderboard
  const currentPlayerEntry = currentUserIdentifier
    ? entries.find(entry => entry.name === currentUserIdentifier) // Adjust matching if API uses FID or different name format
    : undefined;

  const top5Entries = entries.slice(0, 5);

  const showCurrentPlayerSeparately = !!(currentPlayerEntry && currentPlayerEntry.rank > 5);

  // Existing farcasterUsername for greeting, can be removed if currentUserIdentifier is preferred everywhere
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
              disabled={tab.key === 'weekly' || tab.key === 'allTime'}
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
              {/* Current Player's Rank (if not in Top 5) - Updated for prizeAmount */}
              {showCurrentPlayerSeparately && currentPlayerEntry && (
                <div className="my-4 p-3 bg-white text-black border border-gray-300 rounded-md text-center shadow">
                  <h4 className="text-md font-semibold text-black mb-1">Your Rank</h4>
                  <table className="w-full text-center">
                    <tbody>
                      <tr> {/* Removed dark:text-gray-200 */}
                        <td className="py-2 px-2 font-bold">{currentPlayerEntry.rank}</td>
                        <td className="py-2 px-2">{currentPlayerEntry.name}</td>
                        <td className="py-2 px-2">{currentPlayerEntry.score}</td>
                        <td className="py-2 px-2"> {/* Removed text-green-600 dark:text-green-400 */}
                          {typeof currentPlayerEntry.prizeAmount === 'number' ? `${currentPlayerEntry.prizeAmount.toFixed(2)} $GLICO` : '-'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Top 5 Leaderboard Table */}
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-slate-800">
                    <th className="py-2 px-2 text-bubblegum dark:text-pink-400">Rank</th>
                    <th className="py-2 px-2 text-bubblegum dark:text-pink-400">Player</th>
                    <th className="py-2 px-2 text-bubblegum dark:text-pink-400">Score</th>
                    <th className="py-2 px-2 text-bubblegum dark:text-pink-400">Prize</th>
                  </tr>
                </thead>
                <tbody>
                  {top5Entries.map((entry: LeaderboardEntry) => {
                    const displayName = String(entry.name || `Player ${entry.rank}`);
                    const isCurrentPlayerInTop5 = currentUserIdentifier && entry.name === currentUserIdentifier;
                    return (
                      <tr 
                        key={`${entry.rank}-${entry.name}`}
                        className={`border-b last:border-b-0 dark:border-slate-700 dark:text-gray-300 ${isCurrentPlayerInTop5 ? 'bg-yellow-100 dark:bg-yellow-700/30 font-semibold dark:text-yellow-200' : ''}`}
                      >
                        <td className="py-2 px-2 font-bold">{entry.rank}</td>
                        <td className="py-2 px-2">{displayName}</td>
                        <td className="py-2 px-2">{entry.score}</td>
                        <td className="py-2 px-2 text-green-600 dark:text-green-400">
                          {typeof entry.prizeAmount === 'number' ? `${entry.prizeAmount.toFixed(2)} $GLICO` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {top5Entries.length === 0 && entries.length === 0 && (
                <div className="text-gray-500 dark:text-gray-400 text-center py-8">No scores yet. Be the first to play!</div>
              )}
              {top5Entries.length > 0 && entries.length > top5Entries.length && !currentPlayerEntry && (
                 <div className="text-gray-500 dark:text-gray-400 text-center py-4 text-sm">Your rank will appear here once you play.</div>
              )}
            </>
          )}
        </div>
        <Button 
          variant="outline" 
          onClick={() => setActiveTab("home")}
          icon={<FaHome className="w-4 h-4" />}
          aria-label="Back to Home"
          className="p-2"
        />
      </Card>
    </div>
  );
};

export default Leaderboard;
