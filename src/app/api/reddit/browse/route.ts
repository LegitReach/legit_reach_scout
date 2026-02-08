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

        const now = Date.now() / 1000;

        // Generate contextual posts based on subreddit and keywords
        const keywordList = keywords ? keywords.split(",").map(k => k.trim()) : ["your product", "this topic"];
        const searchQuery = keywordList.join(' OR ');

        const url = `https://reddapi.p.rapidapi.com/api/v2/search/subreddit?subreddit=${subreddit}&query=${searchQuery}&sort=new&time_filter=week&limit=${limit}`;

        const options = {
            method: 'GET',
            headers: {
                'x-rapidapi-key': '7ca6f694c3mshb75b5cdefb5cf4ep1bdf38jsn2310d6cbee70',
                'x-rapidapi-host': 'reddapi.p.rapidapi.com'
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

        /**
         *      id: `post_${subreddit}_${idx}_${Date.now()}`,
                title: template.titleTemplate
                    .replace("[KEYWORD]", keyword)
                    .replace("[CONTEXT]", context),
                selftext: template.textTemplate
                    .replace(/\[KEYWORD\]/g, keyword)
                    .replace("[generic]", "a basic tool"),
                subreddit: `r/${subreddit}`,
                author: `user_${Math.random().toString(36).substring(7)}`,
                score: Math.floor(Math.random() * 200) + 10,
                num_comments: Math.floor(Math.random() * 50) + 5,
                created_utc: now - (idx * 3600 * 2), // Stagger by 2 hours
                permalink: `/r/${subreddit}/comments/example_${idx}`,
                url: `https://reddit.com/r/${subreddit}/comments/example_${idx}`,
                opportunity_type: template.opportunity,
                relevance_score: 95 - (idx * 3), // Decreasing relevance
         * 
         * 
         * 
         */


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
