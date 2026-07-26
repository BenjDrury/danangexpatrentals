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

const IMPERSONATE_COOKIE = "partner_impersonate_company_id";

function getSupabaseKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/** Relative path only — blocks open redirects. */
function safeRelativePath(next: string | null | undefined): string {
  if (!next) return "/";
  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/";
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return "/";
  return trimmed;
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

function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname === "/auth/callback" ||
    pathname === "/unauthorized" ||
    pathname.startsWith("/invite/") ||
    pathname === "/terms" ||
    pathname === "/privacy"
  );
}

function redirectToLogin(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  const nextPath = request.nextUrl.pathname + request.nextUrl.search;
  if (nextPath && nextPath !== "/") {
    url.searchParams.set("next", nextPath);
  }
  return NextResponse.redirect(url);
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const publicPath = isPublicPath(pathname);
  const hasAuthCookie = hasSupabaseAuthCookie(request);

  // No session cookie → never call Supabase Auth/DB from middleware.
  if (!hasAuthCookie) {
    let response = publicPath
      ? NextResponse.next({ request })
      : redirectToLogin(request);

    if (request.cookies.get(IMPERSONATE_COOKIE)) {
      response.cookies.delete(IMPERSONATE_COOKIE);
    }
    if (request.cookies.get(ANALYTICS_OPT_OUT_COOKIE)) {
      setAnalyticsOptOut(response, false);
    }
    if (request.cookies.get(AUTH_ROLE_CACHE_COOKIE)) {
      clearCachedAuthRole(response);
    }
    return response;
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getSupabaseKey(),
    {
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
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, withSharedCookieDomain(options)),
          );
        },
      },
    },
  );

  // Local JWT verify when possible (ES256 JWKS). Avoid getUser() here.
  let sub: string | null = null;
  try {
    const { data } = await supabase.auth.getClaims();
    sub = data?.claims?.sub ? String(data.claims.sub) : null;
  } catch {
    sub = null;
  }
  const isAuthenticated = Boolean(sub);

  if (!isAuthenticated && request.cookies.get(IMPERSONATE_COOKIE)) {
    supabaseResponse.cookies.delete(IMPERSONATE_COOKIE);
  }

  if (isAuthenticated && sub) {
    let role = readCachedAuthRole(request, sub);
    if (!role) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", sub)
        .maybeSingle();
      role = profile?.role === "admin" ? "admin" : "user";
      writeCachedAuthRole(supabaseResponse, sub, role);
    }
    const wantsOptOut = role === "admin";
    const hasOptOut = Boolean(request.cookies.get(ANALYTICS_OPT_OUT_COOKIE));
    if (wantsOptOut !== hasOptOut) {
      setAnalyticsOptOut(supabaseResponse, wantsOptOut);
    }
  } else {
    if (request.cookies.get(ANALYTICS_OPT_OUT_COOKIE)) {
      setAnalyticsOptOut(supabaseResponse, false);
    }
    if (request.cookies.get(AUTH_ROLE_CACHE_COOKIE)) {
      clearCachedAuthRole(supabaseResponse);
    }
  }

  if (pathname === "/login" && isAuthenticated) {
    const next = safeRelativePath(request.nextUrl.searchParams.get("next"));
    return NextResponse.redirect(new URL(next, request.url));
  }

  if (!publicPath && !isAuthenticated) {
    return redirectToLogin(request);
  }

  return supabaseResponse;
}
