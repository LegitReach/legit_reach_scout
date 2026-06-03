"use client";

import { useState, useRef, useCallback } from "react";
import styles from "./dashboard.module.css";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  sentiment: { post: RedditPost; communityInsight: string };
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
}

type Phase = "idle" | "scanning" | "ready" | "error";

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
  const [phase, setPhase]         = useState<Phase>("idle");
  const [url, setUrl]             = useState("");
  const [scanLog, setScanLog]     = useState<string[]>([]);
  const [slots, setSlots]         = useState<CommunitySlot[]>([]);
  const [selectedIdx, setSelected] = useState(0);
  const [errorMsg, setErrorMsg]   = useState("");
  const cancelRef = useRef(false);

  const run = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    cancelRef.current = false;
    setPhase("scanning");
    setScanLog([]);
    setSlots([]);
    setSelected(0);
    setErrorMsg("");

    try {
      // ── Phase 1: magic-scan ─────────────────────────────────────────────────
      const scanRes = await fetch("/api/tech-week/magic-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      if (!scanRes.ok) throw new Error(`Scan failed (${scanRes.status})`);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let brandProfile: any = null;
      let communities: SelectedCommunity[] = [];

      for await (const ev of readSSE(scanRes)) {
        if (cancelRef.current) return;
        if (ev.type === "step" && ev.status === "done") {
          setScanLog(p => [...p, ev.msg]);
        } else if (ev.type === "fatal") {
          throw new Error(ev.msg);
        } else if (ev.type === "result") {
          brandProfile  = ev.data.brandProfile;
          communities   = ev.data.communities;
        }
      }

      if (!brandProfile || !communities.length) throw new Error("No communities found for this URL.");

      // Seed loading slots and switch to ready phase
      setSlots(communities.map(c => ({ community: c, data: null, loading: true, failed: false })));
      setPhase("ready");

      // ── Phase 2: curate all communities in parallel ─────────────────────────
      await Promise.allSettled(
        communities.map(async (comm, idx) => {
          try {
            const res = await fetch("/api/tech-week/curate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ brandProfile, community: comm }),
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
        })
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setPhase("error");
    }
  }, [url]);

  // ── Idle / error ─────────────────────────────────────────────────────────────
  if (phase === "idle" || phase === "error") {
    return (
      <div className={styles.inputScreen}>
        <div className={styles.inputCard}>
          <div className={styles.inputLogo}>LegitReach</div>
          <h1 className={styles.inputHeading}>Community Engagement Blueprint</h1>
          <p className={styles.inputSub}>
            Enter your brand URL and we'll discover your best Reddit communities
            and generate a 3-step engagement blueprint for each.
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
                      <span className={styles.metaFailed}>Failed</span>
                    ) : (
                      <span className={styles.stepBadge}>Step 2</span>
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
              Could not load blueprint for {selected.community.subreddit}.
            </div>
          ) : (
            <BlueprintPanel slot={selected} />
          )
        }
      </main>
    </div>
  );
}

// ─── Blueprint panel ──────────────────────────────────────────────────────────

function BlueprintPanel({ slot }: { slot: CommunitySlot }) {
  const { community, data } = slot;
  if (!data) return null;
  const { sentiment, engagement, creation } = data;
  const sc = stanceColor(community.promotionStance);
  const sb = stanceBg(community.promotionStance);

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
        3-Step Blueprint
        <span className={styles.blueprintHeadingSub}>
          Follow this proven process to build authentic presence in {community.subreddit}
        </span>
      </div>

      {/* Steps */}
      <div className={styles.steps}>
        <StepCard num={1} status="complete" title="Read & Understand" desc="Explore posts to understand what this community values">
          <p className={styles.insight}>{sentiment.communityInsight}</p>
          {sentiment.post && (
            <a href={sentiment.post.url} target="_blank" rel="noopener noreferrer" className={styles.postLink}>
              ↳ {sentiment.post.title}
            </a>
          )}
          <div className={styles.stepActions}>
            <a href={sentiment.post?.url} target="_blank" rel="noopener noreferrer" className={styles.ctaOutline}>
              Read Thread →
            </a>
          </div>
        </StepCard>

        <StepCard num={2} status="active" title="Engage Authentically" desc="Comment thoughtfully and upvote valuable discussions">
          <p className={styles.insight}>{engagement.whyThisPost}</p>
          {engagement.post && (
            <a href={engagement.post.url} target="_blank" rel="noopener noreferrer" className={styles.postLink}>
              ↳ {engagement.post.title}
            </a>
          )}
          <DraftComment draftComment={engagement.draftComment} postUrl={engagement.post?.url} />
        </StepCard>

        <StepCard num={3} status="idle" title="Create & Contribute" desc="Share insights aligned with your business and community interests">
          <p className={styles.suggestedTitle}>"{creation.suggestedTitle}"</p>
          {creation.contentOutline.length > 0 && (
            <ul className={styles.outline}>
              {creation.contentOutline.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          )}
          {creation.postingTips && <p className={styles.tips}>{creation.postingTips}</p>}
          <div className={styles.stepActions}>
            <a
              href={`https://www.reddit.com/r/${community.subreddit.replace(/^r\//, "")}/submit`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaPrimary}
            >
              Create Post →
            </a>
          </div>
        </StepCard>
      </div>

      {/* What to avoid */}
      {creation.whatToAvoid.length > 0 && (
        <div className={styles.avoidSection}>
          <div className={styles.avoidTitle}>Community-Specific Tips</div>
          <ul className={styles.avoidList}>
            {creation.whatToAvoid.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </div>
      )}
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

function DraftComment({ draftComment, postUrl }: { draftComment: string; postUrl?: string }) {
  const [text, setText] = useState(draftComment);
  const [label, setLabel] = useState("Copy & Engage →");

  function act() {
    navigator.clipboard?.writeText(text).catch(() => {});
    setLabel("Copied!");
    setTimeout(() => setLabel("Copy & Engage →"), 2000);
    if (postUrl) window.open(postUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className={styles.draftWrap}>
      <textarea
        className={styles.draftTextarea}
        value={text}
        rows={4}
        onChange={e => setText(e.target.value)}
      />
      <div className={styles.stepActions}>
        <button className={styles.ctaPrimary} onClick={act}>{label}</button>
      </div>
    </div>
  );
}
