"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { readScanFromSession, clearScanSession, type SavedScan, type SavedScanSlot } from "@/lib/scanStorage";
import { fetchLastScanFromDb, saveScanToDb, fetchTodayActivity, cacheBlueprintsFromSession, type ActivityProgress } from "@/lib/scanApi";

function mergeActivityIntoSlots(
  slots: SavedScanSlot[],
  activity: ActivityProgress[],
): SavedScanSlot[] {
  return slots.map(slot => {
    const match = activity.find(a => a.subreddit === slot.community.subreddit);
    if (!match) return slot;
    const currentStep: 1 | 2 | "complete" =
      match.step2_completed ? "complete" :
      match.step1_completed ? 2 : 1;
    return { ...slot, currentStep };
  });
}

/**
 * On mount (once Clerk confirms the user is signed in):
 *
 * Path A — post-OAuth redirect (sessionStorage has data):
 *   1. Read + immediately clear sessionStorage (one-time bridge)
 *   2. Restore UI immediately from session data (steps always at 1 for a fresh scan)
 *   3. Save to DB if needed, then propagate scanId back into savedScan
 *
 * Path B — returning signed-in user (no sessionStorage):
 *   1. Fetch last scan from DB (includes scanId)
 *   2. Fetch today's activity and merge step completion into slots
 *   3. Restore UI with correct per-step state
 */
export function useScanRestore(): { savedScan: SavedScan | null; isRestoring: boolean } {
  const { isSignedIn, isLoaded } = useAuth();
  const [savedScan, setSavedScan] = useState<SavedScan | null>(null);
  // Start true so there's no flash of the input screen while Clerk initialises
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      // Clerk is the external source of truth for this loading state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsRestoring(false);
      return;
    }

    async function restore() {
      const sessionScan = readScanFromSession();

      if (sessionScan) {
        clearScanSession();
        setSavedScan(sessionScan);

        const existing = await fetchLastScanFromDb();
        let scanId: number | undefined;

        if (!existing || existing.storeUrl !== sessionScan.storeUrl) {
          const newId = await saveScanToDb(sessionScan);
          scanId = newId ?? undefined;
        } else {
          scanId = existing.scanId;
        }

        if (scanId) setSavedScan(prev => prev ? { ...prev, scanId } : null);
        await cacheBlueprintsFromSession(sessionScan.slots);
        return;
      }

      const dbScan = await fetchLastScanFromDb();
      if (!dbScan) return;

      if (dbScan.scanId) {
        const activity = await fetchTodayActivity(dbScan.scanId);
        if (activity) {
          setSavedScan({ ...dbScan, slots: mergeActivityIntoSlots(dbScan.slots, activity) });
          return;
        }
      }

      setSavedScan(dbScan);
    }

    restore().finally(() => setIsRestoring(false));
  }, [isLoaded, isSignedIn]);

  return { savedScan, isRestoring };
}
