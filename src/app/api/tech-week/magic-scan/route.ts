import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel } from "@/ai/gemini.model";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ProxyAgent, fetch as proxyFetch } from "undici";

// Sequential steps: Jina ~3s + Gemini ~4s + Reddit search ~2s + rules parallel ~3s + Gemini ~4s
// ─── Types ───────────────────────────────────────────────────────────────────

export interface BrandProfile {
  tagline: string;
  businessDescription: string;
  targetAudience: string;
  productCategories: string[];
  keywords: string[];
  brandValues: string[];       // e.g. ["sustainability", "minimalism"]
  voiceTone: string;           // e.g. "warm and peer-to-peer"
  buyerProblems: string[];     // pain points in buyer's own words
  nicheScore: 1 | 2 | 3;      // 1=niche, 2=mid, 3=commodity
}

export interface SelectedCommunity {
  subreddit: string;           // e.g. "r/entrepreneur"
  selectionReason: string;
  alignmentType: "product" | "identity" | "problem";
  promotionStance: "friendly" | "neutral" | "strict";
  promotionStanceReason: string;
}

export interface TechWeekMagicScanResponse {
  brandProfile: BrandProfile;
  community: SelectedCommunity;
  meta: {
    brandName: string;
    storeUrl: string;
    ogImage: string;
    communityRulesSummary: string[]; // short rule titles for the selected community
  };
}

// ─── Step 1: Jina scrape ─────────────────────────────────────────────────────

async function scrapeWithJina(url: string): Promise<{ content: string; title: string; ogImage: string }> {
  const jinaUrl = `https://r.jina.ai/${url}`;
  const headers: HeadersInit = {
    Accept: "application/json",
    "X-Return-Format": "markdown",
  };
  if (process.env.JINA_API_KEY) {
    headers["Authorization"] = `Bearer ${process.env.JINA_API_KEY}`;
  }

  const res = await fetch(jinaUrl, { headers });
  if (!res.ok) throw new Error(`Jina fetch failed: ${res.status}`);

  const json = await res.json();
  const data = json?.data ?? {};
  return {
    content: data.content ?? "",
    title: data.title ?? "",
    ogImage: data.metadata?.["og:image"] ?? "",
  };
}

function cleanContent(raw: string): string {
  return raw
    .replace(/```[\s\S]*?```/g, "")
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      if (!t) return false;
      const linkChars = (t.match(/\[.*?\]\(.*?\)/g) ?? []).join("").length;
      if (linkChars / t.length > 0.6) return false;
      if (/cookie|privacy policy|terms of service|all rights reserved|©|\bGDPR\b/i.test(t)) return false;
      return true;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ─── Step 2: Gemini — brand profile ──────────────────────────────────────────

async function extractBrandProfile(pageContent: string): Promise<BrandProfile> {
  const prompt = `You are a world-class brand strategist. Analyse the scraped homepage content below and extract a structured brand profile for a Reddit engagement agent.

STORE CONTENT:
${cleanContent(pageContent)}

Return ONLY a valid JSON object with this exact structure:
{
  "tagline": "Brand's one-sentence value proposition. Empty string if none.",
  "businessDescription": "Concise 2-3 sentence pitch: what they sell, who they sell to, and why customers choose them.",
  "targetAudience": "One sentence describing the ideal customer with specifics (age range, context, need).",
  "productCategories": ["actual product type sold", "not generic terms"],
  "keywords": ["high-intent buyer search terms", "problem-focused", "specific not broad"],
  "brandValues": ["core value like sustainability", "minimalism", "community"],
  "voiceTone": "How the brand communicates — e.g. 'warm and educational' or 'direct and irreverent'",
  "buyerProblems": ["pain points in the buyer's own words", "what they search before buying"],
  "nicheScore": 1
}

nicheScore rules — pick ONE:
  1 = Niche: narrow specialist product, small passionate community (e.g. fountain pens, sourdough starters)
  2 = Mid: recognisable category with multiple players (e.g. standing desks, skincare serums)
  3 = Commodity: broad, widely available product (e.g. phone cases, water bottles)

Return only the JSON. No markdown. No explanation.`;

  const model = getGeminiModel();
  const result = await model.generateContent(prompt);
  const raw = result.response.text().replace(/```json|```/g, "").trim();
  return JSON.parse(raw) as BrandProfile;
}

// ─── Step 3: Gemini with Google Search grounding — discover real communities ───
// googleSearch tool is incompatible with responseMimeType:"application/json"
// so we use a plain text model and extract r/ names with regex.

async function discoverCommunitiesViaGeminiGrounded(brand: BrandProfile): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[magic-scan] GEMINI_API_KEY not set — skipping grounded search");
    return [];
  }

  let text: string;
  try {
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({
      model: "gemini-3-flash-preview",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ googleSearch: {} } as any],
      // No responseMimeType here — grounding and JSON mode are incompatible
      // googleSearch is the correct tool name for Gemini 2.x; the SDK types
      // (v0.24.x) still expose the old googleSearchRetrieval name so we cast.
    });

    const prompt = `Search Google and find the 4 most active and relevant subreddits where this brand's target audience discusses their problems.

Brand: ${brand.businessDescription}
Target audience: ${brand.targetAudience}
Keywords: ${brand.keywords.join(", ")}
Buyer problems: ${brand.buyerProblems.join(", ")}
Niche score: ${brand.nicheScore} (1=niche, 2=mid, 3=commodity)

List exactly 4 real, currently active subreddits. Format each one as r/subredditname on its own line. Nothing else.`;

    const result = await model.generateContent(prompt);
    text = result.response.text();
  } catch (err) {
    console.warn("[magic-scan] Gemini grounded search failed:", err);
    return [];
  }

  // Extract r/subredditname matches from the response
  const matches = [...text.matchAll(/r\/([a-zA-Z0-9_]+)/g)];
  const seen = new Set<string>();
  const subreddits: string[] = [];
  for (const m of matches) {
    const sub = m[1].toLowerCase();
    if (!seen.has(sub)) {
      seen.add(sub);
      subreddits.push(sub);
    }
  }
  return subreddits.slice(0, 4);
}

