# KissMint Game Application Flow Document

## Overview

KissMint DASH: Tap Runner '99 is a simple yet addictive button-tapping game built as a Farcaster Mini App. The game challenges players to tap a button as many times as possible within 25 seconds, competing for the highest score on leaderboards. The platform integrates $GLICO tokens for purchases and rewards, implements anti-cheat measures, and leverages Farcaster's social features for enhanced engagement.

## Application Architecture

### Technology Stack

- **Frontend**: React, Next.js, TailwindCSS
- **Authentication**: Farcaster Auth Kit
- **Backend**: Node.js, Express, AWS Lambda
- **Database**: MongoDB, Redis
- **Blockchain**: Base network ($GLICO token)
- **Frame Integration**: Farcaster Frame SDK

### Key Components

1. **Game Engine**: Core button-tapping mechanics and timing
2. **Leaderboard System**: Daily, weekly, and all-time rankings
3. **Token Integration**: $GLICO token for purchases and rewards
4. **Anti-Cheat System**: Client and server verification
5. **Farcaster Integration**: Authentication and Frame sharing

### File Structure

```
kissmint-game/
├── frontend/                   # Next.js frontend application
│   ├── public/                 # Static assets
│   └── src/
│       ├── components/         # UI components
│       ├── context/            # React context providers
│       ├── hooks/              # Custom React hooks
│       ├── lib/                # Utility functions
│       ├── pages/              # Next.js pages and API routes
│       └── styles/             # Global styles
├── backend/                    # Serverless backend functions
│   ├── api/                    # API endpoints
│   ├── models/                 # Data models
│   ├── services/               # Business logic services
│   └── utils/                  # Utility functions
└── contracts/                  # Smart contracts for $GLICO token
```

## Core User Workflows

### 1. Player's Workflow

#### 1.1 Game Discovery and Authentication

Players can discover the game through Farcaster or direct links.

**Implementation Status**: ✅ Planned for MVP

- **Entry Points**:
  - Farcaster Mini App directory
  - Shared Frames in Farcaster feed
  - Direct links
  - Warpcast promotional content

**Authentication Process**:

1. **Farcaster Login**: Player authenticates with their Farcaster account
2. **Profile Creation**: System creates or retrieves player profile
3. **Attempts Check**: System checks if player has attempts remaining
4. **Game Ready**: Player is presented with the game interface

#### 1.2 Gameplay Mechanics

The core gameplay revolves around tapping a button as fast as possible.

**Implementation Status**: ✅ Planned for MVP

- **Components**: `GameScreen`, `TapButton`, `TimerDisplay`, `ScoreCounter`
- **Key Functions**: `handleTap()`, `startTimer()`, `endGame()`

**Gameplay Process**:

1. **Game Start**: Player initiates the game by pressing the "Start" button
2. **Timer Start**: 25-second countdown begins
3. **Button Tapping**: Player taps the button as fast as possible
4. **Real-time Feedback**: Score increments with each tap, showing visual and audio feedback
5. **Timer End**: Game ends when the timer reaches zero
6. **Result Display**: Final score is displayed with options to submit to leaderboard

#### 1.3 Score Submission and Verification

After gameplay, scores are verified and submitted to the leaderboard.

**Implementation Status**: ✅ Planned for MVP

- **Components**: `ResultScreen`, `LeaderboardSubmission`
- **Key Functions**: `submitScore()`, `verifyGameplay()`

**Submission Process**:

1. **Score Review**: Player reviews their score
2. **Verification**: Client performs initial verification of the gameplay data
3. **Submission**: Player submits score to the leaderboard
4. **Server Verification**: Server verifies the score for legitimacy
5. **Leaderboard Update**: Score is added to the appropriate leaderboards
6. **Feedback**: Player receives confirmation of submission and current ranking

#### 1.4 Leaderboard Interaction

Players can view and interact with various leaderboards.

**Implementation Status**: ✅ Planned for Enhanced Features

- **Components**: `LeaderboardScreen`, `LeaderboardTabs`, `LeaderboardEntry`
- **Key Functions**: `fetchLeaderboard()`, `filterLeaderboard()`

**Leaderboard Features**:

1. **Multiple Views**: Daily, weekly, and all-time leaderboards
2. **Ranking Display**: Player's current position and score
3. **Social Features**: View friends' scores
4. **Historical Data**: View personal best scores and history
5. **Reward Status**: See potential rewards based on current position

