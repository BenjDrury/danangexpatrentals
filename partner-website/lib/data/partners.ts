import { requireAdmin } from "@/lib/auth";
import { getServiceRoleClient } from "@/lib/supabase/server";

export type AdminPartnerRow = {
  /** Profile id when a partner user exists; otherwise a synthetic key for company-only rows. */
  profileId: string;
  displayName: string | null;
  email: string | null;
  estateCompanyId: string | null;
  companyName: string | null;
  listingCount: number;
  /** True when the company has no partner/auth user yet (admin Become still works by company id). */
  companyOnly?: boolean;
};

export type ListPartnersResult = {
  partners: AdminPartnerRow[];
  /** Set when service role is not configured — profiles RLS blocks listing otherwise. */
  missingServiceRole?: boolean;
};

/**
 * List partner profiles + estate companies without a linked partner user.
 * Uses service role: profiles RLS only allows reading own row.
 * Call only after requireAdmin().
 */
export async function listPartnersForAdmin(): Promise<ListPartnersResult> {
  const admin = await requireAdmin();
  if (!admin) return { partners: [] };

  const supabase = getServiceRoleClient();
  if (!supabase) return { partners: [], missingServiceRole: true };

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, display_name, estate_company_id")
    .eq("role", "partner")
    .order("display_name", { ascending: true });

  if (error) return { partners: [] };

  const { data: companies } = await supabase
    .from("estate_companies")
    .select("id, name")
    .order("name", { ascending: true });

  const companyNameById = new Map<string, string>();
  for (const c of companies ?? []) {
    companyNameById.set(c.id as string, c.name as string);
  }

  const linkedCompanyIds = new Set(
    (profiles ?? [])
      .map((p) => p.estate_company_id as string | null)
      .filter((id): id is string => Boolean(id)),
  );

  const allCompanyIds = [...new Set([...(companies ?? []).map((c) => c.id as string)])];

  const listingCountByCompany = new Map<string, number>();
  if (allCompanyIds.length) {
    const { data: apts } = await supabase
      .from("apartments")
      .select("estate_company_id")
      .in("estate_company_id", allCompanyIds);
    for (const a of apts ?? []) {
      const cid = a.estate_company_id as string;
      listingCountByCompany.set(cid, (listingCountByCompany.get(cid) ?? 0) + 1);
    }
  }

  const emailById = new Map<string, string>();
  try {
    const { data: listed } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    for (const u of listed?.users ?? []) {
      if (u.email) emailById.set(u.id, u.email);
    }
  } catch {
    // Emails optional if admin API unavailable
  }

  const rows: AdminPartnerRow[] = (profiles ?? []).map((p) => {
    const estateCompanyId = (p.estate_company_id as string | null) ?? null;
    return {
      profileId: p.id as string,
      displayName: (p.display_name as string | null) ?? null,
      email: emailById.get(p.id as string) ?? null,
      estateCompanyId,
      companyName: estateCompanyId
        ? (companyNameById.get(estateCompanyId) ?? null)
        : null,
      listingCount: estateCompanyId
        ? (listingCountByCompany.get(estateCompanyId) ?? 0)
        : 0,
    };
  });

  // Companies with no partner user — still Become-able by company id.
  for (const c of companies ?? []) {
    const id = c.id as string;
    if (linkedCompanyIds.has(id)) continue;
    rows.push({
      profileId: `company:${id}`,
      displayName: null,
      email: null,
      estateCompanyId: id,
      companyName: (c.name as string) ?? null,
      listingCount: listingCountByCompany.get(id) ?? 0,
      companyOnly: true,
    });
  }

  rows.sort((a, b) => {
    const an = (a.companyName || a.displayName || "").toLowerCase();
    const bn = (b.companyName || b.displayName || "").toLowerCase();
    return an.localeCompare(bn);
  });

  return { partners: rows };
}
