const SESSION_KEY = "lr_scan_state";

export interface SavedScanSlot {
  community: {
    subreddit: string;
    selectionReason: string;
    promotionStance: "friendly" | "neutral" | "strict";
    promotionStanceReason: string;
    alignmentType: "product" | "identity" | "problem";
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any; // CurateData | null — cast by the consumer
  currentStep: 1 | 2 | "complete";
}

export interface SavedScan {
  scanId?: number;
  storeUrl: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  brandProfile: any;
  slots: SavedScanSlot[];
}

export function saveScanToSession(scan: SavedScan): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(scan));
  } catch { /* storage full or unavailable */ }
}

export function readScanFromSession(): SavedScan | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SavedScan) : null;
  } catch { return null; }
}

export function clearScanSession(): void {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
}
