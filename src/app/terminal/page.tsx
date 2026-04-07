"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { UserButton, SignedIn, useUser } from "@clerk/nextjs";
import { useRealtime } from "@/hooks/useRealtime";
import type { RedditPost, CuratedResult, DashboardCurateResponse } from "@/types";
import styles from "./terminal.module.css";
import LoadingScreen from "./loading-screen";
import MetaAdsIntel, { type MetaAdsResponse } from "./MetaAdsIntel";
import type { Update } from "@/app/api/updates/route";
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
    cachedMetaAds,
    cachedMetaAdsMeta,
    setMetaAdsCache,
  } = useApp();

  // ─── State ───
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [curatedResults, setCuratedResults] = useState<CuratedResult[]>([]);
  const [redditLoading, setRedditLoading] = useState(true);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [brandMeta, setBrandMeta] = useState<BrandMeta | null>(null);
  const [newsLoading, setNewsLoading] = useState(true);
  const [metaAds, setMetaAds] = useState<MetaAdsResponse | null>(null);
  const [metaAdsLoading, setMetaAdsLoading] = useState(true);
  const [metaAdsProgress, setMetaAdsProgress] = useState(0);
  const [competitorAds, setCompetitorAds] = useState<MetaAdsResponse | null>(null);
  const [manualBrandOverride, setManualBrandOverride] = useState<string | null>(null);
  const [showAllNews, setShowAllNews] = useState(false);
  const [showAllMeta, setShowAllMeta] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [showUpdates, setShowUpdates] = useState(false);
  const [updatesUnread, setUpdatesUnread] = useState(false);
  const [clock, setClock] = useState("");
  const [terminalReady, setTerminalReady] = useState(false);
  const [credits, setCredits] = useState<{ credits: number; freeRequestsLeft: number; totalRemaining: number } | null>(null);
  const { user, isLoaded, isSignedIn } = useUser();
  const wasSignedIn = useRef(isSignedIn);

  // Mobile menu/list states
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  // ─── Meta Ads Loading Progress ───
  useEffect(() => {
    if (metaAdsLoading) {
      const start = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - start;
        setMetaAdsProgress(() => {
          if (elapsed <= 8000) return Math.floor((elapsed / 8000) * 85);
          const extra = elapsed - 8000;
          const next = 85 + Math.floor(extra / 1500);
          return next < 99 ? next : 99;
        });
      }, 200);
      return () => clearInterval(interval);
    } else {
      setMetaAdsProgress(100);
    }
  }, [metaAdsLoading]);

  useEffect(() => {
    if (isSignedIn) wasSignedIn.current = true;
  }, [isSignedIn]);

  // ─── Redirect if not onboarded ───
  useEffect(() => {
    if (isAppLoaded && !onboarding.completed) {
      if (wasSignedIn.current && !isSignedIn) {
        router.push("/");
      } else {
        router.push("/onboarding");
      }
    }
  }, [isAppLoaded, onboarding.completed, isSignedIn, router]);

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

  // ─── Mobile detection ───
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ─── Fetch Updates ───
  useEffect(() => {
    fetch("/api/updates")
      .then((r) => r.json())
      .then((data: Update[]) => {
        setUpdates(data);
        const lastSeen = localStorage.getItem("legitreach_updates_seen");
        if (data.length > 0 && lastSeen !== data[0].date) {
          setUpdatesUnread(true);
        }
      })
      .catch(() => {});
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // ─── Meta Ads fetch (triggered once brandMeta is resolved) ───
  useEffect(() => {
    if (newsLoading) return; // still waiting for brandMeta

    // Build a ranked list of company name candidates from the og:title and domain.
    //
    // Key insight: ScrapeCreators does fuzzy/contains matching on companyName.
    // Short partial queries (e.g. "House of") will match unrelated brands.
    //
    // Strategy:
    //   - Short title (≤3 meaningful words) → the whole title IS the brand name
    //     e.g. "House of Rui" → try "House of Rui", then domain slug
    //   - Long title (4+ words) → first word(s) are the brand, rest is product copy
    //     e.g. "PharmAdva MedaCube™ Automatic Pill Dispenser" → try "PharmAdva", "PharmAdva MedaCube", domain slug
    const rawTitle = brandMeta?.title ?? "";
    const titleWords = rawTitle
      .replace(/[™®©℠]/g, "")           // strip trademark symbols
      .split(/[\s,.]+/)                   // split on whitespace/comma/dot
      .map(w => w.replace(/[^a-zA-Z0-9&''-]/g, "")) // strip remaining punctuation
      .filter(w => w.length >= 2);        // drop single-char words ("a", "&" stripped → "")

    const domainSlug = (brandMeta?.domain ?? "")
      .replace(/^www\./, "")
      .split(".")[0];

    const fullTitle = titleWords.join(" "); // cleaned title without trademark chars

    const candidates =
      titleWords.length <= 3
        ? // Short title = the brand name itself — try it whole, then domain slug
          [...new Set([fullTitle, domainSlug].filter(Boolean))]
        : // Long title = first word is the brand, remainder is product/tagline
          [...new Set([
            titleWords[0],                      // e.g. "PharmAdva"
            titleWords.slice(0, 2).join(" "),   // e.g. "PharmAdva MedaCube"
            domainSlug,                         // e.g. "medacube"
          ].filter(Boolean))];

    const actualCandidates = manualBrandOverride 
      ? [manualBrandOverride] 
      : candidates;

    if (actualCandidates.length === 0) {
      setMetaAdsLoading(false);
      return;
    }

    const cacheSignature = actualCandidates.join(",");
    const CACHE_TTL = 1000 * 60 * 60 * 24;

    if (
      cachedMetaAdsMeta && 
      cachedMetaAdsMeta.signature === cacheSignature &&
      Date.now() - cachedMetaAdsMeta.ts < CACHE_TTL
    ) {
      setMetaAds(cachedMetaAds);
      setMetaAdsLoading(false);
      return;
    }

    console.log("[meta-ads] candidates →", actualCandidates);

    let cancelled = false;
    async function fetchMetaAds() {
      setMetaAdsLoading(true);
      try {
        const res = await fetch(
          `/api/meta-ads?candidates=${encodeURIComponent(actualCandidates.join(","))}`
        );
        if (res.ok) {
          const data: MetaAdsResponse = await res.json();
          if (!cancelled) {
            setMetaAds(data);
            setMetaAdsCache(data, cacheSignature);
          }
        }

      } catch (err) {
        console.error("[meta-ads] fetch error:", err);
      } finally {
        if (!cancelled) setMetaAdsLoading(false);
      }
    }
    fetchMetaAds();
    return () => { cancelled = true; };
  }, [newsLoading, brandMeta?.title, brandMeta?.domain, manualBrandOverride, setMetaAdsCache, cachedMetaAdsMeta, cachedMetaAds]);

  // ─── Competitor ads fetch — fires when brand has no active ads ───
  useEffect(() => {
    if (metaAdsLoading) return;
    if (!metaAds || (metaAds.results?.length ?? 0) > 0) return;
    if (keywords.length === 0) return;

    async function fetchCompetitorAds() {
      const candidates = keywords.slice(0, 4).join(",");
      try {
        const res = await fetch(
          `/api/meta-ads?candidates=${encodeURIComponent(candidates)}`
        );
        if (res.ok) {
          const data: MetaAdsResponse = await res.json();
          setCompetitorAds(data);
        }
      } catch (err) {
        console.error("[meta-ads] competitor fetch error:", err);
      }
    }
    fetchCompetitorAds();
  }, [metaAds, metaAdsLoading]);

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
          <button
            className={styles.updatesBtn}
            onClick={() => {
              setShowUpdates(true);
              setUpdatesUnread(false);
              if (updates.length > 0) {
                localStorage.setItem("legitreach_updates_seen", updates[0].date);
              }
            }}
            aria-label="Recent updates"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {updatesUnread && <span className={styles.updatesDot} />}
          </button>
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

      {/* ── Updates Modal ── */}
      {showUpdates && (
        <div className={styles.updatesOverlay} onClick={() => setShowUpdates(false)}>
          <div className={styles.updatesDrawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.updatesHeader}>
              <span className={styles.updatesTitle}>What&apos;s New</span>
              <button className={styles.updatesClose} onClick={() => setShowUpdates(false)}>×</button>
            </div>
            <div className={styles.updatesList}>
              {updates.length === 0 ? (
                <p className={styles.updatesEmpty}>No updates yet.</p>
              ) : updates.map((u, i) => (
                <div key={i} className={styles.updateEntry}>
                  <div className={styles.updateMeta}>
                    <span className={styles.updateDate}>{u.date}</span>
                    {u.title && <span className={styles.updateEntryTitle}>{u.title}</span>}
                  </div>
                  <ul className={styles.updateItems}>
                    {u.items.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
              <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: { width: 28, height: 28 } } }} />
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

      {/* ── Center Panel: Brand Intelligence ── */}
      <div className={styles.panelCenter}>
        {/* ── News sub-section ── */}
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>Industry News</span>
          <span className={styles.panelSubtitle}>LAST 24H</span>
        </div>

        {newsLoading ? (
          <div className={styles.newsLoading}>
            <div className={styles.loadingDots}>
              <span></span><span></span><span></span>
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
            <div className={`${styles.newsletterFeed} ${showAllNews ? styles.expanded : ""}`}>
              {(showAllNews ? newsArticles : newsArticles.slice(0, 2)).map((article, i) => (
                <div key={i} className={`${styles.newsCard}${i >= 1 && !showAllNews ? ` ${styles.newsCardMobileHide}` : ""}`}>
                  <div className={styles.newsCardHeader}>
                    <span className={styles.newsSource}>{article.source}</span>
                    <span className={styles.newsTime}>{formatNewsTime(article.timestamp)}</span>
                  </div>
                  <div className={styles.newsTitle}>
                    <a href={article.url} target="_blank" rel="noopener noreferrer">
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
                className={`${styles.readMoreBtn} ${styles.readMoreBtnDesktop}`}
                onClick={() => setShowAllNews((v) => !v)}
              >
                {showAllNews ? "Show less" : `Read more (${newsArticles.length - 2} more)`}
              </button>
            )}
            {newsArticles.length > 1 && (
              <button
                className={`${styles.readMoreBtn} ${styles.readMoreBtnMobile}`}
                onClick={() => setShowAllNews((v) => !v)}
              >
                {showAllNews ? "Show less" : `Read more (${newsArticles.length - 1} more)`}
              </button>
            )}
          </>
        )}

        {/* ── Meta Ads Intel sub-section ── */}
        <div className={styles.panelHeader} style={{ marginTop: 4 }}>
          <span className={styles.panelTitle}>Meta Ads Intel</span>
          <div className={styles.panelHeaderActions}>
            <span className={styles.panelSubtitle}>AD LIBRARY</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '11px', marginBottom: '8px', color: '#94a3b8' }}>
           Not your brand? &nbsp; 
           <button onClick={() => {
              const url = window.prompt("Enter Brand Name or Facebook Page URL (e.g. facebook.com/brand):");
              if (url) {
                 const match = url.match(/facebook\.com\/([^\/?#]+)/i);
                 const override = match ? match[1] : url.trim();
                 if (override) {
                   setManualBrandOverride(override);
                   setMetaAds(null);
                   setCompetitorAds(null);
                 }
              }
           }} style={{ color: '#4ade80', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
             Rescan
           </button>
        </div>

        {metaAdsLoading ? (
          <div className={styles.newsLoading}>
            <div className={styles.loadingDots}>
              <span></span><span></span><span></span>
            </div>
            <span className={styles.loadingText} style={{ color: "#a78bfa" }}>
              Scanning Meta Ad Library... {metaAdsProgress}%
            </span>
          </div>
        ) : metaAds && (metaAds.results?.length ?? 0) > 0 ? (
          <>
            <MetaAdsIntel data={metaAds} collapsed={isMobile && !showAllMeta} />
            <button
              className={`${styles.readMoreBtn} ${styles.readMoreBtnMobile}`}
              onClick={() => setShowAllMeta((v) => !v)}
            >
              {showAllMeta ? "Show less" : "Read more"}
            </button>
          </>
        ) : metaAds && (metaAds.results?.length ?? 0) === 0 ? (
          <>
            <MetaAdsIntel data={metaAds} competitorData={competitorAds} collapsed={isMobile && !showAllMeta} />
            <button
              className={`${styles.readMoreBtn} ${styles.readMoreBtnMobile}`}
              onClick={() => setShowAllMeta((v) => !v)}
            >
              {showAllMeta ? "Show less" : "Read more"}
            </button>
          </>
        ) : null}

        {/* ── Trends sub-section ── */}
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
                  <span className={styles.trendTraffic}>{trend.interest}</span>
                </div>
              ))}
            </div>
          </div>
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
                    "/dashboard"
                  }
                  className={styles.invokeBtn}
                  onClick={() => {
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
