# KissMint DASH: Development Tasks

## Development Tasks

_Last Updated: 2025-06-09 13:06 KST_

### 1. Project Initialization & Environment Setup

- [x] **1.1. Review MiniKit Quickstart Output**

  - Verify project structure and dependencies
  - Ensure project runs locally (`yarn dev` or `npm run dev`)

- [x] **1.2. Version Control & CI/CD**

  - Set up GitHub repository
  - Configure GitHub Actions for CI (lint, typecheck, tests, build)
  - Add branch protection and PR review rules

- [x] **1.3. Environment Variables & Secrets**
  - Set up `.env` for local development
  - Configure MiniKit project ID, Redis, API keys
  - **CRITICAL:** Set up Coinbase Wallet API v2 credentials separately
  - Document required environment variables in `README.md`

### 2. Core Architecture & Boilerplate

- [x] **2.1. Directory Structure**

  - Align folders: `src/components/`, `src/hooks/`, `src/context/`, `src/lib/`, `src/pages/`, `src/styles/`, `contracts/`, `api/`, `tests/`
  - Create placeholder files for each major module
  - **CRITICAL:** Separate Coinbase API integration in `src/lib/coinbase/`

- [x] **2.2. TypeScript & Linting**

  - Enforce TypeScript throughout the project
  - Configure ESLint, Prettier, and Husky for pre-commit hooks

