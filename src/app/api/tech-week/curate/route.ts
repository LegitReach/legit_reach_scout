import { NextRequest, NextResponse } from "next/server";
import { ProxyAgent, fetch as proxyFetch } from "undici";
import { getGeminiModel } from "@/ai/gemini.model";
import type { BrandProfile, SelectedCommunity } from "@/app/api/tech-week/magic-scan/route";
import type { RedditPost } from "@/types";

// ─── Response types ───────────────────────────────────────────────────────────

export interface CommunityStats {
  subscribers: string;   // e.g. "4.1M" | "320K"
  activeUsers: string;   // e.g. "1,240 online"
}

export interface TechWeekCurateResponse {
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
  communityStats: CommunityStats;
  /** Top posts from the subreddit hot feed, excluding the blueprint pick.
   *  Used by the Engagement tab — different from what shows in Blueprint. */
  engagementPosts: RedditPost[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString();
}

function proxyHeaders() {
  return { "User-Agent": "NotReddit/1.1", "Accept": "application/json" };
}

function proxyDispatcher() {
  const u = process.env.APIFY_PROXY_USERNAME;
  const p = process.env.APIFY_PROXY_PASSWORD;
  if (!u || !p) return null;
  return new ProxyAgent(`http://${u}:${p}@proxy.apify.com:8000`);
}

async function proxyGet(url: string): Promise<Response> {
  const dispatcher = proxyDispatcher();
  if (dispatcher) {
    return proxyFetch(url, { dispatcher, headers: proxyHeaders() }) as unknown as Response;
  }
  return fetch(url, { headers: proxyHeaders() });
}

// ─── Reddit fetches (run in parallel) ────────────────────────────────────────

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

async function fetchSubredditPosts(subreddit: string): Promise<RedditPost[]> {
  const clean = subreddit.startsWith("r/") ? subreddit.slice(2) : subreddit;
  const url = `https://www.reddit.com/r/${clean}/hot.rss?limit=25`;

  try {
    const res = await proxyGet(url);
    if (!res.ok) {
      console.warn(`[tech-week/curate] posts HTTP ${res.status}`);
      return [];
    }

    const xml = await res.text();
    const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];

    if (!entries.length) {
      console.warn(`[tech-week/curate] no RSS entries for r/${clean}`);
      return [];
    }

    return entries
      .map((match): RedditPost | null => {
        const e = match[1];

        const rawId   = e.match(/<id>([\s\S]*?)<\/id>/)?.[1] ?? "";
        const postId  = rawId.match(/t3_([a-z0-9]+)/i)?.[1] ?? rawId;
        const title   = decodeXmlEntities(e.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] ?? "");
        const author  = e.match(/<author>\s*<name>([\s\S]*?)<\/name>/)?.[1] ?? "unknown";
        const link    = e.match(/<link[^>]*href="([^"]+)"/)?.[1] ?? "";
        const published = e.match(/<published>([\s\S]*?)<\/published>/)?.[1] ?? "";
        const createdUtc = published
          ? Math.floor(new Date(published).getTime() / 1000)
          : Math.floor(Date.now() / 1000);
        const category = e.match(/<category[^>]*label="([^"]+)"/)?.[1] ?? clean;
        const contentHtml = e.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1] ?? "";
        const selftext = decodeXmlEntities(contentHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()).slice(0, 500);

        if (!title || !link) return null;

        return {
          id:              postId,
          title,
          subreddit:       `r/${category}`,
          author,
          score:           0,
          num_comments:    0,
          created_utc:     createdUtc,
          selftext,
          permalink:       link,
          url:             link,
          upvote_ratio:    undefined,
          link_flair_text: undefined,
        };
      })
      .filter((p): p is RedditPost => p !== null);
  } catch (err) {
    console.error("[tech-week/curate] posts fetch threw:", err);
    return [];
  }
}

