# KissMint Game Tech Stack Documentation

## Overview

KissMint DASH: Tap Runner '99 is a web application designed as a Farcaster Mini App for a simple yet addictive button-tapping game. The game allows users to tap a button as many times as possible within 25 seconds, competing for the highest score on the leaderboard. It features $GLICO token integration for purchases and rewards, anti-cheat measures, and Farcaster social features.

## Core Technologies

### Dev Environment

- MacOS and Ubuntu Linux development environments
- VSCode as primary IDE with the following plugins:
  - ESLint
  - Prettier
  - GitLens
  - Tailwind CSS IntelliSense
  - Solidity
  - JavaScript and TypeScript Nightly
- GitHub for version control and CI/CD
- ngrok for local development testing with Farcaster

### Frontend Framework

- **React**: The application is built using React 18.x for creating a component-based user interface
- **Next.js**: Framework for server-side rendering and optimized production builds
- **TailwindCSS**: Utility-first CSS framework for styling
- **Framer Motion**: For smooth animations and transitions
- **React Hook Form**: For form handling and validation

### Farcaster Integration

- **Farcaster SDK**: For Mini App development and authentication
- **Farcaster Frames**: For social sharing and interactive features
- **Farcaster Auth Kit**: For user authentication

### Blockchain Integration

- **ethers.js**: Ethereum utility library for blockchain interactions
- **wagmi**: React hooks for Ethereum/Web3 functionality
- **Rainbow Kit**: Wallet connection UI components
- **Base Network**: Primary blockchain for $GLICO token
- **OpenZeppelin Contracts**: For secure smart contract implementation

### Backend & Data Management

- **Node.js**: Server-side JavaScript runtime
- **Express**: Web framework for backend API
- **Serverless Architecture**: For cost efficiency and scalability
- **MongoDB**: NoSQL database for user profiles and leaderboards
- **Redis**: In-memory data store for caching and real-time leaderboard updates

### Game Analytics & Anti-Cheat

- **Game Analytics Engine**: Custom analytics for tracking gameplay metrics
- **Statistical Analysis Engine**: For detecting anomalies in gameplay
- **Pattern Recognition System**: For identifying suspicious tap patterns
- **Performance Benchmarking**: For establishing baseline metrics
- **Risk Scoring System**: For evaluating submission legitimacy

### DevOps & Deployment

- **GitHub Actions**: For CI/CD pipelines
- **Docker**: For containerization
- **Vercel**: For frontend hosting
- **AWS Lambda**: For serverless functions
- **MongoDB Atlas**: For managed database hosting

### Testing Tools

- **Vitest**: Primary unit, integration, and component testing tool (replaces Jest)
- **React Testing Library**: For component testing (with Vitest)
- **Cypress**: For end-to-end testing
- **Lighthouse**: For performance testing
- **WebPageTest**: For tap latency

- **Vitest**: JavaScript/TypeScript unit and integration testing framework
- **React Testing Library**: For testing React components (used with Vitest)
- **Cypress**: For end-to-end testing
- **Lighthouse**: For performance testing
- **WebPageTest**: For measuring tap response latency

## Project Structure

### Directory Organization

```dir
kissmint-game/
├── contracts/             # Smart contracts for $GLICO token
├── public/               # Static assets
├── src/
│   ├── assets/           # Game assets (images, sounds)
│   ├── components/       # Reusable UI components
│   │   ├── game/         # Game-specific components
│   │   ├── leaderboard/  # Leaderboard components
│   │   ├── token/        # Token-related components
│   │   └── ui/           # General UI components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   │   ├── anti-cheat/   # Anti-cheat utilities
│   │   ├── farcaster/    # Farcaster integration utilities
│   │   └── blockchain/   # Blockchain utilities
│   ├── pages/            # Next.js pages
│   ├── services/         # API services
│   ├── store/            # State management
│   └── styles/           # Global styles
├── api/                  # Backend API functions
│   ├── game/             # Game-related endpoints
│   ├── leaderboard/      # Leaderboard endpoints
│   ├── auth/             # Authentication endpoints
│   └── token/            # Token transaction endpoints
├── scripts/              # Deployment and utility scripts
└── tests/                # Test files
```

## Key Components

### Core Game Components

- **TapButton.jsx**: The main interactive button component
- **GameTimer.jsx**: Timer component for the 25-second challenge
- **ScoreDisplay.jsx**: Real-time score display
- **GameScreen.jsx**: Main game screen container
- **ResultScreen.jsx**: Post-game results and leaderboard submission

### Anti-Cheat Components

- **PatternAnalyzer.js**: Analyzes tap patterns for suspicious behavior
- **DeviceFingerprinter.js**: Generates device fingerprints for multiple account detection
- **PerformanceBenchmarker.js**: Establishes baseline performance metrics
- **IntegrityHashGenerator.js**: Generates integrity hashes for game submissions
- **RiskScorer.js**: Scores submissions based on risk factors

