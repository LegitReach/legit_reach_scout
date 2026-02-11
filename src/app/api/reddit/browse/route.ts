import { NextRequest, NextResponse } from "next/server";
// This API route searches Reddit for opportunities matching keywords and subreddits
// When MCP is connected, this will use real search_reddit and browse_subreddit
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
    const subreddit = searchParams.get("subreddit");
    const keywords = searchParams.get("keywords") || "";
    const sort = searchParams.get("sort") || "hot";
    const limit = parseInt(searchParams.get("limit") || "4");
    let resultPosts:RedditPost[] = [];

    try {
        // Simulate MCP browse_subreddit + search_reddit results
        // This will be replaced with real MCP calls


        // Generate contextual posts based on subreddit and keywords
        const keywordList = keywords ? keywords.split(",").map(k => k.trim()) : ["your product", "this topic"];

        const url = `https://api.scrapecreators.com/v1/reddit/subreddit?subreddit=${subreddit}&timeframe=day&sort=top`;

        const apiKey = process.env.NEXT_PUBLIC_REDDIT_SCRAPE_API_KEY;

        if(!apiKey) throw new Error('SCRAPE REDDIT API KEY is not set');


        const options = {
            method: 'GET',
            headers: {
                "x-api-key": apiKey
            }
        };

        try {
            const response = await fetch(url, options);
            const relevantRedditResponse = await response.json();
            if(relevantRedditResponse['posts']){
                resultPosts = relevantRedditResponse['posts'];
                resultPosts = resultPosts.map((post, idx) => ({
                    ...post,
                    permalink: `https://reddit.com${post.permalink}`,
                }));
            } 
        }
        catch (error) {
            console.error(error);
        }

        // Generate posts
        return NextResponse.json({
            subreddit,
            keywords: keywordList,
            sort,
            posts: resultPosts,
            source: "mcp_simulation", // Will be "mcp" when real
            message: "Showing simulated opportunities. Connect MCP for real data.",
        });
    } catch (error) {
        console.error("Opportunity search error:", error);
        return NextResponse.json({ error: "Failed to find opportunities" }, { status: 500 });
    }
}
