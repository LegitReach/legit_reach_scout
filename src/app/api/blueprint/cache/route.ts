import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { redis } from "@/lib/redis";

const CURATE_TTL = 86400; // 24h in seconds

function curateKey(userId: string, subreddit: string): string {
  const sub = subreddit.startsWith("r/") ? subreddit.slice(2).toLowerCase() : subreddit.toLowerCase();
  return `blueprint:${userId}:${sub}`;
}

// Writes pre-computed curate blueprints to Redis after OAuth sign-in.
// Called when the user had an unauthenticated scan in sessionStorage —
// curate already ran on the client so we cache the results directly.
export async function POST(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { slots } = body;

  if (!Array.isArray(slots)) {
    return NextResponse.json({ error: "slots must be an array" }, { status: 400 });
  }

  let cached = 0;
  for (const slot of slots) {
    if (!slot?.data || !slot?.community?.subreddit) continue;
    await redis.set(curateKey(userId, slot.community.subreddit), slot.data, { ex: CURATE_TTL });
    console.log(`[blueprint/cache] cached — ${slot.community.subreddit}`);
    cached++;
  }

  console.log(`[blueprint/cache] ${cached}/${slots.length} slots cached for user ${userId}`);
  return NextResponse.json({ success: true, cached });
}
