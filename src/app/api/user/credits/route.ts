import { redis } from "@/lib/redis";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const { userId } = getAuth(req);
        
        if (!userId) {
            const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
            const ua = req.headers.get("user-agent") || "";
            const key = ua ? `${ip}:${ua}` : ip;
            
            const dailyHits = await redis.get<number>(`rl:${key}`) || 0;
            const freeRequestsLeft = Math.max(0, 5 - dailyHits);
            
            return NextResponse.json({
                credits: 0,
                freeRequestsLeft,
                totalRemaining: freeRequestsLeft
            });
        }

        const credits = await redis.get<number>(`credits:user:${userId}`) || 0;

        // Also get daily hits to show how many free ones left
        const dailyHits = await redis.get<number>(`rl:user:${userId}`) || 0;
        const freeRequestsLeft = Math.max(0, 10 - dailyHits);

        return NextResponse.json({
            credits,
            freeRequestsLeft,
            totalRemaining: credits + freeRequestsLeft
        });
    } catch (error) {
        return NextResponse.json({ credits: 0, freeRequestsLeft: 0, totalRemaining: 0 });
    }
}
