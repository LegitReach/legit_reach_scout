"use client";

import { useState } from "react";
import type { CommunitySlot } from "../types";
import { stanceColor, stanceBg } from "../utils";
import { StepCard } from "./StepCard";
import { DraftComment } from "./DraftComment";
import styles from "../dashboard.module.css";

export function BlueprintPanel({
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
  const [step2Clicked, setStep2Clicked] = useState(false);
  const { community, data } = slot;
  if (!data) return null;
  const { engagement, creation } = data;
  const sc = stanceColor(community.promotionStance);
  const sb = stanceBg(community.promotionStance);
  const step1Done = slot.currentStep === 2 || slot.currentStep === "complete";
  const step2Done = slot.currentStep === "complete";

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
                <p className={styles.suggestedTitle}>&ldquo;{creation.suggestedTitle}&rdquo;</p>
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
              <p className={styles.suggestedTitle}>&ldquo;{creation.suggestedTitle}&rdquo;</p>
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
                    disabled={!step1Done}
                    onClick={() => { window.open(submitUrl, "_blank", "noopener,noreferrer"); setStep2Clicked(true); }}
                  >
                    Create Post
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