async function discoverCommunities(
  brand: BrandProfile
): Promise<string[]> {
  return discoverCommunitiesViaGeminiGrounded(brand);
}

// ─── Step 4: Direct Reddit JSON API — fetch rules for each candidate ─────────
// Jina's proxy IPs are blocked by Reddit's CDN for high-traffic subreddits
// (both www.reddit.com and old.reddit.com). The public rules.json endpoint
// works fine with a browser-style User-Agent from our own server IP.

async function fetchSubredditRules(subreddit: string): Promise<{ subreddit: string; rulesText: string }> {
  const rulesUrl = `https://www.reddit.com/r/${subreddit}/about/rules.json`;

  try {
    let res: Response;

    const proxyUser = process.env.APIFY_PROXY_USERNAME;
    const proxyPass = process.env.APIFY_PROXY_PASSWORD;
    const usingProxy = !!(proxyUser && proxyPass);

    console.log(`[magic-scan] rules r/${subreddit} — proxy: ${usingProxy} user: ${!!proxyUser} pass: ${!!proxyPass}`);

    if (usingProxy) {
      // Route through Apify's residential proxy pool to bypass Reddit's IP block
      // on Vercel/AWS. No actor overhead — just a plain HTTP proxy. ~500ms per call.
      const dispatcher = new ProxyAgent(
        `http://${proxyUser}:${proxyPass}@proxy.apify.com:8000`
      );
      res = await proxyFetch(rulesUrl, {
        dispatcher,
        headers: {
          "User-Agent": "NotReddit/1.1",
          "Accept": "application/json",
        },
      }) as unknown as Response;
    } else {
      // Local dev — residential IP works fine without proxy
      res = await fetch(rulesUrl, {
        headers: {
          "User-Agent": "NotReddit/1.1",
          "Accept": "application/json",
        },
      });
    }

    if (!res.ok) {
      console.warn(`[magic-scan] rules HTTP ${res.status} for r/${subreddit} (proxy: ${usingProxy})`);
      return { subreddit, rulesText: "No rules found." };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = await res.json() as { rules?: any[] };

    if (!json.rules || json.rules.length === 0) {
      console.warn(`[magic-scan] r/${subreddit} has no rules set`);
      return { subreddit, rulesText: "No rules found." };
    }

    const rules = json.rules
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => a.priority - b.priority)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((r: any, i: number) => `Rule ${i + 1}: ${r.short_name}\n${r.description ?? ""}`.trim())
      .join("\n\n");

    console.log(`[magic-scan] rules fetched for r/${subreddit} — ${json.rules.length} rules`);
    return { subreddit, rulesText: rules };
  } catch (err) {
    console.warn(`[magic-scan] rules fetch threw for r/${subreddit}:`, err);
    return { subreddit, rulesText: "Could not fetch rules." };
  }
}

