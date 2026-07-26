import { cache } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Area, Apartment, ApartmentType, CoworkingSpace, Activity } from "types";
import { slugify } from "./area-utils";
import { validityPublicCutoffIso } from "./listing-validity";

let anonClient: SupabaseClient | null | undefined;

function getAnonClient(): SupabaseClient | null {
  if (anonClient !== undefined) return anonClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    anonClient = null;
    return null;
  }
  anonClient = createClient(url, key);
  return anonClient;
}

const AREAS_SELECT =
  "id, name, images, vibe, price_range, who, created_at, snapshot_date, fx_usd_vnd, area_code, canonical_area_name, admin_districts_pre2025, wards_pre2025, wards_post2025_2025reorg, boundary_notes, centroid_lat, centroid_lon, centroid_note, rent_studio_vnd_min, rent_studio_vnd_max, rent_studio_usd_min, rent_studio_usd_max, rent_1br_vnd_min, rent_1br_vnd_max, rent_1br_usd_min, rent_1br_usd_max, rent_2br_vnd_min, rent_2br_vnd_max, rent_2br_usd_min, rent_2br_usd_max, rent_3br_vnd_min, rent_3br_vnd_max, rent_3br_usd_min, rent_3br_usd_max, expat_suitability_score, tenant_profile_tag, avg_lease_term_months, furnished_availability_pct_est, utilities_electricity_note, utilities_internet_note, transport_primary_modes, within5km_beach, within5km_hospital, within5km_international_school, within5km_supermarket, within5km_coworking, nightlife_intensity, safety_notes, noise_air_quality_notes, flood_typhoon_risk, expat_community_presence, sources_urls";

/** Card/list fields only — skip long description and gallery arrays. */
const APARTMENT_LIST_SELECT =
  "id, area_id, title, price, price_display, price_amount, price_currency, price_usd, price_vnd, main_image, bedrooms, bathrooms, size_sqm, features, available_from, sort_order, created_at, public_slug";

const APARTMENT_DETAIL_SELECT =
  "id, area_id, title, description, price, price_display, price_amount, price_currency, price_usd, price_vnd, main_image, images, bedrooms, bathrooms, size_sqm, features, available_from, min_lease_months, sort_order, created_at, updated_at, status, public_slug, last_validity_check";

function mapApartmentRow(row: Record<string, unknown>): Apartment {
  return {
    id: String(row.id),
    area_id: row.area_id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    price: Number(row.price),
    price_display: String(row.price_display ?? ""),
    price_amount: row.price_amount != null ? Number(row.price_amount) : null,
    price_currency:
      row.price_currency === "USD" || row.price_currency === "VND"
        ? row.price_currency
        : null,
    price_usd: row.price_usd != null ? Number(row.price_usd) : null,
    price_vnd: row.price_vnd != null ? Number(row.price_vnd) : null,
    main_image: (row.main_image as string) ?? "",
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    bedrooms: Number(row.bedrooms),
    bathrooms: row.bathrooms != null ? Number(row.bathrooms) : null,
    size_sqm: row.size_sqm != null ? Number(row.size_sqm) : null,
    features: Array.isArray(row.features) ? (row.features as Apartment["features"]) : [],
    available_from: (row.available_from as string | null) ?? null,
    min_lease_months: row.min_lease_months != null ? Number(row.min_lease_months) : null,
    sort_order: Number(row.sort_order ?? 0),
    status: (row.status as Apartment["status"]) ?? undefined,
    public_slug: (row.public_slug as string | null) ?? null,
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
  };
}

export const getAreas = cache(async function getAreas(): Promise<Area[]> {
  try {
    const supabase = getAnonClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("areas")
      .select(
        "id, name, images, vibe, price_range, who, aliases, typical_rent_1br_usd, typical_rent_2br_usd, canonical_area_name"
      )
      .order("id");

    if (error || !data) return [];
    return data as Area[];
  } catch {
    return [];
  }
});

