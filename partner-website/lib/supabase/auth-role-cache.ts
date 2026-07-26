import type { NextRequest, NextResponse } from "next/server";
import { withSharedCookieDomain } from "@/lib/shared-cookie-domain";

/** Short-lived cache so middleware does not hit `profiles` on every request. */
export const AUTH_ROLE_CACHE_COOKIE = "dner_auth_role";

const ROLE_CACHE_MAX_AGE_SEC = 60 * 15; // 15 minutes

export type CachedAuthRole = "admin" | "user";

export function readCachedAuthRole(
  request: NextRequest,
  userId: string,
): CachedAuthRole | null {
  const raw = request.cookies.get(AUTH_ROLE_CACHE_COOKIE)?.value;
  if (!raw) return null;
  const sep = raw.indexOf(":");
  if (sep <= 0) return null;
  const sub = raw.slice(0, sep);
  const role = raw.slice(sep + 1);
  if (sub !== userId) return null;
  if (role === "admin" || role === "user") return role;
  return null;
}

export function writeCachedAuthRole(
  response: NextResponse,
  userId: string,
  role: CachedAuthRole,
): void {
  const base = withSharedCookieDomain({
    path: "/",
    sameSite: "lax" as const,
  });
  response.cookies.set(AUTH_ROLE_CACHE_COOKIE, `${userId}:${role}`, {
    ...base,
    maxAge: ROLE_CACHE_MAX_AGE_SEC,
    httpOnly: true,
  });
}

export function clearCachedAuthRole(response: NextResponse): void {
  const base = withSharedCookieDomain({
    path: "/",
    sameSite: "lax" as const,
  });
  response.cookies.set(AUTH_ROLE_CACHE_COOKIE, "", {
    ...base,
    maxAge: 0,
    httpOnly: true,
  });
}
