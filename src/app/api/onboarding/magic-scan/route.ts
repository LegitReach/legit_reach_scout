import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel } from "@/ai/gemini.model";
import { withRateLimit } from "@/lib/withRateLimit";

interface JinaScrapeResult {
  content: string;
  title: string;
  ogImage: string;
}

async function scrapeWithJina(url: string): Promise<JinaScrapeResult> {
  const jinaUrl = `https://r.jina.ai/${url}`;
  const headers: HeadersInit = {
    "Accept": "application/json",
    "X-Return-Format": "markdown",
  };

  if (process.env.JINA_API_KEY) {
    headers["Authorization"] = `Bearer ${process.env.JINA_API_KEY}`;
  }

  const res = await fetch(jinaUrl, { headers });

  if (!res.ok) {
    throw new Error(`Jina fetch failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const data = json?.data ?? {};

  return {
    content: data.content ?? "",
    title: data.title ?? "",
    ogImage: data.metadata?.["og:image"] ?? "",
  };
}

async function handler(request: NextRequest): Promise<NextResponse> {
  const { url } = await request.json();

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  let targetUrl = url;
  if (!targetUrl.startsWith("http")) {
    targetUrl = `https://${targetUrl}`;
  }

  try {
    const { content: pageContent, title: pageTitle, ogImage } = await scrapeWithJina(targetUrl);

    if (!pageContent) {
      return NextResponse.json(
        { error: "Could not extract content from this URL. Please try manual onboarding." },
        { status: 422 }
      );
    }

    const prompt = `You are a world-class e-commerce growth expert. Below is the content scraped from a store's homepage.
Analyze it and extract the full brand profile needed to configure an AI agent to find customers on Reddit.

STORE CONTENT:
${pageContent}

Return ONLY a valid JSON object with this exact structure:
{
  "tagline": "The brand's tagline or value proposition in one sentence (e.g. Thoughtful Design, Premium Comfort, Happy Babies). Empty string if none found.",
  "businessDescription": "A concise 1-minute pitch about what they sell and who they sell to.",
  "targetAudience": "A one-sentence description of the ideal customer (e.g. First-time parents of infants aged 0–18 months looking for safe, stylish baby products).",
  "productCategories": ["category1", "category2"],
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "subreddits": ["r/subreddit1", "r/subreddit2", "r/subreddit3", "r/subreddit4", "r/subreddit5"]
}

Rules:
- productCategories: the actual product types sold (e.g. "baby play mat", "tummy time mat"), not generic terms.
- keywords: high-intent purchase or problem terms the target audience would search (e.g. "organic dog food", not just "dog").
- subreddits: real, active communities where the target audience discusses problems or seeks recommendations.
- Provide exactly 5 subreddits.`;

    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const jsonString = responseText.replace(/```json|```/g, "").trim();
    const aiData = JSON.parse(jsonString);

    return NextResponse.json({
      ...aiData,
      brandName: pageTitle,
      storeUrl: targetUrl,
      ogImage,
    });
  } catch (err) {
    console.error("Magic Scan error:", err);
    return NextResponse.json({
      error: "Failed to automatically analyze store. Please try manual onboarding.",
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}

export const POST = withRateLimit(handler);
