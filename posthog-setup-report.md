<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into LegitReach. Here is a summary of all changes made:

- **`next.config.ts`** — Added PostHog reverse-proxy rewrites (`/ingest`) and `skipTrailingSlashRedirect: true` for reliable event ingestion without ad-blocker interference.
- **`src/providers/posthog.tsx`** — Updated PostHog init config: set `api_host` to `/ingest`, added `ui_host`, `defaults: '2026-01-30'`, `capture_exceptions: true`, and `debug` mode in development.
- **`src/lib/posthog-server.ts`** *(new)* — Server-side PostHog client (`posthog-node`) for capturing events from API routes.
- **`src/app/page.tsx`** — Added `try_for_free_clicked` and `sign_in_clicked` events on landing page CTAs.
- **`src/app/onboarding/page.tsx`** — Added `onboarding_step_completed` on steps 1 and 2, `onboarding_completed` on final step, and `captureException` on subreddit fetch error.
- **`src/app/dashboard/page.tsx`** — Added `curate_with_ai_clicked`, `ai_curation_completed`, and `captureException` around AI curation.
- **`src/components/PostCard.tsx`** — Added `post_viewed` on "View & Draft Reply" click and `post_marked_done` on "Done" button.
- **`src/app/dashboard/post/page.tsx`** — Added `ai_reply_generated` after AI response, `reply_copied` on clipboard copy, `reply_on_reddit_clicked` on Reddit link, and `captureException` on AI generation error.
- **`src/app/subscribe/page.tsx`** — Added `checkout_initiated` on "Get 5 more requests" click and `captureException` on checkout error.
- **`src/app/api/webhook/route.ts`** — Added server-side `payment_completed` event after Stripe webhook confirms a successful payment.
- **`.env.local`** — Set `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`.

## Events

| Event | Description | File |
|-------|-------------|------|
| `try_for_free_clicked` | User clicks the 'Try for free' button on the landing page | `src/app/page.tsx` |
| `sign_in_clicked` | User clicks the Sign In button on the landing page | `src/app/page.tsx` |
| `onboarding_step_completed` | User completes a step in the onboarding flow (properties: step, keywords_count / business_desc_length / communities_count) | `src/app/onboarding/page.tsx` |
| `onboarding_completed` | User finishes onboarding and proceeds to the dashboard | `src/app/onboarding/page.tsx` |
| `curate_with_ai_clicked` | User clicks the 'Curate with AI' button on the dashboard | `src/app/dashboard/page.tsx` |
| `ai_curation_completed` | AI curation completes successfully (properties: curated_post_count) | `src/app/dashboard/page.tsx` |
| `post_viewed` | User clicks 'View & Draft Reply' to open a Reddit post (properties: post_id, subreddit) | `src/components/PostCard.tsx` |
| `post_marked_done` | User marks a Reddit post opportunity as done (properties: post_id, subreddit) | `src/components/PostCard.tsx` |
| `ai_reply_generated` | User generates an AI reply for a Reddit post (properties: post_id, subreddit) | `src/app/dashboard/post/page.tsx` |
| `reply_copied` | User copies the drafted reply to clipboard | `src/app/dashboard/post/page.tsx` |
| `reply_on_reddit_clicked` | User clicks 'Reply on Reddit' to open the Reddit post (properties: post_id, subreddit) | `src/app/dashboard/post/page.tsx` |
| `checkout_initiated` | User clicks 'Get 5 more requests' to start the Stripe checkout | `src/app/subscribe/page.tsx` |
| `payment_completed` | Stripe webhook confirms a successful checkout.session.completed event — server-side (properties: credits_added, amount_usd, stripe_session_id) | `src/app/api/webhook/route.ts` |

## LLM Analytics (Phase 2)

Manual `$ai_generation` events are now captured on every Gemini API call in both AI routes, using `posthog-node` server-side.

### Changes

- **`src/app/api/ai/generate/route.ts`** — Added `$ai_generation` capture for reply generation with full LLM analytics properties.
- **`src/app/api/ai/curate/route.ts`** — Added `$ai_generation` capture for post curation, including `posts_analyzed` count.

### `$ai_generation` properties captured

| Property | Description |
|----------|-------------|
| `$ai_trace_id` | UUID per request for tracing |
| `$ai_span_name` | `reply_generation` or `post_curation` |
| `$ai_model` | `gemini-2.5-flash` |
| `$ai_provider` | `google` |
| `$ai_input` | Full prompt as `[{ role, content }]` |
| `$ai_input_tokens` | `promptTokenCount` from Gemini `usageMetadata` |
| `$ai_output_tokens` | `candidatesTokenCount` from Gemini `usageMetadata` |
| `$ai_output_choices` | Raw response text as `[{ role, content }]` |
| `$ai_latency` | Response time in seconds |
| `$ai_is_error` | `true` on failure |
| `$ai_error` | Error message string on failure |
| `posts_analyzed` | Number of Reddit posts sent for curation (curate route only) |

> Note: `@posthog/ai` wrapper was not used because the project uses `@google/generative-ai` (older SDK) which is incompatible with the wrapper's `@google/genai` requirement. Manual capture achieves the same result.

### LLM Analytics dashboard

- [LLM Analytics dashboard](https://us.posthog.com/project/343391/dashboard/1364823)
- [AI Generations (Daily)](https://us.posthog.com/project/343391/insights/uV6Z4FHy) — total `$ai_generation` events per day
- [AI Latency (Avg & P95)](https://us.posthog.com/project/343391/insights/RBGPnG5b) — average and P95 `$ai_latency` per day
- [AI Token Usage (Input & Output)](https://us.posthog.com/project/343391/insights/6tm32uvV) — sum of `$ai_input_tokens` and `$ai_output_tokens` per day
- [AI Generation Errors](https://us.posthog.com/project/343391/insights/nNyPOahb) — count of failed generations per day

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](https://us.posthog.com/project/343391/dashboard/1364820)
- [Signup Conversion Funnel](https://us.posthog.com/project/343391/insights/H3NxEBNT) — `try_for_free_clicked` → `onboarding_completed`
- [Payment Conversion Funnel](https://us.posthog.com/project/343391/insights/sxfz8eTA) — `checkout_initiated` → `payment_completed`
- [Reply Engagement Trend](https://us.posthog.com/project/343391/insights/RqbSpbuE) — `post_viewed`, `ai_reply_generated`, `reply_copied`, `reply_on_reddit_clicked`
- [AI Curation Adoption](https://us.posthog.com/project/343391/insights/0HhvjwRy) — `curate_with_ai_clicked`, `ai_curation_completed`
- [Key Actions Daily](https://us.posthog.com/project/343391/insights/TIGSjgDx) — `try_for_free_clicked`, `onboarding_completed`, `payment_completed`

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
