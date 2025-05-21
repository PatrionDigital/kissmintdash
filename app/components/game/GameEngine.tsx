import React, { useReducer, useRef, useEffect } from "react";
import TapButton from "./TapButton";
import GameTimer from "./GameTimer";
import ScoreCounter from "./ScoreCounter";
import GameFeedback from "./GameFeedback";
import { Button } from "../DemoComponents";

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
  | { type: "END_FEEDBACK" };


interface GameStateModel {
  gameState: GameState;
  score: number;
  timeLeft: number;
  taps: number[];
  feedback: boolean;
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
      };
    case "TAP":
      if (state.gameState !== GameState.Running) return state;
      return {
        ...state,
        score: state.score + 1,
        taps: [...state.taps, action.timestamp],
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
      };
    case "END_FEEDBACK":
      return { ...state, feedback: false };
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
  });

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
      <ScoreCounter score={state.score} />
      <GameTimer duration={state.timeLeft} onComplete={handleEnd} running={state.gameState === GameState.Running} />
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
          <button className="btn btn-secondary mt-2" onClick={handleReset}>
            Play Again
          </button>
        </>
      )}
      <GameFeedback trigger={state.feedback} type="visual" />
    </div>
  );
};

export default GameEngine;
