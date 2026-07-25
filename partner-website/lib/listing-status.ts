/** Statuses a partner may set directly (never `available`). */
export const PARTNER_SETTABLE_STATUSES = ["draft", "reserved", "rented"] as const;

/** Full lifecycle including admin / request states. */
export const ALL_LISTING_STATUSES = [
  "draft",
  "pending_review",
  "available",
  "reserved",
  "rented",
] as const;

export type ListingStatus = (typeof ALL_LISTING_STATUSES)[number];

/** Admin-approved live status — public site also requires a fresh validity check. */
export function isListingLiveStatus(status?: string | null): boolean {
  return status === "available";
}
