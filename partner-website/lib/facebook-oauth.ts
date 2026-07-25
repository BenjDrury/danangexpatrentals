/**
 * Facebook / Meta OAuth for Partner Studio integrations.
 *
 * Env (partner-website/.secret.local or .env.local):
 *   FACEBOOK_APP_ID=…
 *   FACEBOOK_APP_SECRET=…
 *   NEXT_PUBLIC_FACEBOOK_APP_ID=…   (same as FACEBOOK_APP_ID; optional public mirror)
 *
 * Redirect URI to register in Meta App → Facebook Login → Settings:
 *   {PARTNER_ORIGIN}/api/integrations/facebook/callback
 *   e.g. http://localhost:3002/api/integrations/facebook/callback
 *   e.g. https://partners.example.com/api/integrations/facebook/callback
 *
 * Scopes: pages_show_list, pages_manage_posts, pages_read_engagement
 * (Page token stored for future auto-post; group blast is not wired yet.)
 */

export const FACEBOOK_OAUTH_STATE_COOKIE = "fb_oauth_state";
export const FACEBOOK_GRAPH_VERSION = "v21.0";

export function getFacebookAppId(): string | null {
  const id =
    process.env.FACEBOOK_APP_ID?.trim() ||
    process.env.NEXT_PUBLIC_FACEBOOK_APP_ID?.trim() ||
    null;
  return id || null;
}

export function getFacebookAppSecret(): string | null {
  const secret = process.env.FACEBOOK_APP_SECRET?.trim() || null;
  return secret || null;
}

export function isFacebookOAuthConfigured(): boolean {
  return Boolean(getFacebookAppId() && getFacebookAppSecret());
}

export function facebookRedirectUri(origin: string): string {
  return `${origin.replace(/\/$/, "")}/api/integrations/facebook/callback`;
}

export function facebookAuthorizeUrl(params: {
  appId: string;
  redirectUri: string;
  state: string;
}): string {
  const q = new URLSearchParams({
    client_id: params.appId,
    redirect_uri: params.redirectUri,
    state: params.state,
    // Long-lived Page tokens need these; user must grant Page access.
    scope: "pages_show_list,pages_manage_posts,pages_read_engagement",
    response_type: "code",
  });
  return `https://www.facebook.com/${FACEBOOK_GRAPH_VERSION}/dialog/oauth?${q}`;
}

export type FacebookTokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
};

export async function exchangeFacebookCode(params: {
  code: string;
  redirectUri: string;
  appId: string;
  appSecret: string;
}): Promise<FacebookTokenResponse> {
  const q = new URLSearchParams({
    client_id: params.appId,
    client_secret: params.appSecret,
    redirect_uri: params.redirectUri,
    code: params.code,
  });
  const res = await fetch(
    `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/oauth/access_token?${q}`,
  );
  const data = (await res.json()) as FacebookTokenResponse & { error?: { message?: string } };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error?.message ?? "Facebook token exchange failed.");
  }
  return data;
}

/** Exchange short-lived user token for a long-lived one (~60 days). */
export async function exchangeLongLivedUserToken(params: {
  shortLivedToken: string;
  appId: string;
  appSecret: string;
}): Promise<FacebookTokenResponse> {
  const q = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: params.appId,
    client_secret: params.appSecret,
    fb_exchange_token: params.shortLivedToken,
  });
  const res = await fetch(
    `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/oauth/access_token?${q}`,
  );
  const data = (await res.json()) as FacebookTokenResponse & { error?: { message?: string } };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error?.message ?? "Facebook long-lived token exchange failed.");
  }
  return data;
}

export type FacebookPage = {
  id: string;
  name: string;
  access_token: string;
};

export async function fetchFacebookPages(userAccessToken: string): Promise<FacebookPage[]> {
  const q = new URLSearchParams({
    fields: "id,name,access_token",
    access_token: userAccessToken,
  });
  const res = await fetch(
    `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/me/accounts?${q}`,
  );
  const data = (await res.json()) as {
    data?: FacebookPage[];
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(data.error?.message ?? "Could not load Facebook Pages.");
  }
  return (data.data ?? []).filter((p) => p.id && p.access_token);
}
