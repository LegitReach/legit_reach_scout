"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { UserButton, SignedIn, useUser, SignedOut, SignInButton } from "@clerk/nextjs";
import { useRealtime } from "@/hooks/useRealtime";
import type { RedditPost, CuratedResult, DashboardCurateResponse } from "@/types";
import styles from "./terminal.module.css";
import LoadingScreen from "./loading-screen";
import type { MetaAdsResponse } from "./MetaAdsIntel";
import CompetitiveIntelPane from "./CompetitiveIntelPane";
import type { Update } from "@/app/api/updates/route";
import posthog from "posthog-js";

// ─── Daily Checklist Items ───
const DAILY_TASKS = [
  { id: "seo", name: "SEO Check", desc: "Review rankings, fix broken links", icon: "🔍" },
  { id: "geo", name: "GEO Optimize", desc: "Check local listings, update NAP", icon: "🌐" },
  { id: "community", name: "Community Engage", desc: "Reply to 3 posts in your niche", icon: "💬" },
];

const ON_DEMAND_SERVICES = [
  { id: "creatives", name: "Ad Creatives", desc: "Custom visuals in 24h", price: "$29", iconType: "palette" },
  { id: "seo", name: "SEO Blogs", desc: "Keyword-optimized articles in 24h", price: "$19", iconType: "file" },
  { id: "twitter", name: "X (Twitter) Posts", desc: "Engagement-optimized threads", price: "$19", iconType: "hash" },
];

