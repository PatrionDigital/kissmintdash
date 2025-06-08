# KissMint DASH: Project Workspace Rules

## Project Overview

KissMint DASH: Tap Runner '99 is a web application built with React, Next.js, and TailwindCSS that allows users to play a button-tapping game through the Farcaster social media platform. The application uses authentication with Farcaster, integrates with blockchain technology for token transactions, and implements anti-cheat measures to ensure fair gameplay.

## Game-Specific Development Guidelines

### Game-First Principles

1. **Game-First Approach**: Prioritize gameplay feel and responsiveness over other considerations.
2. **Performance Optimization**: Optimize for minimal input latency and smooth animations, especially during rapid tapping.
3. **Mobile-First Design**: Ensure the game works flawlessly on mobile devices, as these will be the primary platform.
4. **Security First**: Implement robust anti-cheat measures without compromising user experience.

### Game Mechanics Guidelines

1. **Tap Responsiveness**: Ensure tap detection has minimal latency (target <50ms).
2. **Visual Feedback**: Provide clear visual feedback for each successful tap.
3. **Audio Feedback**: Include subtle sound effects for taps that don't interfere with rapid tapping.
4. **Timer Precision**: Implement accurate timing for the 25-second gameplay period.
5. **Score Tracking**: Display real-time score updates during gameplay.
6. **Anti-Cheat Integration**: Implement client-side verification without impacting performance.

### KissMint UI/UX Guidelines

1. **Game Interface**:
   - Clear, large tap button as the focal point
   - Prominent timer display
   - Easily readable score counter
   - Visual distinction between free and paid attempts
2. **Responsive Design**:

   - Mobile: Optimized for one-handed play
   - Tablet: Larger tap targets
   - Desktop: Keyboard support as alternative input

3. **Animation Guidelines**:

   - Keep animations subtle during gameplay
   - More elaborate animations for achievements and milestones
   - Ensure animations don't interfere with tap registration

