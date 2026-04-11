import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { consumeRequest, consumeAnonymousRequest } from "@/lib/consumption";

// POST /api/user/consume-credit
// Consumes 1 credit for Competitive Intelligence scan
export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    
    let result;
    
    if (!userId) {
      const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
      const ua = req.headers.get("user-agent") || "";
      result = await consumeAnonymousRequest(ip, ua, 5);
      
      // If anonymous limit blocked, redirect to sign-up/onboarding ideally, or auth
      if (!result.allowed) {
        result.redirectTo = "/auth";
      }
    } else {
      result = await consumeRequest(userId);
    }

    return NextResponse.json({
      allowed: result.allowed,
      source: result.source,
      remainingCredits: result.remainingCredits,
      remainingFree: result.remainingFree,
      error: result.error,
      redirectTo: result.redirectTo,
    });
  } catch {
    return NextResponse.json(
      { allowed: false, error: "Failed to check credits" },
      { status: 500 }
    );
  }
}
