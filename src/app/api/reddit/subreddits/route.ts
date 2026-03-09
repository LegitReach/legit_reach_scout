import { getGeminiModel } from "@/ai/gemini.model";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/withRateLimit";

// POST handler: accepts keywords and business description for personalized subreddit suggestions
async function handler(request: NextRequest) {
    try {
        const body = await request.json();
        const { keywords, businessDescription } = body as {
            keywords?: string;
            businessDescription?: string;
        };

        if (!keywords) {
            return NextResponse.json({ error: "Keywords parameter is required" }, { status: 400 });
        }

        const keywordList = keywords.toLowerCase().split(",").map((k: string) => k.trim());

        const prompt = buildSubredditPrompt(keywordList, businessDescription);
        const result = await getGeminiModel().generateContent(prompt);

        const aiResponse = result.response.text();
        const subreddits: string[] = JSON.parse(aiResponse);

        // Ensure we always return exactly 10, prefixed with r/
        const normalized = subreddits
            .map((s: string) => s.startsWith("r/") ? s : `r/${s}`)
            .slice(0, 10);

        return NextResponse.json({
            keywords: keywordList,
            suggestions: normalized,
            source: "gemini_api",
        });
    } catch (error) {
        console.error("Subreddit suggestion error:", error);
        return NextResponse.json({ error: "Failed to find subreddits" }, { status: 500 });
    }
}

/**
 * Builds a detailed prompt for Gemini to suggest subreddits based on
 * user keywords and their business description.
 */
export function buildSubredditPrompt(keywords: string[], businessDescription?: string): string {
    let prompt = `You are a Reddit expert. Suggest exactly 10 subreddit names that would be most relevant for someone with the following interests and business context.

Keywords: ${keywords.join(", ")}
`;

    if (businessDescription && businessDescription.trim()) {
        prompt += `\nBusiness Description: ${businessDescription.trim()}\n`;
        prompt += `\nConsider the business's target audience, industry, price positioning, and unique value proposition when selecting subreddits.`;
    }

    prompt += `

Rules:
- Return ONLY a JSON array of exactly 10 subreddit name strings (e.g. ["r/startups", "r/SaaS", ...]).
- Each name must start with "r/".
- Provide a diverse mix: include niche communities, industry-specific subreddits, and broader topic subreddits.
- Only suggest real, active subreddits.
- Do NOT include any explanation, markdown, or extra text — just the JSON array.`;

    return prompt;
}

export const POST = withRateLimit(handler, 5);