4. **Color Scheme**:
   - Follow the defined color palette: mint green (#3DFFC0), bubblegum pink (#FF6EB3), electric blue (#00C2FF), and cyber yellow (#FFE94A)
   - Maintain sufficient contrast for readability
   - Use colors consistently across interfaces

### KissMint-Specific Styling

1. **TailwindCSS Usage**: Leverage TailwindCSS utilities for most styling needs.
2. **CSS Modules**: Use CSS modules for complex, component-specific styles.
3. **Animation Performance**: Optimize animations for performance, especially during gameplay.

### KissMint React Patterns

1. **Custom Hooks**: Extract reusable logic into custom hooks, especially for game mechanics.
2. **Context API**: Use React Context API for global state like game session and user data.
3. **Memoization**: Use React.memo, useMemo, and useCallback to optimize performance during gameplay.

### Farcaster & Blockchain Integration

1. **Farcaster Authentication**: Utilize Farcaster Auth Kit for user authentication.
2. **Token Integration**: Properly integrate with $GLICO token for purchases and rewards.
3. **Transaction Handling**: Implement robust transaction handling and error recovery.
4. **Gas Optimization**: Consider gas costs in smart contract interactions.
5. **Wallet Connections**: Support multiple wallet providers via Rainbow Kit for better user experience.
6. **Error States**: Handle common blockchain errors gracefully (e.g., insufficient funds, rejected transactions).

### Frame Integration

1. **Base Mini-kit Usage**: Leverage Base Mini-kit for Farcaster Frame integration.
2. **Frame Generation**: Create engaging frames for score sharing.
3. **Interactive Elements**: Implement proper action handling for frame interactions.
4. **Frame Optimization**: Ensure frames load quickly and display properly.
5. **Frame Analytics**: Track frame engagement metrics where possible.

### KissMint Database Integration

1. **Turso Integration**: Use Turso for database operations.
2. **Schema Design**: Follow the defined data models for consistency.
3. **Query Optimization**: Optimize database queries for performance.
4. **Connection Management**: Properly manage database connections to prevent leaks.

### KissMint Testing Requirements

1. **Anti-Cheat Testing**: Test anti-cheat measures with various exploitation attempts.
2. **Performance Testing**: Specifically test tap response time across devices.
3. **Mobile Testing**: Test thoroughly on various mobile devices for gameplay experience.

## KissMint Anti-Cheat Implementation Guidelines

### Client-Side Measures

1. **Click Pattern Analysis**:

   - Record precise timestamps for each tap
   - Analyze intervals between taps for suspicious patterns
   - Check for inhuman consistency or impossible speeds

2. **Device Fingerprinting**:

   - Collect non-PII device information
   - Use to detect multiple accounts from same device
   - Track unusual device characteristics

3. **Performance Benchmarking**:

   - Measure device capabilities at start of session
   - Use as baseline for what's physically possible
   - Flag scores that exceed device capabilities

4. **Integrity Hash Generation**:
   - Create hash of gameplay data including timestamps
   - Include secret components only known to server
   - Use to verify data hasn't been tampered with

### Server-Side Verification

1. **Statistical Analysis**:

   - Compare submitted scores against statistical norms
   - Identify outliers based on score distribution
   - Apply increasingly strict verification to higher scores

2. **Player History Analysis**:

   - Track player's skill progression over time
   - Flag sudden, unexplained improvements
   - Consider historical performance in verification

3. **Risk Scoring System**:

   - Assign risk scores based on multiple factors
   - Apply graduated responses based on risk level
   - Balance false positives against cheating prevention

4. **Progressive Enforcement**:
   - Implement warning system for borderline cases
   - Apply temporary restrictions for repeated flags
   - Permanently restrict clear violations

### Anti-Cheat Code Examples

```javascript
// Example: Pattern analysis implementation
function analyzeClickPatterns(clickTimestamps) {
  // Calculate intervals between clicks
  const intervals = [];
  for (let i = 1; i < clickTimestamps.length; i++) {
    intervals.push(clickTimestamps[i] - clickTimestamps[i - 1]);
  }

  // Calculate statistical properties
  const avgInterval =
    intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
  const variance = calculateVariance(intervals);

  // Check for suspicious patterns
  const tooFast = avgInterval < PHYSICAL_MINIMUM_INTERVAL;
  const tooConsistent = variance < HUMAN_MINIMUM_VARIANCE;

  return {
    avgInterval,
    variance,
    suspiciousScore: (tooFast ? 0.5 : 0) + (tooConsistent ? 0.5 : 0),
    humanLikelihood: calculateHumanLikelihood(avgInterval, variance),
  };
}

// Example: Risk scoring system
function evaluateSubmission(userId, submission) {
  let riskScore = 0;

  // Check for physically impossible scores
  if (submission.score > MAX_POSSIBLE_IN_25_SECONDS) {
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
    flagForReview(userId, submission.sessionId);
  }

  return {
    valid: riskScore < BLOCK_THRESHOLD,
    riskScore,
    restrictions: determineRestrictions(riskScore),
  };
}
```

## KissMint Component Reference

### Key Components

- **TapButton**: Main interactive button component
- **GameTimer**: Timer for 25-second gameplay
- **ScoreDisplay**: Real-time score counter
- **GameScreen**: Main game interface
- **LeaderboardDisplay**: Leaderboard visualization
- **AttemptCounter**: Shows remaining attempts
- **TokenWallet**: Displays $GLICO balance
- **PurchaseModal**: Interface for buying attempts
- **ResultScreen**: Post-game score display
- **ShareFrame**: Frame generation for sharing

### Style Reference

Main style variables:

```css
:root {
  /* Brand Colors */
  --color-mint-green: #3dffc0;
  --color-bubblegum-pink: #ff6eb3;
  --color-electric-blue: #00c2ff;
  --color-cyber-yellow: #ffe94a;

  /* Typography */
  --font-pixel: "Press Start 2P", monospace;
  --font-body: "Inter", sans-serif;

  /* Game Elements */
  --tap-button-shadow: 0 6px 0 #00796b;
  --tap-button-active-shadow: 0 2px 0 #00796b;

  /* Animation Speeds */
  --animation-fast: 100ms;
  --animation-medium: 250ms;
  --animation-slow: 500ms;
}
```

### Key Utilities Reference

- **gameUtils.js**: Core game mechanics utilities
- **antiCheatUtils.js**: Anti-cheat verification functions
- **tokenUtils.js**: $GLICO token interaction utilities
- **farcasterUtils.js**: Farcaster integration utilities
- **frameUtils.js**: Frame generation utilities

### Game Terminology Reference

- **Taps**: The number of button presses in a single game session
- **TPS**: Taps Per Second, a measure of tapping speed
- **Attempts**: Opportunities to play the game (free or purchased)
- **$GLICO**: The in-game token used for purchases and rewards
- **Streak**: Consecutive days of gameplay
- **Frame**: Shareable Farcaster content showing game results
