import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel } from "@/ai/gemini.model";
import { withRateLimit } from "@/lib/withRateLimit";
import {
  parseAIQueryResult,
  parseCurateResponse,
  GeminiParseError,
} from "@/lib/gemini-parsers";
import type { RedditPost } from "@/types";

// ──────────────────────────────────────────────────────────
// POST /api/morning/brief
//
// Accepts: { businessDescription, keywords, subreddits }
// Returns: { posts: RedditPost[], summary: string, total_analyzed: number }
//
// All Gemini calls and ScrapeCreators calls happen server-side.
// The API key is NEVER sent to the client.
// ──────────────────────────────────────────────────────────

interface BriefBody {
  businessDescription?: string;
  keywords?: string[];
  subreddits?: string[];
}

async function handler(request: NextRequest): Promise<NextResponse> {
  if (request.method !== "POST") {
    return NextResponse.json({ error: "Only POST allowed" }, { status: 405 });
  }

  let body: BriefBody = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { businessDescription = "", keywords = [], subreddits = [] } = body;

  if (!businessDescription && keywords.length === 0) {
    return NextResponse.json(
      { error: "businessDescription or keywords are required" },
      { status: 400 },
    );
  }

  const apiKey = process.env.REDDIT_SCRAPE_API_KEY;
  if (!apiKey) {
    console.error("REDDIT_SCRAPE_API_KEY is not configured");
    return NextResponse.json(
      { error: "Reddit scrape API key not configured" },
      { status: 500 },
    );
  }

  try {
    // ── Step 1: Ask Gemini to produce optimised search keywords ──
    const queryPrompt = `Based on this business pitch: "${businessDescription}" and these target keywords: ${keywords.join(", ")}, produce a Reddit search query to find posts where potential customers discuss related problems today.

Return ONLY valid JSON — no markdown:
interface QueryGen { keywords: string }

Rules:
- keywords is a comma-separated string of at most 3 terms
- Maximum 140 characters total
- Focus on problem/pain-point language, not product names`;

    const queryResult = await getGeminiModel().generateContent(queryPrompt);
    const queryData = parseAIQueryResult(queryResult.response.text());

    const keywordList = queryData.keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, 3);

    // ── Step 2: Fetch posts from ScrapeCreators for each keyword ──
    const allPosts: RedditPost[] = [];
    const seen = new Set<string>();

    await Promise.allSettled(
      keywordList.map(async (keyword) => {
        try {
          const url = `https://api.scrapecreators.com/v1/reddit/search?query=${encodeURIComponent(keyword)}&sort=top&timeframe=day`;
          const res = await fetch(url, {
            method: "GET",
            headers: { "x-api-key": apiKey },
          });
          if (!res.ok) {
            console.warn(
              `ScrapeCreators returned ${res.status} for keyword "${keyword}"`,
            );
            return;
          }
          const data = await res.json();
          if (!Array.isArray(data.posts)) return;
          for (const post of data.posts as RedditPost[]) {
            if (post.id && !seen.has(post.id)) {
              seen.add(post.id);
              allPosts.push({
                ...post,
                permalink: post.permalink?.startsWith("http")
                  ? post.permalink
                  : `https://reddit.com${post.permalink}`,
              });
            }
          }
        } catch (err) {
          // One keyword failing is non-fatal — log and continue
          console.warn(`Failed to fetch posts for keyword "${keyword}":`, err);
        }
      })
    );

    if (allPosts.length === 0) {
      return NextResponse.json({
        posts: [],
        summary:
          "No relevant posts found for today. Try updating your keywords.",
        total_analyzed: 0,
      });
    }

    // ── Step 3: Curate top 5 posts using Gemini ──
    const slimPosts = allPosts.slice(0, 30).map((p) => ({
      id: p.id,
      title: p.title,
      subreddit: p.subreddit,
      selftext: p.selftext?.substring(0, 250) ?? "",
      score: p.score,
      num_comments: p.num_comments,
    }));

    const curatePrompt = `You are an expert Reddit growth analyst helping a business find the best posts to engage with.

Business Description: "${businessDescription}"
Target Keywords: ${keywords.join(", ")}

Analyse the ${slimPosts.length} Reddit posts below and pick the top 5 most valuable engagement opportunities.

Posts:
${JSON.stringify(slimPosts, null, 2)}

Return ONLY a valid JSON object matching this exact interface — no markdown:

interface CurateResponse {
  curated_posts: Array<{
    id: string;
    ai_relevance_score: number;
    ai_opportunity_score: number;
    ai_reasoning: string;
    recommended_action: "engage" | "monitor" | "skip";
  }>;
  summary: string;
  total_analyzed: number;
}`;

    const curateResult = await getGeminiModel().generateContent(curatePrompt);
    const curateData = parseCurateResponse(curateResult.response.text());

    // Merge AI scores back into the full, untruncated posts
    const scoreMap = new Map(curateData.curated_posts.map((c) => [c.id, c]));

    const finalPosts: RedditPost[] = allPosts
      .filter((p) => scoreMap.has(p.id))
      .map((p) => {
        const ai = scoreMap.get(p.id)!;
        return {
          ...p,
          relevance_score: ai.ai_relevance_score,
          opportunity_type: ai.ai_reasoning,
        };
      })
      .sort((a, b) => {
        const aScore = scoreMap.get(a.id)?.ai_opportunity_score ?? 0;
        const bScore = scoreMap.get(b.id)?.ai_opportunity_score ?? 0;
        return bScore - aScore;
      })
      .slice(0, 5);

    return NextResponse.json({
      posts: finalPosts,
      summary: curateData.summary,
      total_analyzed: curateData.total_analyzed,
    });
  } catch (err) {
    if (err instanceof GeminiParseError) {
      console.error("Morning brief Gemini parse error:", err.message);
      return NextResponse.json(
        { error: "AI returned an unexpected response format", posts: [] },
        { status: 502 },
      );
    }
    console.error("Morning brief error:", err);
    return NextResponse.json(
      { error: "Failed to generate morning brief", posts: [] },
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(handler);
