"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { saveScanToSession } from "@/lib/scanStorage";
import { useScanRestore } from "@/hooks/useScanRestore";
import { useFingerprint } from "@/hooks/useFingerprint";
import styles from "./dashboard.module.css";

const MOCK_MODE = true;

interface SelectedCommunity {
  subreddit: string;
  selectionReason: string;
  promotionStance: "friendly" | "neutral" | "strict";
  promotionStanceReason: string;
  alignmentType: "product" | "identity" | "problem";
}

interface RedditPost {
  id: string;
  title: string;
  url: string;
  author: string;
  score: number;
  num_comments: number;
  created_utc: number;
  selftext?: string;
  permalink: string;
}

interface CurateData {
  engagement: { post: RedditPost; draftComment: string; whyThisPost: string };
  creation: {
    suggestedTitle: string;
    format: string;
    tone: string;
    contentOutline: string[];
    whatToAvoid: string[];
    postingTips: string;
  };
}

interface CommunitySlot {
  community: SelectedCommunity;
  data: CurateData | null;
  loading: boolean;
  failed: boolean;
  currentStep: 1 | 2 | "complete";
}

type Phase = "idle" | "scanning" | "ready" | "error";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_BRAND_PROFILE = {
  businessDescription: "Organic non-toxic baby playmats designed for tummy time and developmental play",
  targetAudience: "New parents aged 25-38 who prioritise safe, natural materials for their babies",
  keywords: ["organic baby mat", "tummy time", "non-toxic play mat", "developmental play"],
  buyerProblems: [
    "Worried about toxic materials in baby products",
    "Unsure which mat supports development best",
    "Need easy-to-clean yet safe options",
  ],
  voiceTone: "Warm, science-backed, reassuring without being preachy",
};

const MOCK_COMMUNITIES: SelectedCommunity[] = [
  {
    subreddit: "r/beyondthebump",
    selectionReason: "Active community for new parents sharing postpartum experiences and product recommendations",
    promotionStance: "neutral",
    promotionStanceReason: "Community allows product mentions when directly relevant to the discussion",
    alignmentType: "problem",
  },
  {
    subreddit: "r/Parenting",
    selectionReason: "Large parenting community with weekly recommendation threads where product mentions fit naturally",
    promotionStance: "friendly",
    promotionStanceReason: "Frequent 'what worked for you' threads make honest product experience a natural fit",
    alignmentType: "product",
  },
  {
    subreddit: "r/NewParents",
    selectionReason: "First-time parent support community — high alignment with buyer problems around safety and development",
    promotionStance: "strict",
    promotionStanceReason: "Strict no-promotion rules; only pure value-add content is welcome here",
    alignmentType: "identity",
  },
];

