/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface OnboardingState {
    keywords: string[];
    selectedCommunities: string[];
    neverSay: string[];
    completed: boolean;
    oneMinuteBusinessPitch: string;
    storeUrl: string;
    brandName: string;
    tagline: string;
    targetAudience: string;
    productCategories: string[];
    ogImage: string;
}

const initialOnboardingState: OnboardingState = {
    keywords: [],
    selectedCommunities: [],
    neverSay: [],
    completed: false,
    oneMinuteBusinessPitch: '',
    storeUrl: '',
    brandName: '',
    tagline: '',
    targetAudience: '',
    productCategories: [],
    ogImage: '',
};

const STORAGE_KEY_GUEST = "legitreach_onboarding_guest";
const STORAGE_KEY_USER = "legitreach_onboarding";

interface AppContextValue {
    onboarding: OnboardingState;
    setOnboarding: (state: OnboardingState) => void;
    updateOnboarding: (updates: Partial<OnboardingState>) => void;
    resetOnboarding: () => void;
    cachedDashboardPosts: any[];
    cachedDashboardCurated: any[];
    cachedDashboardSummary: string;
    cachedDashboardMeta: { ts: number; signature: string } | null;
    setDashboardCache: (posts: any[], signature: string, curated?: any[], summary?: string) => void;
    clearDashboardCache: () => void;
    cachedMetaAds: any | null;
    cachedMetaAdsMeta: { ts: number; signature: string } | null;
    setMetaAdsCache: (ads: any, signature: string) => void;
    clearMetaAdsCache: () => void;
    syncOnboardingData: (dataToSync?: OnboardingState) => Promise<boolean>;
    isAppLoaded: boolean;
    activeDashboardJob: { jobId: string; signature: string } | null;
    setDashboardJob: (job: { jobId: string; signature: string } | null) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [onboarding, setOnboarding] = useState<OnboardingState>(initialOnboardingState);
    const [cachedDashboardPosts, setCachedDashboardPosts] = useState<any[]>([]);
    const [cachedDashboardCurated, setCachedDashboardCurated] = useState<any[]>([]);
    const [cachedDashboardSummary, setCachedDashboardSummary] = useState<string>("");
    const [cachedDashboardMeta, setCachedDashboardMeta] = useState<{ ts: number; signature: string } | null>(null);
    const [cachedMetaAds, setCachedMetaAds] = useState<any | null>(null);
    const [cachedMetaAdsMeta, setCachedMetaAdsMeta] = useState<{ ts: number; signature: string } | null>(null);
    const [activeDashboardJob, setActiveDashboardJob] = useState<{ jobId: string; signature: string } | null>(null);

    // Hydrate from localStorage on mount
    useEffect(() => {
        const userStored = localStorage.getItem(STORAGE_KEY_USER);
        const guestStored = localStorage.getItem(STORAGE_KEY_GUEST);
        const stored = userStored || guestStored;
        if (stored) {
            try { setOnboarding(JSON.parse(stored)); } catch { /* ignore */ }
        }

        const dashboard = localStorage.getItem("legitreach_dashboard_cache");
        if (dashboard) {
            try {
                const parsed = JSON.parse(dashboard);
                if (parsed && Array.isArray(parsed.posts) && parsed.ts && parsed.signature) {
                    setCachedDashboardPosts(parsed.posts || []);
                    setCachedDashboardCurated(parsed.curated || []);
                    setCachedDashboardSummary(parsed.summary || "");
                    setCachedDashboardMeta({ ts: parsed.ts, signature: parsed.signature });
                }
            } catch { /* ignore */ }
        }

        const metaAds = localStorage.getItem("legitreach_metaads_cache");
        if (metaAds) {
            try {
                const parsed = JSON.parse(metaAds);
                if (parsed && parsed.ads && parsed.ts && parsed.signature) {
                    setCachedMetaAds(parsed.ads);
                    setCachedMetaAdsMeta({ ts: parsed.ts, signature: parsed.signature });
                }
            } catch { /* ignore */ }
        }
    }, []);

    // Persist onboarding to localStorage on change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(onboarding));
    }, [onboarding]);

    const updateOnboarding = (updates: Partial<OnboardingState>) => {
        setOnboarding(prev => ({ ...prev, ...updates }));
    };

    const resetOnboarding = () => {
        setOnboarding(initialOnboardingState);
        clearDashboardCache();
        clearMetaAdsCache();
        localStorage.removeItem(STORAGE_KEY_GUEST);
        localStorage.removeItem(STORAGE_KEY_USER);
    };

    // No-op — Supabase sync removed (onboarding_details table deprecated)
    const syncOnboardingData = async (_dataToSync?: OnboardingState): Promise<boolean> => false;

    const setDashboardCache = (posts: any[], signature: string, curated?: any[], summary?: string) => {
        const payload = { posts: posts || [], curated: curated || [], summary: summary || "", ts: Date.now(), signature };
        setCachedDashboardPosts(posts || []);
        setCachedDashboardCurated(curated || []);
        setCachedDashboardSummary(summary || "");
        setCachedDashboardMeta({ ts: payload.ts, signature });
        try { localStorage.setItem("legitreach_dashboard_cache", JSON.stringify(payload)); } catch { /* ignore */ }
    };

    const clearDashboardCache = () => {
        setCachedDashboardPosts([]);
        setCachedDashboardCurated([]);
        setCachedDashboardSummary("");
        setCachedDashboardMeta(null);
        try { localStorage.removeItem("legitreach_dashboard_cache"); } catch { /* ignore */ }
    };

    const setMetaAdsCache = (ads: any, signature: string) => {
        const payload = { ads, ts: Date.now(), signature };
        setCachedMetaAds(ads);
        setCachedMetaAdsMeta({ ts: payload.ts, signature });
        try { localStorage.setItem("legitreach_metaads_cache", JSON.stringify(payload)); } catch { /* ignore */ }
    };

    const clearMetaAdsCache = () => {
        setCachedMetaAds(null);
        setCachedMetaAdsMeta(null);
        try { localStorage.removeItem("legitreach_metaads_cache"); } catch { /* ignore */ }
    };

    return (
        <AppContext.Provider value={{
            onboarding,
            setOnboarding,
            updateOnboarding,
            resetOnboarding,
            cachedDashboardPosts,
            cachedDashboardCurated,
            cachedDashboardSummary,
            cachedDashboardMeta,
            setDashboardCache,
            clearDashboardCache,
            cachedMetaAds,
            cachedMetaAdsMeta,
            setMetaAdsCache,
            clearMetaAdsCache,
            syncOnboardingData,
            isAppLoaded: true,
            activeDashboardJob,
            setDashboardJob: (job) => setActiveDashboardJob(job),
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error("useApp must be used within an AppProvider");
    }
    return context;
}