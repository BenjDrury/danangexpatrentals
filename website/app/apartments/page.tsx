import type { Metadata } from "next";
import Link from "next/link";
import { Section, SectionHero } from "../components/sections";
import { CONTENT_CONTAINER, SECTION_PADDING } from "../lib/constants";
import { getAreas, getApartmentTypes, getApartmentsPaginated } from "@/lib/data";
import { ApartmentCard } from "../components/area/ApartmentCard";

export const metadata: Metadata = {
  title: "Apartments in Da Nang — Verified homes for expats",
  description:
    "Curated, verified apartments in Da Nang for expats and remote workers. Transparent prices, real photos, honest neighbourhood guidance.",
};

/** Revalidate listing pages so soft nav can hit a warm cache. */
export const revalidate = 60;

const PER_PAGE = 9;

type Props = { searchParams: Promise<{ page?: string }> };

export default async function ApartmentsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(String(params?.page ?? "1"), 10) || 1);

  const [paginated, apartmentTypes, areas] = await Promise.all([
    getApartmentsPaginated(page, PER_PAGE),
    getApartmentTypes(),
    getAreas(),
  ]);

  const areaById = new Map(areas.map((a) => [a.id, a]));

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
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-charcoal">
                Available now
              </h2>
              <p className="mt-2 text-muted">
                {paginated.total === 0
                  ? "New homes are added carefully — request a match while we expand the list."
                  : `${paginated.total} verified listing${paginated.total === 1 ? "" : "s"} · newest first`}
              </p>
            </div>
          </div>

          {paginated.apartments.length > 0 ? (
            <>
              <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                {paginated.apartments.map((apt) => {
                  const area = areaById.get(apt.area_id);
                  const areaName = area?.name ?? "Da Nang";
                  const contactHref = `/contact?${new URLSearchParams({
                    areaId: apt.area_id,
                    preferred_area: areaName,
                    apartmentId: apt.id,
                  }).toString()}`;
                  return (
                    <ApartmentCard
                      key={apt.id}
                      apartment={apt}
                      areaName={areaName}
                      contactHref={contactHref}
                    />
                  );
                })}
              </div>
              {paginated.totalPages > 1 && (
                <nav
                  className="mt-14 flex flex-wrap items-center justify-center gap-3"
                  aria-label="Pagination"
                >
                  {page > 1 && (
                    <Link
                      href={page === 2 ? "/apartments" : `/apartments?page=${page - 1}`}
                      className="rounded-quieter border border-line px-4 py-2.5 text-sm font-medium text-charcoal transition hover:bg-sand"
                    >
                      ← Previous
                    </Link>
                  )}
                  <span className="px-4 py-2.5 text-sm text-muted">
                    Page {page} of {paginated.totalPages}
                  </span>
                  {page < paginated.totalPages && (
                    <Link
                      href={`/apartments?page=${page + 1}`}
                      className="rounded-quieter border border-line px-4 py-2.5 text-sm font-medium text-charcoal transition hover:bg-sand"
                    >
                      Next →
                    </Link>
                  )}
                </nav>
              )}
            </>
          ) : (
            <div className="mt-12 border-y border-line py-14 text-center">
              <p className="mx-auto max-w-lg text-lg text-muted">
                No public listings yet. Tell us your budget and dates — we’ll send
                verified options within 24 hours.
              </p>
              <Link
                href="/contact"
                className="mt-8 inline-flex rounded-quieter bg-ocean px-6 py-3.5 text-base font-semibold text-white transition hover:bg-ocean-deep"
              >
                Get matched
              </Link>
            </div>
          )}
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
        <Link
          href="/contact"
          className="mt-12 inline-flex text-sm font-semibold text-ocean transition hover:text-ocean-deep"
        >
          Tell us your budget — get matched →
        </Link>
      </Section>
    </div>
  );
}
