#!/usr/bin/env node
/**
 * Seed or update public.areas from a CSV file.
 * Usage: node seed-areas-from-csv.mjs <path-to-csv>
 *
 * Single source: scripts/data/areas.csv (combined base + display fields).
 * To regenerate that file from scripts/data/areas.csv + scripts/data/areas-additional.csv, run:
 *   node scripts/run/merge-areas-csv.mjs
 *
 * CSV must have a header row. Supports the full combined schema:
 *   area_id, canonical_area_name (or name), snapshot_date, fx_usd_vnd, area_code,
 *   admin_districts_pre2025, wards_*, boundary_notes, centroid_*, rent_*,
 *   expat_suitability_score, tenant_profile_tag, utilities_*, transport_*, within5km_*,
 *   nightlife_intensity, safety_notes, noise_air_quality_notes, flood_typhoon_risk,
 *   expat_community_presence, sources_urls,
 *   aliases, images (or image), vibe, forWho, District, Distance_to_Beach_km, Distance_to_CBD_km,
 *   Typical_Rent_1BR_USD, Typical_Rent_2BR_USD, Expat_Density, Noise_Level, Flood_Risk,
 *   Walkability_Score, Amenities_Score, Long_Term_Rental_Suitability, Pros, Cons.
 *
 * Identity: area_id -> id, canonical_area_name -> name. images (array), vibe, price_range, who
 * default to []/empty if missing (required in DB).
 *
 * Uses scripts/.secret.local or scripts/secrets for SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptsDir = join(__dirname, "..");
config({ path: join(scriptsDir, ".env") });
config({ path: join(scriptsDir, ".secret.local") });

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: node seed-areas-from-csv.mjs <path-to-csv>");
  console.error("Example: node scripts/run/seed-areas-from-csv.mjs areas.csv");
  process.exit(1);
}

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in scripts/.secret.local or scripts/secrets");
  process.exit(1);
}

/**
 * Parse a single CSV line, respecting double-quoted fields (commas inside quotes stay).
 */
function parseCSVLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur.trim());
  return out;
}

/**
 * Parse CSV string into rows of objects using first row as headers.
 * Header names are trimmed and lowercased for matching.
 */
