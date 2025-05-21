import React from "react";

export interface ScoreCounterProps {
  score: number;
}

export const ScoreCounter: React.FC<ScoreCounterProps> = ({ score }) => (
  <div className="text-4xl font-extrabold text-center text-accent drop-shadow">
    {score}
  </div>
);

export default ScoreCounter;
