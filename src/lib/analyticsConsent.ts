export const LEGITBOT_ANALYTICS_CONSENT_KEY = "legitbot:analytics-consent";
export const LEGITBOT_ANALYTICS_CONSENT_EVENT = "legitbot-consent-change";

export type AnalyticsConsent = "granted" | "denied" | null;

export function isLegitBotPath(pathname: string | null | undefined): boolean {
  return pathname === "/legitbot" || Boolean(pathname?.startsWith("/legitbot/"));
}

export function getStoredAnalyticsConsent(): AnalyticsConsent {
  if (typeof window === "undefined") return null;

  const value = window.localStorage.getItem(LEGITBOT_ANALYTICS_CONSENT_KEY);
  return value === "granted" || value === "denied" ? value : null;
}

export function canRunAnalytics(pathname: string | null | undefined): boolean {
  if (!pathname) return false;

  // Keep the pre-existing LegitReach/CPO analytics behavior intact. LegitBot
  // adds stricter consent and route exclusions only inside its own namespace.
  if (!isLegitBotPath(pathname)) return true;

  const analyticsEnabled = process.env.NEXT_PUBLIC_LEGITBOT_ANALYTICS_ENABLED === "true";
  const isSensitiveLegitBotRoute =
    pathname === "/legitbot/admin" ||
    pathname.startsWith("/legitbot/admin/") ||
    pathname === "/legitbot/portal" ||
    pathname.startsWith("/legitbot/portal/");

  return Boolean(
    analyticsEnabled &&
      !isSensitiveLegitBotRoute &&
      getStoredAnalyticsConsent() === "granted",
  );
}

export function getSanitizedPageviewUrl(
  origin: string,
  pathname: string | null | undefined,
): string | null {
  if (!pathname) return null;

  const pathOnly = pathname.split(/[?#]/, 1)[0] || "/";
  const normalizedPath = pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`;
  return `${origin.replace(/\/+$/, "")}${normalizedPath}`;
}

export function storeAnalyticsConsent(consent: Exclude<AnalyticsConsent, null>): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(LEGITBOT_ANALYTICS_CONSENT_KEY, consent);
  window.dispatchEvent(
    new CustomEvent(LEGITBOT_ANALYTICS_CONSENT_EVENT, { detail: { consent } }),
  );
}
