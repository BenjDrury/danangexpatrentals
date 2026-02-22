/**
 * Area type. Core display fields (id, name, images, vibe, price_range, who) are
 * required in the DB for backward compatibility; the rest come from the areas
 * CSV and are optional.
 */
export interface Area {
  // --- Identity (required) ---
  id: string;
  name: string;
  /** Comma/semicolon-sep string from DB or array when parsed. */
  aliases?: string | string[] | null;

  // --- Display ---
  /** Image URLs (e.g. hero/gallery). Use first for primary display. */
  images?: string[] | null;
  vibe?: string | null;
  /** Human-readable price range (e.g. "1BR from $450"). */
  price_range?: string | null;
  who?: string | null;

  created_at?: string;

  // --- Snapshot / meta ---
  snapshot_date?: string | null;
  fx_usd_vnd?: number | null;

  // --- Codes & canonical name ---
  area_code?: string | null;
  canonical_area_name?: string | null;

  // --- Admin / geography ---
  admin_districts_pre2025?: string | null;
  wards_pre2025?: string | null;
  wards_post2025_2025reorg?: string | null;
  boundary_notes?: string | null;
  district?: string | null;
  distance_to_beach_km?: number | null;
  distance_to_cbd_km?: number | null;

  // --- Centroid ---
  centroid_lat?: number | null;
  centroid_lon?: number | null;
  centroid_note?: string | null;

  // --- Rent ranges (VND and USD) ---
  rent_studio_vnd_min?: number | null;
  rent_studio_vnd_max?: number | null;
  rent_studio_usd_min?: number | null;
  rent_studio_usd_max?: number | null;
  rent_1br_vnd_min?: number | null;
  rent_1br_vnd_max?: number | null;
  rent_1br_usd_min?: number | null;
  rent_1br_usd_max?: number | null;
  rent_2br_vnd_min?: number | null;
  rent_2br_vnd_max?: number | null;
  rent_2br_usd_min?: number | null;
  rent_2br_usd_max?: number | null;
  rent_3br_vnd_min?: number | null;
  rent_3br_vnd_max?: number | null;
  rent_3br_usd_min?: number | null;
  rent_3br_usd_max?: number | null;
  typical_rent_1br_usd?: number | null;
  typical_rent_2br_usd?: number | null;

  // --- Suitability & tenant ---
  expat_suitability_score?: number | null;
  tenant_profile_tag?: string | null;
  avg_lease_term_months?: number | null;
  furnished_availability_pct_est?: number | null;

  // --- Utilities & transport ---
  utilities_electricity_note?: string | null;
  utilities_internet_note?: string | null;
  transport_primary_modes?: string | null;

  // --- Within 5km (CSV often "yes"/"no" or empty) ---
  within5km_beach?: string | null;
  within5km_hospital?: string | null;
  within5km_international_school?: string | null;
  within5km_supermarket?: string | null;
  within5km_coworking?: string | null;

  // --- Lifestyle & safety ---
  nightlife_intensity?: string | null;
  safety_notes?: string | null;
  noise_air_quality_notes?: string | null;
  noise_level?: string | null;
  flood_typhoon_risk?: string | null;
  expat_community_presence?: string | null;
  expat_density?: string | null;
  walkability_score?: number | null;
  amenities_score?: number | null;
  long_term_rental_suitability?: string | null;
  pros?: string | null;
  cons?: string | null;

  // --- Sources ---
  sources_urls?: string | null;
}
