import { Redis } from "@upstash/redis";
/**
 * LEGITREACH REDIS & REALTIME CLIENTS (UPSTASH)
 * 
 * - Standard Redis: For caching, session, and rate-limiting.
 * - Realtime SDK: To enable push notifications for long-lived AI curation tasks.
 */

export const redis = Redis.fromEnv();
