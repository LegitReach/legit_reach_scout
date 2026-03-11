"use client";

import { useEffect, useState, useRef } from "react";
import styles from "./morning.module.css";
import { useApp } from "@/context/AppContext";
import RedditList from "@/components/RedditList";
import type { RedditPost } from "@/types";

export default function MorningPage() {
  const { onboarding, cachedMorningPosts, cachedMorningMeta, setMorningCache } =
    useApp();
  const { keywords, oneMinuteBusinessPitch, selectedCommunities } = onboarding;

  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const fetchRef = useRef(false);

  const signature = JSON.stringify([
    keywords,
    oneMinuteBusinessPitch,
    selectedCommunities,
  ]);
  const MORNING_CACHE_TTL = 1000 * 60 * 60 * 12; // 12 hours

  useEffect(() => {
    const controller = new AbortController();

    // Serve from cache when still fresh
    if (
      cachedMorningMeta &&
      cachedMorningMeta.signature === signature &&
      Date.now() - cachedMorningMeta.ts < MORNING_CACHE_TTL
    ) {
      setPosts(cachedMorningPosts as RedditPost[]);
      return () => {
        controller.abort();
      };
    }

    if (fetchRef.current)
      return () => {
        controller.abort();
      };
    fetchRef.current = true;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/morning/brief", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessDescription: oneMinuteBusinessPitch,
            keywords,
            subreddits: selectedCommunities,
          }),
          signal: controller.signal,
        });

        if (res.redirected) {
          window.location.href = res.url;
          return;
        }
        if (!res.ok) {
          setPosts([]);
          return;
        }

        const data = await res.json();
        const fetched: RedditPost[] = data.posts || [];
        setPosts(fetched);
        setSummary(data.summary || "");
        try {
          setMorningCache(fetched, signature);
        } catch {
          /* ignore */
        }
      } catch (err: unknown) {
        if ((err as { name?: string }).name === "AbortError") return;
        console.error("Failed to load morning posts:", err);
        setPosts([]);
      } finally {
        setLoading(false);
        fetchRef.current = false;
      }
    }

    load();
    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, cachedMorningMeta?.ts]);

  return (
    <div className={styles.page}>
      <main className={styles.content}>
        {!selectedCommunities || selectedCommunities.length === 0 ? (
          <div className={styles.empty}>
            <p>
              No communities selected yet — complete onboarding to see
              personalised content.
            </p>
          </div>
        ) : loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Fetching top opportunities…</p>
          </div>
        ) : (
          <section>
            {summary && <p className={styles.summary}>{summary}</p>}
            {posts.length > 0 ? (
              <div style={{ marginTop: 20 }}>
                <h3>Top Matches</h3>
                <RedditList posts={posts} />
              </div>
            ) : (
              <div className={styles.empty}>
                <p>No relevant posts found for today.</p>
                <p>Try updating your keywords or check back later.</p>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
