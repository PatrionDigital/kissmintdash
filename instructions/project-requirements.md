# KissMint Game Project Requirements Document (PRD)

## Project Objectives

The project aims to create a web application called "KissMint DASH: Tap Runner '99" that allows users to participate in a simple button-tapping game on the Farcaster social network. The platform will enable users to:

- Tap a button as many times as possible within 25 seconds
- Compete for the highest scores on a global leaderboard
- Purchase additional attempts using $GLICO tokens
- Earn rewards from a prize pool based on performance
- Share their results through Farcaster Frames for increased engagement

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

## Functional Requirements

### Game Mechanics

- Users should be able to tap a button as many times as possible within 25 seconds
- Game should accurately count and display the number of taps
- System should track and display the time remaining
- Game should provide visual and audio feedback for each tap
- Users should be able to choose which score to record to the leaderboard

### Token Integration

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

### Anti-Exploitation

- Client-side measures should include:
  - Click pattern analysis during gameplay
  - Device fingerprinting for multiple account detection
  - Performance benchmarking
  - Click interval variance tracking
  - Integrity hash generation

- Server-side verification should include:
  - Statistical analysis of game submissions
  - Anomaly detection for suspicious scores
  - Player performance curve tracking
  - Risk scoring system
  - Leaderboard verification for top percentile scores

## Non-Functional Requirements

### Performance

- Game should have responsive tap detection with minimal latency
- Leaderboard updates should be near real-time
- Page load time should be under 3 seconds
- System should handle concurrent users efficiently

### Security

- Secure token transactions
- Proper validation of all inputs
- Protection against common web vulnerabilities
- Robust anti-cheat system

### Usability

- Mobile-first responsive design
- Intuitive UI for gameplay
- Clear visual feedback for taps
- Engaging animations and sound effects
- Visual distinction between free and paid attempts

### Compatibility

- Support for modern browsers (Chrome, Firefox, Safari, Edge)
- Optimization for mobile devices
- Integration with Farcaster ecosystem

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

1. Core Button-Tapping Gameplay (Weeks 1-2)
   - Basic game mechanics and timing
   - Simple UI with core functionality
   - Initial client-side verification

2. Enhanced Features (Weeks 3-5)
   - Expanded leaderboard system
   - $GLICO token integration
   - Streak rewards implementation
   - Dynamic pricing system
   - Enhanced anti-exploitation measures

3. Community & Engagement (Weeks 6-8)
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
