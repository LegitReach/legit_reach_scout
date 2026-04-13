import { generateSearchQueries, SearchQuery } from "./newsletter-ai";
import { searchRedditGlobal } from "./reddit-utils";
import { getGeminiModel } from "@/ai/gemini.model";
import type { RedditPost } from "@/types";

export interface NewsletterResult {
  briefing: string;
  topLeads: RedditPost[];
  totalAnalyzed: number;
}

/**
 * ORCHESTRATOR: Handles the entire "Morning Legit" data gathering and AI synthesis.
 */
export async function processGlobalNewsletterSearch(
  businessDescription: string,
  keywords: string[]
): Promise<NewsletterResult> {
  console.log("[Newsletter] Starting global search orchestration...");

  try {
    // 1. Generate Tactical Search Queries
    const queries = await generateSearchQueries(businessDescription, keywords);
    console.log(`[Newsletter] Generated ${queries.length} queries: ${queries.map(q => q.query).join(", ")}`);

    // 2. Execute Global Searches in Parallel
    const searchPromises = queries.map(q =>
      searchRedditGlobal(q.query, "day", "relevance")
    );
    const searchResults = await Promise.all(searchPromises);

    // 3. Combine and Deduplicate
    const seenIds = new Set<string>();
    const allPosts: RedditPost[] = [];

    searchResults.flat().forEach(post => {
      if (!seenIds.has(post.id)) {
        seenIds.add(post.id);
        allPosts.push(post);
      }
    });

    console.log(`[Newsletter] Found ${allPosts.length} unique posts across all queries.`);

    if (allPosts.length === 0) {
      return {
        briefing: "No matching discussions found on Reddit in the last 24 hours.",
        topLeads: [],
        totalAnalyzed: 0
      };
    }



    const synthesisPrompt = `
You are the "LegitReach Scout" — a sharp, Bloomberg-style analyst.
Your job is to read candidate Reddit posts and synthesize a "Morning Briefing" for a business owner.

BUSINESS:
"${businessDescription}"
KEYWORDS:
"${keywords.join(", ")}"

REDDIT POSTS FOUND:
${JSON.stringify(allPosts, null, 2)}

---
TASK:
1. SELECT: order the posts that represent from the highest "Gold Lead" potential (people asking for help, complaining about competitors, or seeking tools) to the lowest.
2. BRIEFING: Write a punchy 2-3 sentence "Morning Briefing" summary. It should be professional, insightful, and highlight the main theme of today's findings.
3. OUTPUT: Return a JSON object with this exact structure:
{
  "briefing": "string",
  "top_lead_ids": ["id1", "id2", ...]
}
`;

    const model = getGeminiModel();
    const result = await model.generateContent(synthesisPrompt);
    console.log("[Newsletter] AI Synthesis Result:", result.response.text());
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanJson);
    const briefing: string = parsed.briefing ?? "";
    const top_lead_ids: string[] = Array.isArray(parsed.top_lead_ids) ? parsed.top_lead_ids : [];

    // Filter to get the actual post objects for the top leads
    // Fall back to the first 5 posts if Gemini returned no IDs
    const topLeads = top_lead_ids.length > 0
      ? allPosts.filter(p => top_lead_ids.includes(p.id))
      : allPosts.slice(0, 5);

    return {
      briefing,
      topLeads,
      totalAnalyzed: allPosts.length
    };

  } catch (error) {
    console.error("[Newsletter] Orchestration failed:", error);
    throw error;
  }
}
