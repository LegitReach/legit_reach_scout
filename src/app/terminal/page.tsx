"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { UserButton, SignedIn, useUser } from "@clerk/nextjs";
import { useRealtime } from "@/hooks/useRealtime";
import type { RedditPost, CuratedResult, DashboardCurateResponse } from "@/types";
import styles from "./terminal.module.css";
import LoadingScreen from "./loading-screen";
import posthog from "posthog-js";

// ─── Types ───
interface NewsArticle {
  title: string;
  source: string;
  url: string;
  snippet: string;
  timestamp: string;
}

interface TrendItem {
  keyword: string;
  interest: string;
}

interface BrandMeta {
  title: string;
  description: string;
  ogImage: string;
  domain: string;
  brandName?: string;
}

// ─── Data Source SVG Icons ───
const DSIcons = {
  Shopify: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  ),
  Analytics: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  ),
  Email: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
  ),
  Inventory: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
  ),
  Ads: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
  ),
  Payments: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
  ),
};

const DATA_SOURCES = [
  { icon: DSIcons.Shopify, name: "Shopify", desc: "Orders, products, customers", status: "coming-soon" as const },
  { icon: DSIcons.Analytics, name: "Analytics", desc: "Traffic, conversions, funnels", status: "coming-soon" as const },
  { icon: DSIcons.Email, name: "Email / SMS", desc: "Klaviyo, Omnisend, Postscript", status: "coming-soon" as const },
  { icon: DSIcons.Inventory, name: "Inventory", desc: "Stock levels, reorder alerts", status: "coming-soon" as const },
  { icon: DSIcons.Ads, name: "Ad Platforms", desc: "Meta Ads, Google Ads, TikTok", status: "coming-soon" as const },
  { icon: DSIcons.Payments, name: "Payments", desc: "Stripe, PayPal, revenue data", status: "coming-soon" as const },
];

