import { NextResponse } from "next/server";
import { requirePartner } from "@/lib/auth";
import {
  FACEBOOK_OAUTH_STATE_COOKIE,
  facebookAuthorizeUrl,
  facebookRedirectUri,
  getFacebookAppId,
  isFacebookOAuthConfigured,
} from "@/lib/facebook-oauth";

export const dynamic = "force-dynamic";

/**
 * Start Facebook OAuth. Requires studio company context (partner or admin-as-partner).
 * Redirect URI must match Meta app settings — see lib/facebook-oauth.ts.
 */
export async function GET(request: Request) {
  const session = await requirePartner();
  if (!session) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  if (!isFacebookOAuthConfigured()) {
    const settings = new URL("/settings", request.url);
    settings.searchParams.set("fb", "not_configured");
    return NextResponse.redirect(settings);
  }

  const appId = getFacebookAppId()!;
  const origin = new URL(request.url).origin;
  const redirectUri = facebookRedirectUri(origin);
  const state = crypto.randomUUID();

  const authorize = facebookAuthorizeUrl({ appId, redirectUri, state });
  const response = NextResponse.redirect(authorize);
  response.cookies.set(FACEBOOK_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  // Bind OAuth to the active company (admin impersonation included).
  response.cookies.set("fb_oauth_company", session.estateCompanyId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return response;
}
