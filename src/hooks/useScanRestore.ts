"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { readScanFromSession, clearScanSession, type SavedScan } from "@/lib/scanStorage";

/**
 * Reads a saved scan from sessionStorage once the user is confirmed signed-in.
 * Clears the session entry immediately after reading — one-time bridge across
 * the OAuth redirect.
 *
 * Returns null if there is nothing to restore (fresh visit or already cleared).
 */
export function useScanRestore(): SavedScan | null {
  const { isSignedIn, isLoaded } = useAuth();
  const [savedScan, setSavedScan] = useState<SavedScan | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const saved = readScanFromSession();
    if (!saved) return;
    clearScanSession(); // clear immediately — prevents stale re-reads on future visits
    setSavedScan(saved);
  }, [isLoaded, isSignedIn]);

  return savedScan;
}
