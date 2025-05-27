/**
 * Attempts Manager - Handles the logic for free and bonus attempts
 * 
 * Free attempts are granted at specific times:
 * - First attempt at midnight Tokyo time (UTC+9)
 * - Second attempt at noon Tokyo time (UTC+9)
 * 
 * Rules:
 * - Users can never have more than 1 free attempt at any time
 * - Bonus attempts (purchased) roll over and have no limit
 */

import { GameUserProfile } from "../context/UserContext";

// Tokyo timezone offset in milliseconds (UTC+9)
const TOKYO_TIMEZONE_OFFSET = 9 * 60 * 60 * 1000;

// Check if user should receive a free attempt based on Tokyo time
export function checkFreeAttempt(profile: GameUserProfile): { 
  shouldGrantAttempt: boolean;
  nextAttemptTime: number;
} {
  const now = Date.now();
  const tokyoTime = new Date(now + TOKYO_TIMEZONE_OFFSET);
  
  // Get the last time a free attempt was granted
  const lastAttemptTime = profile.lastFreeAttemptTime;
  
  // If user already has a free attempt, no need to grant another
  if (profile.freeAttempts >= 1) {
    return calculateNextAttemptTime(now, tokyoTime);
  }
  
  // Get the current Tokyo day
  const tokyoDay = tokyoTime.getUTCDate();
  const tokyoHour = tokyoTime.getUTCHours();
  
  // Calculate the time of the last midnight and noon in Tokyo time
  const lastMidnight = new Date(Date.UTC(
    tokyoTime.getUTCFullYear(),
    tokyoTime.getUTCMonth(),
    tokyoDay,
    0, 0, 0, 0
  )).getTime() - TOKYO_TIMEZONE_OFFSET;
  
  const lastNoon = new Date(Date.UTC(
    tokyoTime.getUTCFullYear(),
    tokyoTime.getUTCMonth(),
    tokyoDay,
    12, 0, 0, 0
  )).getTime() - TOKYO_TIMEZONE_OFFSET;
  
  // Determine if we should grant an attempt
  let shouldGrantAttempt = false;
  
  // If it's after noon and the last attempt was before noon, grant an attempt
  if (tokyoHour >= 12 && lastAttemptTime < lastNoon) {
    shouldGrantAttempt = true;
  }
  // If it's after midnight and the last attempt was before midnight, grant an attempt
  else if (lastAttemptTime < lastMidnight) {
    shouldGrantAttempt = true;
  }
  
  // Calculate the next attempt time
  const { nextAttemptTime } = calculateNextAttemptTime(now, tokyoTime);
  
  return {
    shouldGrantAttempt,
    nextAttemptTime
  };
}

// Calculate the next time a free attempt will be granted
function calculateNextAttemptTime(now: number, tokyoTime: Date): { 
  nextAttemptTime: number;
  shouldGrantAttempt: boolean;
} {
  const tokyoHour = tokyoTime.getUTCHours();
  const tokyoDay = tokyoTime.getUTCDate();
  const tokyoMonth = tokyoTime.getUTCMonth();
  const tokyoYear = tokyoTime.getUTCFullYear();
  
  let nextAttemptTime: number;
  
  // If it's before noon, next attempt is at noon
  if (tokyoHour < 12) {
    nextAttemptTime = new Date(Date.UTC(
      tokyoYear,
      tokyoMonth,
      tokyoDay,
      12, 0, 0, 0
    )).getTime() - TOKYO_TIMEZONE_OFFSET;
  } 
  // If it's after noon, next attempt is at midnight tomorrow
  else {
    nextAttemptTime = new Date(Date.UTC(
      tokyoYear,
      tokyoMonth,
      tokyoDay + 1,
      0, 0, 0, 0
    )).getTime() - TOKYO_TIMEZONE_OFFSET;
  }
  
  return {
    nextAttemptTime,
    shouldGrantAttempt: false
  };
}

// Format the time until next free attempt in hh:mm:ss format
export function formatTimeUntilNextAttempt(nextAttemptTime: number): string {
  const now = Date.now();
  const timeRemaining = Math.max(0, nextAttemptTime - now);
  
  if (timeRemaining <= 0) {
    return "00:00:00";
  }
  
  const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
  
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0')
  ].join(':');
}

// Get total available attempts (free + bonus)
export function getTotalAttempts(profile: GameUserProfile): number {
  return profile.freeAttempts + profile.bonusAttempts;
}

// Use an attempt, prioritizing free attempts first
export function useAttempt(profile: GameUserProfile): GameUserProfile {
  if (getTotalAttempts(profile) <= 0) {
    return profile; // No attempts available
  }
  
  const updatedProfile = { ...profile };
  
  // Use free attempts first
  if (updatedProfile.freeAttempts > 0) {
    updatedProfile.freeAttempts -= 1;
  } 
  // Then use bonus attempts
  else if (updatedProfile.bonusAttempts > 0) {
    updatedProfile.bonusAttempts -= 1;
  }
  
  return updatedProfile;
}
