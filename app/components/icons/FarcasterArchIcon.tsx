import React from 'react';

interface FarcasterArchIconProps {
  className?: string;
}

export const FarcasterArchIcon: React.FC<FarcasterArchIconProps> = ({ className = '' }) => (
  <svg 
    className={`w-5 h-5 ${className}`} 
    viewBox="0 0 24 24" 
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Farcaster Arch logo simplified */}
    <path d="M5 7.5C5 6.11929 6.11929 5 7.5 5H16.5C17.8807 5 19 6.11929 19 7.5V16.5C19 17.8807 17.8807 19 16.5 19H7.5C6.11929 19 5 17.8807 5 16.5V7.5Z" />
    <path d="M8 10V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M16 10V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 10V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 7V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M16 7V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default FarcasterArchIcon;
