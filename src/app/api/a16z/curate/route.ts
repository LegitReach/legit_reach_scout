/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel } from "@/ai/gemini.model";
import { parseCurateResponse } from "@/lib/gemini-parsers";
import { fetchRedditPosts } from "@/lib/reddit-utils";
import type { RedditPost } from "@/types";

export async function POST(request: NextRequest) {
  const { subreddits, keywords, businessDescription } = await request.json();

  if (!subreddits?.length || !keywords?.length) {
    return NextResponse.json({ error: "subreddits and keywords are required" }, { status: 400 });
  }

  try {
    const keywordsParam = (keywords as string[]).join(",");
    const results = await Promise.all(
      (subreddits as string[]).map(sub => fetchRedditPosts(sub, keywordsParam, "hot", 15))
    );

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
        total_analyzed: 0,
      });
    }

    combinedPosts.sort((a, b) => b.created_utc - a.created_utc);

    const slimPosts = combinedPosts.slice(0, 20).map((p) => ({
      id: p.id,
      title: p.title,
      subreddit: p.subreddit,
      selftext: p.selftext?.substring(0, 300) ?? "",
      score: p.score,
      num_comments: p.num_comments,
    }));

    const prompt = buildCuratePrompt(businessDescription ?? "", (keywords as string[]).join(", "), slimPosts);
    const result = await getGeminiModel().generateContent(prompt);
    const curated = parseCurateResponse(result.response.text());

    curated.curated_posts.sort((a, b) => b.ai_opportunity_score - a.ai_opportunity_score);

    return NextResponse.json({
      posts: combinedPosts,
      curated_posts: curated.curated_posts,
      summary: curated.summary,
      total_analyzed: curated.total_analyzed,
    });
  } catch (err) {
    console.error("a16z curate error:", err);
    return NextResponse.json({ error: "Curation failed" }, { status: 500 });
  }
}

function buildCuratePrompt(businessDescription: string, keywords: string, posts: any[]): string {
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
  summary: string;
  total_analyzed: number;
}`;
}
