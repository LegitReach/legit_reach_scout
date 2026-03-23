"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@clerk/nextjs";

interface OnboardingState {
    keywords: string[];
    selectedCommunities: string[];
    neverSay: string[]; // repurposed as search keywords
    completed: boolean;
    oneMinuteBusinessPitch: string;
}

const initialOnboardingState: OnboardingState = {
    keywords: [],
    selectedCommunities: [],
    neverSay: [],
    completed: false,
    oneMinuteBusinessPitch: ''
};

const STORAGE_KEY_GUEST = "legitreach_onboarding_guest";
const STORAGE_KEY_USER = "legitreach_onboarding";

interface AppContextValue {
    onboarding: OnboardingState;
    setOnboarding: (state: OnboardingState) => void;
    updateOnboarding: (updates: Partial<OnboardingState>) => void;
    resetOnboarding: () => void;
    cachedMorningPosts: any[];
    cachedMorningMeta: { ts: number; signature: string } | null;
    setMorningCache: (posts: any[], signature: string) => void;
    clearMorningCache: () => void;
    cachedDashboardPosts: any[];
    cachedDashboardCurated: any[];
    cachedDashboardSummary: string;
    cachedDashboardMeta: { ts: number; signature: string } | null;
    setDashboardCache: (posts: any[], signature: string, curated?: any[], summary?: string) => void;
    clearDashboardCache: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [onboarding, setOnboarding] = useState<OnboardingState>(initialOnboardingState);
    const [mounted, setMounted] = useState(false);
    const [cachedMorningPosts, setCachedMorningPosts] = useState<any[]>([]);
    const [cachedMorningMeta, setCachedMorningMeta] = useState<{ ts: number; signature: string } | null>(null);
    const [cachedDashboardPosts, setCachedDashboardPosts] = useState<any[]>([]);
    const [cachedDashboardCurated, setCachedDashboardCurated] = useState<any[]>([]);
    const [cachedDashboardSummary, setCachedDashboardSummary] = useState<string>("");
    const [cachedDashboardMeta, setCachedDashboardMeta] = useState<{ ts: number; signature: string } | null>(null);
    const [prevSignedIn, setPrevSignedIn] = useState(false);
    const { isLoaded, isSignedIn } = useAuth();

    // 🔄 Sync logic and Reset Protection
    useEffect(() => {
        if (!isLoaded || !mounted) return;

        // 1. Detection: SIGN OUT
        // We only reset if they were previously signed in. 
        // This prevents guests from being reset on every page load.
        if (prevSignedIn && !isSignedIn) {
            resetOnboarding();
        }

        // 2. Detection: SIGN IN (Sync or Hydrate)
        if (!prevSignedIn && isSignedIn) {
            // Check if we have guest trial data that needs "Claiming"
            const guestDataRaw = localStorage.getItem(STORAGE_KEY_GUEST);
            const userDataRaw = localStorage.getItem(STORAGE_KEY_USER);



            if (guestDataRaw && guestDataRaw !== JSON.stringify(initialOnboardingState)) {
                // Scenario: User just did a trial, now they signed in. 
                // We PUSH the trial data to the cloud.
                try {
                    const guestData = JSON.parse(guestDataRaw);
                    syncOnboardingData(guestData);
                } catch (e) {
                    console.error("Failed to parse guest data for sync", e);
                }
            } else if (!userDataRaw || userDataRaw === JSON.stringify(initialOnboardingState)) {
                // Scenario: User signed in on a new device with no local data. 
                // We FETCH their account data from the cloud.
                console.log("Fetching cloud onboarding");
                fetchCloudOnboarding();
            }
        }

        setPrevSignedIn(isSignedIn);
    }, [isLoaded, isSignedIn, mounted, prevSignedIn]);

