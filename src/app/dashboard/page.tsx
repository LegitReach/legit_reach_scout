"use client";

import { useState, useEffect, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import styles from "./dashboard.module.css";
import RedditList from "@/components/RedditList";
import type { RedditPost, CuratedResult, CurateResponse } from "@/types";
import posthog from "posthog-js";

const DASHBOARD_CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

export default function DashboardPage() {
  const {
    onboarding,
    cachedDashboardPosts,
    cachedDashboardCurated,
    cachedDashboardSummary,
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
      const cachedPosts = cachedDashboardPosts as RedditPost[];
      setPosts(cachedPosts);

      // Load cached curation results if they exist
      if (cachedDashboardCurated && cachedDashboardCurated.length > 0) {
        setCuratedResults(cachedDashboardCurated);
        setCurateSummary(cachedDashboardSummary || "");
        setLoading(false);
      } else {
        // If we have posts but no curation, trigger it
        setLoading(false);
        if (cachedPosts.length > 0) {
          handleCurateWithAI(cachedPosts);
        }
      }
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

        // Curation results will be set and cached once handleCurateWithAI finishes
        if (combined.length > 0) {
          handleCurateWithAI(combined);
        } else {
          try {
            setDashboardCache(combined, signature);
          } catch { /* ignore */ }
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
    if (curatedResults.length === 0) return [];

    // Create a map for fast lookup, filtering out "skip" results since we only want curated opportunities
    const scoreMap = new Map(
      curatedResults
        .filter(c => c.recommended_action !== "skip")
        .map((c) => [c.id, c])
    );

    return posts
      .filter((p) => scoreMap.has(p.id))
      .map((p) => {
        const ai = scoreMap.get(p.id)!;
        return {
          ...p,
          relevance_score: ai.ai_relevance_score,
          opportunity_type: `${ai.recommended_action === "engage" ? "🔥" : "👀"} ${ai.recommended_action} · AI score ${ai.ai_opportunity_score}`,
        };
      })
      .sort((a, b) => {
        // Sort primarily by opportunity score, then relevance
        const aiA = scoreMap.get(a.id)!;
        const aiB = scoreMap.get(b.id)!;
        if (aiB.ai_opportunity_score !== aiA.ai_opportunity_score) {
          return aiB.ai_opportunity_score - aiA.ai_opportunity_score;
        }
        return aiB.ai_relevance_score - aiA.ai_relevance_score;
      });
  }, [posts, curatedResults]);

  const visiblePosts = curatedPosts.filter(
    (p) => !respondedPosts.includes(p.id),
  );

  const handleCurateWithAI = async (postsToCurate?: RedditPost[]) => {
    const targetPosts = postsToCurate || posts;
    if (targetPosts.length === 0) {
      setCurating(false);
      return;
    }

    setCurating(true);
    try {
      const res = await fetch("/api/ai/curate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posts: targetPosts,
          keywords,
          businessDescription: onboarding.oneMinuteBusinessPitch || "",
        }),
      });
      if (res.redirected) {
        window.location.href = res.url;
        return;
      }
      if (!res.ok) {
        let err;
        try {
          err = await res.json();
        } catch {
          const text = await res.text().catch(() => "Empty body");
          err = { error: `Server error: ${res.status} ${res.statusText}`, detail: text };
        }
        console.error("Curate error:", err);
        return;
      }

      let data: CurateResponse;
      try {
        data = await res.json();
      } catch (e) {
        const text = await res.text().catch(() => "Empty body");
        console.error("Failed to parse AI response as JSON:", e, "Raw body:", text);
        return;
      }

      posthog.capture("ai_curation_completed", { curated_post_count: data.curated_posts.length });
      setCuratedResults(data.curated_posts);
      setCurateSummary(data.summary);

      // Update cache with curated results
      try {
        setDashboardCache(targetPosts, signature, data.curated_posts, data.summary);
      } catch { /* ignore */ }
    } catch (err) {
      console.error("Failed to curate posts:", err);
      posthog.captureException(err);
    } finally {
      setCurating(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1>✨ AI Opportunities</h1>
          <p>Hand-picked leads vetted for your business by LegitReach AI</p>
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
          <span className={styles.statLabel}>Vetted Leads</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNumber}>{respondedPosts.length}</span>
          <span className={styles.statLabel}>Handled</span>
        </div>
      </div>

      {/* Community Tags Row */}
      <div className={styles.tabsRow}>
        <div className={styles.communityInfo}>
          {subreddits.map((sub) => (
            <span key={sub} className={styles.communityTag}>
              {sub}
            </span>
          ))}
        </div>
      </div>

      {/* AI Summary banner */}
      {curatedResults.length > 0 && curateSummary && !curating && !loading && (
        <div className={styles.aiSummary}>
          <span>🤖</span>
          <p>{curateSummary}</p>
        </div>
      )}

      {/* Posts Feed */}
      <div className={styles.feed}>
        {loading || curating ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Your AI agent is scanning Reddit right now. First insights usually show up within a few hours. We will notify you when they are ready.</p>
          </div>
        ) : curatedPosts.length === 0 ? (
          // No posts made it past the AI filter
          <div className={styles.empty}>
            <p>🤖 AI found no high-priority leads right now.</p>
            <p className={styles.emptyHint}>
              We scanned all communities but didn&apos;t find any posts that warrant immediate action.
            </p>
          </div>
        ) : visiblePosts.length === 0 ? (
          // All curated posts have been responded to
          <div className={styles.empty}>
            <p>🎉 All caught up! You&apos;ve handled all leads.</p>
            <p className={styles.emptyHint}>
              Check back soon or try adding more keywords.
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