### Blockchain Components

- **GLICOTokenContract.sol**: Smart contract for $GLICO token
- **TokenWallet.jsx**: User interface for token balance and transactions
- **PurchaseButton.jsx**: Component for purchasing additional attempts

### Farcaster Integration Components

- **FarcasterAuth.jsx**: Authentication component using Farcaster
- **ShareFrame.jsx**: Component for generating shareable Farcaster Frames
- **FrameMeta.jsx**: Metadata component for Frame integration

## Data Flow

### Game Flow

1. **Authentication**: User authenticates with Farcaster account
2. **Game Start**: User initiates the game, triggering the 25-second timer
3. **Gameplay**: User taps the button as many times as possible
4. **Verification**: Client performs initial verification of the tap pattern
5. **Submission**: Score is submitted to the server
6. **Server Verification**: Server performs additional verification
7. **Leaderboard**: Score is added to the leaderboard if legitimate
8. **Rewards**: Rewards are distributed based on performance

### Anti-Cheat Flow

1. **Client-Side**: During gameplay, the client collects:
   - Tap timestamps
   - Tap interval patterns
   - Device performance metrics
2. **Submission**: This data is hashed and submitted with the score
3. **Server-Side**: The server analyzes:
   - Statistical likelihood of the score
   - Comparison with historical performance
   - Pattern consistency with human behavior
4. **Risk Assessment**: A risk score is calculated
5. **Verification**: High-risk submissions are flagged for review

### Token Flow

1. **Purchase**: User purchases additional attempts with $GLICO
2. **Transaction**: Transaction is processed on the Base network
3. **Attempt Credit**: User's account is credited with additional attempts
4. **Prize Pool**: A portion of the purchase goes to the prize pool
5. **Rewards**: Rewards are distributed based on leaderboard performance

## Performance Optimizations

- **Tap Detection**: Optimized tap detection with minimal latency
- **Efficient Rendering**: Minimizing re-renders during rapid tapping
- **Caching**: Strategic caching of leaderboard and token data
- **Lazy Loading**: Components outside the game loop are lazy loaded
- **Asset Optimization**: Compressed assets for faster loading
- **Service Worker**: Offline support and asset caching

## Anti-Cheat Implementation

### Client-Side Measures

- **Click Pattern Analysis**: Analyzing the timing and rhythm of taps
- **Device Fingerprinting**: Identifying unique devices to prevent multiple accounts
- **Performance Benchmarking**: Establishing baseline metrics for the device
- **Click Interval Variance**: Tracking the consistency of tap intervals
- **Integrity Hash**: Generating a hash of gameplay data for verification

### Server-Side Verification

- **Statistical Analysis**: Analyzing the statistical likelihood of scores
- **Anomaly Detection**: Identifying suspicious outliers in score distribution
- **Performance Curve**: Tracking the player's improvement over time
- **Risk Scoring**: Assigning risk scores to submissions
- **Progressive Enforcement**: Implementing a tiered response to suspicious activity

## Deployment Strategy

- **Development**: Local development environment with hot reloading
- **Staging**: Deployment to staging environment for testing
- **Production**: Deployment to production environment
- **Monitoring**: Real-time monitoring of performance and errors
- **Scaling**: Automatic scaling based on user load

## Environment Variables

```env
# Farcaster
FARCASTER_API_KEY=your_farcaster_api_key
FARCASTER_DEVELOPER_SECRET=your_farcaster_developer_secret

# Blockchain
NEXT_PUBLIC_ALCHEMY_ID=your_alchemy_id
NEXT_PUBLIC_WALLET_CONNECT_ID=your_wallet_connect_id
PRIVATE_KEY=your_deployer_private_key
NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address

# Database
MONGODB_URI=your_mongodb_uri
REDIS_URL=your_redis_url

# API
NEXT_PUBLIC_API_URL=your_api_url
```

## Testing Strategy

### Unit Testing

- **Game Logic**: Testing core game mechanics
- **Anti-Cheat**: Testing pattern recognition and risk scoring
- **Token Integration**: Testing token transactions

### Integration Testing

- **API Endpoints**: Testing server-side functionality
- **Farcaster Integration**: Testing authentication and Frame generation
- **Blockchain Integration**: Testing token transactions

### Performance Testing

- **Tap Response**: Measuring tap detection latency
- **Rendering Performance**: Ensuring smooth animations during rapid tapping
- **Server Load**: Testing under high concurrent user scenarios

### Security Testing

- **Anti-Cheat Bypass**: Attempting to bypass anti-cheat measures
- **Token Security**: Testing token transaction security
- **Input Validation**: Testing against common web vulnerabilities

## Future Enhancements

1. **Team Mode**: Collaborative tapping with friends
2. **Game Variations**: Alternative gameplay modes
3. **Advanced Analytics**: Detailed performance metrics
4. **Enhanced Social Features**: More interactive sharing options
5. **Multi-chain Support**: Expanded blockchain compatibility