const MOCK_CURATE: CurateData[] = [
  {
    engagement: {
      post: {
        id: "mock_btb_1",
        title: "Tummy time is a STRUGGLE — any tips from parents who've been through this?",
        url: "https://www.reddit.com/r/beyondthebump/comments/mock1",
        permalink: "https://www.reddit.com/r/beyondthebump/comments/mock1",
        author: "new_parent_2024",
        score: 312,
        num_comments: 87,
        created_utc: Math.floor(Date.now() / 1000) - 3600,
        selftext: "My 6-week-old absolutely hates tummy time. She screams within 30 seconds. We've tried different surfaces but nothing works...",
      },
      draftComment:
        "We had the exact same battle. What finally worked was putting a small mirror flat in front of her — she got so distracted she forgot to complain. Total game changer around week 7.",
      whyThisPost:
        "High comment velocity, directly maps to your buyer's core problem — a practical tip adds genuine value here.",
    },
    creation: {
      suggestedTitle: "What nobody tells you about tummy time (and what actually worked for us)",
      format: "discussion",
      tone: "Parent sharing a real finding, not a product pitch — peer-to-peer, slightly wry",
      contentOutline: [
        "The tummy time wall every parent hits around week 3",
        "Two things that actually made a difference for us",
        "What the research says about developmental windows",
        "Anyone else find this? Would love to hear what worked",
      ],
      whatToAvoid: [
        "Never mention your brand or product directly",
        "Avoid clinical language — this community prefers conversational tone",
        "Don't lead with stats without a relatable hook first",
      ],
      postingTips:
        "Best time: weekday mornings 9–11am EST. Keep under 400 words. Use 'Advice' or 'Tips & Tricks' flair if available.",
    },
  },
  {
    engagement: {
      post: {
        id: "mock_par_1",
        title: "What's the one baby product you wish you'd bought sooner?",
        url: "https://www.reddit.com/r/Parenting/comments/mock2",
        permalink: "https://www.reddit.com/r/Parenting/comments/mock2",
        author: "dadof2_portland",
        score: 1842,
        num_comments: 634,
        created_utc: Math.floor(Date.now() / 1000) - 7200,
        selftext: "Looking back, there are so many things I wish I'd just bought upfront instead of buying the cheap version first...",
      },
      draftComment:
        "Play mats for sure. Bought a basic one first, upgraded 3 months in, genuinely wish we'd just gotten a decent one from the start — the quality difference is real.",
      whyThisPost:
        "Direct recommendation thread with very high engagement — your product experience fits naturally without feeling promotional.",
    },
    creation: {
      suggestedTitle: "The honest truth about cheap vs premium baby play mats (after using both)",
      format: "advice",
      tone: "Honest parent comparison — slightly opinionated, conversational, not a review-site style writeup",
      contentOutline: [
        "What we started with and why we made the switch",
        "The differences that actually matter day-to-day (and the ones that don't)",
        "What to look for if you're buying now",
        "Happy to answer questions in the comments",
      ],
      whatToAvoid: [
        "Avoid affiliate-link style language or price anchoring",
        "Don't structure it like a product review page — keep it conversational",
        "No direct brand name drops in the post body",
      ],
      postingTips:
        "Saturday or Sunday morning hits peak traffic here. Aim for 300–500 words. No flair required but 'Gear & Products' works if available.",
    },
  },
  {
    engagement: {
      post: {
        id: "mock_np_1",
        title: "First-time parent anxiety is real — how do you actually know if your baby is hitting milestones?",
        url: "https://www.reddit.com/r/NewParents/comments/mock3",
        permalink: "https://www.reddit.com/r/NewParents/comments/mock3",
        author: "firsttimemum_uk",
        score: 567,
        num_comments: 142,
        created_utc: Math.floor(Date.now() / 1000) - 5400,
        selftext: "Every chart I look at makes me panic. My 4 month old isn't doing some of the things they're supposed to...",
      },
      draftComment:
        "Milestone charts caused us so much unnecessary stress until our paed explained the ranges are way wider than charts suggest. We switched to watching for progress over exact weeks — much better for everyone's sanity.",
      whyThisPost:
        "Emotionally resonant, high comment count — a calming, informed reply adds real value and builds trust in the community.",
    },
    creation: {
      suggestedTitle: "Motor development in the first 6 months — what's actually normal vs what to watch for",
      format: "advice",
      tone: "Knowledgeable but warm — experienced parent, not medical professional",
      contentOutline: [
        "Why milestone anxiety spikes around the 3-month mark",
        "The actual range for common motor milestones (wider than most charts show)",
        "Environmental factors that genuinely support development",
        "When it actually makes sense to call your paed",
      ],
      whatToAvoid: [
        "Zero brand or product mentions — strict no-promotion rules in this community",
        "Don't give specific medical advice or claim authority you don't have",
        "Avoid phrases that signal you're a founder or seller",
      ],
      postingTips:
        "Weekday evenings 7–9pm work well here. Keep under 350 words. Use the 'Advice' flair.",
    },
  },
];

// ─── SSE parser ───────────────────────────────────────────────────────────────

async function* readSSE(res: Response) {
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const parts = buf.split("\n\n");
      buf = parts.pop() ?? "";
      for (const part of parts) {
        const t = part.trim();
        if (t.startsWith("data: ")) {
          try { yield JSON.parse(t.slice(6)); } catch { /* skip */ }
        }
      }
    }
  } finally {
    try { reader.releaseLock(); } catch { /* ignore */ }
  }
}

