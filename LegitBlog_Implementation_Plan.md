# LegitBlog Automation — Implementation Plan

## Context

Manthan is receiving inbound Shopify store owners who send their store link, and he manually generates SEO blog packages using the `/legitBlog` Claude Code skill. This plan automates that entire flow on the LegitReach app: users visit a public page, enter their Shopify store URL, select preferences, and receive a complete SEO blog package (blog post + hero image + details sheet) as a zip via email. First blog is free, subsequent blogs cost $10 via Stripe.

---

## Architecture Overview

```
User visits /legitBlog (public)
       │
       ▼
Step 1: Enter Shopify store URL → POST /api/legitblog/verify-store
Step 2: Select topic, audience, tone
Step 3: Sign in (Clerk) → check blog count in Redis
       │
       ├── count === 0 → POST /api/legitblog/submit (free, enqueue via QStash)
       └── count > 0  → POST /api/legitblog/checkout ($10 Stripe)
                              │
                              ▼
                    Stripe webhook → enqueue via QStash
       │
       ▼
QStash calls POST /api/legitblog/generate (async, up to 5 min)
  → Gemini: generate blog post → humanize → generate hero image (sharp/SVG)
  → Package zip (jszip) → Send via Resend email
  → Increment Redis count
       │
       ▼
User receives zip in email within 1 hour
```

---

## New Dependencies

| Package | Purpose |
|---------|---------|
| `resend` | Email delivery with zip attachment |
| `jszip` | In-memory zip creation |
| `sharp` | SVG-to-PNG hero image (Vercel-compatible) |
| `@upstash/qstash` | Async job queue (already using Upstash Redis) |

## New Environment Variables

```
RESEND_API_KEY=re_...
QSTASH_TOKEN=...
QSTASH_CURRENT_SIGNING_KEY=...
QSTASH_NEXT_SIGNING_KEY=...
RESEND_FROM_EMAIL=blog@legitreach.com
```

---

## Files to Create

### Library / Utilities
| File | Purpose |
|------|---------|
| `src/lib/resend.ts` | Resend client singleton |
| `src/lib/qstash.ts` | QStash client singleton |
| `src/lib/hero-image.ts` | Node.js hero image generation (SVG → sharp → PNG buffer) |
| `src/lib/blog-prompts.ts` | Gemini prompt builders for blog generation + humanizer pass |
| `src/lib/blog-types.ts` | TypeScript interfaces (BlogPreferences, BlogGenerationResult, etc.) |
| `src/lib/blog-parsers.ts` | Gemini response parsers + type guards |

### API Routes
| File | Purpose |
|------|---------|
| `src/app/api/legitblog/verify-store/route.ts` | Verify URL is a live Shopify store |
| `src/app/api/legitblog/submit/route.ts` | Auth check, count check, enqueue or redirect to checkout |
| `src/app/api/legitblog/checkout/route.ts` | Create $10 Stripe checkout session |
| `src/app/api/legitblog/generate/route.ts` | Async worker: full pipeline (Gemini + image + zip + email) |

### Pages
| File | Purpose |
|------|---------|
| `src/app/legitBlog/page.tsx` | Multi-step public form (store URL → preferences → auth gate → submit) |
| `src/app/legitBlog/legitBlog.module.css` | Page styles (follows onboarding pattern) |
| `src/app/legitBlog/success/page.tsx` | Confirmation: "Your blog is being generated, check email within 1 hour" |

## Files to Modify

| File | Change |
|------|--------|
| `src/app/api/webhook/route.ts` | Add handler for `metadata.type === "legitblog"` → enqueue QStash job |
| `package.json` | Add new dependencies |

---

## Implementation Sequence

### Phase 1: Infrastructure (Steps 1-4)
1. Install dependencies: `resend`, `jszip`, `sharp`, `@upstash/qstash`
2. Create `src/lib/blog-types.ts` — interfaces for BlogPreferences, BlogGenerationResult, BlogDetailsSheet
3. Create `src/lib/resend.ts` — Resend client singleton
4. Create `src/lib/qstash.ts` — QStash client singleton

### Phase 2: Core Generation (Steps 5-8)
5. Create `src/lib/hero-image.ts` — SVG gradient + title text → sharp → PNG buffer (1800x1000)
6. Create `src/lib/blog-prompts.ts` — Gemini prompts for:
   - Blog generation (~1500 words, returns structured JSON with meta_title, meta_description, slug, keywords, blog_html, excerpt, shopify_tags)
   - Humanizer pass (rewrites blog_html to remove AI patterns per the humanizer reference)
7. Create `src/lib/blog-parsers.ts` — Parse and validate Gemini responses
8. Create `src/app/api/legitblog/verify-store/route.ts` — Fetch URL, check for Shopify indicators (`x-shopify-stage` header, `cdn.shopify.com`, `Shopify.theme` in HTML), extract brand name from `<title>` or `og:site_name`

