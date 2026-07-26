import type { Metadata } from "next";

export const SITE_NAME = "Da Nang Expat Rentals";
export const SITE_TAGLINE = "Find your home in Da Nang";

export const DEFAULT_DESCRIPTION =
  "Verified apartments, honest neighbourhood guides, and friendly help finding a place to stay in Da Nang — short-term or long-term.";

/** Default social/SEO preview image (`public/danang-hero-bg.jpg`). */
export const DEFAULT_OG_IMAGE_PATH = "/danang-hero-bg.jpg";

export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const vercel = process.env.VERCEL_URL?.replace(/\/$/, "");
  if (vercel) return `https://${vercel}`;
  return "https://danangexpatrentals.com";
}

/** Resolve a site path or absolute URL to an absolute URL. */
export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${getSiteUrl()}${path}`;
}

export function truncateMeta(text: string, max = 160): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function shareTitle(title: string): string {
  return title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
}

type BuildPageMetadataOptions = {
  title: string;
  description: string;
  /** Canonical path, e.g. `/apartments/abc`. */
  path?: string;
  /** Absolute or site-relative image URL. Falls back to the default hero. */
  image?: string | null;
  imageAlt?: string;
  type?: "website" | "article";
  noIndex?: boolean;
};

/**
 * Title, description, canonical, Open Graph, and Twitter card metadata.
 * Always includes a share image so social previews never look blank.
 */
export function buildPageMetadata({
  title,
  description,
  path,
  image,
  imageAlt,
  type = "website",
  noIndex,
}: BuildPageMetadataOptions): Metadata {
  const desc = truncateMeta(description);
  const imageUrl = absoluteUrl(
    image && image.trim() ? image.trim() : DEFAULT_OG_IMAGE_PATH
  );
  const canonical = path ? absoluteUrl(path) : undefined;
  const socialTitle = shareTitle(title);

  return {
    title,
    description: desc,
    alternates: canonical ? { canonical } : undefined,
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: socialTitle,
      description: desc,
      url: canonical,
      siteName: SITE_NAME,
      locale: "en_US",
      type,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: imageAlt ?? title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: desc,
      images: [imageUrl],
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: SITE_NAME,
    url: getSiteUrl(),
    description: DEFAULT_DESCRIPTION,
    areaServed: {
      "@type": "City",
      name: "Da Nang",
      addressCountry: "VN",
    },
    image: absoluteUrl(DEFAULT_OG_IMAGE_PATH),
  };
}
