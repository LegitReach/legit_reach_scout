import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel } from "@/ai/gemini.model";
import { withRateLimit } from "@/lib/withRateLimit";
import { parseCurateResponse } from "@/lib/gemini-parsers";
import { fetchRedditPosts } from "@/lib/reddit-utils";
import { redis } from "@/lib/redis";
import type { RedditPost } from "@/types";
import { getPostHogClient } from "@/lib/posthog-server";
import { getAuth } from "@clerk/nextjs/server";
import { randomUUID, createHash } from "crypto";
import { consumeRequest, consumeAnonymousRequest } from "@/lib/consumption";

const MODEL_NAME = "gemini-2.5-flash";
const CACHE_TTL = 60 * 60 * 6; // 6 hours caching

function getClientIp(req: Request) {
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "unknown";
}

async function handler(request: NextRequest): Promise<NextResponse> {
  const traceId = randomUUID();
  const startTime = Date.now();
  let userId: string | null = null;

  try {
    const { subreddits, keywords, businessDescription } = await request.json();

    if (!subreddits || !Array.isArray(subreddits) || subreddits.length === 0) {
      return NextResponse.json({ error: "subreddits array is required" }, { status: 400 });
    }
    if (!businessDescription) {
      return NextResponse.json({ error: "businessDescription is required" }, { status: 400 });
    }

    try {
      userId = getAuth(request).userId;
    } catch {
      userId = null;
    }

    // Cache key based on subreddits, keywords, and business description
    const signature = JSON.stringify([
      subreddits.sort(),
      (keywords || []).sort(),
      businessDescription
    ]);
    const hash = createHash('sha256').update(signature).digest('hex');
    const cacheKey = `curate:v2:${hash}`;

    const cached = await redis.get<any>(cacheKey);
    if (cached) {
      console.log("Serving from cache for signature:", signature);
      return NextResponse.json({ ...cached, fromCache: true });
    }

    // --- MANUAL CONSUMPTION CHECK (Only on cache miss) ---
    if (userId) {
      const { allowed, error, redirectTo } = await consumeRequest(userId);
      if (!allowed) {
        return NextResponse.json({ error, redirectTo }, { status: 429 });
      }
    } else {
      const ip = getClientIp(request);
      const ua = request.headers.get("user-agent");
      const { allowed, error, redirectTo } = await consumeAnonymousRequest(ip, ua, 5);
      if (!allowed) {
        return NextResponse.json({ error, redirectTo }, { status: 429 });
      }
    }
    // ----------------------------------------------------

    // 1. Fetch posts from all subreddits in parallel
    const keywordsParam = (keywords || []).join(",");
    const fetchPromises = subreddits.map(sub => fetchRedditPosts(sub, keywordsParam, "hot", 15));
    const results = await Promise.all(fetchPromises);

    // Combine and deduplicate
    const seenIds = new Set<string>();
    const combinedPosts: RedditPost[] = [];
    for (const posts of results) {
      for (const post of posts) {
        if (!seenIds.has(post.id)) {
          seenIds.add(post.id);
          combinedPosts.push(post);
        }
      }
    }

    if (combinedPosts.length === 0) {
      return NextResponse.json({
        posts: [],
        curated_posts: [],
        summary: "No relevant posts found in the selected communities.",
        total_analyzed: 0
      });
    }

    // Sort by most recent first
    combinedPosts.sort((a, b) => b.created_utc - a.created_utc);

    // 2. Curate with AI
    // Trim posts to the fields Gemini needs (keep payload small)
    const slimPosts = combinedPosts.slice(0, 20).map((p) => ({
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

    const result = await getGeminiModel(MODEL_NAME).generateContent(prompt);
    const rawText = result.response.text();
    const curated = parseCurateResponse(rawText);

    // Sort curated posts: highest opportunity score first
    curated.curated_posts.sort(
      (a, b) => b.ai_opportunity_score - a.ai_opportunity_score,
    );

    const responseData = {
      posts: combinedPosts,
      curated_posts: curated.curated_posts,
      summary: curated.summary,
      total_analyzed: curated.total_analyzed,
    };
    // PostHog logging
    const latency = (Date.now() - startTime) / 1000;
    const usage = result.response.usageMetadata;
    getPostHogClient().capture({
      distinctId: userId ?? "anonymous",
      event: "$ai_generation",
      properties: {
        $ai_trace_id: traceId,
        $ai_span_name: "full_dashboard_curation",
        $ai_model: MODEL_NAME,
        $ai_input_tokens: usage?.promptTokenCount,
        $ai_output_tokens: usage?.candidatesTokenCount,
        $ai_latency: latency,
        posts_found: combinedPosts.length,
        posts_curated: curated.curated_posts.length,
      },
    });

    // Cache the result for future identical requests
    await redis.set(cacheKey, responseData, { ex: CACHE_TTL });

    return NextResponse.json(responseData);
  } catch (err: any) {
    const isAbort = err?.name === "AbortError" || err?.code === "ECONNRESET" || err?.message?.includes("aborted");

    if (isAbort) {
      console.warn("Client aborted dashboard curate request.");
      return new NextResponse(null, { status: 499 }); // Client Closed Request
    }

    console.error("Full curate API error:", err);
    return NextResponse.json(
      { error: "Failed to curate posts", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}


function buildCuratePrompt(
  businessDescription: string,
  keywords: string,
  posts: any[],
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

export const POST = handler;
