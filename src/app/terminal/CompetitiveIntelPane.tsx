/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./terminal.module.css";

// ─── Types ───
interface MetaAdResult {
  adArchiveID?: string;
  page_name?: string;
  start_date?: number;
  snapshot?: {
    display_format?: string;
    body?: { text?: string };
    title?: string;
    cta_text?: string;
    images?: { original_image_url: string }[];
    videos?: { video_sd_url: string }[];
    link_url?: string;
  };
}

interface RedditAd {
  id: string;
  budget_category?: string;
  industry?: string;
  placements?: string[];
  objective?: string;
  creative?: {
    type?: string;
    headline?: string;
    body?: string;
  };
}

interface LinkedInAd {
  id: string;
  description?: string;
  headline?: string;
  poster?: string;
  adType?: string;
  cta?: string;
  totalImpressions?: string;
  targeting?: Record<string, string>;
}

interface GoogleAd {
  advertiserId?: string;
  creativeId?: string;
  format?: string;
  advertiserName?: string;
  domain?: string;
  firstShown?: string;
  lastShown?: string;
  adUrl?: string;
}

type PlatformId = "meta" | "google" | "linkedin" | "reddit";

interface PlatformState {
  data: any[] | null;
  loading: boolean;
  error: string | null;
  scannedWith?: Record<string, string>;
}

interface CompetitiveIntelPaneProps {
  domain: string;
  brandName: string;
  keywords: string[];
  onScanComplete?: () => void;
}

const CACHE_PREFIX = "lr_compintel_";
const CACHE_TTL = 1000 * 60 * 60 * 24;

const PLATFORMS: {
  id: PlatformId;
  name: string;
  color: string;
  fields: { key: string; label: string; placeholder: string }[];
}[] = [
  {
    id: "reddit",
    name: "Reddit Ads Intel",
    color: "#ff4500",
    fields: [
      { key: "query", label: "Search Query", placeholder: "e.g. skincare routine" },
      { key: "industries", label: "Industry (optional)", placeholder: "e.g. RETAIL_AND_ECOMMERCE" },
      { key: "budgets", label: "Budget (optional)", placeholder: "e.g. LOW, MEDIUM, HIGH" },
      { key: "formats", label: "Format (optional)", placeholder: "e.g. IMAGE, VIDEO, CAROUSEL" },
      { key: "placements", label: "Placement (optional)", placeholder: "e.g. FEED, COMMENTS_PAGE" },
      { key: "objectives", label: "Objective (optional)", placeholder: "e.g. APP_INSTALLS, CONVERSIONS" },
    ],
  },
  {
    id: "meta",
    name: "Meta Ads Intel",
    color: "#a78bfa",
    fields: [
      { key: "companyName", label: "Company Name or Page ID", placeholder: "e.g. Nike or 367152833370567" },
    ],
  },
  {
    id: "google",
    name: "Google Ads",
    color: "#4285f4",
    fields: [
      { key: "domain", label: "Domain", placeholder: "e.g. foreplay.co" },
      { key: "advertiser_id", label: "Advertiser ID (optional)", placeholder: "e.g. AR09628680369637163009" },
    ],
  },
];

