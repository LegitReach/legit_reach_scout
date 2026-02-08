"use client";

import styles from "./morning.module.css";
import { useApp } from "@/context/AppContext";

export default function MorningPage() {
    const { onboarding } = useApp();

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1>☀️ Morning Brief</h1>
                <p className={styles.hint}>Daily highlights and top opportunities for you.</p>
                {onboarding.oneMinuteBusinessPitch && (
                    <p className={styles.hint}><strong>Business:</strong> {onboarding.oneMinuteBusinessPitch}</p>
                )}
            </header>

            <main className={styles.content}>
                {(!onboarding.selectedCommunities || onboarding.selectedCommunities.length === 0) ? (
                    <div className={styles.empty}>
                        <p>No communities selected yet — complete onboarding to see personalized content.</p>
                    </div>
                ) : (
                    <section>
                        <h2>Your Communities</h2>
                        <div className={styles.subredditGrid}>
                            {onboarding.selectedCommunities.map(sub => (
                                <div key={sub} className={styles.subName}>{sub}</div>
                            ))}
                        </div>

                        <h3>Keywords</h3>
                        <p className={styles.hint}>{(onboarding.keywords || []).join(", ") || "—"}</p>
                        
                        <h3>Business Description</h3>
                        <p className={styles.hint}>{onboarding.oneMinuteBusinessPitch}</p>

                    </section>
                )}
            </main>
        </div>
    );
}
