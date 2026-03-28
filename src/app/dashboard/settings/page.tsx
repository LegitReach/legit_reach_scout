"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import styles from "./settings.module.css";

export default function SettingsPage() {
    const router = useRouter();
    const { onboarding, updateOnboarding, resetOnboarding, clearDashboardCache, clearMorningCache, syncOnboardingData } = useApp();

    // Local state mirroring onboarding data
    const [keywords, setKeywords] = useState<string[]>(onboarding.keywords || []);
    const [keywordInput, setKeywordInput] = useState("");
    const [businessDesc, setBusinessDesc] = useState<string>(onboarding.oneMinuteBusinessPitch || "");
    const [communities, setCommunities] = useState<string[]>(onboarding.selectedCommunities || []);
    const [communityInput, setCommunityInput] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Fetch new subreddit suggestions
    const [suggestedSubreddits, setSuggestedSubreddits] = useState<string[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    // Sync local state if onboarding changes externally
    useEffect(() => {
        setKeywords(onboarding.keywords || []);
        setBusinessDesc(onboarding.oneMinuteBusinessPitch || "");
        setCommunities(onboarding.selectedCommunities || []);
    }, [onboarding.keywords, onboarding.oneMinuteBusinessPitch, onboarding.selectedCommunities]);

    const addKeyword = () => {
        const v = keywordInput.trim();
        if (v && !keywords.includes(v)) {
            setKeywords([...keywords, v]);
            setKeywordInput("");
        }
    };

    const removeKeyword = (kw: string) => {
        setKeywords(keywords.filter(k => k !== kw));
    };

    const addCommunity = () => {
        const v = communityInput.trim().replace(/^r\//, "");
        if (v && !communities.includes(v)) {
            setCommunities([...communities, v]);
            setCommunityInput("");
        }
    };

    const removeCommunity = (c: string) => {
        setCommunities(communities.filter(x => x !== c));
    };

    const fetchSuggestions = async () => {
        setLoadingSuggestions(true);
        try {
            const res = await fetch("/api/reddit/subreddits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    keywords: keywords.join(","),
                    businessDescription: businessDesc,
                }),
            });
            if (res.redirected) {
                window.location.href = res.url;
                return;
            }
            const data = await res.json();
            setSuggestedSubreddits(data.suggestions || []);
        } catch (error) {
            console.error("Failed to fetch suggestions:", error);
        }
        setLoadingSuggestions(false);
    };

    const handleSave = async () => {
        setSaving(true);
        const newState = {
            ...onboarding,
            keywords,
            oneMinuteBusinessPitch: businessDesc,
            selectedCommunities: communities,
            completed: true,
        };

        updateOnboarding(newState);
        
        // 🚀 SYNC TO CLOUD
        await syncOnboardingData(newState);

        // Clear caches so new data is fetched on next visit
        clearDashboardCache();
        clearMorningCache();
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const handleResetAll = () => {
        if (window.confirm("This will clear all your settings and require you to re-onboard. Continue?")) {
            resetOnboarding();
            router.push("/onboarding");
        }
    };

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1>⚙️ Settings</h1>
                <p>Update your business profile, keywords, and communities</p>
            </header>

            {/* Keywords Section */}
            <section className={styles.section}>
                <h2>🔍 Keywords</h2>
                <p className={styles.sectionDesc}>
                    Keywords help us find relevant Reddit discussions for your business.
                </p>

                <div className={styles.inputGroup}>
                    <input
                        type="text"
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                        placeholder="e.g., 'customer feedback', 'productivity tools'"
                        className={styles.input}
                    />
                    <button onClick={addKeyword} className={styles.addBtn}>Add</button>
                </div>

                <div className={styles.tags}>
                    {keywords.map(kw => (
                        <span key={kw} className={styles.tag}>
                            {kw}
                            <button onClick={() => removeKeyword(kw)}>×</button>
                        </span>
                    ))}
                </div>
            </section>

            {/* Business Description Section */}
            <section className={styles.section}>
                <h2>🏷️ Business Description</h2>
                <p className={styles.sectionDesc}>
                    Describe your business to help our AI surface better opportunities.
                </p>

                <textarea
                    value={businessDesc}
                    onChange={(e) => setBusinessDesc(e.target.value)}
                    placeholder={`Describe what your product or service does, who your ideal customer is, your price point, geographic focus, and what makes you unique.`}
                    className={styles.textarea}
                    rows={6}
                />
            </section>

            {/* Communities Section */}
            <section className={styles.section}>
                <h2>📍 Communities</h2>
                <p className={styles.sectionDesc}>
                    Subreddits we monitor for opportunities.
                </p>

                <div className={styles.inputGroup}>
                    <input
                        type="text"
                        value={communityInput}
                        onChange={(e) => setCommunityInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCommunity())}
                        placeholder="e.g., 'SaaS', 'startups'"
                        className={styles.input}
                    />
                    <button onClick={addCommunity} className={styles.addBtn}>Add</button>
                </div>

                <div className={styles.tags}>
                    {communities.map(c => (
                        <span key={c} className={styles.tag}>
                            r/{c}
                            <button onClick={() => removeCommunity(c)}>×</button>
                        </span>
                    ))}
                </div>

                <button
                    onClick={fetchSuggestions}
                    className={styles.suggestBtn}
                    disabled={loadingSuggestions || keywords.length === 0}
                >
                    {loadingSuggestions ? "Finding suggestions..." : "🔄 Get AI Suggestions"}
                </button>

                {suggestedSubreddits.length > 0 && (
                    <div className={styles.suggestions}>
                        <p className={styles.suggestionsLabel}>Suggested:</p>
                        <div className={styles.subredditGrid}>
                            {suggestedSubreddits.map(sub => (
                                <button
                                    key={sub}
                                    onClick={() => {
                                        if (!communities.includes(sub)) {
                                            setCommunities([...communities, sub]);
                                        }
                                    }}
                                    className={`${styles.subredditBtn} ${communities.includes(sub) ? styles.selected : ""}`}
                                >
                                    {sub}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {/* Actions */}
            <div className={styles.actions}>
                <button
                    onClick={handleSave}
                    className={styles.saveBtn}
                    disabled={saving || keywords.length === 0 || communities.length === 0 || !businessDesc.trim()}
                >
                    {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Changes"}
                </button>

                <button onClick={handleResetAll} className={styles.resetBtn}>
                    Reset All Settings
                </button>
            </div>
        </div>
    );
}
