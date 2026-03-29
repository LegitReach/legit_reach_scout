"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import styles from "./onboarding.module.css";
import posthog from "posthog-js";

export default function OnboardingPage() {
    const router = useRouter();
    const { updateOnboarding, onboarding, isAppLoaded } = useApp();
    const [storeUrl, setStoreUrl] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [scanStatus, setScanStatus] = useState<string>("Analyzing your store...");
    const [scanStep, setScanStep] = useState<number>(1);
    const [showManual, setShowManual] = useState(false);

    // Skip onboarding if already completed
    useEffect(() => {
        if (isAppLoaded && onboarding.completed) {
            router.push("/dashboard");
        }
    }, [onboarding.completed, router, isAppLoaded]);

    const handleMagicScan = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!storeUrl || isScanning) return;

        setIsScanning(true);
        setScanStep(1);
        setScanStatus("Analyzing your store...");
        
        posthog.capture("magic_scan_started", { url: storeUrl });

        try {
            // Step 1: Analyze store (8s delay simulation if needed, but the API handles the real work)
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
                throw new Error("Failed to scan store. Please check the URL or try again.");
            }

            const data = await res.json();
            
            // Step 2: Transition animation
            setScanStep(2);
            setScanStatus(`Found ${data.keywords?.length || 0} Reddit targets...`);
            await new Promise(r => setTimeout(r, 1500));
            
            // Step 3: Transition to finalizing
            setScanStep(3);
            setScanStatus("Optimizing your AI agent...");
            await new Promise(r => setTimeout(r, 1000));

            // Final: Update context and redirect
            updateOnboarding({
                keywords: data.keywords || [],
                selectedCommunities: data.subreddits || [],
                oneMinuteBusinessPitch: data.businessDescription || "",
                completed: true,
            });

            posthog.capture("onboarding_completed", {
                method: "magic_scan",
                keywords_count: data.keywords?.length,
                communities_count: data.subreddits?.length,
            });

            router.push("/dashboard");
        } catch (error) {
            console.error("Magic scan failed:", error);
            alert(error instanceof Error ? error.message : "Magic scan failed. Please try manual setup.");
            setIsScanning(false);
        }
    };

    if (!isAppLoaded) return null;

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.badge}>Beta</div>
                    <h1>✨ Magic Scan</h1>
                    <p>Enter your store URL to automatically configure your Reddit targeting.</p>
                </div>

                <div className={styles.magicSection}>
                    {!isScanning ? (
                        <form onSubmit={handleMagicScan} className={styles.urlWrapper}>
                            <input
                                type="url"
                                required
                                value={storeUrl}
                                onChange={(e) => setStoreUrl(e.target.value)}
                                placeholder="https://yourstore.com"
                                className={styles.inputField}
                            />
                            <button 
                                type="submit" 
                                className={styles.scanBtn}
                                disabled={!storeUrl}
                            >
                                Scan Store & Start 🚀
                            </button>
                        </form>
                    ) : (
                        <div className={styles.statusBox}>
                            <div className={styles.spinner}></div>
                            <div className={styles.statusText}>{scanStatus}</div>
                            <div className={styles.statusDesc}>
                                {scanStep === 1 && "Browsing your site's products and categories..."}
                                {scanStep === 2 && "Identifying the best subreddits where your customers hang out..."}
                                {scanStep === 3 && "Configuring your dashboard and initial lead feed..."}
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.footer}>
                    <button 
                        onClick={() => router.push("/onboarding?manual=true")} 
                        className={styles.manualBtn}
                    >
                        Trouble scanning? Configure manually instead
                    </button>
                    <p style={{marginTop: 12, fontSize: 11, color: "var(--color-text-muted)"}}>
                        Your URL is scanned by an AI agent. No sensitive data is collected.
                    </p>
                </div>
            </div>
        </div>
    );
}