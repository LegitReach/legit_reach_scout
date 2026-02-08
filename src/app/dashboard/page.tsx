"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import styles from "./dashboard.module.css";

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
);    const [savedPosts, setSavedPosts] = useState<string[]>([]);
    const [respondedPosts, setRespondedPosts] = useState<string[]>([]);


    // Load saved/responded from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("legitreach_saved");
        const responded = localStorage.getItem("legitreach_responded");
        if (saved) setSavedPosts(JSON.parse(saved));
        if (responded) setRespondedPosts(JSON.parse(responded));
    }, []);

    // Get keywords from onboarding
    const keywords = onboarding.neverSay || [];
    const subreddits = [...(onboarding.selectedCommunities || [])];

    // Fetch posts from API with keywords
    useEffect(() => {
        async function fetchPosts() {
            setLoading(true);
            try {
                const keywordsParam = keywords.join(",");
                const res = await fetch(
                    `/api/reddit/browse?subreddit=${activeSubreddit}&keywords=${encodeURIComponent(keywordsParam)}&limit=5`
                );
                const data = await res.json();
                console.log(data)
                setPosts(data.posts || []);
            } catch (error) {
                console.error("Failed to fetch posts:", error);
            }
            setLoading(false);
        }
        fetchPosts();
    }, [activeSubreddit, keywords.join(",")]);

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
                        r/{sub}
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
                    visiblePosts.map(post => (
                        <div
                            key={post.id}
                            className={styles.postCard}
                        >
                            <div className={styles.postHeader}>
                                <span className={styles.subreddit}>{post.subreddit}</span>
                                <span className={styles.meta}>
                                    u/{post.author} • {formatTime(post.created_utc)}
                                </span>
                                {post.relevance_score && (
                                    <span className={styles.relevance}>{post.relevance_score}% match</span>
                                )}
                            </div>

                            <h3 className={styles.postTitle}>{post.title}</h3>

                            {post.selftext && (
                                <p className={styles.postContent}>
                                    {post.selftext.substring(0, 200)}
                                    {post.selftext.length > 200 ? "..." : ""}
                                </p>
                            )}

                            {post.opportunity_type && (
                                <div className={styles.opportunityBadge}>
                                    💡 {post.opportunity_type}
                                </div>
                            )}

                            <div className={styles.postStats}>
                                <span>⬆️ {post.score}</span>
                                <span>💬 {post.num_comments} comments</span>
                            </div>

                            <div className={styles.postActions}>
                                <button
                                    onClick={() => savePost(post.id)}
                                    className={`${styles.actionBtn} ${savedPosts.includes(post.id) ? styles.saved : ""}`}
                                >
                                    {savedPosts.includes(post.id) ? "★ Saved" : "☆ Save"}
                                </button>
                                <Link
                                    href={`/dashboard/post?post=${encodeURIComponent(JSON.stringify(post))}`}
                                    className={styles.viewBtn}
                                >
                                    View & Draft Reply →
                                </Link>
                                <button
                                    onClick={() => markResponded(post.id)}
                                    className={styles.doneBtn}
                                >
                                    ✓ Done
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
