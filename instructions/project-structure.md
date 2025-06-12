# KissMint DASH: Tap Runner '99 - Technical Architecture & Project Structure

## Project Overview

**Game Name:** KissMint DASH: Tap Runner '99  
**Platform:** Farcaster Mini App  
**Concept:** Players press a button as many times as possible in 25 seconds, competing for the highest score on the leaderboard.

**Main Tagline:** "Tap Fast, Run Far, Mint Glory"

## Core Technologies

### Development Environment

- **Operating Systems:** macOS and Ubuntu Linux
- **IDE:** VSCode with essential plugins:
  - ESLint, Prettier
  - GitLens
  - Tailwind CSS IntelliSense
  - Solidity
  - JavaScript and TypeScript Nightly
- **Version Control:** GitHub with CI/CD
- **Local Testing:** ngrok for Farcaster integration testing

### Frontend Framework

- **React 18+** - UI library with TypeScript
- **Next.js** - Framework for SSR and optimized builds
- **TailwindCSS** - Utility-first CSS framework
- **Framer Motion** - Animation library for smooth transitions
- **React Hook Form** - Form handling and validation

### Farcaster Integration

- **MiniKit** - Primary integration for Farcaster Mini App development
- **OnchainKit** - Coinbase's toolkit (includes viem as dependency)
- **Farcaster SDK** - Additional authentication features

### Blockchain Integration Stack

#### **CRITICAL: Prize Disbursement - Coinbase Wallet API v2**

- **Purpose:** Exclusive for prize distribution to winners
- **Implementation:** Coinbase Wallet API v2
- **Separation:** Must be completely isolated from other blockchain operations
- **Usage:** Automated prize disbursement only

#### **Onchain Operations - Viem (via OnchainKit)**

- **Purpose:** General blockchain interactions (token balance checks, user transactions)
- **Implementation:** Viem (included as dependency of OnchainKit)
- **Source:** Provided through MiniKit's OnchainKit integration
- **Usage:** All non-prize blockchain operations

#### **Additional Blockchain Tools**

- **wagmi** - React hooks for Ethereum/Web3 functionality
- **Base Network** - Primary blockchain for $GLICO token

### Backend & Data Management

- **Node.js** - Server-side JavaScript runtime
- **Vercel Functions** - Serverless functions for API endpoints
- **Turso (SQLite)** - Primary database for game state and user data
- **Redis** - In-memory caching for real-time leaderboard updates

### Game Analytics & Anti-Cheat

- **Custom Analytics Engine** - Gameplay metrics tracking
- **Statistical Analysis Engine** - Anomaly detection in gameplay
- **Pattern Recognition System** - Suspicious tap pattern identification
- **Performance Benchmarking** - Baseline metrics establishment
- **Risk Scoring System** - Submission legitimacy evaluation

### Testing & Quality Assurance

- **Vitest** - Primary unit, integration testing framework
- **React Testing Library** - Component testing (with Vitest)
- **Lighthouse** - Performance testing
- **WebPageTest** - Tap response latency measurement

### DevOps & Deployment

- **GitHub Actions** - CI/CD pipelines
- **Vercel** - Frontend hosting and serverless functions

## Project Structure

### Directory Organization

```dir
kissmint-game/
├── contracts/                 # Smart contracts for $GLICO token
├── public/                   # Static assets
├── src/
│   ├── assets/               # Game assets (images, sounds)
│   ├── components/           # Reusable UI components
│   │   ├── game/             # Game-specific components
│   │   ├── leaderboard/      # Leaderboard components
│   │   ├── token/            # Token-related components
│   │   └── ui/               # General UI components
│   ├── context/              # React context providers
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility functions
│   │   ├── anti-cheat/       # Anti-cheat utilities
│   │   ├── farcaster/        # Farcaster integration utilities
│   │   ├── blockchain/       # General blockchain utilities (viem)
│   │   └── coinbase/         # Coinbase Wallet API v2 (PRIZE ONLY)
│   ├── pages/                # Next.js pages
│   ├── services/             # API services
│   ├── store/                # State management
│   ├── styles/               # Global styles
│   └── types/                # TypeScript type definitions
├── api/                      # Backend API functions
│   ├── game/                 # Game-related endpoints
│   ├── leaderboard/          # Leaderboard endpoints
│   ├── auth/                 # Authentication endpoints
│   ├── token/                # Token transaction endpoints
│   └── prizes/               # Prize disbursement (Coinbase API v2)
├── scripts/                  # Deployment and utility scripts
└── tests/                    # Test files
```

## Technical Architecture Implementation

### Frontend Architecture

#### Core Components

- **TapButton.tsx** - Main interactive button with optimized tap detection
- **GameTimer.tsx** - 25-second countdown with NumberFlow animation
- **ScoreDisplay.tsx** - Real-time score with react-7-segment-display
- **GameScreen.tsx** - Main game container with state management
- **ResultScreen.tsx** - Post-game results and submission interface

