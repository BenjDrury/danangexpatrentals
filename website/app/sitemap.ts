import type { MetadataRoute } from "next";
import { getAllGuideSlugs } from "@/app/lib/living-guide";
import { getApartments, getAreas } from "@/lib/data";
import { apartmentPath, areaPath } from "@/lib/area-utils";
import { getSiteUrl } from "@/lib/seo";

/** Public indexable routes only — forms and thin utilities stay out. */
const STATIC_PATHS: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/apartments", changeFrequency: "daily", priority: 0.9 },
  { path: "/areas", changeFrequency: "weekly", priority: 0.9 },
  { path: "/moving-guide", changeFrequency: "weekly", priority: 0.8 },
  { path: "/moving-guide/coworking", changeFrequency: "weekly", priority: 0.7 },
  { path: "/moving-guide/activities", changeFrequency: "weekly", priority: 0.7 },
  { path: "/how-it-works", changeFrequency: "monthly", priority: 0.7 },
  { path: "/why-us", changeFrequency: "monthly", priority: 0.7 },
  { path: "/avoid-scams", changeFrequency: "monthly", priority: 0.75 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
  { path: "/partners", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map(
    ({ path, changeFrequency, priority }) => ({
      url: `${base}${path === "/" ? "" : path}`,
      lastModified: now,
      changeFrequency,
      priority,
    })
  );

  const [areas, apartments] = await Promise.all([getAreas(), getApartments()]);

  const areaEntries: MetadataRoute.Sitemap = areas.map((area) => ({
    url: `${base}${areaPath(area)}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const apartmentEntries: MetadataRoute.Sitemap = apartments.map((apt) => ({
    url: `${base}${apartmentPath(apt)}`,
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
