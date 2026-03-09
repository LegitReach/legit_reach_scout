import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const postId = searchParams.get("id") || "";

  if (!postId) {
    return NextResponse.json(
      { error: "'id' parameter is required" },
      { status: 400 },
    );
  }

  try {
    // Reddit's public JSON API — no API key needed
    const redditUrl = `https://www.reddit.com/comments/${postId}.json?raw_json=1`;
    const res = await fetch(redditUrl, {
      headers: { "User-Agent": "LegitReach/1.0" },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const [postListing, commentsListing] = await res.json();
    const postData = postListing?.data?.children?.[0]?.data;

    if (!postData) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const post = {
      id: postData.id,
      title: postData.title,
      subreddit: `r/${postData.subreddit}`,
      author: postData.author,
      score: postData.score,
      num_comments: postData.num_comments,
      created_utc: postData.created_utc,
      selftext: postData.selftext || "",
      url: postData.url,
      permalink: `https://reddit.com${postData.permalink}`,
    };

    const comments = (commentsListing?.data?.children || [])
      .filter((c: { kind: string }) => c.kind === "t1")
      .slice(0, 10)
      .map(
        (c: {
          data: {
            id: string;
            author: string;
            body: string;
            score: number;
            created_utc: number;
          };
        }) => ({
          id: c.data.id,
          author: c.data.author,
          body: c.data.body,
          score: c.data.score,
          created_utc: c.data.created_utc,
        }),
      );

    return NextResponse.json({ ...post, comments });
  } catch (error) {
    console.error("Reddit post fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 },
    );
  }
}
