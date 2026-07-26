import type { Metadata } from "next";
import { permanentRedirect, notFound } from "next/navigation";
import {
  AreaApartmentsSection,
  AreaHero,
  AreaLocation,
  AreaOverview,
  StickyAreaCta,
} from "@/app/components/area";
import { getAreaBySlugOrId, getApartments } from "@/lib/data";
import {
  areaDisplayName,
  areaPath,
  formatAreaPriceDisplay,
  slugify,
} from "@/lib/area-utils";
import {
  breadcrumbJsonLd,
  buildPageMetadata,
  truncateMeta,
} from "@/lib/seo";

export const revalidate = 60;

type Props = { params: Promise<{ id: string }> };

function buildMetaDescription(area: {
  name: string;
  vibe?: string | null;
  who?: string | null;
  price_range?: string | null;
  canonical_area_name?: string | null;
}): string {
  const label = areaDisplayName(area);
  const price = formatAreaPriceDisplay(area as Parameters<typeof formatAreaPriceDisplay>[0]);
  const parts = [
    area.vibe?.trim(),
    price ?? area.price_range,
    area.who?.trim() ? `Best for ${area.who.trim()}` : null,
  ].filter(Boolean);
  return truncateMeta(
    `${label}: ${parts.join(". ")} Verified listings, English-friendly agents. Get matched in 24h.`
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const area = await getAreaBySlugOrId(id);
  if (!area) return { title: "Area not found" };
  const image = area.images?.find((url) => Boolean(url?.trim())) ?? null;
  const label = areaDisplayName(area);
  return buildPageMetadata({
    title: `${label} — Da Nang area guide`,
    description: buildMetaDescription(area),
    path: areaPath(area),
    image,
    imageAlt: `${label}, Da Nang`,
  });
}

export default async function AreaPage({ params }: Props) {
  const { id: slugOrId } = await params;
  const area = await getAreaBySlugOrId(slugOrId);

  if (!area) notFound();

  const canonicalSlug = slugify(area.name) || area.id;
  if (slugOrId !== canonicalSlug) {
    permanentRedirect(areaPath(area));
  }

  const apartments = await getApartments({ area_id: area.id });
  const label = areaDisplayName(area);
  const crumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Neighbourhoods", path: "/areas" },
    { name: label, path: areaPath(area) },
  ]);

  return (
    <div className="min-h-screen bg-foam pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      <AreaHero area={area} />
      <AreaOverview area={area} />
      <AreaLocation area={area} />
      <AreaApartmentsSection
        areaId={area.id}
        areaName={label}
        apartments={apartments}
      />
      <StickyAreaCta areaId={area.id} areaName={label} />
    </div>
  );
}
