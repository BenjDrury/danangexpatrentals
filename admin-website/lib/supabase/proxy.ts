import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function getSupabaseKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Prefer getClaims() alone: with asymmetric JWT keys this verifies locally
  // (cached JWKS) and refreshes the session when needed. Calling getUser()
  // afterward adds a sequential Auth-server RTT on every navigation.
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims);

  const url = request.nextUrl.clone();
  const isLogin = url.pathname === "/login";
  const isUnauthorized = url.pathname === "/unauthorized";

  if (isLogin && isAuthenticated) {
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (!isLogin && !isUnauthorized && !isAuthenticated) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
