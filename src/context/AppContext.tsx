"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface OnboardingState {
    keywords: string[];
    selectedCommunities: string[];
    neverSay: string[]; // repurposed as search keywords
    completed: boolean;
    oneMinuteBusinessPitch:string;
}

const initialOnboardingState: OnboardingState = {
    keywords: [],
    selectedCommunities: [],
    neverSay: [],
    completed: false,
    oneMinuteBusinessPitch: ''
};

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
    cachedDashboardMeta: { ts: number; signature: string } | null;
    setDashboardCache: (posts: any[], signature: string) => void;
    clearDashboardCache: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [onboarding, setOnboarding] = useState<OnboardingState>(initialOnboardingState);
    const [mounted, setMounted] = useState(false);
    const [cachedMorningPosts, setCachedMorningPosts] = useState<any[]>([]);
    const [cachedMorningMeta, setCachedMorningMeta] = useState<{ ts: number; signature: string } | null>(null);
    const [cachedDashboardPosts, setCachedDashboardPosts] = useState<any[]>([]);
    const [cachedDashboardMeta, setCachedDashboardMeta] = useState<{ ts: number; signature: string } | null>(null);

    // Load from localStorage on mount
    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem("legitreach_onboarding");
        if (stored) {
            try {
                setOnboarding(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse stored onboarding state");
            }
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
            localStorage.setItem("legitreach_onboarding", JSON.stringify(onboarding));
        }
    }, [onboarding, mounted]);

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

    const setDashboardCache = (posts: any[], signature: string) => {
        const payload = { posts: posts || [], ts: Date.now(), signature };
        setCachedDashboardPosts(posts || []);
        setCachedDashboardMeta({ ts: payload.ts, signature });
        try {
            localStorage.setItem("legitreach_dashboard_cache", JSON.stringify(payload));
        } catch (e) {
            console.error("Failed to persist dashboard cache", e);
        }
    };

    const clearDashboardCache = () => {
        setCachedDashboardPosts([]);
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
        // dashboard depends on onboarding keywords/communities; clear to be safe
        if (cachedDashboardMeta) {
            clearDashboardCache();
        }
    }, [onboarding.keywords, onboarding.oneMinuteBusinessPitch, onboarding.selectedCommunities]);

    const resetOnboarding = () => {
        setOnboarding(initialOnboardingState);
        localStorage.removeItem("legitreach_onboarding");
        localStorage.removeItem("legitreach_saved");
        localStorage.removeItem("legitreach_responded");
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
