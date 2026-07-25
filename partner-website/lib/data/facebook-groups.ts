import { requirePartner } from "@/lib/auth";
import { createClient, getServiceRoleClient } from "@/lib/supabase/server";

export type CompanyFacebookGroup = {
  linkId: string;
  groupId: string;
  name: string;
  url: string;
  facebookGroupId: string | null;
  source: "catalog" | "manual";
  memberCount: number | null;
  createdAt: string;
};

const GROUP_ID_RE = /facebook\.com\/groups\/(\d+)/i;

export function parseFacebookGroupUrl(raw: string): {
  url: string;
  facebookGroupId: string | null;
  nameHint: string;
} | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let url = trimmed;
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url.replace(/^\/+/, "")}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (!/facebook\.com$/i.test(parsed.hostname.replace(/^www\./, ""))) {
    return null;
  }

  const match = parsed.href.match(GROUP_ID_RE);
  const facebookGroupId = match?.[1] ?? null;
  const canonical = facebookGroupId
    ? `https://www.facebook.com/groups/${facebookGroupId}`
    : parsed.origin + parsed.pathname.replace(/\/$/, "");

  return {
    url: canonical,
    facebookGroupId,
    nameHint: facebookGroupId
      ? `Facebook group ${facebookGroupId}`
      : "Facebook group",
  };
}

export async function listCompanyFacebookGroups(
  estateCompanyId: string,
): Promise<CompanyFacebookGroup[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("estate_company_facebook_groups")
    .select(
      "id, source, created_at, facebook_group_id, facebook_groups(id, name, url, facebook_group_id, member_count)",
    )
    .eq("estate_company_id", estateCompanyId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return data
    .map((row) => {
      const raw = row.facebook_groups as unknown;
      const g = (Array.isArray(raw) ? raw[0] : raw) as
        | {
            id: string;
            name: string;
            url: string;
            facebook_group_id: string | null;
            member_count: number | null;
          }
        | null
        | undefined;
      if (!g) return null;
      return {
        linkId: row.id as string,
        groupId: g.id,
        name: g.name,
        url: g.url,
        facebookGroupId: g.facebook_group_id,
        source: row.source as "catalog" | "manual",
        memberCount: g.member_count,
        createdAt: row.created_at as string,
      };
    })
    .filter((x): x is CompanyFacebookGroup => Boolean(x));
}

/**
 * Upsert group into catalog (minimal) and link to company as manual.
 */
export async function addCompanyFacebookGroupUrl(
  urlInput: string,
): Promise<{ error?: string; ok?: boolean }> {
  const session = await requirePartner();
  if (!session) return { error: "Unauthorized." };

  const parsed = parseFacebookGroupUrl(urlInput);
  if (!parsed) return { error: "Enter a valid Facebook group URL." };

  const supabase = await createClient();
  const service = getServiceRoleClient();
  const client = service ?? supabase;

  let groupId: string | null = null;

  if (parsed.facebookGroupId) {
    const { data: byFbId } = await client
      .from("facebook_groups")
      .select("id")
      .eq("facebook_group_id", parsed.facebookGroupId)
      .maybeSingle();
    groupId = (byFbId?.id as string | undefined) ?? null;
  }

  if (!groupId) {
    const { data: byUrl } = await client
      .from("facebook_groups")
      .select("id")
      .ilike("url", parsed.url)
      .maybeSingle();
    groupId = (byUrl?.id as string | undefined) ?? null;
  }

  if (!groupId) {
    const { data: inserted, error } = await client
      .from("facebook_groups")
      .insert({
        facebook_group_id: parsed.facebookGroupId,
        url: parsed.url,
        name: parsed.nameHint,
        is_default_suggestion: false,
        meta: {},
      })
      .select("id")
      .single();
    if (error || !inserted) {
      return { error: error?.message ?? "Could not save group." };
    }
    groupId = inserted.id as string;
  }

  const { error: linkError } = await client.from("estate_company_facebook_groups").upsert(
    {
      estate_company_id: session.estateCompanyId,
      facebook_group_id: groupId,
      source: "manual",
      added_by: session.user.id,
    },
    { onConflict: "estate_company_id,facebook_group_id" },
  );

  if (linkError) return { error: linkError.message };
  return { ok: true };
}

export async function removeCompanyFacebookGroup(
  linkId: string,
): Promise<{ error?: string; ok?: boolean }> {
  const session = await requirePartner();
  if (!session) return { error: "Unauthorized." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("estate_company_facebook_groups")
    .delete()
    .eq("id", linkId)
    .eq("estate_company_id", session.estateCompanyId);

  if (error) return { error: error.message };
  return { ok: true };
}
