"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./post.module.css";
import { useApp } from "@/context/AppContext";
import posthog from "posthog-js";

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
    const [dmDraft, setDmDraft] = useState("");
    const [copied, setCopied] = useState(false);
    const [copiedDM, setCopiedDM] = useState(false);
    const [generatingAI, setGeneratingAI] = useState(false);
    const [generatingAIDM, setGeneratingAIDM] = useState(false);
    const [dmGenerated, setDmGenerated] = useState(false);
    const { onboarding } = useApp();
    const { oneMinuteBusinessPitch } = onboarding;
    const router = useRouter();

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
        posthog.capture("reply_copied", { post_id: data?.id, subreddit: data?.subreddit });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const copyDMDraft = () => {
        navigator.clipboard.writeText(dmDraft);
        posthog.capture("dm_copied", { post_id: data?.id, subreddit: data?.subreddit });
        setCopiedDM(true);
        setTimeout(() => setCopiedDM(false), 2000);
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

            Create a concise public comment reply that is human and at the same time improves the business' outreach. 
            
            Return ONLY a valid JSON object — no markdown, no extra text:
            { "reply": "your response here" }
            `;

            const res = await fetch("/api/ai/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            });
            if (res.redirected) {
                window.location.href = res.url;
                return;
            }
            const body = await res.json();
            const reply = (body.text as string) || "";
            const cleanedText = reply.replace(/^['"]|['"]$/g, "").trim();
            posthog.capture("ai_reply_generated", { post_id: data.id, subreddit: data.subreddit });
            setDraft(cleanedText);
        } catch (error) {
            console.error("Failed to generate AI response:", error);
            posthog.captureException(error);
            setDraft("Failed to generate response. Please try again.");
        } finally {
            setGeneratingAI(false);
        }
    };

    const generateAIDMResponse = async () => {
        if (!data) return;

        setGeneratingAIDM(true);
        try {
            const prompt = `
            You are a marketing genius helping an ecommerce business with personalized Reddit outreach via Direct Message (DM).
            DMs should be personal, empathetic, and offer direct value or a deeper conversation.
            
            Key context:
            Business Pitch: ${oneMinuteBusinessPitch}
            User Post: "${data.title}"
            Post Body: "${data.selftext}"
            Person to send DM to: ${data.author}
            
            Task:
            Write a highly personalized DM to this user. 
            - Start by acknowledging their specific situation or pain point.
            - Introduce the business naturally as a solution or resource.
            - Include a clear, personalized call to action for an ecommerce business (e.g., offering a free consultation, a shopify/store audit, or setting up a quick 10-minute discovery call).
            - Keep it friendly, professional, and absolutely non-spammy.
            
            Return ONLY a valid JSON object — no markdown, no extra text:
            { "reply": "your personal dm here" }
            Keep the response short and concise. 
            `;

            const res = await fetch("/api/ai/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            });
            if (res.redirected) {
                window.location.href = res.url;
                return;
            }
            const body = await res.json();
            const reply = (body.text as string) || "";
            const cleanedText = reply.replace(/^['"]|['"]$/g, "").trim();
            posthog.capture("ai_dm_generated", { post_id: data.id, subreddit: data.subreddit });
            setDmDraft(cleanedText);
            setDmGenerated(true);
        } catch (error) {
            console.error("Failed to generate AI DM:", error);
            posthog.captureException(error);
            setDmDraft("Failed to generate DM. Please try again.");
        } finally {
            setGeneratingAIDM(false);
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
                    <span>{data.score} pts</span>
                    <span>{data.num_comments} comments</span>
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

            {/* Parallel Draft Sections */}
            <div className={styles.parallelDrafts}>
                {/* Public Reply Draft */}
                <section className={styles.draftSection}>
                    <div className={styles.draftHeader}>
                        <h2>Draft Your Reply</h2>
                        <span className={styles.draftTypeBadge}>Public Comment</span>
                    </div>
                    <p className={styles.hint}>Best for community engagement and SEO visibility</p>

                    <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder="Write a helpful, non-promotional reply..."
                        className={styles.draftTextarea}
                        rows={6}
                    />

                    <div className={styles.draftActions}>
                        <button
                            onClick={generateAIResponse}
                            className={styles.aiBtn}
                            disabled={generatingAI}
                        >
                            {generatingAI ? "Generating..." : "Generate with AI"}
                        </button>
                        <button
                            onClick={copyDraft}
                            className={styles.copyBtn}
                            disabled={!draft.trim()}
                        >
                            {copied ? "Copied!" : "Copy"}
                        </button>
                        <a
                            href={data.permalink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.redditLinkBtn}
                            onClick={() => posthog.capture("reply_on_reddit_clicked", { post_id: data.id, subreddit: data.subreddit })}
                        >
                            Reply on Reddit →
                        </a>
                    </div>
                </section>

                {/* Direct Message Draft */}
                <section className={styles.draftSection}>
                    <div className={styles.draftHeader}>
                        <h2>Draft a DM</h2>
                        <span className={styles.draftTypeBadgeDM}>Private Message</span>
                    </div>
                    <p className={styles.hint}>Best for high-ticket sales, calls, and personal outreach</p>

                    <textarea
                        value={dmDraft}
                        onChange={(e) => setDmDraft(e.target.value)}
                        placeholder="Draft a personal message for direct outreach..."
                        className={styles.draftTextarea}
                        rows={6}
                    />

                    <div className={styles.draftActions}>
                        <button
                            onClick={generateAIDMResponse}
                            className={styles.aiBtnDM}
                            disabled={generatingAIDM}
                        >
                            {generatingAIDM ? "Generating..." : "Generate with AI"}
                        </button>
                        <button
                            onClick={copyDMDraft}
                            className={styles.copyBtn}
                            disabled={!dmDraft.trim()}
                        >
                            {copiedDM ? "Copied!" : "Copy"}
                        </button>
                        <a
                            href={(!dmGenerated || !dmDraft.trim()) ? "#" : `https://www.reddit.com/message/compose/?to=${data.author}&subject=Re: ${encodeURIComponent(data.title.substring(0, 50))}&message=${encodeURIComponent(dmDraft)}`}
                            target={(!dmGenerated || !dmDraft.trim()) ? undefined : "_blank"}
                            rel="noopener noreferrer"
                            className={`${styles.redditLinkBtnDM} ${(!dmGenerated || !dmDraft.trim()) ? styles.disabled : ""}`}
                            onClick={(e) => {
                                if (!dmGenerated || !dmDraft.trim()) {
                                    e.preventDefault();
                                    return;
                                }
                                posthog.capture("dm_on_reddit_clicked", { post_id: data.id, author: data.author });
                            }}
                        >
                            Send DM on Reddit →
                        </a>
                    </div>
                </section>
            </div>

            {/* Global Actions */}
            <div className={styles.globalActions}>
                <button
                    onClick={() => {
                        const responded = JSON.parse(localStorage.getItem("legitreach_responded") || "[]");
                        if (!responded.includes(data.id)) {
                            responded.push(data.id);
                            localStorage.setItem("legitreach_responded", JSON.stringify(responded));
                        }
                        router.push("/dashboard");
                    }}
                    className={styles.doneBtnLarge}
                >
                    ✓ Mark as Handled & Return to Dashboard
                </button>
            </div>

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
