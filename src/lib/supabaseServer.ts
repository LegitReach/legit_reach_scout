import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client for server-side use only.
 * Uses the service_role key to bypass Row Level Security (RLS).
 * DO NOT use this on the client side.
 */

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase environment variables");
}
/**
 * Creates a Supabase client bound to a specific user's Clerk token.
 * This is used so Supabase's RLS can identify the user.
 */
export function getAuthenticatedClient(token: string) {
  return createClient(
    supabaseUrl as string,
    supabaseServiceRoleKey as string,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
