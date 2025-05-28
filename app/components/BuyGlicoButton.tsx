"use client";

import React from 'react';
import { LiaEthereum } from 'react-icons/lia';

export function BuyGlicoButton() {
  return (
    <div className="w-full">
      <a
        href="https://mint.club/token/base/GLICO"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full bg-cyber text-black font-bold py-2 px-4 rounded-lg hover:bg-cyber/80 transition-colors mt-4 flex items-center justify-center gap-2 no-underline"
        style={{ display: 'inline-flex' }}
      >
        <LiaEthereum className="w-7 h-7" />
        <span>Buy $GLICO on Mint.Club</span>
      </a>
    </div>
  );
}

export default BuyGlicoButton;
