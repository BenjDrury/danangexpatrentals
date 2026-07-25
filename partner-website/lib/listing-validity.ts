import type { Apartment } from "types";

/** Days since last check before a listing enters the Home validity feed. */
export const VALIDITY_FEED_DAYS = 10;

/** Days since last check before a listing is stale (hidden on the public site). */
export const VALIDITY_STALE_DAYS = 14;

export type ValidityFeedItem = {
  type: "validity";
  listing: Apartment;
  daysSinceCheck: number | null;
  stale: boolean;
};

/** Extensible Home task feed — add new task types here later. */
export type HomeFeedItem = ValidityFeedItem;

function referenceDate(apt: Apartment): Date | null {
  const raw =
    apt.last_validity_check ?? apt.updated_at ?? apt.created_at ?? null;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Whole days since last validity check (or fallback date). Null = unknown / never. */
export function daysSinceValidityCheck(apt: Apartment): number | null {
  if (apt.last_validity_check == null && !apt.updated_at && !apt.created_at) {
    return null;
  }
  const then = referenceDate(apt);
  if (!then) return null;
  return Math.floor((Date.now() - then.getTime()) / (1000 * 60 * 60 * 24));
}

export function needsValidityCheck(apt: Apartment): boolean {
  if (apt.status && apt.status !== "available") return false;
  if (apt.last_validity_check == null && !apt.updated_at && !apt.created_at) {
    return true;
  }
  const days = daysSinceValidityCheck(apt);
  if (days == null) return true;
  return days >= VALIDITY_FEED_DAYS;
}

/** Available listings past the stale window — hidden from the public site. */
export function isValidityStale(apt: Apartment): boolean {
  if (apt.status && apt.status !== "available") return false;
  if (apt.last_validity_check == null && !apt.updated_at && !apt.created_at) {
    return true;
  }
  const days = daysSinceValidityCheck(apt);
  if (days == null) return true;
  return days >= VALIDITY_STALE_DAYS;
}

/** ISO cutoff for public queries: last_validity_check must be on or after this. */
export function validityPublicCutoffIso(now = new Date()): string {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - VALIDITY_STALE_DAYS);
  return d.toISOString();
}

export function buildHomeFeed(listings: Apartment[]): HomeFeedItem[] {
  const items: HomeFeedItem[] = [];

  for (const listing of listings) {
    if (!needsValidityCheck(listing)) continue;
    const daysSinceCheck = daysSinceValidityCheck(listing);
    items.push({
      type: "validity",
      listing,
      daysSinceCheck,
      stale: isValidityStale(listing),
    });
  }

  items.sort((a, b) => {
    // Stale first, then oldest check first
    if (a.stale !== b.stale) return a.stale ? -1 : 1;
    const da = a.daysSinceCheck ?? 9999;
    const db = b.daysSinceCheck ?? 9999;
    return db - da;
  });

  return items;
}
