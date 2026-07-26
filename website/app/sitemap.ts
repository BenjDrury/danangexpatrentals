import type { MetadataRoute } from "next";
import { getAllGuideSlugs } from "@/app/lib/living-guide";
import { getApartments, getAreas } from "@/lib/data";
import { slugify } from "@/lib/area-utils";
import { getSiteUrl } from "@/lib/seo";

const STATIC_PATHS = [
  "/",
  "/apartments",
  "/areas",
  "/moving-guide",
  "/moving-guide/coworking",
  "/moving-guide/activities",
  "/how-it-works",
  "/why-us",
  "/avoid-scams",
  "/faq",
  "/contact",
  "/partners",
  "/partners/apply",
  "/privacy",
  "/terms",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${base}${path === "/" ? "" : path}`,
    lastModified: now,
    changeFrequency: path === "/" || path === "/apartments" ? "daily" : "weekly",
    priority: path === "/" ? 1 : path === "/apartments" || path === "/areas" ? 0.9 : 0.7,
  }));

  const [areas, apartments] = await Promise.all([getAreas(), getApartments()]);

  const areaEntries: MetadataRoute.Sitemap = areas.map((area) => ({
    url: `${base}/areas/${slugify(area.name) || area.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const apartmentEntries: MetadataRoute.Sitemap = apartments.map((apt) => ({
    url: `${base}/apartments/${apt.public_slug || apt.id}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.85,
  }));

  const guideEntries: MetadataRoute.Sitemap = getAllGuideSlugs().map((slug) => ({
    url: `${base}/moving-guide/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  return [...staticEntries, ...areaEntries, ...apartmentEntries, ...guideEntries];
}
