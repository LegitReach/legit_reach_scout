import { NextRequest, NextResponse } from "next/server";

// GET /api/meta-ads?candidates=PharmAdva,PharmAdva+MedaCube,medacube
// GET /api/meta-ads?companyName=Nike   (single name, backwards-compat)
// GET /api/meta-ads?pageId=12345
//
// Tries each candidate in order and returns the first one with results.
// Returns { results: [], searchResultsCount: 0 } if all candidates fail (not an error).

async function tryCompanyName(name: string, apiKey: string): Promise<{ results: unknown[]; searchResultsCount: number } | null> {
  const params = new URLSearchParams({ companyName: name, status: "ACTIVE" });
  const url = `https://api.scrapecreators.com/v1/facebook/adLibrary/company/ads?${params}`;
  console.log(`[meta-ads] trying companyName="${name}"`);

  try {
    const res = await fetch(url, {
      headers: { "x-api-key": apiKey },
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) {
      console.log(`[meta-ads] "${name}" → ${res.status}: ${text.slice(0, 120)}`);
      return null; // bad_request or similar — try next candidate
    }
    const data = JSON.parse(text);
    const count = data.results?.length ?? 0;
    console.log(`[meta-ads] "${name}" → ${count} results`);
    return data;
  } catch (err) {
    console.error(`[meta-ads] fetch error for "${name}":`, err);
    return null;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const candidatesParam = searchParams.get("candidates") ?? "";
  const companyName = searchParams.get("companyName");
  const pageId = searchParams.get("pageId");

  const apiKey = process.env.SCRAPECREATORS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Meta Ads API not configured" }, { status: 503 });
  }

  // pageId is always unambiguous — just fetch directly
  if (pageId) {
    const params = new URLSearchParams({ pageId, status: "ACTIVE" });
    const url = `https://api.scrapecreators.com/v1/facebook/adLibrary/company/ads?${params}`;
    try {
      const res = await fetch(url, { headers: { "x-api-key": apiKey }, cache: "no-store" });
      const data = await res.json();
      return NextResponse.json(res.ok ? data : { results: [], searchResultsCount: 0 });
    } catch {
      return NextResponse.json({ results: [], searchResultsCount: 0 });
    }
  }

  // Build candidates list
  const candidates: string[] = candidatesParam
    ? candidatesParam.split(",").map(s => s.trim()).filter(Boolean)
    : companyName
    ? [companyName]
    : [];

  if (candidates.length === 0) {
    return NextResponse.json({ error: "candidates or pageId required" }, { status: 400 });
  }

  // Try each candidate — return first with results
  for (const name of candidates) {
    const data = await tryCompanyName(name, apiKey);
    if (data && (data.results?.length ?? 0) > 0) {
      return NextResponse.json(data);
    }
  }

  // All candidates exhausted — no ads found (not an API error)
  console.log("[meta-ads] no results for any candidate:", candidates);
  return NextResponse.json({ results: [], searchResultsCount: 0 });
}
