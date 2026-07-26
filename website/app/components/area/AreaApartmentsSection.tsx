"use client";

import Link from "next/link";
import type { Apartment } from "types";
import { useMemo, useState } from "react";
import { Section } from "@/app/components/sections";
import { CtaButton } from "@/app/components/CtaButton";
import { ApartmentCard } from "./ApartmentCard";
import {
  FilterBar,
  createDefaultAreaListFilters,
  type AreaListFilters,
} from "./FilterBar";
import { useAreaApartments } from "@/app/hooks/useAreaApartments";
import { capture } from "@/lib/analytics";

const DEFAULT_FILTERS: AreaListFilters = createDefaultAreaListFilters("recommended");

type AreaApartmentsSectionProps = {
  areaId: string;
  areaName: string;
  apartments: Apartment[];
};

function buildContactHref(
  areaId: string,
  areaName: string,
  apartmentId?: string
): string {
  const params = new URLSearchParams();
  params.set("areaId", areaId);
  params.set("preferred_area", areaName);
  if (apartmentId) params.set("apartmentId", apartmentId);
  return `/contact?${params.toString()}`;
}

export function AreaApartmentsSection({
  areaId,
  areaName,
  apartments,
}: AreaApartmentsSectionProps) {
  const [filters, setFilters] = useState<AreaListFilters>(DEFAULT_FILTERS);
  const filtered = useAreaApartments(apartments, filters);
  const contactHrefBase = useMemo(
    () => buildContactHref(areaId, areaName),
    [areaId, areaName]
  );

  const hasAnyListings = apartments.length > 0;
  const noListingsAtAll = !hasAnyListings;
  const filtersActive = hasAnyListings && filtered.length === 0;

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    capture("apartment_filters_reset", { source: "area_empty_state" });
  }

  return (
    <Section id="listings" bg="bg-white" className="!py-12 sm:!py-16 scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ocean">Listings</p>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-charcoal sm:text-3xl">
            Apartments in {areaName}
          </h2>
        </div>
        {hasAnyListings && (
          <Link
            href="/apartments"
            onClick={() =>
              capture("browse_apartments_clicked", {
                source: "area_section",
                area_id: areaId,
              })
            }
            className="text-sm font-semibold text-ocean transition hover:text-ocean-deep"
          >
            Browse all →
          </Link>
        )}
      </div>

      {hasAnyListings && (
        <div className="mt-6">
          <FilterBar
            filters={filters}
            onChange={setFilters}
            defaults={DEFAULT_FILTERS}
            currencyLabel="USD"
          />
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((apt) => (
            <ApartmentCard
              key={apt.id}
              apartment={apt}
              areaName={areaName}
              contactHref={buildContactHref(areaId, areaName, apt.id)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-line bg-foam/60 px-6 py-10 text-center sm:text-left">
          <p className="max-w-md text-base leading-relaxed text-muted">
            {noListingsAtAll
              ? `No listings in ${areaName} right now. Tell us your budget and dates — we’ll find options in 24 hours.`
              : "No apartments match your filters. Try adjusting them, or ask us to find something."}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            {filtersActive ? (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex rounded-quieter border border-line bg-white px-5 py-2.5 text-sm font-semibold text-charcoal transition hover:bg-sand"
              >
                Reset filters
              </button>
            ) : null}
            <CtaButton href={contactHrefBase} variant="primary">
              Get apartment matches
            </CtaButton>
          </div>
        </div>
      )}
    </Section>
  );
}
