import React from "react";
import { Display } from "./Display";


export interface ScoreCounterProps {
  score: number;
}

export const ScoreCounter: React.FC<ScoreCounterProps> = ({ score }) => (
  <div className="flex items-center justify-center text-3xl font-extrabold text-center text-accent drop-shadow -mt-6 -mb-3">
    {/* @ts-expect-error: Display expects a different prop type */}
    <Display value={score.toString().padStart(3, '0')} color="lime" height={64} count={3} backgroundColor="transparent" />
  </div>
);

export default ScoreCounter;
