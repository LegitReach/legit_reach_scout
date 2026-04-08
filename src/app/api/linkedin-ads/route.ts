import { NextRequest, NextResponse } from "next/server";

// GET /api/linkedin-ads?company=...&keyword=...&companyId=...&countries=...&startDate=...&endDate=...
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);

  const apiKey = process.env.SCRAPECREATORS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 503 });
  }

  const company = searchParams.get("company");
  const keyword = searchParams.get("keyword");
  const companyId = searchParams.get("companyId");

  if (!company && !keyword && !companyId) {
    return NextResponse.json(
      { error: "company, keyword, or companyId parameter is required" },
      { status: 400 }
    );
  }

  const params = new URLSearchParams();
  if (company) params.set("company", company);
  if (keyword) params.set("keyword", keyword);
  if (companyId) params.set("companyId", companyId);

  // Optional filters
  const countries = searchParams.get("countries");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const paginationToken = searchParams.get("paginationToken");

  if (countries) params.set("countries", countries);
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (paginationToken) params.set("paginationToken", paginationToken);

  try {
    const res = await fetch(
      `https://api.scrapecreators.com/v1/linkedin/ads/search?${params}`,
      {
        headers: { "x-api-key": apiKey },
        cache: "no-store",
      }
    );

    const data = await res.json();
    return NextResponse.json(res.ok ? data : { success: false, ads: [] });
  } catch (err) {
    console.error("[linkedin-ads] fetch error:", err);
    return NextResponse.json({ success: false, ads: [] });
  }
}
