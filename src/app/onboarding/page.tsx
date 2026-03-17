"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import styles from "./onboarding.module.css";
import posthog from "posthog-js";

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
            posthog.capture("onboarding_step_completed", { step: 1, keywords_count: keywords.length });
            setStep(2);
        };

        // Fetch dynamic subreddit suggestions when moving to step 3 (communities)
        const goToStep3 = async () => {
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
                posthog.captureException(error);
            }
            posthog.capture("onboarding_step_completed", { step: 2, business_desc_length: businessDesc.length });
            setLoadingSuggestions(false);
            setStep(3);
        };

        const handleComplete = () => {
            posthog.capture("onboarding_completed", {
                keywords_count: keywords.length,
                communities_count: subreddits.length,
            });
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
                            <p className={styles.stepLabel}>1: Your Brand &gt; 2: Subreddits &gt; 3: Your Insights</p>
                            <h1>🔍 What does your brand sell?</h1>
                            <p>Describe your product in a few words. Our AI uses this to find Reddit conversations where people need exactly what you sell.</p>

                            <div className={styles.inputGroup}>
                                <input
                                    type="text"
                                    value={keywordInput}
                                    onChange={(e) => setKeywordInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                                    placeholder="Example: 'organic dog treats', 'minimalist phone cases', 'postpartum skincare'"
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
                                💡 Not sure what to type? Describe your brand in a sentence.
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
                            <p className={styles.stepLabel}>1: Your Brand &gt; 2: Subreddits &gt; 3: Your Insights</p>
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
                                💡 Tip: Be as descriptive as possible — include what your product or service does, who your ideal customer is, your price point (budget vs. premium), geographic focus (local vs. global), and what makes you unique (e.g., sustainability, speed, ease of use). The more detail you provide, the better we can match you with the right Reddit conversations.
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
                            <p className={styles.stepLabel}>1: Your Brand &gt; 2: Subreddits &gt; 3: Your Insights</p>
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