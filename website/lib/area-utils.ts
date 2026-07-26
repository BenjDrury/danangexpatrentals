import type { Area } from "types";

export type UnitType = "studio" | "1br" | "2br" | "3br";

/** Normalize yes/no-like values to boolean. Empty string or null = false. */
export function normalizeYesNo(value: string | null | undefined): boolean {
  if (value == null || String(value).trim() === "") return false;
  const v = String(value).trim().toLowerCase();
  return v === "yes" || v === "true" || v === "1" || v === "y";
}

/** URL-safe slug from a string (e.g. "An Thuong" → "an-thuong"). */
export function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

type AreaPathFields = {
  id: string;
  name: string;
  canonical_area_name?: string | null;
};

/**
 * Human neighbourhood label for H1/titles (strips internal zone prefixes).
 * e.g. "Beach-south / An Thuong (My An)" → "An Thuong & My An"
 */
export function areaDisplayName(area: {
  name: string;
  canonical_area_name?: string | null;
}): string {
  const raw = area.canonical_area_name?.trim() || area.name.trim();
  return humanizeAreaLabel(raw);
}

/** Strip zone-code prefixes and normalize "X (Y)" → "X & Y". */
export function humanizeAreaLabel(raw: string): string {
  const name = raw.trim();
  if (!name) return name;

  const slash = name.indexOf("/");
  if (slash >= 0) {
    const after = name.slice(slash + 1).trim();
    const paren = after.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    if (paren) return `${paren[1].trim()} & ${paren[2].trim()}`;
    if (after) return after;
  }

  const parenOnly = name.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (parenOnly && /^(beach|airport|south|north|cbd|lien|cam|hoa)/i.test(parenOnly[1])) {
    return `${parenOnly[1].trim()} & ${parenOnly[2].trim()}`;
  }

  return name;
}

/** True when the URL segment is already the canonical public slug (or sole id fallback). */
export function isAreaCanonicalParam(
  slugOrId: string,
  area: AreaPathFields
): boolean {
  const canonical = areaPath(area).replace(/^\/areas\//, "");
  return slugOrId === canonical;
}

/** Canonical public path for an area (`/areas/{slug}`). */
export function areaPath(area: AreaPathFields): string {
  const slug =
    slugify(area.name) ||
    (area.canonical_area_name ? slugify(area.canonical_area_name) : "") ||
    area.id;
  return `/areas/${slug}`;
}

/** Canonical public path for a listing (`/apartments/{slug}`). */
export function apartmentPath(apartment: {
  id: string;
  title?: string | null;
  public_slug?: string | null;
}): string {
  const stored = apartment.public_slug?.trim();
  if (stored) return `/apartments/${stored}`;
  if (apartment.title?.trim()) {
    return `/apartments/${apartmentDerivedSlug(apartment.id, apartment.title)}`;
  }
  return `/apartments/${apartment.id}`;
}

/**
 * Readable slug when `public_slug` is unset: `{title-slug}-{uuid-prefix}`.
 * Example: modern-2br-apartment-near-my-khe-beach-dce12b3f
 */
export function apartmentDerivedSlug(id: string, title: string): string {
  const base =
    slugify(title).replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 48) ||
    "apartment";
  return `${base}-${id.slice(0, 8)}`;
}

/** Extract uuid prefix from a derived apartment slug, if present. */
export function apartmentIdPrefixFromParam(param: string): string | null {
  const m = param.trim().match(/-([0-9a-f]{8})$/i);
  return m ? m[1].toLowerCase() : null;
}

/**
 * Compact listing title for SERPs (brand suffix added by layout template).
 * Aims for ~50–55 chars before "| Da Nang Expat Rentals".
 */
export function listingSeoTitle(title: string, areaName: string): string {
  const area = areaName.trim() || "Da Nang";
  const sep = " · ";
  const budget = Math.max(18, 52 - area.length - sep.length);
  let head = title.replace(/\s+/g, " ").trim();
  if (head.length > budget) {
    const cut = head.slice(0, budget - 1);
    head = `${cut.replace(/\s+\S*$/, "").trimEnd() || cut.trimEnd()}…`;
  }
  return `${head}${sep}${area}`;
}

