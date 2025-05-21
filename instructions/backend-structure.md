# KissMint Game Backend Structure

## Current Backend Architecture

### Overview

The KissMint Game backend is designed to support a high-performance button-tapping game with token integration, leaderboards, and anti-cheat functionality. The architecture uses a combination of serverless functions, Turso database, and blockchain integration to achieve scalability, security, and responsiveness required for the game's mechanics.

### Tech Stack Components

- **Node.js**: Server-side JavaScript runtime
- **Express.js**: Web framework for API endpoints
- **Turso**: SQLite-based database for game state, user profiles, and leaderboards
- **Redis**: In-memory cache for high-performance leaderboard and game session data
- **Vercel Functions**: Serverless compute for API functions
- **Base Network**: Layer 2 Ethereum blockchain for $GLICO token transactions
- **Base Mini-kit**: Integration with Farcaster platform and Frames

### System Architecture Diagram

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│               │     │               │     │               │
│  Farcaster    │────▶│  Frontend     │────▶│  Vercel       │
│  Mini App     │     │  (Next.js)    │     │  Functions    │
│               │     │               │     │               │
└───────────────┘     └───────────────┘     └───────┬───────┘
                                                    │
                                                    ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│               │     │               │     │               │
│  Base Network │◀───▶│  Smart        │◀───▶│  API          │
│  ($GLICO)     │     │  Contracts    │     │  Endpoints    │
│               │     │               │     │               │
└───────────────┘     └───────────────┘     └───────┬───────┘
                                                    │
                                                    ▼
                                            ┌───────────────┐
                                            │               │
                                            │  Turso        │
                                            │  Database     │
                                            │               │
                                            └───────┬───────┘
                                                    │
                                                    ▼
                                            ┌───────────────┐
                                            │               │
                                            │  Redis Cache  │
                                            │               │
                                            └───────────────┘
```

## Data Models

### Game Session Data Model

```sql
-- Game session model (Turso)
CREATE TABLE game_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  session_end TIMESTAMP,
  score INTEGER,
  attempt_type TEXT CHECK (attempt_type IN ('free', 'paid')),
  verification_data JSON,  -- Stores tap timestamps, avg interval, variance, etc.
  risk_score REAL,         -- 0-1 risk assessment score
  verified BOOLEAN DEFAULT FALSE,
  submitted_to_leaderboard BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for user queries
CREATE INDEX idx_game_sessions_user_id ON game_sessions(user_id);
```

### User Profile Data Model

```sql
-- User profile model (Turso)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  fid INTEGER UNIQUE NOT NULL,  -- Farcaster FID
  username TEXT,
  wallet_addresses JSON,        -- Array of connected wallet addresses
  glico_balance INTEGER DEFAULT 0,
  attempts_remaining INTEGER DEFAULT 2,
  attempt_refresh_time TIMESTAMP,
  streak_count INTEGER DEFAULT 0,
  last_played_at TIMESTAMP,
  high_score INTEGER DEFAULT 0,
  lifetime_tap_count INTEGER DEFAULT 0,
  risk_factor REAL DEFAULT 0,   -- Accumulated risk assessment
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for Farcaster ID
CREATE INDEX idx_users_fid ON users(fid);
```

### Leaderboard Data Model

```sql
-- Leaderboard entry model (Turso)
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (game_session_id) REFERENCES game_sessions(id)
);

-- Indexes for efficient querying
CREATE INDEX idx_leaderboard_board_type ON leaderboard_entries(board_type);
CREATE INDEX idx_leaderboard_score ON leaderboard_entries(score DESC);
CREATE INDEX idx_leaderboard_user_id ON leaderboard_entries(user_id);
```

### Token Transaction Data Model

```sql
-- Token transaction model (Turso)
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Index for user queries
CREATE INDEX idx_token_transactions_user_id ON token_transactions(user_id);
```aps
    variance: Number,            // Statistical variance of intervals
    deviceFingerprint: String,   // Unique device identifier
    clientHash: String           // Integrity hash from client
  },
  riskScore: Number,             // 0-1 risk assessment score
  verified: Boolean,             // Whether the score has been verified
  submittedToLeaderboard: Boolean, // Whether score was added to leaderboard
  createdAt: Date,               // Record creation timestamp
  updatedAt: Date                // Record update timestamp
}
```

