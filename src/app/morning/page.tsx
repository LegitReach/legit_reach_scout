"use client";

import { useEffect, useState, useRef } from "react";
import styles from "./morning.module.css";
import { useApp } from "@/context/AppContext";
import NewsletterCard from "@/components/NewsletterCard";
import type { RedditPost } from "@/types";
import { useUser } from "@clerk/nextjs";

export default function MorningPage() {
  const { user } = useUser();
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

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, cachedMorningMeta?.ts]);

  return (
    <div className={styles.page}>
      <header className={styles.newsletterHeader}>
        <h1>LegitReach</h1>
        <div className={styles.newsletterMeta}>
          <span>{today}</span>
          <span className={styles.divider}></span>
          <span>Vol. 1, Issue {new Date().getDate()}</span>
        </div>
      </header>

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
            <p>Curating your personalized briefing...</p>
          </div>
        ) : (
          <div className="animate-fade-in">
            <section className={styles.editorial}>
              <h2 className={styles.editorialTitle}>
                Good Morning, {user?.firstName || "Scout"}!
              </h2>
              <p className={styles.summary}>
                {summary || "We've scanned your selected subreddits for the most relevant opportunities that match your profile. Here's what needs your attention today."}
              </p>
            </section>

            <div className={styles.sectionHeader}>
              <h2>Top Opportunities</h2>
              <div className={styles.sectionLine}></div>
            </div>

            {posts.length > 0 ? (
              <div className={styles.postsList}>
                {posts.map((post) => (
                  <NewsletterCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className={styles.empty}>
                <p>No relevant posts found for today.</p>
                <p>Try updating your keywords or check back later.</p>
              </div>
            )}

            <footer style={{ marginTop: 60, textAlign: 'center', opacity: 0.5, fontSize: '0.8rem' }}>
              <p>© {new Date().getFullYear()} LegitReach. Curated for your business success.</p>
            </footer>
          </div>
        )}
      </main>
    </div>
  );
}
