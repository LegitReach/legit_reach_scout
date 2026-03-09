import { getGeminiModel } from "@/ai/gemini.model";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/withRateLimit";

async function handler(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const keywords = searchParams.get("keywords") || "";

  if (!keywords) {
    return NextResponse.json(
      { error: "Keywords parameter is required" },
      { status: 400 },
    );
  }

  const keywordList = keywords
    .toLowerCase()
    .split(",")
    .map((k) => k.trim());

  try {
    const prompt = `You are a Reddit expert. Given these business keywords: "${keywords}", suggest the 10 most relevant Reddit subreddits where potential customers or users would discuss these topics.

Return ONLY a valid JSON array of strings. Each string must be a subreddit name prefixed with "r/". Example: ["r/startups","r/SaaS"]

Rules:
- Include a mix of niche and broader subreddits
- Prioritise communities where people ask for product/tool recommendations
- No duplicates
- Only real, active subreddits

interface Response { suggestions: string[] }`;

    const result = await getGeminiModel().generateContent(prompt);
    const aiResponse = result.response.text();

    // The model returns application/json — parse safely
    let parsed: { suggestions?: string[] } | string[] = JSON.parse(aiResponse);

    // Handle both { suggestions: [...] } and plain array responses
    const suggestions: string[] = Array.isArray(parsed)
      ? parsed
      : ((parsed as { suggestions?: string[] }).suggestions ?? []);

    return NextResponse.json({
      keywords: keywordList,
      suggestions: suggestions.slice(0, 10),
      source: "gemini_api",
    });
  } catch (error) {
    console.error("Subreddit suggestion error:", error);
    // Graceful fallback to generic subreddits so onboarding never breaks
    const fallback = [
      "r/startups",
      "r/entrepreneur",
      "r/SaaS",
      "r/smallbusiness",
      "r/marketing",
    ];
    return NextResponse.json({
      keywords: keywordList,
      suggestions: fallback,
      source: "fallback",
    });
  }
}

export const GET = withRateLimit(handler, 5);