    // Load from localStorage on mount
    useEffect(() => {
        setMounted(true);

        // Priority 1: Signed-in User Data
        // Priority 2: Guest Data (if not signed in)
        const userStored = localStorage.getItem(STORAGE_KEY_USER);
        const guestStored = localStorage.getItem(STORAGE_KEY_GUEST);

        if (isSignedIn && userStored) {
            try { setOnboarding(JSON.parse(userStored)); } catch (e) { }
        } else if (guestStored) {
            try { setOnboarding(JSON.parse(guestStored)); } catch (e) { }
        }

        const morning = localStorage.getItem("legitreach_morning_cache");
        if (morning) {
            try {
                const parsed = JSON.parse(morning);
                if (parsed && Array.isArray(parsed.posts) && parsed.ts && parsed.signature) {
                    setCachedMorningPosts(parsed.posts || []);
                    setCachedMorningMeta({ ts: parsed.ts, signature: parsed.signature });
                }
            } catch (e) {
                console.error("Failed to parse stored morning cache");
            }
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
            } catch (e) {
                console.error("Failed to parse stored dashboard cache");
            }
        }
    }, []);

    // Save to localStorage on change
    useEffect(() => {
        if (mounted) {
            const key = isSignedIn ? STORAGE_KEY_USER : STORAGE_KEY_GUEST;
            localStorage.setItem(key, JSON.stringify(onboarding));
        }
    }, [onboarding, mounted, isSignedIn]);

    const updateOnboarding = (updates: Partial<OnboardingState>) => {
        setOnboarding(prev => ({ ...prev, ...updates }));
    };

    const setMorningCache = (posts: any[], signature: string) => {
        const payload = { posts: posts || [], ts: Date.now(), signature };
        setCachedMorningPosts(posts || []);
        setCachedMorningMeta({ ts: payload.ts, signature });
        try {
            localStorage.setItem("legitreach_morning_cache", JSON.stringify(payload));
        } catch (e) {
            console.error("Failed to persist morning cache", e);
        }
    };

    const clearMorningCache = () => {
        setCachedMorningPosts([]);
        setCachedMorningMeta(null);
        try {
            localStorage.removeItem("legitreach_morning_cache");
        } catch (e) {
            console.error("Failed to clear morning cache", e);
        }
    };

    const setDashboardCache = (posts: any[], signature: string, curated?: any[], summary?: string) => {
        const payload = {
            posts: posts || [],
            curated: curated || [],
            summary: summary || "",
            ts: Date.now(),
            signature
        };
        setCachedDashboardPosts(posts || []);
        setCachedDashboardCurated(curated || []);
        setCachedDashboardSummary(summary || "");
        setCachedDashboardMeta({ ts: payload.ts, signature });
        try {
            localStorage.setItem("legitreach_dashboard_cache", JSON.stringify(payload));
        } catch (e) {
            console.error("Failed to persist dashboard cache", e);
        }
    };

    const clearDashboardCache = () => {
        setCachedDashboardPosts([]);
        setCachedDashboardCurated([]);
        setCachedDashboardSummary("");
        setCachedDashboardMeta(null);
        try {
            localStorage.removeItem("legitreach_dashboard_cache");
        } catch (e) {
            console.error("Failed to clear dashboard cache", e);
        }
    };

    // Invalidate caches when onboarding-relevant data changes
    useEffect(() => {
        const signature = JSON.stringify([onboarding.keywords, onboarding.oneMinuteBusinessPitch, onboarding.selectedCommunities]);
        if (cachedMorningMeta && cachedMorningMeta.signature !== signature) {
            clearMorningCache();
        }
        // dashboard depends on onboarding keywords/communities
        if (cachedDashboardMeta && cachedDashboardMeta.signature !== signature) {
            clearDashboardCache();
        }
    }, [onboarding.keywords, onboarding.oneMinuteBusinessPitch, onboarding.selectedCommunities]);

    const resetOnboarding = () => {
        setOnboarding(initialOnboardingState);
        clearMorningCache();
        clearDashboardCache();
        localStorage.removeItem(STORAGE_KEY_GUEST);
        localStorage.removeItem(STORAGE_KEY_USER);
        localStorage.removeItem("legitreach_responded");
        localStorage.removeItem("lr_onboarding_synced");
    };

    const syncOnboardingData = async (dataToSync = onboarding) => {
        // Only sync if there is actually data (keywords or pitch)
        if (!dataToSync.oneMinuteBusinessPitch && dataToSync.keywords.length === 0) {
            return;
        }

        try {
            const res = await fetch("/api/user/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dataToSync),
            });
            if (res.ok) {
                console.log("☁️ Onboarding synced to Supabase profile.");

                // ✅ MOVE: Save to USER_KEY and delete GUEST_KEY
                localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(dataToSync));
                localStorage.removeItem(STORAGE_KEY_GUEST);
                localStorage.setItem("lr_onboarding_synced", "true");
            }
        } catch (e) {
            console.error("Failed to sync onboarding to cloud", e);
        }
    };

    const fetchCloudOnboarding = async () => {
        try {
            const res = await fetch("/api/user/sync");
            const body = await res.json();

            if (body.success && body.data) {
                const cloud = body.data;
                // 🗺️ Mapping DB columns (subreddits, business_pitch) back to State keys
                const cloudState: OnboardingState = {
                    keywords: cloud.keywords || [],
                    selectedCommunities: cloud.subreddits || [],
                    neverSay: [],
                    completed: true,
                    oneMinuteBusinessPitch: cloud.business_pitch || ""
                };

                setOnboarding(cloudState);

                // ✅ Update the USER_KEY so we don't fetch on every refresh
                localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(cloudState));
                localStorage.setItem("lr_onboarding_synced", "true");
                console.log("🌊 Account data hydrated from Supabase.");
            }
        } catch (e) {
            console.error("Failed to hydrate from cloud", e);
        }
    };

    return (
        <AppContext.Provider value={{
            onboarding,
            setOnboarding,
            updateOnboarding,
            resetOnboarding,
            cachedMorningPosts,
            cachedMorningMeta,
            setMorningCache,
            clearMorningCache,
            cachedDashboardPosts,
            cachedDashboardCurated,
            cachedDashboardSummary,
            cachedDashboardMeta,
            setDashboardCache,
            clearDashboardCache,
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
