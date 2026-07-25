import { formatUsd, type Area, type Apartment } from "types";
import { createClient } from "@/lib/supabase/server";

export async function getPartnerListings(estateCompanyId: string): Promise<Apartment[]> {
  // Never query without a company scope — authenticated RLS allows SELECT on all apartments.
  if (!estateCompanyId?.trim()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("apartments")
    .select("*")
    .eq("estate_company_id", estateCompanyId)
    .order("updated_at", { ascending: false });
  if (error || !data) return [];
  return data as Apartment[];
}

/** Contact + commission summary for a listing, derived from partner_deals. */
export type ListingRelationSummary = {
  contacts: { id: string; name: string }[];
  /** Human-readable possible commission (USD, %, or free-text note). */
  commissionDisplay: string | null;
};

type DealRelationRow = {
  apartment_id: string | null;
  contact_id: string | null;
  notes: string | null;
  stage: string;
  expected_commission_usd: number | null;
  expected_commission_pct: number | null;
  updated_at: string | null;
  partner_contacts: { id: string; name: string } | { id: string; name: string }[] | null;
};

function contactFromDeal(
  row: DealRelationRow
): { id: string; name: string } | null {
  const raw = row.partner_contacts;
  const contact = Array.isArray(raw) ? raw[0] : raw;
  if (contact?.id && contact.name) return { id: contact.id, name: contact.name };
  if (row.contact_id) return { id: row.contact_id, name: "—" };
  return null;
}

function commissionFromDeal(row: DealRelationRow): string | null {
  const usd = row.expected_commission_usd != null ? Number(row.expected_commission_usd) : NaN;
  if (Number.isFinite(usd) && usd > 0) return formatUsd(usd);
  const pct = row.expected_commission_pct != null ? Number(row.expected_commission_pct) : NaN;
  if (Number.isFinite(pct) && pct > 0) {
    const rounded = Number.isInteger(pct) ? String(pct) : pct.toFixed(1).replace(/\.0$/, "");
    return `${rounded}%`;
  }
  const note = row.notes?.trim();
  return note || null;
}

/**
 * Map apartment_id → related contacts + possible commission from partner_deals.
 * Prefers non-lost deals (most recently updated first). Commission: USD → % → notes.
 */
export async function getListingRelationSummaries(
  estateCompanyId: string
): Promise<Record<string, ListingRelationSummary>> {
  if (!estateCompanyId?.trim()) return {};

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partner_deals")
    .select(
      "apartment_id, contact_id, notes, stage, expected_commission_usd, expected_commission_pct, updated_at, partner_contacts ( id, name )"
    )
    .eq("estate_company_id", estateCompanyId)
    .not("apartment_id", "is", null)
    .order("updated_at", { ascending: false });

  if (error || !data) return {};

  const byApt: Record<
    string,
    {
      activeContacts: { id: string; name: string }[];
      lostContacts: { id: string; name: string }[];
      seenContacts: Set<string>;
      commissions: string[];
    }
  > = {};

  for (const raw of data as DealRelationRow[]) {
    const aptId = raw.apartment_id;
    if (!aptId) continue;

    if (!byApt[aptId]) {
      byApt[aptId] = {
        activeContacts: [],
        lostContacts: [],
        seenContacts: new Set(),
        commissions: [],
      };
    }
    const bucket = byApt[aptId];
    const active = raw.stage !== "lost";

    const contact = contactFromDeal(raw);
    if (contact) {
      if (active) {
        bucket.lostContacts = bucket.lostContacts.filter((c) => c.id !== contact.id);
        if (!bucket.activeContacts.some((c) => c.id === contact.id)) {
          bucket.activeContacts.push(contact);
        }
        bucket.seenContacts.add(contact.id);
      } else if (!bucket.seenContacts.has(contact.id)) {
        bucket.seenContacts.add(contact.id);
        bucket.lostContacts.push(contact);
      }
    }

    if (active) {
      const commission = commissionFromDeal(raw);
      if (commission && !bucket.commissions.includes(commission)) {
        bucket.commissions.push(commission);
      }
    }
  }

  const out: Record<string, ListingRelationSummary> = {};
  for (const [aptId, bucket] of Object.entries(byApt)) {
    const primary = bucket.commissions[0] ?? null;
    const extra = bucket.commissions.length > 1 ? bucket.commissions.length - 1 : 0;
    out[aptId] = {
      contacts:
        bucket.activeContacts.length > 0 ? bucket.activeContacts : bucket.lostContacts,
      commissionDisplay:
        primary == null ? null : extra > 0 ? `${primary} · +${extra}` : primary,
    };
  }
  return out;
}

export async function getPartnerListing(
  estateCompanyId: string,
  id: string
): Promise<Apartment | null> {
  if (!estateCompanyId?.trim() || !id?.trim()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("apartments")
    .select("*")
    .eq("id", id)
    .eq("estate_company_id", estateCompanyId)
    .single();
  if (error || !data) return null;
  return data as Apartment;
}

export async function getAreasForSelect(): Promise<Pick<Area, "id" | "name">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("areas").select("id, name").order("name");
  if (error || !data) return [];
  return data as Pick<Area, "id" | "name">[];
}

export async function getCompanyName(estateCompanyId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("estate_companies")
    .select("name")
    .eq("id", estateCompanyId)
    .single();
  return data?.name ?? null;
}

export type PartnerContact = {
  id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  notes: string | null;
};

export type PartnerDeal = {
  id: string;
  contact_id: string | null;
  apartment_id: string | null;
  notes: string | null;
  stage: string;
  expected_commission_usd: number | null;
  expected_commission_pct: number | null;
  updated_at?: string;
};

/** Deal row for listing detail commission / contact panel. */
export type ListingDealRow = PartnerDeal & {
  contact_name: string | null;
};

export async function getPartnerContacts(estateCompanyId: string): Promise<PartnerContact[]> {
  if (!estateCompanyId?.trim()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partner_contacts")
    .select("id, name, phone, whatsapp, email, notes")
    .eq("estate_company_id", estateCompanyId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as PartnerContact[];
}

export async function getPartnerContact(
  estateCompanyId: string,
  id: string
): Promise<PartnerContact | null> {
  if (!estateCompanyId?.trim() || !id?.trim()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partner_contacts")
    .select("id, name, phone, whatsapp, email, notes")
    .eq("id", id)
    .eq("estate_company_id", estateCompanyId)
    .maybeSingle();
  if (error || !data) return null;
  return data as PartnerContact;
}

export async function getContactDeals(
  estateCompanyId: string,
  contactId: string
): Promise<PartnerDeal[]> {
  if (!estateCompanyId?.trim() || !contactId?.trim()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partner_deals")
    .select(
      "id, contact_id, apartment_id, notes, stage, expected_commission_usd, expected_commission_pct, updated_at"
    )
    .eq("estate_company_id", estateCompanyId)
    .eq("contact_id", contactId)
    .order("updated_at", { ascending: false });
  if (error || !data) return [];
  return (data as PartnerDeal[]).map((row) => ({
    ...row,
    expected_commission_usd:
      row.expected_commission_usd != null ? Number(row.expected_commission_usd) : null,
    expected_commission_pct:
      row.expected_commission_pct != null ? Number(row.expected_commission_pct) : null,
  }));
}

type ListingDealQueryRow = {
  id: string;
  contact_id: string | null;
  apartment_id: string | null;
  notes: string | null;
  stage: string;
  expected_commission_usd: number | null;
  expected_commission_pct: number | null;
  updated_at: string | null;
  partner_contacts: { id: string; name: string } | { id: string; name: string }[] | null;
};

export async function getListingDeals(
  estateCompanyId: string,
  apartmentId: string
): Promise<ListingDealRow[]> {
  if (!estateCompanyId?.trim() || !apartmentId?.trim()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partner_deals")
    .select(
      "id, contact_id, apartment_id, notes, stage, expected_commission_usd, expected_commission_pct, updated_at, partner_contacts ( id, name )"
    )
    .eq("estate_company_id", estateCompanyId)
    .eq("apartment_id", apartmentId)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];

  return (data as ListingDealQueryRow[]).map((row) => {
    const raw = row.partner_contacts;
    const contact = Array.isArray(raw) ? raw[0] : raw;
    return {
      id: row.id,
      contact_id: row.contact_id,
      apartment_id: row.apartment_id,
      notes: row.notes,
      stage: row.stage,
      expected_commission_usd:
        row.expected_commission_usd != null ? Number(row.expected_commission_usd) : null,
      expected_commission_pct:
        row.expected_commission_pct != null ? Number(row.expected_commission_pct) : null,
      updated_at: row.updated_at ?? undefined,
      contact_name: contact?.name ?? null,
    };
  });
}
