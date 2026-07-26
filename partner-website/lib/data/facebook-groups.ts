import { requirePartner } from "@/lib/auth";
import { PLATFORM_DEFAULT_FACEBOOK_GROUPS } from "@/lib/facebook-groups-defaults";
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

export type FacebookGroupOption = {
  groupId: string;
  name: string;
  url: string;
  facebookGroupId: string | null;
  /** Platform default (always offered) vs partner-added */
  kind: "default" | "company";
  linkId: string | null;
  memberCount: number | null;
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

/** Upsert platform defaults into the catalog (idempotent). */
export async function ensureDefaultFacebookGroups(): Promise<void> {
  const service = getServiceRoleClient();
  const client = service ?? (await createClient());

  for (const g of PLATFORM_DEFAULT_FACEBOOK_GROUPS) {
    if (g.facebookGroupId) {
      const { data: existing } = await client
        .from("facebook_groups")
        .select("id")
        .eq("facebook_group_id", g.facebookGroupId)
        .maybeSingle();
      if (existing?.id) {
        await client
          .from("facebook_groups")
          .update({
            name: g.name,
            url: g.url,
            is_default_suggestion: true,
          })
          .eq("id", existing.id);
        continue;
      }
      await client.from("facebook_groups").insert({
        facebook_group_id: g.facebookGroupId,
        url: g.url,
        name: g.name,
        is_default_suggestion: true,
        meta: { source: "platform_default" },
      });
      continue;
    }

    const { data: byUrl } = await client
      .from("facebook_groups")
      .select("id")
      .ilike("url", g.url)
      .maybeSingle();
    if (byUrl?.id) {
      await client
        .from("facebook_groups")
        .update({
          name: g.name,
          is_default_suggestion: true,
        })
        .eq("id", byUrl.id);
      continue;
    }
    await client.from("facebook_groups").insert({
      facebook_group_id: null,
      url: g.url,
      name: g.name,
      is_default_suggestion: true,
      meta: { source: "platform_default" },
    });
  }
}

export async function listDefaultFacebookGroups(): Promise<FacebookGroupOption[]> {
  await ensureDefaultFacebookGroups();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("facebook_groups")
    .select("id, name, url, facebook_group_id, member_count")
    .eq("is_default_suggestion", true)
    .order("name", { ascending: true });

  if (error || !data) return [];

  return data.map((g) => ({
    groupId: g.id as string,
    name: g.name as string,
    url: g.url as string,
    facebookGroupId: (g.facebook_group_id as string | null) ?? null,
    kind: "default" as const,
    linkId: null,
    memberCount: (g.member_count as number | null) ?? null,
  }));
}

/**
 * Defaults (selected by default in UI) + partner-added groups, deduped by group id.
 */
export async function listPublishFacebookGroups(
  estateCompanyId: string,
): Promise<FacebookGroupOption[]> {
  const [defaults, company] = await Promise.all([
    listDefaultFacebookGroups(),
    listCompanyFacebookGroups(estateCompanyId),
  ]);

  const byId = new Map<string, FacebookGroupOption>();
  for (const g of defaults) byId.set(g.groupId, g);
  for (const g of company) {
    if (byId.has(g.groupId)) {
      const existing = byId.get(g.groupId)!;
      byId.set(g.groupId, {
        ...existing,
        linkId: g.linkId,
      });
      continue;
    }
    byId.set(g.groupId, {
      groupId: g.groupId,
      name: g.name,
      url: g.url,
      facebookGroupId: g.facebookGroupId,
      kind: "company",
      linkId: g.linkId,
      memberCount: g.memberCount,
    });
  }

  return [...byId.values()].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "default" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
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
): Promise<{ error?: string; ok?: boolean; group?: FacebookGroupOption }> {
  const session = await requirePartner();
  if (!session) return { error: "Unauthorized." };

  const parsed = parseFacebookGroupUrl(urlInput);
  if (!parsed) return { error: "Enter a valid Facebook group URL." };

  const supabase = await createClient();
  const service = getServiceRoleClient();
  const client = service ?? supabase;

  let groupId: string | null = null;
  let groupName = parsed.nameHint;
  let groupUrl = parsed.url;
  let facebookGroupId = parsed.facebookGroupId;

  if (parsed.facebookGroupId) {
    const { data: byFbId } = await client
      .from("facebook_groups")
      .select("id, name, url, facebook_group_id, member_count")
      .eq("facebook_group_id", parsed.facebookGroupId)
      .maybeSingle();
    if (byFbId?.id) {
      groupId = byFbId.id as string;
      groupName = byFbId.name as string;
      groupUrl = byFbId.url as string;
      facebookGroupId = (byFbId.facebook_group_id as string | null) ?? null;
    }
  }

  if (!groupId) {
    const { data: byUrl } = await client
      .from("facebook_groups")
      .select("id, name, url, facebook_group_id, member_count")
      .ilike("url", parsed.url)
      .maybeSingle();
    if (byUrl?.id) {
      groupId = byUrl.id as string;
      groupName = byUrl.name as string;
      groupUrl = byUrl.url as string;
      facebookGroupId = (byUrl.facebook_group_id as string | null) ?? null;
    }
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
      .select("id, name, url, facebook_group_id, member_count")
      .single();
    if (error || !inserted) {
      return { error: error?.message ?? "Could not save group." };
    }
    groupId = inserted.id as string;
    groupName = inserted.name as string;
    groupUrl = inserted.url as string;
    facebookGroupId = (inserted.facebook_group_id as string | null) ?? null;
  }

  const { data: link, error: linkError } = await client
    .from("estate_company_facebook_groups")
    .upsert(
      {
        estate_company_id: session.estateCompanyId,
        facebook_group_id: groupId,
        source: "manual",
        added_by: session.user.id,
      },
      { onConflict: "estate_company_id,facebook_group_id" },
    )
    .select("id")
    .single();

  if (linkError) return { error: linkError.message };

  return {
    ok: true,
    group: {
      groupId,
      name: groupName,
      url: groupUrl,
      facebookGroupId,
      kind: "company",
      linkId: (link?.id as string | undefined) ?? null,
      memberCount: null,
    },
  };
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
