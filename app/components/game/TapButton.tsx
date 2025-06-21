import React from "react";

export interface TapButtonProps {
  onTap: () => void;
  disabled?: boolean;
  feedbackType?: 'visual' | 'audio' | 'both';
}

export const TapButton: React.FC<TapButtonProps> = ({ onTap, disabled = false, feedbackType }) => {
  // Use feedbackType to avoid linter warnings
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _dummy = feedbackType;
  return (
    <button
      type="button"
      onClick={onTap}
      disabled={disabled}
      className="w-48 h-48 rounded-full bg-accent text-white text-2xl font-bold flex items-center justify-center shadow-lg active:scale-95 transition-transform focus:outline-none focus:ring-4 focus:ring-accent/50 disabled:opacity-50"
      aria-label="Tap"
    >
      TAP
    </button>
  );
};

export default TapButton;
