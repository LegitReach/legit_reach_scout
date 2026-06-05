"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { readScanFromSession, clearScanSession, type SavedScan } from "@/lib/scanStorage";
import { fetchLastScanFromDb, saveScanToDb, cacheBlueprintsFromSession } from "@/lib/scanApi";

/**
 * On mount (once Clerk confirms the user is signed in):
 *
 * Path A — post-OAuth redirect (sessionStorage has data):
 *   1. Read + immediately clear sessionStorage (one-time bridge)
 *   2. Restore UI from that data
 *   3. Fetch existing DB record — save only if storeUrl differs (avoids duplicate writes)
 *
 * Path B — returning signed-in user (no sessionStorage):
 *   1. Fetch last scan from DB
 *   2. Restore UI from DB data if present
 */
export function useScanRestore(): SavedScan | null {
  const { isSignedIn, isLoaded } = useAuth();
  const [savedScan, setSavedScan] = useState<SavedScan | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    async function restore() {
      const sessionScan = readScanFromSession();

      if (sessionScan) {
        clearScanSession();
        setSavedScan(sessionScan);

        const existing = await fetchLastScanFromDb();
        if (!existing || existing.storeUrl !== sessionScan.storeUrl) {
          await saveScanToDb(sessionScan);
        }

        // Blueprints were generated pre-auth and never reached Redis.
        // Cache them now so the next page load is a cache hit.
        await cacheBlueprintsFromSession(sessionScan.slots);
        return;
      }

      // No session data — returning user, try DB
      const dbScan = await fetchLastScanFromDb();
      if (dbScan) setSavedScan(dbScan);
    }

    restore();
  }, [isLoaded, isSignedIn]);

  return savedScan;
}
