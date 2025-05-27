import React, { useReducer, useRef, useEffect, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import TapButton from "./TapButton";
import GameTimer from "./GameTimer";
import ScoreCounter from "./ScoreCounter";
import GameFeedback from "./GameFeedback";
import { Button } from "../DemoComponents";
import { ShareFrameButton } from "./ShareFrameButton";
import FingerprintJS from '@fingerprintjs/fingerprintjs';

// Device info interface for anti-cheat
interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  screen: {
    width: number;
    height: number;
    colorDepth: number;
    pixelRatio: number;
  };
  memory?: number;
  hardwareConcurrency?: number;
  touchSupport: boolean;
}

// 1. Game States
export enum GameState {
  Idle = "idle",
  Running = "running",
  Finished = "finished",
}

type GameAction =
  | { type: "START_GAME" }
  | { type: "TAP"; timestamp: number }
  | { type: "TIMER_TICK" }
  | { type: "END_GAME" }
  | { type: "RESET_GAME" }
  | { type: "END_FEEDBACK" }
  | { type: "SET_DEVICE_INFO"; payload: DeviceInfo }
  | { type: "SET_DEVICE_FINGERPRINT"; payload: string }
  | { type: "SET_PERFORMANCE_SCORE"; payload: number }
  | { type: "SET_INTEGRITY_HASH"; payload: string };


interface GameStateModel {
  gameState: GameState;
  score: number;
  timeLeft: number;
  taps: number[];
  feedback: boolean;

  // --- Anti-cheat fields ---
  tapTimestamps: number[]; // High-precision tap timestamps
  deviceInfo?: DeviceInfo; // Device info snapshot
  deviceFingerprint?: string; // Device fingerprint string
  performanceScore?: number; // Device performance benchmark (ms)
  integrityHash?: string; // Session integrity hash
}

const GAME_DURATION = 25; // seconds

function gameReducer(state: GameStateModel, action: GameAction): GameStateModel {
  switch (action.type) {
    case "START_GAME":
      return {
        gameState: GameState.Running,
        score: 0,
        timeLeft: GAME_DURATION,
        taps: [],
        feedback: false,
        tapTimestamps: [],
        deviceInfo: undefined, // TODO: Populate at game start
        deviceFingerprint: undefined, // TODO: Populate at game start
        performanceScore: undefined, // TODO: Populate at game start
        integrityHash: undefined, // TODO: Generate at game end
      };
    case "TAP":
      if (state.gameState !== GameState.Running) return state;
      return {
        ...state,
        score: state.score + 1,
        taps: [...state.taps, action.timestamp],
        tapTimestamps: [...(state.tapTimestamps || []), typeof performance !== 'undefined' ? performance.now() : Date.now()],
        feedback: true,
      };
    case "TIMER_TICK":
      if (state.timeLeft <= 1) {
        return { ...state, timeLeft: 0, gameState: GameState.Finished };
      }
      return { ...state, timeLeft: state.timeLeft - 1 };
    case "END_GAME":
      return { ...state, gameState: GameState.Finished };
    case "RESET_GAME":
      return {
        gameState: GameState.Idle,
        score: 0,
        timeLeft: GAME_DURATION,
        taps: [],
        feedback: false,
        tapTimestamps: [],
        deviceInfo: undefined,
        deviceFingerprint: undefined,
        performanceScore: undefined,
        integrityHash: undefined,
      };
    case "END_FEEDBACK":
      return { ...state, feedback: false };
    case "SET_DEVICE_INFO":
      return { ...state, deviceInfo: action.payload };
    case "SET_DEVICE_FINGERPRINT":
      return { ...state, deviceFingerprint: action.payload };
    case "SET_PERFORMANCE_SCORE":
      return { ...state, performanceScore: action.payload };
    case "SET_INTEGRITY_HASH":
      return { ...state, integrityHash: action.payload };
    default:
      return state;
  }
}

