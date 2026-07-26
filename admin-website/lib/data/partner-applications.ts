import { createClient } from "@/lib/supabase/server";

export type PartnerApplication = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  whatsapp: string;
  company_name: string | null;
  facebook_page: string | null;
  role: string | null;
  areas: string | null;
  inventory_note: string | null;
  source: string;
};

export async function getPartnerApplicationsCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("partner_applications")
    .select("id", { count: "exact", head: true });
  if (error) return 0;
  return count ?? 0;
}

export async function getPartnerApplications(): Promise<PartnerApplication[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partner_applications")
    .select(
      "id, created_at, name, email, whatsapp, company_name, facebook_page, role, areas, inventory_note, source"
    )
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: String(row.id),
    created_at: String(row.created_at),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    whatsapp: String(row.whatsapp ?? ""),
    company_name: (row.company_name as string | null) ?? null,
    facebook_page: (row.facebook_page as string | null) ?? null,
    role: (row.role as string | null) ?? null,
    areas: (row.areas as string | null) ?? null,
    inventory_note: (row.inventory_note as string | null) ?? null,
    source: String(row.source ?? "website"),
  }));
}
