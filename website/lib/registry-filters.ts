/**
 * Client-side filters for coworking + activity registries.
 *
 * Price band mapping (from seed numeric USD fields):
 *
 * Coworking — uses `day_pass_usd` (every seed row has one; café circuit has no monthly):
 *   budget  ≤ $5.50
 *   mid     > $5.50 and ≤ $8
 *   premium > $8
 *
 * Activities — uses `typical_price_usd`:
 *   free    = $0
 *   budget  > $0 and ≤ $15
 *   mid     > $15 and ≤ $35
 *   premium > $35
 *
 * “Amenities” / features come from `tags[]` (there is no separate amenities column).
 * Only tags present on loaded rows are offered; allowlists below exclude
 * location/marketing noise (e.g. facebook, son-tra, unesco).
 */

import type { Activity, CoworkingSpace } from "types";

export type PriceBand = "all" | "free" | "budget" | "mid" | "premium";
export type PassTypeFilter = "all" | "day" | "monthly";

/** Feature-like coworking tags that appear in seed (subset of tags[]). */
export const COWORKING_FEATURE_ALLOWLIST = [
  "community",
  "café",
  "cafés",
  "events",
  "phone booths",
  "garden",
  "24/7 option",
  "focus rooms",
  "monitors",
  "rooftop",
  "sit-stand",
  "wellness",
  "offices",
  "hotel",
  "stay-work",
  "flexible",
  "social",
  "walkable",
] as const;

/** Feature-like activity tags that appear in seed (subset of tags[]). */
export const ACTIVITY_FEATURE_ALLOWLIST = [
  "beach",
  "beginner-friendly",
  "families",
  "family",
  "bilingual",
  "small-group",
  "yoga",
  "drop-in",
  "private",
  "reiki",
  "appointment",
  "sound",
  "rest",
  "weekend",
  "food",
  "cable-car",
  "photos",
  "caves",
  "views",
  "budget",
  "half-day",
  "motorbike",
  "free-ish",
  "free",
  "nature",
  "pagoda",
  "evening",
  "landmark",
  "social",
  "kayak",
  "snorkel",
  "water",
  "guided",
  "pickleball",
  "fitness",
  "community",
  "rentals",
  "surf",
] as const;

const AREA_LABELS: Record<string, string> = {
  "DN-A": "My An / An Thuong",
  "DN-B": "Sơn Trà",
  "DN-C": "Hải Châu / city",
  "DN-E": "Ngũ Hành Sơn south",
};

export type CoworkingFilters = {
  priceBand: PriceBand;
  areaId: string; // "" = all
  passType: PassTypeFilter;
  features: string[];
};

export type ActivityFilters = {
  priceBand: PriceBand;
  category: string; // "" = all
  areaId: string; // "" = all
  features: string[];
};

export const DEFAULT_COWORKING_FILTERS: CoworkingFilters = {
  priceBand: "all",
  areaId: "",
  passType: "all",
  features: [],
};

export const DEFAULT_ACTIVITY_FILTERS: ActivityFilters = {
  priceBand: "all",
  category: "",
  areaId: "",
  features: [],
};

export function coworkingPriceBand(dayPassUsd: number | null | undefined): PriceBand | null {
  if (dayPassUsd == null || Number.isNaN(dayPassUsd)) return null;
  if (dayPassUsd <= 5.5) return "budget";
  if (dayPassUsd <= 8) return "mid";
  return "premium";
}

export function activityPriceBand(typicalUsd: number | null | undefined): PriceBand | null {
  if (typicalUsd == null || Number.isNaN(typicalUsd)) return null;
  if (typicalUsd === 0) return "free";
  if (typicalUsd <= 15) return "budget";
  if (typicalUsd <= 35) return "mid";
  return "premium";
}

export function areaLabel(areaId: string | null | undefined): string {
  if (!areaId) return "Citywide / other";
  return AREA_LABELS[areaId] ?? areaId;
}

