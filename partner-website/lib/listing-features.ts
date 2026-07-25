/** Controlled feature options for Partner Studio listings (stored as these English labels). */
export const LISTING_FEATURE_OPTIONS = [
  "Furnished",
  "Semi-furnished",
  "Unfurnished",
  "Air conditioning",
  "Balcony",
  "Sea view",
  "City view",
  "Pool",
  "Gym",
  "Parking",
  "Motorbike parking",
  "Elevator",
  "Washing machine",
  "Dryer",
  "Dishwasher",
  "Kitchen",
  "Full kitchen",
  "Wifi",
  "Workspace / desk",
  "Pet friendly",
  "Security / CCTV",
  "Hot water",
  "Water heater",
  "Near beach",
  "Quiet street",
  "Ground floor",
  "High floor",
] as const;

export type ListingFeatureOption = (typeof LISTING_FEATURE_OPTIONS)[number];

const ALLOWED = new Set<string>(LISTING_FEATURE_OPTIONS);

export function isAllowedListingFeature(value: string): boolean {
  return ALLOWED.has(value);
}

/** Keep only allowlisted features; preserve order of LISTING_FEATURE_OPTIONS. */
export function filterListingFeatures(values: string[]): string[] {
  const selected = new Set(values.map((v) => v.trim()).filter(Boolean));
  return LISTING_FEATURE_OPTIONS.filter((opt) => selected.has(opt));
}
