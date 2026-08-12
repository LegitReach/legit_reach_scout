import { Redis } from "@upstash/redis";
/**
 * LEGITREACH REDIS & REALTIME CLIENTS (UPSTASH)
 * 
 * - Standard Redis: For caching, session, and rate-limiting.
 * - Realtime SDK: To enable push notifications for long-lived AI curation tasks.
 */

let client: Redis | undefined;

function getRedisClient(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required");
  }

  client ??= new Redis({ url, token });
  return client;
}

/** Keep route imports build-safe; credentials are required only on first use. */
export const redis = new Proxy({} as Redis, {
  get(_target, property) {
    const redisClient = getRedisClient();
    const value = Reflect.get(redisClient, property, redisClient);
    return typeof value === "function" ? value.bind(redisClient) : value;
  },
});
