import type { Area, Apartment, ApartmentType } from "types";
import { slugify } from "./area-utils";

const AREAS_SELECT =
  "id, name, images, vibe, price_range, who, created_at, snapshot_date, fx_usd_vnd, area_code, canonical_area_name, admin_districts_pre2025, wards_pre2025, wards_post2025_2025reorg, boundary_notes, centroid_lat, centroid_lon, centroid_note, rent_studio_vnd_min, rent_studio_vnd_max, rent_studio_usd_min, rent_studio_usd_max, rent_1br_vnd_min, rent_1br_vnd_max, rent_1br_usd_min, rent_1br_usd_max, rent_2br_vnd_min, rent_2br_vnd_max, rent_2br_usd_min, rent_2br_usd_max, rent_3br_vnd_min, rent_3br_vnd_max, rent_3br_usd_min, rent_3br_usd_max, expat_suitability_score, tenant_profile_tag, avg_lease_term_months, furnished_availability_pct_est, utilities_electricity_note, utilities_internet_note, transport_primary_modes, within5km_beach, within5km_hospital, within5km_international_school, within5km_supermarket, within5km_coworking, nightlife_intensity, safety_notes, noise_air_quality_notes, flood_typhoon_risk, expat_community_presence, sources_urls";

export async function getAreas(): Promise<Area[]> {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return [];

    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from("areas")
      .select("id, name, images, vibe, price_range, who, aliases, typical_rent_1br_usd, typical_rent_2br_usd")
      .order("id");

    if (error || !data) return [];
    return data as Area[];
  } catch {
    return [];
  }
}

/** Fetch a single area by id with all columns. */
export async function getAreaByIdFull(id: string): Promise<Area | null> {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;

    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from("areas")
      .select(AREAS_SELECT)
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data as Area;
  } catch {
    return null;
  }
}

/** Resolve slug or id to area. Tries id first, then slug from name/canonical_area_name. */
export async function getAreaBySlugOrId(slugOrId: string): Promise<Area | null> {
  const byId = await getAreaByIdFull(slugOrId);
  if (byId) return byId;

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;

    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from("areas")
      .select(AREAS_SELECT)
      .order("id");

    if (error || !data || data.length === 0) return null;

    const normalized = String(slugOrId).trim().toLowerCase().replace(/\s+/g, "-");
    const areas = data as Area[];
    const match = areas.find(
      (a) =>
        slugify(a.name) === normalized ||
        (a.canonical_area_name != null && slugify(a.canonical_area_name) === normalized)
    );
    return match ?? null;
  } catch {
    return null;
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
