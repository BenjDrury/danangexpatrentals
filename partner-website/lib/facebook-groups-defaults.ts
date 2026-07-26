/**
 * Platform-default Facebook groups always offered in the Promote publish overlay.
 * Seeded into `facebook_groups` with is_default_suggestion = true.
 *
 * Update names/URLs here (and re-run ensure) when the “big three” change.
 */
export const PLATFORM_DEFAULT_FACEBOOK_GROUPS = [
  {
    facebookGroupId: "203559903815711",
    url: "https://www.facebook.com/groups/203559903815711",
    name: "Da Nang Housing",
  },
  {
    facebookGroupId: "366245597210651",
    url: "https://www.facebook.com/groups/366245597210651",
    name: "Da Nang Apartments",
  },
  {
    facebookGroupId: null as string | null,
    url: "https://www.facebook.com/groups/danangexpatshouseapartment",
    name: "DA NANG EXPATS HOUSE — Apartment",
  },
] as const;
