import { NextRequest, NextResponse } from "next/server";

// This API route calls the Reddit MCP server to get post details

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const postId = searchParams.get("id") || "";
    const subreddit = searchParams.get("subreddit") || "";
    const url = searchParams.get("url") || "";

    if (!postId && !url) {
        return NextResponse.json({ error: "Either 'id' or 'url' parameter is required" }, { status: 400 });
    }

    try {
        // For now, return mock data structure
        // In production, this would call the MCP server
        const mockResult = {
            post: {
                id: postId || "example_id",
                title: "Just hit $10k MRR with zero ad spend - here's my Reddit strategy",
                subreddit: subreddit || "r/startups",
                author: "startup_founder",
                score: 156,
                num_comments: 47,
                created_utc: Date.now() / 1000 - 7200,
                url: url || "https://reddit.com/r/startups/comments/example",
                selftext: `After 6 months of building in public on Reddit, I finally crossed $10k MRR. Here's what worked:

1. **Consistency** - I posted 3x per week in relevant subreddits
2. **Value first** - Never pitched. Always helped first.
3. **Genuine engagement** - Replied to every comment thoughtfully
4. **Built relationships** - DM'd people who seemed like good fits

The key was treating Reddit like a community, not a marketing channel. Happy to answer questions!`,
                permalink: "/r/startups/comments/example",
            },
            comments: [
                {
                    id: "comment_1",
                    author: "curious_reader",
                    body: "This is really helpful! What subreddits did you focus on?",
                    score: 23,
                    created_utc: Date.now() / 1000 - 3600,
                    replies: [
                        {
                            id: "reply_1",
                            author: "startup_founder",
                            body: "Mainly r/startups, r/SaaS, r/Entrepreneur, and niche communities related to my product.",
                            score: 15,
                            created_utc: Date.now() / 1000 - 3000,
                        },
                    ],
                },
                {
                    id: "comment_2",
                    author: "skeptic_user",
                    body: "How do you avoid coming across as spammy when posting 3x per week?",
                    score: 18,
                    created_utc: Date.now() / 1000 - 5400,
                    replies: [],
                },
                {
                    id: "comment_3",
                    author: "fellow_founder",
                    body: "Congrats! What's your product?",
                    score: 12,
                    created_utc: Date.now() / 1000 - 6000,
                    replies: [],
                },
            ],
            mcp_status: "mock_data",
            message: "MCP integration pending - showing mock data",
        };

        return NextResponse.json(mockResult);
    } catch (error) {
        console.error("Reddit post details error:", error);
        return NextResponse.json({ error: "Failed to get post details" }, { status: 500 });
    }
}
