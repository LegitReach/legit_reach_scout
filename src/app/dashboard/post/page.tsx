/* eslint-disable @typescript-eslint/no-explicit-any */
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
You are helping write a Reddit comment. The person posting knows about this business but that context is just for you — do NOT mention the business, pitch anything, or drop links.

Business context (for your understanding only): ${oneMinuteBusinessPitch}

Post title: ${data.title}
Post body: ${data.selftext}
Subreddit: r/${data.subreddit}

Write a short, genuine comment that adds value to the conversation. Rules:
- 1-3 sentences max
- Sound like a real person, not a marketer
- No business mention, no promo, no CTA
- If the post is a question, give a useful answer or perspective
- If it's a rant/story, empathize briefly or add a relevant insight
- No filler phrases like "Great question!" or "I totally understand"

Return ONLY a valid JSON object — no markdown, no extra text:
{ "reply": "your comment here" }
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
You are helping write a short Reddit DM for outreach. It must feel human, not like a sales pitch.

Business context: ${oneMinuteBusinessPitch}
Their post title: "${data.title}"
Their post body: "${data.selftext}"
Sending to: u/${data.author}

Write a brief DM (3-5 sentences max). Rules:
- Open with one specific line referencing their post — show you actually read it
- Briefly mention what the business does and be upfront that you're reaching out because it might be relevant (full disclosure)
- Say something like "no pressure at all" — make it clear there's zero obligation
- End with a single soft ask: would they be open to a quick 15-min call to chat more?
- No bullet points, no headers, no hype words
- Conversational tone — write like you're texting someone you respect

Return ONLY a valid JSON object — no markdown, no extra text:
{ "reply": "your dm here" }
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
                        href={data.url}
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
                            href={data.url}
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
