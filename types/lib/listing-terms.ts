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

const UTILITIES_VALUES: UtilitiesIncluded[] = [
  "not_included",
  "partial",
  "included",
];

/** Defaults used when Facebook posts omit terms (typical Da Nang private rental). */
export const DEFAULT_PROPERTY_TYPE: PropertyType = "apartment";
export const DEFAULT_UTILITIES_INCLUDED: UtilitiesIncluded = "not_included";
export const DEFAULT_DEPOSIT_MONTHS = 1;
export const DEFAULT_AGENCY_FEE_MONTHS = 0;

/** Normalize a raw property_type string; returns null if unknown. */
export function parsePropertyType(value: unknown): PropertyType | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toLowerCase();
  return (PROPERTY_TYPES as string[]).includes(v) ? (v as PropertyType) : null;
}

export function parseUtilitiesIncluded(
  value: unknown
): UtilitiesIncluded | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toLowerCase().replace(/\s+/g, "_");
  if (v === "not_included" || v === "none" || v === "excluded") {
    return "not_included";
  }
  if (v === "partial" || v === "partially_included" || v === "some") {
    return "partial";
  }
  if (v === "included" || v === "all_included" || v === "fully_included") {
    return "included";
  }
  return (UTILITIES_VALUES as string[]).includes(v)
    ? (v as UtilitiesIncluded)
    : null;
}

/** Parse months-of-rent style numbers; returns null if missing/invalid. */
export function parseMonthsOfRent(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 2) / 2; // allow half-months
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
  return DEFAULT_PROPERTY_TYPE;
}

/** Infer utilities inclusion from free text; null if no clear signal. */
export function inferUtilitiesIncluded(
  text: string | null | undefined
): UtilitiesIncluded | null {
  const t = (text ?? "").toLowerCase();
  if (!t.trim()) return null;

  const allIncluded =
    /(?:all\s+)?utilities?\s+(?:are\s+)?(?:fully\s+)?included|utilities?\s+included\s+in\s+(?:the\s+)?rent|rent\s+includes?\s+(?:all\s+)?utilities?|bao\s+điện\s*nước|bao dien nuoc|điện\s*nước\s*(?:đã\s*)?tính\s*trong|full\s+utilities/i.test(
      t
    );
  const noneIncluded =
    /utilities?\s+(?:are\s+)?(?:not|excluded)|(?:no|without)\s+utilities?\s+included|electric(?:ity)?\s+(?:and\s+water\s+)?(?:not|excluded)|tenant\s+pays?\s+(?:for\s+)?(?:utilities?|electric)|điện\s*nước\s+(?:tự\s*)?trả|dien nuoc tu tra|not\s+include[sd]?\s+utilities?/i.test(
      t
    );
  const partial =
    /(?:wifi|internet|water)\s+included|included[:\s]+(?:wifi|internet|water)|partial(?:ly)?\s+(?:utilities?|included)|utilities?\s+partial|electric(?:ity)?\s+not\s+included.{0,40}(?:water|wifi|internet)\s+included|(?:water|wifi|internet)\s+included.{0,40}electric(?:ity)?\s+not/i.test(
      t
    );

  if (allIncluded && !noneIncluded) return "included";
  if (partial && !allIncluded) return "partial";
  if (noneIncluded) return "not_included";
  return null;
}

/** Infer deposit as months of rent; null if not stated. */
export function inferDepositMonths(
  text: string | null | undefined
): number | null {
  const t = text ?? "";
  const patterns = [
    /(?:deposit|security\s+deposit|cọc|coc)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:months?|tháng|thang)/i,
    /(\d+(?:\.\d+)?)\s*(?:months?|tháng|thang)\s+(?:security\s+)?deposit/i,
    /(\d+(?:\.\d+)?)\s*(?:months?|tháng|thang)\s+cọc/i,
  ];
  for (const re of patterns) {
    const m = t.match(re);
    if (m) {
      const n = parseMonthsOfRent(m[1]);
      if (n != null) return n;
    }
  }
  if (/no\s+deposit|deposit\s+not\s+required|không\s+cọc|khong\s+coc/i.test(t)) {
    return 0;
  }
  return null;
}

/** Infer agency/service fee as months of rent; null if not stated. */
export function inferAgencyFeeMonths(
  text: string | null | undefined
): number | null {
  const t = text ?? "";
  if (
    /no\s+agency\s+fee|no\s+commission|zero\s+commission|commission[\s-]*free|free\s+commission|không\s+phí\s+môi\s*giới|khong\s+phi\s+moi\s*gioi|no\s+broker\s+fee/i.test(
      t
    )
  ) {
    return 0;
  }
  const patterns = [
    /(?:agency|service|broker|commission)\s+fee\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:months?|tháng|thang)/i,
    /(\d+(?:\.\d+)?)\s*(?:months?|tháng|thang)\s+(?:agency|service|broker|commission)\s+fee/i,
    /phí\s+môi\s*giới\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:tháng|thang)?/i,
  ];
  for (const re of patterns) {
    const m = t.match(re);
    if (m) {
      const n = parseMonthsOfRent(m[1]);
      if (n != null) return n;
    }
  }
  return null;
}

export type ResolvedListingTerms = {
  property_type: PropertyType;
  utilities_included: UtilitiesIncluded;
  deposit_months: number;
  agency_fee_months: number;
};

/**
 * Resolve listing terms for Facebook import: prefer explicit values, then
 * text inference, then market defaults so columns are never left null.
 */
export function resolveListingTerms(input: {
  title?: string | null;
  description?: string | null;
  /** Raw post text — used for inference when description was sanitized. */
  sourceText?: string | null;
  property_type?: unknown;
  utilities_included?: unknown;
  deposit_months?: unknown;
  agency_fee_months?: unknown;
}): ResolvedListingTerms {
  const blob = [input.title, input.description, input.sourceText]
    .filter(Boolean)
    .join("\n");

  return {
    property_type:
      parsePropertyType(input.property_type) ??
      inferPropertyType(input.title, blob),
    utilities_included:
      parseUtilitiesIncluded(input.utilities_included) ??
      inferUtilitiesIncluded(blob) ??
      DEFAULT_UTILITIES_INCLUDED,
    deposit_months:
      parseMonthsOfRent(input.deposit_months) ??
      inferDepositMonths(blob) ??
      DEFAULT_DEPOSIT_MONTHS,
    agency_fee_months:
      parseMonthsOfRent(input.agency_fee_months) ??
      inferAgencyFeeMonths(blob) ??
      DEFAULT_AGENCY_FEE_MONTHS,
  };
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