#### 1.5 Additional Attempt Purchase

Players can purchase additional attempts using $GLICO tokens.

**Implementation Status**: ✅ Planned for Enhanced Features

- **Components**: `AttemptPurchaseModal`, `TokenBalance`, `PurchaseButton`
- **Key Functions**: `calculateAttemptPrice()`, `purchaseAttempt()`

**Purchase Process**:

1. **Attempt Check**: Player sees they have no attempts remaining
2. **Purchase Initiation**: Player selects to purchase additional attempts
3. **Price Display**: System shows the current price based on dynamic pricing
4. **Confirmation**: Player confirms the purchase
5. **Transaction**: $GLICO tokens are transferred to prize pool
6. **Attempt Credit**: Player's account is credited with additional attempts

#### 1.6 Reward Claiming

Players can claim rewards based on their leaderboard performance.

**Implementation Status**: ✅ Planned for Enhanced Features

- **Components**: `RewardClaimScreen`, `RewardBreakdown`
- **Key Functions**: `calculateRewards()`, `claimRewards()`

**Reward Process**:

1. **Eligibility Check**: System determines player's reward eligibility
2. **Reward Display**: Player sees available rewards
3. **Claim Initiation**: Player chooses to claim rewards
4. **Verification**: System verifies eligibility
5. **Token Transfer**: $GLICO tokens are transferred to player's wallet
6. **Confirmation**: Player receives confirmation of claimed rewards

#### 1.7 Social Sharing

Players can share their results via Farcaster Frames.

**Implementation Status**: ✅ Planned for Enhanced Features

- **Components**: `ShareResultScreen`, `FrameGenerator`
- **Key Functions**: `generateShareFrame()`, `postToFarcaster()`

**Sharing Process**:

1. **Share Initiation**: Player chooses to share their score
2. **Frame Generation**: System generates a Farcaster Frame with the score
3. **Preview**: Player previews the share content
4. **Sharing**: Player posts the Frame to their Farcaster feed
5. **Reward**: System credits sharing rewards to the player

### 2. Game System Workflows

#### 2.1 Anti-Cheat Verification

The system verifies gameplay legitimacy through multiple layers.

**Implementation Status**: ✅ Planned for MVP

- **Components**: Client-side and server-side verification systems
- **Key Functions**: `analyzeClickPattern()`, `validateSubmission()`, `calculateRiskScore()`

**Verification Process**:

1. **Client Collection**: During gameplay, client collects:
   - Tap timestamps
   - Device information
   - Performance metrics
2. **Initial Verification**: Client performs basic checks:
   - Tap intervals
   - Pattern consistency
3. **Submission**: Data is submitted with integrity hash
4. **Server Analysis**: Server performs advanced verification:
   - Statistical analysis
   - Comparison with baseline human metrics
   - Historical performance comparison
5. **Risk Scoring**: System assigns a risk score
6. **Enforcement**: Based on risk score, system takes appropriate action:
   - Allow the score
   - Flag for review
   - Restrict leaderboard placement
   - Block the submission

#### 2.2 Attempt Refresh System

Free attempts are refreshed on a regular schedule.

**Implementation Status**: ✅ Planned for Enhanced Features

- **Services**: `AttemptRefreshService`
- **Key Functions**: `refreshAttempts()`, `calculateNextRefreshTime()`

**Refresh Process**:

1. **Scheduling**: System maintains refresh schedule (9am and 9pm Tokyo time)
2. **Time Check**: At refresh time, system identifies accounts needing refresh
3. **Attempt Update**: Free attempts are reset to default value (2)
4. **Notification**: Players are notified of refreshed attempts

#### 2.3 Dynamic Pricing System

The system adjusts attempt prices based on various factors.

**Implementation Status**: ✅ Planned for Enhanced Features

- **Services**: `PricingService`
- **Key Functions**: `calculateDynamicPrice()`, `applyDiscounts()`

**Pricing Process**:

1. **Base Price**: System starts with base price structure:
   - First attempt: 50 $GLICO
   - Second attempt: 100 $GLICO
   - Third attempt: 200 $GLICO
   - Fourth+ attempts: 400 $GLICO
2. **Time Adjustment**: Prices are discounted near leaderboard reset
3. **Position Adjustment**: Players outside top 50% receive discounts
4. **Happy Hour**: Special discounted periods are applied
5. **Final Price**: Combined adjustments determine final price

