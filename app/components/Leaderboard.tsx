import React, { useState } from "react";
import { Card, Button } from "./DemoComponents";

// Mock leaderboard data
type LeaderboardTab = "daily" | "weekly" | "allTime";
type LeaderboardEntry = { rank: number; name: string; score: number; reward: string };
const mockData: Record<LeaderboardTab, LeaderboardEntry[]> = {
  daily: [
    { rank: 1, name: "Alice", score: 1200, reward: "$GLICO x 10" },
    { rank: 2, name: "Bob", score: 1100, reward: "$GLICO x 5" },
    { rank: 3, name: "Carol", score: 1000, reward: "$GLICO x 2" },
  ],
  weekly: [
    { rank: 1, name: "Dave", score: 7000, reward: "$GLICO x 50" },
    { rank: 2, name: "Eve", score: 6500, reward: "$GLICO x 30" },
    { rank: 3, name: "Frank", score: 6200, reward: "$GLICO x 15" },
  ],
  allTime: [
    { rank: 1, name: "Grace", score: 20000, reward: "$GLICO x 200" },
    { rank: 2, name: "Heidi", score: 18000, reward: "$GLICO x 150" },
    { rank: 3, name: "Ivan", score: 17000, reward: "$GLICO x 100" },
  ],
};

const LEADERBOARD_TABS = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "allTime", label: "All-Time" },
];

export type LeaderboardProps = {
  setActiveTab: (tab: string) => void;
};

export const Leaderboard: React.FC<LeaderboardProps> = ({ setActiveTab }) => {
  const [leaderboardTab, setLeaderboardTab] = useState<"daily" | "weekly" | "allTime">("daily");

  return (
    <div className="space-y-6 animate-fade-in">
      <Card title="Leaderboard Panel">
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
              {mockData[leaderboardTab].map((entry: LeaderboardEntry) => (
                <tr key={entry.rank} className="border-b last:border-b-0">
                  <td className="py-2 px-2 font-bold">{entry.rank}</td>
                  <td className="py-2 px-2">{entry.name}</td>
                  <td className="py-2 px-2">{entry.score}</td>
                  <td className="py-2 px-2 text-green-600">{entry.reward}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {mockData[leaderboardTab].length === 0 && (
            <div className="text-gray-500 text-center py-8">No scores yet. Be the first to play!</div>
          )}
        </div>
        <Button variant="outline" onClick={() => setActiveTab("home")}>Back to Home</Button>
      </Card>
    </div>
  );
};

export default Leaderboard;
