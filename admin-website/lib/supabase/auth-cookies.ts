import type { NextRequest } from "next/server";

/**
 * Supabase SSR session cookies look like:
 *   sb-<ref>-auth-token
 *   sb-<ref>-auth-token.0 / .1 (chunked)
 */
export function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some((c) => /auth-token/i.test(c.name));
}
