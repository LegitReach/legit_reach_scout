import { NextRequest, NextResponse } from "next/server";

// This API route calls the Reddit MCP server to search Reddit
// The MCP server must be running for this to work

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const subreddit = searchParams.get("subreddit") || "";
    const sort = searchParams.get("sort") || "relevance";
    const time = searchParams.get("time") || "week";
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!query) {
        return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
    }

    try {
        // For now, return mock data structure
        // In production, this would call the MCP server
        const mockResults = {
            query,
            subreddit,
            sort,
            time,
            posts: [
                {
                    id: "1",
                    title: `Results for "${query}" in ${subreddit || "all subreddits"}`,
                    subreddit: subreddit || "r/startups",
                    author: "example_user",
                    score: 42,
                    num_comments: 15,
                    created_utc: Date.now() / 1000 - 3600,
                    url: "https://reddit.com/r/startups/comments/example",
                    selftext: "This is a sample post matching your search...",
                    permalink: "/r/startups/comments/example",
                },
            ],
            mcp_status: "mock_data",
            message: "MCP integration pending - showing mock data",
        };

        return NextResponse.json(mockResults);
    } catch (error) {
        console.error("Reddit search error:", error);
        return NextResponse.json({ error: "Failed to search Reddit" }, { status: 500 });
    }
}
