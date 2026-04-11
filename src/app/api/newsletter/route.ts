import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

// ──────────────────────────────────────────────────────────
// POST /api/newsletter
//
// Accepts: { url: string, brandName?: string }
// Returns: { articles: NewsArticle[], trends: TrendItem[], brandMeta: BrandMeta }
//
// Aggregates free public data:
// 1. Google News RSS for brand-related articles
// 2. Google Trends (interest over time)
// 3. Basic brand metadata from the store URL
// ──────────────────────────────────────────────────────────

interface NewsArticle {
  title: string;
  source: string;
  url: string;
  snippet: string;
  timestamp: string;
}

interface TrendItem {
  keyword: string;
  interest: string; // "Rising", "Breakout", "+120%", etc.
}

interface BrandMeta {
  title: string;
  description: string;
  ogImage: string;
  domain: string;
}

// Extract brand name from URL/meta
function extractBrandName(url: string, metaTitle?: string): string {
  if (metaTitle) {
    // Take first meaningful chunk before separators
    const cleaned = metaTitle.split(/[|\-–—:]/)[0].trim();
    if (cleaned.length > 1 && cleaned.length < 60) return cleaned;
  }
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, "").split(".")[0];
  } catch {
    return url;
  }
}

// 1. Fetch Google News via RSS
async function fetchGoogleNews(query: string): Promise<NewsArticle[]> {
  try {
    const encoded = encodeURIComponent(query);
    const rssUrl = `https://news.google.com/rss/search?q=${encoded}+when:7d&hl=en-US&gl=US&ceid=US:en`;

    const res = await fetch(rssUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; LegitReach/1.0; +https://legitreach.com)",
      },
      next: { revalidate: 900 }, // 15 min cache
    });

    if (!res.ok) return [];

    const xml = await res.text();
    const $ = cheerio.load(xml, { xmlMode: true });

    const articles: NewsArticle[] = [];
    $("item")
      .slice(0, 8)
      .each((_, el) => {
        const title = $(el).find("title").text().trim();
        const link = $(el).find("link").text().trim();
        const pubDate = $(el).find("pubDate").text().trim();
        const source = $(el).find("source").text().trim();
        const description = $(el).find("description").text().trim();

        // Clean up the description (strip HTML)
        const snippetClean = description
          .replace(/<[^>]*>/g, "")
          .substring(0, 200);

        if (title) {
          articles.push({
            title,
            source: source || "Google News",
            url: link,
            snippet: snippetClean,
            timestamp: pubDate,
          });
        }
      });

    return articles;
  } catch (err) {
    console.error("Google News fetch error:", err);
    return [];
  }
}

// 2. Fetch Google Trends related queries
async function fetchGoogleTrends(query: string): Promise<TrendItem[]> {
  try {
    const encoded = encodeURIComponent(query);
    // Google Trends RSS for related topics
    const trendsUrl = `https://trends.google.com/trends/trendingsearches/daily/rss?geo=US`;

    const res = await fetch(trendsUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; LegitReach/1.0; +https://legitreach.com)",
      },
      next: { revalidate: 3600 }, // 1hr cache
    });

    if (!res.ok) return [];
    const xml = await res.text();
    const $ = cheerio.load(xml, { xmlMode: true });

    const trends: TrendItem[] = [];
    $("item")
      .slice(0, 6)
      .each((_, el) => {
        const title = $(el).find("title").text().trim();
        const traffic = $(el).find("ht\\:approx_traffic").text().trim();
        if (title) {
          trends.push({
            keyword: title,
            interest: traffic || "Trending",
          });
        }
      });

    // Also try to make a direct query-based trend link
    // (we can't scrape the actual Trends page easily, but we provide the link)
    if (trends.length === 0) {
      trends.push({
        keyword: query,
        interest: "View on Google Trends",
      });
    }

    return trends;
  } catch (err) {
    console.error("Google Trends fetch error:", err);
    return [{ keyword: query, interest: "View on Google Trends" }];
  }
}

// 3. Scrape brand metadata from the store URL
async function fetchBrandMeta(url: string): Promise<BrandMeta> {
  const defaultMeta: BrandMeta = {
    title: "",
    description: "",
    ogImage: "",
    domain: "",
  };

  try {
    const parsed = new URL(url);
    defaultMeta.domain = parsed.hostname;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html",
      },
    });

    if (!res.ok) return defaultMeta;

    const html = await res.text();
    const $ = cheerio.load(html);

    defaultMeta.title =
      $('meta[property="og:title"]').attr("content") ||
      $("title").text().trim() ||
      "";
    defaultMeta.description =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      "";
    defaultMeta.ogImage =
      $('meta[property="og:image"]').attr("content") || "";

    return defaultMeta;
  } catch (err) {
    console.error("Brand meta fetch error:", err);
    return defaultMeta;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { url, brandName: providedBrandName } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    let targetUrl = url;
    if (!targetUrl.startsWith("http")) {
      targetUrl = `https://${targetUrl}`;
    }

    // Run all fetches in parallel
    const brandMetaPromise = fetchBrandMeta(targetUrl);
    const brandMeta = await brandMetaPromise;

    // Priority: 1. Extract from Meta Title, 2. provided brand name, 3. Extract from Domain
    const extractedBrandName = extractBrandName(targetUrl, brandMeta.title);
    const brandNameForDisplay = (extractedBrandName && extractedBrandName !== targetUrl) 
      ? extractedBrandName 
      : (providedBrandName || extractedBrandName);

    const [articles, trends] = await Promise.all([
      fetchGoogleNews(providedBrandName || brandNameForDisplay),
      fetchGoogleTrends(providedBrandName || brandNameForDisplay),
    ]);

    return NextResponse.json({
      articles,
      trends,
      brandMeta: { ...brandMeta, brandName: brandNameForDisplay },
    });
  } catch (err) {
    console.error("Newsletter API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch newsletter data" },
      { status: 500 }
    );
  }
}
