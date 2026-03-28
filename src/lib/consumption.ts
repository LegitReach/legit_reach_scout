import { redis } from "./redis";
import { checkRateLimit } from "./rate-limit";

export interface ConsumptionResult {
  allowed: boolean;
  source: 'free' | 'credit' | 'blocked';
  remainingCredits?: number;
  remainingFree?: number;
  error?: string;
  redirectTo?: string;
}

/**
 * High-level utility to check and consume a request.
 * If user has free requests left (daily limit), it uses one.
 * If not, it tries to consume one purchased credit.
 */
export async function consumeRequest(userId: string): Promise<ConsumptionResult> {
  try {
    // 1. Check daily free limit (5 per 24h)
    const { allowed, remaining } = await checkRateLimit(`user:${userId}`, 5);

    if (allowed) {
      return { 
        allowed: true, 
        source: 'free', 
        remainingFree: remaining 
      };
    }

    // 2. Check purchased credits
    const credits = await redis.get<number>(`credits:user:${userId}`) || 0;

    if (credits > 0) {
      const newCredits = await redis.decr(`credits:user:${userId}`);
      return { 
        allowed: true, 
        source: 'credit', 
        remainingCredits: newCredits 
      };
    }

    // 3. Blocked
    return {
      allowed: false,
      source: 'blocked',
      error: "Rate limit exceeded. Please subscribe for more.",
      redirectTo: "/subscribe"
    };

  } catch (err) {
    console.error("Consumption check failed:", err);
    // Be permissive on unexpected Redis errors to avoid blocking the app
    return { allowed: true, source: 'free' };
  }
}

/**
 * For anonymous users, check IP-based rate limit
 */
export async function consumeAnonymousRequest(ip: string, userAgent: string | null, maxRequests: number = 5): Promise<ConsumptionResult> {
  try {
    const key = userAgent ? `${ip}:${userAgent}` : ip;
    const { allowed, remaining } = await checkRateLimit(key, maxRequests);
    if (allowed) {
      return { allowed: true, source: 'free', remainingFree: remaining };
    }
    return {
      allowed: false,
      source: 'blocked',
      error: "Rate limit reached. Please login to continue.",
      redirectTo: "/auth"
    };
  } catch (err) {
    console.error("Anonymous consumption check failed:", err);
    return { allowed: true, source: 'free' };
  }
}
