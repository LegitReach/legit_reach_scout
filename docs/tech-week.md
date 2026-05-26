# Tech-Week — Design & Architecture

> Feature deadline: **26 May 2026**
> Status: Planned — not yet implemented

---

## What Is Tech-Week?

Tech-Week is a focused Reddit engagement pipeline that replaces the scatter-shot multi-community approach of `a16z/curate` with a single, deeply-aligned community strategy. Instead of scanning 5 subreddits for any loosely relevant post, Tech-Week:

1. Finds the **one community** where the brand genuinely belongs
2. Tells the user exactly **how welcome brand presence is** in that community
3. Returns **exactly 3 posts** — each with a distinct, deliberate intent

The output is not a feed. It is a three-action playbook: one post to read, one to comment on, one blueprint to create.

---

## Why Not Just Use `a16z/curate`?

| `a16z/curate` | `tech-week` |
|---|---|
| Multiple subreddits, broad scan | One community, deep alignment |
| Gemini picks subreddits from scraped list (training data, may hallucinate) | Exa discovers communities from live Reddit (guaranteed to exist and be active) |
| No signal on community culture or promotion rules | Explicit `promotionStance` derived from actual subreddit rules |
| Variable number of posts returned | Always exactly 3 posts with defined purpose |
| Posts ranked by relevance score | Posts selected by strategic intent |

---

## Technology Decisions

| Task | Tool | Reason |
|---|---|---|
| Scrape store URL | **Jina AI** (`r.jina.ai`) | Already integrated, proven, returns clean markdown |
| Structure brand JSON | **Gemini Flash** | Fast, cheap, good at JSON extraction from text |
| Discover Reddit communities | **Exa** (neural search) | Searches live web — communities it finds are guaranteed to exist and be active |
| Fetch subreddit rules | **Apify** (`website-content-crawler`) | All Reddit data comes from Apify per project constraint |
| Fetch subreddit posts | **Apify** (`reddit-scraper`) | All Reddit data comes from Apify per project constraint |
| Community selection + reasoning | **Gemini Flash** | Reads real rules text + brand profile to make a grounded decision |
| Post selection + curation | **Gemini Flash** | Comparative selection across all 25 posts in one call |

> **Rule:** Any information retrieved from Reddit must come via Apify. Not the Reddit public API, not direct scraping.

> **Pipeline note:** Claude (Anthropic) is a planned replacement for Gemini in a future iteration — specifically for community selection reasoning and reply drafting where nuanced judgment matters. Kept out of scope for the 26 May deadline.

---

## Credentials Required

All keys are already present in `.env.local`:

| Variable | Used for |
|---|---|
| `JINA_API_KEY` | Store URL scraping |
| `GEMINI_API_KEY` | Brand JSON extraction, community selection, post curation |
| `EXA_API_KEY` | Reddit community discovery |
| `APIFY_API_TOKEN` | Subreddit rules fetch + subreddit post feed |

No new credentials need to be added.

---

## File Structure

```
src/app/api/tech-week/
├── magic-scan/
│   └── route.ts        ← Brand profile + community selection
└── curate/
    └── route.ts        ← 3-post playbook generation
```

Shared utility (to be created):
```
src/lib/exa.ts          ← Exa client wrapper
```

---

## Endpoint 1: `POST /api/tech-week/magic-scan`

### Input
```ts
{ url: string }
```

### Pipeline

```
Step 1  JINA
  GET https://r.jina.ai/{url}
  Headers: { X-Return-Format: markdown }
  → raw markdown content of the store homepage

Step 2  GEMINI
  Prompt: extract brand profile from the scraped content
  → structured brand JSON (see schema below)

Step 3  EXA  (2 parallel calls)
  Call A — neural search:
    exa.search("{buyerProblems[0]} {keywords[0]} community", {
      type: "neural",
      includeDomains: ["reddit.com"],
      numResults: 15,
      contents: { text: { maxCharacters: 300 } }
    })
  Call B — findSimilar on store URL:
    exa.findSimilar(storeUrl, {
      includeDomains: ["reddit.com"],
      numResults: 10
    })
  → parse all result URLs with regex /reddit\.com\/r\/([^\/]+)/
  → count frequency across both call results
  → top 3 subreddit names (deduplicated, frequency-ranked)

Step 4  APIFY  (3 parallel calls — one per candidate community)
  Actor: apify~website-content-crawler
  Input per call:
    {
      "startUrls": [{ "url": "https://www.reddit.com/r/{subreddit}/about/rules/" }],
      "maxCrawlPages": 1
    }
  → raw rules text for each candidate

Step 5  GEMINI
  Prompt: given brand profile + 3 candidates with their rules text + Exa post snippets
  → pick ONE community
  → determine promotionStance from actual rules
  → output community object (see schema below)
```

### Output Schema

```ts
{
  // Brand profile — used by /curate
  brandProfile: {
    tagline: string
    businessDescription: string
    targetAudience: string
    productCategories: string[]
    keywords: string[]
    brandValues: string[]          // e.g. ["sustainability", "minimalism"]
    voiceTone: string              // e.g. "warm and peer-to-peer"
    buyerProblems: string[]        // pain points in buyer's own words
    nicheScore: 1 | 2 | 3         // 1=niche, 2=mid, 3=commodity
  }

  // Selected community — used by /curate
  community: {
    subreddit: string              // e.g. "r/fountainpens"
    selectionReason: string        // why this community is the right fit
    alignmentType: "product" | "identity" | "problem"
    promotionStance: "friendly" | "neutral" | "strict"
    promotionStanceReason: string  // e.g. "Rule 4 explicitly bans brand accounts"
  }

  // Pass-through metadata
  meta: {
    brandName: string
    storeUrl: string
    ogImage: string
  }
}
```

