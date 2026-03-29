"use client";

import { useState, useEffect, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import styles from "./dashboard.module.css";
import RedditList from "@/components/RedditList";
import type { RedditPost, CuratedResult, DashboardCurateResponse } from "@/types";
import posthog from "posthog-js";
import { useRealtime } from "@/hooks/useRealtime";

export default function DashboardPage() {
  const {
    onboarding,
    cachedDashboardPosts,
    cachedDashboardCurated,
    cachedDashboardSummary,
    cachedDashboardMeta,
    setDashboardCache,
    activeDashboardJob,
    setDashboardJob
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

  // GLOBAL JOB SYNC: Check if there's an active background job for this configuration
  const currentJobId = activeDashboardJob?.signature === signature ? activeDashboardJob.jobId : null;

  // --- REAL-TIME INTEGRATION ---
  useRealtime({
    enabled: !!currentJobId,
    channels: [`curate_${currentJobId}`],
    events: ["curation.update.data"],
    onData: ({ data }: any) => {
      if (data.status === "completed") {
        const finalData = data.data;
        setPosts(finalData.posts || []);
        setCuratedResults(finalData.curated_posts || []);
        setCurateSummary(finalData.summary || "");
        setCurating(false);
        setLoading(false);
        setDashboardJob(null); // Clear global job state

        // Persist to browser cache
        setDashboardCache(finalData.posts, signature, finalData.curated_posts, finalData.summary);

        posthog.capture("dashboard_curation_push_received", {
          total_found: finalData.posts.length,
          total_curated: finalData.curated_posts.length
        });
      }
    }
  });

  // Fetch posts and curation for ALL communities in one go
  useEffect(() => {
    if (subreddits.length === 0) {
      setLoading(false);
      return;
    }

    // --- BROWSER CACHE CHECK ---
    const DASHBOARD_CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours
    if (
      cachedDashboardMeta &&
      cachedDashboardMeta.signature === signature &&
      Date.now() - cachedDashboardMeta.ts < DASHBOARD_CACHE_TTL
    ) {
      setPosts(cachedDashboardPosts as RedditPost[]);
      setCuratedResults(cachedDashboardCurated as CuratedResult[]);
      setCurateSummary(cachedDashboardSummary);
      setLoading(false);
      setCurating(false);
      return;
    }

    // --- ACTIVE JOB CHECK ---
    // If we already have a job in progress for this exact configuration, just wait for the hook.
    if (activeDashboardJob && activeDashboardJob.signature === signature) {
      setLoading(true);
      setCurating(true);
      return;
    }

    const controller = new AbortController();

    async function fetchEverything() {
      setLoading(true);
      setCurating(true);
      try {
        const res = await fetch("/api/dashboard/curate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subreddits,
            keywords,
            businessDescription: onboarding.oneMinuteBusinessPitch || "",
          }),
          signal: controller.signal,
        });

        if (res.redirected) {
          window.location.href = res.url;
          return;
        }

        if (res.status === 202) {
          // WORKER STARTED: Store in global context to survive page transitions
          const data = await res.json();
          console.log("[Dashboard] Job started successfully, jobId:", data.jobId);
          setDashboardJob({ jobId: data.jobId, signature });
          return;
        }

        if (!res.ok) {
          console.error("Dashboard curate failed:", res.status);
          setLoading(false);
          setCurating(false);
          return;
        }

        const data: DashboardCurateResponse = await res.json();

        setPosts(data.posts);
        setCuratedResults(data.curated_posts);
        setCurateSummary(data.summary);
        setLoading(false);
        setCurating(false);

        // Update browser-side cache
        setDashboardCache(data.posts, signature, data.curated_posts, data.summary);

        posthog.capture("dashboard_curation_v2_completed", {
          total_found: data.posts.length,
          total_curated: data.curated_posts.length,
          from_redis: !!data.fromCache
        });

      } catch (error: unknown) {
        if ((error as { name?: string }).name === "AbortError") return;
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        // Handled by hook if 202 received
      }
    }

    fetchEverything();
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
            <p>
              {currentJobId
                ? "Your AI agent is scanning Reddit right now. This usually takes 20-30 seconds. Results will appear here instantly."
                : "Preparing your lead generation workspace..."}
            </p>
          </div>
        ) : curatedResults.length === 0 ? (
          <div className={styles.empty}>
            <p>🤖 AI found no high-priority leads right now.</p>
            <p className={styles.emptyHint}>
              We scanned all communities but didn&apos;t find any posts that warrant immediate action.
            </p>
          </div>
        ) : visiblePosts.length === 0 ? (
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
