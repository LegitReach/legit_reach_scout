import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "./rate-limit";

// wrap a handler so that rate limiting runs first.
// handler should be a function expecting a NextRequest and returning a Response/NextResponse.
export function withRateLimit(
  handler: (req: NextRequest) => Promise<Response | NextResponse>,
  maxRequests: number = 5
) {
  return async function (req: NextRequest) {
  
    const ip = getClientIp(req);
    try {
      const { allowed, remaining, resetIn } = await checkRateLimit(`${ip}:${req.headers.get("user-agent")}`, maxRequests);

      if (!allowed) {

        const redirectUrl = new URL("/auth", req.url);
        const accept = req.headers.get("accept") || "";
        if (accept.includes("text/html") || accept === '*/*') {
          return NextResponse.redirect(redirectUrl);
        }

        return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
      }
      // optionally could attach rate info to request via symbol or custom field
    } catch (err) {
      // log but do not block traffic if redis fails
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
