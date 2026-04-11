import { NextRequest, NextResponse } from "next/server";

// GET /api/google-ads?domain=...&advertiser_id=...&topic=...&region=...&start_date=...&end_date=...
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);

  const apiKey = process.env.SCRAPECREATORS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 503 });
  }

  const domain = searchParams.get("domain");
  const advertiserId = searchParams.get("advertiser_id");

  if (!domain && !advertiserId) {
    return NextResponse.json(
      { error: "domain or advertiser_id parameter is required" },
      { status: 400 }
    );
  }

  const params = new URLSearchParams();
  if (domain) params.set("domain", domain);
  if (advertiserId) params.set("advertiser_id", advertiserId);

  // Optional filters
  const topic = searchParams.get("topic");
  const region = searchParams.get("region");
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");

  if (topic) params.set("topic", topic);
  if (region) params.set("region", region);
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);

  try {
    const res = await fetch(
      `https://api.scrapecreators.com/v1/google/company/ads?${params}`,
      {
        headers: { "x-api-key": apiKey },
        cache: "no-store",
      }
    );

    const data = await res.json();
    return NextResponse.json(res.ok ? data : { success: false, ads: [] });
  } catch (err) {
    console.error("[google-ads] fetch error:", err);
    return NextResponse.json({ success: false, ads: [] });
  }
}
