import { createClient } from "@supabase/supabase-js";

function getSupabaseUrl(): string {
  const value = process.env.SUPABASE_URL;
  if (!value) throw new Error("SUPABASE_URL is not set");
  return value;
}

export function getAuthenticatedClient(token: string) {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  if (!supabaseAnonKey) {
    throw new Error("SUPABASE_PUBLISHABLE_DEFAULT_KEY is not set");
  }

  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}

export function getAdminClient() {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
