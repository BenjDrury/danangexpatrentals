import type { PropertyType, UtilitiesIncluded } from "../types/Apartment";

/** Format a months-of-rent value for display (e.g. 1 → "1 month", 1.5 → "1.5 months"). */
export function formatMonthsOfRent(months: number): string {
  const label = Number.isInteger(months) ? String(months) : String(months);
  return `${label} month${months === 1 ? "" : "s"}`;
}

export function propertyTypeLabel(type: PropertyType): string {
  switch (type) {
    case "apartment":
      return "Apartment";
    case "house":
      return "House";
    case "villa":
      return "Villa";
    case "serviced":
      return "Serviced apartment";
  }
}

const PROPERTY_TYPES: PropertyType[] = [
  "apartment",
  "house",
  "villa",
  "serviced",
];

/** Normalize a raw property_type string; returns null if unknown. */
export function parsePropertyType(value: unknown): PropertyType | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toLowerCase();
  return (PROPERTY_TYPES as string[]).includes(v) ? (v as PropertyType) : null;
}

/**
 * Infer property type from listing title/description when the field is unset.
 * Prefers villa → serviced → house → apartment cues; defaults to apartment.
 */
export function inferPropertyType(
  title: string | null | undefined,
  description?: string | null
): PropertyType {
  const t = `${title ?? ""} ${description ?? ""}`.toLowerCase();
  if (/\bvilla\b|biệt thự|biet thu/.test(t)) return "villa";
  if (
    /\bserviced\b|service apartment|căn hộ dịch vụ|can ho dich vu/.test(t)
  ) {
    return "serviced";
  }
  if (/\bhouse\b|\btownhouse\b|\bnhà phố\b|\bnha pho\b/.test(t)) return "house";
  // Standalone "nhà" / "nha" often means house in VN rental posts
  if (/(?:^|[^\w])nhà(?:[^\w]|$)|(?:^|[^\w])nha(?:[^\w]|$)/.test(t)) {
    return "house";
  }
  if (
    /\bapartment\b|\bcondo\b|\bstudio\b|\bpenthouse\b|\bcăn hộ\b|\bcan ho\b|\bflat\b/.test(
      t
    )
  ) {
    return "apartment";
  }
  return "apartment";
}

export function utilitiesIncludedLabel(value: UtilitiesIncluded): string {
  switch (value) {
    case "not_included":
      return "Not included";
    case "partial":
      return "Partially included";
    case "included":
      return "Included";
  }
}

/** Agency fee: 0 → "None", otherwise months of rent. */
export function agencyFeeLabel(months: number): string {
  if (months === 0) return "None";
  return formatMonthsOfRent(months);
}
