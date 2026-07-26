import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  AreaApartmentsSection,
  AreaHero,
  AreaLocation,
  AreaOverview,
  StickyAreaCta,
} from "@/app/components/area";
import { getAreaBySlugOrId, getApartments } from "@/lib/data";
import { formatAreaPriceDisplay, slugify } from "@/lib/area-utils";
import { buildPageMetadata, truncateMeta } from "@/lib/seo";

export const revalidate = 60;

type Props = { params: Promise<{ id: string }> };

function buildMetaDescription(area: {
  name: string;
  vibe?: string | null;
  who?: string | null;
  price_range?: string | null;
}): string {
  const price = formatAreaPriceDisplay(area as Parameters<typeof formatAreaPriceDisplay>[0]);
  const parts = [
    area.vibe?.trim(),
    price ?? area.price_range,
    area.who?.trim() ? `Best for ${area.who.trim()}` : null,
  ].filter(Boolean);
  return truncateMeta(
    `${area.name}: ${parts.join(". ")} Verified listings, English-friendly agents. Get matched in 24h.`
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const area = await getAreaBySlugOrId(id);
  if (!area) return { title: "Area not found" };
  const image = area.images?.find((url) => Boolean(url?.trim())) ?? null;
  return buildPageMetadata({
    title: `${area.name} — Rent & Area Guide for Expats`,
    description: buildMetaDescription(area),
    path: `/areas/${slugify(area.name) || area.id}`,
    image,
    imageAlt: `${area.name}, Da Nang`,
  });
}

export default async function AreaPage({ params }: Props) {
  const { id: slugOrId } = await params;
  const area = await getAreaBySlugOrId(slugOrId);

  if (!area) notFound();

  const apartments = await getApartments({ area_id: area.id });

  return (
    <div className="min-h-screen bg-foam pb-24">
      <AreaHero area={area} />
      <AreaOverview area={area} />
      <AreaLocation area={area} />
      <AreaApartmentsSection
        areaId={area.id}
        areaName={area.name}
        apartments={apartments}
      />
      <StickyAreaCta areaId={area.id} areaName={area.name} />
    </div>
  );
}