export function categoryLabel(category: string): string {
  return category
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function featureLabel(tag: string): string {
  if (tag === "24/7 option") return "24/7 access";
  if (tag === "cafés" || tag === "café") return "Café";
  if (tag === "family" || tag === "families") return "Family-friendly";
  if (tag === "free-ish") return "Free / low cost";
  if (tag === "phone booths") return "Phone booths";
  if (tag === "focus rooms") return "Focus rooms";
  if (tag === "sit-stand") return "Sit-stand desks";
  if (tag === "stay-work") return "Stay & work";
  if (tag === "beginner-friendly") return "Beginner-friendly";
  if (tag === "half-day") return "Half-day";
  if (tag === "small-group") return "Small group";
  if (tag === "drop-in") return "Drop-in";
  if (tag === "cable-car") return "Cable car";
  return tag.charAt(0).toUpperCase() + tag.slice(1);
}

/** Unique area_ids present in items, sorted by label. Includes "" sentinel for null area via "other" key `__none__`. */
export function collectAreaOptions(
  items: { area_id?: string | null }[]
): { value: string; label: string }[] {
  const ids = new Set<string>();
  let hasNone = false;
  for (const item of items) {
    if (item.area_id) ids.add(item.area_id);
    else hasNone = true;
  }
  const opts = [...ids]
    .map((id) => ({ value: id, label: areaLabel(id) }))
    .sort((a, b) => a.label.localeCompare(b.label));
  if (hasNone) opts.push({ value: "__none__", label: areaLabel(null) });
  return opts;
}

export function collectCategoryOptions(activities: Activity[]): { value: string; label: string }[] {
  const cats = [...new Set(activities.map((a) => a.category).filter(Boolean))].sort();
  return cats.map((c) => ({ value: c, label: categoryLabel(c) }));
}

/** Collapse near-duplicate seed tags so filters stay short. */
const TAG_CANONICAL: Record<string, string> = {
  cafés: "café",
  families: "family",
};

export function canonicalizeTag(tag: string): string {
  const t = tag.trim();
  return TAG_CANONICAL[t.toLowerCase()] ?? TAG_CANONICAL[t] ?? t;
}

/**
 * Feature options from tags that appear in data and pass the allowlist,
 * ordered by frequency (most common first), capped.
 */
export function collectFeatureOptions(
  items: { tags: string[] }[],
  allowlist: readonly string[],
  max = 8
): string[] {
  const allowed = new Set(
    allowlist.map((t) => canonicalizeTag(t).toLowerCase())
  );
  const counts = new Map<string, number>();
  for (const item of items) {
    const seen = new Set<string>();
    for (const raw of item.tags) {
      const tag = canonicalizeTag(raw);
      const key = tag.toLowerCase();
      if (!tag || !allowed.has(key) || seen.has(key)) continue;
      seen.add(key);
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, max)
    .map(([tag]) => tag);
}

export function coworkingFiltersActive(f: CoworkingFilters): boolean {
  return (
    f.priceBand !== "all" ||
    f.areaId !== "" ||
    f.passType !== "all" ||
    f.features.length > 0
  );
}

export function activityFiltersActive(f: ActivityFilters): boolean {
  return (
    f.priceBand !== "all" ||
    f.category !== "" ||
    f.areaId !== "" ||
    f.features.length > 0
  );
}

function matchesArea(areaId: string | null | undefined, filter: string): boolean {
  if (!filter) return true;
  if (filter === "__none__") return !areaId;
  return areaId === filter;
}

function matchesFeatures(tags: string[], selected: string[]): boolean {
  if (selected.length === 0) return true;
  const set = new Set(tags.map((t) => canonicalizeTag(t).toLowerCase()));
  return selected.every((f) => set.has(canonicalizeTag(f).toLowerCase()));
}

export function filterCoworkingSpaces(
  spaces: CoworkingSpace[],
  filters: CoworkingFilters
): CoworkingSpace[] {
  return spaces.filter((spot) => {
    if (filters.priceBand !== "all") {
      const band = coworkingPriceBand(spot.day_pass_usd);
      if (band !== filters.priceBand) return false;
    }
    if (!matchesArea(spot.area_id, filters.areaId)) return false;
    if (filters.passType === "day" && spot.day_pass_usd == null) return false;
    if (filters.passType === "monthly" && spot.monthly_usd == null) return false;
    if (!matchesFeatures(spot.tags, filters.features)) return false;
    return true;
  });
}

export function filterActivities(
  activities: Activity[],
  filters: ActivityFilters
): Activity[] {
  return activities.filter((a) => {
    if (filters.priceBand !== "all") {
      const band = activityPriceBand(a.typical_price_usd);
      if (band !== filters.priceBand) return false;
    }
    if (filters.category && a.category !== filters.category) return false;
    if (!matchesArea(a.area_id, filters.areaId)) return false;
    if (!matchesFeatures(a.tags, filters.features)) return false;
    return true;
  });
}

export const COWORKING_PRICE_OPTIONS: { value: PriceBand; label: string }[] = [
  { value: "all", label: "Any cost" },
  { value: "budget", label: "Budget (day ≤ $5.50)" },
  { value: "mid", label: "Mid ($6–8 day)" },
  { value: "premium", label: "Premium (day > $8)" },
];

export const ACTIVITY_PRICE_OPTIONS: { value: PriceBand; label: string }[] = [
  { value: "all", label: "Any cost" },
  { value: "free", label: "Free" },
  { value: "budget", label: "Budget (≤ $15)" },
  { value: "mid", label: "Mid ($16–35)" },
  { value: "premium", label: "Premium (> $35)" },
];

export const PASS_TYPE_OPTIONS: { value: PassTypeFilter; label: string }[] = [
  { value: "all", label: "Day or monthly" },
  { value: "day", label: "Day pass" },
  { value: "monthly", label: "Monthly desk" },
];
