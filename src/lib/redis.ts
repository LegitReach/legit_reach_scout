import { Redis } from "@upstash/redis";
import { Realtime } from "@upstash/realtime";
import { CurationEvents } from "@/types/realtime";

/**
 * LEGITREACH REDIS & REALTIME CLIENTS (UPSTASH)
 * 
 * - Standard Redis: For caching, session, and rate-limiting.
 * - Realtime SDK: To enable push notifications for long-lived AI curation tasks.
 */

export const redis = Redis.fromEnv();

/**
 * We define the Realtime instance with our shared CurationEvents schema.
 * This allows the 'emit' and 'subscribe' methods to be fully type-safe.
 */
export const realtime = new Realtime({
  redis,
  schema: {} as CurationEvents
});