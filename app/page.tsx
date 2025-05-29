"use client";

import {
  useMiniKit,
  useAddFrame,
  useOpenUrl,
} from "@coinbase/onchainkit/minikit";
import "./theme.css";
import Image from "next/image";
import {
  Name,
  Identity,
  Address,
  Avatar,
  EthBalance,
} from "@coinbase/onchainkit/identity";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "./components/DemoComponents";
import { Icon } from "./components/DemoComponents";
import { Home } from "./components/DemoComponents";
import { Features } from "./components/DemoComponents";
import { useViewProfile } from '@coinbase/onchainkit/minikit';
import Leaderboard from "./components/Leaderboard";
import { WelcomeScreen } from "./components/game/WelcomeScreen";
import SystemMenu from "./components/SystemMenu";
import { IoIosSettings } from "react-icons/io";
import { RiTrophyFill } from "react-icons/ri";

function MainContent() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const [frameAdded, setFrameAdded] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  
  const addFrame = useAddFrame();
  const openUrl = useOpenUrl();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady().catch(console.error);
    }
  }, [isFrameReady, setFrameReady]);

  const handleAddFrame = useCallback(async () => {
    const frameAdded = await addFrame();
    setFrameAdded(Boolean(frameAdded));
  }, [addFrame]);

  const saveFrameButton = useMemo(() => {
    if (context && !context.client.added) {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddFrame}
          className="text-[var(--app-accent)] p-4"
          icon={<Icon name="plus" size="sm" />}
        >
          Save Frame
        </Button>
      );
    }

    if (frameAdded) {
      return (
        <div className="flex items-center space-x-1 text-sm font-medium text-[#0052FF] animate-fade-out">
          <Icon name="check" size="sm" className="text-[#0052FF]" />
          <span>Saved</span>
        </div>
      );
    }

    return null;
  }, [context, frameAdded, handleAddFrame]);



  return (
    <div className="relative min-h-screen">
      <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <div className="w-full max-w-md mx-auto px-4 py-3">
        <header className="flex items-end justify-between mb-3 bg-transparent z-[9999] relative h-24">
          <div className="flex-1 flex items-center justify-between gap-2 pr-2">
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="lg"
                icon={<IoIosSettings size={24} />}
                onClick={() => setActiveTab("system")}
                aria-label="System Menu"
              />
              <Button
                variant="primary"
                size="lg"
                icon={<RiTrophyFill size={24} />}
                onClick={() => setActiveTab("leaderboard")}
                aria-label="Leaderboard"
              />
              <Button
                variant="primary"
                size="lg"
                icon={<Icon name="star" size="md" />}
                onClick={() => setActiveTab("features")}
                aria-label="Features"
              />
            </div>
          </div>
          {/* App Logo */}
          <div
            className="absolute rounded-full border-2 border-pink-500 overflow-hidden"
            style={{ width: '5.1rem', height: '5.1rem', right: '-0.4rem', bottom: '0.5rem' }}
          >
            <div className="absolute inset-0 flex items-center justify-center p-px"> {/* Minimal padding (1px) */}
              <Image
                src="/logo.png"
                alt="Site Logo"
                width={80} // Intrinsic width for aspect ratio
                height={80} // Intrinsic height for aspect ratio
                className="max-w-full max-h-full object-contain" // Ensure image fits within the padded area
                priority
              />
            </div>
          </div>
        </header>

        <main className="flex-1">
          {activeTab === "home" && <Home />}
          {activeTab === "features" && <Features setActiveTab={setActiveTab} />}
          {activeTab === "leaderboard" && <Leaderboard setActiveTab={setActiveTab} />}
          {activeTab === "system" && <SystemMenu setActiveTab={setActiveTab} />}
        </main>

        <footer className="mt-2 pt-4 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            {saveFrameButton}
            <Button
              variant="ghost"
              size="sm"
              className="text-[var(--ock-text-foreground-muted)] text-xs"
              onClick={() => openUrl("https://base.org/builders/minikit")}
            >
              Built on Base with MiniKit
            </Button>
          </div>

        </footer>
      </div>
      </div>
    </div>
  );
}

export default function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [frameError, setFrameError] = useState<Error | null>(null);
  const [isFrameInitialized, setIsFrameInitialized] = useState(false);
  const { setFrameReady, isFrameReady } = useMiniKit();
  
  // Initialize frame as soon as the app loads
  useEffect(() => {
    const initializeFrame = async () => {
      if (!isFrameReady) {
        console.log('Initializing frame...');
        try {
          await setFrameReady();
          console.log('Frame initialized successfully');
          setIsFrameInitialized(true);
        } catch (error) {
          console.error('Failed to initialize frame:', error);
          setFrameError(error instanceof Error ? error : new Error('Failed to initialize frame'));
          // Don't set isFrameInitialized to true on error
        }
      } else {
        console.log('Frame already initialized');
        setIsFrameInitialized(true);
      }
    };
    
    initializeFrame();
  }, [setFrameReady, isFrameReady]);
  
  // Show error message if frame initialization fails
  if (frameError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-red-500 p-4 text-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">Failed to Initialize</h1>
          <p className="mb-4">{frameError.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  const handleStartGame = () => {
    setShowWelcome(false);
  };
  
  if (!isFrameInitialized) {
    return null;
  }
  
  return (
    <>
      {showWelcome ? (
        <WelcomeScreen onStart={handleStartGame} />
      ) : (
        <MainContent />
      )}
    </>
  );
}
