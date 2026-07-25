import { listingPriceLabel, type Apartment } from "types";

type AreaBlurb = { name: string; vibe?: string | null };

/**
 * Build a ready-to-copy Facebook-style caption with neighbourhood context.
 */
export function buildListingCaption(
  apt: Apartment,
  area: AreaBlurb | null,
  publicUrl: string
): string {
  const bits: string[] = [];
  bits.push(`🏠 ${apt.title}`);
  bits.push("");
  bits.push(`${listingPriceLabel(apt)} · ${apt.bedrooms} BR${apt.bathrooms != null ? ` · ${apt.bathrooms} bath` : ""}${apt.size_sqm != null ? ` · ${apt.size_sqm} m²` : ""}`);
  if (area) {
    bits.push("");
    bits.push(`📍 ${area.name}`);
    if (area.vibe?.trim()) bits.push(area.vibe.trim());
  }
  if (apt.description?.trim()) {
    bits.push("");
    bits.push(apt.description.trim().slice(0, 280) + (apt.description.length > 280 ? "…" : ""));
  }
  if (apt.features?.length) {
    bits.push("");
    bits.push(apt.features.slice(0, 6).map((f) => `✓ ${f}`).join("\n"));
  }
  bits.push("");
  bits.push(`Photos & details: ${publicUrl}`);
  bits.push("");
  bits.push("#DaNang #DaNangRentals #ExpatLife #ApartmentForRent");
  return bits.join("\n");
}

export function daysSinceBump(apt: Apartment): number | null {
  const raw = apt.last_bumped_at ?? apt.updated_at;
  if (!raw) return null;
  const then = new Date(raw).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24));
}

export function needsBump(apt: Apartment, everyDays = 7): boolean {
  if (apt.status && apt.status !== "available") return false;
  const days = daysSinceBump(apt);
  if (days == null) return true;
  return days >= everyDays;
}
