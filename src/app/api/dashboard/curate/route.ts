import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { getAuth } from "@clerk/nextjs/server";
import { createHash } from "crypto";
import { consumeRequest, consumeAnonymousRequest } from "@/lib/consumption";

const CACHE_TTL = 60 * 60 * 24; // 24 hours caching

function getClientIp(req: Request) {
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

async function handler(request: NextRequest): Promise<NextResponse> {
  let userId: string | null = null;

  try {
    const { subreddits, keywords, businessDescription } = await request.json();

    if (!subreddits || !Array.isArray(subreddits) || subreddits.length === 0) {
      return NextResponse.json({ error: "subreddits array is required" }, { status: 400 });
    }
    if (!businessDescription) {
      return NextResponse.json({ error: "businessDescription is required" }, { status: 400 });
    }

    try {
      userId = getAuth(request).userId;
    } catch {
      userId = null;
    }

    // 1. Generate unique JOB ID (Hash)
    const signature = JSON.stringify([
      subreddits.sort(),
      (keywords || []).sort(),
      businessDescription
    ]);
    const hash = createHash('sha256').update(signature).digest('hex');
    const cacheKey = `curate:v2:${hash}`;

    // 2. CHECK CACHE (Return immediately if already processed)
    const cached = await redis.get<any>(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, fromCache: true });
    }

    // 3. CONSUMPTION / RATE LIMIT CHECK (Only on cache miss)
    if (userId) {
      const { allowed, error, redirectTo } = await consumeRequest(userId);
      if (!allowed) return NextResponse.json({ error, redirectTo }, { status: 429 });
    } else {
      const ip = getClientIp(request);
      const ua = request.headers.get("user-agent");
      const { allowed, error, redirectTo } = await consumeAnonymousRequest(ip, ua, 5);
      if (!allowed) return NextResponse.json({ error, redirectTo }, { status: 429 });
    }

    // 4. HAND OFF TO BACKGROUND WORKER
    // Use an absolute URL for the internal fetch
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${request.headers.get('host')}`;

    // We don't 'await' the full execution, just the worker's acknowledgment (202 Accepted)
    const workerRes = await fetch(`${baseUrl}/api/worker/curate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: hash,
        subreddits,
        keywords,
        businessDescription,
        userId
      }),
    });

    if (!workerRes.ok) {
      throw new Error("Failed to start background worker");
    }

    // 5. RETURN PROCESSING STATUS
    // The frontend will see this and start listening to the Realtime channel
    return NextResponse.json({
      status: "processing",
      jobId: hash
    }, { status: 202 });

  } catch (err: any) {
    console.error("Dashboard Curate API error:", err);
    return NextResponse.json(
      { error: "Failed to initiate curation", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export const POST = handler;
