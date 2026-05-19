"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FadeIn, AnimatedHeading } from "@/components/lr-design/visuals";
import {
  BackgroundIndexer,
  Modal,
  PanelLoading,
  LockIcon,
} from "./_chrome";
import { AGENTS, AgentSilhouette } from "./_agents";

type FeedPost = {
  sub: string;
  title: string;
  postBody: string;
  age: string;
  up: number;
  comments: number;
  intent: "high" | "medium";
  match: number;
  businessDescription: string;
  url: string;
};

type RedditItem = {
  subreddit: string;
  body: string;
  created_utc: number;
  url: string;
};

const REDDIT_HISTORY: RedditItem[] = [
  { subreddit: "nagpur", body: "24 hour update:\n\nI got more responses than expected. This is great as community effort for the project would be crucial.\n\nWe are live: www.orng.shop\n\nOn the website:\nA. One pager to what the project currently looks like\nB. Join button adds you to a Whatsapp group.\n\nThanks for everyone who expressed support and interest. Cheers 🍊", created_utc: 1776075703, url: "https://www.reddit.com/r/nagpur/comments/1sja8e2/help_me_make_nagpur_global/ofwuy3g/" },
  { subreddit: "SideProject", body: "www.LegitReach.com", created_utc: 1774422193, url: "https://www.reddit.com/r/SideProject/comments/1s2nja9/drop_your_project_link_ill_write_you_a_oneliner/occmc82/" },
  { subreddit: "gohighlevel", body: "What's a2p in this context?", created_utc: 1773808392, url: "https://www.reddit.com/r/gohighlevel/comments/1rwoy5q/i_need_help_with_a2p_application/ob2bz3o/" },
  { subreddit: "redditdev", body: "HOW TO GET THE APIS?", created_utc: 1773758675, url: "https://www.reddit.com/r/redditdev/comments/1rw6oqa/so_i_just_submitted_a_request_for_api_access/oaxtaod/" },
  { subreddit: "ClaudeAI", body: "Trying to do everything :!", created_utc: 1773741904, url: "https://www.reddit.com/r/ClaudeAI/comments/1rvu2lu/what_have_you_done_with_claude/oawkrfl/" },
  { subreddit: "ecommerce", body: "Keep it simple.\n\nIf you're certain you're a better price than Amazon and Amazon has a similar product, you should get a winnable CAC.", created_utc: 1773737645, url: "https://www.reddit.com/r/ecommerce/comments/1rvh0gp/what_am_i_doing_wrong/oawda7l/" },
  { subreddit: "saasbuild", body: "Slide into your ICPs DM on Reddit.\nUnlock legit conversations and insights. Get 10 paid users.\nwww.LegitReach.com", created_utc: 1773736571, url: "https://www.reddit.com/r/saasbuild/comments/1rvopqi/can_you_explain_your_startup_in_one_sentence/oawbgpi/" },
  { subreddit: "FacebookAds", body: "Stop blaming iOS updates.\n\nYour CAC is high because you're selling to people who didn't ask for your product. Meanwhile there are Reddit threads full of your exact ICP describing their problems in their own words; for free.\n\nThe brands winning right now aren't outspending you, they're outlistening you. (Especially with superlistening AI capabilities)", created_utc: 1773734283, url: "https://www.reddit.com/r/FacebookAds/comments/1qh4cwq/anyone_else_seeing_terrible_ios_performance_after/oaw7n94/" },
  { subreddit: "FacebookAds", body: "Reddit threads are worth more than your entire Meta ad budget. People are literally typing \"I wish someone made X\" and you're spending $50/day on carousel ads hoping the algorithm cares.\n\nI started scanning Reddit daily for my brand and found more actionable product ideas in a week than 6 months of ads data.", created_utc: 1773734199, url: "https://www.reddit.com/r/FacebookAds/comments/1r4l6fa/my_sales_have_dropped_by_80_in_the_last_3_days_is/oaw7i4q/" },
  { subreddit: "ecommerce", body: "Ok boss, edits incoming.", created_utc: 1773734044, url: "https://www.reddit.com/r/ecommerce/comments/1rvzfqr/i_spent_40_hours_reading_reddit_threads_about/oaw78vj/" },
];

