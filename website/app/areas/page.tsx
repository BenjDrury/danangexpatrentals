import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Section, SectionHero } from "../components/sections";
import { TrackedLink } from "../components/TrackedLink";
import { getAreas } from "@/lib/data";
import { areaDisplayName, areaPath, formatAliases } from "@/lib/area-utils";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Neighbourhood guides — Where to live in Da Nang",
  description:
    "Editorial guides to Da Nang neighbourhoods for expats: My An, An Thuong, Son Tra, Hai Chau, and quieter coastal areas.",
  path: "/areas",
});

export const revalidate = 60;

export default async function AreasPage() {
  const areas = await getAreas();

  return (
    <div className="min-h-screen bg-foam">
      <SectionHero
        variant="page"
        title="Neighbourhoods"
        subtitle="A simple guide to the main areas expats live in — vibe, lifestyle fit, and who each place suits."
      />

      <Section bg="bg-foam">
        <div className="space-y-20">
          {areas.map((area, index) => {
            const imageUrl = area.images?.[0];
            const imageLeft = index % 2 === 1;
            const href = areaPath(area);
            const label = areaDisplayName(area);
            return (
              <article
                key={area.id}
                className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
              >
                <Link
                  href={href}
                  className={`relative block aspect-[5/4] overflow-hidden rounded-2xl bg-sand ${
                    imageLeft ? "lg:order-1" : "lg:order-2"
                  }`}
                >
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={`${label}, Da Nang`}
                      fill
                      className="object-cover transition duration-700 ease-soft hover:scale-[1.03]"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-sand-deep" aria-hidden />
                  )}
                </Link>

                <div className={imageLeft ? "lg:order-2" : "lg:order-1"}>
                  {area.vibe?.trim() && (
                    <p className="text-sm font-medium tracking-wide text-ocean">
                      {area.vibe.trim()}
                    </p>
                  )}
                  <Link
                    href={href}
                    className="mt-2 block font-display text-3xl font-semibold tracking-tight text-charcoal transition hover:text-ocean"
                  >
                    {label}
                  </Link>
                  {formatAliases(area.aliases) && (
                    <p className="mt-2 text-sm text-muted">{formatAliases(area.aliases)}</p>
                  )}
                  {area.who?.trim() && (
                    <p className="mt-5 text-lg leading-relaxed text-muted">
                      Best for {area.who.trim()}.
                    </p>
                  )}
                  <div className="mt-8 flex flex-wrap gap-3">
                    <TrackedLink
                      href={href}
                      event="area_guide_clicked"
                      eventProps={{ area_id: area.id, area_name: label, source: "areas_index" }}
                      className="inline-flex rounded-quieter bg-ocean px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-deep"
                    >
                      Read the guide
                    </TrackedLink>
                    <TrackedLink
                      href={`${href}#listings`}
                      event="area_find_home_clicked"
                      eventProps={{ area_id: area.id, area_name: label }}
                      className="inline-flex rounded-quieter border border-line px-5 py-2.5 text-sm font-semibold text-charcoal transition hover:bg-sand"
                    >
                      Find a home here
                    </TrackedLink>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
