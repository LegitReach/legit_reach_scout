import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "./rate-limit";
import { getAuth } from "@clerk/nextjs/server";

// wrap a handler so that rate limiting runs first.
// handler should be a function expecting a NextRequest and returning a Response/NextResponse.
export function withRateLimit(
  handler: (req: NextRequest) => Promise<Response | NextResponse>,
  maxRequests: number = 5
) {
  return async function (req: NextRequest) {
    // try to determine if caller is authenticated by Clerk; if middleware isn't active this will throw
    let userId: string | null | undefined;
    try {
      userId = getAuth(req).userId;
    } catch (err) {
      // middleware not present or not matched; we'll treat as anonymous
      userId = null;
    }

    if (userId) {
      try {
        // Logged in user limit is 5
        const { allowed } = await checkRateLimit(`user:${userId}`, 5);

        if (!allowed) {
          const redirectUrl = new URL("/subscribe", req.url);
          const accept = req.headers.get("accept") || "";

          // If it's a browser request, redirect to subscription page
          if (accept.includes("text/html") || accept === '*/*') {
            return NextResponse.redirect(redirectUrl);
          }
          // For API calls, return 429
          return NextResponse.json(
            { error: "Rate limit exceeded. Please subscribe for more.", redirectTo: "/subscribe" },
            { status: 429 }
          );
        }
      } catch (err) {
        console.warn("User rate limit check failed", err);
      }
      return handler(req);
    }

    const ip = getClientIp(req);
    try {
      const { allowed } = await checkRateLimit(`${ip}:${req.headers.get("user-agent")}`, maxRequests);

      if (!allowed) {
        const redirectUrl = new URL("/auth", req.url);
        // after login we just send users back to home page
        redirectUrl.searchParams.set("returnUrl", "/");
        const accept = req.headers.get("accept") || "";
        if (accept.includes("text/html") || accept === '*/*') {
          return NextResponse.redirect(redirectUrl);
        }
        return NextResponse.json({ error: "Rate limit reached. Please login to continue.", redirectTo: "/auth" }, { status: 429 });
      }
    } catch (err) {
      console.warn("rate limit check failed", err);
    }

    return handler(req);
  };
}


function getClientIp(req: Request) {
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "unknown";
}
