import type { Apartment } from "types";
import type { ListingFacebookBatchSummary } from "@/lib/data/facebook-posts";

/** Days since last check before a listing enters the Home validity feed. */
export const VALIDITY_FEED_DAYS = 10;

/** Days since last check before a listing is stale (hidden on the public site). */
export const VALIDITY_STALE_DAYS = 14;

/** Days since last Facebook publish before Home suggests posting again. */
export const FACEBOOK_REPOST_DAYS = 21;

export type ValidityFeedItem = {
  type: "validity";
  listing: Apartment;
  daysSinceCheck: number | null;
  stale: boolean;
};

export type FacebookRepostFeedItem = {
  type: "facebook_repost";
  listing: Apartment;
  daysSincePost: number | null;
  lastSummary: ListingFacebookBatchSummary | null;
};

/** Extensible Home task feed — add new task types here later. */
export type HomeFeedItem = ValidityFeedItem | FacebookRepostFeedItem;

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

export function daysSinceFacebookPost(apt: Apartment): number | null {
  const raw = apt.last_facebook_posted_at;
  if (!raw) return null;
  const then = new Date(raw);
  if (Number.isNaN(then.getTime())) return null;
  return Math.floor((Date.now() - then.getTime()) / (1000 * 60 * 60 * 24));
}

/** Available listings that have never been posted, or last post ≥ FACEBOOK_REPOST_DAYS ago. */
export function needsFacebookRepost(
  apt: Apartment,
  everyDays = FACEBOOK_REPOST_DAYS,
): boolean {
  if (apt.status && apt.status !== "available") return false;
  if (isValidityStale(apt)) return false;
  const days = daysSinceFacebookPost(apt);
  if (days == null) return true;
  return days >= everyDays;
}

export function buildHomeFeed(
  listings: Apartment[],
  latestFacebookByListing?: Map<string, ListingFacebookBatchSummary>,
): HomeFeedItem[] {
  const items: HomeFeedItem[] = [];
  const validityIds = new Set<string>();

  for (const listing of listings) {
    if (!needsValidityCheck(listing)) continue;
    const daysSinceCheck = daysSinceValidityCheck(listing);
    items.push({
      type: "validity",
      listing,
      daysSinceCheck,
      stale: isValidityStale(listing),
    });
    validityIds.add(listing.id);
  }

  for (const listing of listings) {
    if (validityIds.has(listing.id)) continue;
    if (!needsFacebookRepost(listing)) continue;
    items.push({
      type: "facebook_repost",
      listing,
      daysSincePost: daysSinceFacebookPost(listing),
      lastSummary: latestFacebookByListing?.get(listing.id) ?? null,
    });
  }

  items.sort((a, b) => {
    const rank = (item: HomeFeedItem) => {
      if (item.type === "validity") return item.stale ? 0 : 1;
      return 2;
    };
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;

    if (a.type === "validity" && b.type === "validity") {
      const da = a.daysSinceCheck ?? 9999;
      const db = b.daysSinceCheck ?? 9999;
      return db - da;
    }
    if (a.type === "facebook_repost" && b.type === "facebook_repost") {
      const da = a.daysSincePost ?? 9999;
      const db = b.daysSincePost ?? 9999;
      return db - da;
    }
    return 0;
  });

  return items;
}
