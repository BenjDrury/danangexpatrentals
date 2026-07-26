import type { Metadata } from "next";
import { WHATSAPP_DIGITS, WHATSAPP_URL } from "@/app/lib/contact-links";

export const SITE_NAME = "Da Nang Expat Rentals";
export const SITE_TAGLINE = "Find your home in Da Nang";
export const PRODUCTION_SITE_URL = "https://danangexpatrentals.com";

export const DEFAULT_DESCRIPTION =
  "Verified apartments, honest neighbourhood guides, and friendly help finding a place to stay in Da Nang — short-term or long-term.";

/** Default social/SEO preview image (`public/og-default.jpg`, 1200×630). */
export const DEFAULT_OG_IMAGE_PATH = "/og-default.jpg";
export const DEFAULT_OG_IMAGE_WIDTH = 1200;
export const DEFAULT_OG_IMAGE_HEIGHT = 630;

/**
 * Public site origin for canonicals, sitemap, OG, and JSON-LD.
 * Never use per-deployment VERCEL_URL — that breaks production SEO.
 */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  // Stable production hostname on Vercel (custom domain or project production URL).
  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(/\/$/, "");
  if (vercelProd) {
    return vercelProd.startsWith("http") ? vercelProd : `https://${vercelProd}`;
  }

  return PRODUCTION_SITE_URL;
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
  /** When true, allow following links but do not index (e.g. paginated lists). */
  noIndexFollow?: boolean;
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
  noIndexFollow,
}: BuildPageMetadataOptions): Metadata {
  const desc = truncateMeta(description);
  const imageUrl = absoluteUrl(
    image && image.trim() ? image.trim() : DEFAULT_OG_IMAGE_PATH
  );
  const canonical = path ? absoluteUrl(path) : undefined;
  const socialTitle = shareTitle(title);
  const robots =
    noIndex || noIndexFollow
      ? { index: false, follow: !noIndex }
      : undefined;

  return {
    title,
    description: desc,
    alternates: canonical ? { canonical } : undefined,
    robots,
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
          width: DEFAULT_OG_IMAGE_WIDTH,
          height: DEFAULT_OG_IMAGE_HEIGHT,
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

export type BreadcrumbItem = { name: string; path: string };

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function articleJsonLd({
  title,
  description,
  path,
  image,
  dateModified,
}: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  dateModified?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: truncateMeta(description),
    mainEntityOfPage: absoluteUrl(path),
    url: absoluteUrl(path),
    image: absoluteUrl(image && image.trim() ? image.trim() : DEFAULT_OG_IMAGE_PATH),
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: getSiteUrl(),
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: getSiteUrl(),
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/icon-512.png"),
      },
    },
    ...(dateModified ? { dateModified } : {}),
  };
}

export function faqPageJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
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
    logo: absoluteUrl("/icon-512.png"),
    ...(WHATSAPP_URL
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            url: WHATSAPP_URL,
            ...(WHATSAPP_DIGITS
              ? { telephone: `+${WHATSAPP_DIGITS}` }
              : {}),
            availableLanguage: ["English"],
            areaServed: "VN",
          },
        }
      : {}),
  };
}
