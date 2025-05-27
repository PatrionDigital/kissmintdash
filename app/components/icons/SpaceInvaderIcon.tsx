import React from 'react';

interface SpaceInvaderIconProps {
  className?: string;
}

export const SpaceInvaderIcon: React.FC<SpaceInvaderIconProps> = ({ className = '' }) => (
  <svg 
    className={`w-5 h-5 ${className}`} 
    viewBox="0 0 24 24" 
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Space Invader character - simple pixel art style */}
    <rect x="8" y="4" width="2" height="2" fill="currentColor" />
    <rect x="14" y="4" width="2" height="2" fill="currentColor" />
    <rect x="6" y="6" width="2" height="2" fill="currentColor" />
    <rect x="16" y="6" width="2" height="2" fill="currentColor" />
    <rect x="4" y="8" width="16" height="2" fill="currentColor" />
    <rect x="6" y="10" width="12" height="2" fill="currentColor" />
    <rect x="8" y="12" width="8" height="2" fill="currentColor" />
    <rect x="6" y="14" width="12" height="2" fill="currentColor" />
    <rect x="4" y="16" width="4" height="2" fill="currentColor" />
    <rect x="16" y="16" width="4" height="2" fill="currentColor" />
    <rect x="6" y="18" width="2" height="2" fill="currentColor" />
    <rect x="16" y="18" width="2" height="2" fill="currentColor" />
  </svg>
);

export default SpaceInvaderIcon;
