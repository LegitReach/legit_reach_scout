import { assert } from "console";
import { redis } from "./redis";

// Check/increment a counter for a key (typically an IP). The limit is per windowSeconds.
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number = 60 * 60 * 24 // 24h
) {

  const counterKey = `rl:${key}`;
  const current  = await redis.get<number>(counterKey);

  if (current === null) {
    // first hit, set expiry
    await redis.expire(counterKey, windowSeconds);
  }

  if(current === null || current < limit)
   await redis.incr(counterKey);


  return {
    allowed: (current==null ||  current < limit),
    count: current,
    remaining: Math.max(limit - (current || 0), 0),
    resetIn: await redis.ttl(counterKey),
  };
}
