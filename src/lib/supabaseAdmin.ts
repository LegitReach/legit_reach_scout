import { createClient } from "@supabase/supabase-js";

/**
 * Supabase admin client — uses the service role key to bypass RLS.
 * Only used in server-side background jobs (e.g. newsletter CRON).
 * NEVER import this in client-side code or user-facing API routes.
 */
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase admin environment variables");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
