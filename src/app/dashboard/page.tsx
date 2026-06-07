"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useClerk } from "@clerk/nextjs";
import { saveScanToSession } from "@/lib/scanStorage";
import { saveScanToDb, saveActivityToDb } from "@/lib/scanApi";
import { useScanRestore } from "@/hooks/useScanRestore";
import { useFingerprint } from "@/hooks/useFingerprint";
import type { SelectedCommunity, CurateData, CommunitySlot, Phase } from "./types";
import { readSSE, stanceColor } from "./utils";
import { BlueprintPanel } from "./components/BlueprintPanel";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const [phase, setPhase]               = useState<Phase>("idle");
  const [url, setUrl]                   = useState("");
  const [scanLog, setScanLog]           = useState<string[]>([]);
  const [slots, setSlots]               = useState<CommunitySlot[]>([]);
  const [selectedIdx, setSelected]      = useState(0);
  const [errorMsg, setErrorMsg]         = useState("");
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [brandProfile, setBrandProfile] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scanLimited, setScanLimited]   = useState(false);
  const [credits, setCredits]           = useState<{ plan: string; remaining: number } | null>(null);
  const cancelRef       = useRef(false);
  const persistedUrlRef = useRef<string | null>(null);
  const scanIdRef       = useRef<number | null>(null);
  const hasRestoredRef  = useRef(false);

  const router       = useRouter();
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const fingerprintId  = useFingerprint();
  const savedScan      = useScanRestore();

  useEffect(() => {
    if (!isSignedIn) return;
    fetch("/api/credits")
      .then(r => r.json())
      .then(body => setCredits({ plan: body.plan, remaining: body.credits_remaining }))
      .catch(() => {});
  }, [isSignedIn]);

  useEffect(() => {
    if (!savedScan) return;

    // Always capture scanId when useScanRestore propagates it (may arrive in a second update)
    if (savedScan.scanId) scanIdRef.current = savedScan.scanId;

    // Only run the full restore once — prevents re-running curate when scanId is added
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    const restored = savedScan.slots.map(s => ({
      community:   s.community,
      data:        s.data as CurateData | null,
      loading:     !s.data,
      failed:      false,
      currentStep: s.currentStep,
    }));
    persistedUrlRef.current = savedScan.storeUrl;
    setUrl(savedScan.storeUrl);
    setBrandProfile(savedScan.brandProfile);
    setSlots(restored);
    setPhase("ready");
    // eslint-disable-next-line react-hooks/exhaustive-deps
    restored.forEach((slot, idx) => {
      if (!slot.data) curateOne(savedScan.brandProfile, slot.community, idx);
    });
  }, [savedScan]); // curateOne intentionally excluded — fires only when savedScan changes

  const saveActivity = useCallback((nextSlots: CommunitySlot[]) => {
    if (!isSignedIn || !scanIdRef.current) return;
    const progress = nextSlots.map(s => ({
      subreddit:       s.community.subreddit,
      step1_completed: s.currentStep === 2 || s.currentStep === "complete",
      step2_completed: s.currentStep === "complete",
    }));
    saveActivityToDb(scanIdRef.current, progress);
  }, [isSignedIn]);

  const handleSignIn = useCallback(() => {
    saveScanToSession({
      storeUrl: url,
      brandProfile,
      slots: slots.map(({ community, data, currentStep }) => ({ community, data, currentStep })),
    });
    openSignIn();
  }, [url, brandProfile, slots, openSignIn]);

  const curateOne = useCallback(async (bp: unknown, comm: SelectedCommunity, idx: number) => {
    setSlots(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], loading: true, failed: false };
      return next;
    });

    try {
      const res = await fetch("/api/tech-week/curate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandProfile: bp, community: comm, fingerprintId }),
      });
      if (res.status === 402) { router.push("/subscribe"); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      let received = false;
      for await (const ev of readSSE(res)) {
        if (cancelRef.current) return;
        if (ev.type === "credits") {
          setCredits({ plan: ev.plan, remaining: ev.credits_remaining });
        } else if (ev.type === "result") {
          received = true;
          setSlots(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], data: ev.data as CurateData, loading: false };
            return next;
          });
        } else if (ev.type === "fatal") {
          setSlots(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], loading: false, failed: true };
            return next;
          });
          return;
        }
      }
      // Stream closed without a result (e.g. server timeout, mid-stream crash)
      if (!received) {
        setSlots(prev => {
          const next = [...prev];
          next[idx] = { ...next[idx], loading: false, failed: true };
          return next;
        });
      }
    } catch {
      setSlots(prev => {
        const next = [...prev];
        next[idx] = { ...next[idx], loading: false, failed: true };
        return next;
      });
    }
  }, [fingerprintId, router]);

  const completeStep1 = useCallback((idx: number) => {
    setSlots(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], currentStep: 2 };
      saveActivity(next);
      return next;
    });
  }, [saveActivity]);

  const completeStep2 = useCallback((idx: number) => {
    setSlots(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], currentStep: "complete" };
      saveActivity(next);
      return next;
    });
  }, [saveActivity]);

  const run = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    cancelRef.current = false;
    setPhase("scanning");
    setScanLog([]);
    setSlots([]);
    setSelected(0);
    setErrorMsg("");
    setBrandProfile(null);

    try {
      const scanRes = await fetch("/api/tech-week/magic-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed, fingerprintId }),
      });

      if (scanRes.status === 403) {
        const body = await scanRes.json();
        if (body.error === "scan_limit_reached") {
          setScanLimited(true);
          setPhase("idle");
          return;
        }
      }

      if (scanRes.status === 402) { router.push("/subscribe"); return; }
      if (!scanRes.ok) throw new Error(`Scan failed (${scanRes.status})`);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let bp: any = null;
      let communities: SelectedCommunity[] = [];

      for await (const ev of readSSE(scanRes)) {
        if (cancelRef.current) return;
        if (ev.type === "step" && ev.status === "done") {
          setScanLog(p => [...p, ev.msg]);
        } else if (ev.type === "fatal") {
          throw new Error(ev.msg);
        } else if (ev.type === "result") {
          bp          = ev.data.brandProfile;
          communities = ev.data.communities;
        }
      }

      if (!bp || !communities.length) throw new Error("No communities found for this URL.");

      setBrandProfile(bp);
      setSlots(communities.map(c => ({ community: c, data: null, loading: true, failed: false, currentStep: 1 })));
      setPhase("ready");

      await Promise.allSettled(communities.map((comm, idx) => curateOne(bp, comm, idx)));

      if (isSignedIn && trimmed !== persistedUrlRef.current) {
        persistedUrlRef.current = trimmed;
        const scanId = await saveScanToDb({ storeUrl: trimmed, brandProfile: bp, slots: communities.map(c => ({ community: c, data: null, currentStep: 1 })) });
        if (scanId) scanIdRef.current = scanId;
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setPhase("error");
    }
  }, [url, curateOne, fingerprintId, isSignedIn, router]);

  if (phase === "idle" || phase === "error") {
    if (scanLimited) {
      return (
        <div className={styles.inputScreen}>
          <div className={styles.inputCard}>
            <div className={styles.inputLogo}>LegitReach</div>
            <h1 className={styles.inputHeading}>You&apos;ve used your free scan</h1>
            <p className={styles.inputSub}>
              Sign in to unlock unlimited scans and save your blueprints across sessions.
            </p>
            <button className={styles.scanBtn} onClick={() => openSignIn()}>
              Sign in to continue →
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.inputScreen}>
        <div className={styles.inputCard}>
          <div className={styles.inputLogo}>LegitReach</div>
          <h1 className={styles.inputHeading}>Community Engagement Blueprint</h1>
          <p className={styles.inputSub}>
            Enter your brand URL and we'll discover your best Reddit communities
            and generate a 2-step engagement blueprint for each.
          </p>
          <div className={styles.inputRow}>
            <input
              className={styles.urlInput}
              type="text"
              value={url}
              placeholder="yourstore.com"
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && run()}
              autoFocus
            />
            <button className={styles.scanBtn} onClick={run}>
              Scan →
            </button>
          </div>
          {phase === "error" && <p className={styles.errorBanner}>{errorMsg}</p>}
        </div>
      </div>
    );
  }

  // ── Scanning ──────────────────────────────────────────────────────────────────
  if (phase === "scanning") {
    return (
      <div className={styles.inputScreen}>
        <div className={styles.scanCard}>
          <div className={styles.scanSpinner} />
          <div className={styles.scanTitle}>Scanning {url}…</div>
          <div className={styles.scanLog}>
            {scanLog.map((msg, i) => (
              <div key={i} className={styles.scanLogRow}>
                <span className={styles.scanCheck}>✓</span>
                <span>{msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Ready — two-column blueprint UI ───────────────────────────────────────────
  const selected = slots[selectedIdx];

  return (
    <div className={styles.root}>

      {/* ── Mobile header ── */}
      <div className={styles.mobileHeader}>
        <div className={styles.mobileHeaderTop}>
          <span className={styles.mobileHeaderTitle}>Communities</span>
          {isSignedIn && credits && (
            <span
              className={styles.creditBadge}
              data-state={credits.remaining === 0 ? "empty" : credits.remaining === 1 ? "low" : "ok"}
            >
              {credits.remaining === 0 ? "No credits" : `${credits.remaining} credit${credits.remaining !== 1 ? "s" : ""}`}
            </span>
          )}
        </div>
        <button
          className={styles.mobileDropdownTrigger}
          onClick={() => setDropdownOpen(o => !o)}
        >
          <div
            className={styles.mobileDropdownAvatar}
            style={{ background: stanceColor(selected?.community.promotionStance ?? "neutral") }}
          >
            {selected?.community.subreddit.replace(/^r\//, "").slice(0, 1).toUpperCase()}
          </div>
          <span className={styles.mobileDropdownName}>{selected?.community.subreddit}</span>
          <span className={styles.mobileDropdownChevron}>{dropdownOpen ? "▲" : "▼"}</span>
        </button>

        {dropdownOpen && (
          <div className={styles.mobileDropdownList}>
            {slots.map((slot, i) => {
              const sc      = stanceColor(slot.community.promotionStance);
              const initial = slot.community.subreddit.replace(/^r\//, "").slice(0, 1).toUpperCase();
              return (
                <button
                  key={i}
                  className={`${styles.mobileDropdownItem} ${i === selectedIdx ? styles.mobileDropdownItemActive : ""}`}
                  onClick={() => { setSelected(i); setDropdownOpen(false); }}
                >
                  <div className={styles.mobileDropdownAvatar} style={{ background: sc }}>{initial}</div>
                  <span className={styles.mobileDropdownItemName}>{slot.community.subreddit}</span>
                  {slot.loading ? (
                    <span className={styles.metaLoading}>Analysing…</span>
                  ) : slot.failed ? (
                    <span
                      role="button"
                      tabIndex={0}
                      className={styles.retryBtn}
                      onClick={e => { e.stopPropagation(); curateOne(brandProfile, slot.community, i); setDropdownOpen(false); }}
                      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); curateOne(brandProfile, slot.community, i); setDropdownOpen(false); } }}
                    >
                      ↻ Retry
                    </span>
                  ) : (
                    <span className={styles.stepBadge}>{slot.currentStep === "complete" ? "Complete ✓" : `Step ${slot.currentStep}`}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Left sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span className={styles.sidebarTitle}>Communities ({slots.length})</span>
          <button
            className={styles.rescanBtn}
            onClick={() => { cancelRef.current = true; setPhase("idle"); }}
          >
            ← New scan
          </button>
        </div>

        <div className={styles.communityList}>
          {slots.map((slot, i) => {
            const name    = slot.community.subreddit;
            const initial = name.replace(/^r\//, "").slice(0, 1).toUpperCase();
            const active  = i === selectedIdx;
            const sc      = stanceColor(slot.community.promotionStance);

            return (
              <button
                key={i}
                className={`${styles.communityCard} ${active ? styles.communityCardActive : ""}`}
                onClick={() => setSelected(i)}
              >
                <div className={styles.communityAvatar} style={{ background: sc }}>
                  {initial}
                </div>
                <div className={styles.communityCardInfo}>
                  <div className={styles.communityCardName}>{name}</div>
                  <div className={styles.communityCardMeta}>
                    {slot.loading ? (
                      <span className={styles.metaLoading}>Analysing…</span>
                    ) : slot.failed ? (
                      <span
                        role="button"
                        tabIndex={0}
                        className={styles.retryBtn}
                        onClick={e => { e.stopPropagation(); curateOne(brandProfile, slot.community, i); }}
                        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); curateOne(brandProfile, slot.community, i); } }}
                      >
                        ↻ Retry
                      </span>
                    ) : (
                      <span className={styles.stepBadge}>{slot.currentStep === "complete" ? "Complete ✓" : `Step ${slot.currentStep}`}</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {isSignedIn && credits && (() => {
          const isExpired  = credits.plan === "expired" || credits.remaining === 0;
          const isLow      = !isExpired && credits.remaining === 1;
          const maxCredits = credits.plan === "paid" ? 30 : 3;
          const totalDots  = credits.plan === "paid" ? 5 : 3;
          const filledDots = isExpired ? 0 : Math.min(totalDots, Math.ceil((credits.remaining / maxCredits) * totalDots));
          const planLabel  = credits.plan === "paid" ? "Pro" : isExpired ? "Expired" : "Free";
          const state      = isExpired ? "empty" : isLow ? "low" : "ok";
          return (
            <div className={styles.sidebarFooter}>
              <div className={styles.creditsCard} data-state={state}>
                <span className={styles.creditsLabel}>{planLabel}</span>
                <div className={styles.creditsDots}>
                  {Array.from({ length: totalDots }).map((_, i) => (
                    <span key={i} className={`${styles.creditsDot} ${i < filledDots ? styles.creditsDotFilled : ""}`} />
                  ))}
                </div>
                <span className={styles.creditsCount}>{credits.remaining} of {maxCredits} credits</span>
              </div>
            </div>
          );
        })()}
      </aside>

      {/* ── Right panel ── */}
      <main className={styles.panel}>
        {!selected ? null
          : selected.loading ? (
            <div className={styles.panelLoading}>
              <div className={styles.scanSpinner} />
              <span>Building blueprint for {selected.community.subreddit}…</span>
            </div>
          ) : selected.failed ? (
            <div className={styles.panelError}>
              <span>Could not load blueprint for {selected.community.subreddit}.</span>
              <button
                className={styles.retryBtnLarge}
                onClick={() => curateOne(brandProfile, selected.community, selectedIdx)}
              >
                ↻ Try again
              </button>
            </div>
          ) : (
            <BlueprintPanel
              key={selected.community.subreddit}
              slot={selected}
              isSignedIn={!!isSignedIn}
              onSignIn={handleSignIn}
              onStep1Complete={() => completeStep1(selectedIdx)}
              onStep2Complete={() => completeStep2(selectedIdx)}
            />
          )
        }
      </main>
    </div>
  );
}
