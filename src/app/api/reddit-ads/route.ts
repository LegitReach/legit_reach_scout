import { NextRequest, NextResponse } from "next/server";

// GET /api/reddit-ads?query=...&industries=...&budgets=...&formats=...&placements=...&objectives=...
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  const apiKey = process.env.SCRAPECREATORS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 503 });
  }

  if (!query) {
    return NextResponse.json({ error: "query parameter is required" }, { status: 400 });
  }

  const params = new URLSearchParams({ query });

  // Optional filters
  const industries = searchParams.get("industries");
  const budgets = searchParams.get("budgets");
  const formats = searchParams.get("formats");
  const placements = searchParams.get("placements");
  const objectives = searchParams.get("objectives");

  if (industries) params.set("industries", industries);
  if (budgets) params.set("budgets", budgets);
  if (formats) params.set("formats", formats);
  if (placements) params.set("placements", placements);
  if (objectives) params.set("objectives", objectives);

  try {
    const res = await fetch(
      `https://api.scrapecreators.com/v1/reddit/ads/search?${params}`,
      {
        headers: { "x-api-key": apiKey },
        cache: "no-store",
      }
    );

    const data = await res.json();
    return NextResponse.json(res.ok ? data : { success: false, ads: [] });
  } catch (err) {
    console.error("[reddit-ads] fetch error:", err);
    return NextResponse.json({ success: false, ads: [] });
  }
}
