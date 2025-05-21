"use client";
import React from "react";
import { IdentityCard } from "@coinbase/onchainkit/identity";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import { base } from "wagmi/chains";
import { useAccount } from "wagmi";
import { useUserProfile } from "../../src/context/UserContext";

export const UserProfileCard = () => {
  const { profile } = useUserProfile();
  const { address } = useAccount();

  if (!profile) return <div className="p-4">No profile found.</div>;

  return (
    <div
      className="rounded-xl border border-cyber p-6 mb-4"
      style={{ background: "var(--app-card-bg)" }}
    >
      {/* Identity section */}
      <div className="mb-4">
  {address ? (
    <IdentityCard address={address} chain={base} />
  ) : (
    <ConnectWallet />
  )}
</div>
      {/* Game stats section */}
      <div className="flex flex-col gap-2">
        <div className="font-bold text-lg mb-2">Game Profile</div>
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
