"use client";

import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect, useState } from "react";
import {
  canRunAnalytics,
  getSanitizedPageviewUrl,
  LEGITBOT_ANALYTICS_CONSENT_EVENT,
} from "@/lib/analyticsConsent";

let initialized = false;

function initializePostHog() {
  if (initialized || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: "/ingest",
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    defaults: "2026-01-30",
    person_profiles: "identified_only",
    capture_pageview: false,
    autocapture: false,
    disable_session_recording: true,
    capture_exceptions: false,
    debug: process.env.NODE_ENV === "development",
  });
  initialized = true;
  window.posthog = posthog;
}

function useAnalyticsPermission() {
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const refresh = () => setAllowed(canRunAnalytics(pathname));
    refresh();
    window.addEventListener(LEGITBOT_ANALYTICS_CONSENT_EVENT, refresh);
    return () => window.removeEventListener(LEGITBOT_ANALYTICS_CONSENT_EVENT, refresh);
  }, [pathname]);

  return allowed;
}

export function PostHogPageView() {
  const pathname = usePathname();
  const { isLoaded, isSignedIn, user } = useUser();
  const allowed = useAnalyticsPermission();

  useEffect(() => {
    if (!allowed) {
      if (initialized) posthog.opt_out_capturing();
      return;
    }
    initializePostHog();
    if (!initialized) return;
    posthog.opt_in_capturing();

    if (isLoaded && isSignedIn && user) {
      posthog.identify(user.id);
    } else if (isLoaded && !isSignedIn) {
      posthog.reset();
    }
  }, [allowed, isLoaded, isSignedIn, user]);

  useEffect(() => {
    if (!allowed || !pathname) return;
    initializePostHog();
    if (!initialized) return;

    const url = getSanitizedPageviewUrl(window.origin, pathname);
    if (!url) return;
    posthog.capture("$pageview", { $current_url: url });
  }, [allowed, pathname]);

  return null;
}

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
  const allowed = useAnalyticsPermission();

  useEffect(() => {
    if (allowed) initializePostHog();
  }, [allowed]);

  if (!allowed) return children;
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}

declare global {
  interface Window {
    posthog?: typeof posthog;
  }
}
