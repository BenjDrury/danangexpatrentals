import { NextResponse } from "next/server";
import { IMPERSONATE_COOKIE, requireAdmin, safeRelativePath } from "@/lib/auth";
import { getServiceRoleClient } from "@/lib/supabase/server";

const COOKIE_MAX_AGE = 60 * 60 * 12; // 12 hours

/**
 * Admin deep-link: set view-as company cookie, then redirect to a safe relative path.
 * Example: /admin/view?company=<uuid>&next=/listings
 */
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("company")?.trim() ?? "";
  const next = safeRelativePath(searchParams.get("next"));

  if (!companyId) {
    return NextResponse.redirect(new URL("/admin/partners", request.url));
  }

  const service = getServiceRoleClient();
  if (service) {
    const { data } = await service
      .from("estate_companies")
      .select("id")
      .eq("id", companyId)
      .maybeSingle();
    if (!data) {
      return NextResponse.redirect(new URL("/admin/partners", request.url));
    }
  }

  const response = NextResponse.redirect(new URL(next, request.url));
  response.cookies.set(IMPERSONATE_COOKIE, companyId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return response;
}