function parseCSV(csvText) {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((h, j) => {
      row[h] = values[j] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

/** Map CSV row to areas table columns. Keys are CSV header names (lowercase). */
function get(row, ...keys) {
  const lower = {};
  for (const [k, v] of Object.entries(row)) {
    lower[String(k).toLowerCase().trim()] = v;
  }
  for (const key of keys) {
    const v = lower[key];
    if (v !== undefined && v !== "") return String(v).trim();
  }
  return "";
}

function num(row, ...keys) {
  const s = get(row, ...keys);
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function rowToArea(row) {
  const id = get(row, "area_id", "id") || undefined;
  const name = get(row, "canonical_area_name", "name") || undefined;
  if (!id || !name) return null;

  const aliasesRaw = get(row, "aliases");
  const aliases = aliasesRaw ? String(aliasesRaw).trim() : null;

  const imagesRaw = get(row, "images", "image", "image_url", "img");
  const images = imagesRaw
    ? String(imagesRaw)
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return {
    id,
    name,
    aliases: aliases || null,
    images,
    vibe: get(row, "vibe") || "",
    price_range: get(row, "price_range", "pricerange", "price range") || "",
    who: get(row, "who", "forwho", "for_who", "who_its_for", "who it's for") || "",
    district: get(row, "district") || null,
    distance_to_beach_km: num(row, "distance_to_beach_km"),
    distance_to_cbd_km: num(row, "distance_to_cbd_km"),
    typical_rent_1br_usd: num(row, "typical_rent_1br_usd"),
    typical_rent_2br_usd: num(row, "typical_rent_2br_usd"),
    expat_density: get(row, "expat_density") || null,
    noise_level: get(row, "noise_level") || null,
    walkability_score: num(row, "walkability_score"),
    amenities_score: num(row, "amenities_score"),
    long_term_rental_suitability: get(row, "long_term_rental_suitability") || null,
    pros: get(row, "pros") || null,
    cons: get(row, "cons") || null,
    snapshot_date: get(row, "snapshot_date") || null,
    fx_usd_vnd: num(row, "fx_usd_vnd"),
    area_code: get(row, "area_code") || null,
    canonical_area_name: get(row, "canonical_area_name") || null,
    admin_districts_pre2025: get(row, "admin_districts_pre2025") || null,
    wards_pre2025: get(row, "wards_pre2025") || null,
    wards_post2025_2025reorg: get(row, "wards_post2025_2025reorg") || null,
    boundary_notes: get(row, "boundary_notes") || null,
    centroid_lat: num(row, "centroid_lat"),
    centroid_lon: num(row, "centroid_lon"),
    centroid_note: get(row, "centroid_note") || null,
    rent_studio_vnd_min: num(row, "rent_studio_vnd_min"),
    rent_studio_vnd_max: num(row, "rent_studio_vnd_max"),
    rent_studio_usd_min: num(row, "rent_studio_usd_min"),
    rent_studio_usd_max: num(row, "rent_studio_usd_max"),
    rent_1br_vnd_min: num(row, "rent_1br_vnd_min"),
    rent_1br_vnd_max: num(row, "rent_1br_vnd_max"),
    rent_1br_usd_min: num(row, "rent_1br_usd_min"),
    rent_1br_usd_max: num(row, "rent_1br_usd_max"),
    rent_2br_vnd_min: num(row, "rent_2br_vnd_min"),
    rent_2br_vnd_max: num(row, "rent_2br_vnd_max"),
    rent_2br_usd_min: num(row, "rent_2br_usd_min"),
    rent_2br_usd_max: num(row, "rent_2br_usd_max"),
    rent_3br_vnd_min: num(row, "rent_3br_vnd_min"),
    rent_3br_vnd_max: num(row, "rent_3br_vnd_max"),
    rent_3br_usd_min: num(row, "rent_3br_usd_min"),
    rent_3br_usd_max: num(row, "rent_3br_usd_max"),
    expat_suitability_score: num(row, "expat_suitability_score"),
    tenant_profile_tag: get(row, "tenant_profile_tag") || null,
    avg_lease_term_months: num(row, "avg_lease_term_months"),
    furnished_availability_pct_est: num(row, "furnished_availability_pct_est"),
    utilities_electricity_note: get(row, "utilities_electricity_note") || null,
    utilities_internet_note: get(row, "utilities_internet_note") || null,
    transport_primary_modes: get(row, "transport_primary_modes") || null,
    within5km_beach: get(row, "within5km_beach") || null,
    within5km_hospital: get(row, "within5km_hospital") || null,
    within5km_international_school: get(row, "within5km_international_school") || null,
    within5km_supermarket: get(row, "within5km_supermarket") || null,
    within5km_coworking: get(row, "within5km_coworking") || null,
    nightlife_intensity: get(row, "nightlife_intensity") || null,
    safety_notes: get(row, "safety_notes") || null,
    noise_air_quality_notes: get(row, "noise_air_quality_notes") || null,
    flood_typhoon_risk: get(row, "flood_typhoon_risk", "flood_risk") || null,
    expat_community_presence: get(row, "expat_community_presence") || null,
    sources_urls: get(row, "sources_urls") || null,
  };
}

async function main() {
  const resolvedPath = join(process.cwd(), csvPath);
  let csvText;
  try {
    csvText = readFileSync(resolvedPath, "utf8");
  } catch (e) {
    console.error("Failed to read file:", resolvedPath, e.message);
    process.exit(1);
  }

  const rows = parseCSV(csvText);
  if (rows.length === 0) {
    console.error("No data rows in CSV (need header + at least one row).");
    process.exit(1);
  }

  const areas = rows.map(rowToArea).filter(Boolean);
  if (areas.length === 0) {
    console.error("No valid rows: each row needs area_id (or id) and canonical_area_name (or name).");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase.from("areas").upsert(areas, { onConflict: "id" }).select("id");

  if (error) {
    console.error("Supabase error:", error.message);
    process.exit(1);
  }

  console.log("Upserted", data?.length ?? areas.length, "areas.");
}

main();
