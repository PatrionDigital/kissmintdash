"use client";

import React, { useState } from "react";
import { Card } from "./DemoComponents";
import { Button } from "./DemoComponents";
import { Icon } from "./DemoComponents";

export interface Quest {
  id: number;
  text: string;
  completed: boolean;
}

export function QuestList() {
  const [quests, setQuests] = useState<Quest[]>([
    { id: 1, text: "Learn about MiniKit", completed: false },
    { id: 2, text: "Build a Mini App", completed: true },
    { id: 3, text: "Deploy to Base and go viral", completed: false },
  ]);
  const [newQuest, setNewQuest] = useState("");

  const addQuest = () => {
    if (newQuest.trim() === "") return;
    const newId = quests.length > 0 ? Math.max(...quests.map((q) => q.id)) + 1 : 1;
    setQuests([...quests, { id: newId, text: newQuest, completed: false }]);
    setNewQuest("");
  };

  const toggleQuest = (id: number) => {
    setQuests(
      quests.map((quest) =>
        quest.id === id ? { ...quest, completed: !quest.completed } : quest
      )
    );
  };

  const deleteQuest = (id: number) => {
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
                <label
                  htmlFor={`quest-${quest.id}`}
                  className={`text-[var(--app-foreground-muted)] cursor-pointer ${quest.completed ? "line-through opacity-70" : ""}`}
                >
                  {quest.text}
                </label>
              </div>
              <button
                type="button"
                onClick={() => deleteQuest(quest.id)}
                className="text-[var(--app-foreground-muted)] hover:text-accent"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
