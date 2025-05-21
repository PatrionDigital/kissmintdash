import React, { useReducer, useRef, useEffect } from "react";
import TapButton from "./TapButton";
import GameTimer from "./GameTimer";
import ScoreCounter from "./ScoreCounter";
import GameFeedback from "./GameFeedback";
import { Button } from "../DemoComponents";
import FingerprintJS from '@fingerprintjs/fingerprintjs';

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
  | { type: "SET_DEVICE_INFO"; payload: Record<string, any> }
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
  deviceInfo?: Record<string, any>; // Device info snapshot
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

export const GameEngine: React.FC<{ initialGameState?: GameState }> = ({ initialGameState = GameState.Idle }) => {
  const [state, dispatch] = useReducer(gameReducer, {
    gameState: initialGameState,
    score: 0,
    timeLeft: GAME_DURATION,
    taps: [],
    feedback: false,
    tapTimestamps: [],
    deviceInfo: undefined,
    deviceFingerprint: undefined,
    performanceScore: undefined,
    integrityHash: undefined,
  });

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
          memory: (navigator as any).deviceMemory || undefined,
          hardwareConcurrency: (navigator as any).hardwareConcurrency || undefined,
          touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        };
        dispatch({ type: 'SET_DEVICE_INFO', payload: deviceInfo } as any);
      }
      // Fingerprint (only set once)
      if (!state.deviceFingerprint) {
        FingerprintJS.load()
          .then(fp => fp.get())
          .then(result => {
            dispatch({ type: 'SET_DEVICE_FINGERPRINT', payload: result.visitorId } as any);
          })
          .catch(() => {
            dispatch({ type: 'SET_DEVICE_FINGERPRINT', payload: 'unavailable' } as any);
          });
      }
      // Performance benchmark (only set once)
      if (!state.performanceScore) {
        // Micro-benchmark: time for 1 million empty iterations
        const iterations = 1_000_000;
        const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
        let x = 0;
        for (let i = 0; i < iterations; i++) {
          x++;
        }
        const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const elapsed = t1 - t0;
        dispatch({ type: 'SET_PERFORMANCE_SCORE', payload: elapsed } as any);
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
        const hashBuffer = await (window.crypto.subtle || (window as any).crypto.subtle).digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        dispatch({ type: 'SET_INTEGRITY_HASH', payload: hashHex } as any);
      } catch {
        dispatch({ type: 'SET_INTEGRITY_HASH', payload: 'unavailable' } as any);
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

  // UI event handlers
  const handleStart = () => dispatch({ type: "START_GAME" });
  const handleTap = () => dispatch({ type: "TAP", timestamp: Date.now() });
  const handleReset = () => dispatch({ type: "RESET_GAME" });
  const handleEnd = () => dispatch({ type: "END_GAME" });

  // Render UI based on game state
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-row items-center justify-center gap-6 w-full max-w-xs sm:max-w-md">
        <ScoreCounter score={state.score} />
        <GameTimer duration={state.timeLeft} onComplete={handleEnd} running={state.gameState === GameState.Running} />
      </div>
      {state.gameState === GameState.Idle && (
        <Button variant="secondary" onClick={handleStart}>
          Start Game
        </Button>
      )}
      {state.gameState === GameState.Running && (
        <TapButton onTap={handleTap} disabled={false} />
      )}
      {state.gameState === GameState.Finished && (
        <>
          <div className="text-xl font-bold text-center">Game Over! Final Score: {state.score}</div>
          <Button variant="secondary" className="mt-2" onClick={handleReset}>
            Play Again
          </Button>
        </>
      )}
      <GameFeedback trigger={state.feedback} type="visual" />
    </div>
  );
};

export default GameEngine;
