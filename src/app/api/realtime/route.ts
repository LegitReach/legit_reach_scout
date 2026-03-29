import { handle } from "@upstash/realtime"
import { realtime } from "@/lib/redis"

export const GET = handle({ realtime })
