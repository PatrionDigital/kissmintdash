import React, { useState } from "react";
import { Card, Button } from "./DemoComponents";

const LEADERBOARD_TABS = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "allTime", label: "All-Time" },
];

export type LeaderboardProps = {
  setActiveTab: (tab: string) => void;
};

export const Leaderboard: React.FC<LeaderboardProps> = ({ setActiveTab }) => {
  const [leaderboardTab, setLeaderboardTab] = useState("daily");

  return (
    <div className="space-y-6 animate-fade-in">
      <Card title="Leaderboard Panel">
        <div className="flex justify-center mb-6">
          {LEADERBOARD_TABS.map((tab) => (
            <Button
              key={tab.key}
              variant={leaderboardTab === tab.key ? "primary" : "secondary"}
              className="mx-1 min-w-[96px]"
              onClick={() => setLeaderboardTab(tab.key)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
        <ul className="space-y-3 mb-4">
          <li className="flex items-start">
            <span className="text-[var(--app-foreground-muted)]">
              This is a placeholder for the Leaderboard UI.
            </span>
          </li>
        </ul>
        <Button variant="outline" onClick={() => setActiveTab("home")}>Back to Home</Button>
      </Card>
    </div>
  );
};

export default Leaderboard;
