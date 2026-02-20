"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "./post.module.css";
import { useApp } from "@/context/AppContext";

interface PostDetails {
        id: string;
        title: string;
        subreddit: string;
        author: string;
        score: number;
        num_comments: number;
        created_utc: number;
        selftext: string;
        url: string;
        permalink: string;
        comments?: Array<any>;
}


function PostContent() {
    const searchParams = useSearchParams();
    const postId = searchParams.get("id");

    const [data, setData] = useState<PostDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [draft, setDraft] = useState("");
    const [copied, setCopied] = useState(false);
    const [generatingAI, setGeneratingAI] = useState(false);
    const {onboarding} = useApp();
    const {oneMinuteBusinessPitch} = onboarding;

    useEffect(() => {
        // Try to get post from sessionStorage first
        if (postId) {
            const cachedPost = sessionStorage.getItem(`reddit_post_${postId}`);
            if (cachedPost) {
                try {
                    const parsed = JSON.parse(cachedPost);
                    setData(parsed as PostDetails);
                    setLoading(false);
                    return;
                } catch (err) {
                    console.error("Failed to parse post from sessionStorage:", err);
                }
            }
        }

        // Fallback: if no post param or sessionStorage, fetch by id (only then)
        async function fetchPost() {
            if (!postId) return;
            setLoading(true);
            try {
                const res = await fetch(`/api/reddit/post?id=${postId}`);
                const result = await res.json();
                setData(result);
            } catch (error) {
                console.error("Failed to fetch post:", error);
            }
            setLoading(false);
        }
        fetchPost();
    }, [postId]);

    const copyDraft = () => {
        navigator.clipboard.writeText(draft);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const generateAIResponse = async () => {
        if (!data) return;
        
        setGeneratingAI(true);
        try {
            const prompt = `

            You are a marketing genius and helping a business with their reddit outreach. Do not sound like a bot, considering 
            the context mentioned below be empathetic and 
            at the same time think about the business too. Do not sound tooo promotional. 
            First i would like to understand the business's one minute pitch: ${oneMinuteBusinessPitch}
            then understand what the post is about:

            Post Title: ${data.title}
            Post Content: ${data.selftext}
            Subreddit: ${data.subreddit}

            Create a concise reply that is human and at the same time improves the business' outreach
            
            response format should be:
            interface AIGeneratedResponse{
                reply: string
            }
            `;

            // hit our own rate‑limited API instead of calling Gemini client directly
            const res = await fetch("/api/ai/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            });
            if (res.redirected) {
                // server is redirecting to auth page
                window.location.href = res.url;
                return;
            }
            const body = await res.json();
            const reply = (body.text as string) || "";

            // Clean up the response (remove quotes if present)
            const cleanedText = reply.replace(/^['"]|['"]$/g, "").trim();
            setDraft(cleanedText);
        } catch (error) {
            console.error("Failed to generate AI response:", error);
            setDraft("Failed to generate response. Please try again.");
        } finally {
            setGeneratingAI(false);
        }
    };

    const formatTime = (timestamp: number) => {
        const hours = Math.floor((Date.now() / 1000 - timestamp) / 3600);
        if (hours < 1) return "just now";
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading post details...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className={styles.error}>
                <p>Post not found</p>
                <Link href="/dashboard" className={styles.backLink}>← Back to feed</Link>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* Back Button */}
            <Link href="/dashboard" className={styles.backLink}>
                ← Back to Opportunities
            </Link>

            {/* Post */}
            <article className={styles.post}>
                <div className={styles.postHeader}>
                    <span className={styles.subreddit}>{data.subreddit}</span>
                    <span className={styles.meta}>
                        u/{data.author} • {formatTime(data.created_utc)}
                    </span>
                </div>

                <h1 className={styles.postTitle}>{data.title}</h1>

                <div className={styles.postContent}>
                    {data.selftext}
                </div>

                <div className={styles.postStats}>
                    <span>⬆️ {data.score}</span>
                    <span>💬 {data.num_comments} comments</span>
                    <a
                        href={data.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.redditLink}
                    >
                        Open in Reddit →
                    </a>
                </div>
            </article>

            {/* Draft Reply */}
            <section className={styles.draftSection}>
                <h2>📝 Draft Your Reply</h2>
                <p className={styles.hint}>Write your reply here, then copy & paste to Reddit</p>

                <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Write a helpful, non-promotional reply..."
                    className={styles.draftTextarea}
                    rows={5}
                />

                <div className={styles.draftActions}>
                    <button
                        onClick={generateAIResponse}
                        className={styles.copyBtn}
                        disabled={generatingAI}
                    >
                        {generatingAI ? "✨ Generating..." : "✨ Generate with AI"}
                    </button>
                    <button
                        onClick={copyDraft}
                        className={styles.copyBtn}
                        disabled={!draft.trim()}
                    >
                        {copied ? "✓ Copied!" : "📋 Copy to Clipboard"}
                    </button>
                    <a
                        href={data.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.replyOnRedditBtn}
                    >
                        Reply on Reddit →
                    </a>
                </div>
            </section>

            {/* Comments */}
        </div>
    );
}

export default function PostPage() {
    return (
        <Suspense fallback={
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading...</p>
            </div>
        }>
            <PostContent />
        </Suspense>
    );
}

/**


            {/* <section className={styles.commentsSection}>
                <h2>💬 Comments ({(data.comments || []).length})</h2>

                <div className={styles.commentsList}>
                    {(data.comments || []).map(comment => (
                        <div key={comment.id} className={styles.comment}>
                            <div className={styles.commentHeader}>
                                <span className={styles.commentAuthor}>u/{comment.author}</span>
                                <span className={styles.commentMeta}>
                                    ⬆️ {comment.score} • {formatTime(comment.created_utc)}
                                </span>
                            </div>
                            <p className={styles.commentBody}>{comment.body}</p>

                            {comment.replies && comment.replies.length > 0 && (
                                <div className={styles.replies}>
                                    {comment.replies.map(reply:anhyh => (
                                        <div key={reply.id} className={styles.reply}>
                                            <div className={styles.commentHeader}>
                                                <span className={styles.commentAuthor}>u/{reply.author}</span>
                                                <span className={styles.commentMeta}>
                                                    ⬆️ {reply.score}
                                                </span>
                                            </div>
                                            <p className={styles.commentBody}>{reply.body}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section> */
