import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ANALYTICS_OPT_OUT_COOKIE } from "@/lib/analytics-constants";

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
  if (optedOut) {
    response.cookies.set(ANALYTICS_OPT_OUT_COOKIE, "1", {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  } else {
    response.cookies.delete(ANALYTICS_OPT_OUT_COOKIE);
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getSupabaseKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Prefer getClaims() alone: local JWT verify when possible. Calling getUser()
  // afterward adds a sequential Auth-server RTT on every navigation.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const isAuthenticated = Boolean(claims?.sub);

  const url = request.nextUrl.clone();
  const isLogin = url.pathname === "/login";
  const isAuthCallback = url.pathname === "/auth/callback";
  const isUnauthorized = url.pathname === "/unauthorized";
  const isInvite = url.pathname.startsWith("/invite/");
  const isLegal =
    url.pathname === "/terms" || url.pathname === "/privacy";

  // Drop impersonation when signed out
  if (!isAuthenticated && request.cookies.get(IMPERSONATE_COOKIE)) {
    supabaseResponse.cookies.delete(IMPERSONATE_COOKIE);
  }

  // Admins never send PostHog events — cookie is read at client init.
  if (isAuthenticated && claims?.sub) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", String(claims.sub))
      .maybeSingle();
    setAnalyticsOptOut(supabaseResponse, profile?.role === "admin");
  } else {
    setAnalyticsOptOut(supabaseResponse, false);
  }

  // Authenticated users never see /login (avoids bounce with /unauthorized).
  if (isLogin && isAuthenticated) {
    const next = safeRelativePath(url.searchParams.get("next"));
    return NextResponse.redirect(new URL(next, request.url));
  }

  // Invite accept is public (logged-out users create/sign in on the page).
  // /auth/callback exchanges PKCE codes before cookies exist.
  // Legal pages stay public for imprint / terms disclosure.
  // /unauthorized stays reachable while signed in (non-partners land here).
  if (
    !isLogin &&
    !isAuthCallback &&
    !isUnauthorized &&
    !isInvite &&
    !isLegal &&
    !isAuthenticated
  ) {
    url.pathname = "/login";
    url.search = "";
    const nextPath = request.nextUrl.pathname + request.nextUrl.search;
    if (nextPath && nextPath !== "/") {
      url.searchParams.set("next", nextPath);
    }
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