#### State Management

```tsx
// Game Context Provider
interface GameContextProps {
  score: number;
  timeRemaining: number;
  isGameActive: boolean;
  attemptsRemaining: number;
  incrementScore: () => void;
  startGame: () => void;
  endGame: () => void;
}

const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(25);
  const [isGameActive, setIsGameActive] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(2);

  // Implementation details...

  return (
    <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>
  );
};
```

### Backend Architecture

#### Database Models (Turso/SQLite)

```sql
-- Game session model
CREATE TABLE game_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  session_end TIMESTAMP,
  score INTEGER,
  attempt_type TEXT CHECK (attempt_type IN ('free', 'paid')),
  verification_data JSON,
  risk_score REAL,
  verified BOOLEAN DEFAULT FALSE,
  submitted_to_leaderboard BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User profile model
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  fid INTEGER UNIQUE NOT NULL,
  username TEXT,
  wallet_addresses JSON,
  glico_balance INTEGER DEFAULT 0,
  attempts_remaining INTEGER DEFAULT 2,
  attempt_refresh_time TIMESTAMP,
  streak_count INTEGER DEFAULT 0,
  last_played_at TIMESTAMP,
  high_score INTEGER DEFAULT 0,
  lifetime_tap_count INTEGER DEFAULT 0,
  risk_factor REAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leaderboard entries
CREATE TABLE leaderboard_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  score INTEGER NOT NULL,
  game_session_id TEXT NOT NULL,
  achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  rank INTEGER,
  board_type TEXT CHECK (board_type IN ('daily', 'weekly', 'all-time')),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (game_session_id) REFERENCES game_sessions(id)
);

-- Token transactions
CREATE TABLE token_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  transaction_type TEXT CHECK (transaction_type IN ('purchase', 'reward', 'airdrop')),
  amount INTEGER NOT NULL,
  transaction_hash TEXT,
  attempts_purchased INTEGER,
  reward_reason TEXT,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### API Endpoints Structure

```typescript
// Game endpoints
POST /api/game/session/start      // Start new game session
POST /api/game/session/end        // End session and submit score
POST /api/game/score/submit       // Submit verified score to leaderboard

// Leaderboard endpoints
GET /api/leaderboard/daily        // Daily rankings
GET /api/leaderboard/weekly       // Weekly rankings
GET /api/leaderboard/all-time     // All-time rankings
GET /api/leaderboard/user/:fid    // User's rankings

// Token endpoints (using viem via OnchainKit)
GET /api/token/balance/:fid       // Get $GLICO balance
POST /api/token/purchase/attempt  // Purchase additional attempts

// Prize endpoints (COINBASE WALLET API v2 ONLY)
POST /api/prizes/distribute       // Distribute prizes to winners
GET /api/prizes/status/:userId    // Check prize distribution status
```

### Blockchain Integration Architecture

#### **Prize Disbursement Layer (Coinbase Wallet API v2)**

```typescript
// lib/coinbase/prizeDistribution.ts
import { Coinbase, Wallet } from "@coinbase/coinbase-sdk";

// CRITICAL: This is ONLY for prize distribution
class PrizeDistributionService {
  private coinbase: Coinbase;
  private prizeWallet: Wallet;

  constructor() {
    this.coinbase = Coinbase.configureFromJson({
      filePath: "path/to/coinbase_cloud_api_key.json",
    });
  }

  async distributePrize(
    winnerAddress: string,
    amount: number,
  ): Promise<string> {
    // Prize distribution logic using Coinbase Wallet API v2
    const transfer = await this.prizeWallet.createTransfer({
      amount: amount,
      assetId: "GLICO", // $GLICO token
      destination: winnerAddress,
    });

    await transfer.wait();
    return transfer.getTransactionHash();
  }
}
```

#### **General Blockchain Operations (Viem via OnchainKit)**

```typescript
// lib/blockchain/tokenOperations.ts
import { createPublicClient, createWalletClient, http } from "viem";
import { base } from "viem/chains";

// All non-prize blockchain operations use viem
export class TokenService {
  private publicClient;
  private walletClient;

  constructor() {
    this.publicClient = createPublicClient({
      chain: base,
      transport: http(),
    });
  }

  async getTokenBalance(userAddress: string): Promise<bigint> {
    // Balance checking using viem
    return await this.publicClient.readContract({
      address: GLICO_TOKEN_ADDRESS,
      abi: GLICO_ABI,
      functionName: "balanceOf",
      args: [userAddress],
    });
  }

  async purchaseAttempts(
    userAddress: string,
    attemptCount: number,
  ): Promise<string> {
    // Purchase logic using viem
    // This handles user-initiated transactions, NOT prize distribution
  }
}
```

## Anti-Exploitation Implementation

### Client-Side Measures

- Click pattern analysis during gameplay
- Device fingerprinting for multiple account detection
- Performance benchmarking to establish baseline metrics
- Click interval variance tracking
- Integrity hash generation for game submissions

```typescript
// Pattern analysis implementation
interface ClickMetrics {
  avgInterval: number;
  variance: number;
  distribution: number[];
  consistencyScore: number;
}