function GameEngine() {
  // --- Anti-cheat state ---
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [deviceFingerprint, setDeviceFingerprint] = useState<string | null>(null);
  const [performanceScore, setPerformanceScore] = useState<number | null>(null);
  const [integrityHash, setIntegrityHash] = useState<string | null>(null);

  // --- Initial game state ---
  const initialGameState: GameStateModel = {
    gameState: GameState.Idle,
    score: 0,
    timeLeft: GAME_DURATION,
    taps: [],
    feedback: false,
    tapTimestamps: [],
    deviceInfo: undefined,
    deviceFingerprint: undefined,
    performanceScore: undefined,
    integrityHash: undefined,
  };

  const [state, dispatch] = useReducer(gameReducer, initialGameState);

  // --- Anti-cheat: Device fingerprinting and info ---
  useEffect(() => {
    if (state.gameState === GameState.Running) {
      // Device info (only set once)
      if (!state.deviceInfo) {
        const deviceInfo = {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          screen: {
            width: window.screen.width,
            height: window.screen.height,
            colorDepth: window.screen.colorDepth,
            pixelRatio: window.devicePixelRatio,
          },
          memory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory || undefined,
          hardwareConcurrency: navigator.hardwareConcurrency || undefined,
          touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        };
        dispatch({ type: 'SET_DEVICE_INFO', payload: deviceInfo });
      }
      // Fingerprint (only set once)
      if (!state.deviceFingerprint) {
        FingerprintJS.load()
          .then(fp => fp.get())
          .then(result => {
            dispatch({ type: 'SET_DEVICE_FINGERPRINT', payload: result.visitorId });
          })
          .catch(() => {
            dispatch({ type: 'SET_DEVICE_FINGERPRINT', payload: 'unavailable' });
          });
      }
      // Performance benchmark (only set once)
      if (!state.performanceScore) {
        // Micro-benchmark: time for 1 million empty iterations
        const iterations = 1_000_000;
        const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
        for (let i = 0; i < iterations; i++) {
          // empty loop for performance benchmark
        }
        const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const elapsed = t1 - t0;
        dispatch({ type: 'SET_PERFORMANCE_SCORE', payload: elapsed });
      }
    }
  }, [state.gameState, state.deviceFingerprint, state.deviceInfo, state.performanceScore]);

  // --- Anti-cheat: Integrity hash generation at game end ---
  useEffect(() => {
    async function generateIntegrityHash() {
      // Canonicalize session data
      const sessionData = {
        tapTimestamps: state.tapTimestamps,
        deviceInfo: state.deviceInfo,
        deviceFingerprint: state.deviceFingerprint,
        performanceScore: state.performanceScore,
        score: state.score,
        sessionEnd: Date.now(),
      };
      const json = JSON.stringify(sessionData);
      // Use Web Crypto API for SHA-256
      const encoder = new TextEncoder();
      const data = encoder.encode(json);
      try {
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        dispatch({ type: 'SET_INTEGRITY_HASH', payload: hashHex });
      } catch {
        dispatch({ type: 'SET_INTEGRITY_HASH', payload: 'unavailable' });
      }
    }
    if (
      state.gameState === GameState.Finished &&
      state.tapTimestamps &&
      state.tapTimestamps.length > 0 &&
      state.deviceInfo &&
      state.deviceFingerprint &&
      state.performanceScore &&
      !state.integrityHash
    ) {
      generateIntegrityHash();
    }
  }, [state.gameState, state.tapTimestamps, state.deviceInfo, state.deviceFingerprint, state.performanceScore, state.score, state.integrityHash]);

  // Timer interval ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect
  useEffect(() => {
    if (state.gameState === GameState.Running && state.timeLeft > 0) {
      timerRef.current = setInterval(() => {
        dispatch({ type: "TIMER_TICK" });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [state.gameState, state.timeLeft]);

  // Stop timer if finished
  useEffect(() => {
    if (state.gameState === GameState.Finished && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [state.gameState]);

  // Feedback reset
  useEffect(() => {
    if (state.feedback) {
      const timeout = setTimeout(() => {
        dispatch({ type: "END_FEEDBACK" });
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [state.feedback]);

  // Ensure feedback is cleared when game ends
  useEffect(() => {
    if (state.gameState === GameState.Finished && state.feedback) {
      dispatch({ type: "END_FEEDBACK" });
    }
  }, [state.gameState, state.feedback]);

  // --- Anti-cheat: Collect device info, fingerprint, and performance score ---
  useEffect(() => {
    let cancelled = false;
    // Only collect once per game session
    if (state.gameState === GameState.Running && !deviceInfo) {
      // Device info
      const nav = typeof navigator !== 'undefined' ? navigator : undefined;
      const win = typeof window !== 'undefined' ? window : undefined;
      const info: DeviceInfo = {
        userAgent: nav?.userAgent || '',
        platform: nav?.platform || '',
        language: nav?.language || '',
        screen: win ? {
          width: win.screen.width,
          height: win.screen.height,
          colorDepth: win.screen.colorDepth,
          pixelRatio: win.devicePixelRatio,
        } : { width: 0, height: 0, colorDepth: 0, pixelRatio: 1 },
        memory: (nav && 'deviceMemory' in nav) ? (nav as Navigator & { deviceMemory?: number }).deviceMemory : undefined,
        hardwareConcurrency: nav?.hardwareConcurrency,
        touchSupport: win ? ('ontouchstart' in win || (typeof nav?.maxTouchPoints === 'number' && nav.maxTouchPoints > 0)) : false,
      };
      setDeviceInfo(info);
      // FingerprintJS
      import('@fingerprintjs/fingerprintjs').then(FingerprintJS => {
        return FingerprintJS.load();
      }).then(fp => {
        return fp.get();
      }).then(result => {
        if (!cancelled) setDeviceFingerprint(result.visitorId);
      }).catch(() => {
        if (!cancelled) setDeviceFingerprint('unavailable');
      });
      // Performance micro-benchmark
      const iterations = 1_000_000;
      const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
      for (let i = 0; i < iterations; i++) {
        // intentionally empty loop for timing
      }
      const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const elapsed = t1 - t0;
      setPerformanceScore(elapsed);
    }
    return () => { cancelled = true; };
  }, [state.gameState, deviceInfo]);

  // --- Anti-cheat: Generate session integrity hash at game end ---
  useEffect(() => {
    async function generateIntegrityHash() {
      const sessionData = {
        tapTimestamps: state.taps,
        deviceInfo,
        deviceFingerprint,
        performanceScore,
        score: state.score,
        sessionEnd: Date.now(),
      };
      const json = JSON.stringify(sessionData);
      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        try {
          const encoder = new TextEncoder();
          const data = encoder.encode(json);
          const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          setIntegrityHash(hashHex);
        } catch {
          setIntegrityHash('unavailable');
        }
      } else {
        setIntegrityHash('unavailable');
      }
    }
    if (
      state.gameState === GameState.Finished &&
      state.taps && state.taps.length > 0 &&
      deviceInfo && deviceFingerprint && performanceScore &&
      !integrityHash
    ) {
      generateIntegrityHash();
    }
  }, [state.gameState, state.taps, deviceInfo, deviceFingerprint, performanceScore, state.score, integrityHash]);

  // UI event handlers
  const handleStart = () => dispatch({ type: "START_GAME" });
  const handleTap = () => dispatch({ type: "TAP", timestamp: Date.now() });
  const handleReset = () => dispatch({ type: "RESET_GAME" });
  const handleEnd = () => dispatch({ type: "END_GAME" });

  // Render UI based on game state
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full max-w-xs sm:max-w-md -mt-2">
        <div className="flex justify-between gap-4">
          {/* TAPS Container */}
          <div className="w-1/2 border border-cyber rounded-lg overflow-hidden flex flex-col h-[120px]">
            <div className="text-center pt-1 pb-0.5 bg-cyber/10">
              <div className="text-sm font-bold text-cyber">TAPS</div>
            </div>
            <div className="flex-1 flex items-center justify-center pb-3">
              <ScoreCounter score={state.score} />
            </div>
          </div>
          
          {/* TIMER Container */}
          <div className="w-1/2 border border-cyber rounded-lg overflow-hidden flex flex-col h-[120px]">
            <div className="text-center pt-1 pb-0.5 bg-cyber/10">
              <div className="text-sm font-bold text-cyber">TIMER</div>
            </div>
            <div className="flex-1 flex items-center justify-center pb-3">
              <GameTimer duration={state.timeLeft} onComplete={handleEnd} running={state.gameState === GameState.Running} />
            </div>
          </div>
        </div>
      </div>
      {state.gameState === GameState.Idle && (
        <Button variant="secondary" onClick={handleStart}>
          Start Game
        </Button>
      )}
      {state.gameState === GameState.Running && (
        <div className="relative w-32 h-32 flex items-center justify-center">
          <TapButton onTap={handleTap} disabled={false} />
          <GameFeedback trigger={state.feedback} type="visual" />
        </div>
      )}
      {state.gameState === GameState.Finished && (
        <>
          <div className="text-xl font-bold text-center">Game Over! Final Score: {state.score}</div>
          <SubmitScoreSection score={state.score} />
          <Button variant="secondary" className="mt-2" onClick={handleReset}>
            Play Again
          </Button>
        </>
      )}
      {/* GameFeedback moved inside tap button container */}
    </div>
  );
};

// --- SubmitScoreSection ---
type SubmitScoreSectionProps = { score: number };
const SubmitScoreSection: React.FC<SubmitScoreSectionProps> = ({ score }) => {
  const { context } = useMiniKit();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tab: "daily",
          name: context?.user?.username || "Anonymous",
          score,
          reward: ""
        }),
      });
      if (!res.ok) throw new Error("Failed to submit score");
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 mt-2">
      <Button
        variant="primary"
        onClick={handleSubmit}
        disabled={loading || success}
      >
        {loading ? "Submitting..." : success ? "Score Submitted!" : "Submit Score"}
      </Button>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      {success && <div className="text-green-600 text-sm">Score submitted successfully!</div>}
      {success && <ShareFrameButton score={score} />}
    </div>
  );
};

export { GameEngine };
