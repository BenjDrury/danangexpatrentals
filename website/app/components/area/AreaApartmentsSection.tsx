"use client";

import Link from "next/link";
import type { Apartment } from "types";
import { useMemo, useState } from "react";
import { CONTENT_CONTAINER } from "@/app/lib/constants";
import { ApartmentCard } from "./ApartmentCard";
import { FilterBar, type AreaListFilters } from "./FilterBar";
import { useAreaApartments } from "@/app/hooks/useAreaApartments";

const DEFAULT_FILTERS: AreaListFilters = {
  unitType: "all",
  minPrice: null,
  maxPrice: null,
  furnishedOnly: false,
  minLeaseMonths: null,
  sort: "recommended",
};

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
  const filtersApplied = hasAnyListings && filtered.length === 0;

  return (
    <section className="w-full py-16 sm:py-24 bg-slate-50">
      <div className={CONTENT_CONTAINER}>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Apartments in {areaName}
        </h2>
        <p className="mt-2 text-slate-600">Filter by size, budget, and lease length.</p>
        <div className="mt-6">
          <FilterBar
            filters={filters}
            onChange={setFilters}
            currencyLabel="USD"
          />
        </div>
        {filtered.length > 0 ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-10 text-center">
            {noListingsAtAll ? (
              <>
                <p className="text-slate-600">
                  No listings in {areaName} right now. Tell us your budget and dates — we&apos;ll find options in 24 hours.
                </p>
                <Link
                  href={contactHrefBase}
                  className="mt-6 inline-flex rounded-xl bg-teal-500 px-6 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-teal-600"
                >
                  Get apartment matches
                </Link>
              </>
            ) : (
              <>
                <p className="text-slate-600">
                  No apartments match your filters. Try adjusting filters or ask us to find something for you.
                </p>
                <Link
                  href={contactHrefBase}
                  className="mt-6 inline-flex rounded-xl bg-teal-500 px-6 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-teal-600"
                >
                  Get apartment matches
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
