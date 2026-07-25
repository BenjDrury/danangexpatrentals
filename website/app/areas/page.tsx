import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Section, SectionHero } from "../components/sections";
import { getAreas } from "@/lib/data";
import { formatAliases } from "@/lib/area-utils";

export const metadata: Metadata = {
  title: "Neighbourhood guides — Where to live in Da Nang",
  description:
    "Editorial guides to Da Nang neighbourhoods for expats: My An, An Thuong, Son Tra, Hai Chau, and quieter coastal areas.",
};

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
            return (
              <article
                key={area.id}
                className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
              >
                <Link
                  href={`/areas/${area.id}`}
                  className={`relative block aspect-[5/4] overflow-hidden rounded-2xl bg-sand ${
                    imageLeft ? "lg:order-1" : "lg:order-2"
                  }`}
                >
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={area.name}
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
                    href={`/areas/${area.id}`}
                    className="mt-2 block font-display text-3xl font-semibold tracking-tight text-charcoal transition hover:text-ocean"
                  >
                    {area.name}
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
                    <Link
                      href={`/areas/${area.id}`}
                      className="inline-flex rounded-quieter bg-ocean px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-deep"
                    >
                      Read the guide
                    </Link>
                    <Link
                      href={`/contact?preferred_area=${encodeURIComponent(area.name)}&areaId=${area.id}`}
                      className="inline-flex rounded-quieter border border-line px-5 py-2.5 text-sm font-semibold text-charcoal transition hover:bg-sand"
                    >
                      Find a home here
                    </Link>
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