// SVG icon components for on-demand services
const ServiceIcon = ({ type }: { type: string }) => {
  if (type === "palette") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12" r=".5" fill="currentColor"/>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
    </svg>
  );
  if (type === "file") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  );
  if (type === "hash") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>
    </svg>
  );
  return null;
};

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
  const [showAllNewsMobile, setShowAllNewsMobile] = useState(false);
  const { user, isLoaded, isSignedIn } = useUser();
  const wasSignedIn = useRef(isSignedIn);

  // Mobile menu/list states
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAllRedditMobile, setShowAllRedditMobile] = useState(false);
  const [scoutingProgress, setScoutingProgress] = useState(0);

  // Daily checklist
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});
  
  // On-demand coming soon modal
  const [comingSoonService, setComingSoonService] = useState<string | null>(null);

  // Settings modal
  const [showSettings, setShowSettings] = useState(false);
  const [settingsUrl, setSettingsUrl] = useState("");

  // Guide Popup
  const [showGuide, setShowGuide] = useState(false);

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

  // ─── Daily Checklist (reset each day) ───
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const key = `lr_checklist_${today}`;
    try {
      const stored = localStorage.getItem(key);
      if (stored) setCheckedTasks(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const toggleTask = (taskId: string) => {
    setCheckedTasks((prev) => {
      const next = { ...prev, [taskId]: !prev[taskId] };
      const today = new Date().toISOString().split("T")[0];
      try { localStorage.setItem(`lr_checklist_${today}`, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

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
  const refreshCredits = useCallback(async () => {
    try {
      const res = await fetch("/api/user/credits");
      if (res.ok) {
        const data = await res.json();
        setCredits(data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    refreshCredits();
  }, [refreshCredits]);

  // ─── Open Settings Modal ───
  const openSettings = () => {
    const storedUrl = typeof window !== "undefined" ? localStorage.getItem("lr_pending_scan_url") || "" : "";
    setSettingsUrl(storedUrl);
    setShowSettings(true);
  };

  // ─── Rescan URL (Settings) ───
  const handleRescan = async (urlToScan: string) => {
    if (!urlToScan.trim()) return;
    setShowSettings(false);
    setTerminalReady(false);

    try {
      const res = await fetch("/api/onboarding/magic-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlToScan.trim() }),
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

      localStorage.setItem("lr_pending_scan_url", urlToScan.trim());
      posthog.capture("terminal_rescan", { url: urlToScan.trim() });

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
      const timer = setTimeout(() => {
        setTerminalReady(true);
        // Check if we need to show the guide
        const hasSeenGuide = localStorage.getItem("lr_terminal_guide_seen");
        if (!hasSeenGuide) {
          setShowGuide(true);
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [redditLoading, newsLoading]);

  const dismissGuide = () => {
    localStorage.setItem("lr_terminal_guide_seen", "true");
    setShowGuide(false);
  };

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
            <span>
              {brandMeta?.brandName || 
               (brandMeta?.domain && brandMeta.domain.split('.')[0].charAt(0).toUpperCase() + brandMeta.domain.split('.')[0].slice(1)) || 
               keywords[0] || 
               "Brand"}
            </span>
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

      {/* ── Left Panel: Data Connections + Daily Tasks ── */}
      <div className={`${styles.panelLeft} ${isMobileMenuOpen ? styles.mobileOpen : ""}`}>
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>LegitReach</span>
          <div className={styles.panelHeaderActions}>
            <button className={styles.mobileCloseBtn} onClick={() => setIsMobileMenuOpen(false)}>×</button>
          </div>
        </div>

        {/* Data Connections */}
        <div className={styles.dataSourceList}>
          <div style={{ padding: '8px 12px 4px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#555' }}>Data Connections</div>
          <div className={styles.dataSourceItem}>
            <div className={styles.dsIcon}><DSIcons.Ads /></div>
            <div className={styles.dsInfo}>
              <div className={styles.dsName}>Meta Ads</div>
              <div className={styles.dsDesc}>Connect your Meta ad account</div>
            </div>
            <span className={`${styles.dsBadge} ${styles.comingSoon}`}>Coming Soon</span>
          </div>
          <div className={styles.dataSourceItem}>
            <div className={styles.dsIcon} style={{ color: '#4285f4' }}><DSIcons.Analytics /></div>
            <div className={styles.dsInfo}>
              <div className={styles.dsName}>Google Ads</div>
              <div className={styles.dsDesc}>Connect your Google ad account</div>
            </div>
            <span className={`${styles.dsBadge} ${styles.comingSoon}`}>Coming Soon</span>
          </div>
        </div>

        {/* Perks */}
        <div className={styles.dailyChecklist} style={{ paddingBottom: '0' }}>
           <div className={styles.checklistTitle} style={{ color: '#ff4500' }}>Perks</div>
           <a href="https://www.business.reddit.com/pro" target="_blank" rel="noreferrer" className={styles.dataSourceItem} style={{ textDecoration: 'none', background: 'rgba(255, 69, 0, 0.05)', borderColor: 'rgba(255, 69, 0, 0.2)' }}>
              <div className={styles.dsIcon} style={{ color: '#ff4500' }}>
               <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M22 11.5c0-1.38-1.12-2.5-2.5-2.5-.66 0-1.26.26-1.72.69-.1-.06-.21-.11-.32-.16l-3.23.6-1.57-7.39c-.06-.29.13-.56.42-.62l4.63-1 .28 1.34c.03.15.17.26.32.26h.02c.18 0 .32-.15.32-.33V.94c0-.18-.15-.32-.32-.32h-.05c-.32.01-.6.23-.66.55l-5.11 1.09c-.11.02-.21.09-.27.18-.06.1-.08.21-.06.32l1.69 7.97c-.12.06-.23.13-.34.2-2.85-1.59-6.3-1.59-9.15 0-.11-.07-.22-.14-.34-.2l1.69-7.97c.02-.11 0-.22-.06-.32-.06-.09-.16-.16-.27-.18l-5.11-1.09c-.06-.32-.34-.54-.66-.55h-.05c-.17 0-.32.14-.32.32v1.17c0 .18.14.33.32.33h.02c.15 0 .29-.11.32-.26l.28-1.34 4.63 1c.29.06.48.33.42.62l-1.57 7.39c-.11.05-.22.1-.32.16-.46-.43-1.06-.69-1.72-.69C1.12 9 0 10.12 0 11.5c0 1 .59 1.86 1.45 2.25-.03.16-.05.32-.05.47 0 3.73 4.74 6.75 10.6 6.75s10.6-3.02 10.6-6.75c0-.15-.02-.31-.05-.47.86-.39 1.45-1.25 1.45-2.25zm-20.89 0c0-.77.62-1.39 1.39-1.39.39 0 .74.16.99.42-.81.65-1.46 1.46-1.9 2.37-.29-.39-.48-.87-.48-1.4zm6.65 6.13c-1.36.03-2.61-.39-3.6-1.12-.15-.11-.18-.32-.07-.47.11-.15.32-.18.47-.07.85.63 1.95.99 3.16.96 1.37-.02 2.62-.48 3.55-1.24.13-.11.33-.08.44.05.11.13.08.33-.05.44-1.07.88-2.49 1.43-3.9 1.45zm-2.02-3.13c-.63 0-1.14-.51-1.14-1.14 0-.63.51-1.14 1.14-1.14.63 0 1.14.51 1.14 1.14 0 .63-.51 1.14-1.14 1.14zm7.44 0c-.63 0-1.14-.51-1.14-1.14 0-.63.51-1.14 1.14-1.14.63 0 1.14.51 1.14 1.14 0 .63-.51 1.14-1.14 1.14zm4.27-2.64c-.44-.91-1.09-1.72-1.9-2.37.25-.26.6-.42.99-.42.77 0 1.39.62 1.39 1.39 0 .53-.19 1.01-.48 1.4z"/></svg>
              </div>
              <div className={styles.dsInfo}>
                <div className={styles.dsName} style={{ color: '#fff' }}>Get Reddit Pro</div>
                <div className={styles.dsDesc}>Claim your free perk & setup ads</div>
              </div>
              <span className={styles.dsBadge} style={{ background: '#ff4500', color: '#fff', border: 'none' }}>Free</span>
           </a>
        </div>

        {/* Daily Brand Tasks */}
        <div className={styles.dailyChecklist}>
          <div className={styles.checklistTitle}>Daily Brand Tasks</div>
          <div className={styles.checklistSubtext}>Complete daily tasks to boost brand presence</div>
          {DAILY_TASKS.map((task) => (
            <div
              key={task.id}
              className={`${styles.checklistItem} ${checkedTasks[task.id] ? styles.completed : ""}`}
              onClick={() => toggleTask(task.id)}
            >
              <div className={`${styles.checklistCheck} ${checkedTasks[task.id] ? styles.checked : ""}`}>
                {checkedTasks[task.id] ? "✓" : ""}
              </div>
              <div className={styles.checklistItemInfo}>
                <div className={styles.checklistItemName}>{task.name}</div>
                <div className={styles.checklistItemDesc}>{task.desc}</div>
              </div>
              <span className={styles.checklistItemIcon}>{task.icon}</span>
            </div>
          ))}
        </div>

        <div className={styles.panelFooter}>
          <button className={styles.settingsBtn} onClick={openSettings}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            Settings
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

          <SignedOut>
            <div className={styles.userRow}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold', flexShrink: 0 }}>G</div>
              <div className={styles.userInfo}>
                {credits?.totalRemaining === 0 ? (
                  <SignInButton mode="modal">
                     <button style={{ background: 'transparent', border: 'none', color: '#4ade80', fontSize: '11px', cursor: 'pointer', padding: 0, textDecoration: 'underline', textAlign: 'left' }}>
                       Sign in for 3 free credits
                     </button>
                  </SignInButton>
                ) : (
                  <>
                    <span className={styles.userName}>Guest</span>
                    <span className={styles.creditsText}>
                      {credits ? `${credits.totalRemaining} credits left` : "Loading..."}
                    </span>
                  </>
                )}
              </div>
            </div>
          </SignedOut>
        </div>
      </div>

      {/* ── Center Panel: Competitive Intelligence ── */}
      <div className={styles.panelCenter}>
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>Competitive Intelligence</span>
          <span className={styles.panelSubtitle}>POWERED BY YOUR STORE DATA</span>
        </div>

        {/* Competitive Intelligence Pane */}
        <CompetitiveIntelPane
          domain={brandMeta?.domain || ""}
          brandName={brandMeta?.brandName || brandMeta?.title || keywords[0] || ""}
          keywords={keywords}
          onScanComplete={refreshCredits}
        />

        {/* ── Industry Pulse (reuses news data) ── */}
        {newsArticles.length > 0 && (
          <div className={styles.industryPulse}>
            <div className={styles.panelHeader} style={{ padding: '0 0 8px 0', borderBottom: 'none' }}>
              <span className={styles.panelTitle}>Industry Pulse</span>
            </div>
            {newsLoading ? (
              <div className={styles.newsLoading}>
                <div className={styles.loadingDots}><span></span><span></span><span></span></div>
                <span className={styles.loadingText}>Loading news...</span>
              </div>
            ) : (
              <>
                <div className={styles.pulseList}>
                  {(showAllNews ? newsArticles : newsArticles.slice(0, isMobile ? 1 : 3)).map((article, i) => (
                    <div key={i} className={styles.pulseItem}>
                      <span className={styles.pulseItemTitle}>
                        <a href={article.url} target="_blank" rel="noopener noreferrer">
                          {article.title}
                        </a>
                      </span>
                      <span className={styles.pulseItemDate}>
                        {formatNewsTime(article.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
                {newsArticles.length > (isMobile ? 1 : 3) && (
                  <button
                    className={styles.readMoreBtn}
                    onClick={() => setShowAllNews((v) => !v)}
                    style={{ marginTop: 8 }}
                  >
                    {showAllNews ? "Show less" : `Read more news`}
                  </button>
                )}
                <div className={styles.pulseSubtext}>Curated industry news, updated weekly</div>
              </>
            )}
          </div>
        )}

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

      {/* ── Right Panel: AI Agents ── */}
      <div className={styles.panelRight}>
        {/* Reddit Agent Section */}
        <div className={styles.agentSection}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>AI Agents</span>
            <span className={styles.panelSubtitle}>HUMAN-ASSISTED, DELIVERED IN 24H</span>
          </div>
          <div className={styles.panelHeader} style={{ borderBottom: 'none', paddingTop: 8, paddingBottom: 4 }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.08em' }}>🔴 Reddit Agent</span>
            <span className={styles.panelSubtitle}>{redditLoading ? "SCANNING" : "ACTIVE"}</span>
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

        {/* On-Demand Services */}
        <div className={styles.onDemandSection}>
          <div className={styles.onDemandTitle}>On-Demand Services</div>
          {ON_DEMAND_SERVICES.map((service) => (
            <div key={service.id} className={styles.onDemandCard}>
              <span className={styles.onDemandIcon}><ServiceIcon type={service.iconType} /></span>
              <div className={styles.onDemandInfo}>
                <div className={styles.onDemandName}>{service.name}</div>
                <div className={styles.onDemandDesc}>{service.desc}</div>
              </div>
              <button
                className={styles.onDemandBuyBtn}
                onClick={() => setComingSoonService(service.name)}
              >
                Buy · {service.price}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Guide Popup */}
      {showGuide && (
        <div className={styles.guideModal} onClick={dismissGuide}>
          <div className={styles.guideModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.guideModalTitle}>Reddit Agent Initialized</div>
            <div className={styles.guideModalDesc}>
              Use the Reddit Agent to send DMs automatically while it fetches data. Keep an eye out for initial scans generated directly from your store data in the intel section!
            </div>
            <button className={styles.guideModalCloseBtn} onClick={dismissGuide}>
              Get Started
            </button>
          </div>
        </div>
      )}

      {/* Coming Soon Modal */}
      {comingSoonService && (
        <div className={styles.comingSoonModal} onClick={() => setComingSoonService(null)}>
          <div className={styles.comingSoonModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.comingSoonModalIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div className={styles.comingSoonModalTitle}>Coming Soon</div>
            <div className={styles.comingSoonModalDesc}>
              Thank you for your interest in <strong>{comingSoonService}</strong>. Our human-assisted AI operators will deliver premium content within 24 hours. This service is launching very soon.
            </div>
            <button className={styles.comingSoonModalClose} onClick={() => setComingSoonService(null)}>
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className={styles.settingsModal} onClick={() => setShowSettings(false)}>
          <div className={styles.settingsModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.settingsModalHeader}>
              <span className={styles.settingsModalTitle}>Settings</span>
              <button className={styles.settingsModalClose} onClick={() => setShowSettings(false)}>×</button>
            </div>
            <div className={styles.settingsModalBody}>
              <div>
                <label className={styles.settingsLabel}>Current Store URL</label>
                <div className={styles.settingsCurrentUrl}>
                  {localStorage.getItem("lr_pending_scan_url") || "No URL set"}
                </div>
              </div>
              <div>
                <label className={styles.settingsLabel}>New E-Commerce URL</label>
                <input
                  className={styles.settingsInput}
                  value={settingsUrl}
                  onChange={(e) => setSettingsUrl(e.target.value)}
                  placeholder="e.g. houseofrui.com"
                  onKeyDown={(e) => e.key === "Enter" && handleRescan(settingsUrl)}
                />
              </div>
              <button className={styles.settingsSaveBtn} onClick={() => handleRescan(settingsUrl)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
                Scan & Refresh Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
