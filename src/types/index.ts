// ─────────────────────────────────────────────────────────
// Shared domain types for LegitReach Scout
// ─────────────────────────────────────────────────────────

// --------------- Reddit ---------------

export interface RedditPost {
  id: string;
  title: string;
  subreddit: string;
  author: string;
  score: number;
  num_comments: number;
  created_utc: number;
  selftext: string;
  permalink: string;
  url: string;
  upvote_ratio?: number;     // 0.0–1.0, e.g. 0.93 means 93% upvoted
  link_flair_text?: string;  // subreddit flair tag, e.g. "Win", "Question"
  relevance_score?: number;
  opportunity_type?: string;
}

// --------------- AI / Gemini ---------------

/** The shape Gemini must return from the reply-generation prompt */
export interface AIGeneratedReply {
  reply: string;
}

/** Single entry in a curated post list */
export interface CuratedResult {
  /** Matches the source RedditPost.id */
  id: string;
  /** 0-100: how keyword-relevant the post is to the user's business */
  ai_relevance_score: number;
  /** 0-100: quality of the engagement opportunity */
  ai_opportunity_score: number;
  /** 1-2 sentence reasoning */
  ai_reasoning: string;
  /** Priority action for the user */
  recommended_action: "engage" | "monitor" | "skip";
}

/** Full response from POST /api/ai/curate */
export interface CurateResponse {
  curated_posts: CuratedResult[];
  summary: string;
  total_analyzed: number;
}

/** Full response from POST /api/dashboard/curate */
export interface DashboardCurateResponse extends CurateResponse {
  posts: RedditPost[];
  fromCache?: boolean;
}

/** Request body for POST /api/ai/curate */
export interface CurateRequest {
  posts: RedditPost[];
  keywords: string[];
  businessDescription: string;
}

// ─────────────────────────────────────────────────────────
// Runtime type-guards
// These guards let us validate Gemini JSON responses at
// runtime and provide feedback when the shape is wrong.
// ─────────────────────────────────────────────────────────

/** Shape Gemini must return when asked to generate search keywords */
export interface AIQueryResult {
  keywords: string;
}

export function isAIQueryResult(obj: unknown): obj is AIQueryResult {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "keywords" in obj &&
    typeof (obj as Record<string, unknown>).keywords === "string"
  );
}

export function isAIGeneratedReply(obj: unknown): obj is AIGeneratedReply {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "reply" in obj &&
    typeof (obj as Record<string, unknown>).reply === "string"
  );
}

export function isCuratedResult(obj: unknown): obj is CuratedResult {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.ai_relevance_score === "number" &&
    typeof o.ai_opportunity_score === "number" &&
    typeof o.ai_reasoning === "string" &&
    (o.recommended_action === "engage" ||
      o.recommended_action === "monitor" ||
      o.recommended_action === "skip")
  );
}

export function isCurateResponse(obj: unknown): obj is CurateResponse {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    Array.isArray(o.curated_posts) &&
    o.curated_posts.every(isCuratedResult) &&
    typeof o.summary === "string" &&
    typeof o.total_analyzed === "number"
  );
}
