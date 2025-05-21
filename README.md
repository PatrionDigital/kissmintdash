# KISSMINT DASH: Tap Runner '99

## "Tap Fast, Run Far, Mint Glory"

KissMint DASH: Tap Runner '99 is a web-based, mobile-first, button-tapping game built as a Farcaster Mini App. Players compete to tap as many times as possible in 25 seconds, battling for leaderboard dominance and earning $GLICO tokens as rewards. The project leverages blockchain, anti-cheat, and social sharing integrations for an engaging, fair, and rewarding experience.

---

## Table of Contents

- [Branding & Identity](#branding--identity)
- [Project Overview](#project-overview)
- [Game Mechanics](#game-mechanics)
- [Token & Rewards](#token--rewards)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Development Plan](#development-plan)
- [Project Requirements](#project-requirements)
- [Setup & Environment](#setup--environment)
- [Customization](#customization)
- [Learn More](#learn-more)

---

## Branding & Identity

- **Main Tagline:** Tap Fast, Run Far, Mint Glory
- **Mascot:** Minty (anime-style, mint-green hair, retro track suit)
- **Color Palette:** Mint green (#3DFFC0), bubblegum pink (#FF6EB3), electric blue (#00C2FF), cyber yellow (#FFE94A)
- **Visual Style:** 90s arcade, pixel fonts, CRT/VHS overlays, vibrant gradients, "Running Man" iconography
- **Audio:** J-pop/arcade synth jingle for taps/scores

---

## Project Overview

KissMint DASH: Tap Runner '99 is a Farcaster-integrated, rapid-tapping game where users:

- Tap a button as many times as possible in 25 seconds
- Compete on daily, weekly, and all-time leaderboards
- Purchase extra attempts and earn rewards via $GLICO tokens
- Share results through Farcaster Frames
- Experience robust anti-cheat and fair play systems

---

## Game Mechanics

- 25-second rapid tap challenge
- Free attempts refresh twice daily (9am/9pm Tokyo)
- Additional attempts via $GLICO purchases
- Visual/audio feedback for taps
- Real-time score and timer
- Client-side verification and anti-cheat
- Players choose which score to record

---

## Token & Rewards

- $GLICO token for purchases and rewards
- Diminishing returns pricing for extra attempts (50/100/200/400 $GLICO)
- Weekly prize pool from attempt purchases
- Top 3 daily scores get largest rewards
- 20% of prize pool to active players (min 5 attempts/week)
- Streak and sharing-based reward bonuses
- Dynamic/discount pricing based on time and leaderboard position

---

## Tech Stack

- **Frontend:** React 18+, Next.js, TailwindCSS, Framer Motion, React Hook Form
- **Authentication:** Farcaster Auth Kit, MiniKit hooks
- **Blockchain:** Base Network, ethers.js, wagmi, Rainbow Kit, OpenZeppelin
- **Backend:** Node.js, Express, Vercel Functions, MongoDB, Redis, Turso (SQLite)
- **Other:** Upstash (notifications), Serverless, GitHub Actions (CI/CD), ngrok (local testing)

---

## Architecture

```shell
kissmintdash/
├── frontend/ (Next.js, UI, context, hooks, styles)
├── backend/ (API, models, services, utils)
├── contracts/ ($GLICO smart contracts)
├── public/ (static assets)
```

- See `/instructions/application-flow.md` and `/instructions/backend-structure.md` for full diagrams and details.

---

## Development Plan

- **Phase 1: MVP**
  - Core tap gameplay, leaderboard, $GLICO integration, client-side anti-cheat, basic UI
- **Phase 2: Social & Rewards**
  - Farcaster sharing, streaks, advanced rewards, dynamic pricing
- **Phase 3: Scaling**
  - Serverless optimizations, more analytics, future game modes

---

## Project Requirements

- Tap challenge, leaderboard, $GLICO purchases, anti-cheat, auth, streaks, dynamic pricing, Farcaster integration
- See `/instructions/project-requirements.md` for full PRD

---

## Setup & Environment

1. **Install dependencies:**

   ```bash
   npm install
   ## or
   yarn install
   ```

2. **Environment Variables:**
   - See `.env.example` and `/instructions/detailed-workplan.md` for required variables (Farcaster, Redis, $GLICO, etc.)
3. **Run locally:**

   ```bash
   npm run dev
   ```

---

## Customization

- Update theme in `theme.css` and branding assets in `public/`
- Adjust MiniKit and OnchainKit config in `providers.tsx`
- See `/instructions/frontend-guidelines.md` for UI/UX and code standards

---

## Learn More

- [MiniKit Documentation](https://docs.base.org/builderkits/minikit/overview)
- [OnchainKit Documentation](https://docs.base.org/builderkits/onchainkit/getting-started)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- `/instructions/` directory for all project docs

NEXT_PUBLIC_APP_HERO_IMAGE=
NEXT_PUBLIC_APP_TAGLINE=
NEXT_PUBLIC_APP_OG_TITLE=
NEXT_PUBLIC_APP_OG_DESCRIPTION=
NEXT_PUBLIC_APP_OG_IMAGE=

## Redis config

REDIS_URL=
REDIS_TOKEN=

````shell

3. Start the development server:
```bash
npm run dev
````

## Template Features

### Frame Configuration

- `.well-known/farcaster.json` endpoint configured for Frame metadata and account association
- Frame metadata automatically added to page headers in `layout.tsx`

### Background Notifications

- Redis-backed notification system using Upstash
- Ready-to-use notification endpoints in `api/notify` and `api/webhook`
- Notification client utilities in `lib/notification-client.ts`

### Theming

- Custom theme defined in `theme.css` with OnchainKit variables
- Pixel font integration with Pixelify Sans
- Dark/light mode support through OnchainKit

### MiniKit Provider

The app is wrapped with `MiniKitProvider` in `providers.tsx`, configured with:

- OnchainKit integration
- Access to Frames context
- Sets up Wagmi Connectors
- Sets up Frame SDK listeners
- Applies Safe Area Insets

## Project Customization

To get started building your own frame, follow these steps:

1. Remove the DemoComponents:

   - Delete `components/DemoComponents.tsx`
   - Remove demo-related imports from `page.tsx`

2. Start building your Frame:

   - Modify `page.tsx` to create your Frame UI
   - Update theme variables in `theme.css`
   - Adjust MiniKit configuration in `providers.tsx`

3. Add your frame to your account:
   - Cast your frame to see it in action
   - Share your frame with others to start building your community

## Links to Learn More

- [MiniKit Documentation](https://docs.base.org/builderkits/minikit/overview)
- [OnchainKit Documentation](https://docs.base.org/builderkits/onchainkit/getting-started)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## Acknowledgments

KISSMINT DASH makes use of the following open source and third-party packages:

- [React](https://react.dev/)
- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [React Hook Form](https://react-hook-form.com/)
- [ethers.js](https://docs.ethers.org/)
- [wagmi](https://wagmi.sh/)
- [RainbowKit](https://www.rainbowkit.com/)
- [OpenZeppelin](https://openzeppelin.com/contracts/)
- [MongoDB](https://www.mongodb.com/)
- [Redis](https://redis.io/)
- [Turso](https://turso.tech/)
- [Upstash](https://upstash.com/)
- [Serverless](https://www.serverless.com/)
- [GitHub Actions](https://github.com/features/actions)
- [ngrok](https://ngrok.com/)

We thank the developers and maintainers of these projects for their contributions to the open source community.
