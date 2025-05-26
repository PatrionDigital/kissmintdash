"use client";
import React, { useEffect, useState } from "react";
import { useUserProfile } from "../../src/context/UserContext";
import { useAccount, useContractRead } from "wagmi";
import Image from "next/image";
import { sdk } from '@farcaster/frame-sdk';

const GLICO_ADDRESS = "0x6De365d939Ce9Ab46e450E5f1FA706E1DbcEC9Fe";
const GLICO_CAIP19 = "eip155:8453/erc20:0x6De365d939Ce9Ab46e450E5f1FA706E1DbcEC9Fe";
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
  const { profile } = useUserProfile();
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
  
  // Initialize and handle wallet connection changes
  useEffect(() => {
    setIsInitialized(true);
    
    // Refetch balance when wallet connects
    if (isConnected && address) {
      setIsLoading(true);
      refetchBalance().finally(() => setIsLoading(false));
    }
  }, [isConnected, address, refetchBalance]);
  
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
    <div className="w-full max-w-xs mx-auto bg-[var(--app-card-bg)] rounded-xl shadow-lg border-2 border-cyber p-4 flex flex-col items-center gap-3">
      {/* $GLICO label */}
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


      {/* Attempts and Streak labels/values aligned */}
      <div className="flex flex-row w-full justify-center mt-2">
        <div className="flex flex-col items-center w-1/2">
          <div className="text-lg font-bold text-center tracking-wide">Attempts</div>
          <div className="text-xl font-semibold text-center tracking-wider">{profile.attempts} <span className={"text-base font-normal"}>Left</span></div>
        </div>
        <div className="flex flex-col items-center w-1/2">
          <div className="text-lg font-bold text-center tracking-wide">Daily Streak</div>
          <div className="text-xl font-semibold text-center tracking-wider">{profile.streak}</div>
        </div>
      </div>
    </div>
  );
};