#### 2.4 Reward Distribution System

The system distributes rewards from the prize pool.

**Implementation Status**: ✅ Planned for Enhanced Features

- **Services**: `RewardService`
- **Key Functions**: `calculatePrizePool()`, `distributeRewards()`

**Distribution Process**:

1. **Pool Calculation**: System calculates total prize pool from purchases
2. **Allocation**: Pool is divided according to distribution rules:
   - 50% to top 3 daily scores
   - 20% to all active players
   - 15% to streak rewards
   - 15% to sharing rewards
3. **Eligibility**: System determines eligible players for each category
4. **Distribution**: Tokens are allocated to eligible players
5. **Notification**: Players are notified of available rewards

#### 2.5 Streak Tracking System

The system tracks and rewards consecutive play days.

**Implementation Status**: ✅ Planned for Enhanced Features

- **Services**: `StreakService`
- **Key Functions**: `updateStreak()`, `calculateStreakReward()`

**Streak Process**:

1. **Play Detection**: System detects when a player plays at least one game
2. **Day Check**: System verifies it's a new calendar day from last play
3. **Streak Update**: Player's streak count is incremented
4. **Streak Break**: If a day is missed, streak resets to 1
5. **Reward Calculation**: Rewards are calculated based on streak length

## Detailed Game Flow Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Client-side    │────▶│  Server-side    │────▶│  Leaderboard   │
│  Verification   │     │  Verification   │     │  Submission    │
│                 │     │                 │     │                 │
└────────┬────────┘     └─────────────────┘     └────────┬────────┘
         │                                               │
         ▼                                               ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Result         │────▶│  Frame          │────▶│  Social         │
│  Display        │     │  Generation     │     │  Sharing        │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Integration Points

### 1. Farcaster Integration

#### 1.1 Authentication

- **Implementation**: Farcaster Auth Kit
- **Usage**: User login and identity verification
- **Components**: `AuthProvider`, `SignInButton`

#### 1.2 Frame Integration

- **Implementation**: Base Mini-kit
- **Usage**: Interactive game cards in Farcaster feeds
- **Components**: `FrameGenerator`, `ShareFrame`

### 2. Blockchain Integration

#### 2.1 Token Transactions

- **Implementation**: Base Network, ethers.js
- **Usage**: $GLICO token purchases and rewards
- **Components**: `TokenProvider`, `PurchaseButton`, `RewardClaim`

#### 2.2 Wallet Connection

- **Implementation**: Rainbow Kit, wagmi
- **Usage**: Connect user wallets for transactions
- **Components**: `WalletProvider`, `ConnectButton`

### 3. Database Integration

#### 3.1 Turso Database

- **Implementation**: Turso client library
- **Usage**: Primary data store for game state
- **Services**: `GameService`, `UserService`, `LeaderboardService`

## User Journeys

### Player Journey: First-Time Experience

1. **Discovery**: 
   - Player discovers game through Farcaster frame or direct link
   - Clicks to open the game

2. **Authentication**:
   - Prompted to authenticate with Farcaster
   - Grants necessary permissions
   - Profile is created or retrieved

3. **Onboarding**:
   - Brief tutorial explains game mechanics
   - Player learns about free attempts and refresh schedule
   - Introduction to $GLICO token system

4. **First Game**:
   - Player starts first game
   - Taps button rapidly for 25 seconds
   - Game ends with score display

5. **Leaderboard Submission**:
   - Player submits score to leaderboard
   - Sees current position
   - Views other players' scores

6. **Social Sharing**:
   - Prompted to share result via Farcaster Frame
   - Frame is generated with score and ranking
   - Player shares to Farcaster feed

7. **Next Steps**:
   - Player sees remaining attempts
   - Can play again or purchase additional attempts
   - Informed about next attempt refresh time

### Player Journey: Regular Player Experience

1. **Return Visit**:
   - Player returns to the game
   - Automatically authenticated via Farcaster
   - Sees profile with current stats

2. **Attempt Management**:
   - Checks attempts remaining
   - If zero, can purchase additional attempts with $GLICO
   - If near refresh time, may wait for free attempts

3. **Gameplay**:
   - Plays multiple games to improve score
   - Selects best score for leaderboard submission
   - Compares with previous personal best

4. **Leaderboard Competition**:
   - Monitors position on daily, weekly leaderboards
   - Competes with friends and other players
   - Tracks potential rewards based on position

