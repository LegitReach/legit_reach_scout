/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./demo.module.css";

// Demo data showcasing the full vision of the product
const demoData = {
    morningBrief: [
        {
            subreddit: "r/startups",
            title: "What tools do you use for customer feedback?",
            content: "Looking for recommendations on customer feedback tools. Budget is around $50-100/month.",
            engagement: { upvotes: 45, comments: 23 },
            opportunity: "Product recommendation opportunity",
            draftReply: "I've been using [YourProduct] for about 6 months now and it's been great for us. The pricing fits right in your budget and the analytics are really comprehensive. Happy to share my experience if you have questions!",
        },
        {
            subreddit: "r/SaaS",
            title: "Just hit $10k MRR - here's what I learned",
            content: "After 6 months of building in public, I finally crossed $10k MRR...",
            engagement: { upvotes: 156, comments: 47 },
            opportunity: "Founder engagement opportunity",
            draftReply: "Congrats on the milestone! Your point about customer discovery really resonates - we learned the same lesson the hard way. What's your approach to balancing feature requests vs your roadmap vision?",
        },
    ],
    alerts: [
        { type: "viral", subreddit: "r/Entrepreneur", title: "Thread going viral (150+ upvotes in 2h)", icon: "🔥" },
        { type: "dm", user: "u/startup_sarah", message: "New DM about partnership opportunity", icon: "✉️" },
        { type: "mention", subreddit: "r/microsaas", title: "Your product/brand was mentioned", icon: "📢" },
    ],
    weeklyStats: {
        impressions: "23.4K",
        engagement: "847",
        replies: 12,
        conversions: 3,
        growth: "+47%",
    },
};

export default function DemoPage() {
    const [activeTab, setActiveTab] = useState<"brief" | "alerts" | "weekly">("brief");

    return (
        <div className={styles.container}>
            <Link href="/" className={styles.back}>← Back to Home</Link>

            <header className={styles.header}>
                <span className={styles.badge}>🎭 Demo Walkthrough</span>
                <h1>LegitReach Vision</h1>
                <p>See what's possible with full integration</p>
            </header>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === "brief" ? styles.active : ""}`}
                    onClick={() => setActiveTab("brief")}
                >
                    ☀️ Morning Brief
                </button>
                <button
                    className={`${styles.tab} ${activeTab === "alerts" ? styles.active : ""}`}
                    onClick={() => setActiveTab("alerts")}
                >
                    ⚡ Alerts
                </button>
                <button
                    className={`${styles.tab} ${activeTab === "weekly" ? styles.active : ""}`}
                    onClick={() => setActiveTab("weekly")}
                >
                    📊 Weekly Report
                </button>
            </div>

            {/* Content */}
            <div className={styles.content}>
                {activeTab === "brief" && (
                    <div className={styles.briefContent}>
                        <h2>Today's Top Opportunities</h2>
                        <p className={styles.subtitle}>AI-curated discussions where you can add value</p>

                        {demoData.morningBrief.map((item, idx) => (
                            <div key={idx} className={styles.briefCard}>
                                <div className={styles.cardHeader}>
                                    <span className={styles.subreddit}>{item.subreddit}</span>
                                    <span className={styles.opportunityBadge}>{item.opportunity}</span>
                                </div>
                                <h3>{item.title}</h3>
                                <p className={styles.cardContent}>{item.content}</p>
                                <div className={styles.engagement}>
                                    ⬆️ {item.engagement.upvotes} • 💬 {item.engagement.comments}
                                </div>
                                <div className={styles.draftSection}>
                                    <label>AI-drafted reply:</label>
                                    <div className={styles.draftPreview}>{item.draftReply}</div>
                                    <button className={styles.editBtn}>Edit & Copy</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === "alerts" && (
                    <div className={styles.alertsContent}>
                        <h2>Live Alerts</h2>
                        <p className={styles.subtitle}>Real-time notifications for opportunities</p>

                        {demoData.alerts.map((alert, idx) => (
                            <div key={idx} className={`${styles.alertCard} ${styles[alert.type]}`}>
                                <span className={styles.alertIcon}>{alert.icon}</span>
                                <div className={styles.alertText}>
                                    {alert.subreddit && <span className={styles.alertSub}>{alert.subreddit}</span>}
                                    {alert.user && <span className={styles.alertUser}>{alert.user}</span>}
                                    <p>{alert.title || alert.message}</p>
                                </div>
                                <button className={styles.alertAction}>View</button>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === "weekly" && (
                    <div className={styles.weeklyContent}>
                        <h2>Weekly Performance</h2>
                        <p className={styles.subtitle}>Your Reddit engagement analytics</p>

                        <div className={styles.statsGrid}>
                            <div className={styles.statCard}>
                                <span className={styles.statIcon}>👁️</span>
                                <span className={styles.statValue}>{demoData.weeklyStats.impressions}</span>
                                <span className={styles.statLabel}>Impressions</span>
                            </div>
                            <div className={styles.statCard}>
                                <span className={styles.statIcon}>💬</span>
                                <span className={styles.statValue}>{demoData.weeklyStats.engagement}</span>
                                <span className={styles.statLabel}>Engagement</span>
                            </div>
                            <div className={styles.statCard}>
                                <span className={styles.statIcon}>✍️</span>
                                <span className={styles.statValue}>{demoData.weeklyStats.replies}</span>
                                <span className={styles.statLabel}>Replies</span>
                            </div>
                            <div className={styles.statCard}>
                                <span className={styles.statIcon}>🎯</span>
                                <span className={styles.statValue}>{demoData.weeklyStats.conversions}</span>
                                <span className={styles.statLabel}>Conversions</span>
                            </div>
                        </div>

                        <div className={styles.growthCard}>
                            <span className={styles.growthValue}>{demoData.weeklyStats.growth}</span>
                            <span className={styles.growthLabel}>Week over week growth</span>
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.cta}>
                <p>Ready to find real opportunities?</p>
                <Link href="/onboarding" className={styles.ctaBtn}>
                    Start Using LegitReach →
                </Link>
            </div>
        </div>
    );
}
