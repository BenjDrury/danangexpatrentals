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
