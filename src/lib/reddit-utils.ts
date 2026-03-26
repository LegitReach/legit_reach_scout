import type { RedditPost } from "@/types";

export async function fetchRedditPosts(subreddit: string, keywords: string, sort: string = "hot", limit: number = 10): Promise<RedditPost[]> {
  const rawSubreddit = subreddit || "all";
  // Normalise: strip leading "r/" so "r/startups" and "startups" both work
  const cleanSubreddit = rawSubreddit.startsWith("r/")
    ? rawSubreddit.slice(2)
    : rawSubreddit;
  
  const keywordList = keywords
    ? keywords.split(",").map((k) => k.trim().toLowerCase())
    : [];

  let resultPosts: RedditPost[] = [];

  const apiKey = process.env.REDDIT_SCRAPE_API_KEY;

  try {
    // Primary: ScrapeCreators API
    if (apiKey) {
      const scUrl = `https://api.scrapecreators.com/v1/reddit/subreddit?subreddit=${cleanSubreddit}&timeframe=day&sort=top`;
      let scResponse;
      try {
        scResponse = await fetch(scUrl, {
          method: "GET",
          headers: { "x-api-key": apiKey },
          // Add a signal or timeout?
        });

        if (scResponse.ok) {
          const scData = await scResponse.json();
          if (scData.posts && scData.posts.length > 0) {
            resultPosts = scData.posts.map((post: any) => ({
              ...post,
              permalink: post.permalink?.startsWith("http")
                ? post.permalink
                : `https://reddit.com${post.permalink}`,
            }));
          }
        } else {
          console.warn(
            `ScrapeCreators returned ${scResponse.status}, falling back to Reddit public API`,
          );
        }
      } catch (e) {
        console.warn("ScrapeCreators fetch failed (network error), falling back to Reddit", e);
      }
    }

    // Fallback: Reddit's own public JSON API (no key needed)
    if (resultPosts.length === 0) {
      const redditUrl = `https://www.reddit.com/r/${cleanSubreddit}/${sort}.json?limit=${limit}&raw_json=1`;
      try {
        const redditResponse = await fetch(redditUrl, {
          headers: { "User-Agent": "LegitReach/1.0" },
        });

        if (redditResponse.ok) {
          const redditData = await redditResponse.json();
          const children = redditData?.data?.children || [];
          resultPosts = children
            .filter((child: any) => child.kind === "t3")
            .map((child: any) => {
              const p = child.data;
              return {
                id: p.id,
                title: p.title,
                subreddit: `r/${p.subreddit}`,
                author: p.author,
                score: p.score,
                num_comments: p.num_comments,
                created_utc: p.created_utc,
                selftext: p.selftext || "",
                permalink: `https://reddit.com${p.permalink}`,
                url: p.url,
              };
            });
        }
      } catch (e) {
        console.warn("Reddit public fetch failed", e);
      }
    }

    // If keywords are provided, score relevance and sort
    if (keywordList.length > 0 && resultPosts.length > 0) {
      resultPosts = resultPosts.map((post) => {
        const text = `${post.title} ${post.selftext}`.toLowerCase();
        const matchCount = keywordList.filter((kw) => text.includes(kw)).length;
        const relevance = Math.round((matchCount / keywordList.length) * 100);
        return {
          ...post,
          relevance_score: relevance > 0 ? relevance : undefined,
          opportunity_type:
            relevance > 50
              ? "High relevance"
              : relevance > 0
                ? "Potential match"
                : undefined,
        };
      });

      // Sort: keyword matches first, then by score
      resultPosts.sort((a, b) => {
        const aRel = a.relevance_score || 0;
        const bRel = b.relevance_score || 0;
        if (aRel !== bRel) return bRel - aRel;
        return b.score - a.score;
      });
    }

    return resultPosts;
  } catch (error) {
    console.error("fetchRedditPosts error:", error);
    return [];
  }
}
