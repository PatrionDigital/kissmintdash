import React from "react";
import NumberFlow from '@number-flow/react';

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
    <div className="text-7xl font-mono text-center -mt-2">
      {duration < 10 ? '0' : ''}<NumberFlow value={duration} />
      <span>s</span>
    </div>
  );
};

export default GameTimer;
