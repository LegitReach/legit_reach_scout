import { NextRequest, NextResponse } from "next/server";
import { ProxyAgent, fetch as proxyFetch } from "undici";
import { getGeminiModel } from "@/ai/gemini.model";
import type { BrandProfile, SelectedCommunity } from "@/app/api/tech-week/magic-scan/route";
import type { RedditPost } from "@/types";

export const maxDuration = 30;

export interface TechWeekCurateResponse {
  sentiment: {
    post: RedditPost;
    communityInsight: string;
  };
  engagement: {
    post: RedditPost;
    draftComment: string;
    whyThisPost: string;
  };
  creation: {
    suggestedTitle: string;
    format: "question" | "discussion" | "advice" | "showcase";
    tone: string;
    contentOutline: string[];
    whatToAvoid: string[];
    postingTips: string;
  };
}

async function fetchSubredditPosts(subreddit: string): Promise<RedditPost[]> {
  const clean = subreddit.startsWith("r/") ? subreddit.slice(2) : subreddit;
  const url = `https://www.reddit.com/r/${clean}/hot.json?limit=25&raw_json=1`;

  const proxyUser = process.env.APIFY_PROXY_USERNAME;
  const proxyPass = process.env.APIFY_PROXY_PASSWORD;

  try {
    let res: Response;

    if (proxyUser && proxyPass) {
      const dispatcher = new ProxyAgent(
        `http://${proxyUser}:${proxyPass}@proxy.apify.com:8000`
      );
      res = await proxyFetch(url, {
        dispatcher,
        headers: {
          "User-Agent": "LegitReach/1.1",
          "Accept": "application/json",
        },
      }) as unknown as Response;
    } else {
      // Local dev fallback
      res = await fetch(url, {
        headers: {
          "User-Agent": "LegitReach/1.1",
          "Accept": "application/json",
        },
      });
    }

    if (!res.ok) {
      console.warn(`[tech-week/curate] posts fetch failed: HTTP ${res.status}`);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = await res.json() as any;
    const children = json?.data?.children ?? [];

    return children
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((c: any) => c.kind === "t3" && !c.data.stickied)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((c: any) => {
        const p = c.data;
        return {
          id: p.id,
          title: p.title,
          subreddit: `r/${p.subreddit}`,
          author: p.author,
          score: p.score,
          num_comments: p.num_comments,
          created_utc: p.created_utc,
          selftext: (p.selftext ?? "").slice(0, 500), // cap body length
          permalink: `https://reddit.com${p.permalink}`,
          url: p.url,
        } as RedditPost;
      });
  } catch (err) {
    console.error("[tech-week/curate] posts fetch threw:", err);
    return [];
  }
}

async function generatePlaybook(
  brand: BrandProfile,
  community: SelectedCommunity,
  posts: RedditPost[]
): Promise<TechWeekCurateResponse> {
  const postList = posts
    .map(
      (p, i) =>
        `[${i + 1}] id:${p.id} score:${p.score} comments:${p.num_comments}
Title: ${p.title}
Body: ${p.selftext || "(no body)"}
Link: ${p.permalink}`
    )
    .join("\n\n");

  const prompt = `You are a Reddit engagement strategist. A brand wants to engage authentically in a Reddit community. Analyse the 25 posts below and return a 3-part playbook.

BRAND PROFILE:
- Description: ${brand.businessDescription}
- Target audience: ${brand.targetAudience}
- Keywords: ${brand.keywords.join(", ")}
- Buyer problems: ${brand.buyerProblems.join(", ")}
- Voice & tone: ${brand.voiceTone}

COMMUNITY:
- Subreddit: ${community.subreddit}
- Why selected: ${community.selectionReason}
- Promotion stance: ${community.promotionStance}
- Stance reason: ${community.promotionStanceReason}

PROMOTION STANCE RULES FOR draftComment:
- "strict"   → zero brand mention, pure value-add answer only
- "neutral"  → mention the product only if directly relevant and asked
- "friendly" → may introduce brand softly if it genuinely solves the discussed problem

POSTS (${posts.length} total):
${postList}

Return ONLY a valid JSON object with this exact structure:
{
  "sentiment": {
    "postIndex": <1-based index of the post>,
    "communityInsight": "2-3 sentences: what this community values, what it distrusts, what tone gets upvotes. Be specific to what you see in these actual posts."
  },
  "engagement": {
    "postIndex": <1-based index of a DIFFERENT post — must not be the same as sentiment>,
    "draftComment": "A ready-to-post comment. Respect the promotionStance rule above exactly.",
    "whyThisPost": "One sentence: why this is the best engagement opportunity right now."
  },
  "creation": {
    "suggestedTitle": "A title for the user's own future post that would perform well in this community",
    "format": "question" or "discussion" or "advice" or "showcase",
    "tone": "How to write it — e.g. 'peer parent sharing a finding, not a brand pitch'",
    "contentOutline": ["Opening hook", "Core point 1", "Core point 2", "Call to discussion"],
    "whatToAvoid": ["Specific thing to avoid based on community rules or post patterns"],
    "postingTips": "Best time, flair suggestions, length guidance based on what works in these posts"
  }
}

Rules:
- sentiment and engagement MUST reference different posts
- creation is a blueprint, not a real Reddit post
- All advice must be grounded in the actual posts and community rules provided
- Return only the JSON. No markdown. No explanation.`;

  const model = getGeminiModel();
  const result = await model.generateContent(prompt);
  const raw = result.response.text().replace(/```json|```/g, "").trim();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsed = JSON.parse(raw) as any;

  // Resolve post indices back to full post objects
  const sentimentPost = posts[parsed.sentiment.postIndex - 1];
  const engagementPost = posts[parsed.engagement.postIndex - 1];

  return {
    sentiment: {
      post: sentimentPost,
      communityInsight: parsed.sentiment.communityInsight,
    },
    engagement: {
      post: engagementPost,
      draftComment: parsed.engagement.draftComment,
      whyThisPost: parsed.engagement.whyThisPost,
    },
    creation: {
      suggestedTitle: parsed.creation.suggestedTitle,
      format: parsed.creation.format,
      tone: parsed.creation.tone,
      contentOutline: parsed.creation.contentOutline,
      whatToAvoid: parsed.creation.whatToAvoid,
      postingTips: parsed.creation.postingTips,
    },
  };
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { brandProfile, community } = body as {
    brandProfile?: BrandProfile;
    community?: SelectedCommunity;
  };

  if (!brandProfile || !community) {
    return NextResponse.json(
      { error: "brandProfile and community are required" },
      { status: 400 }
    );
  }

  try {
    // ── 1. Fetch subreddit hot feed via Apify proxy ──────────────────────────
    console.log(`[tech-week/curate] Step 1 — fetching posts from ${community.subreddit}`);
    const posts = await fetchSubredditPosts(community.subreddit);
    console.log(`[tech-week/curate] Step 1 done — ${posts.length} posts fetched`);

    if (posts.length === 0) {
      return NextResponse.json(
        { error: `Could not fetch posts from ${community.subreddit}. The community may be private or restricted.` },
        { status: 422 }
      );
    }

    // ── 2. Gemini: single call → 3-post playbook ────────────────────────────
    console.log(`[tech-week/curate] Step 2 — Gemini playbook generation (${posts.length} posts, stance: ${community.promotionStance})`);
    const playbook = await generatePlaybook(brandProfile, community, posts);
    console.log(`[tech-week/curate] Step 2 done — sentiment: ${playbook.sentiment.post?.id}, engagement: ${playbook.engagement.post?.id}`);

    return NextResponse.json({
      ...playbook,
      _debug: {
        subreddit: community.subreddit,
        promotionStance: community.promotionStance,
        postsAnalysed: posts.length,
        postTitles: posts.map(p => p.title),
      },
    });

  } catch (err) {
    console.error("[tech-week/curate] Error:", err);
    return NextResponse.json(
      {
        error: "Curate failed.",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
