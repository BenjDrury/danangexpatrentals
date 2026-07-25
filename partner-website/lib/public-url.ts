/** Public marketing site origin (apartment pages, living guide). */
export function getPublicSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_WEBSITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export function apartmentPublicUrl(id: string, publicSlug?: string | null): string {
  const base = getPublicSiteUrl();
  if (publicSlug) return `${base}/apartments/${publicSlug}`;
  return `${base}/apartments/${id}`;
}

export function areaPublicUrl(areaId: string): string {
  return `${getPublicSiteUrl()}/areas/${areaId}`;
}

export function guidePublicUrl(path: string): string {
  const base = getPublicSiteUrl();
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${base}${clean}`;
}
