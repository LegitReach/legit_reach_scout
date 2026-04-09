# Personalized Newsletter Feature

## Goal
Build a daily personalized newsletter for LegitReach users, delivered at 7:00 AM. The newsletter will contain curated insights from **Reddit** and **Google News**, tailored to the user's business description and keywords.

## User Review Required
> [!IMPORTANT]
> **Email Provider**: I recommend using **Resend**. It integrates seamlessly with Next.js and allows using React components for email templates. Do you have a preferred provider?
> 
> **CRON Service**: I recommend **Upstash QStash**. It's already partially in your tech stack and provides reliable serverless CRON triggers.
> 
> **Google News Source**: I propose starting with a lightweight RSS-to-JSON approach for Google News or a dedicated News API (e.g., NewsAPI.ai). Is there a specific news source or provider you prefer?

## Proposed Architecture

### 1. Data Aggregator (Source Layer)
- **Global Reddit Search**: 
    - **Step 1**: Use Gemini to generate 3-5 high-intent search queries based on the Business Pitch + Keywords.
    - **Step 2**: Search the entire Reddit platform (not just specific subreddits) for these queries.
    - **Step 3**: Filter and deduplicate results.
- **Google News**: Fetch current news articles matching the same AI-generated queries.
- **X (Twitter) [Future]**: Extensible source layer for X API.

### 2. AI Synthesis (Logic Layer)
- **Gemini AI**: A specific prompt to "distill" Reddit, Google News, and (eventually) X posts into a cohesive, concise briefing ("The Morning Legit").
- **Context Expansion**: Ensure the prompt can eventually incorporate specific **Product Details** alongside the business pitch and keywords for deeper personalization.

### 3. Storage & Delivery (Platform Layer)
- **Supabase**: A new `newsletters` table to store history for dashboard viewing.
- **Resend**: Email automation for 7:00 AM delivery.
- **Upstash QStash**: Reliable daily CRON trigger.

## Iteration Plan

### Phase 1: Global Search Core (The "Search Engine")
- [x] **Reddit Search Utility**: Implement `searchRedditGlobal` in `src/lib/reddit-utils.ts`.
- [x] **AI Query Generation**: Build `generateSearchQueries` in `src/lib/newsletter-ai.ts`.
- **Curation Engine (Sub-Phases)**:
    - **A. Aggregator**: Logic to loop through queries, execute `searchRedditGlobal`, and deduplicate results.
    - **B. AI Vetting**: Refine the prompt to score global results (last 24h) and select the top 5-10 "Gold Leads."
    - **C. Synthesis**: Generate a 2-3 sentence "Morning Briefing" that ties the findings together.

### Phase 2: Data Sources & Storage (The "Brain")
- **Database**: Add `newsletters` table in Supabase and `newsletter_enabled` toggle to `onboarding_details`.
- **Google News**: Implement the Google News fetcher utility (using the same AI queries).
- **Final Integration**: Create the `processNewsletter` orchestrator that combines Phase 1 and 2.

### Phase 3: Delivery & Scheduling (The "Messenger")
- **Email Service**: Set up Resend and create the React Email template for the briefing.
- **CRON Endpoint**: Create `/api/cron/newsletter` and configure Upstash QStash to trigger it at 7:00 AM daily.

### Phase 4: Dashboard Integration
- Expose the latest newsletter data to the UI.
- Prepare for Bloomberg-style terminal redesign.


## Open Questions
- **Timezone**: 7:00 AM UTC or User's Local Time? (Localized delivery requires storing the user's offset).
- **Opt-out UI**: Add a toggle in the **Settings** page to allow users to disable the daily newsletter.

## Verification Plan
### Automated Tests
- Mock Reddit/Google News inputs and verify Gemini's JSON output structure.
- Verify the CRON endpoint's security (auth key).
### Manual Verification
- Trigger a test run manually via a dashboard "Send Test Newsletter" button.
- Check formatting on various email clients (Gmail, Outlook).
