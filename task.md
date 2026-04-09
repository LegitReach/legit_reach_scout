# Personalized Newsletter Feature Tasks

## Phase 1: Global Search Core
- [x] Implement `searchRedditGlobal` in `src/lib/reddit-utils.ts` (Global search vs. subreddit-specific)
- [ ] Implement `generateSearchQueries` logic using Gemini
- [ ] Refine `processCuration` logic to handle global search inputs

## Phase 2: Data Sources & Storage
- [ ] Add `newsletters` table in Supabase
- [ ] Add `newsletter_enabled` flag to `onboarding_details`
- [ ] Build Google News fetcher utility
- [ ] Finalize "Morning Legit" synthesis prompt

## Phase 3: Delivery & Scheduling
- [ ] Set up Resend and React Email template
- [ ] Create `/api/cron/newsletter` endpoint
- [ ] Configure Upstash QStash schedule

## Phase 4: Dashboard Integration
- [ ] Expose newsletter data to UI
- [ ] Adjust for Bloomberg-style terminal layout
