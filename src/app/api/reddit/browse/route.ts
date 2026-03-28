import { NextRequest, NextResponse } from "next/server";
import { fetchRedditPosts } from "@/lib/reddit-utils";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rawSubreddit = searchParams.get("subreddit") || "all";
  const keywords = searchParams.get("keywords") || "";
  const sort = searchParams.get("sort") || "hot";
  const limit = parseInt(searchParams.get("limit") || "10");

  const keywordList = keywords
    ? keywords.split(",").map((k) => k.trim().toLowerCase())
    : [];

  try {
    const resultPosts = await fetchRedditPosts(rawSubreddit, keywords, sort, limit);

    return NextResponse.json({
      subreddit: rawSubreddit,
      keywords: keywordList,
      sort,
      posts: resultPosts,
      source: resultPosts.length > 0 ? "reddit" : "none",
      message:
        resultPosts.length > 0
          ? "Showing live Reddit posts."
          : "No posts found for this subreddit.",
    });
  } catch (error) {
    console.error("Opportunity search error:", error);
    return NextResponse.json(
      { error: "Failed to find opportunities", posts: [] },
      { status: 500 },
    );
  }
}

