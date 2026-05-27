import { NextRequest, NextResponse } from "next/server";
import { ProxyAgent, fetch as proxyFetch } from "undici";
import { getGeminiModel } from "@/ai/gemini.model";
import type { BrandProfile, SelectedCommunity } from "@/app/api/tech-week/magic-scan/route";
import type { RedditPost } from "@/types";

// ─── Response types ───────────────────────────────────────────────────────────

export interface SentimentBreakdown {
  positive: number;  // percentage 0–100, all four sum to 100
  neutral:  number;
  curious:  number;
  critical: number;
}

export interface CommunityStats {
  subscribers: string;   // e.g. "4.1M" | "320K"
  activeUsers: string;   // e.g. "1,240 online"
}

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
  sentimentBreakdown: SentimentBreakdown;
  communityStats: CommunityStats;
  /** Top posts from the subreddit hot feed, excluding the 2 blueprint picks.
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
  return { "User-Agent": "LegitReach/1.1", "Accept": "application/json" };
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

async function fetchSubredditPosts(subreddit: string): Promise<RedditPost[]> {
  const clean = subreddit.startsWith("r/") ? subreddit.slice(2) : subreddit;
  const url = `https://www.reddit.com/r/${clean}/hot.json?limit=25&raw_json=1`;

  try {
    const res = await proxyGet(url);
    if (!res.ok) {
      console.warn(`[tech-week/curate] posts HTTP ${res.status}`);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = await res.json() as any;
    return (json?.data?.children ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((c: any) => c.kind === "t3" && !c.data.stickied)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((c: any): RedditPost => {
        const p = c.data;
        return {
          id:               p.id,
          title:            p.title,
          subreddit:        `r/${p.subreddit}`,
          author:           p.author,
          score:            p.score,
          num_comments:     p.num_comments,
          created_utc:      p.created_utc,
          selftext:         (p.selftext ?? "").slice(0, 500),
          permalink:        `https://reddit.com${p.permalink}`,
          url:              p.url,
          upvote_ratio:     p.upvote_ratio,    // ← real upvote %
          link_flair_text:  p.link_flair_text ?? undefined,
        };
      });
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
): Promise<Omit<TechWeekCurateResponse, "communityStats" | "engagementPosts">> {

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
  "sentimentBreakdown": {
    "positive": <integer 0-100: % of posts that are celebratory, supportive, wins, grateful>,
    "neutral":  <integer 0-100: % of posts that are informational, questions, neutral discussions>,
    "curious":  <integer 0-100: % of posts that are seeking advice, exploratory, open-ended>,
    "critical": <integer 0-100: % of posts that are venting, critical, controversial, negative>
  },
  "sentiment": {
    "postIndex": <1-based index — pick the post that best reveals what this community READS and values>,
    "communityInsight": "2-3 sentences: what this community values, what it distrusts, what tone gets upvotes. Be specific to what you see in these actual posts."
  },
  "engagement": {
    "postIndex": <1-based index of a DIFFERENT post — best opportunity to add value with a comment RIGHT NOW>,
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

Rules:
- sentimentBreakdown four values MUST sum to exactly 100
- sentiment and engagement MUST reference different posts
- Base sentimentBreakdown on the actual upvote_ratio values AND title/body content
- Return only the JSON. No markdown. No explanation.`;

  const model = getGeminiModel();
  const result = await model.generateContent(prompt);
  const raw = result.response.text().replace(/```json|```/g, "").trim();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsed = JSON.parse(raw) as any;

  const sentimentPost  = posts[parsed.sentiment.postIndex  - 1];
  const engagementPost = posts[parsed.engagement.postIndex - 1];

  // Normalise breakdown — ensure it sums to 100
  const bd = parsed.sentimentBreakdown as Record<string, number>;
  const total = (bd.positive ?? 0) + (bd.neutral ?? 0) + (bd.curious ?? 0) + (bd.critical ?? 0);
  const norm = (v: number) => Math.round((v / (total || 100)) * 100);
  const sentimentBreakdown: SentimentBreakdown = {
    positive: norm(bd.positive ?? 45),
    neutral:  norm(bd.neutral  ?? 30),
    curious:  norm(bd.curious  ?? 16),
    critical: norm(bd.critical ??  9),
  };
  // Fix any rounding drift so they always sum to 100
  const drift = 100 - (sentimentBreakdown.positive + sentimentBreakdown.neutral + sentimentBreakdown.curious + sentimentBreakdown.critical);
  sentimentBreakdown.neutral += drift;

  return {
    sentiment: {
      post: sentimentPost,
      communityInsight: parsed.sentiment.communityInsight,
    },
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
    sentimentBreakdown,
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

        const bd = playbook.sentimentBreakdown;
        emit({
          type: "step", step: 7, status: "done",
          msg: `Playbook ready · +${bd.positive}% positive · ?${bd.curious}% curious · ↔${bd.neutral}% neutral · ↓${bd.critical}% critical`,
        });
        console.log(
          `[tech-week/curate] Step 2 done — ` +
          `sentiment: ${playbook.sentiment.post?.id} · engagement: ${playbook.engagement.post?.id} · ` +
          `breakdown: +${bd.positive} ~${bd.neutral} ?${bd.curious} -${bd.critical}`
        );

        // ── Pick engagement posts — top posts NOT used in the blueprint ────────
        // Gemini selected 2 posts (sentiment + engagement) for the blueprint.
        // We surface 5 different hot posts for the Engagement tab so the user
        // sees fresh material to respond to, not a repeat of the blueprint picks.
        const blueprintIds = new Set(
          [playbook.sentiment.post?.id, playbook.engagement.post?.id].filter(Boolean)
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
              sentimentBreakdown: bd,
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