function timeAgo(utc: number): string {
  const diff = Math.floor(Date.now() / 1000) - utc;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function formatRedditDate(unix: number) {
  const d = new Date(unix * 1000);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STATS = [
  { label: "Outreach actions", value: "84" },
  { label: "Interactions achieved", value: "12.4k" },
];

type ApprovedItem = {
  sub: string;
  title: string;
  draft: string;
  url: string;
  posted: boolean;
};

import type { CurationResult } from "./_steps";

export function Step4Dashboard({
  agentId,
  setAgentId,
  curationResult,
  businessDescription,
}: {
  agentId: string;
  setAgentId: (id: string) => void;
  curationResult: CurationResult | null;
  businessDescription: string;
}) {
  const [approvedItems, setApprovedItems] = useState<ApprovedItem[]>([]);
  const [feedLoaded, setFeedLoaded] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tokens, setTokens] = useState(87);
  const [redditUsername, setRedditUsername] = useState("");
  const [showMoreFeed, setShowMoreFeed] = useState(false);

  const liveFeed: FeedPost[] = curationResult
    ? curationResult.curated_posts
        .filter((c) => c.recommended_action !== "skip")
        .map((c) => {
          const post = curationResult.posts.find((p) => (p as Record<string, unknown>).id === c.id) as Record<string, unknown> | undefined;
          return {
            sub: `${post?.subreddit ?? "reddit"}`,
            title: String(post?.title ?? ""),
            postBody: String(post?.selftext ?? ""),
            age: timeAgo(Number(post?.created_utc ?? 0)),
            up: Number(post?.score ?? 0),
            comments: Number(post?.num_comments ?? 0),
            intent: c.ai_opportunity_score >= 70 ? "high" : "medium",
            match: c.ai_opportunity_score,
            businessDescription,
            url: post?.url
              ? `${post.url}`
              : `https://reddit.com/r/${post?.subreddit ?? ""}`,
          } satisfies FeedPost;
        })
    : [];

  useEffect(() => {
    if (curationResult) setFeedLoaded(true);
  }, [curationResult]);

  return (
    <div
      className="px-6 md:px-12 lg:px-16"
      style={{ paddingTop: "7.5rem", paddingBottom: "4rem" }}
    >
      <div className="max-w-7xl mx-auto">
        <div
          className="flex items-center justify-between mb-4"
          style={{ flexWrap: "wrap", gap: "0.75rem" }}
        >
          <FadeIn duration={700}>
            <div
              className="text-xs uppercase tracking-widest"
              style={{ color: "#9ca3af" }}
            >
              YOUR CONTROL ROOM
            </div>
          </FadeIn>
          <FadeIn delay={200} duration={700}>
            <BackgroundIndexer />
          </FadeIn>
        </div>
        <div
          className="flex flex-wrap items-end justify-between"
          style={{ gap: "1rem", marginBottom: "2rem" }}
        >
          <AnimatedHeading
            text="Your online stats"
            className="text-3xl md:text-4xl lg:text-5xl font-normal"
          />
        </div>

        <FadeIn delay={300} duration={700}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0,1fr))",
              gap: "1rem",
              marginBottom: "2rem",
            }}
          >
            {STATS.map((s, i) => (
              <div
                key={i}
                className="liquid-glass rounded-xl"
                style={{
                  border: "1px solid rgba(255,255,255,0.15)",
                  padding: "1.5rem 1.75rem",
                }}
              >
                <div
                  className="text-xs uppercase tracking-widest mb-3"
                  style={{ color: "#9ca3af" }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontSize: "3rem",
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                    fontWeight: 300,
                  }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </FadeIn>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0,1fr))",
            gap: "1.5rem",
            alignItems: "stretch",
          }}
        >
          {/* Live feed */}
          <FadeIn delay={400} duration={700} style={{ display: "flex" }}>
            <div
              className="liquid-glass rounded-2xl p-6"
              style={{
                border: "1px solid rgba(255,255,255,0.18)",
                display: "flex",
                flexDirection: "column",
                width: "100%",
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div
                    className="text-xs uppercase tracking-widest mb-1"
                    style={{ color: "#9ca3af" }}
                  >
                    Live feed
                  </div>
                  <div className="text-lg font-medium">
                    Conversations matching your audience
                  </div>
                </div>
                <div className="text-xs" style={{ color: "#9ca3af" }}>
                  {feedLoaded ? "refreshed 12s ago" : "scanning…"}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {feedLoaded ? (
                  (showMoreFeed ? liveFeed : liveFeed.slice(0, 2)).map(
                    (p, i) => (
                      <FeedRow
                        key={i}
                        post={p}
                        onApprove={(item) => setApprovedItems((prev) => [...prev, item])}
                      />
                    )
                  )
                ) : (
                  <PanelLoading
                    label="Scanning communities for matches…"
                    rows={2}
                  />
                )}
              </div>
              {feedLoaded && liveFeed.length > 2 && (
                <div style={{ marginTop: "auto", paddingTop: "1.25rem" }}>
                  <button
                    onClick={() => setShowMoreFeed((v) => !v)}
                    style={{
                      background: "transparent",
                      color: "#d1d5db",
                      fontSize: 13,
                      textDecoration: "underline",
                      textUnderlineOffset: 4,
                      padding: 0,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {showMoreFeed
                      ? "Show fewer matches ↑"
                      : `Show ${liveFeed.length - 2} more matches →`}
                  </button>
                </div>
              )}
            </div>
          </FadeIn>

          {/* Reply queue */}
          <FadeIn delay={500} duration={700} style={{ display: "flex" }}>
            <div
              className="liquid-glass rounded-2xl p-6"
              style={{
                border: "1px solid rgba(255,255,255,0.18)",
                display: "flex",
                flexDirection: "column",
                width: "100%",
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div
                    className="text-xs uppercase tracking-widest mb-1"
                    style={{ color: "#9ca3af" }}
                  >
                    Reply queue
                  </div>
                  <div className="text-lg font-medium">
                    Approved drafts
                  </div>
                </div>
                {approvedItems.length > 0 && (
                  <div
                    className="text-xs"
                    style={{
                      color: "#fde68a",
                      background: "rgba(253,230,138,0.1)",
                      border: "1px solid rgba(253,230,138,0.25)",
                      borderRadius: 999,
                      padding: "2px 10px",
                    }}
                  >
                    {approvedItems.filter((i) => !i.posted).length} ready
                  </div>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flex: 1 }}>
                {approvedItems.length === 0 ? (
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      padding: "2rem 1rem",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 28, opacity: 0.2 }}>✦</div>
                    <div className="text-sm" style={{ color: "#6b7280", lineHeight: 1.5 }}>
                      Approve a post from the feed to generate a reply draft
                    </div>
                  </div>
                ) : (
                  approvedItems.map((item, i) => (
                    <ReplyQueueItem
                      key={i}
                      item={item}
                      onDone={() =>
                        setApprovedItems((prev) =>
                          prev.map((x, j) => (j === i ? { ...x, posted: true } : x))
                        )
                      }
                    />
                  ))
                )}
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Reddit history */}
        <FadeIn delay={600} duration={700}>
          <RedditHistoryPanel
            username={redditUsername}
            onConnect={() => setShowSettings(true)}
          />
        </FadeIn>

        <FadeIn delay={700} duration={700}>
          <div
            className="mt-12 flex flex-wrap items-center justify-between"
            style={{ gap: "1rem" }}
          >
            <div className="text-sm" style={{ color: "#9ca3af" }}>
              Demo workflow completed. You can access the beta by clicking{" "}
              <Link
                href="/beta"
                style={{
                  color: "#fff",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                here
              </Link>
              .
            </div>
            <div className="flex flex-wrap" style={{ gap: "0.75rem" }}>
              <button
                onClick={() => setShowPayment(true)}
                className="lr-btn-ghost liquid-glass"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 999,
                    background: tokens > 20 ? "#86efac" : "#fca5a5",
                    boxShadow: `0 0 6px ${tokens > 20 ? "#86efac" : "#fca5a5"}`,
                  }}
                />
                <span>
                  Actions remaining:{" "}
                  <strong style={{ fontWeight: 600 }}>{tokens}</strong>
                </span>
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="lr-btn-primary"
              >
                Settings
              </button>
            </div>
          </div>
        </FadeIn>
      </div>

      {showPayment && (
        <PaymentModal
          currentTokens={tokens}
          onClose={() => setShowPayment(false)}
          onTopUp={(amount) => {
            setTokens((t) => t + amount);
            setShowPayment(false);
          }}
        />
      )}
      {showSettings && (
        <SettingsModal
          username={redditUsername}
          setUsername={setRedditUsername}
          agentId={agentId}
          setAgentId={setAgentId}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

function FeedRow({ post, onApprove }: { post: FeedPost; onApprove: (item: ApprovedItem) => void }) {
  const intentColor = post.intent === "high" ? "#86efac" : "#fde68a";
  const [plan, setPlan] = useState<import("@/app/api/a16z/draft-comment/route").EngagementPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [action, setAction] = useState<"approved" | "skipped" | null>(null);

  useEffect(() => {
    fetch("/api/a16z/draft-comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postTitle: post.title,
        postBody: post.postBody,
        subreddit: post.sub,
        businessDescription: post.businessDescription,
      }),
    })
      .then((r) => r.json())
      .then((data) => setPlan(data.plan ?? null))
      .catch(() => setPlan(null))
      .finally(() => setPlanLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs" style={{ color: "#9ca3af" }}>
          {post.sub} · {post.age}
        </div>
        <div className="flex items-center" style={{ gap: "0.5rem" }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: intentColor,
              boxShadow: `0 0 6px ${intentColor}`,
            }}
          />
          <span className="text-xs" style={{ color: intentColor }}>
            {post.intent} intent
          </span>
        </div>
      </div>
      <div
        className="text-sm leading-snug mb-3"
        style={{ fontWeight: 500, color: "#f3f4f6" }}
      >
        {post.title}
      </div>
      <div className="flex items-center justify-between">
        <div
          className="text-xs flex items-center"
          style={{ gap: "0.85rem", color: "#9ca3af" }}
        >
          <span className="flex items-center" style={{ gap: "0.3rem" }}>
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: 0.7 }}
            >
              <path d="M5 1.5 L1.5 5.5 M5 1.5 L8.5 5.5 M5 1.5 L5 8.5" />
            </svg>
            <span>{post.up}</span>
          </span>
          <span className="flex items-center" style={{ gap: "0.3rem" }}>
            <svg
              width="11"
              height="11"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
              style={{ opacity: 0.7 }}
            >
              <path d="M2 3.2 a1.2 1.2 0 0 1 1.2 -1.2 h5.6 a1.2 1.2 0 0 1 1.2 1.2 v3.6 a1.2 1.2 0 0 1 -1.2 1.2 h-3.4 l-2.4 1.8 v-1.8 h-0.0 a1.2 1.2 0 0 1 -1.2 -1.2 z" />
            </svg>
            <span>{post.comments}</span>
          </span>
        </div>
        <div className="text-xs" style={{ color: "#fff" }}>
          match {post.match}%
        </div>
      </div>
      <div
        style={{
          marginTop: 8,
          height: 3,
          background: "rgba(255,255,255,0.08)",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${post.match}%`,
            height: "100%",
            background: "#fff",
          }}
        />
      </div>

      <div
        style={{
          marginTop: 12,
          borderTop: "1px solid rgba(255,255,255,0.06)",
          paddingTop: 10,
        }}
      >
        <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "#6b7280" }}>
          Engagement plan
        </div>
        {planLoading ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                border: "1.5px solid rgba(255,255,255,0.15)",
                borderTopColor: "#fff",
                animation: "spin 0.8s linear infinite",
                flexShrink: 0,
              }}
            />
            <span className="text-xs" style={{ color: "#6b7280" }}>analysing…</span>
          </div>
        ) : plan ? (
          <>
            <PlanCard plan={plan} />
            <div
              style={{
                marginTop: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "0.5rem",
              }}
            >
              {action ? (
                <span
                  className="text-xs"
                  style={{
                    color: action === "approved" ? "#86efac" : "#fca5a5",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      background: action === "approved" ? "#86efac" : "#fca5a5",
                      flexShrink: 0,
                    }}
                  />
                  {action === "approved" ? "Queued to post" : "Skipped"}
                </span>
              ) : (
                <>
                  <button
                    onClick={() => setAction("skipped")}
                    style={{
                      background: "transparent",
                      color: "#d1d5db",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: 8,
                      padding: "0.3rem 0.85rem",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Skip
                  </button>
                  <button
                    onClick={() => {
                      setAction("approved");
                      onApprove({ sub: post.sub, title: post.title, draft: plan.draft ?? "", url: post.url, posted: false });
                    }}
                    style={{
                      background: "#fff",
                      color: "#000",
                      border: "none",
                      borderRadius: 8,
                      padding: "0.3rem 0.85rem",
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    Approve
                  </button>
                </>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function PlanCard({ plan }: { plan: import("@/app/api/a16z/draft-comment/route").EngagementPlan }) {
  const riskColor = plan.riskLevel === "Low" ? "#86efac" : plan.riskLevel === "Medium" ? "#fde68a" : "#fca5a5";

  const rows: { label: string; value: string; accent?: string }[] = [
    { label: "Intent", value: plan.intent },
    { label: "Angle", value: plan.angle },
    { label: "Tone", value: plan.tone },
    {
      label: "Product",
      value: plan.mentionProduct
        ? `Yes — ${plan.mentionHow}`
        : "No",
      accent: plan.mentionProduct ? "#fde68a" : "#6b7280",
    },
    { label: "Risk", value: `${plan.riskLevel} — ${plan.riskReason}`, accent: riskColor },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
      {rows.map(({ label, value, accent }) => (
        <div key={label} className="flex" style={{ gap: "0.5rem", alignItems: "flex-start" }}>
          <span
            style={{
              minWidth: 48,
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#6b7280",
              paddingTop: 2,
              flexShrink: 0,
            }}
          >
            {label}
          </span>
          <span style={{ fontSize: 12, lineHeight: 1.5, color: accent ?? "#d1d5db" }}>
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

function ReplyQueueItem({ item, onDone }: { item: ApprovedItem; onDone: () => void }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(item.draft).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        opacity: item.posted ? 0.5 : 1,
        transition: "opacity 200ms ease",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs" style={{ color: "#9ca3af" }}>{item.sub}</div>
        {item.posted && (
          <span className="text-xs" style={{ color: "#86efac" }}>posted ✓</span>
        )}
      </div>
      <div className="text-xs mb-3" style={{ color: "#d1d5db", fontWeight: 500, lineHeight: 1.4 }}>
        {item.title.length > 80 ? item.title.slice(0, 80) + "…" : item.title}
      </div>
      <div
        className="text-xs rounded-lg p-3 mb-3"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#e5e7eb",
          lineHeight: 1.6,
          fontStyle: "italic",
        }}
      >
        {item.draft}
      </div>
      {!item.posted && (
        <div className="flex justify-end" style={{ gap: "0.5rem" }}>
          <button
            onClick={copy}
            style={{
              background: "transparent",
              color: copied ? "#86efac" : "#d1d5db",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8,
              padding: "0.3rem 0.85rem",
              fontSize: 12,
              cursor: "pointer",
              transition: "color 150ms ease",
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(item.draft).then(() => {
                window.open(item.url, "_blank", "noopener,noreferrer");
                onDone();
              });
            }}
            style={{
              background: "#fff",
              color: "#000",
              border: "none",
              borderRadius: 8,
              padding: "0.3rem 0.85rem",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Post it →
          </button>
        </div>
      )}
    </div>
  );
}

function RedditHistoryPanel({
  username,
  onConnect,
}: {
  username: string;
  onConnect: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [shown, setShown] = useState(4);

  useEffect(() => {
    if (!username) return;
    const t = setTimeout(() => setRevealed(true), 900);
    return () => clearTimeout(t);
  }, [username]);

  const locked = !username;
  const items = REDDIT_HISTORY;

  return (
    <div
      className="liquid-glass rounded-2xl"
      style={{
        border: "1px solid rgba(255,255,255,0.18)",
        marginTop: "1.5rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div>
          <div
            className="text-xs uppercase tracking-widest mb-1"
            style={{ color: "#9ca3af" }}
          >
            Your Reddit history
          </div>
          <div className="text-lg font-medium">
            {locked ? (
              "Connect your account to seed the model"
            ) : (
              <>
                Recent activity for{" "}
                <span style={{ color: "#fff" }}>u/{username}</span>
              </>
            )}
          </div>
        </div>
        {locked ? (
          <div />
        ) : (
          <div className="text-xs" style={{ color: "#9ca3af" }}>
            {items.length} posts &amp; comments
          </div>
        )}
      </div>

      {locked && (
        <div style={{ position: "relative", padding: "1.5rem" }}>
          <div
            style={{
              filter: "blur(6px)",
              opacity: 0.45,
              pointerEvents: "none",
              display: "flex",
              flexDirection: "column",
              gap: "0.6rem",
            }}
          >
            {items.slice(0, 3).map((it, i) => (
              <RedditHistoryRow key={i} item={it} preview />
            ))}
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "0.75rem",
              background:
                "radial-gradient(ellipse at center, rgba(0,0,0,0.4), rgba(0,0,0,0.7))",
            }}
          >
            <LockIcon />
            <div
              className="text-sm"
              style={{
                maxWidth: 380,
                textAlign: "center",
                lineHeight: 1.5,
                color: "#e5e7eb",
              }}
            >
              Connect your Reddit username to import your past posts and
              comments. The agent learns your tone from your own words.
            </div>
            <button
              onClick={onConnect}
              className="lr-btn-primary"
              style={{ marginTop: "0.25rem" }}
            >
              Add username
            </button>
          </div>
        </div>
      )}

      {!locked && (
        <div style={{ padding: "1.25rem 1.5rem" }}>
          {!revealed ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <PanelLoading
                label={`Importing posts and comments from u/${username}…`}
                rows={3}
              />
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {items.slice(0, shown).map((it, i) => (
                  <RedditHistoryRow key={i} item={it} />
                ))}
              </div>
              {shown < items.length && (
                <div className="mt-5">
                  <button
                    onClick={() => setShown(items.length)}
                    style={{
                      background: "transparent",
                      color: "#d1d5db",
                      fontSize: 13,
                      textDecoration: "underline",
                      textUnderlineOffset: 4,
                      padding: 0,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Show {items.length - shown} more →
                  </button>
                </div>
              )}
              <div
                className="mt-5 liquid-glass rounded-xl p-4"
                style={{ border: "1px solid rgba(255,255,255,0.12)" }}
              >
                <div
                  className="text-xs uppercase tracking-widest mb-2"
                  style={{ color: "#9ca3af" }}
                >
                  Used for tone
                </div>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "#e5e7eb" }}
                >
                  The agent treats this as ground truth for how you sound.
                  Nothing is reposted, ever.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function RedditHistoryRow({
  item,
  preview,
}: {
  item: RedditItem;
  preview?: boolean;
}) {
  const body = (item.body || "").replace(/\n+/g, " ").trim();
  const truncated = body.length > 220 ? body.slice(0, 220) + "…" : body;
  return (
    <div
      className="rounded-xl"
      style={{
        padding: "0.9rem 1rem",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        className="flex items-center justify-between mb-2"
        style={{ gap: "0.75rem" }}
      >
        <div className="text-xs" style={{ color: "#d1d5db" }}>
          r/{item.subreddit}
        </div>
        <div
          className="text-xs"
          style={{
            color: "#9ca3af",
            fontFamily: "ui-monospace, Menlo, Monaco, monospace",
          }}
        >
          {formatRedditDate(item.created_utc)}
        </div>
      </div>
      <p
        className="text-sm"
        style={{ color: "#e5e7eb", lineHeight: 1.5, margin: 0 }}
      >
        {truncated}
      </p>
      {!preview && (
        <div className="mt-3">
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="text-xs"
            style={{
              textDecoration: "underline",
              textUnderlineOffset: 3,
              color: "#9ca3af",
            }}
          >
            View on Reddit →
          </a>
        </div>
      )}
    </div>
  );
}

function PaymentModal({
  currentTokens,
  onClose,
  onTopUp,
}: {
  currentTokens: number;
  onClose: () => void;
  onTopUp: (qty: number) => void;
}) {
  const packs = [
    { qty: 30, price: 19, label: "Starter" },
    { qty: 120, price: 59, label: "Operator", best: true },
    { qty: 500, price: 199, label: "Scale" },
  ];
  return (
    <Modal onClose={onClose} title="Top up actions">
      <p className="text-sm mb-2" style={{ color: "#d1d5db" }}>
        Each action = one approved post, reply, or thread join.
      </p>
      <p
        className="text-xs mb-5"
        style={{
          color: "#9ca3af",
          fontFamily: "ui-monospace, Menlo, Monaco, monospace",
        }}
      >
        Balance · <span style={{ color: "#fff" }}>{currentTokens}</span> actions
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0,1fr))",
          gap: "0.75rem",
        }}
      >
        {packs.map((p, i) => (
          <button
            key={i}
            onClick={() => onTopUp(p.qty)}
            className="rounded-xl text-left"
            style={{
              padding: "1rem",
              background: "rgba(255,255,255,0.03)",
              border: p.best
                ? "1px solid rgba(255,255,255,0.55)"
                : "1px solid rgba(255,255,255,0.12)",
              color: "inherit",
              cursor: "pointer",
              position: "relative",
            }}
          >
            {p.best && (
              <div
                style={{
                  position: "absolute",
                  top: -9,
                  right: 10,
                  fontSize: 9,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "#000",
                  background: "#fff",
                  padding: "2px 6px",
                  borderRadius: 999,
                  fontWeight: 500,
                }}
              >
                Best value
              </div>
            )}
            <div
              className="text-xs uppercase tracking-widest mb-2"
              style={{ color: "#9ca3af" }}
            >
              {p.label}
            </div>
            <div
              style={{
                fontSize: "1.6rem",
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              {p.qty}
            </div>
            <div className="text-xs mt-1" style={{ color: "#9ca3af" }}>
              actions
            </div>
            <div className="text-sm mt-3" style={{ color: "#fff" }}>
              ${p.price}
            </div>
          </button>
        ))}
      </div>
      <div
        className="mt-5 liquid-glass rounded-xl p-3 flex items-center"
        style={{ border: "1px solid rgba(255,255,255,0.1)", gap: "0.75rem" }}
      >
        <div
          style={{
            width: 36,
            height: 24,
            borderRadius: 4,
            background: "linear-gradient(135deg,#222,#000)",
            border: "1px solid rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            color: "#9ca3af",
          }}
        >
          •••• 4242
        </div>
        <div className="text-xs" style={{ flex: 1, color: "#d1d5db" }}>
          Charged to card on file.
        </div>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            color: "#9ca3af",
            fontSize: 12,
            padding: 0,
            border: "none",
            cursor: "pointer",
          }}
        >
          Change
        </button>
      </div>
      <p className="text-xs mt-3" style={{ color: "#6b7280" }}>
        Demo. No real charge.
      </p>
    </Modal>
  );
}

function SettingsModal({
  onClose,
  username,
  setUsername,
  agentId,
  setAgentId,
}: {
  onClose: () => void;
  username: string;
  setUsername: (v: string) => void;
  agentId: string;
  setAgentId: (id: string) => void;
}) {
  const [reddit, setReddit] = useState(username || "");
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const current = AGENTS.find((a) => a.id === agentId) || AGENTS[1];
  return (
    <Modal onClose={onClose} title="Settings">
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Agent */}
        <div>
          <label
            className="text-xs uppercase tracking-widest mb-2"
            style={{ display: "block", color: "#9ca3af" }}
          >
            Agent
          </label>
          <div
            className="rounded-xl flex items-center justify-between"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.12)",
              padding: "0.5rem 0.5rem 0.5rem 0.75rem",
              gap: "0.75rem",
            }}
          >
            <div
              className="flex items-center"
              style={{ gap: "0.75rem", minWidth: 0 }}
            >
              <div style={{ width: 64, flexShrink: 0 }}>
                <AgentSilhouette
                  accent={current.accent}
                  active
                  vehicle={current.vehicle}
                />
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  className="text-sm font-medium"
                  style={{ color: "#fff" }}
                >
                  {current.name}
                </div>
                <div
                  className="text-xs"
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: "#9ca3af",
                  }}
                >
                  {current.tagline}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowAgentPicker((v) => !v)}
              style={{
                background: "transparent",
                color: "#fff",
                fontSize: 13,
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 8,
                padding: "0.4rem 0.9rem",
                flexShrink: 0,
                cursor: "pointer",
              }}
            >
              {showAgentPicker ? "Done" : "Change"}
            </button>
          </div>
          {showAgentPicker && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0,1fr))",
                gap: "0.5rem",
                marginTop: "0.6rem",
              }}
            >
              {AGENTS.map((a) => {
                const sel = a.id === agentId;
                return (
                  <button
                    key={a.id}
                    onClick={() => setAgentId(a.id)}
                    style={{
                      background: sel
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(255,255,255,0.02)",
                      border: sel
                        ? "1px solid rgba(255,255,255,0.5)"
                        : "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 10,
                      padding: "0.6rem",
                      textAlign: "left",
                      color: "inherit",
                      cursor: "pointer",
                      transition: "all 160ms ease",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                    }}
                  >
                    <div style={{ width: 48, flexShrink: 0 }}>
                      <AgentSilhouette
                        accent={a.accent}
                        active={sel}
                        vehicle={a.vehicle}
                      />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        className="text-xs"
                        style={{ color: "#fff", fontWeight: 500 }}
                      >
                        {a.name}
                      </div>
                      <div
                        className="text-xs"
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          color: "#9ca3af",
                        }}
                      >
                        {a.tagline}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          <p className="text-xs mt-2" style={{ color: "#6b7280" }}>
            Switching agents changes voice on future drafts only.
          </p>
        </div>

        {/* URL attribution */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              className="text-xs uppercase tracking-widest"
              style={{ color: "#9ca3af" }}
            >
              URL attribution
            </label>
            <span
              className="text-xs"
              style={{
                color: "#9ca3af",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 999,
                padding: "2px 8px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontSize: 10,
              }}
            >
              Coming soon
            </span>
          </div>
          <div
            className="rounded-xl flex items-center"
            style={{
              padding: "0 0.25rem",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.08)",
              opacity: 0.6,
              cursor: "not-allowed",
            }}
          >
            <div
              className="px-3 text-sm"
              style={{
                borderRight: "1px solid rgba(255,255,255,0.08)",
                color: "#6b7280",
              }}
            >
              utm
            </div>
            <input
              disabled
              placeholder="utm_source=legitreach"
              style={{
                background: "transparent",
                color: "#9ca3af",
                border: "none",
                outline: "none",
                padding: "0.75rem",
                fontSize: "0.95rem",
                fontFamily: "inherit",
                width: "100%",
                cursor: "not-allowed",
              }}
            />
          </div>
          <p className="text-xs mt-2" style={{ color: "#6b7280" }}>
            Wire post-level attribution to Shopify and Stripe.
          </p>
        </div>

        {/* Reddit username */}
        <div>
          <label
            className="text-xs uppercase tracking-widest mb-2"
            style={{ display: "block", color: "#9ca3af" }}
          >
            Your Reddit username
          </label>
          <div
            className="rounded-xl flex items-center"
            style={{
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.18)",
            }}
          >
            <div
              className="px-3 text-sm"
              style={{
                borderRight: "1px solid rgba(255,255,255,0.1)",
                color: "#9ca3af",
              }}
            >
              u/
            </div>
            <input
              value={reddit}
              onChange={(e) =>
                setReddit(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))
              }
              placeholder="your_handle"
              style={{
                background: "transparent",
                color: "#fff",
                border: "none",
                outline: "none",
                padding: "0.75rem",
                fontSize: "0.95rem",
                fontFamily: "inherit",
                width: "100%",
              }}
            />
          </div>
          <p className="text-xs mt-2" style={{ color: "#6b7280" }}>
            Used to identify which account the agent drafts for.
          </p>
        </div>
      </div>

      <div className="flex justify-end mt-6" style={{ gap: "0.75rem" }}>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            color: "#d1d5db",
            fontSize: 14,
            padding: "0.5rem 1rem",
            border: "none",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => {
            setUsername(reddit.trim());
            onClose();
          }}
          className="lr-btn-nav"
        >
          Save
        </button>
      </div>
    </Modal>
  );
}
