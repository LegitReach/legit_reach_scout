"use client";

import { useRef } from "react";
import styles from "./legitbot.module.css";

export function PitchDeckDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

  return (
    <>
      <button
        className={styles.secondaryLink}
        type="button"
        aria-controls="legitreach-pitch-deck"
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
      >
        KNOW MORE
      </button>
      <dialog
        aria-labelledby="legitreach-pitch-deck-title"
        className={styles.deckDialog}
        id="legitreach-pitch-deck"
        ref={dialogRef}
      >
        <header className={styles.deckDialogHeader}>
          <span id="legitreach-pitch-deck-title">LEGITREACH · PITCH DECK</span>
          <div className={styles.deckDialogActions}>
            <button
              className={styles.deckDialogAction}
              type="button"
              onClick={() => frameRef.current?.contentWindow?.print()}
            >
              DOWNLOAD PDF
            </button>
            <button
              className={styles.deckDialogClose}
              type="button"
              aria-label="Close pitch deck"
              onClick={() => dialogRef.current?.close()}
            >
              ×
            </button>
          </div>
        </header>
        <iframe ref={frameRef} src="/deck.html" title="LegitReach pitch deck" />
      </dialog>
    </>
  );
}
