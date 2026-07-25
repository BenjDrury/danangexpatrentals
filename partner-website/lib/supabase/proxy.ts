import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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

  await supabase.auth.getClaims();

  const url = request.nextUrl.clone();
  const isLogin = url.pathname === "/login";
  const isUnauthorized = url.pathname === "/unauthorized";
  const isInvite = url.pathname.startsWith("/invite/");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Drop impersonation when signed out
  if (!user && request.cookies.get(IMPERSONATE_COOKIE)) {
    supabaseResponse.cookies.delete(IMPERSONATE_COOKIE);
  }

  // Authenticated users never see /login (avoids bounce with /unauthorized).
  if (isLogin && user) {
    const next = safeRelativePath(url.searchParams.get("next"));
    return NextResponse.redirect(new URL(next, request.url));
  }

  // Invite accept is public (logged-out users create/sign in on the page).
  // /unauthorized stays reachable while signed in (non-partners land here).
  if (!isLogin && !isUnauthorized && !isInvite && !user) {
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
