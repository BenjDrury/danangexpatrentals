import { cookies } from "next/headers";
import { IMPERSONATE_COOKIE } from "@/lib/auth";

const COOKIE_MAX_AGE = 60 * 60 * 12; // 12 hours

/** Set admin “view as” company cookie. Caller must have verified admin + company. */
export async function setImpersonationCookie(companyId: string): Promise<void> {
  const jar = await cookies();
  jar.set(IMPERSONATE_COOKIE, companyId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}
