"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  getStoredAnalyticsConsent,
  LEGITBOT_ANALYTICS_CONSENT_EVENT,
  storeAnalyticsConsent,
  type AnalyticsConsent,
} from "@/lib/analyticsConsent";
import styles from "./legitbot.module.css";

function readConsent(): AnalyticsConsent | null {
  try {
    return getStoredAnalyticsConsent();
  } catch {
    return null;
  }
}

function subscribeToConsent(onStoreChange: () => void) {
  window.addEventListener(LEGITBOT_ANALYTICS_CONSENT_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(LEGITBOT_ANALYTICS_CONSENT_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function ConsentBanner() {
  const consent = useSyncExternalStore(subscribeToConsent, readConsent, () => null);
  const [openOverride, setOpenOverride] = useState<boolean | null>(null);
  const open = openOverride ?? consent === null;

  function choose(next: Exclude<AnalyticsConsent, null>) {
    const previous = consent;
    try {
      storeAnalyticsConsent(next);
    } catch {
      // The in-memory choice still applies for the current page session.
    }
    setOpenOverride(false);
    if (previous === "granted" && next === "denied") {
      window.location.reload();
    }
  }

  return (
    <>
      {open ? (
        <section
          className={styles.consentBanner}
          aria-labelledby="legitbot-consent-title"
          aria-describedby="legitbot-consent-description"
        >
          <div className={styles.consentCopy}>
            <p className={styles.consentTitle} id="legitbot-consent-title">
              Privacy choices
            </p>
            <p id="legitbot-consent-description">
              We save this choice. If you allow it, analytics help us improve the site.
              We never send DM or email text to analytics. <Link href="/legitbot/legal/privacy">Privacy notice</Link>
            </p>
          </div>
          <div className={styles.consentActions}>
            <button className={styles.secondaryButton} type="button" onClick={() => choose("denied")}>
              Necessary only
            </button>
            <button className={styles.primaryButton} type="button" onClick={() => choose("granted")}>
              Allow analytics
            </button>
          </div>
        </section>
      ) : consent ? (
        <button
          className={styles.consentReopen}
          type="button"
          onClick={() => setOpenOverride(true)}
          aria-label={`Privacy choices. Analytics currently ${consent}.`}
        >
          Privacy choices
        </button>
      ) : null}
    </>
  );
}
