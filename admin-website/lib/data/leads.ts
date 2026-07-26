import { createClient } from "@/lib/supabase/server";

export type Lead = {
  id: string;
  created_at: string;
  budget_range: string | null;
  move_date: string | null;
  length_of_stay: string | null;
  preferred_area: string | null;
  whatsapp: string;
  email: string | null;
  apartment_id: string | null;
  area_id: string | null;
  source: string;
};

function mapLead(row: Record<string, unknown>): Lead {
  return {
    id: String(row.id),
    created_at: String(row.created_at),
    budget_range: (row.budget_range as string | null) ?? null,
    move_date: (row.move_date as string | null) ?? null,
    length_of_stay: (row.length_of_stay as string | null) ?? null,
    preferred_area: (row.preferred_area as string | null) ?? null,
    whatsapp: String(row.whatsapp ?? ""),
    email: (row.email as string | null) ?? null,
    apartment_id: (row.apartment_id as string | null) ?? null,
    area_id: (row.area_id as string | null) ?? null,
    source: String(row.source ?? "website"),
  };
}

export async function getLeadsCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true });
  if (error) return 0;
  return count ?? 0;
}

export async function getLeads(): Promise<Lead[]> {
  const supabase = await createClient();
  const fullSelect =
    "id, created_at, budget_range, move_date, length_of_stay, preferred_area, whatsapp, email, apartment_id, area_id, source";
  const baseSelect =
    "id, created_at, budget_range, move_date, length_of_stay, preferred_area, whatsapp, email, source";

  const primary = await supabase
    .from("leads")
    .select(fullSelect)
    .order("created_at", { ascending: false });

  const { data, error } =
    primary.error
      ? await supabase
          .from("leads")
          .select(baseSelect)
          .order("created_at", { ascending: false })
      : primary;

  if (error || !data) return [];
  return data.map((row) => mapLead(row as Record<string, unknown>));
}
