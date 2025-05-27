"use client";
import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from "react";

// Game-specific user profile type
export interface GameUserProfile {
  freeAttempts: number; // Free attempts (max 1, granted at midnight and noon Tokyo time)
  bonusAttempts: number; // Purchased attempts that roll over
  lastFreeAttemptTime: number; // Timestamp of when the last free attempt was granted
  balance: number;
  // Add other game-specific fields as needed
}

export interface UserProfileContextValue {
  profile: GameUserProfile;
  updateProfile: (updates: Partial<GameUserProfile>) => void;
}

const defaultProfile: GameUserProfile = {
  freeAttempts: 1, // Start with 1 free attempt
  bonusAttempts: 0,
  lastFreeAttemptTime: 0, // Will be set when the first attempt is used
  balance: 0,
};

const PROFILE_STORAGE_KEY = 'userProfile';

// Helper to safely parse and validate profile from localStorage
const getStoredProfile = (): GameUserProfile => {
  if (typeof window === 'undefined') {
    return { ...defaultProfile };
  }
  
  try {
    const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!saved) return { ...defaultProfile };
    
    const parsed = JSON.parse(saved);
    return {
      freeAttempts: typeof parsed.freeAttempts === 'number' ? Math.max(0, parsed.freeAttempts) : defaultProfile.freeAttempts,
      bonusAttempts: typeof parsed.bonusAttempts === 'number' ? Math.max(0, parsed.bonusAttempts) : defaultProfile.bonusAttempts,
      lastFreeAttemptTime: typeof parsed.lastFreeAttemptTime === 'number' ? parsed.lastFreeAttemptTime : defaultProfile.lastFreeAttemptTime,
      balance: typeof parsed.balance === 'number' ? parsed.balance : defaultProfile.balance,
    };
  } catch (error) {
    console.error('Failed to load profile from localStorage:', error);
    return { ...defaultProfile };
  }
};

const UserProfileContext = createContext<UserProfileContextValue | undefined>(undefined);

export const UserProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const [isClient, setIsClient] = useState(false);
  const [profile, setProfile] = useState<GameUserProfile>(defaultProfile);

  // Initialize profile from localStorage on client side only
  useEffect(() => {
    setIsClient(true);
    setProfile(getStoredProfile());
  }, []);

  // Persist entire profile to localStorage whenever it changes
  useEffect(() => {
    if (isClient) {
      try {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      } catch (error) {
        console.error('Failed to save profile to localStorage:', error);
      }
    }
  }, [profile, isClient]);

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
