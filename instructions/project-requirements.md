# KissMint DASH: Tap Runner '99 - Project Requirements Document (PRD)

## Project Overview

**Game Name:** KissMint DASH: Tap Runner '99  
**Platform:** Farcaster Mini App  
**Concept:** Players press a button as many times as possible in 25 seconds, competing for the highest score on the leaderboard.

**Main Tagline:** "Tap Fast, Run Far, Mint Glory"

## Project Objectives

The project aims to create a web application called "KissMint DASH: Tap Runner '99" that allows users to participate in a simple button-tapping game on the Farcaster social network. The platform will enable users to:

- Tap a button as many times as possible within 25 seconds
- Compete for the highest scores on a global leaderboard
- Purchase additional attempts using $GLICO tokens
- Earn rewards from a prize pool based on performance
- Share their results through Farcaster Frames for increased engagement

## Core Game Mechanics

### Basic Gameplay

- 25-second rapid button-tapping challenge
- Players choose which score to record to the leaderboard
- Free attempts refresh twice daily (9am and 9pm Tokyo time)
- Additional attempts available through $GLICO purchases

### Token Integration

- Initial $GLICO airdrop to engaged users in target Farcaster channels
- Fixed pricing model:
  - First extra attempt: 50 $GLICO
  - Second extra attempt: 100 $GLICO
  - Third extra attempt: 200 $GLICO
  - Fourth+ attempt: 400 $GLICO each

### Reward Structure

- Weekly prize pool from attempt purchases
- Top 3 daily scores receive largest share of rewards
- 20% of prize pool distributed to all active players (minimum 5 attempts weekly)
- Consecutive play streaks reward system
- Sharing rewards for Farcaster posts
- **Dynamic allocation:** Prize distribution amounts vary based on total prize pool and participation levels

### Dynamic Pricing Features

- Discounted attempts near leaderboard reset
- "Happy hour" periods with reduced prices
- Position-based discounts for players outside top 50%

## Project Scope

### In Scope

- Button-tapping game mechanics with 25-second challenge
- Leaderboard system with daily, weekly, and all-time views
- $GLICO token integration for purchases and rewards
- Client-side verification system to prevent cheating
- Anti-exploitation measures for fair gameplay
- User authentication via Farcaster
- Responsive design for mobile-first experience
- Streak rewards implementation
- Dynamic pricing system based on position and time
- Sharing mechanics with Farcaster frames
- Community reporting tools

### Out of Scope (for initial MVP)

- Team mode implementation (future phase)
- Complex game variations (future phase)
- Advanced analytics and reporting (future phase)
- Email notifications system
- Community forum features
- Custom token types (beyond $GLICO)
- Desktop-specific optimizations

## Technical Architecture

### Frontend Stack

- **Framework:** React with TypeScript
- **Build Tool:** Next.js
- **Next.js configuration to use ESM syntax** since the project is configured with "type": "module"
- **Styling:** TailwindCSS
- **Platform:** Farcaster Mini App using MiniKit
- **State Management:** React Context API
- **Testing:** Jest with React Testing Library
- **Animations:** Framer Motion

### Backend Architecture

- **Deployment:** Vercel Functions for API endpoints
- **Database:** Turso (SQLite) for user profiles and leaderboards
- **Caching:** Redis for real-time leaderboard updates
- **Blockchain:** Base network integration
- **Token Contracts:** Smart contract for $GLICO purchases and rewards

### Key Features

- Optimized click detection and handling (<50ms latency)
- Client-side metrics collection
- Responsive design for mobile-first experience
- Real-time leaderboard updates
- Wallet connection via Farcaster

## Functional Requirements

### Game Mechanics

- Users should be able to tap a button as many times as possible within 25 seconds
- Game should accurately count and display the number of taps
- System should track and display the time remaining
- Game should provide visual and audio feedback for each tap
- Users should be able to choose which score to record to the leaderboard

### Gameplay Tokenomics

- System should implement $GLICO token for purchases and rewards
- Users should be able to purchase additional attempts with increasing costs
  - First extra attempt: 50 $GLICO
  - Second extra attempt: 100 $GLICO
  - Third extra attempt: 200 $GLICO
  - Fourth+ attempt: 400 $GLICO each
- Free attempts should refresh twice daily (9am and 9pm Tokyo time)
- System should implement dynamic pricing based on time and position

### Rewards System

- Weekly prize pool should be created from attempt purchases
- Top 3 daily scores should receive largest share of rewards
- 20% of prize pool should be distributed to all active players (minimum 5 attempts weekly)
- Consecutive play streaks should be rewarded
- Sharing rewards for Farcaster frame posts should be implemented

### Anti-Exploitation Implementation

#### Client-Side Measures

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

#### Server-Side Verification

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

#### Progressive Enforcement

- Warning system for suspicious activity
- Temporary restrictions for repeat offenders
- Prize withholding pending verification for high-risk submissions
- Transparent appeal process

## Blockchain Integration Architecture

### **Prize Disbursement Layer (Coinbase Wallet API v2)**

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

### **General Blockchain Operations (Viem via OnchainKit)**

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

## Non-Functional Requirements

### Performance

- Game should have responsive tap detection with minimal latency (<50ms)
- Leaderboard updates should be near real-time
- Page load time should be under 3 seconds
- System should handle concurrent users efficiently

### Security

