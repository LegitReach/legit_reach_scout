"use client";

import Link from "next/link";
import styles from "@/app/dashboard/dashboard.module.css";
import type { RedditPost } from "@/types";
import posthog from "posthog-js";
export type { RedditPost };

interface Props {
  post: RedditPost;
  onDone?: (id: string) => void;
  viewHref?: string;
}

export default function PostCard({
  post,
  onDone,
  viewHref,
}: Props) {
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
        <span className={styles.meta}>
          u/{post.author} • {formatTime(post.created_utc)}
        </span>
        {post.relevance_score && (
          <span className={styles.relevance}>
            {post.relevance_score}% match
          </span>
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
        <Link
          href={viewHref || `/dashboard/post?id=${post.id}`}
          onClick={() => {
            posthog.capture("post_viewed", { post_id: post.id, subreddit: post.subreddit });
            sessionStorage.setItem(
              `reddit_post_${post.id}`,
              JSON.stringify(post),
            );
          }}
          className={styles.viewBtn}
        >
          View & Draft Reply →
        </Link>

        <button
          onClick={() => {
            posthog.capture("post_marked_done", { post_id: post.id, subreddit: post.subreddit });
            if (onDone) onDone(post.id);
          }}
          className={styles.doneBtn}
        >
          ✓ Done
        </button>
      </div>
    </div>
  );
}
