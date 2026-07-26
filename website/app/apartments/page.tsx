import type { Metadata } from "next";
import { Section, SectionHero } from "../components/sections";
import { TrackedLink } from "../components/TrackedLink";
import { CONTENT_CONTAINER, SECTION_PADDING } from "../lib/constants";
import { getAreas, getApartmentTypes, getApartments } from "@/lib/data";
import { buildPageMetadata } from "@/lib/seo";
import { ApartmentsBrowse } from "./ApartmentsBrowse";

/** Revalidate listing pages so soft nav can hit a warm cache. */
export const revalidate = 60;

export const metadata: Metadata = buildPageMetadata({
  title: "Verified apartments in Da Nang",
  description:
    "Curated, verified apartments in Da Nang for expats and remote workers. Transparent prices, real photos, honest neighbourhood guidance.",
  path: "/apartments",
});

export default async function ApartmentsPage() {
  const [apartments, apartmentTypes, areas] = await Promise.all([
    getApartments(),
    getApartmentTypes(),
    getAreas(),
  ]);

  return (
    <div className="min-h-screen bg-foam">
      <SectionHero
        variant="page"
        title="Apartments in Da Nang"
        subtitle="Verified homes with real photos and clear prices — for a few months or a longer stay."
        primaryCta={{ href: "/contact", label: "Get help finding one" }}
        secondaryCta={{ href: "/areas", label: "See neighbourhoods" }}
      />

      <section className={`w-full ${SECTION_PADDING} bg-white`}>
        <div className={CONTENT_CONTAINER}>
          <ApartmentsBrowse apartments={apartments} areas={areas} />
        </div>
      </section>

      <Section bg="bg-sand/40">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-charcoal sm:text-4xl">
          What we help you find
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {apartmentTypes.map((card) => (
            <div key={card.id} className="border-t border-line pt-6">
              <h3 className="font-display text-xl font-semibold text-charcoal">{card.title}</h3>
              <p className="mt-3 text-muted leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
        <TrackedLink
          href="/contact"
          event="contact_cta_clicked"
          eventProps={{ source: "apartments_types" }}
          className="mt-12 inline-flex text-sm font-semibold text-ocean transition hover:text-ocean-deep"
        >
          Tell us your budget — get matched →
        </TrackedLink>
      </Section>

      <Section bg="bg-foam">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-charcoal sm:text-3xl">
          Useful next steps
        </h2>
        <ul className="mt-8 divide-y divide-line border-y border-line max-w-2xl">
          <li>
            <TrackedLink
              href="/areas"
              event="footer_link_clicked"
              eventProps={{ label: "Neighbourhoods", source: "apartments_related" }}
              className="flex justify-between gap-4 py-5 text-base font-semibold text-charcoal transition hover:text-ocean"
            >
              Neighbourhood guides
              <span aria-hidden>→</span>
            </TrackedLink>
          </li>
          <li>
            <TrackedLink
              href="/moving-guide/cost-of-living"
              event="footer_link_clicked"
              eventProps={{ label: "Cost of living", source: "apartments_related" }}
              className="flex justify-between gap-4 py-5 text-base font-semibold text-charcoal transition hover:text-ocean"
            >
              Cost of living in Da Nang
              <span aria-hidden>→</span>
            </TrackedLink>
          </li>
          <li>
            <TrackedLink
              href="/avoid-scams"
              event="footer_link_clicked"
              eventProps={{ label: "Avoid scams", source: "apartments_related" }}
              className="flex justify-between gap-4 py-5 text-base font-semibold text-charcoal transition hover:text-ocean"
            >
              How to avoid rental scams
              <span aria-hidden>→</span>
            </TrackedLink>
          </li>
        </ul>
      </Section>
    </div>
  );
}
