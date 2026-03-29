"use client";

import { RealtimeProvider as RawRealtimeProvider } from "@upstash/realtime/client";
import { ReactNode } from "react";

/**
 * UPSTASH REALTIME PROVIDER
 * Wraps our React app to enable the 'useRealtime' hook throughout the dashboard.
 * Connects to our local '/api/realtime' SSE proxy.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
    return (
        <RawRealtimeProvider 
            api={{ url: "/api/realtime" }} // Points to our created SSE handler
            maxReconnectAttempts={5}
        >
            {children}
        </RawRealtimeProvider>
    );
}