function analyzeClickPatterns(clickTimestamps: number[]): ClickMetrics {
  const intervals: number[] = [];
  for (let i = 1; i < clickTimestamps.length; i++) {
    intervals.push(clickTimestamps[i] - clickTimestamps[i - 1]);
  }

  return {
    avgInterval: average(intervals),
    variance: calculateVariance(intervals),
    distribution: generateDistribution(intervals),
    consistencyScore: calculateConsistency(intervals),
  };
}
```

### Server-Side Verification

- Statistical analysis of game submissions
- Anomaly detection for suspicious scores
- Player performance curve tracking
- Risk scoring system
- Leaderboard verification for top percentile scores

```typescript
interface SubmissionResult {
  valid: boolean;
  riskScore?: number;
  reason?: string;
}

function evaluateSubmission(
  userId: string,
  submission: GameSubmission,
): SubmissionResult {
  let riskScore = 0;

  // Check for physically impossible scores
  if (submission.score > MAX_POSSIBLE) {
    return { valid: false, reason: "IMPOSSIBLE_SCORE" };
  }

  // Check for inhuman consistency
  if (submission.metrics.variance < MIN_HUMAN_VARIANCE) {
    riskScore += 0.4;
  }

  // Check for suspicious improvement
  const userHistory = getUserHistory(userId);
  if (isAnomalousImprovement(userHistory, submission.score)) {
    riskScore += 0.3;
  }

  // Trigger additional verification if needed
  if (riskScore > RISK_THRESHOLD) {
    flagForReview(userId, submission.gameId);
  }

  return { valid: true, riskScore };
}
```

### Progressive Enforcement

- Warning system for suspicious activity
- Temporary restrictions for repeat offenders
- Prize withholding pending verification for high-risk submissions
- Transparent appeal process

## Environment Variables

```env
# Farcaster & MiniKit
NEXT_PUBLIC_MINIKIT_PROJECT_ID=your_minikit_project_id
FARCASTER_DEVELOPER_SECRET=your_farcaster_developer_secret

# Blockchain (viem via OnchainKit)
NEXT_PUBLIC_ALCHEMY_ID=your_alchemy_id
NEXT_PUBLIC_WALLET_CONNECT_ID=your_wallet_connect_id
NEXT_PUBLIC_CONTRACT_ADDRESS=your_glico_contract_address

# CRITICAL: Coinbase Wallet API v2 (Prize Distribution ONLY)
COINBASE_API_KEY_NAME=your_coinbase_api_key_name
COINBASE_API_PRIVATE_KEY=your_coinbase_private_key

# Database
TURSO_DATABASE_URL=your_turso_url
TURSO_AUTH_TOKEN=your_turso_token
REDIS_URL=your_redis_url

# API
NEXT_PUBLIC_API_URL=your_api_url
```

## Success Metrics

### Engagement

- Daily active players
- Average attempts per player
- Streak retention rate
- Social shares per player

### Economic

- Token velocity
- Purchase frequency
- Prize pool growth
- Token holder retention

### Community

- User sentiment
- Feature requests
- Organic growth
- Community contributions

## Branding & Visual Identity

### Visual Elements

- **Color palette:** Mint green (#3DFFC0), bubblegum pink (#FF6EB3), electric blue (#00C2FF), cyber yellow (#FFE94A)
- **Typography:** Bold pixel fonts for headlines, clean sans-serif for readability
- **Effects:** Light static/noise effect for CRT/VHS feel
- **Iconography:** Running Man in various motion states, mint leaves, tap indicators

### Character Mascot

**"Minty"** - Anime-style girl with mint-green hair in pigtails, wearing 90s platform shoes and retro track suit with Running Man logo. Different outfits/poses based on player achievements.

### Audio Branding

3-5 note synthesizer jingle combining J-pop brightness with arcade energy, playing on successful taps or high scores.

## Critical Integration Notes

### **Coinbase Wallet API v2 - Prize Distribution Only**

- **Purpose:** Exclusive for automated prize distribution to winners
- **Separation:** Must be completely isolated from other blockchain operations
- **Security:** Requires separate credentials and access controls
- **Testing:** Needs dedicated test environment and procedures
- **Documentation:** Must be documented separately from general blockchain operations

### **Viem via OnchainKit - General Blockchain Operations**

- **Purpose:** All user-initiated blockchain interactions
- **Source:** Provided through MiniKit's OnchainKit dependency
- **Usage:** Token balance checks, user purchases, wallet connections
- **Integration:** Standard React hooks and components provided by OnchainKit

This separation ensures that prize distribution remains secure and automated while allowing users to interact with the blockchain through the standard MiniKit/OnchainKit interface.