export default function TerminalPage() {
  const router = useRouter();
  const {
    onboarding,
    updateOnboarding,
    isAppLoaded,
    cachedDashboardPosts,
    cachedDashboardCurated,
    cachedDashboardSummary,
    cachedDashboardMeta,
    setDashboardCache,
    activeDashboardJob,
    setDashboardJob,
  } = useApp();

  // ─── State ───
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [curatedResults, setCuratedResults] = useState<CuratedResult[]>([]);
  const [redditLoading, setRedditLoading] = useState(true);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [brandMeta, setBrandMeta] = useState<BrandMeta | null>(null);
  const [newsLoading, setNewsLoading] = useState(true);
  const [clock, setClock] = useState("");
  const [terminalReady, setTerminalReady] = useState(false);
  const [credits, setCredits] = useState<{ credits: number; freeRequestsLeft: number; totalRemaining: number } | null>(null);
  const { user } = useUser();

  // Mobile menu/list states
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAllNewsMobile, setShowAllNewsMobile] = useState(false);
  const [showAllRedditMobile, setShowAllRedditMobile] = useState(false);
  const [scoutingProgress, setScoutingProgress] = useState(0);

  // ─── exact Loading Escelation for Scouting ───
  useEffect(() => {
    if (redditLoading) {
      const start = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - start;
        setScoutingProgress((prev) => {
          if (elapsed <= 10000) {
            // 0 to 90 over 10 seconds
            return Math.floor((elapsed / 10000) * 90);
          } else {
            // After 10s, +1% every 2s
            const extraTime = elapsed - 10000;
            const newProgress = 90 + Math.floor(extraTime / 2000);
            return newProgress < 99 ? newProgress : 99;
          }
        });
      }, 200);
      return () => clearInterval(interval);
    } else {
      setScoutingProgress(100);
    }
  }, [redditLoading]);

  // ─── Redirect if not onboarded ───
  useEffect(() => {
    if (isAppLoaded && !onboarding.completed) {
      router.push("/onboarding");
    }
  }, [isAppLoaded, onboarding.completed, router]);

  // ─── Clock ───
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }) +
          " " +
          now.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // ─── Fetch Credits ───
  useEffect(() => {
    async function fetchCredits() {
      try {
        const res = await fetch("/api/user/credits");
        if (res.ok) {
          const data = await res.json();
          setCredits(data);
        }
      } catch {}
    }
    fetchCredits();
  }, []);

  // ─── Rescan URL (Settings) ───
  const handleRescan = async () => {
    const newUrl = window.prompt("Enter new e-commerce URL to scan (e.g. houseofrui.com):");
    if (!newUrl || !newUrl.trim()) return;

    const urlToScan = newUrl.trim();
    setTerminalReady(false); // Show loading screen

    try {
      const res = await fetch("/api/onboarding/magic-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlToScan }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429 && data.redirectTo) {
          window.location.href = data.redirectTo + "?returnUrl=/terminal";
          return;
        }
        throw new Error(data.error || "Failed to scan store");
      }

      updateOnboarding({
        keywords: data.keywords || [],
        selectedCommunities: data.subreddits || [],
        oneMinuteBusinessPitch: data.businessDescription || "",
        completed: true,
      });

      localStorage.setItem("lr_pending_scan_url", urlToScan);
      posthog.capture("terminal_rescan", { url: urlToScan });

      // Clean cache so we get fresh Reddit posts
      window.location.reload();
    } catch (error) {
      console.error("Rescan failed:", error);
      alert(error instanceof Error ? error.message : "Failed to scan the URL. Please try again.");
      setTerminalReady(true);
    }
  };

  // ─── Reddit Data (reuse existing logic) ───
  const keywords = onboarding.keywords || [];
  const subreddits = [...(onboarding.selectedCommunities || [])];
  const keywordsParam = useMemo(() => keywords.join(","), [keywords.join(",")]);
  const signature = JSON.stringify([subreddits.sort().join(","), keywordsParam]);
  const currentJobId =
    activeDashboardJob?.signature === signature
      ? activeDashboardJob.jobId
      : null;

  // Realtime hook for Reddit
  useRealtime({
    enabled: !!currentJobId,
    channels: [`curate_${currentJobId}`],
    events: ["curation.update.data"],
    onData: ({ data }: any) => {
      if (data.status === "completed") {
        const finalData = data.data;
        setPosts(finalData.posts || []);
        setCuratedResults(finalData.curated_posts || []);
        setRedditLoading(false);
        setDashboardJob(null);
        setDashboardCache(
          finalData.posts,
          signature,
          finalData.curated_posts,
          finalData.summary
        );
      }
    },
  });

  // Fetch Reddit data
  useEffect(() => {
    if (subreddits.length === 0) {
      setRedditLoading(false);
      return;
    }

    // Check browser cache
    const CACHE_TTL = 1000 * 60 * 60 * 24;
    if (
      cachedDashboardMeta &&
      cachedDashboardMeta.signature === signature &&
      Date.now() - cachedDashboardMeta.ts < CACHE_TTL
    ) {
      setPosts(cachedDashboardPosts as RedditPost[]);
      setCuratedResults(cachedDashboardCurated as CuratedResult[]);
      setRedditLoading(false);
      return;
    }

    if (activeDashboardJob && activeDashboardJob.signature === signature) {
      setRedditLoading(true);
      return;
    }

    const controller = new AbortController();

    async function fetchReddit() {
      setRedditLoading(true);
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
          const data = await res.json();
          setDashboardJob({ jobId: data.jobId, signature });
          return;
        }

        if (!res.ok) {
          setRedditLoading(false);
          return;
        }

        const data: DashboardCurateResponse = await res.json();
        setPosts(data.posts);
        setCuratedResults(data.curated_posts);
        setRedditLoading(false);
        setDashboardCache(data.posts, signature, data.curated_posts, data.summary);
      } catch (error: unknown) {
        if ((error as { name?: string }).name === "AbortError") return;
        console.error("Terminal Reddit fetch error:", error);
        setRedditLoading(false);
      }
    }

    fetchReddit();
    return () => controller.abort();
  }, [signature]);

  // ─── Newsletter Data ───
  useEffect(() => {
    if (!onboarding.completed) return;

    // Try to get the stored URL
    const storedUrl =
      typeof window !== "undefined"
        ? localStorage.getItem("lr_pending_scan_url") || ""
        : "";

    // If no URL available, use brand name from keywords
    const brandQuery = storedUrl || onboarding.oneMinuteBusinessPitch || keywords.join(" ");
    if (!brandQuery) {
      setNewsLoading(false);
      return;
    }

    async function fetchNewsletter() {
      setNewsLoading(true);
      try {
        const res = await fetch("/api/newsletter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: storedUrl || "https://google.com",
            brandName: keywords[0] || "",
          }),
        });

        if (!res.ok) {
          setNewsLoading(false);
          return;
        }

        const data = await res.json();
        setNewsArticles(data.articles || []);
        setTrends(data.trends || []);
        setBrandMeta(data.brandMeta || null);
        setNewsLoading(false);
      } catch (err) {
        console.error("Newsletter fetch error:", err);
        setNewsLoading(false);
      }
    }

    fetchNewsletter();
  }, [onboarding.completed]);

  // ─── Determine if terminal is ready ───
  useEffect(() => {
    // Terminal is ready when at least one data source is loaded
    if (!redditLoading || !newsLoading) {
      // Small delay for smooth transition
      const timer = setTimeout(() => setTerminalReady(true), 600);
      return () => clearTimeout(timer);
    }
  }, [redditLoading, newsLoading]);

  // ─── Top 2 Reddit Opportunities ───
  const topOpportunities = useMemo<RedditPost[]>(() => {
    if (posts.length === 0) return [];

    // If no curated results yet, show all raw posts by score
    if (curatedResults.length === 0) {
      return [...posts]
        .sort((a, b) => (b.score || 0) - (a.score || 0));
    }

    const scoreMap = new Map(
      curatedResults
        .filter((c) => c.recommended_action !== "skip")
        .map((c) => [c.id, c])
    );

    const curated = posts
      .filter((p) => scoreMap.has(p.id))
      .map((p) => {
        const ai = scoreMap.get(p.id)!;
        return {
          ...p,
          relevance_score: ai.ai_relevance_score,
          opportunity_type: `${ai.recommended_action === "engage" ? "🔥" : "👀"} AI ${ai.ai_opportunity_score}`,
        };
      })
      .sort((a, b) => {
        const aiA = scoreMap.get(a.id)!;
        const aiB = scoreMap.get(b.id)!;
        return aiB.ai_opportunity_score - aiA.ai_opportunity_score;
      })
    // Fallback: if all curated posts were "skip", still show all raw posts
    if (curated.length === 0) {
      return [...posts]
        .sort((a, b) => (b.score || 0) - (a.score || 0));
    }

    return curated;
  }, [posts, curatedResults]);

  // ─── Loading Screen ───
  if (!isAppLoaded || !onboarding.completed) return null;

  if (!terminalReady) {
    return (
      <LoadingScreen
        redditLoading={redditLoading}
        newsLoading={newsLoading}
        brandName={brandMeta?.brandName || keywords[0] || "your brand"}
      />
    );
  }

  // ─── Format time ───
  const formatNewsTime = (timestamp: string) => {
    if (!timestamp) return "";
    try {
      const d = new Date(timestamp);
      const hours = Math.floor((Date.now() - d.getTime()) / 3600000);
      if (hours < 1) return "just now";
      if (hours < 24) return `${hours}h ago`;
      return `${Math.floor(hours / 24)}d ago`;
    } catch {
      return "";
    }
  };

  // ═══════════════════════════════════════════
  // RENDER: Bloomberg Terminal
  // ═══════════════════════════════════════════
  return (
    <div className={styles.terminalPage}>
      {/* ── Top Bar ── */}
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <button 
            className={styles.mobileMenuBtn} 
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <span className={styles.terminalLogo}>LegitReach</span>
          <span className={styles.terminalBadge}>EMS Terminal</span>
        </div>

        <div className={styles.topBarCenter}>
          <div className={styles.brandPill}>
            <span className="dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'blink 2s ease infinite' }}></span>
            <span>{brandMeta?.brandName || brandMeta?.domain || keywords[0] || "Brand"}</span>
          </div>
        </div>

        <div className={styles.topBarRight}>
          <span className={styles.clock}>{clock}</span>
        </div>
      </div>

      {/* ── Left Panel: Data Sources ── */}
      <div className={`${styles.panelLeft} ${isMobileMenuOpen ? styles.mobileOpen : ""}`}>
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>Data Sources</span>
          <div className={styles.panelHeaderActions}>
            <span className={styles.panelSubtitle}>INTEGRATIONS</span>
            <button className={styles.mobileCloseBtn} onClick={() => setIsMobileMenuOpen(false)}>×</button>
          </div>
        </div>
        <div className={styles.dataSourceList}>
          {DATA_SOURCES.map((ds) => (
            <div key={ds.name} className={styles.dataSourceItem}>
              <div className={styles.dsIcon}><ds.icon /></div>
              <div className={styles.dsInfo}>
                <div className={styles.dsName}>{ds.name}</div>
                <div className={styles.dsDesc}>{ds.desc}</div>
              </div>
              <span className={`${styles.dsBadge} ${styles.comingSoon}`}>
                Soon
              </span>
            </div>
          ))}
        </div>
        <div className={styles.panelFooter}>
          <button className={styles.settingsBtn} onClick={handleRescan}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            Settings (Rescan URL)
          </button>
          <SignedIn>
            <div className={styles.userRow}>
              <UserButton appearance={{ elements: { avatarBox: { width: 28, height: 28 } } }} />
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user?.firstName || "Account"}</span>
                <span className={styles.creditsText}>
                  {credits ? `${credits.totalRemaining} credits left` : "Loading..."}
                </span>
              </div>
            </div>
          </SignedIn>
        </div>
      </div>

      {/* ── Center Panel: Newsletter ── */}
      <div className={styles.panelCenter}>
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>Brand Intelligence</span>
          <span className={styles.panelSubtitle}>LAST 24H</span>
        </div>

        {newsLoading ? (
          <div className={styles.newsLoading}>
            <div className={styles.loadingDots}>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className={styles.loadingText}>Scanning sources...</span>
          </div>
        ) : newsArticles.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyTitle}>No articles found</div>
            <div className={styles.emptyDesc}>
              We&apos;ll keep scanning for brand mentions and industry news.
            </div>
          </div>
        ) : (
          <>
            <div className={`${styles.newsletterFeed} ${showAllNewsMobile ? styles.expanded : ""}`}>
              {newsArticles.map((article, i) => (
                <div key={i} className={styles.newsCard}>
                  <div className={styles.newsCardHeader}>
                    <span className={styles.newsSource}>{article.source}</span>
                    <span className={styles.newsTime}>
                      {formatNewsTime(article.timestamp)}
                    </span>
                  </div>
                  <div className={styles.newsTitle}>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {article.title}
                    </a>
                  </div>
                  {article.snippet && (
                    <div className={styles.newsSnippet}>{article.snippet}</div>
                  )}
                </div>
              ))}
            </div>
            
            {newsArticles.length > 2 && (
              <button 
                className={styles.mobileShowMore} 
                onClick={() => setShowAllNewsMobile(!showAllNewsMobile)}
              >
                {showAllNewsMobile ? "Show Less" : `Show More (${newsArticles.length - 2} hidden)`}
              </button>
            )}

            {/* Trends */}
            {trends.length > 0 && (
              <div className={styles.trendsSection}>
                <div className={styles.panelHeader} style={{ padding: "0 0 8px 0", borderBottom: "none" }}>
                  <span className={styles.panelTitle}>Trending</span>
                  <span className={styles.panelSubtitle}>GOOGLE TRENDS</span>
                </div>
                <div className={styles.trendsList}>
                  {trends.map((trend, i) => (
                    <div key={i} className={styles.trendTag}>
                      <span>{trend.keyword}</span>
                      <span className={styles.trendTraffic}>
                        {trend.interest}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Right Panel: Agents ── */}
      <div className={styles.panelRight}>
        {/* Reddit Agent Section */}
        <div className={styles.agentSection}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>🔴 Reddit Agent</span>
            <span className={styles.panelSubtitle}>
              {redditLoading ? "SCANNING" : "ACTIVE"}
            </span>
          </div>

          {redditLoading ? (
            <div className={styles.newsLoading}>
              <div className={styles.loadingDots}>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className={styles.loadingText} style={{ color: '#4ade80' }}>
                Scouting opportunities... {scoutingProgress}%
              </span>
            </div>
          ) : topOpportunities.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyTitle}>No opportunities yet</div>
              <div className={styles.emptyDesc}>
                Agent is monitoring your target communities.
              </div>
            </div>
          ) : (
            <>
              <div className={`${styles.redditMiniList} ${showAllRedditMobile ? styles.expanded : ""}`}>
                {topOpportunities.map((post) => (
                  <div
                    key={post.id}
                    className={styles.redditMiniCard}
                    onClick={() => {
                      posthog.capture("terminal_reddit_card_clicked", {
                        post_id: post.id,
                      });
                      sessionStorage.setItem(
                        `reddit_post_${post.id}`,
                        JSON.stringify(post)
                      );
                      router.push(`/dashboard/post?id=${post.id}`);
                    }}
                  >
                    <div className={styles.miniCardHeader}>
                      <span className={styles.miniSubreddit}>
                        {post.subreddit}
                      </span>
                      {post.relevance_score && (
                        <span className={styles.miniScore}>
                          {post.relevance_score}%
                        </span>
                      )}
                    </div>
                    <div className={styles.miniTitle}>{post.title}</div>
                    <div className={styles.miniMeta}>
                      {post.score} pts · {post.num_comments} comments
                      {post.opportunity_type && ` · ${post.opportunity_type}`}
                    </div>
                  </div>
                ))}
              </div>

              {topOpportunities.length > 2 && (
                <button 
                  className={styles.mobileShowMore} 
                  onClick={() => setShowAllRedditMobile(!showAllRedditMobile)}
                >
                  {showAllRedditMobile ? "Show Less" : `Show More (${topOpportunities.length - 2} hidden)`}
                </button>
              )}

              <div className={styles.agentActions}>
                <Link
                  href={
                    topOpportunities[0]
                      ? `/dashboard/post?id=${topOpportunities[0].id}`
                      : "/dashboard"
                  }
                  className={styles.invokeBtn}
                  onClick={() => {
                    if (topOpportunities[0]) {
                      sessionStorage.setItem(
                        `reddit_post_${topOpportunities[0].id}`,
                        JSON.stringify(topOpportunities[0])
                      );
                    }
                    posthog.capture("terminal_invoke_reddit_agent");
                  }}
                >
                  ⚡ Invoke Agent
                </Link>
                <Link href="/dashboard" className={styles.showMoreBtn}>
                  Show All Opportunities →
                </Link>
              </div>
            </>
          )}
        </div>

        {/* X Agent Section (Coming Soon) */}
        <div className={styles.agentSectionBottom}>
          <div className={styles.panelHeader} style={{ padding: "0 0 8px 0", borderBottom: "none" }}>
            <span className={styles.panelTitle}>𝕏 Agent</span>
            <span className={`${styles.dsBadge} ${styles.comingSoon}`}>
              Soon
            </span>
          </div>
          <div className={styles.comingSoonAgent}>
            <div className={styles.comingSoonIcon}>𝕏</div>
            <div className={styles.comingSoonTitle}>X / Twitter Agent</div>
            <div className={styles.comingSoonDesc}>
              Automated engagement, trend monitoring, and audience growth on X. Coming soon.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
