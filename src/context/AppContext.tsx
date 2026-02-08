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
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [onboarding, setOnboarding] = useState<OnboardingState>(initialOnboardingState);
    const [mounted, setMounted] = useState(false);

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