- **Score Validation**: Existing anti-cheat measures with pattern analysis
- **Prize Wallet Security**: Utilizes a **Base Smart Wallet** for prize distributions, secured by **Passkeys**
- **Rate Limiting**: Maximum entries per wallet per day
- **Audit Trail**: Complete logging of all transactions

### Usability

- Mobile-first responsive design
- Intuitive UI for gameplay
- Clear visual feedback for taps
- Engaging animations and sound effects
- Visual distinction between free and paid attempts

### Backend Implementation Details

### Revenue Allocation Flow

1. **Purchase Flow**
   - User purchases extra attempts with $GLICO
   - On successful transaction, frontend calls `/api/allocate-revenue`
   - Endpoint receives `purchaseId` and `totalRevenue`

2. **Allocation Logic**
   - **Treasury**: 70% of total revenue
   - **Prize Pools**: 30% of total revenue
     - Daily Prize Pool: 30% of prize pool (9% of total)
     - Weekly Prize Pool: 70% of prize pool (21% of total)

3. **Data Storage**
   - Redis: Stores current prize pool amounts
   - Turso: Logs all revenue allocations for auditing
   - Prize distributions are tracked in `prize_distribution_log`

4. **Prize Distribution**
   - Daily and weekly cron jobs settle prizes
   - Prizes are distributed to top 5 players:
     - 1st: 40%
     - 2nd: 24%
     - 3rd: 16%
     - 4th: 12%
     - 5th: 8%
   - Base prizes: 50 $GLICO daily, 500 $GLICO weekly

## Compatibility

- Support for modern browsers (Chrome, Firefox, Safari, Edge)
- Optimization for mobile devices
- Integration with Farcaster ecosystem

## Branding & Visual Identity

### Visual Elements

- **Color palette:** Mint green (#3DFFC0), bubblegum pink (#FF6EB3), electric blue (#00C2FF), cyber yellow (#FFE94A)
- **Typography:** Bold pixel fonts for headlines, clean sans-serif for readability
- **Effects:** Light static/noise effect for CRT/VHS feel
- **Iconography:** Running Man in various motion states, mint leaves, tap indicators

### Catch Copy Options

#### 1. "Bubble Up Your Score!"

_Branding:_ Combines the bubble gum reference with the idea of increasing scores. The visual identity features colorful bubble typography with a gradient reminiscent of bubble gum stretching or popping, paired with an upward arrow indicating score growth.

#### 2. "Every Tap Counts, Every Runner Wins"

_Branding:_ This plays on both the game mechanics and the Running Man iconography. The design features a series of Running Man silhouettes in progressive motion across the screen, with tap counters above each one increasing, using bright neon colors on a dark background for that 90s arcade feel.

#### 3. "Fresh Taps, Sweet Rewards"

_Branding:_ Connects the mint freshness of the gum with the gameplay rewards. Visually presented with mint-green to blue gradient text that "sparkles" at the edges like the fresh feeling of mint gum, accompanied by coin icons with the Running Man logo that appear to cascade down like a reward shower.

#### 4. "Press Play, Outrun Reality"

_Branding:_ This references both the dystopian Running Man theme and the escapist nature of games. The design features a split visual - half showing a glitchy, VHS-style reality being torn away to reveal a vibrant, pixel-art game world with the Running Man character breaking through the barrier between worlds.

### Character Mascot

**"Minty"** - Anime-style girl with mint-green hair in pigtails, wearing 90s platform shoes and retro track suit with Running Man logo. Different outfits/poses based on player achievements.

### Audio Branding

3-5 note synthesizer jingle combining J-pop brightness with arcade energy, playing on successful taps or high scores.

### Marketing Copy

"In a world where taps determine destiny, only the fastest fingers survive. KISSMINT DASH brings the adrenaline rush of the Running Man to your fingertips with a sweet twist! Compete daily for the highest score, build your $GLICO empire, and claim your spot on the leaderboard. Remember - in this game, you're either tapping or you're history! Fresh, fast, and dangerously addictive."

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

## Stakeholders

- End users (game players)
- Farcaster platform (integration partner)
- Development team
- Potential investors/partners

## Assumptions

- Users have a Farcaster account
- Users understand basic token concepts
- Farcaster Frames will continue to be supported
- Token distribution complies with relevant regulations

## Constraints

- Farcaster API limitations and rate limits
- Mobile device performance variations
- Network latency affecting gameplay experience
- Dependency on Farcaster platform availability

## Deliverables

- Fully functional button-tapping game
- Leaderboard system
- Token integration for purchases and rewards
- Anti-cheat implementation
- Frame integration for Farcaster sharing
- Documentation for users and developers

## Milestones

1. **Core Button-Tapping Gameplay** (Weeks 1-2)

   - Basic game mechanics and timing
   - Simple UI with core functionality
   - Initial client-side verification

2. **Enhanced Features** (Weeks 3-5)

   - Expanded leaderboard system
   - $GLICO token integration
   - Streak rewards implementation
   - Dynamic pricing system
   - Enhanced anti-exploitation measures

3. **Community & Engagement** (Weeks 6-8)
   - Special events and game variations
   - Achievement system
   - Enhanced social features
   - Community reporting tools

## Schedule and Deadlines

- MVP launch: End of Week 2
- Enhanced features completion: End of Week 5
- Community features completion: End of Week 8
- Production deployment: Week 9

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
