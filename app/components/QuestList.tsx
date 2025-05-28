"use client";

import React, { useState } from "react";
import { useUserProfile } from "../../src/context/UserContext";
import { Card } from "./DemoComponents";
import { Button } from "./DemoComponents";
import { Icon } from "./DemoComponents";
import { ShareFrameButton } from "./game/ShareFrameButton";

// Simple account hook replacement since we don't have the actual one
const useAccount = () => ({
  isConnected: true, // Assume connected for now
});

export interface Quest {
  id: number | string;
  text: string;
  completed: boolean;
  reward?: {
    type: 'GLICO';
    amount: number;
    claimed: boolean;
  };
}

const SHARE_QUEST_ID = 'share-mintdash';

export function QuestList() {
  const { profile, updateProfile } = useUserProfile();
  const { isConnected } = useAccount();
  const [quests, setQuests] = useState<Quest[]>([
    { 
      id: SHARE_QUEST_ID, 
      text: "Share MintDash with your friends", 
      completed: false,
      reward: {
        type: 'GLICO',
        amount: 100, // 100 GLICO reward
        claimed: false
      }
    },
    { id: 1, text: "Learn about MiniKit", completed: false },
    { id: 2, text: "Build a Mini App", completed: true },
    { id: 3, text: "Deploy to Base and go viral", completed: false },
  ]);
  const [newQuest, setNewQuest] = useState("");

  const addQuest = () => {
    if (newQuest.trim() === "") return;
    // Only consider numeric IDs when calculating the next ID
    const numericIds = quests
      .map(q => typeof q.id === 'number' ? q.id : 0);
    const newId = quests.length > 0 ? Math.max(...numericIds, 0) + 1 : 1;
    setQuests([...quests, { id: newId, text: newQuest, completed: false }]);
    setNewQuest("");
  };

  const toggleQuest = (id: number | string) => {
    if (typeof id === 'string' && id === SHARE_QUEST_ID) {
      // For the share quest, we'll handle it via the onShareComplete callback
      return;
    }
    setQuests(prevQuests => {
      const updatedQuests = prevQuests.map(quest => {
        if (quest.id === id) {
          const updatedQuest = { ...quest, completed: !quest.completed };
          
          // If this is the share quest being completed and it has a reward
          if (id === SHARE_QUEST_ID && updatedQuest.completed && updatedQuest.reward && !updatedQuest.reward.claimed) {
            // Update the reward to claimed
            updatedQuest.reward.claimed = true;
            // Update user's GLICO balance
            updateProfile({
              balance: (profile.balance || 0) + (updatedQuest.reward.amount || 0)
            });
          }
          
          return updatedQuest;
        }
        return quest;
      });
      
      return updatedQuests;
    });
  };

  const deleteQuest = (id: number | string) => {
    setQuests(quests.filter((quest) => quest.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addQuest();
    }
  };

  return (
    <Card title="Onboarding Quests">
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            className="flex-1 px-3 py-2 rounded border border-bubblegum text-bubblegum focus:outline-none focus:ring-2 focus:ring-bubblegum placeholder:text-bubblegum/60"
            placeholder="Add a new quest..."
            value={newQuest}
            onChange={(e) => setNewQuest(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button
            variant="primary"
            size="md"
            onClick={addQuest}
            icon={<Icon name="plus" size="sm" />}
          >
            Add
          </Button>
        </div>
        <ul className="space-y-2">
          {quests.map((quest) => (
            <li key={quest.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  id={`quest-${quest.id}`}
                  type="checkbox"
                  checked={quest.completed}
                  onChange={() => toggleQuest(quest.id)}
                  className="mr-2 accent-bubblegum border-bubblegum focus:ring-2 focus:ring-bubblegum"
                />
                {quest.completed && (
                  <Icon
                    name="check"
                    size="sm"
                    className="text-[var(--app-background)]"
                  />
                )}
                <div className="flex items-center gap-2">
                  <label
                    htmlFor={`quest-${quest.id}`}
                    className={`text-[var(--app-foreground-muted)] cursor-pointer ${quest.completed ? "line-through opacity-70" : ""}`}
                  >
                    {quest.text}
                  </label>
                  {quest.reward && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-bubblegum/20 text-bubblegum">
                      {quest.reward.amount} GLICO
                    </span>
                  )}
                  {quest.id === SHARE_QUEST_ID && isConnected && (
                    <ShareFrameButton 
                      onShareComplete={() => {
                        setQuests(prevQuests => 
                          prevQuests.map(q => 
                            q.id === SHARE_QUEST_ID 
                              ? { 
                                  ...q, 
                                  completed: true,
                                  reward: q.reward ? { ...q.reward, claimed: true } : undefined
                                
                                } 
                              : q
                          )
                        );
                        // Update user's balance
                        updateProfile({
                          balance: (profile?.balance || 0) + 100 // 100 GLICO reward
                        });
                      }}
                      className="ml-2"
                    />
                  )}
                </div>
              </div>
              {!quest.reward && (
                <button
                  type="button"
                  onClick={() => deleteQuest(quest.id)}
                  className="text-[var(--app-foreground-muted)] hover:text-accent"
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
