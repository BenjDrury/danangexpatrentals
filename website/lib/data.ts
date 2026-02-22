import type { Area, Apartment, ApartmentType } from "types";

export async function getAreas(): Promise<Area[]> {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return [];

    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from("areas")
      .select("id, name, image, vibe, price_range, who")
      .order("id");

    if (error || !data) return [];
    return data as Area[];
  } catch {
    return [];
  }
}

export async function getAreaById(id: string): Promise<Area | null> {
  const areas = await getAreas();
  return areas.find((a) => a.id === id) ?? null;
}

export async function getApartmentTypes(): Promise<ApartmentType[]> {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return [];

    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from("apartment_types")
      .select("id, title, desc, sort_order")
      .order("sort_order");

    if (error || !data) return [];
    return data.map((row) => ({
      id: String(row.id),
      title: row.title,
      desc: row.desc,
      sort_order: row.sort_order,
    })) as ApartmentType[];
  } catch {
    return [];
  }
}

export async function getApartments(opts?: { area_id?: string }): Promise<Apartment[]> {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return [];

    const supabase = createClient(url, key);
    let query = supabase
      .from("apartments")
      .select("id, area_id, title, description, price, price_display, main_image, images, bedrooms, bathrooms, size_sqm, features, available_from, min_lease_months, sort_order, created_at, updated_at")
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
  } catch {
    return [];
  }
}

export async function getApartmentById(id: string): Promise<Apartment | null> {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;

    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from("apartments")
      .select("id, area_id, title, description, price, price_display, main_image, images, bedrooms, bathrooms, size_sqm, features, available_from, min_lease_months, sort_order, created_at, updated_at")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return {
      id: String(data.id),
      area_id: data.area_id,
      title: data.title,
      description: data.description ?? null,
      price: data.price,
      price_display: data.price_display,
      main_image: data.main_image,
      images: Array.isArray(data.images) ? data.images : [],
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms ?? null,
      size_sqm: data.size_sqm ?? null,
      features: Array.isArray(data.features) ? data.features : [],
      available_from: data.available_from ?? null,
      min_lease_months: data.min_lease_months ?? null,
      sort_order: data.sort_order ?? 0,
      created_at: data.created_at,
      updated_at: data.updated_at,
    } as Apartment;
  } catch {
    return null;
  }
}
