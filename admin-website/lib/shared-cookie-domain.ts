/**
 * Parent cookie domain so Supabase auth works across
 * danangexpatrentals.com / partner / admin hosts.
 *
 * On localhost we omit Domain (host-only cookies already span ports).
 * Override with NEXT_PUBLIC_COOKIE_DOMAIN (use "none" to force host-only).
 */
export function getSharedCookieDomain(): string | undefined {
  const explicit = process.env.NEXT_PUBLIC_COOKIE_DOMAIN?.trim();
  if (explicit === "none") return undefined;
  if (explicit) return explicit.startsWith(".") ? explicit : `.${explicit}`;

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_WEBSITE_URL ||
    "";
  try {
    const host = new URL(siteUrl).hostname.toLowerCase();
    if (
      !host ||
      host === "localhost" ||
      host.endsWith(".local") ||
      host.endsWith(".vercel.app")
    ) {
      return undefined;
    }
    if (
      host === "danangexpatrentals.com" ||
      host.endsWith(".danangexpatrentals.com")
    ) {
      return ".danangexpatrentals.com";
    }
  } catch {
    /* ignore invalid URL */
  }
  return undefined;
}

/** Merge shared Domain into cookie options when configured. */
export function withSharedCookieDomain<T extends Record<string, unknown>>(
  options?: T,
): T & { domain?: string } {
  const domain = getSharedCookieDomain();
  if (!domain) return { ...(options as T) };
  return { ...(options as T), domain };
}
