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

/** Filter / chip labels — includes display-only `rejected` when a go-live note exists. */
export const LISTING_STATUS_FILTERS = [
  "draft",
  "rejected",
  "pending_review",
  "available",
  "reserved",
  "rented",
] as const;

export type ListingDisplayStatus =
  | ListingStatus
  | "rejected";

/** Show as Rejected in the UI when admin left a go-live rejection note (DB stays draft). */
export function listingDisplayStatus(
  status?: string | null,
  rejectionNote?: string | null,
): ListingDisplayStatus {
  if (rejectionNote?.trim()) return "rejected";
  if (status && (ALL_LISTING_STATUSES as readonly string[]).includes(status)) {
    return status as ListingStatus;
  }
  return "draft";
}

/** Admin-approved live status — public site also requires a fresh validity check. */
export function isListingLiveStatus(status?: string | null): boolean {
  return status === "available";
}
