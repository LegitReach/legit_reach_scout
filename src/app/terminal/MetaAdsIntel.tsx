/* eslint-disable react-hooks/purity */
"use client";

import { useMemo } from "react";

// ─── Types ───────────────────────────────────────────────

interface AdSnapshot {
  body?: { text?: string };
  title?: string;
  caption?: string;
  display_format?: string;
  cards?: Array<{ body?: string }>;
  link_url?: string;
  page_name?: string;
  page_like_count?: number;
  page_profile_uri?: string;
}

export interface Ad {
  ad_archive_id: string;
  start_date?: number;
  publisher_platform?: string[];
  snapshot?: AdSnapshot;
}

export interface MetaAdsResponse {
  results: Ad[];
  cursor?: string;
  searchResultsCount?: number;
}

interface Props {
  data: MetaAdsResponse;
  competitorData?: MetaAdsResponse | null;
  collapsed?: boolean;
}

// ─── Constants ───────────────────────────────────────────

type Theme = "Retargeting" | "Veterans" | "Social proof" | "Promo / discount" | "General";

const THEME_COLORS: Record<Theme, { bar: string; pill: { bg: string; text: string } }> = {
  Retargeting:        { bar: "#7c3aed", pill: { bg: "#EEEDFE", text: "#3C3489" } },
  Veterans:           { bar: "#2563eb", pill: { bg: "#E6F1FB", text: "#0C447C" } },
  "Social proof":     { bar: "#0d9488", pill: { bg: "#E1F5EE", text: "#085041" } },
  "Promo / discount": { bar: "#d97706", pill: { bg: "#FAEEDA", text: "#633806" } },
  General:            { bar: "#555555", pill: { bg: "#F1EFE8", text: "#444441" } },
};

const PLATFORM_ABBREV: Record<string, string> = {
  FACEBOOK: "FB", INSTAGRAM: "IG", MESSENGER: "Messenger",
  AUDIENCE_NETWORK: "Audience", THREADS: "Threads",
};

// ─── Helpers ─────────────────────────────────────────────

function classifyTheme(body: string, title: string): Theme {
  const text = (body + " " + title).toLowerCase();
  if (/almost there|still deciding|flexible payment|pay over time|pay later/.test(text)) return "Retargeting";
  if (/veteran|\bva\b|va coverage|out-of-pocket/.test(text)) return "Veterans";
  if (/says |real stories|lifesaver|saved his life/.test(text)) return "Social proof";
  if (/\bcode\s+[A-Z0-9]{3,}/i.test(body + " " + title) || /limited time offer/.test(text) || /save \$/.test(text.slice(0, 60)))
    return "Promo / discount";
  return "General";
}

function findPromoCodes(text: string): string[] {
  return [...new Set([...text.matchAll(/\bcode\s+([A-Z0-9]{3,})/gi)].map(m => m[1].toUpperCase()))];
}

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getAdBody(ad: Ad): string {
  return ad.snapshot?.body?.text || ad.snapshot?.cards?.[0]?.body || "";
}

function getAdTitle(ad: Ad): string {
  return ad.snapshot?.title || ad.snapshot?.caption || "";
}

// ─── Inner content component (reused for brand ads AND competitor ads) ───

