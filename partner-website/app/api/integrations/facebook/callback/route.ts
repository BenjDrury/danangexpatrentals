import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requirePartner } from "@/lib/auth";
import { upsertFacebookConnection } from "@/lib/data/integrations";
import {
  FACEBOOK_OAUTH_STATE_COOKIE,
  exchangeFacebookCode,
  exchangeLongLivedUserToken,
  facebookRedirectUri,
  fetchFacebookPages,
  getFacebookAppId,
  getFacebookAppSecret,
  isFacebookOAuthConfigured,
} from "@/lib/facebook-oauth";

export const dynamic = "force-dynamic";

function settingsRedirect(request: Request, fb: string) {
  const url = new URL("/settings", request.url);
  url.searchParams.set("fb", fb);
  const res = NextResponse.redirect(url);
  res.cookies.set(FACEBOOK_OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0 });
  res.cookies.set("fb_oauth_company", "", { path: "/", maxAge: 0 });
  return res;
}

/**
 * Facebook OAuth callback.
 * Stores Page id/name + Page access token (service role) for the company that started connect.
 */
export async function GET(request: Request) {
  const session = await requirePartner();
  if (!session) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  if (!isFacebookOAuthConfigured()) {
    return settingsRedirect(request, "not_configured");
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorReason = url.searchParams.get("error_reason");

  if (error) {
    return settingsRedirect(
      request,
      errorReason === "user_denied" ? "denied" : "error",
    );
  }

  if (!code || !state) {
    return settingsRedirect(request, "error");
  }

  const jar = await cookies();
  const expectedState = jar.get(FACEBOOK_OAUTH_STATE_COOKIE)?.value;
  const oauthCompany = jar.get("fb_oauth_company")?.value;

  if (!expectedState || state !== expectedState) {
    return settingsRedirect(request, "error");
  }

  // Prefer company frozen at connect start (survives cookie race); fall back to session.
  const estateCompanyId = oauthCompany || session.estateCompanyId;
  if (oauthCompany && oauthCompany !== session.estateCompanyId && !session.isAdmin) {
    return settingsRedirect(request, "error");
  }

  const appId = getFacebookAppId()!;
  const appSecret = getFacebookAppSecret()!;
  const redirectUri = facebookRedirectUri(url.origin);

  try {
    const shortLived = await exchangeFacebookCode({
      code,
      redirectUri,
      appId,
      appSecret,
    });

    let userToken = shortLived.access_token;
    try {
      const longLived = await exchangeLongLivedUserToken({
        shortLivedToken: shortLived.access_token,
        appId,
        appSecret,
      });
      userToken = longLived.access_token;
    } catch {
      // Short-lived token still works for fetching Pages; Page tokens are long-lived.
    }

    const pages = await fetchFacebookPages(userToken);
    if (pages.length === 0) {
      return settingsRedirect(request, "no_page");
    }

    // MVP: first Page. Multi-page picker / group blast can come later.
    const page = pages[0];
    const result = await upsertFacebookConnection({
      estateCompanyId,
      pageId: page.id,
      pageName: page.name,
      accessToken: page.access_token,
      meta: {
        page_count: pages.length,
        note: pages.length > 1 ? "Connected first Page; picker coming later." : undefined,
      },
    });

    if (result.error) {
      console.error("Facebook upsert failed:", result.error);
      return settingsRedirect(request, "error");
    }

    return settingsRedirect(request, "connected");
  } catch (err) {
    console.error("Facebook OAuth callback:", err);
    return settingsRedirect(request, "error");
  }
}
