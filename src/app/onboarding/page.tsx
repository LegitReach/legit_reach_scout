"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import styles from "./onboarding.module.css";

interface SubredditSuggestion {
    name: string;
    display: string;
    relevance: number;
}

export default function OnboardingPage() {
    const router = useRouter();
    const { updateOnboarding, onboarding } = useApp();
    const [step, setStep] = useState(1);

    // Form state
    const [keywords, setKeywords] = useState<string[]>(onboarding.neverSay || []);
    const [keywordInput, setKeywordInput] = useState("");
    const [subreddits, setSubreddits] = useState<string[]>(onboarding.selectedCommunities || []);

    // Dynamic suggestions
    const [suggestedSubreddits, setSuggestedSubreddits] = useState<SubredditSuggestion[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    const addKeyword = () => {
        if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
            setKeywords([...keywords, keywordInput.trim()]);
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

    // Fetch dynamic subreddit suggestions when moving to step 2
    const goToStep2 = async () => {
        setStep(2);
        setLoadingSuggestions(true);

        try {
            const res = await fetch(`/api/reddit/subreddits?keywords=${encodeURIComponent(keywords.join(","))}`);
            const data = await res.json();
            setSuggestedSubreddits(data.suggestions || []);
        } catch (error) {
            console.error("Failed to fetch suggestions:", error);
            // Fallback to defaults
            setSuggestedSubreddits([
                { name: "startups", display: "r/startups", relevance: 90 },
                { name: "Entrepreneur", display: "r/Entrepreneur", relevance: 85 },
                { name: "SaaS", display: "r/SaaS", relevance: 80 },
                { name: "smallbusiness", display: "r/smallbusiness", relevance: 75 },
                { name: "indiehackers", display: "r/indiehackers", relevance: 70 },
            ]);
        }

        setLoadingSuggestions(false);
    };

    const handleComplete = () => {
        updateOnboarding({
            selectedCommunities: subreddits,
            neverSay: keywords, // repurposed as search keywords
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
                                onClick={goToStep2}
                                className={styles.nextBtn}
                                disabled={keywords.length === 0}
                            >
                                Find Communities →
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
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
                                            key={sub.name}
                                            onClick={() => toggleSubreddit(sub.name)}
                                            className={`${styles.subredditBtn} ${subreddits.includes(sub.name) ? styles.selected : ""}`}
                                        >
                                            <span className={styles.subName}>{sub.display}</span>
                                            <span className={styles.subRelevance}>{sub.relevance}%</span>
                                        </button>
                                    ))}
                                </div>

                                <p className={styles.hint}>Selected: {subreddits.length} communities</p>
                            </>
                        )}

                        <div className={styles.actions}>
                            <button onClick={() => setStep(1)} className={styles.backBtn}>
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
