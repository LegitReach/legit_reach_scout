import { createRealtime } from "@upstash/realtime/client";
import type { CurationEvents } from "@/types/realtime";

/**
 * TYPED REALTIME HOOK
 * Using the official createRealtime factory to generate a fully typed 
 * 'useRealtime' hook for our Curation events.
 */
export const { useRealtime } = createRealtime<CurationEvents>();
