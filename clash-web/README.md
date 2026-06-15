# Clash — Date Differently

A brutalist-minimal dating web app built with Next.js, Tailwind CSS, and Supabase.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router) + Tailwind CSS |
| Backend & DB | Supabase (PostgreSQL + PostGIS) |
| Auth | Truecaller SDK + Google/Facebook OAuth + Email OTP |
| Email | Resend (100/day free) |
| Monetization | Google AdMob |
| Deploy | Vercel (free hobby tier) |

## Discovery Modes

- **Daily Clash** — 1 curated match per 24 hours, 3-question format
- **Normal Swipe** — Profile card stack with ads injected every 3rd card
- **Spark Room** — Anonymous 60-second voice chat, text-only messaging after

## Design System

```
Accent:       #E30613 (Editorial Red)
Border radius: 4px (sharp, brutalist)
Border width:  1px (hairline)
Image ratio:   4:5
Theme:         System-adaptive (light/dark)
```

## Setup

```bash
git clone <repo-url>
cd clash-web
npm install

# 1. Create project at supabase.com
# 2. Run supabase/migration.sql in SQL editor
# 3. Copy .env.example to .env.local and fill in your keys

cp .env.example .env.local
npm run dev
```

## Project Structure

```
src/
├── app/
│   ├── layout.js          # Root layout + dark mode + fonts
│   ├── globals.css         # Design system CSS variables
│   └── page.js             # Main page (auth → onboarding → app)
├── lib/
│   ├── supabase.js         # Supabase client
│   ├── auth.js             # Auth context provider
│   └── constants.js        # Design tokens + data options
└── components/
    ├── AuthPage.js          # Welcome + email OTP with 60s cooldown
    ├── OnboardingPage.js    # 4-step profile wizard
    ├── ui/
    │   ├── AppShell.js      # Sidebar (desktop) + bottom nav (mobile)
    │   ├── Button.js        # Primary / outline / ghost variants
    │   ├── Input.js         # Text + multiline with validation
    │   └── ChipSelector.js  # Single/multi-select chips
    ├── cards/
    │   └── ProfileCard.js   # 4:5 card + split action footer + AdCard
    └── tabs/
        ├── ClashTab.js      # Daily clash (3 questions, 1/day)
        ├── SwipeTab.js      # Swipe stack + ad injection (% 3)
        ├── SparkTab.js      # 60s voice room + waveform + timer
        ├── MessagesTab.js   # Status row + chat list + inline chat
        └── ProfileTab.js    # Premium ₹99 + tokens + settings
```

## Deploy to Vercel

```bash
npx vercel
```

## License

Proprietary. All rights reserved.