- [x] **2.3. TailwindCSS & Design Tokens**
  - Verify TailwindCSS configuration
  - Add color palette and theming:
    - Mint green (#3DFFC0)
    - Bubblegum pink (#FF6EB3)
    - Electric blue (#00C2FF)
    - Cyber yellow (#FFE94A)
  - Add favicon

### 3. Authentication & User Profile

- [x] **3.1. User Profile Management**

  - Create user context/provider for profile, attempts, streaks, and balances
  - UI: Profile modal or screen

- [x] **3.2. Profile Button in System Menu** ✅ 2025-06-09
  - Move Profile button from header to System menu
  - Maintain existing `useViewProfile` functionality from MiniKit
  - Ensure consistent styling with other menu items
  - Verify mobile responsiveness
  - Update tests and snapshots

### 4. Game Core Mechanics

- [x] **🎮 4.1. Game Engine**
      [(Issue 1)](https://github.com/PatrionDigital/kissmintdash/issues/1)

  - Build tap button, timer, and score counter components
  - Implement tap detection with <50ms latency
  - Add real-time feedback (visual/audio) per tap

- [x] **🎰 4.2. Game State & Flow**
      [(Issue 2)](https://github.com/PatrionDigital/kissmintdash/issues/2)

  - Manage game states: idle, running, finished
  - Handle start, end, and reset logic

- [x] **👾 4.3. Anti-Cheat (Client)**
      [(Issue 3)](https://github.com/PatrionDigital/kissmintdash/issues/3)

  - Track tap timestamps, intervals, and device fingerprint
  - Generate integrity hash for each session
  - Implement click pattern analysis

- [x] **🎨 4.4. Polish and Juice**
      [(Issue 5)](https://github.com/PatrionDigital/kissmintdash/issues/5)
  - Add visual polish and interaction juice:
    - [react-7-segment-display](https://github.com/eduardomoroni/react-7-segment-display) for LED-style score display
    - [NumberFlow](https://number-flow.barvian.me) for animated timer transitions
    - VHS static effect for background

### 5. Leaderboards & Social

- [x] **5.1. Leaderboard UI**
      [(Issue 9)](https://github.com/PatrionDigital/kissmintdash/issues/9)

  - Implement daily/weekly/all-time leaderboard tabs
  - Show player's rank, score, and reward status

- [x] **5.2. Leaderboard Backend**

  - API endpoints for fetching and submitting scores
  - Integrate with Redis for real-time updates

- [ ] **5.3. Social Sharing (Frames)**
      [(Issue 11)](https://github.com/PatrionDigital/kissmintdash/issues/11)
  - [x]Use Farcaster Links for sharing scores and achievements
  - [ ]Implement proper Farcaster Frame (meta tags, etc.) with link to Mini App

### 6. Prize Distribution System & Leaderboards

#### 6.1 Prize Structure Implementation [(Issue 25)](https://github.com/PatrionDigital/kissmintdash/issues/25)

- [x] **Daily Rewards (50 $GLICO Base + Dynamic Bonus)** (Completed 2025-06-15)
  - [x] Implement base prize calculation (50 $GLICO)
  - [x] Add dynamic bonus from prize pool (30% of total pool)
  - [x] Distribute to top 5 winners:
    - 1st Place: 40% of total pool
    - 2nd Place: 24% of total pool
    - 3rd Place: 16% of total pool
    - 4th Place: 12% of total pool
    - 5th Place: 8% of total pool
  - [x] Log distribution in Turso database

- [x] **Weekly Rewards (500 $GLICO Base + Dynamic Bonus)** (Completed 2025-06-15)
  - [x] Implement base prize calculation (500 $GLICO)
  - [x] Add dynamic bonus from prize pool (70% of total pool)
  - [x] Distribute to top 5 winners:
    - 1st Place: 40% of total pool
    - 2nd Place: 24% of total pool
    - 3rd Place: 16% of total pool
    - 4th Place: 12% of total pool
    - 5th Place: 8% of total pool
  - [x] Log distribution in Turso database

#### 6.2 Revenue Model & Tokenomics

- [x] **Revenue Allocation Implementation** (Completed 2025-06-15)
  - Implemented in `/api/allocate-revenue` endpoint
  - Project Treasury: 70% of total revenue
  - Prize Pool Contribution: 30% of total revenue
    - Daily Pool: 30% of prize pool (9% of total revenue)
    - Weekly Pool: 70% of prize pool (21% of total revenue)
  - Integrated with game pass purchase flow
  - Turso logging for all allocations

#### 6.3 Technical Infrastructure - Core Infrastructure ✅

- [x] **Database Setup**

  - Design and implement Turso database schema
  - Create tables for leaderboard archives and prize distribution logs
  - Set up necessary indexes for performance

- [x] **Service Implementation**

  - Implement `LeaderboardService` with Redis and Turso integration
  - Implement `PrizePoolManager` for prize pool management
  - Implement `PrizeDistributionService` for orchestrating prize distribution
  - Implement `WalletService` for handling prize payouts
  - Implement `FarcasterProfileService` for resolving Farcaster IDs to wallet addresses

- [x] **API Endpoints**
  - Create cron endpoint for prize distribution at `/api/cron/prize-distribution`
  - Implement proper error handling and logging

#### 6.4 Redis Structure (Upstash)

- [x] **Active Data Management** (Completed 2025-06-15)
  - Daily scores leaderboard (sorted sets) - `leaderboard:daily`
  - Weekly scores leaderboard (sorted sets) - `leaderboard:weekly`
  - Daily pool bonus tracking - `prize_pool:daily`
  - Weekly pool bonus tracking - `prize_pool:weekly`
  - Prize pool claiming locks - `prize_pool:lock:{daily|weekly}`

#### 6.5 Database Schema Implementation

- [x] **Turso Schema Implementation** (Completed 2025-06-15)
  - All tables created with proper indexes
  - Foreign key constraints where applicable
  - Timestamp columns for auditing
  - Schema versioning in place

  ```sql
  -- Table to archive leaderboard standings after each period (daily/weekly)
  CREATE TABLE IF NOT EXISTS leaderboard_archives (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period_identifier TEXT NOT NULL, -- e.g., '2023-10-26' for daily, '2023-W43' for weekly
    board_type TEXT NOT NULL CHECK(board_type IN ('daily', 'weekly')),
    user_id TEXT NOT NULL,           -- Farcaster ID (FID) of the user
    rank INTEGER NOT NULL,
    score INTEGER NOT NULL,
    prize_amount REAL NOT NULL,      -- Amount of $GLICO won
    archived_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  -- Table to log revenue allocations from game pass purchases
  CREATE TABLE IF NOT EXISTS revenue_allocation_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_id TEXT NOT NULL UNIQUE, -- Unique identifier for the game pass purchase transaction
    total_revenue REAL NOT NULL,      -- Total $GLICO from this purchase
    daily_pool_contribution REAL NOT NULL,
    weekly_pool_contribution REAL NOT NULL,
    treasury_share REAL NOT NULL,
    allocated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  -- Table to log summary of each prize distribution attempt
  -- CRITICAL: This table structure must match backend service expectations exactly
  CREATE TABLE IF NOT EXISTS distribution_summary_log (
    id TEXT PRIMARY KEY, -- UUID string, generated by backend
    board_type TEXT NOT NULL CHECK(board_type IN ('daily', 'weekly')),
    period_identifier TEXT NOT NULL, -- e.g., '2023-10-26' or '2023-W43'
    status TEXT NOT NULL CHECK(status IN ('PENDING', 'SUCCESS', 'FAILED', 'SKIPPED')),
    total_prize_pool_claimed REAL, -- Nullable, set when pool is claimed
    num_winners INTEGER DEFAULT 0, -- Nullable, set after distribution
    started_at TEXT NOT NULL, -- ISO timestamp when distribution started
    completed_at TEXT,        -- ISO timestamp when finished (nullable)
    transaction_hash TEXT,    -- Nullable, set if on-chain payout
    reason TEXT               -- Reason for SKIPPED/FAILED
  );

  -- Table to log individual prize payouts within a distribution
  CREATE TABLE IF NOT EXISTS prize_distribution_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    summary_id TEXT NOT NULL,                -- Foreign key to distribution_summary_log (UUID)
    user_id TEXT NOT NULL,                   -- Farcaster ID (FID) of the user
    wallet_address TEXT NOT NULL,            -- The wallet address that received the prize
    rank INTEGER NOT NULL,
    score INTEGER NOT NULL,
    prize_amount TEXT NOT NULL,              -- Amount in smallest unit as string (matches backend)
    distributed_at TEXT,                     -- ISO timestamp when payout occurred
    FOREIGN KEY (summary_id) REFERENCES distribution_summary_log(id)
  );

  -- Table to log individual score submissions for auditing and analysis
  CREATE TABLE IF NOT EXISTS score_submission_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,           -- Farcaster ID (FID) of the user
    score INTEGER NOT NULL,
    game_id TEXT NOT NULL,
    game_session_data TEXT,          -- JSON string for game session details
    is_valid BOOLEAN DEFAULT TRUE,   -- Placeholder, can be updated by advanced validation
    validation_notes TEXT,           -- Placeholder for notes from validation
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  -- Indexes for performance optimization
  CREATE INDEX IF NOT EXISTS idx_leaderboard_archives_period_type ON leaderboard_archives(period_identifier, board_type);
  CREATE INDEX IF NOT EXISTS idx_leaderboard_archives_user_id ON leaderboard_archives(user_id);
  CREATE INDEX IF NOT EXISTS idx_revenue_allocation_log_purchase_id ON revenue_allocation_log(purchase_id);
  CREATE INDEX IF NOT EXISTS idx_distribution_summary_log_period_board ON distribution_summary_log(period_identifier, board_type);
  CREATE INDEX IF NOT EXISTS idx_distribution_summary_log_status ON distribution_summary_log(status);
  CREATE INDEX IF NOT EXISTS idx_prize_distribution_log_summary_id ON prize_distribution_log(summary_id);
  CREATE INDEX IF NOT EXISTS idx_prize_distribution_log_user_id ON prize_distribution_log(user_id);
  CREATE INDEX IF NOT EXISTS idx_prize_distribution_log_wallet_address ON prize_distribution_log(wallet_address);
  CREATE INDEX IF NOT EXISTS idx_score_submission_log_user_id ON score_submission_log(user_id);
  CREATE INDEX IF NOT EXISTS idx_score_submission_log_game_id ON score_submission_log(game_id);
  CREATE INDEX IF NOT EXISTS idx_score_submission_log_submitted_at ON score_submission_log(submitted_at);
  ```

#### 6.6 Testing Status - In Progress 🔄

- [x] **Unit Testing**

  - [x] Write unit tests for `LeaderboardService`
  - [x] Write unit tests for `PrizeDistributionService`
  - [x] Write unit tests for `PrizePoolManager`
  - [x] Write integration tests for prize distribution flow
  - [x] Fix test failures and ensure all tests pass
  - Write unit tests for `WalletService`
  - Write unit tests for `FarcasterProfileService`

- [x] **Integration Testing**

  - Test leaderboard snapshot and reset functionality
  - Test prize pool claiming and distribution
  - Test end-to-end prize distribution flow
  - Test error handling and edge cases

- [x] **Cron Endpoint Testing**
  - Fix environment variable handling in test environment
  - Add tests for the cron endpoint
  - Validate cron job scheduling and execution

#### 6.7 Deployment & Monitoring - Pending ⏳

- [ ] **Environment Setup**

  - Configure environment variables in production
  - Set up database connections
  - Configure Redis connection

- [ ] **Cron Job Configuration**

  - Set up Vercel cron job configuration
  - Configure retry logic for failed jobs
  - Set up alerts for job failures

- [ ] **Monitoring and Logging**
  - Add detailed logging for prize distribution
  - Set up monitoring for the cron job
  - Configure alerts for critical errors

### 7. Coinbase CDP Wallet API v2 Implementation

#### 7.1 Core Wallet Service - Implementation Complete ✅

- [x] **Wallet Service Implementation**

  - Wallet initialization with environment-based configuration
  - Support for both testnet (Base Sepolia) and mainnet (Base Mainnet)
  - Smart Account wallet creation and management
  - Token transfer functionality for $GLICO payouts
  - Comprehensive test suite with mocked dependencies

- [x] **Key Features**
  - Automatic wallet initialization with environment variables
  - Support for persistent wallet IDs to avoid creating new wallets
  - Batch prize distribution to multiple winners
  - Transaction status tracking and error handling
  - Production/development environment detection

#### 7.2 Configuration & Security

- [x] **Environment Configuration**

  ```typescript
  // Required environment variables
  COINBASE_API_KEY_NAME = your_coinbase_api_key_name;
  COINBASE_API_PRIVATE_KEY = your_coinbase_private_key;
  ```

- [x] **Smart Account Features**
  - ERC-4337 Account Abstraction support
  - Enterprise-grade security through AWS Nitro Enclaves
  - Programmable transaction logic for game-specific rules
  - Sub-500ms wallet creation, sub-200ms signing latency

#### 7.3 Implementation Details

- [x] **Core Functionality**

  ```typescript
  // Usage example
  import { walletService } from "~/services/wallet.service";

  const prizePayouts = [
    { userAddress: "0x123...", prizeAmount: "1000000000000000000" }, // 1.0 $GLICO
    { userAddress: "0x456...", prizeAmount: "2000000000000000000" }, // 2.0 $GLICO
  ];

  const results = await walletService.distributePrizes(prizePayouts);
  ```

- [ ] **Testing Infrastructure**
  - **Wallet Service**
    - [ ] Initialization and environment validation
    - [ ] Prize distribution (single/multiple/empty payouts)
    - [ ] Account balance retrieval and formatting
    - [ ] Transaction confirmation handling
    - [ ] Error cases and retry logic
    - [ ] Unit tests in `tests/unit/services/wallet.service.test.ts`
  - **Prize Distribution Service**
    - [ ] Daily and weekly prize distribution
    - [ ] Prize calculation logic
    - [ ] Error handling and edge cases
    - [ ] Comprehensive logging
    - [ ] Unit tests in `tests/unit/services/prize-distribution.service.test.ts`
  - **Leaderboard Service**
    - [ ] Score submission and validation
    - [ ] Leaderboard queries (daily/weekly)
    - [ ] Period management and snapshots
    - [ ] Data persistence
    - [ ] Unit tests in `tests/unit/services/leaderboard.service.test.ts`
  - **Integration Tests**
    - [ ] End-to-end prize distribution flow
    - [ ] Error scenarios and recovery
    - [ ] Performance and concurrency testing
  - **Test Coverage**
    - [ ] Minimum 80% code coverage
    - [ ] All error cases tested
    - [ ] Mocked external dependencies (Coinbase SDK, Redis, Turso)
    - [ ] Automated test execution in CI/CD

#### 7.4 Deployment Tasks - Pending ⏳

- [ ] **Production Deployment**

  - Set up production environment variables
  - Verify wallet funding and token balance
  - Test end-to-end prize distribution

- [ ] **Monitoring & Alerts**

  - Add transaction monitoring and alerts
  - Implement retry logic for failed transactions
  - Add more detailed logging

- [ ] **Advanced Features**
  - Add support for gas sponsorship
  - Implement batch transaction optimization
  - Add more comprehensive error recovery

#### 7.5 Gas Fee Strategy

- [ ] **Gas Payment Options**
  - **User Pays Gas in $GLICO**: Base Smart Wallet with paymaster service
  - **Project-Sponsored Gas Fees**: Gasless transactions for improved UX
  - Reference: [ERC20 Paymasters – Base Docs](https://docs.base.org/identity/smart-wallet/guides/erc20-paymasters)

### 8. Token Economy & Blockchain Integration

- [x] **8.1. $GLICO Token Integration (Viem via OnchainKit)**
      [(Issue 13)](https://github.com/PatrionDigital/kissmintdash/issues/13)

  - Confirm wallet connection
  - Display $GLICO balance and transaction history using viem
  - **NOTE:** This is for user operations, NOT prize distribution

- [ ] **8.2. Purchasing Attempts (Viem via OnchainKit)**
      [(Issue 14)](https://github.com/PatrionDigital/kissmintdash/issues/14)

  - Use Farcaster modal for buying attempts with fixed pricing
  - Handle token transactions and update attempts using viem
  - Implement fixed pricing structure

- [x] **8.3. Prize Distribution (Coinbase Wallet API v2 ONLY)**
      [(Issue 15)](https://github.com/PatrionDigital/kissmintdash/issues/15)
  - **CRITICAL:** Implement prize distribution using Coinbase Wallet API v2
  - Backend logic for prize pool and streak rewards
  - UI for reward claiming and history
  - Completely separate from other blockchain operations

### 9. Backend & Data Management

## Next Priority: API Implementation

### 9.1. API Design & Implementation

- [x] **Prize Distribution API**
  - [x] Implement RESTful API endpoints for prize distribution status and history
  - [x] Add admin endpoints for triggering and retrying distributions
  - [x] Document API with OpenAPI/Swagger
  - [x] Add rate limiting and request validation

## Next Up (2025-06-10)

- [ ] **Frontend Integration**

  - [ ] [#27 Create PrizeDistributionPage component](https://github.com/PatrionDigital/kissmintdash/issues/27)
  - [ ] [#28 Add PrizePoolDisplay component](https://github.com/PatrionDigital/kissmintdash/issues/28)
  - [ ] [#29 Implement DistributionList and DistributionDetail views](https://github.com/PatrionDigital/kissmintdash/issues/29)
  - [ ] [#30 Add admin controls for prize distributions](https://github.com/PatrionDigital/kissmintdash/issues/30)
  - [ ] Add loading and error states
  - [ ] Implement data fetching with SWR/React Query for admin endpoints

    - [ ] Document API endpoints with Swagger/OpenAPI

  - [ ] **User Game Data API**
    - [ ] Endpoints for game session history
    - [ ] Leaderboard data retrieval
    - [ ] User statistics and achievements
    - [ ] TypeScript interfaces for all API responses

- [ ] **9.2. Frontend Integration**

  - [ ] Create API client services
  - [ ] Implement data fetching hooks
  - [ ] Add loading and error states
  - [ ] Implement data refresh mechanisms

- [x] **9.2. Database Models** ✅ 2025-06-09

  - Implemented Turso schemas for sessions, users, leaderboards, transactions
  - Added TypeScript types for all database models
  - Set up database migrations

- [ ] **9.3. Serverless Functions**

  - Deploy API endpoints as Vercel Functions
  - Integrate with Redis for caching

- [ ] **9.4. Anti-Cheat (Server)**
  - Analyze tap patterns and risk scoring
  - Enforce penalties and progressive enforcement system

### 10. Testing & Quality Assurance

- [x] **10.1. Unit & Integration Tests**

  - Use Jest as primary testing framework
  - Use React Testing Library with Jest for UI components
  - API endpoint tests with Jest
  - **CRITICAL:** Separate tests for Coinbase API integration
  - Maintain high test coverage for critical game mechanics

- [ ] **10.2. E2E Testing**

  - Manual testing for gameplay, leaderboard, and purchase flows
  - Test anti-cheat measures with simulated cheating attempts

- [ ] **10.3. Performance Testing**

  - Lighthouse/WebPageTest for tap latency and load times
  - Verify game responsiveness on different devices
  - Test network latency handling

### 10.4. Security

- [x] **Rate Limiting Middleware** ✅ 2025-06-09

  - Implemented rate limiting for API endpoints using Upstash Redis
  - Added admin bypass functionality
  - Includes comprehensive unit tests
  - Handles request identification from multiple headers (x-forwarded-for, x-real-ip, request IP)
  - Configurable rate limits and window sizes
  - Proper error handling and fail-open behavior

- [ ] **Security Testing**
  - [ ] Input validation and sanitization
  - [ ] Anti-cheat and token transaction tests
  - [ ] Multi-account detection testing
  - [ ] **CRITICAL:** Verify Coinbase Wallet API v2 security
  - [ ] Verify token transaction security

### 11. Toast Notifications

- [ ] **11.1. Notification System**
  - Implement Sonner for toast notifications
  - Configure Toaster in root layout
  - Create notification patterns for:
    - Game events (score submission, verification)
    - Token operations (purchase success/failure)
    - Prize distribution status
    - Error handling

```tsx
// Toast implementation example
import { toast } from "sonner";

// Game events
toast.success("Score submitted successfully!");
toast.error("Score verification failed");

// Token operations
toast.loading("Processing purchase...", { id: "purchase" });
toast.success("Attempts purchased!", { id: "purchase" });

// Prize distribution
toast.success("Prize distributed to your wallet!");
```

### 12. UX/UI Polish & Accessibility

- [ ] **12.1. Responsive Design**

  - Ensure flawless mobile experience
  - Optimize for one-handed play
  - Test across multiple device sizes

- [ ] **12.2. Accessibility**

  - Keyboard navigation support
  - ARIA labels and proper semantic HTML
  - Color contrast compliance

- [ ] **12.3. Animations & Feedback**
  - Framer Motion for smooth transitions
  - Real-time visual feedback for taps
  - Achievement animations and notifications

### 13. Deployment & Monitoring

- [ ] **13.1. Vercel Deployment**

  - Configure Vercel for frontend and backend
  - Set up environment management for staging/production
  - **CRITICAL:** Secure Coinbase API credentials

- [ ] **13.2. Monitoring & Analytics**
  - Set up error tracking (Sentry)
  - Performance monitoring
  - Custom game analytics for engagement metrics

### 14. Documentation & Handover

- [ ] **14.1. Developer Documentation**

  - Update README with architecture diagrams
  - API documentation with TypeScript interfaces
  - **CRITICAL:** Document Coinbase API v2 integration separately
  - Anti-cheat implementation documentation

- [ ] **14.2. User Documentation**
  - In-app guides and help screens
  - Game mechanics explanation
