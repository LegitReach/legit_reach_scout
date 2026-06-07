import type { SavedScan, SavedScanSlot } from "./scanStorage";

export interface ActivityProgress {
  subreddit: string;
  step1_completed: boolean;
  step2_completed: boolean;
}

export async function fetchLastScanFromDb(): Promise<SavedScan | null> {
  try {
    const res = await fetch("/api/scan");
    if (!res.ok) return null;
    const body = await res.json();
    if (!body.data) return null;
    return {
      scanId:       body.data.id,
      storeUrl:     body.data.store_url,
      brandProfile: body.data.brand_profile,
      slots:        (body.data.communities as any[]).map((s: any) => ({
        community:   s.community,
        data:        null,
        currentStep: 1 as const,
      })),
    };
  } catch { return null; }
}

export async function saveScanToDb(scan: SavedScan): Promise<number | null> {
  try {
    const res = await fetch("/api/scan", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        storeUrl:     scan.storeUrl,
        brandProfile: scan.brandProfile,
        slots:        scan.slots,
      }),
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body.scanId ?? null;
  } catch { return null; }
}

export async function fetchTodayActivity(scanId: number): Promise<ActivityProgress[] | null> {
  try {
    const res = await fetch(`/api/activity?scanId=${scanId}`);
    if (!res.ok) return null;
    const body = await res.json();
    return body.progress ?? null;
  } catch { return null; }
}

export async function saveActivityToDb(scanId: number, progress: ActivityProgress[]): Promise<void> {
  try {
    await fetch("/api/activity", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ scanId, progress }),
    });
  } catch { /* non-critical */ }
}

// Writes pre-computed blueprints to Redis after OAuth sign-in.
// Slots with null data are skipped silently.
export async function cacheBlueprintsFromSession(slots: SavedScanSlot[]): Promise<void> {
  try {
    await fetch("/api/blueprint/cache", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ slots }),
    });
  } catch { /* non-critical */ }
}
