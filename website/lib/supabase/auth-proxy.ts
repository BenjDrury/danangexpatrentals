import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ANALYTICS_OPT_OUT_COOKIE } from "@/lib/analytics-constants";
import { withSharedCookieDomain } from "@/lib/shared-cookie-domain";
import { hasSupabaseAuthCookie } from "@/lib/supabase/auth-cookies";
import {
  AUTH_ROLE_CACHE_COOKIE,
  clearCachedAuthRole,
  readCachedAuthRole,
  writeCachedAuthRole,
} from "@/lib/supabase/auth-role-cache";

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
    response.cookies.set(ANALYTICS_OPT_OUT_COOKIE, "", {
      ...base,
      maxAge: 0,
    });
  }
}

/**
 * Refresh shared Supabase auth cookies and mirror admin analytics opt-out.
 * Anonymous visitors (no auth cookie) skip Supabase entirely.
 */
export async function syncSharedAuth(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!hasSupabaseAuthCookie(request)) {
    // Only clear sticky cookies when present — avoid Set-Cookie on every hit.
    if (request.cookies.get(ANALYTICS_OPT_OUT_COOKIE)) {
      setAnalyticsOptOut(response, false);
    }
    if (request.cookies.get(AUTH_ROLE_CACHE_COOKIE)) {
      clearCachedAuthRole(response);
    }
    return response;
  }

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

  let sub: string | null = null;
  try {
    const { data } = await supabase.auth.getClaims();
    sub = data?.claims?.sub ? String(data.claims.sub) : null;
  } catch {
    sub = null;
  }

  if (sub) {
    let role = readCachedAuthRole(request, sub);
    if (!role) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", sub)
        .maybeSingle();
      role = profile?.role === "admin" ? "admin" : "user";
      writeCachedAuthRole(response, sub, role);
    }
    const wantsOptOut = role === "admin";
    const hasOptOut = Boolean(request.cookies.get(ANALYTICS_OPT_OUT_COOKIE));
    if (wantsOptOut !== hasOptOut) {
      setAnalyticsOptOut(response, wantsOptOut);
    }
  } else {
    if (request.cookies.get(ANALYTICS_OPT_OUT_COOKIE)) {
      setAnalyticsOptOut(response, false);
    }
    if (request.cookies.get(AUTH_ROLE_CACHE_COOKIE)) {
      clearCachedAuthRole(response);
    }
  }

  return response;
}