5. **Reward Claiming**:
   - Claims rewards based on leaderboard position
   - Receives $GLICO tokens to wallet
   - Can use tokens for additional attempts

6. **Streak Building**:
   - Returns daily to maintain streak
   - Receives streak bonuses
   - Unlocks streak-based achievements

## Technical Workflows

### Game Initialization Workflow

```javascript
// 1. Authentication check
const user = await authenticateUser();

// 2. Attempt availability check
if (user.attemptsRemaining <= 0) {
  showPurchaseDialog();
} else {
  // 3. Game session creation
  const session = await createGameSession(user.fid);
  
  // 4. Client preparation
  initializeGameClient({
    sessionId: session.id,
    userId: user.fid,
    remainingAttempts: user.attemptsRemaining - 1
  });
  
  // 5. Game start
  startGame();
}
```

### Score Submission Workflow

```javascript
// 1. Game end logic
function endGame(taps, tapData) {
  // 2. Client-side verification
  const verification = verifyGameplayClient(tapData);
  
  // 3. Prepare submission data
  const submissionData = {
    sessionId,
    score: taps,
    verificationData: {
      tapTimestamps: tapData,
      deviceFingerprint: generateFingerprint(),
      clientHash: generateIntegrityHash(tapData)
    }
  };
  
  // 4. Submit to server
  submitScore(submissionData)
    .then(response => {
      if (response.verified) {
        // 5. Show leaderboard position
        showLeaderboardPosition(response.position);
        
        // 6. Offer sharing options
        showSharingOptions(response.score, response.position);
      } else {
        // 7. Handle verification failure
        handleVerificationFailure(response.reason);
      }
    })
    .catch(error => {
      // 8. Handle submission error
      handleSubmissionError(error);
    });
}
```

### Token Purchase Workflow

```javascript
// 1. Initiate purchase
async function purchaseAttempt() {
  try {
    // 2. Calculate current price
    const price = await getPurchasePrice(userId);
    
    // 3. Show confirmation dialog
    const confirmed = await showPurchaseConfirmation(price);
    
    if (!confirmed) return;
    
    // 4. Connect wallet if not connected
    if (!walletConnected) {
      await connectWallet();
    }
    
    // 5. Execute token transaction
    const transaction = await executeTokenTransaction(userId, price);
    
    // 6. Wait for confirmation
    await transaction.wait();
    
    // 7. Credit attempt to user
    await creditAttemptToUser(userId);
    
    // 8. Show success message
    showPurchaseSuccess();
    
    // 9. Update UI
    updateAttemptsDisplay();
  } catch (error) {
    // 10. Handle errors
    handlePurchaseError(error);
  }
}
```

## Future Enhancements

### Planned Features

1. **Team Mode**:
   - Collaborative tapping with friends
   - Team leaderboards
   - Share rewards among team members

2. **Game Variations**:
   - Pattern tapping mode (tap specific patterns)
   - Rhythm-based mode (tap to beat)
   - Obstacle mode (avoid tap blockers)

3. **Advanced Social Features**:
   - Direct challenges to friends
   - Tournament brackets
   - Spectator mode

4. **Enhanced Rewards**:
   - NFT badges for achievements
   - Special edition cosmetics
   - Exclusive access to new game modes

5. **Analytics Dashboard**:
   - Personal performance stats
   - Improvement tracking
   - Heat maps of tap patterns

## Development Roadmap

### Phase 1: MVP Launch (Weeks 1-2)

- Core button-tapping gameplay
- Basic leaderboard
- $GLICO integration
- Initial client-side verification
- Simple UI

### Phase 2: Enhanced Features (Weeks 3-5)

- Expanded leaderboard views
- Streak rewards
- Dynamic pricing
- Farcaster Frame sharing
- Enhanced anti-exploitation measures

### Phase 3: Community & Engagement (Weeks 6-8)

- Special events
- Game variations
- Achievement system
- Enhanced social features
- Community reporting tools┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Farcaster      │────▶│  Authentication │────▶│  Attempt Check  │
│  Discovery      │     │                 │     │                 │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Attempt        │◀───▶│  $GLICO Token   │     │  Free Attempts  │
│  Purchase       │     │  Transaction    │     │  Available      │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Game End       │◀────│  25-Second      │◀────│  Game Start     │
│  Score Display  │     │  Gameplay       │     │                 │
│                 │     │                 │     │                 │
└────────┬────────┘     └─────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐     