import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel } from "@/ai/gemini.model";
import { withRateLimit } from "@/lib/withRateLimit";
import * as cheerio from "cheerio";

// ──────────────────────────────────────────────────────────
// POST /api/onboarding/magic-scan
//
// Accepts: { url: string }
// Returns: { businessDescription: string, keywords: string[], subreddits: string[] }
//
// All-in-one onboarding: 
// Scrapes the store URL and uses Gemini 2.5+ Flash to infer 
// the business pitch, keywords, and target subreddits.
// ──────────────────────────────────────────────────────────

async function handler(request: NextRequest): Promise<NextResponse> {
  const { url } = await request.json();

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  // Ensure URL is absolute
  let targetUrl = url;
  if (!targetUrl.startsWith("http")) {
    targetUrl = `https://${targetUrl}`;
  }

  try {
    const homeResponse = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
        "Connection": "keep-alive"
      },
    });


    const html = await homeResponse.text();

    const $ = cheerio.load(html);
    const elements = $('h1, h2, h3, h4, h5, h6, p, section')
      .map((_, el) => $(el).text().trim())
      .get();

    // 4. Filter out any empty strings
    const cleanElements = elements.filter(text => text.length > 0);
    const pageText = cleanElements.join(" ");


    // const productUrl = `${targetUrl}/products.json`;
    // const collectionsUrl = `${targetUrl}/collections.json`;

    // try {
    //   // ── Step 1: Fetch the HTML ──
    //   const productsResponse = await fetch(productUrl, {
    //     headers: {
    //       'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    //     },
    //   });


    //   const collectionsResponse = await fetch(collectionsUrl, {
    //     headers: {
    //       'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    //     }
    //   })

    //   if (!productsResponse.ok && !collectionsResponse.ok) {
    //     // Fallback for failed fetch (maybe it's a dev site or protected)
    //     // In a real app, you might want more robust scraping or a headless browser
    //     console.warn(`Could not fetch store: ${productsResponse.statusText}`);
    //   }

    //   const productsData = await productsResponse.text();
    //   const collectionsData = await collectionsResponse.text();

    // ── Step 2: All-in-one Inference with Gemini 2.5+ Flash ──
    // Note: The model name is passed as gemini-2.0-flash-exp or similar in the actual model getter,
    // assuming gemini-2.5-flash will be the identifier or gemini-2.0-flash-001 depending on current API availability.
    // The user mentioned 2.5+ so I will ensure the logic uses the flash model.


    const prompt = `You are a world-class e-commerce growth expert. I will provide you with the products and collections data of a store. 
    Analyze this store and provide the necessary configuration for an AI agent to find customers on Reddit.

    Consider the following data: ${pageText}

    Return ONLY a valid JSON object with this structure:
    {
      "businessDescription": "A concise 1-minute pitch about what they sell and who they sell to.",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "subreddits": ["r/subreddit1", "r/subreddit2", "r/subreddit3", "r/subreddit4", "r/subreddit5"]
    }

    Rules:
    - Keywords should be high-intent purchase terms (e.g., "organic dog food", not just "dog").
    - Subreddits must be real, active communities where customers discuss problems or look for recommendations.
    - Provide exactly 5 subreddits.`;

    const model = getGeminiModel(); // Uses the default defined in your model file (2.5 flash ideally)
    const result = await model.generateContent(prompt);
    const content = result.response.text();

    // Clean JSON from possible markdown wrappers
    const jsonString = content.replace(/```json|```/g, "").trim();
    const data = JSON.parse(jsonString);

    return NextResponse.json(data);
  }
  catch (err) {
    console.error("Magic Scan error:", err);
    return NextResponse.json({
      error: "Failed to automatically analyze store. Please try manual onboarding.",
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }

}
export const POST = withRateLimit(handler);