### User Profile Data Model

```javascript
// User profile model (MongoDB)
{
  _id: ObjectId,                 // Unique user ID
  fid: Number,                   // Farcaster FID
  username: String,              // Farcaster username
  walletAddresses: [String],     // Connected wallet addresses
  glicoBalance: Number,          // Current $GLICO token balance
  attemptsRemaining: Number,     // Free attempts remaining
  attemptRefreshTime: Date,      // Next attempt refresh time
  streakCount: Number,           // Consecutive days played
  lastPlayedAt: Date,            // Last gameplay timestamp
  highScore: Number,             // All-time high score
  lifetimeTapCount: Number,      // Total taps across all sessions
  riskFactor: Number,            // Accumulated risk assessment
  createdAt: Date,               // Profile creation timestamp
  updatedAt: Date                // Profile update timestamp
}
```

### Leaderboard Data Model

```javascript
// Leaderboard entry model (MongoDB)
{
  _id: ObjectId,                 // Unique entry ID
  userId: String,                // Farcaster FID
  username: String,              // Farcaster username
  score: Number,                 // Score (tap count)
  gameSessionId: ObjectId,       // Reference to game session
  achievedAt: Date,              // When the score was achieved
  rank: Number,                  // Current rank on leaderboard
  boardType: String,             // "daily", "weekly", or "all-time"
  verified: Boolean,             // Whether score has been verified
  createdAt: Date,               // Entry creation timestamp
  updatedAt: Date                // Entry update timestamp
}
```

### Token Transaction Data Model

```javascript
// Token transaction model (MongoDB)
{
  _id: ObjectId,                 // Unique transaction ID
  userId: String,                // Farcaster FID
  transactionType: String,       // "purchase", "reward", "airdrop"
  amount: Number,                // $GLICO amount
  transactionHash: String,       // Blockchain transaction hash
  attemptsPurchased: Number,     // Number of attempts purchased (if purchase)
  rewardReason: String,          // Reason for reward (if reward)
  status: String,                // "pending", "completed", "failed"
  createdAt: Date,               // Transaction creation timestamp
  updatedAt: Date                // Transaction update timestamp
}
```

## API Endpoints

### Game Endpoints

```
POST /api/game/session/start
- Starts a new game session
- Verifies user has attempts remaining
- Returns session ID and timestamp

POST /api/game/session/end
- Ends a game session
- Accepts score and verification data
- Performs initial verification
- Returns verification status

POST /api/game/score/submit
- Submits a verified score to the leaderboard
- Validates score against session data
- Returns updated leaderboard position
```

### Leaderboard Endpoints

```
GET /api/leaderboard/daily
- Returns daily leaderboard
- Supports pagination
- Can filter by user's connections

GET /api/leaderboard/weekly
- Returns weekly leaderboard
- Supports pagination
- Can filter by user's connections

GET /api/leaderboard/all-time
- Returns all-time leaderboard
- Supports pagination
- Can filter by user's connections

GET /api/leaderboard/user/:fid
- Returns a specific user's rankings
- Includes daily, weekly, all-time position
```

### Token Endpoints

```
GET /api/token/balance/:fid
- Returns user's current $GLICO balance
- Includes transaction history summary

POST /api/token/purchase/attempt
- Initiates a purchase for additional attempts
- Verifies wallet connection and balance
- Returns transaction status

POST /api/token/claim/reward
- Claims rewards from leaderboard performance
- Verifies eligibility
- Returns reward amount and transaction status
```

### User Endpoints

```
GET /api/user/profile/:fid
- Returns user profile data
- Includes attempts remaining and streak info

GET /api/user/attempts/:fid
- Returns attempts remaining and refresh time
- Used for displaying attempt status

POST /api/user/connect-wallet
- Associates a wallet address with user
- Verifies ownership through signature
- Returns updated user profile
```