/** Clamp number to [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Format USD: $### (no decimals). */
export function formatUsd(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

/** Format VND: ###,###,### ₫ */
export function formatVnd(n: number): string {
  return `${Math.round(n).toLocaleString()} ₫`;
}

export type RentRange = {
  min: number;
  max: number;
  currency: "usd" | "vnd";
  secondary?: { min: number; max: number }; // other currency for footnote
};

/**
 * Get rent range for a unit type from area. Prefers USD if present, else VND.
 * If both exist, primary is USD and secondary is VND.
 */
export function formatRentRange(
  area: Area,
  unitType: UnitType
): RentRange | null {
  const key = unitType === "studio" ? "studio" : unitType.replace("br", "br");
  const usdMin = area[`rent_${key}_usd_min` as keyof Area] as number | null | undefined;
  const usdMax = area[`rent_${key}_usd_max` as keyof Area] as number | null | undefined;
  const vndMin = area[`rent_${key}_vnd_min` as keyof Area] as number | null | undefined;
  const vndMax = area[`rent_${key}_vnd_max` as keyof Area] as number | null | undefined;

  const hasUsd = (usdMin != null && usdMin > 0) || (usdMax != null && usdMax > 0);
  const hasVnd = (vndMin != null && vndMin > 0) || (vndMax != null && vndMax > 0);

  if (hasUsd) {
    const min = usdMin != null && usdMin > 0 ? usdMin : (usdMax ?? 0);
    const max = usdMax != null && usdMax > 0 ? usdMax : (usdMin ?? 0);
    const secondary =
      hasVnd && vndMin != null && vndMax != null
        ? { min: vndMin, max: vndMax }
        : undefined;
    return { min, max, currency: "usd", secondary };
  }
  if (hasVnd && vndMin != null && vndMax != null) {
    return { min: vndMin, max: vndMax, currency: "vnd" };
  }
  return null;
}

/** All unit types for rent snapshot. */
export const RENT_UNIT_TYPES: { key: UnitType; label: string }[] = [
  { key: "studio", label: "Studio" },
  { key: "1br", label: "1 BR" },
  { key: "2br", label: "2 BR" },
  { key: "3br", label: "3 BR" },
];

/** Expat score: assume 0–100 or 1–10; clamp and display consistently. */
export function formatExpatScore(value: number | null | undefined): string | null {
  if (value == null) return null;
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  const clamped = n <= 10 ? clamp(n, 0, 10) : clamp(n, 0, 100);
  return clamped <= 10 ? `${clamped}/10` : `${Math.round(clamped)}/100`;
}

/** Parse transport_primary_modes (comma- or pipe-separated) into trimmed strings. */
export function parseTransportModes(value: string | null | undefined): string[] {
  if (value == null || String(value).trim() === "") return [];
  return String(value)
    .split(/[,|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Parse sources_urls (multiple URLs, newline or comma separated) into list. */
export function parseSourcesUrls(value: string | null | undefined): string[] {
  if (value == null || String(value).trim() === "") return [];
  return String(value)
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && /^https?:\/\//i.test(s));
}

/** Check if a string is empty (null, undefined, or blank). */
export function isEmpty(s: string | null | undefined): boolean {
  return s == null || String(s).trim() === "";
}

/** Format aliases for display: DB may store as string (comma/semicolon-sep) or array. Returns e.g. "An Thuong · My An Ward" or null. */
export function formatAliases(aliases: string | string[] | null | undefined): string | null {
  if (aliases == null) return null;
  const parts = Array.isArray(aliases)
    ? aliases.map((a) => String(a).trim()).filter(Boolean)
    : String(aliases).split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  return parts.join(" · ");
}

/**
 * Split "who it's good for" into phrase tags for display.
 * Splits on comma; if no comma, on " and "; if still one piece, groups every 2 words
 * so e.g. "remote workers digital nomads expats" -> ["remote workers", "digital nomads", "expats"].
 */
export function getWhoTags(who: string | null | undefined): string[] {
  const s = who != null ? String(who).trim() : "";
  if (!s) return [];
  const byComma = s.split(",").map((x) => x.trim()).filter(Boolean);
  if (byComma.length > 1) return byComma;
  const byAnd = s.split(/\s+and\s+/i).map((x) => x.trim()).filter(Boolean);
  if (byAnd.length > 1) return byAnd;
  const words = s.split(/\s+/).filter(Boolean);
  if (words.length <= 1) return words.length ? [words[0]] : [];
  const phrases: string[] = [];
  for (let i = 0; i < words.length; i += 2) {
    phrases.push(words.slice(i, i + 2).join(" "));
  }
  return phrases;
}

/**
 * Display string for typical price range: use price_range if set, else build from
 * typical_rent_1br_usd / typical_rent_2br_usd (e.g. "1BR from $450, 2BR from $700").
 */
export function formatAreaPriceDisplay(area: Area): string | null {
  const tags = getAreaPriceTags(area);
  if (tags.length === 0) return null;
  return tags.join(", ");
}

/**
 * Separate price tags for 1BR and 2BR (or a single tag if only price_range is set).
 * Use for overview tag rows so 1BR and 2BR appear as separate pills.
 */
export function getAreaPriceTags(area: Area): string[] {
  const pr = area.price_range;
  if (pr != null && String(pr).trim() !== "") return [String(pr).trim()];
  const r1 = area.typical_rent_1br_usd;
  const r2 = area.typical_rent_2br_usd;
  const has1 = r1 != null && Number(r1) > 0;
  const has2 = r2 != null && Number(r2) > 0;
  const out: string[] = [];
  if (has1) out.push(`1BR from ${formatUsd(Number(r1))}`);
  if (has2) out.push(`2BR from ${formatUsd(Number(r2))}`);
  return out;
}
