/** Shared Auth error helpers — safe for client and server. */

type AuthApiErrorLike = {
  message?: string;
  status?: number;
  code?: string;
} | null;

/** Stable code returned from server actions for i18n. */
export const AUTH_RATE_LIMITED = "rate_limited";

/** Supabase Auth 429 / over_request_rate_limit (and similar). */
export function isAuthRateLimitError(error: AuthApiErrorLike | string): boolean {
  if (!error) return false;
  if (typeof error === "string") {
    const m = error.toLowerCase();
    return (
      m === AUTH_RATE_LIMITED ||
      m.includes("rate limit") ||
      m.includes("too many requests")
    );
  }
  const msg = (error.message || "").toLowerCase();
  return (
    error.status === 429 ||
    error.code === "over_request_rate_limit" ||
    error.code === "over_email_send_rate_limit" ||
    msg.includes("rate limit") ||
    msg.includes("too many requests")
  );
}