### `nicheScore` — How It Affects Strategy

| Score | Meaning | Community selection approach |
|---|---|---|
| `1` — Niche | Narrow, specialist product | Align on **identity and values** — who the buyer *is*, not what they buy |
| `2` — Mid | Recognisable category, multiple players | Align on **problem space** — the thing the product solves |
| `3` — Commodity | Broad, widely available product | Align on **buyer intent** — where people actively seek recommendations |

### `promotionStance` — How It Affects Downstream Behaviour

| Stance | `draftComment` behaviour | `creation` guideline behaviour |
|---|---|---|
| `friendly` | May mention product naturally if directly relevant | Can suggest a soft brand intro post format |
| `neutral` | Mention product only if directly asked | Guidelines focus on value-first, brand secondary |
| `strict` | Zero product mention — pure value add | Guideline warns explicitly against any brand association |

---

## Endpoint 2: `POST /api/tech-week/curate`

### Input
```ts
{
  brandProfile: BrandProfile    // from magic-scan
  community: Community          // from magic-scan
}
```

### Pipeline

```
Step 1  APIFY
  Actor: apify~reddit-scraper
  Input:
    {
      "startUrls": [{ "url": "https://www.reddit.com/r/{subreddit}/hot/" }],
      "maxItems": 25
    }
  API call:
    POST https://api.apify.com/v2/acts/apify~reddit-scraper/run-sync-get-dataset-items
         ?token={APIFY_API_TOKEN}
  → 25 posts from the community's hot feed

Step 2  GEMINI  (single call — all 25 posts in one prompt)
  Prompt inputs:
    - full brandProfile
    - community object (including promotionStance)
    - all 25 posts (id, title, body excerpt, score, num_comments, created_utc)
  → returns all 3 outputs in one JSON response
```

> **Why one Gemini call?** Gemini sees all 25 posts simultaneously and makes comparative decisions. Separate calls risk picking the same post twice or selecting suboptimally because the model can't weigh options against each other.

### Output Schema

```ts
{
  sentiment: {
    post: RedditPost
    communityInsight: string    // "This community values X, distrusts Y, responds well to Z"
  }

  engagement: {
    post: RedditPost
    draftComment: string        // ready-to-post, in community tone, respects promotionStance
    whyThisPost: string         // brief reason this is the best engagement opportunity
  }

  creation: {
    suggestedTitle: string
    format: "question" | "discussion" | "advice" | "showcase"
    tone: string
    contentOutline: string[]    // ["Open with the problem", "Share your angle", ...]
    whatToAvoid: string[]       // ["Don't mention brand in title", ...]
    postingTips: string         // "Post Tuesday morning, use Discussion flair"
  }
}
```

### The 3 Posts — Intent & Selection Criteria

**Post 1 — Sentiment (read/upvote)**
- Purpose: understand what the community values before engaging
- Selection: highest score, most comments, most representative of community culture
- The `communityInsight` is the real deliverable here — it primes the user before they engage

**Post 2 — Engagement (comment)**
- Purpose: enter the community with a genuine contribution
- Selection: active thread (recent), question or advice-seeking post, genuine value-add possible
- `draftComment` is shaped entirely by `promotionStance` — strict communities get pure value, no brand signal
- This is modelled after Post 1 community insight so the tone is consistent

**Post 3 — Creation (blueprint)**
- Purpose: eventually the user posts themselves — this is the guide for how to do it right
- This is NOT a real Reddit post — it is a structured guide
- Modelled after Post 1 (what already works in this community) but reframed around the brand's value
- `contentOutline` and `whatToAvoid` are derived from both the community rules (from magic-scan) and the post patterns Gemini observed in the 25 posts

---

## Data Flow

```
Client calls magic-scan(url)
  → receives { brandProfile, community, meta }
  → stores locally (sessionStorage or state)

Client calls curate({ brandProfile, community })
  → receives { sentiment, engagement, creation }
  → renders 3-post playbook
```

Both endpoints are stateless. The client holds the bridge between them. This makes each endpoint independently testable and cacheable.

---

## Apify Actor Reference

| Actor | ID | Used for |
|---|---|---|
| Reddit Scraper | `apify~reddit-scraper` | Subreddit post feed (curate step 1) |
| Website Content Crawler | `apify~website-content-crawler` | Subreddit rules pages (magic-scan step 4) |

**Apify synchronous run endpoint:**
```
POST https://api.apify.com/v2/acts/{actorId}/run-sync-get-dataset-items?token={APIFY_API_TOKEN}
Content-Type: application/json
```
Returns data inline. No polling. Max timeout: 300 seconds.

---

## Dependencies

| Package | Status | Used for |
|---|---|---|
| `exa-js` | **Not yet installed** | Exa community discovery (magic-scan step 3) |
| `@google/generative-ai` | Already installed | Gemini calls |
| `node-fetch` / native `fetch` | Native in Next.js 15+ | Jina + Apify REST calls |

Before building, install: `npm install exa-js`

---

## What Is Explicitly Out of Scope (for now)

- Claude as the AI model (planned for future — better for community reasoning and reply drafting)
- Apify for store URL scraping (Jina is sufficient and already working)
- Multi-community mode (this is a single-community-first design by intent)
- Real-time post updates or caching layer
- Frontend UI for the tech-week flow (endpoints only)
