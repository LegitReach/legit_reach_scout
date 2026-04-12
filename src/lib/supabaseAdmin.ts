import { createClient } from "@supabase/supabase-js";

/**
 * Supabase admin client — uses the service role key to bypass RLS.
 * Only used in server-side background jobs (e.g. newsletter CRON).
 * NEVER import this in client-side code or user-facing API routes.
 */
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
