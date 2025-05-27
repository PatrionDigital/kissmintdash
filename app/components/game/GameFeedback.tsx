import React from "react";

export interface GameFeedbackProps {
  trigger: boolean;
  type?: 'visual' | 'audio' | 'both';
}

export const GameFeedback: React.FC<GameFeedbackProps> = ({ trigger, type = 'visual' }) => {
  // Use type to avoid linter warnings
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _dummy = type;
  // Placeholder: implement feedback effect later
  return trigger ? (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
      <div className="animate-ping w-32 h-32 rounded-full bg-accent opacity-50" />
    </div>
  ) : null;
};

export default GameFeedback;
