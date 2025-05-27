# KissMint Game Frontend Guidelines

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Code Structure](#code-structure)
4. [Component Guidelines](#component-guidelines)
5. [State Management](#state-management)
6. [Styling Approach](#styling-approach)
7. [Game Performance](#game-performance)
8. [Input Handling](#input-handling)
9. [Animation Guidelines](#animation-guidelines)
10. [Error Handling](#error-handling)
11. [Performance Optimization](#performance-optimization)
12. [Responsive Design](#responsive-design)
13. [Accessibility](#accessibility)
14. [Testing](#testing)
15. [Farcaster Frame Integration](#farcaster-frame-integration)
16. [Web3 Integration](#web3-integration)

## Project Overview

KissMint DASH: Tap Runner '99 is a button-tapping game built on Farcaster, allowing users to tap a button as many times as possible in 25 seconds. The game features leaderboards, $GLICO token integration, and social sharing via Farcaster Frames.

### Key Features

- 25-second rapid button-tapping challenge
- Global leaderboard competition
- $GLICO token integration for purchases and rewards
- Anti-cheat system
- Farcaster Frame integration for social sharing

## Tech Stack

### Core Libraries and Frameworks

- **React 18+** - UI library
- **Next.js** - React framework
- **TailwindCSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **React Hook Form** - Form handling
- **Farcaster SDK** - Farcaster integration
- **ethers.js/wagmi** - Blockchain integration
- **Rainbow Kit** - Wallet connection UI
- **Sonner** - Toast notifications

### Styling

- TailwindCSS for utility-based styling
- CSS Modules for component-specific styles
- Custom design system based on the "Tap Fast, Run Far, Mint Glory" branding

## Toast Notifications

### Implementation

We use Sonner for displaying toast notifications throughout the application. To use toasts:

1. **Setup**: The Toaster is already configured in the root layout.

   ```tsx
   import { Toaster } from 'sonner';
   
   // In your layout component
   <Toaster position="bottom-center" />
   ```

2. **Basic Usage**: Import and use the `toast` function anywhere in your components.

   ```tsx
   import { toast } from 'sonner';
   
   // Success toast
   toast.success('Operation completed successfully');
   
   // Error toast
   toast.error('An error occurred');
   
   // Loading toast
   const toastId = toast.loading('Loading...');
   // Later...
   toast.dismiss(toastId);
   ```

3. **Best Practices**:
   - Use for non-critical notifications that don't require user action
   - Keep messages concise and actionable
   - Use appropriate toast types (success, error, loading, etc.)
   - For critical errors or actions requiring confirmation, consider using a modal instead

### State Management

- **React Context API** for global state
- **React Query** for server state management
- **Local state** for component-specific state
- **Redux** (if needed for complex state management)
- **Zustand** (as a lightweight alternative to Redux)

## Code Structure

### Directory Structure

```dir
src/
├── assets/               # Static assets like images, sounds
├── components/           # Reusable UI components
│   ├── game/             # Game-specific components
│   ├── leaderboard/      # Leaderboard components
│   ├── token/            # Token-related components
│   └── ui/               # Generic UI components
├── context/              # React context providers
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
│   ├── anti-cheat/       # Anti-cheat utilities
│   ├── farcaster/        # Farcaster integration utilities
│   └── token/            # Token integration utilities
├── pages/                # Next.js pages
├── services/             # API services
├── styles/               # Global styles
└── types/                # TypeScript type definitions
```

## Component Guidelines

### Component Creation

1. **Use functional components** with hooks instead of class components
2. **Component file naming**: Use PascalCase (e.g., `TapButton.jsx`)
3. **Create specific directories** for related component groups
4. **Use TypeScript** for type safety

### PropTypes and TypeScript

- Define interface for component props
- Use proper typing for all functions and variables
- Example:

```tsx
interface TapButtonProps {
  onTap: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const TapButton: React.FC<TapButtonProps> = ({ 
  onTap, 
  disabled = false, 
  size = 'md' 
}) => {
  // Component implementation
};

export default TapButton;
```

### Component Structure

- Import statements at the top, grouped by category
- Component definition
- Helper functions within the component scope
- Export statement

Example:

```tsx
// External imports
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Internal imports
import { useTapCounter } from '../hooks/useTapCounter';
import { analyzeClickPattern } from '../lib/anti-cheat/patternAnalyzer';

// Types
interface TapButtonProps {
  onTap: () => void;
  disabled?: boolean;
}

const TapButton: React.FC<TapButtonProps> = ({ onTap, disabled = false }) => {
  // State
  const [isPressed, setIsPressed] = useState(false);
  const { count, incrementCount } = useTapCounter();

  // Effects
  useEffect(() => {
    // Effect implementation
  }, [count]);

  // Event handlers
  const handleTap = () => {
    setIsPressed(true);
    incrementCount();
    onTap();
    
    // Anti-cheat pattern analysis
    analyzeClickPattern(new Date().getTime());
    
    setTimeout(() => setIsPressed(false), 100);
  };

  // Render
  return (
    <motion.button
      className={`tap-button ${isPressed ? 'pressed' : ''}`}
      whileTap={{ scale: 0.95 }}
      onClick={handleTap}
      disabled={disabled}
    >
      TAP!
    </motion.button>
  );
};

export default TapButton;
```

## State Management

### State Management Guidelines

1. Use React hooks for component-level state (`useState`, `useReducer`)
2. Use Context API for global state with custom hooks for access
3. Split context providers by domain (GameContext, LeaderboardContext, TokenContext)
4. Use React Query for server-state management

### Context Creation Pattern

```tsx
// Context definition
import { createContext, useState, useContext, ReactNode } from 'react';

interface GameContextProps {
  score: number;
  timeRemaining: number;
  isGameActive: boolean;
  incrementScore: () => void;
  startGame: () => void;
  endGame: () => void;
}

const GameContext = createContext<GameContextProps | undefined>(undefined);

// Provider component
export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(25);
  const [isGameActive, setIsGameActive] = useState(false);
  
  const incrementScore = () => {
    setScore((prev) => prev + 1);
  };
  
  const startGame = () => {
    setScore(0);
    setTimeRemaining(25);
    setIsGameActive(true);
    
    // Start timer
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsGameActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  const endGame = () => {
    setIsGameActive(false);
  };
  
  return (
    <GameContext.Provider 
      value={{ 
        score, 
        timeRemaining, 
        isGameActive, 
        incrementScore, 
        startGame, 
        endGame 
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

// Custom hook
export const useGame = (): GameContextProps => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
```

## Styling Approach

### TailwindCSS Usage

- Use utility classes for most styling needs
- Create custom utility classes for repeated patterns
- Maintain consistent spacing and sizing using Tailwind's scale

### CSS Variables

```css
:root {
  /* Brand Colors */
  --color-mint-green: #3DFFC0;
  --color-bubblegum-pink: #FF6EB3;
  --color-electric-blue: #00C2FF;
  --color-cyber-yellow: #FFE94A;
  
  /* Typography */
  --font-pixel: 'Press Start 2P', monospace;
  --font-body: 'Inter', sans-serif;
  
  /* Game Elements */
  --tap-button-shadow: 0 6px 0 #00796B;
  --tap-button-active-shadow: 0 2px 0 #00796B;
  
  /* Animation Speeds */
  --animation-fast: 100ms;
  --animation-medium: 250ms;
  --animation-slow: 500ms;
}
```

### Component-Specific CSS

For complex styling that goes beyond Tailwind's capabilities, use CSS modules:

```tsx
// TapButton.module.css
.tapButton {
  position: relative;
  transition: transform var(--animation-fast) ease-in-out;
}

.tapButton:active {
  transform: translateY(4px);
  box-shadow: var(--tap-button-active-shadow);
}

// TapButton.tsx
import styles from './TapButton.module.css';

const TapButton = () => {
  return (
    <button 
      className={`bg-mint-green text-white rounded-full px-8 py-4 font-pixel ${styles.tapButton}`}
      onClick={handleTap}
    >
      TAP!
    </button>
  );
};
```

## Game Performance

### Performance Guidelines

1. **Prioritize tap responsiveness** - minimize latency between tap and feedback
2. **Optimize render cycle** - prevent unnecessary re-renders during rapid tapping
3. **Use `requestAnimationFrame`** for smooth animations
4. **Minimize main thread blocking** - offload heavy calculations
5. **Debug performance issues** with React Profiler

### Tap Handling Optimization

```tsx
const TapButton = () => {
  // Use useCallback to prevent recreation on each render
  const handleTap = useCallback(() => {
    // Update state in batches
    setScore(s => s + 1);
    
    // Use requestAnimationFrame for visual feedback
    requestAnimationFrame(() => {
      // Visual feedback code
    });
    
    // Log timestamp for anti-cheat
    const timestamp = performance.now();
    tapTimestamps.current.push(timestamp);
  }, []);
  
  return <button onClick={handleTap}>TAP!</button>;
};
```

## Input Handling

### Tap Detection Best Practices

1. **Support multiple input methods** - touch, mouse, keyboard
2. **Prevent double registrations** - debounce or throttle where necessary
3. **Optimize for mobile touch** - use touch events for better performance
4. **Add visual and audio feedback** on successful tap
5. **Record high-resolution timestamps** for anti-cheat verification

### Input Implementation

```tsx
const TapArea = () => {
  const handleTap = (e) => {
    // Prevent default behavior
    e.preventDefault();
    
    // Record high-precision timestamp
    const timestamp = performance.now();
    
    // Increment score
    incrementScore();
    
    // Play feedback sound
    playTapSound();
    
    // Show visual feedback
    showTapFeedback();
    
    // Log for anti-cheat
    recordTapForAntiCheat(timestamp);
  };
  
  return (
    <div 
      className="tap-area"
      onClick={handleTap}
      onTouchStart={handleTap}
      onKeyDown={(e) => e.key === ' ' && handleTap(e)}
      tabIndex={0}
      role="button"
      aria-label="Tap button"
    >
      TAP!
    </div>
  );
};
```

## Animation Guidelines

### Animation Principles

1. **Fast feedback** - animations should be quick (100ms or less) for tap response
2. **Subtle effects** - avoid distracting animations during gameplay
3. **Reward animations** - use more elaborate animations for achievements
4. **Performance first** - avoid CPU-intensive animations during rapid tapping
5. **Consistent theme** - animations should match the '90s arcade aesthetic

### Animation Implementation with Framer Motion

```tsx
const TapButton = () => {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 1 }}
      transition={{ duration: 0.1 }}
      className="tap-button"
      onClick={handleTap}
    >
      TAP!
    </motion.button>
  );
};

const ScoreIncrement = ({ score }) => {
  return (
    <motion.div
      key={score} // Force re-render on score change
      initial={{ y: 0, opacity: 1 }}
      animate={{ y: -20, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="score-pop"
    >
      +1
    </motion.div>
  );
};
```

## Error Handling

### Error Handling Best Practices

1. **Graceful fallbacks** for network errors
2. **Retry mechanisms** for transient failures
3. **User-friendly error messages**
4. **Error boundaries** to prevent game crashes
5. **Offline support** where possible

### Error Boundary Example

```tsx
import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Game component error:', error, errorInfo);
    // Log to monitoring service
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-screen">
          <h2>Oops! Something went wrong.</h2>
          <button onClick={() => window.location.reload()}>Restart Game</button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

## Performance Optimization

### Performance Strategies

1. **Memoize components** with React.memo for expensive renders
2. **Use `useCallback`** for event handlers
3. **Implement virtualization** for leaderboards with many entries
4. **Optimize images** using Next.js Image component
5. **Lazy load non-critical components**

### Optimized Rendering Example

```tsx
import { memo, useCallback, useMemo } from 'react';

const LeaderboardRow = memo(({ player, rank, score }) => {
  // Expensive calculation
  const formattedScore = useMemo(() => {
    return new Intl.NumberFormat().format(score);
  }, [score]);
  
  return (
    <div className="leaderboard-row">
      <span className="rank">{rank}</span>
      <span className="player">{player}</span>
      <span className="score">{formattedScore}</span>
    </div>
  );
});

// Parent component
const Leaderboard = ({ entries }) => {
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => b.score - a.score);
  }, [entries]);
  
  return (
    <div className="leaderboard">
      {sortedEntries.map((entry, index) => (
        <LeaderboardRow
          key={entry.id}
          player={entry.player}
          rank={index + 1}
          score={entry.score}
        />
      ))}
    </div>
  );
};