export default function CompetitiveIntelPane({
  domain,
  brandName,
  keywords,
  onScanComplete,
}: CompetitiveIntelPaneProps) {
  // Per-platform states
  const [platformStates, setPlatformStates] = useState<Record<PlatformId, PlatformState>>({
    meta: { data: null, loading: false, error: null },
    google: { data: null, loading: false, error: null },
    linkedin: { data: null, loading: false, error: null },
    reddit: { data: null, loading: false, error: null },
  });

  // Which platform's activation modal is open
  const [activatingPlatform, setActivatingPlatform] = useState<PlatformId | null>(null);
  // Form fields for the active modal
  const [formFields, setFormFields] = useState<Record<string, string>>({});
  
  // Ad detail modal
  const [detailItem, setDetailItem] = useState<{ id: PlatformId; data: any } | null>(null);

  // Show all modal
  const [showAllPlatformId, setShowAllPlatformId] = useState<PlatformId | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [showMorePlatforms, setShowMorePlatforms] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const [hasBootedReddit, setHasBootedReddit] = useState(false);

  // Fetch a single platform
  const fetchPlatform = useCallback(async (platformId: PlatformId, params: Record<string, string>) => {
    setPlatformStates(prev => ({
      ...prev,
      [platformId]: { ...prev[platformId], loading: true, error: null },
    }));

    // Consume 1 credit
    try {
      const creditRes = await fetch("/api/user/consume-credit", { method: "POST" });
      const creditData = await creditRes.json();
        if (!creditData.allowed) {
          setPlatformStates(prev => ({
            ...prev,
            [platformId]: { data: null, loading: false, error: creditData.error || "No credits remaining." },
          }));
          return;
        }
        // Success - Refresh top level credits
        if (onScanComplete) onScanComplete();
      } catch {
      setPlatformStates(prev => ({
        ...prev,
        [platformId]: { data: null, loading: false, error: "Failed to verify credits." },
      }));
      return;
    }

    try {
      let data: any[] = [];
      let finalParams = { ...params };

      if (platformId === "meta") {
        const name = params.companyName || brandName || domain?.split(".")[0] || "";
        finalParams.companyName = name;
        const res = await fetch(`/api/meta-ads?candidates=${encodeURIComponent(name)}`);
        const json = await res.json();
        data = json.results || [];
      } else if (platformId === "google") {
        const qs = new URLSearchParams();
        if (params.domain) qs.set("domain", params.domain);
        if (params.advertiser_id) qs.set("advertiser_id", params.advertiser_id);
        const res = await fetch(`/api/google-ads?${qs}`);
        const json = await res.json();
        data = json.ads || [];
      } else if (platformId === "reddit") {
        const qs = new URLSearchParams();
        if (params.query) qs.set("query", params.query);
        if (params.industries) qs.set("industries", params.industries);
        if (params.budgets) qs.set("budgets", params.budgets);
        if (params.formats) qs.set("formats", params.formats);
        if (params.placements) qs.set("placements", params.placements);
        if (params.objectives) qs.set("objectives", params.objectives);
        const res = await fetch(`/api/reddit-ads?${qs}`);
        const json = await res.json();
        data = json.ads || [];
      }

      setPlatformStates(prev => ({
        ...prev,
        [platformId]: { data, loading: false, error: null, scannedWith: finalParams },
      }));

      // Cache
      try {
        localStorage.setItem(`${CACHE_PREFIX}${platformId}`, JSON.stringify({ 
          data, 
          ts: Date.now(),
          params: finalParams
        }));
      } catch { /* storage full */ }
    } catch (err) {
      console.error(`[comp-intel:${platformId}] error:`, err);
      setPlatformStates(prev => ({
        ...prev,
        [platformId]: { data: null, loading: false, error: "Failed to fetch. Try again." },
      }));
    }
  }, [brandName, domain, onScanComplete]);

  // Load cached data on mount
  useEffect(() => {
    let redditCached = false;
    for (const p of PLATFORMS) {
      try {
        const cached = localStorage.getItem(`${CACHE_PREFIX}${p.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.ts && Date.now() - parsed.ts < CACHE_TTL && parsed.data) {
            if (p.id === 'reddit') redditCached = true;
            setPlatformStates(prev => ({
              ...prev,
              [p.id]: { 
                data: parsed.data, 
                loading: false, 
                error: null,
                scannedWith: parsed.params 
              },
            }));
          }
        }
      } catch { /* ignore */ }
    }

    if (!redditCached && !hasBootedReddit && (keywords?.[0] || brandName)) {
      setHasBootedReddit(true);
      fetchPlatform("reddit", { query: keywords?.[0] || brandName || "", industries: "" });
    }
  }, [fetchPlatform, hasBootedReddit, keywords, brandName]);

  // Open activation modal — prefill defaults
  const openActivation = (platformId: PlatformId) => {
    const defaults: Record<string, string> = {};
    const platform = PLATFORMS.find(p => p.id === platformId)!;

    for (const field of platform.fields) {
      if (field.key === "domain") defaults[field.key] = domain || "";
      else if (field.key === "companyName" || field.key === "company") defaults[field.key] = brandName || "";
      else if (field.key === "query") defaults[field.key] = keywords?.[0] || brandName || "";
      else defaults[field.key] = "";
    }

    setFormFields(defaults);
    setActivatingPlatform(platformId);
  };

  const handleActivate = () => {
    if (!activatingPlatform) return;
    const params = { ...formFields };
    setActivatingPlatform(null);
    fetchPlatform(activatingPlatform, params);
  };

  const formatDate = (ts: number | string | undefined) => {
    if (!ts) return "";
    const d = new Date(typeof ts === "number" ? ts * 1000 : ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Render a single platform box
  const renderBox = (platform: typeof PLATFORMS[0]) => {
    const state = platformStates[platform.id];

    return (
      <div key={platform.id} className={`${styles.compIntelBox} ${platform.id === 'reddit' ? styles.compIntelBoxRedditFull : ''}`}>
        <div className={styles.compIntelBoxHeader}>
          <span className={styles.compIntelBoxIcon} style={{ color: platform.color }}>&#x25C9;</span>
          <span className={styles.compIntelBoxTitle}>{platform.name}</span>
        </div>

        {state.loading ? (
          <div style={{ padding: '12px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className={styles.loadingDots}><span></span><span></span><span></span></div>
            <span style={{ fontSize: 9, color: '#444' }}>Scanning...</span>
          </div>
        ) : state.error ? (
          <div className={styles.compIntelError} style={{ marginBottom: 0 }}>{state.error}</div>
        ) : state.data !== null ? (
          <>
            <div className={styles.compIntelBoxParams}>
              Scanned for: {Object.values(state.scannedWith || {}).filter(Boolean).join(", ")}
            </div>
            <div className={styles.compIntelBoxCount} style={{ color: platform.color }}>
              {state.data.length} ad{state.data.length !== 1 ? "s" : ""} found
            </div>
            <div className={styles.compIntelBoxItems}>
              {renderItems(platform.id, state.data)}
              {state.data.length === 0 && (
                <div className={styles.compIntelEmpty}>No ads found for this query</div>
              )}
            </div>
            <div className={styles.compIntelBoxFooter}>
              <button
                className={styles.compIntelRescanBtn}
                onClick={() => openActivation(platform.id)}
              >
                Rescan (1 credit)
              </button>
              {state.data.length > 2 && (
                <button
                  className={styles.compIntelShowAllBtn}
                  onClick={() => setShowAllPlatformId(platform.id)}
                >
                  Show All ({state.data.length})
                </button>
              )}
            </div>
          </>
        ) : (
          <button
            className={styles.compIntelActivateBtn}
            style={{ borderColor: platform.color, color: platform.color }}
            onClick={() => openActivation(platform.id)}
          >
            Activate (1 credit)
          </button>
        )}
      </div>
    );
  };

  // Render result items per platform
  const renderItems = (id: PlatformId, data: any[], limit = 2) => {
    const items = limit > 0 ? data.slice(0, limit) : data;
    return items.map((item, i) => {
      let title = "";
      let sub = "";
      
      if (id === "meta") {
        title = item.page_name || "Unknown";
        sub = `Started ${formatDate(item.start_date)}`;
      } else if (id === "google") {
        title = item.advertiserName || item.domain || "Unknown";
        sub = `${item.format || "Ad"} · Since ${formatDate(item.firstShown)}`;
      } else if (id === "linkedin") {
        title = item.poster || "LinkedIn Advertiser";
        sub = `${item.adType || "Ad"} · ${item.cta || "View"}`;
      } else if (id === "reddit") {
        title = item.creative?.headline || item.objective || "Reddit Ad";
        sub = `${item.industry || "N/A"} · ${item.budget_category || "N/A"}`;
      }

      return (
        <div key={i} className={styles.compIntelItem} onClick={() => setDetailItem({ id, data: item })}>
          <div className={styles.compIntelItemIcon}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
            </svg>
          </div>
          <div className={styles.compIntelItemContent}>
            <strong>{title.substring(0, 48)}{title.length > 48 ? "..." : ""}</strong>
            <span>{sub}</span>
          </div>
        </div>
      );
    });
  };

  return (
    <div className={styles.compIntelSection}>
      <p className={styles.compIntelSubtext}>
        Activate each platform individually. Each scan costs 1 credit and results are cached for 24 hours. Click an ad for more details.
      </p>

      {/* 4 boxes grid */}
      <div className={styles.compIntelGrid}>
        {PLATFORMS.filter(p => !isMobile || showMorePlatforms || p.id === 'reddit').map(renderBox)}
      </div>

      {isMobile && !showMorePlatforms && (
        <button 
          className={styles.compIntelShowAllBtn} 
          style={{ width: '100%', marginTop: '12px' }}
          onClick={() => setShowMorePlatforms(true)}
        >
          See More Intelligence Options
        </button>
      )}

      {/* Activation Modal */}
      {activatingPlatform && (
        <div className={styles.updatesOverlay} onClick={() => setActivatingPlatform(null)}>
          <div className={styles.updatesDrawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.updatesHeader}>
              <span className={styles.updatesTitle}>
                {PLATFORMS.find(p => p.id === activatingPlatform)?.name}
              </span>
              <button className={styles.updatesClose} onClick={() => setActivatingPlatform(null)}>×</button>
            </div>
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <p style={{ fontSize: 11, color: '#666', margin: 0, lineHeight: 1.5 }}>
                Enter search parameters for {PLATFORMS.find(p => p.id === activatingPlatform)?.name}. This will consume 1 credit.
              </p>
              {PLATFORMS.find(p => p.id === activatingPlatform)?.fields.map(field => (
                <div key={field.key}>
                  <label className={styles.compIntelParamLabel}>{field.label}</label>
                  <input
                    className={styles.compIntelParamInput}
                    value={formFields[field.key] || ""}
                    onChange={(e) => setFormFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
              <button className={styles.compIntelScanBtn} onClick={handleActivate}>
                Scan (1 credit)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Show All Modal */}
      {showAllPlatformId && (
        <div className={styles.updatesOverlay} onClick={() => setShowAllPlatformId(null)}>
          <div className={styles.updatesDrawer} style={{ width: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.updatesHeader}>
              <span className={styles.updatesTitle}>
                All {PLATFORMS.find(p => p.id === showAllPlatformId)?.name}
              </span>
              <button className={styles.updatesClose} onClick={() => setShowAllPlatformId(null)}>×</button>
            </div>
            <div className={styles.compIntelShowAllList}>
              {renderItems(showAllPlatformId, platformStates[showAllPlatformId].data || [], 0)}
            </div>
            <div style={{ padding: '0 20px 20px' }}>
              <button className={styles.compIntelScanBtn} onClick={() => setShowAllPlatformId(null)}>Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailItem && (
        <div className={styles.updatesOverlay} onClick={() => setDetailItem(null)}>
          <div className={styles.updatesDrawer} style={{ width: '480px', zIndex: 3000 }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.updatesHeader}>
              <span className={styles.updatesTitle}>Ad Intelligence Detail</span>
              <button className={styles.updatesClose} onClick={() => setDetailItem(null)}>×</button>
            </div>
            <div className={styles.adDetailBody}>
              {detailItem.id === "meta" && (
                <>
                  <div className={styles.adDetailSection}>
                    <h3>Meta Ads Library Result</h3>
                    <p><strong>Page:</strong> {detailItem.data.page_name}</p>
                    <p><strong>Started:</strong> {formatDate(detailItem.data.start_date)}</p>
                    <p><strong>Format:</strong> {detailItem.data.snapshot?.display_format}</p>
                    {detailItem.data.snapshot?.body?.text && (
                      <div className={styles.adDetailQuote}>&quot;{detailItem.data.snapshot.body.text}&quot;</div>
                    )}
                    {detailItem.data.snapshot?.images?.[0] && (
                      <img src={detailItem.data.snapshot.images[0].original_image_url} alt="Ad content" className={styles.adDetailPreview} />
                    )}
                  </div>
                </>
              )}
              {detailItem.id === "google" && (
                <>
                  <div className={styles.adDetailSection}>
                    <h3>Google Ad Transparency Detail</h3>
                    <p><strong>Advertiser:</strong> {detailItem.data.advertiserName}</p>
                    <p><strong>Domain:</strong> {detailItem.data.domain}</p>
                    <p><strong>First Shown:</strong> {formatDate(detailItem.data.firstShown)}</p>
                    <p><strong>Last Shown:</strong> {formatDate(detailItem.data.lastShown)}</p>
                    <p><strong>Format:</strong> {detailItem.data.format}</p>
                    {detailItem.data.adUrl && (
                      <a href={detailItem.data.adUrl} target="_blank" rel="noreferrer" className={styles.adDetailLink}>View original ad library entry →</a>
                    )}
                  </div>
                </>
              )}
              {detailItem.id === "linkedin" && (
                <>
                  <div className={styles.adDetailSection}>
                    <h3>LinkedIn Ad Library Detail</h3>
                    <p><strong>Poster:</strong> {detailItem.data.poster}</p>
                    <p><strong>Type:</strong> {detailItem.data.adType}</p>
                    <p><strong>CTA:</strong> {detailItem.data.cta}</p>
                    <p><strong>Impressions:</strong> {detailItem.data.totalImpressions || "N/A"}</p>
                    {detailItem.data.headline && <h4>{detailItem.data.headline}</h4>}
                    {detailItem.data.description && <p>{detailItem.data.description}</p>}
                    {detailItem.data.targeting && (
                      <div className={styles.adDetailTargeting}>
                        <strong>Targeting:</strong> {Object.entries(detailItem.data.targeting).map(([k,v]) => `${k}:${v}`).join(", ")}
                      </div>
                    )}
                  </div>
                </>
              )}
              {detailItem.id === "reddit" && (
                <>
                  <div className={styles.adDetailSection}>
                    <h3>Reddit Ads Library Detail</h3>
                    <p><strong>Objective:</strong> {detailItem.data.objective}</p>
                    <p><strong>Industry:</strong> {detailItem.data.industry}</p>
                    <p><strong>Budget Category:</strong> {detailItem.data.budget_category}</p>
                    {detailItem.data.creative?.headline && <h4>{detailItem.data.creative.headline}</h4>}
                    {detailItem.data.creative?.body && <p>{detailItem.data.creative.body}</p>}
                    {detailItem.data.placements && (
                      <div className={styles.adDetailTargeting}>
                        <strong>Placements:</strong> {detailItem.data.placements.join(", ")}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <div style={{ padding: '0 20px 20px' }}>
              <button className={styles.compIntelScanBtn} onClick={() => setDetailItem(null)}>Close Detail</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
