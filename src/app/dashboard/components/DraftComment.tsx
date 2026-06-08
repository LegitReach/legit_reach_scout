"use client";

import { useState } from "react";
import styles from "../dashboard.module.css";

export function DraftComment({
  draftComment,
  postUrl,
  onComplete,
}: {
  draftComment: string;
  postUrl?: string;
  onComplete: () => void;
}) {
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
          <button className={styles.ctaPrimary} onClick={act}>Copy & Engage</button>
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
