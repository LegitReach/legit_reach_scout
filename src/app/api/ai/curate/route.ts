import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel } from "@/ai/gemini.model";
import { withRateLimit } from "@/lib/withRateLimit";
import { parseCurateResponse, GeminiParseError } from "@/lib/gemini-parsers";
import type { CurateRequest, RedditPost } from "@/types";
import { getPostHogClient } from "@/lib/posthog-server";
import { getAuth } from "@clerk/nextjs/server";
import { randomUUID } from "crypto";

const MODEL_NAME = "gemini-2.5-flash";

// ──────────────────────────────────────────────────────────
// POST /api/ai/curate
//
// Accepts: { posts, keywords, businessDescription }
// Returns: CurateResponse  (curated_posts ranked by AI score)
// ──────────────────────────────────────────────────────────

async function handler(request: NextRequest): Promise<NextResponse> {
  if (request.method !== "POST") {
    return NextResponse.json({ error: "Only POST allowed" }, { status: 405 });
  }

  let body: Partial<CurateRequest> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { posts, keywords, businessDescription } = body;

  if (!Array.isArray(posts) || posts.length === 0) {
    return NextResponse.json(
      { error: "`posts` must be a non-empty array" },
      { status: 400 },
    );
  }
  if (!businessDescription || typeof businessDescription !== "string") {
    return NextResponse.json(
      { error: "`businessDescription` is required" },
      { status: 400 },
    );
  }

  // Trim posts to the fields Gemini needs (keep payload small)
  const slimPosts = (posts as RedditPost[]).slice(0, 20).map((p) => ({
    id: p.id,
    title: p.title,
    subreddit: p.subreddit,
    selftext: p.selftext?.substring(0, 300) ?? "",
    score: p.score,
    num_comments: p.num_comments,
  }));

  const prompt = buildCuratePrompt(
    businessDescription,
    (keywords ?? []).join(", "),
    slimPosts,
  );

  const { userId } = getAuth(request);
  const traceId = randomUUID();
  const startTime = Date.now();

  try {
    const result = await getGeminiModel(MODEL_NAME).generateContent(prompt);
    const latency = (Date.now() - startTime) / 1000;
    const rawText = result.response.text();
    const usage = result.response.usageMetadata;

    getPostHogClient().capture({
      distinctId: userId ?? "anonymous",
      event: "$ai_generation",
      properties: {
        $ai_trace_id: traceId,
        $ai_span_name: "post_curation",
        $ai_model: MODEL_NAME,
        $ai_provider: "google",
        $ai_input: [{ role: "user", content: prompt }],
        $ai_input_tokens: usage?.promptTokenCount,
        $ai_output_tokens: usage?.candidatesTokenCount,
        $ai_output_choices: [{ role: "assistant", content: rawText }],
        $ai_latency: latency,
        posts_analyzed: slimPosts.length,
      },
    });

    const curated = parseCurateResponse(rawText);

    // Sort curated posts: highest opportunity score first
    curated.curated_posts.sort(
      (a, b) => b.ai_opportunity_score - a.ai_opportunity_score,
    );

    return NextResponse.json(curated);
  } catch (err) {
    const latency = (Date.now() - startTime) / 1000;
    getPostHogClient().capture({
      distinctId: userId ?? "anonymous",
      event: "$ai_generation",
      properties: {
        $ai_trace_id: traceId,
        $ai_span_name: "post_curation",
        $ai_model: MODEL_NAME,
        $ai_provider: "google",
        $ai_input: [{ role: "user", content: prompt }],
        $ai_latency: latency,
        $ai_is_error: true,
        $ai_error: err instanceof Error ? err.message : String(err),
        posts_analyzed: slimPosts.length,
      },
    });

    if (err instanceof GeminiParseError) {
      console.error("Gemini curate response shape mismatch:", err.message);
      return NextResponse.json(
        { error: "AI returned an unexpected response format" },
        { status: 502 },
      );
    }
    console.error("Curate API error:", err);
    return NextResponse.json(
      { error: "Failed to curate posts" },
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(handler, 5);

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

function buildCuratePrompt(
  businessDescription: string,
  keywords: string,
  posts: Array<{
    id: string;
    title: string;
    subreddit: string;
    selftext: string;
    score: number;
    num_comments: number;
  }>,
): string {
  return `You are an expert Reddit growth analyst helping a business identify the best posts to engage with.

Business Description:
"${businessDescription}"

Target Keywords: ${keywords || "none specified"}

Analyze the ${posts.length} Reddit posts below. For each post:
1. ai_relevance_score (0-100): How closely does this post relate to the business keywords and description?
2. ai_opportunity_score (0-100): How valuable is it for the business to engage here? Consider recency, upvotes, comment activity and question intent.
3. ai_reasoning: 1-2 sentences explaining your scores.
4. recommended_action: "engage" (high priority — reply now), "monitor" (watch it), or "skip" (not relevant).

Posts to analyse:
${JSON.stringify(posts, null, 2)}

Return ONLY a valid JSON object matching this exact interface — no markdown, no extra text:

interface CurateResponse {
  curated_posts: Array<{
    id: string;
    ai_relevance_score: number;
    ai_opportunity_score: number;
    ai_reasoning: string;
    recommended_action: "engage" | "monitor" | "skip";
  }>;
  summary: string;      // 2-3 sentence overview of what you found
  total_analyzed: number;
}`;
}
