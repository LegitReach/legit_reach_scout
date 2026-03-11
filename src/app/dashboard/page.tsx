"use client";

import { useState, useEffect, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import styles from "./dashboard.module.css";
import RedditList from "@/components/RedditList";
import type { RedditPost, CuratedResult, CurateResponse } from "@/types";

export default function DashboardPage() {
  const {
    onboarding,
    cachedDashboardPosts,
    cachedDashboardMeta,
    setDashboardCache,
  } = useApp();
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubreddit, setActiveSubreddit] = useState(
    onboarding.selectedCommunities?.[0] || "all",
  );
  const [savedPosts, setSavedPosts] = useState<string[]>([]);
  const [respondedPosts, setRespondedPosts] = useState<string[]>([]);

  // AI curation state
  const [curatedResults, setCuratedResults] = useState<CuratedResult[]>([]);
  const [curateSummary, setCurateSummary] = useState<string>("");
  const [curating, setCurating] = useState(false);
  const [curateMode, setCurateMode] = useState(false);

  // Load saved/responded from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("legitreach_saved");
    const responded = localStorage.getItem("legitreach_responded");
    if (saved) setSavedPosts(JSON.parse(saved));
    if (responded) setRespondedPosts(JSON.parse(responded));
  }, []);

  const keywords = onboarding.keywords || [];
  const subreddits = [...(onboarding.selectedCommunities || [])];
  const keywordsParam = useMemo(
    () => keywords.join(","),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [keywords.join(",")],
  );

  const DASHBOARD_CACHE_TTL = 1000 * 60 * 60; // 1 hour
  const signature = JSON.stringify([activeSubreddit, keywordsParam]);

  // Fetch raw posts whenever the active subreddit changes
  useEffect(() => {
    if (!activeSubreddit) return;

    // Reset curation when switching subreddits
    setCurateMode(false);
    setCuratedResults([]);
    setCurateSummary("");

    const controller = new AbortController();

    if (
      cachedDashboardMeta &&
      cachedDashboardMeta.signature === signature &&
      Date.now() - cachedDashboardMeta.ts < DASHBOARD_CACHE_TTL
    ) {
      setPosts(cachedDashboardPosts as RedditPost[]);
      setLoading(false);
      return () => controller.abort();
    }

    async function fetchPosts() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/reddit/browse?subreddit=${activeSubreddit}&keywords=${encodeURIComponent(keywordsParam)}&limit=15`,
          { signal: controller.signal },
        );
        const data = await res.json();
        const fetched: RedditPost[] = data.posts || [];
        setPosts(fetched);
        try {
          setDashboardCache(fetched, signature);
        } catch {
          /* ignore */
        }
      } catch (error: unknown) {
        if ((error as { name?: string }).name === "AbortError") return;
        console.error("Failed to fetch posts:", error);
      }
      setLoading(false);
    }

    fetchPosts();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubreddit, keywordsParam, cachedDashboardMeta?.ts]);

  const savePost = (postId: string) => {
    const updated = savedPosts.includes(postId)
      ? savedPosts.filter((id) => id !== postId)
      : [...savedPosts, postId];
    setSavedPosts(updated);
    localStorage.setItem("legitreach_saved", JSON.stringify(updated));
  };

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
          <p>Discussions matching your keywords</p>
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
          <span className={styles.statNumber}>{savedPosts.length}</span>
          <span className={styles.statLabel}>Saved</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNumber}>{respondedPosts.length}</span>
          <span className={styles.statLabel}>Responded</span>
        </div>
      </div>

      {/* Subreddit Tabs + AI Curate button */}
      <div className={styles.tabsRow}>
        <div className={styles.tabs}>
          {subreddits.map((sub) => (
            <button
              key={sub}
              onClick={() => setActiveSubreddit(sub)}
              className={`${styles.tab} ${activeSubreddit === sub ? styles.active : ""}`}
            >
              {sub}
            </button>
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
            savedPosts={savedPosts}
            respondedPosts={respondedPosts}
            onSave={savePost}
            onDone={markResponded}
          />
        )}
      </div>
    </div>
  );
}