// ─── Step 5: Gemini — pick ONE community with promotion stance ────────────────

async function selectCommunity(
  brand: BrandProfile,
  candidates: Array<{ subreddit: string; rulesText: string }>
): Promise<SelectedCommunity> {
  const candidatesBlock = candidates
    .map(
      (c, i) =>
        `CANDIDATE ${i + 1}: r/${c.subreddit}\n---\n${c.rulesText}`
    )
    .join("\n\n");

  const prompt = `You are a Reddit community strategist. A brand wants to engage authentically on Reddit. Your job is to pick the SINGLE best community for them from the candidates below, and assess how welcome brand presence is based on the actual rules.

BRAND PROFILE:
- Description: ${brand.businessDescription}
- Target audience: ${brand.targetAudience}
- Keywords: ${brand.keywords.join(", ")}
- Brand values: ${brand.brandValues.join(", ")}
- Buyer problems: ${brand.buyerProblems.join(", ")}
- Niche score: ${brand.nicheScore} (1=niche, 2=mid, 3=commodity)

CANDIDATE COMMUNITIES WITH THEIR ACTUAL RULES:
${candidatesBlock}

Selection criteria:
- nicheScore 1 → align on identity and values (who the buyer IS)
- nicheScore 2 → align on problem space (what the product SOLVES)
- nicheScore 3 → align on buyer intent (where people seek recommendations)

Promotion stance — derive this from the actual rules text:
- "friendly": rules explicitly allow brand presence or product recommendations
- "neutral": rules don't mention promotion; community culture is open
- "strict": rules explicitly ban promotion, brand accounts, or self-promotion

Return ONLY a valid JSON object:
{
  "subreddit": "r/communityname",
  "selectionReason": "2-3 sentences on why this community is the strongest fit",
  "alignmentType": "product" or "identity" or "problem",
  "promotionStance": "friendly" or "neutral" or "strict",
  "promotionStanceReason": "One sentence citing the specific rule or absence of rules that determines this"
}`;

  const model = getGeminiModel();
  const result = await model.generateContent(prompt);
  const raw = result.response.text().replace(/```json|```/g, "").trim();
  return JSON.parse(raw) as SelectedCommunity;
}

// ─── Parse rules text → array of short rule titles (max 6) ──────────────────

function parseRulesSummary(rulesText: string): string[] {
  if (!rulesText || rulesText === "No rules found." || rulesText === "Could not fetch rules.") {
    return [];
  }
  return rulesText
    .split(/\n\n+/)
    .map((block) => block.split("\n")[0].trim().replace(/^Rule \d+:\s*/i, "").trim())
    .filter((s) => s.length > 0 && s.length < 120)
    .slice(0, 6);
}

