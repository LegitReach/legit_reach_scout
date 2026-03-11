import { NextRequest, NextResponse } from "next/server";
import type { RedditPost } from "@/types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "top";
  const timeframe = searchParams.get("time") || "day";
  const limit = parseInt(searchParams.get("limit") || "10");

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 },
    );
  }

  const apiKey = process.env.REDDIT_SCRAPE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "REDDIT_SCRAPE_API_KEY is not configured" },
      { status: 500 },
    );
  }

  try {
    const url = `https://api.scrapecreators.com/v1/reddit/search?query=${encodeURIComponent(query)}&sort=${sort}&timeframe=${timeframe}`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "x-api-key": apiKey },
    });

    if (!res.ok) {
      console.warn(`ScrapeCreators search returned ${res.status}`);
      return NextResponse.json(
        { error: "Failed to fetch search results", posts: [] },
        { status: res.status },
      );
    }

    const data = await res.json();
    const posts: RedditPost[] = (data.posts || [])
      .slice(0, limit)
      .map((post: RedditPost) => ({
        ...post,
        permalink: post.permalink?.startsWith("http")
          ? post.permalink
          : `https://reddit.com${post.permalink}`,
      }));

    return NextResponse.json({ query, sort, timeframe, posts });
  } catch (error) {
    console.error("Reddit search error:", error);
    return NextResponse.json(
      { error: "Failed to search Reddit", posts: [] },
      { status: 500 },
    );
  }
}