/** Fetch a single area by id with all columns. */
export const getAreaByIdFull = cache(async function getAreaByIdFull(
  id: string
): Promise<Area | null> {
  try {
    const supabase = getAnonClient();
    if (!supabase) return null;

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
});

/** Resolve slug or id to area. Tries id first, then slug from name/canonical_area_name. */
export const getAreaBySlugOrId = cache(async function getAreaBySlugOrId(
  slugOrId: string
): Promise<Area | null> {
  const byId = await getAreaByIdFull(slugOrId);
  if (byId) return byId;

  try {
    const supabase = getAnonClient();
    if (!supabase) return null;

    // Light index for slug match — avoid pulling full AREAS_SELECT for every row.
    const { data, error } = await supabase
      .from("areas")
      .select("id, name, canonical_area_name")
      .order("id");

    if (error || !data || data.length === 0) return null;

    const normalized = String(slugOrId).trim().toLowerCase().replace(/\s+/g, "-");
    const match = data.find(
      (a) =>
        slugify(a.name) === normalized ||
        (a.canonical_area_name != null && slugify(a.canonical_area_name) === normalized)
    );
    if (!match) return null;
    return getAreaByIdFull(match.id);
  } catch {
    return null;
  }
});

export const getAreaById = cache(async function getAreaById(
  id: string
): Promise<Area | null> {
  try {
    const supabase = getAnonClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("areas")
      .select(
        "id, name, images, vibe, price_range, who, aliases, typical_rent_1br_usd, typical_rent_2br_usd, canonical_area_name"
      )
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return data as Area;
  } catch {
    return null;
  }
});

export const getApartmentTypes = cache(async function getApartmentTypes(): Promise<
  ApartmentType[]
> {
  try {
    const supabase = getAnonClient();
    if (!supabase) return [];

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
});

export const getApartments = cache(async function getApartments(opts?: {
  area_id?: string;
}): Promise<Apartment[]> {
  try {
    const supabase = getAnonClient();
    if (!supabase) return [];

    let query = supabase
      .from("apartments")
      .select(APARTMENT_LIST_SELECT)
      .or("status.is.null,status.eq.available")
      .gte("last_validity_check", validityPublicCutoffIso())
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (opts?.area_id) query = query.eq("area_id", opts.area_id);
    const { data, error } = await query;

    if (error || !data) return [];
    return data.map((row) => mapApartmentRow(row as Record<string, unknown>));
  } catch {
    return [];
  }
});

export type ApartmentsPaginated = {
  apartments: Apartment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/** Fetch apartments with pagination, newest first. 1-based page. */
export const getApartmentsPaginated = cache(async function getApartmentsPaginated(
  page: number,
  limit: number
): Promise<ApartmentsPaginated> {
  try {
    const supabase = getAnonClient();
    if (!supabase) {
      return { apartments: [], total: 0, page: 1, limit, totalPages: 0 };
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from("apartments")
      .select(APARTMENT_LIST_SELECT, {
        count: "exact",
      })
      .or("status.is.null,status.eq.available")
      .gte("last_validity_check", validityPublicCutoffIso())
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error || !data) {
      return { apartments: [], total: 0, page, limit, totalPages: 0 };
    }

    const total = count ?? 0;
    const apartments = data.map((row) => mapApartmentRow(row as Record<string, unknown>));

    return {
      apartments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  } catch {
    return { apartments: [], total: 0, page: 1, limit, totalPages: 0 };
  }
});

export const getApartmentById = cache(async function getApartmentById(
  id: string
): Promise<Apartment | null> {
  try {
    const supabase = getAnonClient();
    if (!supabase) return null;

    const cutoff = validityPublicCutoffIso();

    let { data, error } = await supabase
      .from("apartments")
      .select(APARTMENT_DETAIL_SELECT)
      .eq("id", id)
      .or("status.is.null,status.eq.available")
      .gte("last_validity_check", cutoff)
      .maybeSingle();

    if ((!data || error) && id) {
      const bySlug = await supabase
        .from("apartments")
        .select(APARTMENT_DETAIL_SELECT)
        .eq("public_slug", id)
        .or("status.is.null,status.eq.available")
        .gte("last_validity_check", cutoff)
        .maybeSingle();
      data = bySlug.data;
      error = bySlug.error;
    }

    if (error || !data) return null;
    return mapApartmentRow(data as Record<string, unknown>);
  } catch {
    return null;
  }
});

function mapCoworking(row: Record<string, unknown>): CoworkingSpace {
  return {
    id: String(row.id),
    name: String(row.name),
    area_id: (row.area_id as string | null) ?? null,
    neighbourhood_label: (row.neighbourhood_label as string | null) ?? null,
    description: String(row.description ?? ""),
    address: (row.address as string | null) ?? null,
    day_pass_usd: row.day_pass_usd != null ? Number(row.day_pass_usd) : null,
    monthly_usd: row.monthly_usd != null ? Number(row.monthly_usd) : null,
    price_note: (row.price_note as string | null) ?? null,
    wifi_note: (row.wifi_note as string | null) ?? null,
    best_for: (row.best_for as string | null) ?? null,
    website_url: (row.website_url as string | null) ?? null,
    maps_url: (row.maps_url as string | null) ?? null,
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    sort_order: Number(row.sort_order ?? 0),
    published: row.published !== false,
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
  };
}

function mapActivity(row: Record<string, unknown>): Activity {
  return {
    id: String(row.id),
    name: String(row.name),
    category: String(row.category ?? "general"),
    area_id: (row.area_id as string | null) ?? null,
    neighbourhood_label: (row.neighbourhood_label as string | null) ?? null,
    description: String(row.description ?? ""),
    typical_price_usd: row.typical_price_usd != null ? Number(row.typical_price_usd) : null,
    price_note: (row.price_note as string | null) ?? null,
    duration_note: (row.duration_note as string | null) ?? null,
    website_url: (row.website_url as string | null) ?? null,
    maps_url: (row.maps_url as string | null) ?? null,
    booking_url: (row.booking_url as string | null) ?? null,
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    sort_order: Number(row.sort_order ?? 0),
    published: row.published !== false,
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
  };
}

export const getCoworkingSpaces = cache(async function getCoworkingSpaces(): Promise<
  CoworkingSpace[]
> {
  try {
    const supabase = getAnonClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("coworking_spaces")
      .select("*")
      .eq("published", true)
      .order("sort_order")
      .order("name");

    if (error || !data) return [];
    return data.map((row) => mapCoworking(row as Record<string, unknown>));
  } catch {
    return [];
  }
});

export const getActivities = cache(async function getActivities(): Promise<Activity[]> {
  try {
    const supabase = getAnonClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("published", true)
      .order("sort_order")
      .order("name");

    if (error || !data) return [];
    return data.map((row) => mapActivity(row as Record<string, unknown>));
  } catch {
    return [];
  }
});