// ─── Stance helpers ───────────────────────────────────────────────────────────

function stanceColor(s: string) {
  return s === "friendly" ? "#16a34a" : s === "neutral" ? "#ca8a04" : "#dc2626";
}
function stanceBg(s: string) {
  return s === "friendly" ? "#f0fdf4" : s === "neutral" ? "#fefce8" : "#fef2f2";
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [phase, setPhase]           = useState<Phase>("idle");
  const [url, setUrl]               = useState("");
  const [scanLog, setScanLog]       = useState<string[]>([]);
  const [slots, setSlots]           = useState<CommunitySlot[]>([]);
  const [selectedIdx, setSelected]  = useState(0);
  const [errorMsg, setErrorMsg]     = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [brandProfile, setBrandProfile] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const cancelRef = useRef(false);

  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const fingerprintId = useFingerprint();
  const savedScan = useScanRestore();

  // Restore scan state after OAuth redirect
  useEffect(() => {
    if (!savedScan) return;
    setUrl(savedScan.storeUrl);
    setBrandProfile(savedScan.brandProfile);
    setSlots(savedScan.slots.map(s => ({
      community: s.community,
      data: s.data as CurateData | null,
      loading: false,
      failed: false,
      currentStep: s.currentStep,
    })));
    setPhase("ready");
  }, [savedScan]);

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

    if (MOCK_MODE) {
      await new Promise(r => setTimeout(r, 700 + idx * 350));
      setSlots(prev => {
        const next = [...prev];
        next[idx] = { ...next[idx], data: MOCK_CURATE[idx % MOCK_CURATE.length], loading: false };
        return next;
      });
      return;
    }

    try {
      const res = await fetch("/api/tech-week/curate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandProfile: bp, community: comm }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      for await (const ev of readSSE(res)) {
        if (cancelRef.current) return;
        if (ev.type === "result") {
          setSlots(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], data: ev.data as CurateData, loading: false };
            return next;
          });
        }
      }
    } catch {
      setSlots(prev => {
        const next = [...prev];
        next[idx] = { ...next[idx], loading: false, failed: true };
        return next;
      });
    }
  }, []);

  const completeStep1 = useCallback((idx: number) => {
    setSlots(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], currentStep: 2 };
      return next;
    });
  }, []);

  const completeStep2 = useCallback((idx: number) => {
    setSlots(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], currentStep: "complete" };
      return next;
    });
  }, []);

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

    if (MOCK_MODE) {
      await new Promise(r => setTimeout(r, 400));
      setScanLog(["Store found — babynest.com"]);
      await new Promise(r => setTimeout(r, 450));
      setScanLog(p => [...p, "Brand profile extracted"]);
      await new Promise(r => setTimeout(r, 450));
      setScanLog(p => [...p, "3 Reddit communities identified"]);
      await new Promise(r => setTimeout(r, 350));
      setScanLog(p => [...p, "Engagement opportunities mapped"]);
      await new Promise(r => setTimeout(r, 300));
      setBrandProfile(MOCK_BRAND_PROFILE);
      setSlots(MOCK_COMMUNITIES.map(c => ({ community: c, data: null, loading: true, failed: false, currentStep: 1 })));
      setPhase("ready");
      await Promise.allSettled(MOCK_COMMUNITIES.map((comm, idx) => curateOne(MOCK_BRAND_PROFILE, comm, idx)));
      return;
    }

    try {
      const scanRes = await fetch("/api/tech-week/magic-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed, fingerprintId }),
      });
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
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setPhase("error");
    }
  }, [url, curateOne, fingerprintId]);

  // ── Idle / error ─────────────────────────────────────────────────────────────
  if (phase === "idle" || phase === "error") {
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

  // ── Scanning ─────────────────────────────────────────────────────────────────
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

  // ── Ready — two-column blueprint UI ──────────────────────────────────────────
  const selected = slots[selectedIdx];

  return (
    <div className={styles.root}>

      {/* ── Mobile header ── */}
      <div className={styles.mobileHeader}>
        <span className={styles.mobileHeaderTitle}>Communities</span>
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
              const sc = stanceColor(slot.community.promotionStance);
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
                    <button
                      className={styles.retryBtn}
                      onClick={e => { e.stopPropagation(); curateOne(brandProfile, slot.community, i); setDropdownOpen(false); }}
                    >
                      ↻ Retry
                    </button>
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
                      <button
                        className={styles.retryBtn}
                        onClick={e => { e.stopPropagation(); curateOne(brandProfile, slot.community, i); }}
                      >
                        ↻ Retry
                      </button>
                    ) : (
                      <span className={styles.stepBadge}>{slot.currentStep === "complete" ? "Complete ✓" : `Step ${slot.currentStep}`}</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
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

// ─── Blueprint panel ──────────────────────────────────────────────────────────

function BlueprintPanel({
  slot,
  isSignedIn,
  onSignIn,
  onStep1Complete,
  onStep2Complete,
}: {
  slot: CommunitySlot;
  isSignedIn: boolean;
  onSignIn: () => void;
  onStep1Complete: () => void;
  onStep2Complete: () => void;
}) {
  const { community, data } = slot;
  if (!data) return null;
  const { engagement, creation } = data;
  const sc = stanceColor(community.promotionStance);
  const sb = stanceBg(community.promotionStance);
  const step1Done = slot.currentStep === 2 || slot.currentStep === "complete";
  const step2Done = slot.currentStep === "complete";
  const [step2Clicked, setStep2Clicked] = useState(false);

  const sub = community.subreddit.replace(/^r\//, "");
  const draft = creation.contentOutline.join("\n\n");
  const submitUrl = `https://www.reddit.com/r/${sub}/submit?title=${encodeURIComponent(creation.suggestedTitle)}&selftext=true&text=${encodeURIComponent(draft)}`;

  const step2Locked = !isSignedIn;

  return (
    <div className={styles.blueprintWrap}>
      {/* Community header */}
      <div className={styles.communityHeader}>
        <div className={styles.communityHeaderAvatar} style={{ background: sc }}>
          {community.subreddit.replace(/^r\//, "").slice(0, 1).toUpperCase()}
        </div>
        <div>
          <div className={styles.communityHeaderName}>{community.subreddit}</div>
          <div className={styles.communityHeaderSub}>{community.selectionReason}</div>
        </div>
        <div
          className={styles.stancePill}
          style={{ color: sc, background: sb, border: `1px solid ${sc}22` }}
        >
          {community.promotionStance} stance
        </div>
      </div>

      {/* Blueprint header */}
      <div className={styles.blueprintHeading}>
        <span className={styles.blueprintIcon}>⚡</span>
        2-Step Blueprint
        <span className={styles.blueprintHeadingSub}>
          Follow this proven process to build authentic presence in {community.subreddit}
        </span>
      </div>

      {/* Steps */}
      <div className={styles.steps}>
        <StepCard num={1} status={step1Done ? "complete" : "active"} title="Engage Authentically" desc="Comment thoughtfully and upvote valuable discussions">
          <p className={styles.insight}>{engagement.whyThisPost}</p>
          {engagement.post && (
            <a href={engagement.post.url} target="_blank" rel="noopener noreferrer" className={styles.postLink}>
              ↳ {engagement.post.title}
            </a>
          )}
          <DraftComment draftComment={engagement.draftComment} postUrl={engagement.post?.url} onComplete={onStep1Complete} />
        </StepCard>

        <StepCard num={2} status={step1Done ? (step2Done ? "complete" : "active") : "idle"} title="Create & Contribute" desc="Share insights aligned with your business and community interests">
          {step2Locked ? (
            <div className={styles.step2LockWrap}>
              <div className={styles.step2LockedContent}>
                <p className={styles.suggestedTitle}>"{creation.suggestedTitle}"</p>
                {creation.contentOutline.length > 0 && (
                  <ul className={styles.outline}>
                    {creation.contentOutline.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                )}
                {creation.postingTips && <p className={styles.tips}>{creation.postingTips}</p>}
                <div className={styles.stepActions}>
                  <button className={styles.ctaPrimary}>Create Post →</button>
                </div>
              </div>
              <div className={styles.step2LockOverlay}>
                <span className={styles.lockIcon}>🔒</span>
                <p className={styles.lockLabel}>Sign in to unlock your full post suggestion</p>
                <button className={styles.ctaPrimary} onClick={onSignIn}>Sign in to unlock →</button>
              </div>
            </div>
          ) : (
            <>
              <p className={styles.suggestedTitle}>"{creation.suggestedTitle}"</p>
              {creation.contentOutline.length > 0 && (
                <ul className={styles.outline}>
                  {creation.contentOutline.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              )}
              {creation.postingTips && <p className={styles.tips}>{creation.postingTips}</p>}
              {!step2Clicked ? (
                <div className={styles.stepActions}>
                  <button
                    className={styles.ctaPrimary}
                    onClick={() => { window.open(submitUrl, "_blank", "noopener,noreferrer"); setStep2Clicked(true); }}
                  >
                    Create Post →
                  </button>
                </div>
              ) : (
                <div className={styles.taskConfirm}>
                  <span className={styles.taskConfirmLabel}>Did you create the post?</span>
                  <div className={styles.stepActions}>
                    <button className={styles.ctaPrimary} onClick={() => { setStep2Clicked(false); onStep2Complete(); }}>✓ Task Completed</button>
                    <button className={styles.ctaOutline} onClick={() => setStep2Clicked(false)}>Not Yet</button>
                  </div>
                </div>
              )}
            </>
          )}
        </StepCard>
      </div>
    </div>
  );
}

// ─── Step card ────────────────────────────────────────────────────────────────

function StepCard({
  num, status, title, desc, children,
}: {
  num: number;
  status: "complete" | "active" | "idle";
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`${styles.stepCard} ${styles[`step_${status}`]}`}>
      <div className={styles.stepCardHead}>
        <div className={`${styles.stepIcon} ${styles[`stepIcon_${status}`]}`}>
          {status === "complete" ? "✓" : num}
        </div>
        <div className={styles.stepMeta}>
          <div className={styles.stepRow}>
            <span className={styles.stepLabel}>Step {num}</span>
            {status !== "idle" && (
              <span className={`${styles.statusBadge} ${styles[`badge_${status}`]}`}>
                {status === "complete" ? "Complete" : "Active"}
              </span>
            )}
          </div>
          <div className={styles.stepTitle}>{title}</div>
          <div className={styles.stepDesc}>{desc}</div>
        </div>
      </div>
      <div className={styles.stepBody}>{children}</div>
    </div>
  );
}

// ─── Draft comment ────────────────────────────────────────────────────────────

function DraftComment({ draftComment, postUrl, onComplete }: { draftComment: string; postUrl?: string; onComplete: () => void }) {
  const [text, setText] = useState(draftComment);
  const [copied, setCopied] = useState(false);

  function act() {
    navigator.clipboard?.writeText(text).catch(() => {});
    if (postUrl) window.open(postUrl, "_blank", "noopener,noreferrer");
    setCopied(true);
  }

  return (
    <div className={styles.draftWrap}>
      <textarea
        className={styles.draftTextarea}
        value={text}
        rows={4}
        onChange={e => setText(e.target.value)}
      />
      {!copied ? (
        <div className={styles.stepActions}>
          <button className={styles.ctaPrimary} onClick={act}>Copy & Engage →</button>
        </div>
      ) : (
        <div className={styles.taskConfirm}>
          <span className={styles.taskConfirmLabel}>Did you post the comment?</span>
          <div className={styles.stepActions}>
            <button className={styles.ctaPrimary} onClick={() => { setCopied(false); onComplete(); }}>✓ Task Completed</button>
            <button className={styles.ctaOutline} onClick={() => setCopied(false)}>Not Yet</button>
          </div>
        </div>
      )}
    </div>
  );
}
