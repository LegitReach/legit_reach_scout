import { redis } from "@/lib/redis";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return NextResponse.json({ credits: 0 });
        }

        const credits = await redis.get<number>(`credits:user:${userId}`) || 0;

        // Also get daily hits to show how many free ones left
        const dailyHits = await redis.get<number>(`rl:user:${userId}`) || 0;
        const freeRequestsLeft = Math.max(0, 5 - dailyHits);

        return NextResponse.json({
            credits,
            freeRequestsLeft,
            totalRemaining: credits + freeRequestsLeft
        });
    } catch (error) {
        return NextResponse.json({ credits: 0, freeRequestsLeft: 0 });
    }
}
