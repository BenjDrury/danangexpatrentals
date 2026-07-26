/** Days since last partner validity check before a listing is hidden publicly. */
export const VALIDITY_STALE_DAYS = 14;

/**
 * ISO cutoff for public apartment queries.
 * Buckets to UTC midnight so ISR / shared caches aren't busted every request.
 */
export function validityPublicCutoffIso(now = new Date()): string {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - VALIDITY_STALE_DAYS);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}