### Phase 3: API Routes (Steps 9-12)
9. Create `src/app/api/legitblog/generate/route.ts` — Full async pipeline:
   - Verify QStash signature
   - Retrieve job params from Redis (`legitblog:job:{jobId}`)
   - Fetch store page for brand context
   - Call Gemini for blog generation
   - Call Gemini for humanizer pass
   - Generate hero image via sharp
   - Build Blog_Details.txt
   - Package zip with jszip (Blog_Post_Content.txt + Blog_Hero_1800x1000.png + Blog_Details.txt)
   - Send zip via Resend email attachment
   - Increment `legitblog:count:{userId}` in Redis
   - Update job status to "completed"
   - Export `maxDuration = 300`
10. Create `src/app/api/legitblog/checkout/route.ts` — Stripe checkout with `unit_amount: 1000`, `metadata.type: "legitblog"`, `metadata.jobId`
11. Create `src/app/api/legitblog/submit/route.ts` — Orchestrator: auth check → count check → store job in Redis → enqueue via QStash (free) or return checkout URL (paid)
12. Modify `src/app/api/webhook/route.ts` — Add `legitblog` branch: on `checkout.session.completed` with `metadata.type === "legitblog"`, enqueue QStash job using `metadata.jobId`

### Phase 4: UI (Steps 13-14)
13. Create `src/app/legitBlog/page.tsx` — Multi-step form following onboarding pattern:
    - **Step 1**: Shopify store URL input + "Verify Store" button
    - **Step 2**: Topic direction (free text + suggested options)
    - **Step 3**: Target audience (radio: First-time buyers / Returning customers / Industry professionals / General)
    - **Step 4**: Tone (radio: Casual & conversational / Professional & authoritative / Warm & nurturing / Trendy & aspirational)
    - **Step 5**: Auth gate — show Clerk SignInButton if not signed in; show "Generate Free Blog" (count=0) or "Purchase & Generate ($10)" (count>0)
    - Persist form state in `sessionStorage` to survive Clerk auth redirect
14. Create `src/app/legitBlog/success/page.tsx` — Confirmation page with email delivery ETA

### Phase 5: Testing & Verification
15. Test store verification with real Shopify URLs
16. Test Gemini blog generation quality + humanizer output
17. Test hero image generation locally
18. Test zip packaging and Resend email delivery
19. Test Stripe $10 checkout flow (test mode)
20. Test QStash webhook flow end-to-end (use ngrok for local dev)
21. Test idempotency (QStash retries don't duplicate)

---

## Redis Key Design

| Key | Type | TTL | Purpose |
|-----|------|-----|---------|
| `legitblog:count:{userId}` | integer | none | Lifetime blog count per user |
| `legitblog:job:{jobId}` | JSON string | 24h | Full job params: storeUrl, brandName, topic, audience, tone, userId, email, status |

Count is incremented only after successful email delivery (not at enqueue time) to prevent inflation on failures.

---

## Error Handling

- **Store verification fails**: Clear error message ("Not a Shopify store" / "URL unreachable")
- **Gemini fails**: Retry once, then mark job failed + send apology email
- **Hero image fails**: Generate zip without image, note in details sheet
- **Email delivery fails**: Retry once, log to PostHog
- **Stripe paid but generation fails**: Failure email instructs user to contact support for refund
- **QStash retries**: Generate endpoint is idempotent — checks job status before processing

---

## Shopify Store Verification Logic

```
1. Normalize URL (add https://, strip trailing slash)
2. Fetch with 10s timeout
3. Check indicators:
   - Header: x-shopify-stage exists
   - HTML contains: cdn.shopify.com OR Shopify.theme OR meta name="shopify-checkout-api-token"
4. Extract brand name from <title> or og:site_name meta tag
5. Return { valid, brandName, error? }
```

---

## Blog_Details.txt Format

```
====================================================
[BRAND NAME] — SEO BLOG POST PACKAGE
Prepared by LegitReach
====================================================

TITLE: [Full blog post title]
META TITLE: [SEO meta title]
META DESCRIPTION: [Meta description]
SLUG: [URL slug]

----------------------------------------------------
EXCERPT:
----------------------------------------------------
[The excerpt]

----------------------------------------------------
SHOPIFY TAGS:
----------------------------------------------------
Primary: [comma-separated]
Secondary: [comma-separated]
Brand: [comma-separated]

----------------------------------------------------
INCLUDED FILES:
----------------------------------------------------
1. Blog_Details.txt — This file
2. Blog_Post_Content.txt — Full SEO blog post content
3. Blog_Hero_1800x1000.png — Hero image (1800 x 1000 px)

====================================================
Prepared by LegitReach | legitreach.official@gmail.com
====================================================
```
