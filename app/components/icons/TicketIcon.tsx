import React from 'react';

interface TicketIconProps {
  className?: string;
  size?: number;
}

export const TicketIcon: React.FC<TicketIconProps> = ({ 
  className = '',
  size = 24 
}) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 9a3 3 0 0 1 0-6v0a5 5 0 0 0 4.5 5.5 3 3 0 0 1 0 6 5 5 0 0 0-4.5 5.5v0a3 3 0 0 1 0-6V9z" />
      <path d="M12 9V5l5-3v4.5a2.5 2.5 0 0 0 0 5V22l-5-3v-4" />
      <path d="M12 9v4" />
    </svg>
  );
};

export default TicketIcon;
