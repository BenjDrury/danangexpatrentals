import { getAnonClient } from "./client";
import type { OutreachApartment } from "@/lib/lead-outreach";

/** Lean available-ish listings for lead outreach matching. */
export async function getOutreachApartments(): Promise<OutreachApartment[]> {
  const supabase = getAnonClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("apartments")
    .select("id, area_id, title, price, price_display, public_slug, created_at, status")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: String(row.id),
    area_id: String(row.area_id ?? ""),
    title: String(row.title ?? "Apartment"),
    price: typeof row.price === "number" ? row.price : Number(row.price) || 0,
    price_display: String(row.price_display ?? ""),
    public_slug: (row.public_slug as string | null) ?? null,
    created_at: String(row.created_at ?? ""),
    status: (row.status as string | null) ?? null,
  }));
}
