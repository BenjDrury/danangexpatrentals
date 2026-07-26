import { createBrowserClient } from "@supabase/ssr";
import { withSharedCookieDomain } from "@/lib/shared-cookie-domain";

function getSupabaseKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/** Browser client that reads the shared Supabase session (partner/admin login). */
export function createAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getSupabaseKey();
  if (!url || !key) {
    throw new Error("Supabase URL/key missing");
  }
  return createBrowserClient(url, key, {
    cookieOptions: withSharedCookieDomain({
      path: "/",
      sameSite: "lax",
    }),
  });
}
