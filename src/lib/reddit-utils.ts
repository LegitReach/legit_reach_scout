import type { RedditPost } from "@/types";

/**
 * GLOBAL SEARCH: Searches across all subreddits based on an AI-generated query.
 * Timeframe: "day" (past 24h), "week", "month", "all".
 * Sort: "relevance", "top", "new".
 */
export async function searchRedditGlobal(
  query: string,
  timeframe: string = "day",
  sort: string = "relevance",
  limit: number = 25
): Promise<RedditPost[]> {
  const encodedQuery = encodeURIComponent(query);
  const redditUrl = `https://www.reddit.com/search.json?q=${encodedQuery}&t=${timeframe}&sort=${sort}&limit=${limit}&raw_json=1`;
  
  try {
    const redditResponse = await fetch(redditUrl, {
      headers: { "User-Agent": "LegitReach/1.1" },
    });

    if (!redditResponse.ok) {
      console.warn(`Reddit public search failed: ${redditResponse.status}`);
      return [];
    }

    const redditData = await redditResponse.json();
    const children = redditData?.data?.children || [];
    
    return children
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
  } catch (error) {
    console.error("searchRedditGlobal error:", error);
    return [];
  }
}

/**
 * SUBREDDIT FETCH: Fetches posts from a specific subreddit.
 */
export async function fetchRedditPosts(
  subreddit: string, 
  keywords: string, 
  sort: string = "hot", 
  limit: number = 10
): Promise<RedditPost[]> {
  const rawSubreddit = subreddit || "all";
  const cleanSubreddit = rawSubreddit.startsWith("r/") ? rawSubreddit.slice(2) : rawSubreddit;
  
  const keywordList = keywords
    ? keywords.split(",").map((k) => k.trim().toLowerCase())
    : [];

  const redditUrl = `https://www.reddit.com/r/${cleanSubreddit}/${sort}.json?limit=${limit}&raw_json=1`;
  
  try {
    const redditResponse = await fetch(redditUrl, {
      headers: { "User-Agent": "LegitReach/1.1" },
    });

    if (!redditResponse.ok) {
      console.warn(`Reddit public fetch failed: ${redditResponse.status}`);
      return [];
    }

    const redditData = await redditResponse.json();
    const children = redditData?.data?.children || [];
    let resultPosts: RedditPost[] = children
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
