"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import styles from "./onboarding.module.css";

export default function OnboardingPage() {
    
        const router = useRouter();
        const { updateOnboarding, onboarding } = useApp();
        const [step, setStep] = useState(1);

        // Form state
        const [keywords, setKeywords] = useState<string[]>(onboarding.keywords || []);
        const [keywordInput, setKeywordInput] = useState("");
        const [subreddits, setSubreddits] = useState<string[]>(onboarding.selectedCommunities || []);
        const [businessDesc, setBusinessDesc] = useState<string>(onboarding.oneMinuteBusinessPitch || "");

        // Dynamic suggestions
        const [suggestedSubreddits, setSuggestedSubreddits] = useState<string[]>([]);
        const [loadingSuggestions, setLoadingSuggestions] = useState(false);

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

        const toggleSubreddit = (sub: string) => {
            if (subreddits.includes(sub)) {
                setSubreddits(subreddits.filter(s => s !== sub));
            } else {
                setSubreddits([...subreddits, sub]);
            }
        };

        // Navigate to business description step
        const goToBusinessStep = () => {
            setStep(2);
        };

        // Fetch dynamic subreddit suggestions when moving to step 3 (communities)
        const goToStep3 = async () => {
            setLoadingSuggestions(true);
            try {
                const res = await fetch(`/api/reddit/subreddits?keywords=${encodeURIComponent(keywords.join(","))}`);
                if (res.redirected) {
                    // server is redirecting to auth page
                    window.location.href = res.url;
                    return;
                }

                const data = await res.json();
                setSuggestedSubreddits(data.suggestions || []);
            } catch (error) {
                console.error("Failed to fetch suggestions:", error);
            }
            setLoadingSuggestions(false);
            setStep(3);
        };

        const handleComplete = () => {
            updateOnboarding({
                selectedCommunities: subreddits,
                keywords: keywords, // repurposed as search keywords
                oneMinuteBusinessPitch: businessDesc,
                completed: true,
            });
            router.push("/dashboard");
        };

        // Skip onboarding if already completed
        useEffect(() => {
            if (onboarding.completed) {
                router.push("/dashboard");
            }
        }, [onboarding.completed, router]);

        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    {/* Progress */}
                    <div className={styles.progress}>
                        <div className={`${styles.progressStep} ${step >= 1 ? styles.active : ""}`}>1</div>
                        <div className={styles.progressLine}></div>
                        <div className={`${styles.progressStep} ${step >= 2 ? styles.active : ""}`}>2</div>
                        <div className={styles.progressLine}></div>
                        <div className={`${styles.progressStep} ${step >= 3 ? styles.active : ""}`}>3</div>
                    </div>

                    {step === 1 && (
                        <div className={styles.stepContent}>
                            <h1>🔍 What are you looking for?</h1>
                            <p>Add keywords related to your product or the problems you solve.</p>

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

                            <p className={styles.hint}>
                                💡 These keywords help us find relevant Reddit discussions
                            </p>

                            <div className={styles.actions}>
                                <button
                                    onClick={goToBusinessStep}
                                    className={styles.nextBtn}
                                    disabled={keywords.length === 0}
                                >
                                    Describe your business →
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className={styles.stepContent}>
                            <h1>🏷️ Describe your business</h1>
                            <p>Help us surface better opportunities by describing your business.</p>

                            <textarea
                                value={businessDesc}
                                onChange={(e) => setBusinessDesc(e.target.value)}
                                placeholder={`Add  "signals" like your price point (luxury vs. budget), geographic focus (local vs. global), and unique selling proposition (sustainability, safety, or ease of use).`}
                                className={styles.input}
                                rows={6}
                            />

                            <p className={styles.hint}>
                                Tip: short, 1–2 sentence description works best.
                            </p>

                            <div className={styles.actions}>
                                <button onClick={() => setStep(1)} className={styles.backBtn}>
                                    ← Back
                                </button>
                                <button
                                    onClick={goToStep3}
                                    className={styles.completeBtn}
                                    disabled={!businessDesc.trim() || loadingSuggestions}
                                >
                                    {loadingSuggestions ? (
                                        <>
                                            <span className={styles.spinner} style={{width:18,height:18,borderWidth:2,marginRight:8}}></span>
                                            Finding communities...
                                        </>
                                    ) : (
                                        'Find Communities →'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className={styles.stepContent}>
                            <h1>📍 Recommended Communities</h1>
                            <p>Based on your keywords, here are relevant subreddits:</p>

                            {loadingSuggestions ? (
                                <div className={styles.loadingContainer}>
                                    <div className={styles.spinner}></div>
                                    <p>Finding relevant communities...</p>
                                </div>
                            ) : (
                                <>
                                    <div className={styles.subredditGrid}>
                                        {suggestedSubreddits.map(sub => (
                                            <button
                                                key={sub}
                                                onClick={() => toggleSubreddit(sub)}
                                                className={`${styles.subredditBtn} ${subreddits.includes(sub) ? styles.selected : ""}`}
                                            >
                                                <span className={styles.subName}>{sub}</span>
                                            </button>
                                        ))}
                                    </div>

                                    <p className={styles.hint}>Selected: {subreddits.length} communities</p>
                                </>
                            )}

                            <div className={styles.actions}>
                                <button onClick={() => setStep(2)} className={styles.backBtn}>
                                    ← Back
                                </button>
                                <button
                                    onClick={handleComplete}
                                    className={styles.completeBtn}
                                    disabled={subreddits.length === 0 || loadingSuggestions}
                                >
                                    Start Finding Opportunities 🚀
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
}