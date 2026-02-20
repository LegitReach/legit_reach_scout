import { Redis } from "@upstash/redis";

// simple Redis client for Upstash; expects REDIS_URL and REDIS_TOKEN
export const redis = Redis.fromEnv();