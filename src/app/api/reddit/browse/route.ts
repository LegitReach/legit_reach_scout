import { NextRequest, NextResponse } from "next/server";

interface RedditPost {
    id: string;
    title: string;
    subreddit: string;
    author: string;
    score: number;
    num_comments: number;
    created_utc: number;
    selftext: string;
    permalink: string;
    url: string;
    relevance_score?: number;
    opportunity_type?: string;
}


export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const subreddit = searchParams.get("subreddit") || "all";
    const keywords = searchParams.get("keywords") || "";
    const sort = searchParams.get("sort") || "hot";
    const limit = parseInt(searchParams.get("limit") || "10");

    const keywordList = keywords
        ? keywords.split(",").map(k => k.trim().toLowerCase())
        : [];

    let resultPosts: RedditPost[] = [];

    const apiKey = process.env.NEXT_PUBLIC_REDDIT_SCRAPE_API_KEY;
    if (!apiKey) {
        throw new Error('Reddit Scrape API KEY  is not set');
    }


    try {
        // Primary: ScrapeCreators API
        const scUrl = `https://api.scrapecreators.com/v1/reddit/subreddit?subreddit=${subreddit}&timeframe=day&sort=top`;
        const scResponse = await fetch(scUrl, {
            method: "GET",
            headers: { "x-api-key": apiKey },
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
            console.warn(`ScrapeCreators returned ${scResponse.status}, falling back to Reddit public API`);
        }

        // Fallback: Reddit's own public JSON API (no key needed)
        if (resultPosts.length === 0) {
            const redditUrl = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}&raw_json=1`;
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
        }

        // If keywords are provided, score relevance and sort
        if (keywordList.length > 0 && resultPosts.length > 0) {
            resultPosts = resultPosts.map(post => {
                const text = `${post.title} ${post.selftext}`.toLowerCase();
                const matchCount = keywordList.filter(kw => text.includes(kw)).length;
                const relevance = Math.round((matchCount / keywordList.length) * 100);
                return {
                    ...post,
                    relevance_score: relevance > 0 ? relevance : undefined,
                    opportunity_type:
                        relevance > 50 ? "High relevance"
                            : relevance > 0 ? "Potential match"
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

        return NextResponse.json({
            subreddit,
            keywords: keywordList,
            sort,
            posts: resultPosts,
            source: resultPosts.length > 0 ? "scrapecreators" : "none",
            message: resultPosts.length > 0
                ? "Showing live Reddit posts."
                : "No posts found for this subreddit.",
        });
    } catch (error) {
        console.error("Opportunity search error:", error);
        return NextResponse.json(
            { error: "Failed to find opportunities", posts: [] },
            { status: 500 }
        );
    }
}
