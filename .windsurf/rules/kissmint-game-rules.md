---
trigger: always_on
---

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

### KissMint Database Integration

1. **Turso Integration**: Use Turso for database operations.
2. **Schema Design**: Follow the defined data models for consistency.
3. **Query Optimization**: Optimize database queries for performance.
4. **Connection Management**: Properly manage database connections to prevent leaks.

### KissMint Testing Requirements

1. **Anti-Cheat Testing**: Test anti-cheat measures with various exploitation attempts.
2. **Performance Testing**: Specifically test tap response time across devices.
3. **Mobile Testing**: Test thoroughly on various mobile devices for gameplay experience.

### Game Terminology Reference

- **Taps**: The number of button presses in a single game session
- **TPS**: Taps Per Second, a measure of tapping speed
- **Attempts**: Opportunities to play the game (free or purchased)
- **$GLICO**: The in-game token used for purchases and rewards
- **Streak**: Consecutive days of gameplay
- **Frame**: Shareable Farcaster content showing game results
