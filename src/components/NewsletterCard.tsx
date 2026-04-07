"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import styles from "./NewsletterCard.module.css";
import type { RedditPost } from "@/types";

interface Props {
    post: RedditPost;
    viewHref?: string;
}

export default function NewsletterCard({
    post,
    viewHref,
}: Props) {
    const [now, setNow] = useState<number | null>(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setNow(Date.now());
    }, []);

    const formatTime = (timestamp: number) => {
        if (now === null) return "";
        const hours = Math.floor((now / 1000 - timestamp) / 3600);
        if (hours < 1) return "Just now";
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    return (
        <article className={styles.card}>
            <div className={styles.header}>
                <div className={styles.meta}>
                    <span className={styles.subreddit}>r/{post.subreddit}</span>
                    <span className={styles.time}>{formatTime(post.created_utc)}</span>
                </div>
                {post.relevance_score && (
                    <div className={styles.matchBadge}>
                        {post.relevance_score}% Relevance
                    </div>
                )}
            </div>

            <h3 className={styles.title}>
                <Link href={viewHref || `/dashboard/post?id=${post.id}`} className={styles.titleLink}>
                    {post.title}
                </Link>
            </h3>

            {post.selftext && (
                <p className={styles.excerpt}>
                    {post.selftext.substring(0, 240)}
                    {post.selftext.length > 240 ? "..." : ""}
                </p>
            )}

            {post.opportunity_type && (
                <div className={styles.opportunityType}>
                    <strong>Curator&apos;s Note:</strong> {post.opportunity_type}
                </div>
            )}

            <div className={styles.footer}>
                <div className={styles.tags}>
                    <span className={styles.stat}>💬 {post.num_comments} comments</span>
                </div>

                <div className={styles.actions}>
                    <Link
                        href={viewHref || `/dashboard/post?id=${post.id}`}
                        className={styles.readMore}
                    >
                        Draft Response →
                    </Link>
                </div>
            </div>
        </article>
    );
}
