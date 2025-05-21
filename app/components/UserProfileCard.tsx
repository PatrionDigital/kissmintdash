"use client";
import React from "react";
import { useUserProfile } from "../../src/context/UserContext";

export const UserProfileCard = () => {
  const { profile } = useUserProfile();

  if (!profile) return <div className="p-4">No profile found.</div>;

  return (
    <div>

      {/* Game stats section */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="text-sm text-[var(--app-foreground-muted)]">Attempts</div>
            <div className="text-xl font-semibold">{profile.attempts}</div>
          </div>
          <div className="flex-1">
            <div className="text-sm text-[var(--app-foreground-muted)]">Streak</div>
            <div className="text-xl font-semibold">{profile.streak}</div>
          </div>
          <div className="flex-1">
            <div className="text-sm text-[var(--app-foreground-muted)]">Balance</div>
            <div className="text-xl font-semibold">{profile.balance}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
