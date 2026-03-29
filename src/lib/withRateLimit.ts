import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "./rate-limit";
import { getAuth } from "@clerk/nextjs/server";
import { consumeRequest, consumeAnonymousRequest } from "./consumption";

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
      const { allowed, redirectTo, error } = await consumeRequest(userId);

      if (!allowed) {
        if (redirectTo) {
          const redirectUrl = new URL(redirectTo, req.url);
          const accept = req.headers.get("accept") || "";
          if (accept.includes("text/html") && !accept.includes("*/*")) {
            return NextResponse.redirect(redirectUrl);
          }
        }
        return NextResponse.json({ error, redirectTo }, { status: 429 });
      }

      return handler(req);
    }

    const ip = getClientIp(req);
    const ua = req.headers.get("user-agent");
    const { allowed, redirectTo, error } = await consumeAnonymousRequest(ip, ua, maxRequests);

    if (!allowed) {
      if (redirectTo) {
        const redirectUrl = new URL(redirectTo, req.url);
        // after login we just send users back to home page
        redirectUrl.searchParams.set("returnUrl", "/dashboard");
        const accept = req.headers.get("accept") || "";
        if (accept.includes("text/html") && !accept.includes("*/*")) {
          return NextResponse.redirect(redirectUrl);
        }
      }
      return NextResponse.json({ error, redirectTo }, { status: 429 });
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
