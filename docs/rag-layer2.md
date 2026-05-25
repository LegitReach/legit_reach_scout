# RAG for Comment Suggestion — Layer 2 Design Doc

## The Problem

Today, every comment suggestion is generated cold. The agent receives the post, the business description, and a prompt telling it to sound like a real community member. It has no memory of what this specific brand has approved before — so every reply is Gemini guessing what the brand sounds like from a one-sentence description.

The output is generic. It could come from any brand in the same category.

---

## How RAG Fixes This

Before calling Gemini, embed the current post and query the database for the most similar posts this brand has previously approved a reply for. Pass those approved (post → reply) pairs as few-shot examples in the prompt.

### Today's prompt

```
Post: "Anyone struggling with retinol in winter?"
Business: "We sell gentle skincare for sensitive skin"
Rules: sound human, 1–3 sentences, no CTA
```

### With RAG

```
Post: "Anyone struggling with retinol in winter?"
Business: "We sell gentle skincare for sensitive skin"

Here is how this brand has replied to similar posts before:

Example 1 (r/SkincareAddiction, approved):
  Post: "Is niacinamide safe with retinol?"
  Reply: "Layering them is fine — just go niacinamide first,
          wait 20 min, then retinol. If your skin's reactive,
          alternating nights works better than stacking."

Example 2 (r/30PlusSkinCare, approved):
  Post: "My skin barrier is wrecked from over-exfoliating"
  Reply: "Been there. Strip everything back to cleanser +
          moisturiser for 2 weeks. No actives. Your barrier
          needs time, not more products."

Match this tone and style.
```

Now Gemini has concrete evidence of the brand's voice — register, length, science level, warmth. It mirrors that instead of guessing.

---

## What Specifically Improves

| Signal | What it teaches the agent |
|--------|--------------------------|
| **Tone calibration** | Warm vs clinical vs casual — learned from real approvals, not a description |
| **Length** | If every approved reply is 2 sentences, future replies will be 2 sentences |
| **Subreddit awareness** | r/skincareaddiction expects ingredient detail; r/30plusskincare wants practical advice. Filter retrieved examples by subreddit and the agent learns this automatically |
| **Drift correction** | If the human keeps skipping replies that mention products, the retrieved examples passively teach the agent not to — without changing the prompt |

---

## The Compounding Effect

| Timeline | State |
|----------|-------|
| Day 1 | 0 approved examples → generic output |
| Day 7 | ~10 approved examples → noticeably on-brand |
| Day 30 | 50+ approved examples → sounds like it was trained on this brand specifically |

Each approval makes the next suggestion better. This is the flywheel from the pitch deck, implemented.

---

## What Layer 1 Looks Like Today (a16z demo)

The current flow already collects the right signals:

1. User enters their website URL
2. Magic scan extracts brand profile: `businessDescription`, `keywords`, `subreddits`
3. Curation fetches and scores Reddit posts via ScrapeCreators
4. For each post, Gemini generates a structured `EngagementPlan` + `draft` reply
5. User clicks **Approve** or **Skip** on each post

The approve/skip action is the reward signal. We just need to persist it.

---

## Data to Collect Now (Layer 1 → Layer 2 bridge)

Log every approve/skip event with this shape. `post_embedding` is null for now — backfill it when pgvector is enabled.

```sql
create table brand_events (
  id             uuid primary key default gen_random_uuid(),
  user_id        text not null,
  action         text not null,   -- 'approve' | 'skip'
  subreddit      text not null,
  post_title     text not null,
  post_excerpt   text,            -- first 300 chars of body
  draft_reply    text,            -- the reply shown to the user
  post_embedding vector(768),     -- null until pgvector backfill
  created_at     timestamptz default now()
);
```

---

## Layer 2 Implementation Plan

### Step 1 — Enable pgvector (zero new infrastructure)
```sql
create extension if not exists vector;
```
Supabase supports this natively. One line.

### Step 2 — Embed at approve time

When the user approves a post, call Gemini's embedding API on `post_title + post_body_excerpt` and store the result in `post_embedding`.

```typescript
const embedding = await getGeminiEmbedding(`${post.title} ${post.selftext.slice(0, 300)}`);
await supabase.from("brand_events").insert({
  ...eventData,
  post_embedding: embedding,
});
```

### Step 3 — Retrieve at generation time

Before calling Gemini to draft a reply, query for the 3 most similar approved posts for this brand:

```sql
select post_title, draft_reply
from brand_events
where user_id = $1
  and action = 'approve'
  and post_embedding is not null
order by post_embedding <=> $2  -- cosine distance
limit 3;
```

### Step 4 — Inject as few-shot examples

Prepend the retrieved pairs to the Gemini prompt before generating the draft. The agent now has a brand-specific writing sample, not just a description.

---

## Recommended Stack

- **Supabase pgvector** — already in the stack, zero new infrastructure
- **Gemini Embedding API** (`text-embedding-004`, 768 dimensions) — same SDK already used for generation
- **Mem0** — optional upgrade for managed memory with forgetting, summarisation, and conflict resolution built in

---

## RL Connection

This is the reward loop from the pitch deck implemented in code:

| RL concept | Implementation |
|------------|---------------|
| **State** | The Reddit thread (subreddit, post content, intent score) |
| **Action** | The agent's drafted reply |
| **Reward signal** | Human approval or skip in the dashboard |
| **Policy update** | Retrieved few-shot examples shift future output toward what was approved |

Not full academic RL — no value function, no gradient updates. It's retrieval-augmented generation with a human reward filter. The practical, shippable version of the same idea.
