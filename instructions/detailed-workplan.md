# KissMint DASH: Detailed Work Plan

## 1. Project Initialization & Environment Setup

- [x] **1.1. Review MiniKit Quickstart Output**

  - Verify that the MiniKit quickstart created the expected project structure and dependencies.
  - Ensure the project runs locally (`yarn dev` or `npm run dev`).

- [x] **1.2. Version Control & CI/CD**

  - Set up GitHub repository if not already done.
  - Configure GitHub Actions for CI (lint, typecheck, tests, build).
  - Add branch protection and PR review rules.

- [x] **1.3. Environment Variables & Secrets**
  - Set up `.env` for local development (API keys, MiniKit project ID, Redis, etc.).
  - Verify environment variables, these will be set up by the `npx create-onchain --mini` command:
  - Document required environment variables in `README.md`.

---

## 2. Core Architecture & Boilerplate

- [x] **2.1. Directory Structure**

  - Align folders with documentation: `src/components/`, `src/hooks/`, `src/context/`, `src/lib/`, `src/pages/`, `src/styles/`, `contracts/`, `api/`, `tests/`.
  - Create placeholder files for each major module.

- [x] **2.2. TypeScript & Linting**

- Ensure TypeScript is enforced everywhere.
- Configure ESLint, Prettier, and Husky for pre-commit hooks.

- [x] **2.3. TailwindCSS & Design Tokens**

- Verify TailwindCSS is working.
- Add color palette and theming from documentation.
- Add fav-icon

---

## 3. Authentication & User Profile

- [x] **3.1. User Profile Management**

- Create user context/provider for profile, attempts, streaks, and balances.
- UI: Profile modal or screen.

---

## 4. Game Core Mechanics

- [x] **🎮4.1. Game Engine**

[(Issue 1)](https://github.com/PatrionDigital/kissmintdash/issues/1)

- Build the tap button, timer, and score counter components.
- Implement tap detection with <50ms latency.
- Add real-time feedback (visual/audio) per tap.

- [x] **🎰4.2. Game State & Flow**

[(Issue 2)](https://github.com/PatrionDigital/kissmintdash/issues/2)

- Manage game states: idle, running, finished.
- Handle start, end, and reset logic.

- [x] **👾4.3. Anti-Cheat (Client)**

[(Issue 3)](https://github.com/PatrionDigital/kissmintdash/issues/3)

- Track tap timestamps, intervals, and device fingerprint.
- Generate integrity hash for each session.

- [x] **🎨4.4. Polish and Juice**

[(Issue 5)](https://github.com/PatrionDigital/kissmintdash/issues/5)

- Add visual polish and interaction juice
  - [react-7-segment-display](https://github.com/eduardomoroni/react-7-segment-display) - Segmented LED-style display for the score
  - [NumberFlow](https://number-flow.barvian.me) - NumberFlow for animated number transitions for the timer.
  - VHS static effect for background

---

## 5. Leaderboards & Social

[(Issue 9)](https://github.com/PatrionDigital/kissmintdash/issues/9)

- [x] **5.1. Leaderboard UI**

- Implement daily/weekly/all-time leaderboard tabs.
- Show player’s rank, score, and reward status.

- [x] **5.2. Leaderboard Backend**

- API endpoints for fetching and submitting scores.
- Integrate with Redis for real-time updates.

- [x] **5.3. Social Sharing (Frames)**
      [(Issue 11)](https://github.com/PatrionDigital/kissmintdash/issues/11)

- Use Farcaster Links.
- Allow users to share scores and achievements.
- TODO: Proper Farcast Frame (meta tags, etc.) with link to Mini App.

---

## 6. Token Economy & Blockchain Integration

- [x] **6.1. $GLICO Token Integration**
      [(Issue 13)](https://github.com/PatrionDigital/kissmintdash/issues/13)

- Confirm wallet connection.
- Display $GLICO balance and transaction history.

- [ ] **6.2. Purchasing Attempts**
      [(Issue 14)](https://github.com/PatrionDigital/kissmintdash/issues/14)
- Use Farcaster modal for buying attempts with dynamic pricing.
- Handle token transactions and update attempts.

- [ ] **6.3. Reward Distribution**
      [(Issue 15)](https://github.com/PatrionDigital/kissmintdash/issues/15)

- Backend logic for prize pool and streak rewards.
- UI for reward claiming and history.

---

## 7. Backend & Data Management

- [ ] **7.1. API Design**

- REST or GraphQL endpoints for game sessions, leaderboards, user profiles, token transactions.

- [ ] **7.2. Database Models**

- Implement Turso/MongoDB schemas for sessions, users, leaderboards, transactions.

  7.3. **Serverless Functions**

- Deploy API endpoints as Vercel/AWS Lambda functions.
- Integrate with Redis for caching.

  7.4. **Anti-Cheat (Server)**

- Analyze tap patterns, risk scoring, and enforce penalties.

---

## 8. Testing & Quality Assurance

8.1. **Unit & Integration Tests**

- Use Vitest as the primary tool for unit, integration, and component tests.
- Use React Testing Library with Vitest for UI components.
- API endpoint tests with Vitest.

  8.2. **E2E Testing**

- Cypress for gameplay, leaderboard, and purchase flows.

  8.3. **Performance Testing**

- Lighthouse/WebPageTest for tap latency and load times.

  8.4. **Security Testing**

- Input validation, anti-cheat, and token transaction tests.

---

## 9. UX/UI Polish & Accessibility

9.1. **Responsive Design**

- Ensure flawless mobile experience, optimize for one-handed play.

  9.2. **Accessibility**

- Keyboard navigation, ARIA labels, color contrast.

  9.3. **Animations & Feedback**

- Framer Motion for smooth transitions and feedback.

---

## 10. Deployment & Monitoring

10.1. **Vercel Deployment**

- Configure Vercel for frontend and backend.

  10.2. **Environment Management**

- Separate staging and production environments.

  10.3. **Monitoring & Analytics**

- Set up error tracking (Sentry), performance monitoring, and custom game analytics.

---

## 11. Documentation & Handover

11.1. **Developer Documentation**

- Update README, add architecture diagrams, API docs.

  11.2. **User Documentation**

- In-app guides, help screens.

  11.3. **Handover & Maintenance**

- Onboarding docs for future contributors.

---

## 12. Launch & Feedback

12.1. **MVP Launch**

- Soft launch for early feedback.

  12.2. **Iterate & Improve**

- Prioritize bug fixes, polish, and enhancements.

  12.3. **Community Engagement**

- Announce on Farcaster, collect player feedback.

---

**Testing Note:**

> All unit, integration, and component tests should use Vitest. Cypress is used for E2E flows. Remove any legacy Jest configurations.
