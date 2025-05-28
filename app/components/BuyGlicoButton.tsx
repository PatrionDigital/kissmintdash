"use client";

import React from 'react';
import { useAccount } from 'wagmi';
import { Wallet, ConnectWallet } from '@coinbase/onchainkit/wallet';
import { LiaEthereum } from 'react-icons/lia';

export const BuyGlicoButton = () => {
  const { isConnected } = useAccount();

  const handleBuyClick = () => {
    // TODO: Implement buy GLICO functionality
    console.log('Buy GLICO clicked');
  };

  return (
    <div className="w-full">
      {isConnected ? (
        <button
          onClick={handleBuyClick}
          className="w-full bg-cyber text-black font-bold py-2 px-4 rounded-lg hover:bg-cyber/80 transition-colors mt-4"
        >
          <span className="flex items-center justify-center gap-2">
            <LiaEthereum className="w-7 h-7" />
            <span>Buy $GLICO on Mint.Club</span>
          </span>
        </button>
      ) : (
        <div className="w-full mt-4">
          <Wallet className="w-full">
            <ConnectWallet className="w-full justify-center" />
          </Wallet>
        </div>
      )}
    </div>
  );
};

export default BuyGlicoButton;
