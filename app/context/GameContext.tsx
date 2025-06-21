"use client";

import React, { createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { GameState } from '../components/game/types';

type GameContextType = {
  gameState: GameState;
  isGameRunning: boolean;
  setGameState: (state: GameState) => void;
};

// Default state values
const DEFAULT_GAME_STATE = 'idle' as const;

// Create a safe default context
const createDefaultContext = (): GameContextType => {
  // This will be replaced by the provider's state
  return {
    gameState: GameState?.Idle ?? DEFAULT_GAME_STATE as unknown as GameState,
    isGameRunning: false,
    setGameState: () => {},
  };
};

const defaultContext = createDefaultContext();

export const GameContext = createContext<GameContextType>(defaultContext);

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [gameState, setGameState] = React.useState<GameState>(GameState.Idle);
  
  const isGameRunning = gameState === GameState.Running || gameState === GameState.Countdown;

  const updateGameState = useCallback((state: GameState) => {
    setGameState(state);
  }, []);

  const value = useMemo(() => ({
    gameState,
    isGameRunning,
    setGameState: updateGameState,
  }), [gameState, isGameRunning, updateGameState]);

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};
