"use client";

import Link from "next/link";
import styles from "@/app/dashboard/dashboard.module.css";

export interface RedditPost {
    id: string;
    title: string;
    subreddit: string;
    author: string;
    score: number;
    num_comments: number;
    created_utc: number;
    selftext: string;
    permalink?: string;
    url?: string;
    relevance_score?: number;
    opportunity_type?: string;
}

interface Props {
    post: RedditPost;
    saved?: boolean;
    onSave?: (id: string) => void;
    onDone?: (id: string) => void;
    viewHref?: string;
}

export default function PostCard({ post, saved, onSave, onDone, viewHref }: Props) {
    const formatTime = (timestamp: number) => {
        const hours = Math.floor((Date.now() / 1000 - timestamp) / 3600);
        if (hours < 1) return "just now";
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    return (
        <div className={styles.postCard}>
            <div className={styles.postHeader}>
                <span className={styles.subreddit}>{post.subreddit}</span>
                <span className={styles.meta}>u/{post.author} • {formatTime(post.created_utc)}</span>
                {post.relevance_score && (
                    <span className={styles.relevance}>{post.relevance_score}% match</span>
                )}
            </div>

            <h3 className={styles.postTitle}>{post.title}</h3>

            {post.selftext && (
                <p className={styles.postContent}>
                    {post.selftext.substring(0, 200)}{post.selftext.length > 200 ? "..." : ""}
                </p>
            )}

            {post.opportunity_type && (
                <div className={styles.opportunityBadge}>💡 {post.opportunity_type}</div>
            )}

            <div className={styles.postStats}>
                <span>⬆️ {post.score}</span>
                <span>💬 {post.num_comments} comments</span>
            </div>

            <div className={styles.postActions}>
                <button
                    onClick={() => onSave && onSave(post.id)}
                    className={`${styles.actionBtn} ${saved ? styles.saved : ""}`}
                >
                    {saved ? "★ Saved" : "☆ Save"}
                </button>

                <Link
                    href={viewHref || `/dashboard/post?post=${encodeURIComponent(JSON.stringify(post))}`}
                    className={styles.viewBtn}
                >
                    View & Draft Reply →
                </Link>

                <button
                    onClick={() => onDone && onDone(post.id)}
                    className={styles.doneBtn}
                >
                    ✓ Done
                </button>
            </div>
        </div>
    );
}