function MetaAdsIntelContent({ results, totalAds, collapsed }: { results: Ad[]; totalAds: number; collapsed?: boolean }) {
  const firstSnap = results[0]?.snapshot;
  const pageName = firstSnap?.page_name ?? "Unknown";
  const pageLikes = firstSnap?.page_like_count;
  const fbUrl = firstSnap?.page_profile_uri;

  const oldestTs = Math.min(...results.map(r => r.start_date ?? Infinity));
  const daysRunning = isFinite(oldestTs) ? Math.floor((Date.now() / 1000 - oldestTs) / 86400) : null;
  const isLongRunning = daysRunning !== null && daysRunning > 100;

  const uniqueCodes = [...new Set(results.flatMap(r => findPromoCodes(getAdBody(r))))];
  const allPlatforms = [...new Set(results.flatMap(r => r.publisher_platform ?? []))];

  const themeEntries = useMemo(() => {
    const counts = {} as Record<Theme, number>;
    for (const t of Object.keys(THEME_COLORS) as Theme[]) counts[t] = 0;
    results.forEach(r => { counts[classifyTheme(getAdBody(r), getAdTitle(r))]++; });
    return (Object.entries(counts) as [Theme, number][]).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]);
  }, [results]);

  const dcoCount = results.filter(r => r.snapshot?.display_format === "DCO").length;
  const imageCount = results.filter(r => r.snapshot?.display_format === "IMAGE").length;
  const discountAmounts = [...new Set(results.flatMap(r => [...getAdBody(r).matchAll(/\$(\d+)\s*off/gi)].map(m => `$${m[1]}`)))];

  const topCreatives = useMemo(() => {
    if (results.length <= 4) return results;
    const selected: Ad[] = [];
    const usedThemes = new Set<Theme>();
    const dcos = results.filter(r => r.snapshot?.display_format === "DCO");
    if (dcos.length > 0) {
      const oldest = dcos.reduce((a, b) => (a.start_date ?? 0) < (b.start_date ?? 0) ? a : b);
      selected.push(oldest);
      usedThemes.add(classifyTheme(getAdBody(oldest), getAdTitle(oldest)));
    }
    for (const ad of [...results].sort((a, b) => (b.start_date ?? 0) - (a.start_date ?? 0))) {
      if (selected.length >= 4) break;
      if (selected.includes(ad)) continue;
      const theme = classifyTheme(getAdBody(ad), getAdTitle(ad));
      if (!usedThemes.has(theme)) { selected.push(ad); usedThemes.add(theme); }
    }
    for (const ad of results) {
      if (selected.length >= 4) break;
      if (!selected.includes(ad)) selected.push(ad);
    }
    return selected.slice(0, 4);
  }, [results]);

  const adLibrarySearch = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=${encodeURIComponent(pageName)}&search_type=keyword_unordered`;

  return (
    <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "14px" }}>

      {/* ── Advertiser header ── */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#e0e0e0", lineHeight: 1.3 }}>
          {fbUrl
            ? <a href={fbUrl} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>{pageName} ↗</a>
            : pageName}
        </div>
        <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>
          {pageLikes ? `${pageLikes.toLocaleString()} page likes · ` : ""}
          <a href={adLibrarySearch} target="_blank" rel="noopener noreferrer" style={{ color: "#a78bfa", textDecoration: "none" }}>
            {totalAds} active ad{totalAds !== 1 ? "s" : ""} ↗
          </a>
        </div>
      </div>

      {/* ── 4 Stat cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
        <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 6, padding: "10px 12px" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#e0e0e0", lineHeight: 1.1 }}>{totalAds}</div>
          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: "#555", marginTop: 3 }}>Active Ads</div>
        </div>
        <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 6, padding: "10px 12px" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: isLongRunning ? "#f59e0b" : "#e0e0e0", lineHeight: 1.1 }}>{daysRunning ?? "–"}</div>
          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: "#555", marginTop: 3 }}>Days Running</div>
          {isFinite(oldestTs) && <div style={{ fontSize: 9, color: "#444", marginTop: 2 }}>since {formatDate(oldestTs)}</div>}
          {isLongRunning && <div style={{ fontSize: 9, color: "#f59e0b", marginTop: 1 }}>↑ converting creative</div>}
        </div>
        {!collapsed && <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 6, padding: "10px 12px" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#e0e0e0", lineHeight: 1.1 }}>{uniqueCodes.length}</div>
          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: "#555", marginTop: 3 }}>Promo Codes</div>
          {uniqueCodes.length > 0 && (
            <div style={{ fontSize: 9, color: "#633806", background: "#FAEEDA", borderRadius: 3, padding: "1px 5px", marginTop: 3, display: "inline-block", fontWeight: 600 }}>
              {uniqueCodes.slice(0, 3).join(" · ")}
            </div>
          )}
        </div>}
        {!collapsed && <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 6, padding: "10px 12px" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#e0e0e0", lineHeight: 1.1 }}>{allPlatforms.length}</div>
          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: "#555", marginTop: 3 }}>Platforms</div>
          {allPlatforms.length > 0 && (
            <div style={{ fontSize: 9, color: "#444", marginTop: 2 }}>{allPlatforms.map(p => PLATFORM_ABBREV[p] ?? p).join(" · ")}</div>
          )}
        </div>}
      </div>

      {/* ── Campaign themes ── */}
      {themeEntries.length > 0 && !collapsed && (
        <div>
          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "#555", marginBottom: 8 }}>Campaign Themes</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {themeEntries.map(([theme, count]) => {
              const pct = Math.round((count / results.length) * 100);
              return (
                <div key={theme}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 10, color: "#aaa" }}>{theme}</span>
                    <span style={{ fontSize: 9, color: "#555", fontFamily: "Courier New, monospace" }}>{count} · {pct}%</span>
                  </div>
                  <div style={{ height: 5, background: "#1a1a1a", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: THEME_COLORS[theme].bar, borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Ad format split ── */}
      {!collapsed && (
        <div>
          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "#555", marginBottom: 6 }}>Ad Format</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 6, padding: "8px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#e0e0e0" }}>{dcoCount}</div>
              <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>DCO / Carousel</div>
            </div>
            <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 6, padding: "8px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#e0e0e0" }}>{imageCount}</div>
              <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>Image</div>
            </div>
          </div>
          {discountAmounts.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
              {discountAmounts.map(amt => (
                <span key={amt} style={{ fontSize: 9, padding: "2px 6px", background: "#FAEEDA", color: "#633806", borderRadius: 3, fontWeight: 600 }}>{amt} off</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Top creatives ── */}
      {topCreatives.length > 0 && !collapsed && (
        <div>
          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "#555", marginBottom: 6 }}>Top Creatives</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {topCreatives.map(ad => {
              const body = getAdBody(ad);
              const title = getAdTitle(ad);
              const theme = classifyTheme(body, title);
              const pillColor = THEME_COLORS[theme].pill;
              const cardsLen = ad.snapshot?.cards?.length ?? 0;
              const format = ad.snapshot?.display_format === "DCO" ? `DCO · ${cardsLen} slides` : "Image";
              const bodyPreview = body.replace(/\n/g, " ").slice(0, 140);
              const adCodes = findPromoCodes(body);
              const linkUrl = ad.snapshot?.link_url;
              const adLibraryUrl = `https://www.facebook.com/ads/library/?id=${ad.ad_archive_id}`;

              return (
                <a
                  key={ad.ad_archive_id}
                  href={adLibraryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "block", background: "#111", border: "1px solid #1a1a1a", borderRadius: 6, padding: "10px 12px", textDecoration: "none", transition: "border-color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "#a78bfa")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "#1a1a1a")}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#ddd", lineHeight: 1.4, flex: 1 }}>
                      {title ? title.slice(0, 60) : "(no headline)"}
                    </div>
                    <span style={{ fontSize: 8, padding: "2px 5px", borderRadius: 3, background: pillColor.bg, color: pillColor.text, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {theme}
                    </span>
                  </div>
                  {bodyPreview && (
                    <div style={{ fontSize: 11, color: "#666", lineHeight: 1.5, marginBottom: 5 }}>{bodyPreview}</div>
                  )}
                  <div style={{ fontSize: 9, color: "#444", fontFamily: "Courier New, monospace", display: "flex", flexWrap: "wrap", gap: "5px", alignItems: "center" }}>
                    <span>{format}</span>
                    {ad.start_date != null && <span>· since {formatDate(ad.start_date)}</span>}
                    {adCodes.length > 0 && (
                      <span style={{ background: "#FAEEDA", color: "#633806", borderRadius: 3, padding: "0 4px" }}>code: {adCodes[0]}</span>
                    )}
                    {linkUrl && (
                      <span
                        onClick={e => { e.preventDefault(); e.stopPropagation(); window.open(linkUrl, "_blank", "noopener,noreferrer"); }}
                        style={{ color: "#a78bfa", cursor: "pointer" }}
                      >
                        · view landing page ↗
                      </span>
                    )}
                    <span style={{ color: "#333", marginLeft: "auto" }}>view ad ↗</span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* ── View all link ── */}
      <a
        href={adLibrarySearch}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: "block", textAlign: "center", fontSize: 10, fontWeight: 600, color: "#a78bfa", padding: "8px", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 6, textDecoration: "none", letterSpacing: "0.04em" }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(167,139,250,0.07)")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        View all {totalAds} ads in Meta Ad Library ↗
      </a>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────

export default function MetaAdsIntel({ data, competitorData, collapsed }: Props) {
  const results = data.results ?? [];
  const totalAds = data.searchResultsCount ?? results.length;
  const compResults = competitorData?.results ?? [];

  if (results.length > 0) {
    return <MetaAdsIntelContent results={results} totalAds={totalAds} collapsed={collapsed} />;
  }

  // No brand ads — show CTA, then competitor ads if available
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>

      {/* ── Hire Us CTA ── */}
      <div style={{
        margin: "12px 12px 0",
        padding: "20px 16px",
        background: "#0f0d1a",
        border: "1px solid #2a1f4a",
        borderRadius: 8,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4,
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          No active Meta ads found
        </div>
        <div style={{ fontSize: 11, color: "#555", lineHeight: 1.6, maxWidth: 260 }}>
          This brand isn&apos;t running any ads right now. Our team can build and manage your Meta campaigns — from creatives to conversions.
        </div>
        <a
          href="mailto:hello@legitreach.com?subject=Meta Ads Management&body=Hi LegitReach team, I'd like help running Meta ads for my brand."
          style={{
            display: "inline-block", marginTop: 6, padding: "8px 16px",
            background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.35)",
            color: "#a78bfa", fontSize: 11, fontWeight: 700,
            borderRadius: 6, textDecoration: "none", letterSpacing: "0.04em",
          }}
        >
          Hire Us to Run Your Ads →
        </a>
      </div>

      {/* ── Competitor ads (if found) ── */}
      {compResults.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 12px 6px", borderTop: "1px solid #1a1a1a",
          }}>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#f59e0b" }}>
              ⚠ Competitor Ads in Your Space
            </span>
            <span style={{ fontSize: 9, color: "#444", fontFamily: "Courier New, monospace" }}>NOT YOUR ADS</span>
          </div>
          <div style={{ padding: "2px 12px 8px", fontSize: 10, color: "#555", lineHeight: 1.5 }}>
            These are from competitors in your category — use them for inspiration.
          </div>
          <MetaAdsIntelContent
            results={compResults}
            totalAds={competitorData?.searchResultsCount ?? compResults.length}
            collapsed={collapsed}
          />
        </div>
      )}
    </div>
  );
}
