"use client";
import React, { createContext, useContext, useMemo, useState, useCallback } from "react";

// Game-specific user profile type
export interface GameUserProfile {
  freeAttempts: number; // Free attempts (max 1, granted at midnight and noon Tokyo time)
  bonusAttempts: number; // Purchased attempts that roll over
  lastFreeAttemptTime: number; // Timestamp of when the last free attempt was granted
  streak: number;
  balance: number;
  // Add other game-specific fields as needed
}

export interface UserProfileContextValue {
  profile: GameUserProfile;
  updateProfile: (updates: Partial<GameUserProfile>) => void;
}

const defaultProfile: GameUserProfile = {
  freeAttempts: 0,
  bonusAttempts: 0,
  lastFreeAttemptTime: 0,
  streak: 0,
  balance: 0,
};

const BONUS_ATTEMPTS_KEY = 'bonusAttempts';

const UserProfileContext = createContext<UserProfileContextValue | undefined>(undefined);

export const UserProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const [profile, setProfile] = useState<GameUserProfile>(() => {
    // On initial load, check localStorage for bonusAttempts
    if (typeof window !== 'undefined') {
      const storedBonus = localStorage.getItem(BONUS_ATTEMPTS_KEY);
      if (storedBonus !== null) {
        return { ...defaultProfile, bonusAttempts: Number(storedBonus) };
      }
    }
    return defaultProfile;
  });

  // Persist bonusAttempts to localStorage whenever it changes
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(BONUS_ATTEMPTS_KEY, String(profile.bonusAttempts));
    }
  }, [profile.bonusAttempts]);

  const updateProfile = useCallback((updates: Partial<GameUserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  }, []);

  const value = useMemo(() => ({ profile, updateProfile }), [profile, updateProfile]);

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
}
