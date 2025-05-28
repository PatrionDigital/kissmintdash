"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useUserProfile } from "../../src/context/UserContext";
import { useAccount, useContractRead } from "wagmi";
import Image from "next/image";
import { sdk } from '@farcaster/frame-sdk';
import NumberFlow from '@number-flow/react';
// import { TokenTransactionHistory } from "./TokenTransactionHistory"; // Recent Transactions panel hidden
import { PurchaseAttemptsButton } from "./PurchaseAttemptsButton";
import { checkFreeAttempt, getTotalAttempts } from "../../src/utils/attemptsManager";

// Cast address to `0x${string}` type for wagmi compatibility
const GLICO_ADDRESS = (process.env.NEXT_PUBLIC_TOKEN_ADDRESS || "0x6De365d939Ce9Ab46e450E5f1FA706E1DbcEC9Fe") as `0x${string}`;
const GLICO_CAIP19 = `eip155:8453/erc20:${process.env.NEXT_PUBLIC_TOKEN_ADDRESS || "0x6De365d939Ce9Ab46e450E5f1FA706E1DbcEC9Fe"}`;
const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [{ "name": "owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "balance", "type": "uint256" }],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "name": "", "type": "uint8" }],
    "type": "function"
  }
];

export const UserProfileCard = () => {
  const { profile, updateProfile } = useUserProfile();
  const { address, isConnected } = useAccount();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch GLICO balance
  const { data: rawBalance, refetch: refetchBalance, isLoading: isBalanceLoading } = useContractRead({
    address: GLICO_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isInitialized,
      refetchInterval: 5000, // Refresh every 5 seconds
    },
  });
  
  const { data: decimals, isLoading: isDecimalsLoading } = useContractRead({
    address: GLICO_ADDRESS,
    abi: ERC20_ABI,
    functionName: "decimals",
    query: {
      enabled: isInitialized,
    },
  });
  
  // State for next free attempt timer
  const [nextAttemptTime, setNextAttemptTime] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // Check and grant free attempts
  const checkAndGrantFreeAttempt = useCallback(() => {
    const { shouldGrantAttempt, nextAttemptTime } = checkFreeAttempt(profile);
    
    // Update the next attempt time
    setNextAttemptTime(nextAttemptTime);
    updateTimeRemaining(nextAttemptTime);
    
    // Grant a free attempt if eligible
    if (shouldGrantAttempt) {
      updateProfile({
        freeAttempts: 1, // Max 1 free attempt at a time
        lastFreeAttemptTime: Date.now(),
      });
    }
  }, [profile, updateProfile]);

  // Initialize and handle wallet connection changes
  useEffect(() => {
    setIsInitialized(true);
    
    // Refetch balance when wallet connects
    if (isConnected && address) {
      setIsLoading(true);
      refetchBalance().finally(() => setIsLoading(false));
    }
    
    // Check for free attempts
    checkAndGrantFreeAttempt();
    
    // Set up timer to update the next attempt countdown
    const timer = setInterval(() => {
      const now = Date.now();
      updateTimeRemaining(nextAttemptTime);
      
      // Check if it's time to grant a new attempt
      if (now >= nextAttemptTime) {
        checkAndGrantFreeAttempt();
      }
    }, 1000); // Update every second
    
    return () => clearInterval(timer);
  }, [isConnected, address, refetchBalance, checkAndGrantFreeAttempt, nextAttemptTime]);
  
  // Format time remaining into hh:mm:ss
  const updateTimeRemaining = (nextTime: number) => {
    const now = Date.now();
    const remaining = Math.max(0, nextTime - now);
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    setTimeRemaining({ hours, minutes, seconds });
  };
  
  // Determine if we're loading the balance data
  const isLoadingData = isLoading || isBalanceLoading || isDecimalsLoading;
  
  
  // Format the balance for display
  let glicoBalance = isLoadingData ? "Loading..." : "-";
  if (!isLoadingData && rawBalance && decimals !== undefined) {
    const divisor = 10 ** Number(decimals);
    glicoBalance = (Number(rawBalance) / divisor).toLocaleString(undefined, { maximumFractionDigits: 4 });
  }

  if (!profile) return <div className="p-4">No profile found.</div>;

  return (
    <>
      <div
        className="text-lg font-bold text-center tracking-wide cursor-pointer select-none hover:text-cyber transition"
        aria-label="View $GLICO Token Info"
        title="View $GLICO Token Info"
        tabIndex={0}
        role="button"
        onClick={async () => {
          try {
            await sdk.actions.viewToken({ token: GLICO_CAIP19 });
          } catch (e) {
            console.error('Failed to open token info', e);
          }
        }}
        onKeyDown={async (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            try {
              await sdk.actions.viewToken({ token: GLICO_CAIP19 });
            } catch (e) {
              console.error('Failed to open token info', e);
            }
          }
        }}
      >
        $GLICO
      </div>

      {/* Token logo and balance */}
      <div
        className="flex items-center justify-center gap-2 cursor-pointer select-none hover:text-cyber transition"
        aria-label="View $GLICO Token Info"
        title="View $GLICO Token Info"
        tabIndex={0}
        role="button"
        onClick={async () => {
          try {
            await sdk.actions.viewToken({ token: GLICO_CAIP19 });
          } catch (e) {
            console.error('Failed to open token info', e);
          }
        }}
        onKeyDown={async (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            try {
              await sdk.actions.viewToken({ token: GLICO_CAIP19 });
            } catch (e) {
              console.error('Failed to open token info', e);
            }
          }
        }}
      >
        <Image src="/token.png" alt="$GLICO Token" width={32} height={32} className="rounded-full border border-cyber object-cover" />
        <span className="text-2xl font-extrabold tabular-nums">{glicoBalance}</span>
      </div>


      {/* Game Passes display */}
      <div className="flex flex-col items-center w-full mt-2">
        <div className="text-lg font-bold text-center tracking-wide">Game Passes</div>
        <div className="text-2xl font-semibold text-center tracking-wider">{getTotalAttempts(profile)}</div>
        {profile.freeAttempts === 0 && (
          <div className="text-xs text-gray-400 mt-1 flex items-center justify-center">
            <span className="mr-1">Next free:</span>
            <div className="inline-flex items-center font-mono">
              <NumberFlow value={timeRemaining.hours} className="inline-block w-4 text-center" />
              <span>:</span>
              <NumberFlow value={timeRemaining.minutes} className="inline-block w-4 text-center" />
              <span>:</span>
              <NumberFlow value={timeRemaining.seconds} className="inline-block w-4 text-center" />
            </div>
          </div>
        )}
      </div>

      {/* Purchase Attempts Button */}
      <PurchaseAttemptsButton />
      

    </>
  );
};
