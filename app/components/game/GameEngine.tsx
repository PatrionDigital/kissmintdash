import React, { useState } from "react";
import TapButton from "./TapButton";
import GameTimer from "./GameTimer";
import ScoreCounter from "./ScoreCounter";
import GameFeedback from "./GameFeedback";

export const GameEngine: React.FC<{ initialGameState?: 'idle' | 'running' | 'finished' }> = ({ initialGameState = 'idle' }) => {
  // Scaffolded state
  const [gameState, setGameState] = useState<'idle' | 'running' | 'finished'>(initialGameState);
  const [score, setScore] = useState(0);
  const [tapTimestamps, setTapTimestamps] = useState<number[]>([]);
  const [timer, setTimer] = useState(10); // seconds
  const [feedback, setFeedback] = useState(false);
  // Use tapTimestamps and setTimer to avoid linter warnings
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _dummy = [tapTimestamps, setTimer];

  // Placeholder handlers
  const handleTap = () => {
    setScore(s => s + 1);
    setTapTimestamps(ts => [...ts, Date.now()]);
    setFeedback(true);
    setTimeout(() => setFeedback(false), 200);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <ScoreCounter score={score} />
      <GameTimer duration={timer} onComplete={() => setGameState('finished')} running={gameState === 'running'} />
      <TapButton onTap={handleTap} disabled={gameState !== 'running'} />
      <GameFeedback trigger={feedback} type="visual" />
    </div>
  );
};

export default GameEngine;
