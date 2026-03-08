import type { Apartment } from "types";
import { getAnonClient } from "./client";

export async function getApartmentsCount() {
  const supabase = getAnonClient();
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from("apartments")
    .select("id", { count: "exact", head: true });
  if (error) return 0;
  return count ?? 0;
}

export async function getApartments(opts?: { area_id?: string }): Promise<Apartment[]> {
  const supabase = getAnonClient();
  if (!supabase) return [];

  let query = supabase
    .from("apartments")
    .select(
      "id, area_id, title, description, price, price_display, main_image, images, bedrooms, bathrooms, size_sqm, features, available_from, min_lease_months, sort_order, created_at, updated_at"
    )
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (opts?.area_id) query = query.eq("area_id", opts.area_id);
  const { data, error } = await query;

  if (error || !data) return [];
  return data.map((row) => ({
    id: String(row.id),
    area_id: row.area_id,
    title: row.title,
    description: row.description ?? null,
    price: row.price,
    price_display: row.price_display,
    main_image: row.main_image,
    images: Array.isArray(row.images) ? row.images : [],
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms ?? null,
    size_sqm: row.size_sqm ?? null,
    features: Array.isArray(row.features) ? row.features : [],
    available_from: row.available_from ?? null,
    min_lease_months: row.min_lease_months ?? null,
    sort_order: row.sort_order ?? 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
  })) as Apartment[];
}
