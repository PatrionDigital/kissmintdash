"use client";
import React, { createContext, useContext, useMemo, useState, useCallback } from "react";

// Game-specific user profile type
export interface GameUserProfile {
  attempts: number;
  streak: number;
  balance: number;
  // Add other game-specific fields as needed
}

export interface UserProfileContextValue {
  profile: GameUserProfile;
  updateProfile: (updates: Partial<GameUserProfile>) => void;
}

const defaultProfile: GameUserProfile = {
  attempts: 0,
  streak: 0,
  balance: 0,
};

const UserProfileContext = createContext<UserProfileContextValue | undefined>(undefined);

export const UserProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const [profile, setProfile] = useState<GameUserProfile>(defaultProfile);

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
