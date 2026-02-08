"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import styles from "./dashboard.module.css";
import RedditList from "@/components/RedditList";

interface RedditPost {
    id: string;
    title: string;
    subreddit: string;
    author: string;
    score: number;
    num_comments: number;
    created_utc: number;
    selftext: string;
    permalink: string;
    url: string;
    relevance_score?: number;
    opportunity_type?: string;
}


export default function DashboardPage() {
    const { onboarding } = useApp();
    const [posts, setPosts] = useState<RedditPost[]>([]);
    const [loading, setLoading] = useState(true);
const [activeSubreddit, setActiveSubreddit] = useState(
    onboarding.selectedCommunities?.[0] || "all"
);
    const [savedPosts, setSavedPosts] = useState<string[]>([]);
    const [respondedPosts, setRespondedPosts] = useState<string[]>([]);


    // Load saved/responded from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("legitreach_saved");
        const responded = localStorage.getItem("legitreach_responded");
        if (saved) setSavedPosts(JSON.parse(saved));
        if (responded) setRespondedPosts(JSON.parse(responded));
    }, []);

    // Get keywords from onboarding
    const keywords = onboarding.keywords || [];
    const subreddits = [...(onboarding.selectedCommunities || [])];

    // Fetch posts from API with keywords
    // Memoize the keywords param string so deps are stable
    const keywordsParam = useMemo(() => keywords.join(","), [keywords.join(",")]);

    useEffect(() => {
        // don't try to fetch until we have a valid subreddit
        if (!activeSubreddit) return;

        const controller = new AbortController();

        async function fetchPosts() {
            setLoading(true);
            try {
                const res = await fetch(
                    `/api/reddit/browse?subreddit=${activeSubreddit}&keywords=${encodeURIComponent(keywordsParam)}&limit=5`,
                    { signal: controller.signal }
                );
                const data = await res.json();
                setPosts(data.posts || []);
            } catch (error) {
                if ((error as any).name === 'AbortError') return;
                console.error("Failed to fetch posts:", error);
            }
            setLoading(false);
        }
        fetchPosts();

        return () => controller.abort();
    }, [activeSubreddit, keywordsParam]);

    const savePost = (postId: string) => {
        const updated = savedPosts.includes(postId)
            ? savedPosts.filter(id => id !== postId)
            : [...savedPosts, postId];
        setSavedPosts(updated);
        localStorage.setItem("legitreach_saved", JSON.stringify(updated));
    };

    const markResponded = (postId: string) => {
        const updated = [...respondedPosts, postId];
        setRespondedPosts(updated);
        localStorage.setItem("legitreach_responded", JSON.stringify(updated));
    };

    const formatTime = (timestamp: number) => {
        const hours = Math.floor((Date.now() / 1000 - timestamp) / 3600);
        if (hours < 1) return "just now";
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    // Filter out responded posts from view
    const visiblePosts = posts.filter(p => !respondedPosts.includes(p.id));

    return (
        <div className={styles.page}>
            {/* Header */}
            <header className={styles.header}>
                <div>
                    <h1>🔍 Opportunities</h1>
                    <p>Discussions matching your keywords</p>
                </div>
                <div className={styles.keywords}>
                    {keywords.map(kw => (
                        <span key={kw} className={styles.keyword}>{kw}</span>
                    ))}
                </div>
            </header>

            {/* Stats */}
            <div className={styles.stats}>
                <div className={styles.stat}>
                    <span className={styles.statNumber}>{visiblePosts.length}</span>
                    <span className={styles.statLabel}>Opportunities</span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.statNumber}>{savedPosts.length}</span>
                    <span className={styles.statLabel}>Saved</span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.statNumber}>{respondedPosts.length}</span>
                    <span className={styles.statLabel}>Responded</span>
                </div>
            </div>

            {/* Subreddit Tabs */}
            <div className={styles.tabs}>
                {subreddits.map(sub => (
                    <button
                        key={sub}
                        onClick={() => setActiveSubreddit(sub)}
                        className={`${styles.tab} ${activeSubreddit === sub ? styles.active : ""}`}
                    >
                        {sub}
                    </button>
                ))}
            </div>

            {/* Posts Feed */}
            <div className={styles.feed}>
                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Finding opportunities...</p>
                    </div>
                ) : visiblePosts.length === 0 ? (
                    <div className={styles.empty}>
                        <p>🎉 All caught up! No new opportunities.</p>
                        <p className={styles.emptyHint}>Try adding more keywords or communities.</p>
                    </div>
                ) : (
                    <RedditList
                        posts={visiblePosts}
                        savedPosts={savedPosts}
                        respondedPosts={respondedPosts}
                        onSave={savePost}
                        onDone={markResponded}
                    />
                )}
            </div>
        </div>
    );
}
