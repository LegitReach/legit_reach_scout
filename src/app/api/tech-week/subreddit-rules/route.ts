import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 15;

const JINA_API_KEY = process.env.JINA_API_KEY;

export interface SubredditRulesResponse {
  subreddit: string;
  rulesUrl: string;
  rules: Array<{ name: string; description: string }>;
  rulesText: string;
}


interface RedditRule {
  short_name: string;
  description: string;
  priority: number;
}

interface RedditRulesJson {
  rules: RedditRule[];
}

function parseRulesFromContent(
  content: string
): Array<{ name: string; description: string }> {
  // Jina may wrap the JSON inside markdown code fences — strip them
  const stripped = content.replace(/```json|```/g, "").trim();

  // Extract the first valid JSON object from the content
  const jsonMatch = stripped.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return [];

  try {
    const parsed: RedditRulesJson = JSON.parse(jsonMatch[0]);
    return (parsed.rules ?? [])
      .sort((a, b) => a.priority - b.priority)
      .map((r) => ({
        name: r.short_name?.trim() || "Unnamed rule",
        description: r.description?.trim() || "",
      }));
  } catch {
    return [];
  }
}

function formatRulesAsText(
  rules: Array<{ name: string; description: string }>
): string {
  return rules
    .map(
      (r, i) =>
        `Rule ${i + 1}: ${r.name}${r.description ? `\n${r.description}` : ""}`
    )
    .join("\n\n");
}


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("subreddit");

  if (!raw) {
    return NextResponse.json(
      { error: "subreddit query parameter is required" },
      { status: 400 }
    );
  }

  const subreddit = raw.startsWith("r/") ? raw.slice(2) : raw;

  const rulesUrl = `https://www.reddit.com/r/${subreddit}/about/rules.json`;
  const jinaUrl = `https://r.jina.ai/${rulesUrl}`;

  const headers: HeadersInit = {
    Accept: "application/json",
    "X-Return-Format": "markdown",
  };
  if (JINA_API_KEY) {
    headers["Authorization"] = `Bearer ${JINA_API_KEY}`;
  }

  try {
    const jinaRes = await fetch(jinaUrl, { headers });

    if (!jinaRes.ok) {
      console.error("[subreddit-rules] Jina error:", jinaRes.status);
      return NextResponse.json(
        { error: `Jina fetch failed: ${jinaRes.status}` },
        { status: 502 }
      );
    }

    const json = await jinaRes.json();
    const content: string = (json?.data?.content ?? "").trim();

    if (!content) {
      return NextResponse.json(
        {
          error: `No content returned for r/${subreddit}. It may be private, banned, or non-existent.`,
        },
        { status: 404 }
      );
    }

    const rules = parseRulesFromContent(content);

    if (rules.length === 0) {
      return NextResponse.json(
        {
          error: `Could not parse rules for r/${subreddit}. The community may have no rules set.`,
        },
        { status: 404 }
      );
    }

    const response: SubredditRulesResponse = {
      subreddit,
      rulesUrl,
      rules,
      rulesText: formatRulesAsText(rules),
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[subreddit-rules] Unexpected error:", err);
    return NextResponse.json(
      { error: "Failed to fetch subreddit rules. Please try again." },
      { status: 500 }
    );
  }
}
