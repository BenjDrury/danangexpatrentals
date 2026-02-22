import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  AreaApartmentsSection,
  AreaConvenience,
  AreaHero,
  AreaLocation,
  AreaRentSnapshot,
  AreaRightForYou,
  AreaTrustFooter,
  StickyAreaCta,
} from "@/app/components/area";
import { getAreaBySlugOrId, getApartments } from "@/lib/data";
import { formatAreaPriceDisplay } from "@/lib/area-utils";

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
  const base = `${area.name}: ${parts.join(". ")} Verified listings, English-friendly agents. Get matched in 24h.`;
  return base.length > 155 ? base.slice(0, 152) + "…" : base;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const area = await getAreaBySlugOrId(id);
  if (!area) return { title: "Area not found" };
  return {
    title: `${area.name} — Rent & Area Guide for Expats | Da Nang`,
    description: buildMetaDescription(area),
  };
}

export default async function AreaPage({ params }: Props) {
  const { id: slugOrId } = await params;
  const area = await getAreaBySlugOrId(slugOrId);

  if (!area) notFound();

  const apartments = await getApartments({ area_id: area.id });

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <AreaHero area={area} />
      <AreaRightForYou area={area} />
      <AreaRentSnapshot area={area} />
      <AreaConvenience area={area} />
      <AreaLocation area={area} />
      <AreaApartmentsSection
        areaId={area.id}
        areaName={area.name}
        apartments={apartments}
      />
      <AreaTrustFooter area={area} />
      <StickyAreaCta areaId={area.id} areaName={area.name} />
    </div>
  );
}
