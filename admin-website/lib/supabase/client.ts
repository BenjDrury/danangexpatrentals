import { createBrowserClient } from "@supabase/ssr";
import { withSharedCookieDomain } from "@/lib/shared-cookie-domain";

function getSupabaseKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getSupabaseKey(),
    {
      cookieOptions: withSharedCookieDomain({
        path: "/",
        sameSite: "lax",
      }),
    },
  );
}
