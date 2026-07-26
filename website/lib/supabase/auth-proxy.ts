import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ANALYTICS_OPT_OUT_COOKIE } from "@/lib/analytics-constants";
import { withSharedCookieDomain } from "@/lib/shared-cookie-domain";

function getSupabaseKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function setAnalyticsOptOut(response: NextResponse, optedOut: boolean) {
  const base = withSharedCookieDomain({
    path: "/",
    sameSite: "lax" as const,
  });
  if (optedOut) {
    response.cookies.set(ANALYTICS_OPT_OUT_COOKIE, "1", {
      ...base,
      maxAge: 60 * 60 * 24 * 365,
    });
  } else {
    // Must set maxAge 0 with the same Domain, or the parent-domain cookie sticks.
    response.cookies.set(ANALYTICS_OPT_OUT_COOKIE, "", {
      ...base,
      maxAge: 0,
    });
  }
}

/**
 * Refresh shared Supabase auth cookies and mirror admin analytics opt-out.
 * Does not gate public pages — visitors stay anonymous when signed out.
 */
export async function syncSharedAuth(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getSupabaseKey();
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookieOptions: withSharedCookieDomain({
      path: "/",
      sameSite: "lax",
    }),
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, withSharedCookieDomain(options)),
        );
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;

  if (sub) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", String(sub))
      .maybeSingle();
    setAnalyticsOptOut(response, profile?.role === "admin");
  } else {
    // Signed out on this host — clear opt-out so anonymous capture resumes.
    // Partner studio middleware also clears when signed out there.
    setAnalyticsOptOut(response, false);
  }

  return response;
}
