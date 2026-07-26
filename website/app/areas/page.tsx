import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Section, SectionHero } from "../components/sections";
import { TrackedLink } from "../components/TrackedLink";
import { getAreas } from "@/lib/data";
import { areaDisplayName, areaPath, formatAliases } from "@/lib/area-utils";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Da Nang neighbourhood guides",
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

      <Section bg="bg-white" className="!py-10 sm:!py-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-base leading-relaxed text-muted sm:text-lg">
            Start with the area that matches how you want to live, then browse apartments or
            get matched. For budgets and day-to-day costs, see our{" "}
            <TrackedLink
              href="/moving-guide/cost-of-living"
              event="footer_link_clicked"
              eventProps={{ label: "Cost of living", source: "areas_intro" }}
              className="font-semibold text-ocean transition hover:text-ocean-deep"
            >
              cost of living guide
            </TrackedLink>
            .
          </p>
        </div>
      </Section>

      <Section bg="bg-foam">
        {areas.length > 0 ? (
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
        ) : (
          <div className="mx-auto max-w-lg rounded-2xl border border-line bg-white px-6 py-12 text-center">
            <p className="text-base leading-relaxed text-muted">
              Neighbourhood guides are being prepared. Browse apartments, or tell us what
              you’re looking for and we’ll help you shortlist areas.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <TrackedLink
                href="/apartments"
                event="browse_apartments_clicked"
                eventProps={{ source: "areas_empty" }}
                className="inline-flex rounded-quieter bg-ocean px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-deep"
              >
                Browse apartments
              </TrackedLink>
              <TrackedLink
                href="/contact"
                event="contact_cta_clicked"
                eventProps={{ source: "areas_empty" }}
                className="inline-flex rounded-quieter border border-line px-5 py-2.5 text-sm font-semibold text-charcoal transition hover:bg-sand"
              >
                Get matched
              </TrackedLink>
            </div>
          </div>
        )}
      </Section>

      <Section bg="bg-white">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-semibold text-charcoal">
            Ready to look at homes?
          </h2>
          <p className="mt-3 text-muted">
            Browse verified apartments, or tell us your budget and we’ll shortlist options.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <TrackedLink
              href="/apartments"
              event="browse_apartments_clicked"
              eventProps={{ source: "areas_footer" }}
              className="inline-flex rounded-quieter bg-ocean px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-deep"
            >
              Browse apartments
            </TrackedLink>
            <TrackedLink
              href="/contact"
              event="contact_cta_clicked"
              eventProps={{ source: "areas_footer" }}
              className="inline-flex rounded-quieter border border-line px-5 py-2.5 text-sm font-semibold text-charcoal transition hover:bg-sand"
            >
              Get matched
            </TrackedLink>
          </div>
        </div>
      </Section>
    </div>
  );
}