async function fetchSubredditAbout(subreddit: string): Promise<CommunityStats> {
  const clean = subreddit.startsWith("r/") ? subreddit.slice(2) : subreddit;
  const url = `https://www.reddit.com/r/${clean}/about.json`;

  try {
    const res = await proxyGet(url);
    if (!res.ok) return { subscribers: "—", activeUsers: "—" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = await res.json() as any;
    const d = json?.data;
    return {
      subscribers: d?.subscribers    ? formatCount(d.subscribers)    : "—",
      activeUsers: d?.active_user_count
        ? formatCount(d.active_user_count) + " online"
        : "—",
    };
  } catch {
    return { subscribers: "—", activeUsers: "—" };
  }
}

// ─── Gemini playbook generation ───────────────────────────────────────────────

async function generatePlaybook(
  brand: BrandProfile,
  community: SelectedCommunity,
  posts: RedditPost[]
): Promise<Pick<TechWeekCurateResponse, "engagement" | "creation">> {

  const postList = posts
    .map((p, i) => {
      const upvotePct = p.upvote_ratio != null
        ? `${Math.round(p.upvote_ratio * 100)}%`
        : "?";
      const flair = p.link_flair_text ? ` [${p.link_flair_text}]` : "";
      return (
        `[${i + 1}] id:${p.id} score:${p.score} upvotes:${upvotePct} comments:${p.num_comments}${flair}\n` +
        `Title: ${p.title}\n` +
        `Body: ${p.selftext || "(no body)"}`
      );
    })
    .join("\n\n");

  const prompt = `You are a Reddit engagement strategist. A brand wants to engage authentically in a Reddit community. Analyse the ${posts.length} posts below and return a playbook.

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

POSTS (${posts.length} total, upvotes = approval ratio from real Reddit data):
${postList}

Return ONLY a valid JSON object with this exact structure:
{
  "engagement": {
    "postIndex": <1-based index — best opportunity to add value with a comment RIGHT NOW>,
    "draftComment": "A ready-to-post comment. Respect the promotionStance rule above exactly. Keep it SHORT (1-2 sentences, max ~40 words), casual, and genuinely engaging like a real person typing fast. Do NOT use em dashes (—). Do NOT sound like AI or marketing copy. Prioritise sparking a reply over sounding polished.",
    "whyThisPost": "One sentence: why this is the best engagement opportunity right now."
  },
  "creation": {
    "suggestedTitle": "A title for the user's own future post that would perform well in this community",
    "format": "question" or "discussion" or "advice" or "showcase",
    "tone": "How to write it — e.g. 'peer sharing a finding, not a brand pitch'",
    "contentOutline": ["Opening hook", "Core point 1", "Core point 2", "Call to discussion"],
    "whatToAvoid": ["Specific thing to avoid based on community rules or post patterns"],
    "postingTips": "Best time, flair suggestions, length guidance based on what works in these posts"
  }
}

Return only the JSON. No markdown. No explanation.`;

  const model = getGeminiModel();
  const result = await model.generateContent(prompt);
  const raw = result.response.text().replace(/```json|```/g, "").trim();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsed = JSON.parse(raw) as any;

  const engagementPost = posts[parsed.engagement.postIndex - 1];

  return {
    engagement: {
      post: engagementPost,
      draftComment: parsed.engagement.draftComment,
      whyThisPost:  parsed.engagement.whyThisPost,
    },
    creation: {
      suggestedTitle: parsed.creation.suggestedTitle,
      format:         parsed.creation.format,
      tone:           parsed.creation.tone,
      contentOutline: parsed.creation.contentOutline,
      whatToAvoid:    parsed.creation.whatToAvoid,
      postingTips:    parsed.creation.postingTips,
    },
  };
}

// ─── Handler (SSE streaming) ──────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: { brandProfile?: BrandProfile; community?: SelectedCommunity };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { brandProfile, community } = body;
  if (!brandProfile || !community) {
    return NextResponse.json(
      { error: "brandProfile and community are required" },
      { status: 400 }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch { /* controller already closed */ }
      };

      try {
        // ── 6. Fetch posts + subreddit stats (parallel) ──────────────────────
        emit({ type: "step", step: 6, status: "start", msg: `Fetching posts from ${community.subreddit}…` });
        console.log(`[tech-week/curate] Step 1 — fetching posts + about for ${community.subreddit}`);

        let posts: Awaited<ReturnType<typeof fetchSubredditPosts>>;
        let communityStats: Awaited<ReturnType<typeof fetchSubredditAbout>>;
        try {
          [posts, communityStats] = await Promise.all([
            fetchSubredditPosts(community.subreddit),
            fetchSubredditAbout(community.subreddit),
          ]);
        } catch (err) {
          emit({ type: "step", step: 6, status: "error", msg: `Fetch failed: ${err instanceof Error ? err.message : String(err)}` });
          emit({ type: "fatal", msg: `Could not fetch posts from ${community.subreddit}.` });
          return;
        }

        if (posts.length === 0) {
          emit({ type: "step", step: 6, status: "error", msg: "No posts returned — community may be private or restricted" });
          emit({ type: "fatal", msg: `Could not fetch posts from ${community.subreddit}. The community may be private or restricted.` });
          return;
        }

        const statsMsg = [
          `${posts.length} posts`,
          communityStats.subscribers !== "—" ? communityStats.subscribers + " subscribers" : null,
          communityStats.activeUsers  !== "—" ? communityStats.activeUsers               : null,
        ].filter(Boolean).join(" · ");

        emit({ type: "step", step: 6, status: "done", msg: statsMsg });
        console.log(`[tech-week/curate] Step 1 done — ${statsMsg}`);

        // ── 7. Gemini: playbook + sentiment breakdown ────────────────────────
        emit({ type: "step", step: 7, status: "start", msg: `Generating engagement playbook for ${community.subreddit}…` });
        console.log(`[tech-week/curate] Step 2 — Gemini (${posts.length} posts, stance: ${community.promotionStance})`);

        let playbook: Awaited<ReturnType<typeof generatePlaybook>>;
        try {
          playbook = await generatePlaybook(brandProfile, community, posts);
        } catch (err) {
          emit({ type: "step", step: 7, status: "error", msg: `Playbook generation failed: ${err instanceof Error ? err.message : String(err)}` });
          emit({ type: "fatal", msg: "Could not generate playbook. Please try again." });
          return;
        }

        emit({ type: "step", step: 7, status: "done", msg: `Playbook ready · engagement: ${playbook.engagement.post?.id}` });
        console.log(`[tech-week/curate] Step 2 done — engagement: ${playbook.engagement.post?.id}`);

        // ── Pick engagement posts — top posts NOT used in the blueprint ────────
        const blueprintIds = new Set(
          [playbook.engagement.post?.id].filter(Boolean)
        );
        const engagementPosts = posts
          .filter((p) => !blueprintIds.has(p.id))
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        // ── Result ────────────────────────────────────────────────────────────
        const response: TechWeekCurateResponse = { ...playbook, communityStats, engagementPosts };
        emit({
          type: "result",
          data: {
            ...response,
            _debug: {
              subreddit:          community.subreddit,
              promotionStance:    community.promotionStance,
              postsAnalysed:      posts.length,
              communityStats,

              postTitles:         posts.map((p) => p.title),
            },
          },
        });

      } catch (err) {
        console.error("[tech-week/curate] Unexpected error:", err);
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
