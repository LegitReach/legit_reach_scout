"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import styles from "./onboarding.module.css";
import posthog from "posthog-js";

function OnboardingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { updateOnboarding, onboarding, isAppLoaded } = useApp();
    const isManualMode = searchParams.get("manual") === "true";

    // Magic Scan State
    const [storeUrl, setStoreUrl] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [scanStatus, setScanStatus] = useState("Analyzing your store...");

    // Manual Flow State
    const [step, setStep] = useState(1);
    const [keywords, setKeywords] = useState<string[]>(onboarding.keywords || []);
    const [keywordInput, setKeywordInput] = useState("");
    const [businessDesc, setBusinessDesc] = useState(onboarding.oneMinuteBusinessPitch || "");
    const [suggestedSubreddits, setSuggestedSubreddits] = useState<string[]>([]);
    const [selectedSubreddits, setSelectedSubreddits] = useState<string[]>(onboarding.selectedCommunities || []);
    const [loadingSubreddits, setLoadingSubreddits] = useState(false);

    // Skip if already done
    useEffect(() => {
        if (isAppLoaded && onboarding.completed) {
            router.push("/dashboard");
        }
    }, [isAppLoaded, onboarding.completed, router]);

    // --- MAGIC SCAN HANDLER ---
    const handleMagicScan = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!storeUrl || isScanning) return;

        setIsScanning(true);
        setScanStatus("Analyzing store profile...");
        posthog.capture("magic_scan_started", { url: storeUrl });

        try {
            const res = await fetch("/api/onboarding/magic-scan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: storeUrl }),
            });

            if (!res.ok) {
                if (res.status === 429) {
                    const data = await res.json();
                    if (data.redirectTo) {
                        window.location.href = data.redirectTo + "?returnUrl=/onboarding";
                        return;
                    }
                }
                throw new Error("Failed to scan store. Try manual setup.");
            }

            const data = await res.json();
            setScanStatus("Configuring target subreddits...");
            
            // Artificial delay for UX "magic" effect (optional, but keep it if previous UX had it)
            await new Promise(r => setTimeout(r, 800));

            updateOnboarding({
                keywords: data.keywords || [],
                selectedCommunities: data.subreddits || [],
                oneMinuteBusinessPitch: data.businessDescription || "",
                completed: true,
            });

            posthog.capture("onboarding_completed", { method: "magic_scan" });
            router.push("/dashboard");

        } catch (error) {
            console.error(error);
            alert("Magic Scan failed. Switching to manual setup.");
            router.push("/onboarding?manual=true");
            setIsScanning(false);
        }
    };

    // --- MANUAL FLOW HANDLERS ---
    const addKeyword = () => {
        const val = keywordInput.trim();
        if (val && !keywords.includes(val)) {
            setKeywords([...keywords, val]);
            setKeywordInput("");
        }
    };

    const removeKeyword = (kw: string) => {
        setKeywords(keywords.filter(k => k !== kw));
    };

    const fetchSubreddits = async () => {
        setLoadingSubreddits(true);
        setStep(3);
        try {
            const res = await fetch("/api/reddit/subreddits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ keywords: keywords.join(","), businessDescription: businessDesc }),
            });
            const data = await res.json();
            setSuggestedSubreddits(data.suggestions || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingSubreddits(false);
        }
    };

    const toggleSubreddit = (sub: string) => {
        if (selectedSubreddits.includes(sub)) {
            setSelectedSubreddits(selectedSubreddits.filter(s => s !== sub));
        } else {
            setSelectedSubreddits([...selectedSubreddits, sub]);
        }
    };

    const handleManualComplete = () => {
        updateOnboarding({
            keywords,
            oneMinuteBusinessPitch: businessDesc,
            selectedCommunities: selectedSubreddits,
            completed: true,
        });
        posthog.capture("onboarding_completed", { method: "manual" });
        router.push("/dashboard");
    };

    if (!isAppLoaded) return null;

    // --- RENDER MANUAL MODE ---
    if (isManualMode) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.progress}>
                        <div className={`${styles.progressStep} ${step >= 1 ? styles.active : ""}`}>1</div>
                        <div className={styles.progressLine}></div>
                        <div className={`${styles.progressStep} ${step >= 2 ? styles.active : ""}`}>2</div>
                        <div className={styles.progressLine}></div>
                        <div className={`${styles.progressStep} ${step >= 3 ? styles.active : ""}`}>3</div>
                    </div>

                    {step === 1 && (
                        <div className={styles.stepContent}>
                            <h1>What do you sell?</h1>
                            <p>Add a few keywords that describe your brand or product.</p>
                            <div className={styles.inputGroup}>
                                <input 
                                    className={styles.inputField} 
                                    placeholder="e.g. organic coffee, minimalist decor"
                                    value={keywordInput}
                                    onChange={e => setKeywordInput(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && addKeyword()}
                                />
                                <button className={styles.addBtn} onClick={addKeyword}>Add</button>
                            </div>
                            <div className={styles.tags}>
                                {keywords.map(kw => (
                                    <span key={kw} className={styles.tag}>
                                        {kw} <button onClick={() => removeKeyword(kw)}>×</button>
                                    </span>
                                ))}
                            </div>
                            <button 
                                className={styles.completeBtn} 
                                disabled={keywords.length === 0}
                                onClick={() => setStep(2)}
                            >
                                Next: Describe Business →
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className={styles.stepContent}>
                            <h1>Describe your business</h1>
                            <p>A short pitch helps our AI find the right conversations.</p>
                            <textarea 
                                className={styles.textarea}
                                placeholder="We provide high-quality organic coffee beans sourced directly from farmers..."
                                value={businessDesc}
                                onChange={e => setBusinessDesc(e.target.value)}
                            />
                            <div className={styles.actions}>
                                <button className={styles.backBtn} onClick={() => setStep(1)}>Back</button>
                                <button 
                                    className={styles.completeBtn} 
                                    disabled={!businessDesc.trim()}
                                    onClick={fetchSubreddits}
                                >
                                    Find Subreddits →
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className={styles.stepContent}>
                            <h1>Target Communities</h1>
                            <p>Select the subreddits where your audience is most active.</p>
                            {loadingSubreddits ? (
                                <div style={{textAlign: "center", padding: 40}}>
                                    <div className={styles.spinner} style={{margin: "0 auto"}}></div>
                                    <p style={{marginTop: 12}}>Finding relevant communities...</p>
                                </div>
                            ) : (
                                <div className={styles.subredditGrid}>
                                    {suggestedSubreddits.map(sub => (
                                        <button 
                                            key={sub}
                                            className={`${styles.subredditBtn} ${selectedSubreddits.includes(sub) ? styles.selected : ""}`}
                                            onClick={() => toggleSubreddit(sub)}
                                        >
                                            {sub}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className={styles.actions}>
                                <button className={styles.backBtn} onClick={() => setStep(2)}>Back</button>
                                <button 
                                    className={styles.completeBtn} 
                                    disabled={selectedSubreddits.length === 0}
                                    onClick={handleManualComplete}
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

    // --- RENDER MAGIC SCAN MODE ---
    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.badge}>Beta</div>
                    <h1>✨ Magic Scan</h1>
                    <p>Enter your store URL to automatically configure your targeting.</p>
                </div>

                {!isScanning ? (
                    <form onSubmit={handleMagicScan} className={styles.urlWrapper}>
                        <input 
                            type="url"
                            className={styles.inputField}
                            placeholder="https://yourstore.com"
                            value={storeUrl}
                            onChange={e => setStoreUrl(e.target.value)}
                            required
                        />
                        <button className={styles.scanBtn} type="submit" disabled={!storeUrl}>
                            Scan Store & Start 🚀
                        </button>
                    </form>
                ) : (
                    <div style={{textAlign: "center", padding: 20}}>
                        <div className={styles.spinner} style={{margin: "0 auto"}}></div>
                        <p style={{marginTop: 16, fontWeight: 600}}>{scanStatus}</p>
                    </div>
                )}

                <div className={styles.footer}>
                    <button 
                        className={styles.manualBtn}
                        onClick={() => router.push("/onboarding?manual=true")}
                    >
                        Configure manually instead
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function OnboardingPage() {
    return (
        <Suspense fallback={null}>
            <OnboardingContent />
        </Suspense>
    );
}