# LegitReach — E-Commerce Management System (EMS)

An advanced Bloomberg-style terminal designed for modern ecommerce brands. Enter your store URL and immediately launch a real-time command center loaded with brand intelligence, growth metrics, and autonomous AI agents designed to scout opportunities across the web.

## What It Does

LegitReach analyzes your ecommerce store URL and automatically provisions a personalized EMS terminal featuring three dynamic intelligence panels:

| Panel | Description | Status |
|---|---|---|
| **Data Sources** (Left) | Connect internal operational data — Shopify, Analytics, Email/SMS, Inventory, Ad Platforms, Payments | Coming Soon |
| **Brand Intelligence** (Center) | Live stream of Google News, Google Trends, and public brand mentions from the past 24 hours | ✅ Active |
| **AI Agents** (Right) | Active Reddit Agent scouting for highly relevant discussions and drafting replies. X/Twitter Agent to follow. | ✅ Reddit Active |

## How It Works

1. **Enter your store URL** on the landing page and click Magic Scan
2. **Sign in** (required) — while you authenticate, LegitReach starts scanning Reddit and building your newsletter in the background
3. **Interactive loading** — answer optional quick polls while your terminal initializes
4. **Terminal loads** — your Bloomberg-style dashboard with live brand intelligence, Reddit opportunities, and data source connections

## Tech Stack

- **Framework**: Next.js 16 (Turbopack)
- **Auth**: Clerk
- **AI**: Google Gemini (Flash) for store analysis, Reddit curation, and reply generation
- **Realtime**: Upstash Redis + Realtime for live dashboard updates
- **Styling**: CSS Modules + Tailwind CSS
- **Analytics**: PostHog
- **Database**: Supabase
- **Payments**: Stripe

## Getting Started

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Add your keys for: GEMINI_API_KEY, Clerk, Supabase, Upstash, Stripe, PostHog

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── terminal/          # Bloomberg-style EMS terminal (primary dashboard)
│   │   ├── page.tsx       # 3-panel terminal layout
│   │   ├── loading-screen.tsx  # Interactive loading with polls
│   │   └── terminal.module.css
│   ├── dashboard/         # Reddit Agent — full opportunities view
│   │   ├── page.tsx       # Curated Reddit leads
│   │   └── post/          # Individual post detail + reply drafting
│   ├── api/
│   │   ├── newsletter/    # Google News + Trends aggregation
│   │   ├── dashboard/     # Reddit curation pipeline
│   │   ├── onboarding/    # Magic Scan (store URL → config)
│   │   └── ai/            # Gemini-powered analysis
│   └── onboarding/        # Manual setup flow
├── components/
│   ├── Sidebar.tsx        # Navigation sidebar
│   ├── PostCard.tsx       # Reddit post card
│   └── RedditList.tsx     # Reddit post list
├── context/
│   └── AppContext.tsx      # Global state, caching, sync
└── ai/
    └── gemini.model.ts    # Gemini model configuration
```

## Key Routes

| Route | Purpose |
|---|---|
| `/` | Landing page with Magic Scan |
| `/terminal` | Bloomberg-style EMS terminal (main dashboard) |
| `/dashboard` | Full Reddit opportunities list |
| `/dashboard/post?id=` | Reddit post detail with AI reply drafting |
| `/dashboard/settings` | Configuration & settings |

## Reddit Agent

The Reddit Agent is the first active agent in the EMS:

1. **Scans** target subreddits using AI-selected keywords from your store
2. **Curates** posts using Gemini to score relevance and opportunity quality
3. **Drafts** contextual replies that match community tone
4. Shows **top 2 opportunities** on the terminal, with full list accessible via "Show All"

## Roadmap

- [x] Magic Scan (URL → automated configuration)
- [x] Bloomberg-style EMS Terminal
- [x] Reddit Agent (scan, curate, engage)
- [x] Brand Intelligence Newsletter (Google News + Trends)
- [x] Interactive onboarding with quick polls
- [ ] X/Twitter Agent
- [ ] Shopify integration
- [ ] Analytics dashboard
- [ ] Email/SMS platform connections
- [ ] Ad platform integrations
- [ ] Inventory management
- [ ] Multi-brand support

## License

Proprietary — LegitReach © 2025
