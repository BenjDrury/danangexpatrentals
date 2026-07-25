/** Days since last partner validity check before a listing is hidden publicly. */
export const VALIDITY_STALE_DAYS = 14;

/** ISO cutoff for public apartment queries. */
export function validityPublicCutoffIso(now = new Date()): string {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - VALIDITY_STALE_DAYS);
  return d.toISOString();
}