## Anti-Cheat Implementation

### Client-Side Collection

The client-side implementation collects the following data during gameplay:

```javascript
// Client-side data collection
const gameplayData = {
  // Tap timestamps with high-precision timing
  tapTimestamps: [], // Filled during gameplay with performance.now() values
  
  // Device information
  deviceInfo: {
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      colorDepth: window.screen.colorDepth,
      pixelDepth: window.screen.pixelDepth
    },
    navigator: {
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      language: navigator.language,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory
    }
  },
  
  // Performance metrics
  performance: {
    jsHeapSizeLimit: performance.memory ? performance.memory.jsHeapSizeLimit : null,
    totalJSHeapSize: performance.memory ? performance.memory.totalJSHeapSize : null,
    usedJSHeapSize: performance.memory ? performance.memory.usedJSHeapSize : null
  },
  
  // Game session information
  sessionStart: Date.now(),
  sessionEnd: null, // Filled at end of gameplay
  finalScore: null, // Filled at end of gameplay
  
  // Integrity hash (combination of above data with a secret key)
  integrityHash: null // Generated before submission
};
```

### Server-Side Verification

The server implements a multi-layered verification process:

1. **Statistical Analysis**
   - Calculate average tap interval and variance
   - Compare with human baseline metrics
   - Flag impossibly fast or suspiciously consistent tapping

2. **Anomaly Detection**
   - Compare with user's historical performance
   - Identify sudden, unexplained improvements
   - Check for pattern recognition against known cheat methods

3. **Device Fingerprinting**
   - Track devices used by each user
   - Detect multiple accounts using the same device
   - Identify emulators or automation tools

4. **Progressive Risk Scoring**
   - Assign risk scores based on multiple factors
   - Apply increasing scrutiny to high-risk users
   - Implement escalating responses to suspected cheating

### Risk Score Calculation

The risk scoring system uses the following formula:

```javascript
function calculateRiskScore(gameData, userHistory) {
  let riskScore = 0;
  
  // Check for impossibly fast tapping
  const avgInterval = calculateAverageInterval(gameData.tapTimestamps);
  if (avgInterval < PHYSICAL_MINIMUM_INTERVAL) {
    riskScore += 0.5; // Major red flag
  }
  
  // Check for inhuman consistency
  const variance = calculateVariance(gameData.tapTimestamps);
  if (variance < HUMAN_MINIMUM_VARIANCE) {
    riskScore += 0.4; // Major red flag
  }
  
  // Check for anomalous improvement
  const improvementFactor = calculateImprovementFactor(gameData.finalScore, userHistory.averageScore);
  if (improvementFactor > SUSPICIOUS_IMPROVEMENT_THRESHOLD) {
    riskScore += 0.3; // Significant red flag
  }
  
  // Check for suspicious device characteristics
  if (detectEmulator(gameData.deviceInfo)) {
    riskScore += 0.2; // Potential red flag
  }
  
  // Additional checks as needed...
  
  return Math.min(riskScore, 1.0); // Cap at 1.0
}
```

### Enforcement Actions

Based on risk scores, the system implements the following enforcement actions:

```javascript
function determineEnforcementAction(riskScore, previousViolations) {
  if (riskScore < 0.3) {
    return {
      action: 'ALLOW',
      reason: 'Score within normal parameters'
    };
  } else if (riskScore < 0.6) {
    return {
      action: 'FLAG',
      reason: 'Suspicious activity detected',
      restrictions: previousViolations > 0 ? ['LEADERBOARD_RESTRICT'] : []
    };
  } else if (riskScore < 0.8) {
    return {
      action: 'RESTRICT',
      reason: 'Highly suspicious activity detected',
      restrictions: ['LEADERBOARD_RESTRICT', 'REWARD_WITHHOLD']
    };
  } else {
    return {
      action: 'BLOCK',
      reason: 'Confirmed cheating detected',
      restrictions: ['GAME_BLOCK', 'LEADERBOARD_REMOVE', 'REWARD_FORFEIT']
    };
  }
}