"use client";

import { useState, useEffect, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import styles from "./dashboard.module.css";
import RedditList from "@/components/RedditList";
import type { RedditPost, CuratedResult, CurateResponse } from "@/types";

const DASHBOARD_CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

export default function DashboardPage() {
  const {
    onboarding,
    cachedDashboardPosts,
    cachedDashboardMeta,
    setDashboardCache,
  } = useApp();
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondedPosts, setRespondedPosts] = useState<string[]>([]);

  // AI curation state
  const [curatedResults, setCuratedResults] = useState<CuratedResult[]>([]);
  const [curateSummary, setCurateSummary] = useState<string>("");
  const [curating, setCurating] = useState(false);
  const [curateMode, setCurateMode] = useState(false);

  // Load responded from localStorage
  useEffect(() => {
    const responded = localStorage.getItem("legitreach_responded");
    if (responded) setRespondedPosts(JSON.parse(responded));
  }, []);

  const keywords = onboarding.keywords || [];
  const subreddits = [...(onboarding.selectedCommunities || [])];
  const keywordsParam = useMemo(
    () => keywords.join(","),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [keywords.join(",")],
  );

  // Build a stable signature for all communities combined
  const signature = JSON.stringify([subreddits.sort().join(","), keywordsParam]);

  // Fetch posts for ALL communities on first load; cache for 24 hours
  useEffect(() => {
    if (subreddits.length === 0) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    // Use cache if it exists and is still fresh
    if (
      cachedDashboardMeta &&
      cachedDashboardMeta.signature === signature &&
      Date.now() - cachedDashboardMeta.ts < DASHBOARD_CACHE_TTL
    ) {
      setPosts(cachedDashboardPosts as RedditPost[]);
      setLoading(false);
      return () => controller.abort();
    }

    async function fetchAllPosts() {
      setLoading(true);
      try {
        // Fetch from all communities in parallel
        const requests = subreddits.map((sub) =>
          fetch(
            `/api/reddit/browse?subreddit=${sub}&keywords=${encodeURIComponent(keywordsParam)}&limit=15`,
            { signal: controller.signal },
          ).then((res) => res.json()),
        );

        const results = await Promise.all(requests);

        // Combine and deduplicate by post ID
        const seenIds = new Set<string>();
        const combined: RedditPost[] = [];
        for (const data of results) {
          for (const post of data.posts || []) {
            if (!seenIds.has(post.id)) {
              seenIds.add(post.id);
              combined.push(post);
            }
          }
        }

        // Sort by most recent first
        combined.sort((a, b) => b.created_utc - a.created_utc);

        setPosts(combined);
        try {
          setDashboardCache(combined, signature);
        } catch {
          /* ignore */
        }
      } catch (error: unknown) {
        if ((error as { name?: string }).name === "AbortError") return;
        console.error("Failed to fetch posts:", error);
      }
      setLoading(false);
    }

    fetchAllPosts();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const markResponded = (postId: string) => {
    const updated = [...respondedPosts, postId];
    setRespondedPosts(updated);
    localStorage.setItem("legitreach_responded", JSON.stringify(updated));
  };

  // Merge AI scores back into posts and re-order by opportunity score
  const curatedPosts = useMemo<RedditPost[]>(() => {
    if (!curateMode || curatedResults.length === 0) return [];
    const scoreMap = new Map(curatedResults.map((c) => [c.id, c]));
    return posts
      .filter((p) => scoreMap.has(p.id))
      .map((p) => {
        const ai = scoreMap.get(p.id)!;
        return {
          ...p,
          relevance_score: ai.ai_relevance_score,
          opportunity_type: `${ai.recommended_action === "engage" ? "🔥" : ai.recommended_action === "monitor" ? "👀" : "⏭"} ${ai.recommended_action} · AI score ${ai.ai_opportunity_score}`,
        };
      })
      .sort((a, b) => (b.relevance_score ?? 0) - (a.relevance_score ?? 0));
  }, [posts, curatedResults, curateMode]);

  const displayedPosts = curateMode ? curatedPosts : posts;
  const visiblePosts = displayedPosts.filter(
    (p) => !respondedPosts.includes(p.id),
  );

  const handleCurateWithAI = async () => {
    if (posts.length === 0) return;
    setCurating(true);
    try {
      const res = await fetch("/api/ai/curate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posts,
          keywords,
          businessDescription: onboarding.oneMinuteBusinessPitch || "",
        }),
      });
      if (res.redirected) {
        window.location.href = res.url;
        return;
      }
      if (!res.ok) {
        const err = await res.json();
        console.error("Curate error:", err);
        return;
      }
      const data: CurateResponse = await res.json();
      setCuratedResults(data.curated_posts);
      setCurateSummary(data.summary);
      setCurateMode(true);
    } catch (err) {
      console.error("Failed to curate posts:", err);
    } finally {
      setCurating(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1>🔍 Opportunities</h1>
          <p>Discussions matching your keywords across all communities</p>
        </div>
        <div className={styles.keywords}>
          {keywords.map((kw) => (
            <span key={kw} className={styles.keyword}>
              {kw}
            </span>
          ))}
        </div>
      </header>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statNumber}>{visiblePosts.length}</span>
          <span className={styles.statLabel}>Opportunities</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNumber}>{respondedPosts.length}</span>
          <span className={styles.statLabel}>Responded</span>
        </div>
      </div>

      {/* AI Curate button (no subreddit tabs) */}
      <div className={styles.tabsRow}>
        <div className={styles.communityInfo}>
          {subreddits.map((sub) => (
            <span key={sub} className={styles.communityTag}>
              {sub}
            </span>
          ))}
        </div>

        <div className={styles.curateActions}>
          {curateMode && (
            <button
              onClick={() => {
                setCurateMode(false);
                setCuratedResults([]);
                setCurateSummary("");
              }}
              className={styles.curateToggleBtn}
            >
              Show All
            </button>
          )}
          <button
            onClick={handleCurateWithAI}
            disabled={curating || loading || posts.length === 0}
            className={styles.curateBtn}
          >
            {curating ? (
              <>
                <span className={styles.spinnerSm} /> Analysing…
              </>
            ) : (
              "✨ Curate with AI"
            )}
          </button>
        </div>
      </div>

      {/* AI Summary banner */}
      {curateMode && curateSummary && (
        <div className={styles.aiSummary}>
          <span>🤖</span>
          <p>{curateSummary}</p>
        </div>
      )}

      {/* Posts Feed */}
      <div className={styles.feed}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Finding opportunities…</p>
          </div>
        ) : visiblePosts.length === 0 && curateMode ? (
          <div className={styles.empty}>
            <p>🤖 AI found no high-priority opportunities right now.</p>
            <p className={styles.emptyHint}>
              Try switching to &quot;Show All&quot; to see every post.
            </p>
          </div>
        ) : visiblePosts.length === 0 ? (
          <div className={styles.empty}>
            <p>🎉 All caught up! No new opportunities.</p>
            <p className={styles.emptyHint}>
              Try adding more keywords or communities.
            </p>
          </div>
        ) : (
          <RedditList
            posts={visiblePosts}
            respondedPosts={respondedPosts}
            onDone={markResponded}
          />
        )}
      </div>
    </div>
  );
}
