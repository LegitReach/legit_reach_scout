/**
 * SHARED REALTIME EVENT TYPES
 * Used to ensure end-to-end type safety between backend workers and frontend listeners.
 */

import * as z from "zod";
export type CurationEvents = {
    curation: {
        update: {
            event: z.ZodString;
            data: z.ZodAny;
        };
    };
};