// ─── Handler (SSE streaming) ──────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { url } = body;
  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  const storeUrl = url.startsWith("http") ? url : `https://${url}`;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch { /* controller already closed */ }
      };

      try {
        // ── 1. Scrape ────────────────────────────────────────────────────────
        emit({ type: "step", step: 1, status: "start", msg: `Scraping ${storeUrl}…` });
        console.log("[magic-scan] Step 1 — Jina scraping:", storeUrl);

        let pageContent: string, brandName: string, ogImage: string;
        try {
          ({ content: pageContent, title: brandName, ogImage } = await scrapeWithJina(storeUrl));
        } catch (err) {
          emit({ type: "step", step: 1, status: "error", msg: `Fetch failed: ${err instanceof Error ? err.message : String(err)}` });
          emit({ type: "fatal", msg: "Could not fetch the store URL. Is it publicly accessible?" });
          return;
        }
        if (!pageContent) {
          emit({ type: "step", step: 1, status: "error", msg: "Site returned empty content" });
          emit({ type: "fatal", msg: "Could not extract any content from this URL." });
          return;
        }
        emit({ type: "step", step: 1, status: "done", msg: `${pageContent.length.toLocaleString()} chars · "${brandName}"` });
        console.log("[magic-scan] Step 1 done — content:", pageContent.length, "title:", brandName);

        // ── 2. Brand profile ─────────────────────────────────────────────────
        emit({ type: "step", step: 2, status: "start", msg: "Extracting brand profile…" });
        console.log("[magic-scan] Step 2 — Gemini brand extraction...");

        let brandProfile: BrandProfile;
        try {
          brandProfile = await extractBrandProfile(pageContent);
        } catch (err) {
          emit({ type: "step", step: 2, status: "error", msg: `Brand extraction failed: ${err instanceof Error ? err.message : String(err)}` });
          emit({ type: "fatal", msg: "Could not extract brand profile. Please try again." });
          return;
        }

        const snippet = (brandProfile.tagline || brandProfile.businessDescription).slice(0, 72);
        emit({ type: "step", step: 2, status: "done", msg: `"${snippet}"`, data: { brandProfile } });
        console.log("[magic-scan] Step 2 done");

        // ── 3. Community discovery ────────────────────────────────────────────
        emit({ type: "step", step: 3, status: "start", msg: "Discovering Reddit communities…" });
        console.log("[magic-scan] Step 3 — community discovery...");

        let candidateNames: string[];
        try {
          candidateNames = await discoverCommunities(brandProfile);
        } catch (err) {
          emit({ type: "step", step: 3, status: "error", msg: `Discovery failed: ${err instanceof Error ? err.message : String(err)}` });
          emit({ type: "fatal", msg: "Could not discover relevant Reddit communities." });
          return;
        }
        if (candidateNames.length === 0) {
          emit({ type: "step", step: 3, status: "error", msg: "No communities found" });
          emit({ type: "fatal", msg: "Could not find relevant communities for this store. Try a different URL." });
          return;
        }
        emit({ type: "step", step: 3, status: "done", msg: `${candidateNames.length} candidates: ${candidateNames.map((s) => "r/" + s).join(" · ")}` });
        console.log("[magic-scan] Step 3 done — candidates:", candidateNames);

        // ── 4. Fetch rules ────────────────────────────────────────────────────
        emit({ type: "step", step: 4, status: "start", msg: `Fetching rules for ${candidateNames.length} communities…` });
        console.log("[magic-scan] Step 4 — fetching rules for:", candidateNames);

        // fetchSubredditRules handles per-subreddit errors gracefully
        const candidatesWithRules = await Promise.all(
          candidateNames.map((sub) => fetchSubredditRules(sub))
        );
        const ruleSummary = candidatesWithRules
          .map((c) => `r/${c.subreddit} (${parseRulesSummary(c.rulesText).length} rules)`)
          .join(" · ");
        emit({ type: "step", step: 4, status: "done", msg: `Rules fetched — ${ruleSummary}` });
        console.log("[magic-scan] Step 4 done");

        // ── 5. Select community ───────────────────────────────────────────────
        emit({ type: "step", step: 5, status: "start", msg: "Selecting best community…" });
        console.log("[magic-scan] Step 5 — Gemini community selection...");

        let community: SelectedCommunity;
        try {
          community = await selectCommunity(brandProfile, candidatesWithRules);
        } catch (err) {
          emit({ type: "step", step: 5, status: "error", msg: `Selection failed: ${err instanceof Error ? err.message : String(err)}` });
          emit({ type: "fatal", msg: "Could not select a community. Please try again." });
          return;
        }

        // Build rules summary for the winning subreddit
        const cleanSub = community.subreddit.replace(/^r\//, "").toLowerCase();
        const selectedEntry = candidatesWithRules.find((c) => c.subreddit.toLowerCase() === cleanSub);
        const communityRulesSummary = parseRulesSummary(selectedEntry?.rulesText ?? "");

        emit({
          type: "step", step: 5, status: "done",
          msg: `Selected ${community.subreddit} · ${community.promotionStance} stance`,
          data: { community, communityRulesSummary },
        });
        console.log("[magic-scan] Step 5 done — selected:", community.subreddit, "| stance:", community.promotionStance);

        // ── Result ────────────────────────────────────────────────────────────
        const result: TechWeekMagicScanResponse & { _debug: object } = {
          brandProfile,
          community,
          meta: { brandName, storeUrl, ogImage, communityRulesSummary },
          _debug: {
            step1_scrape:            { contentLength: pageContent.length, title: brandName, ogImage },
            step2_brandProfile:      brandProfile,
            step3_candidates:        candidateNames,
            step4_rulesPerCandidate: candidatesWithRules,
            step5_selectedCommunity: community,
          },
        };
        emit({ type: "result", data: result });

      } catch (err) {
        console.error("[tech-week/magic-scan] Unexpected error:", err);
        emit({ type: "fatal", msg: err instanceof Error ? err.message : String(err) });
      } finally {
        try { controller.close(); } catch { /* already closed */ }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
