import React from 'react';
import Image from 'next/image';
import styles from './WelcomeScreen.module.css';

interface WelcomeScreenProps {
  onStart: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Instruction text at the top */}
      <div className="absolute top-8 left-0 right-0 text-center z-20">
        <p className="text-lg md:text-xl text-[#00C2FF] font-mono tracking-wider animate-pulse">
          PRESS [START] TO CHEW BUBBLEGUM
        </p>
      </div>
      
      {/* Character - Positioned to take full width and height */}
      <div className="absolute left-0 bottom-0 h-full w-full flex items-end" style={{ width: '120%' }}>
        <div className="relative w-full h-full">
          <Image
            src="/MintyFullBody.png"
            alt="Minty Character"
            fill
            sizes="100vw"
            className="object-contain object-right-bottom"
            priority
          />
        </div>
      </div>
      
      {/* Final Fantasy style dialog box at bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/80 border-t-8 border-white/50 p-6 text-white z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold text-[#FF6EB3] font-mono tracking-wider">MINTY</h2>
            <div className="text-[#FFE94A] text-2xl animate-pulse">✦</div>
          </div>
          
          <p className="text-xl mb-6 leading-relaxed font-sans">
            In a world where taps determine destiny, only the fastest fingers survive! 
            <span className="text-[#3DFFC0] font-bold">Tap Fast, Run Far, Mint Glory</span> in this high-stakes race against time.
          </p>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-[#00C2FF] font-mono">
              <p>BUBBLE UP YOUR SCORE!</p>
            </div>
            <button 
              onClick={onStart}
              className={`${styles.arcadeButton} py-3 px-8 text-lg flex items-center`}
            >
              <span className="tracking-wider">START</span>
              <span className="ml-2 text-xl animate-pulse">→</span>
            </button>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-2 right-4 text-[#FFE94A] text-xs font-mono">
            GLICO ARCADE 1999
          </div>
        </div>
      </div>
    </div>
  );
};
