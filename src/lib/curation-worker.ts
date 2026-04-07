/* eslint-disable @typescript-eslint/no-explicit-any */

import { redis, realtime } from "@/lib/redis";
import type { RedditPost } from "@/types";
import { getPostHogClient } from "@/lib/posthog-server";
import { getGeminiModel } from "@/ai/gemini.model";
import { parseCurateResponse } from "@/lib/gemini-parsers";
import { fetchRedditPosts } from "@/lib/reddit-utils";
import { CurationEvents } from "@/types/realtime";

const MODEL_NAME = "gemini-2.5-flash";
const CACHE_TTL = 60 * 60 * 24; // 24 hours caching

/**
 * Using 'as const' ensures that TypeScript treats this as the literal string "curation.update",
 * which matches the keys in our CurationEvents type map.
 */
const EVENT_NAME = "curation.update" as const;

export interface CurationParams {
    jobId: string;
    subreddits: string[];
    keywords: string[];
    businessDescription: string;
    userId: string | null;
}

export async function processCuration(params: CurationParams) {
    const { jobId, subreddits, keywords, businessDescription, userId } = params;
    const startTime = Date.now();

    try {
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
            const emptyResult = {
                posts: [],
                curated_posts: [],
                summary: "No relevant posts found in the selected communities.",
                total_analyzed: 0
            };
            await publishAndCache(jobId, emptyResult);
            return;
        }

        // Sort by most recent first
        combinedPosts.sort((a, b) => b.created_utc - a.created_utc);

        // 2. Curate with AI
        const slimPosts = combinedPosts.slice(0, 20).map((p) => ({
            id: p.id,
            title: p.title,
            subreddit: p.subreddit,
            selftext: p.selftext?.substring(0, 300) ?? "",
            score: p.score,
            num_comments: p.num_comments,
        }));

        const prompt = buildCuratePrompt(businessDescription, (keywords ?? []).join(", "), slimPosts);

        const result = await getGeminiModel(MODEL_NAME).generateContent(prompt);
        const rawText = result.response.text();
        const curated = parseCurateResponse(rawText);

        // Sort curated posts: highest opportunity score first
        curated.curated_posts.sort((a, b) => b.ai_opportunity_score - a.ai_opportunity_score);

        const responseData = {
            posts: combinedPosts,
            curated_posts: curated.curated_posts,
            summary: curated.summary,
            total_analyzed: curated.total_analyzed,
        };

        // Cache the result
        const cacheKey = `curate:v2:${jobId}`;
        await redis.set(cacheKey, responseData, { ex: CACHE_TTL });

        // EMIT EVENT TO REALTIME (PUSH)
        await publishAndCache(jobId, responseData);

        // PostHog logging (minimal background version)
        const latency = (Date.now() - startTime) / 1000;
        getPostHogClient().capture({
            distinctId: userId ?? "anonymous",
            event: "curation_completed",
            properties: {
                jobId,
                latency,
                posts_found: combinedPosts.length,
                posts_curated: curated.curated_posts.length,
            },
        });

    } catch (error) {
        console.error(`Worker failed for jobId ${jobId}:`, error);
        // We cast the channel call to 'any' for now or rely on the global type from redis.ts
        await realtime.channel(`curate_${jobId}`).emit("curation.update.data", {
            status: "failed",
            error: "Internal processing error"
        });
    }
}

async function publishAndCache(jobId: string, data: any) {
    // Explicitly casting the channel to bypass the SDK's internal N extends string constraint
    // while the global T is still being inferred in the background.
    await realtime.channel(`curate_${jobId}`).emit("curation.update.data", {
        status: "completed",
        data
    }
    );
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
