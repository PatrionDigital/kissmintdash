import React from "react";

export interface GameTimerProps {
  duration: number; // in seconds
  onComplete: () => void;
  running: boolean;
}

export const GameTimer: React.FC<GameTimerProps> = ({ duration, onComplete, running }) => {
  // Use all props to avoid linter warnings
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _dummy = [duration, onComplete, running];
  // Placeholder: implement timer logic later
  return (
    <div className="text-lg font-mono text-center">
      Timer: {duration}s
    </div>
  );
};

export default GameTimer;
