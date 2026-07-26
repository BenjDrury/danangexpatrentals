import { createClient, SupabaseClient } from "@supabase/supabase-js";

let anonClient: SupabaseClient | null | undefined;

/** Anon-only client for reading public tables. No auth cookies. Reused across calls. */
export function getAnonClient(): SupabaseClient | null {
  if (anonClient !== undefined) return anonClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    anonClient = null;
    return null;
  }
  anonClient = createClient(url, key);
  return anonClient;
}
