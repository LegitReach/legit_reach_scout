"use client";

import { useState, useEffect } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

const STORAGE_KEY = "lr_fp_id";

export function useFingerprint(): string | null {
  const [fingerprintId, setFingerprintId] = useState<string | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      // Hydrate the external browser-stored identifier after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFingerprintId(cached);
      return;
    }

    FingerprintJS.load()
      .then(fp => fp.get())
      .then(result => {
        localStorage.setItem(STORAGE_KEY, result.visitorId);
        setFingerprintId(result.visitorId);
      })
      .catch(() => {
        // FingerprintJS unavailable — fall back to a stable random ID
        const fallback = crypto.randomUUID();

        localStorage.setItem(STORAGE_KEY, fallback);
        setFingerprintId(fallback);
      });
  }, []);

  return fingerprintId;
}
