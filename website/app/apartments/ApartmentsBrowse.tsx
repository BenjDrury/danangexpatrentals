"use client";

import { useMemo, useState } from "react";
import type { Apartment } from "types";
import { TrackedLink } from "@/app/components/TrackedLink";
import { ApartmentCard } from "@/app/components/area/ApartmentCard";
import {
  FilterBar,
  createDefaultAreaListFilters,
  type AreaListFilters,
} from "@/app/components/area/FilterBar";
import { useAreaApartments } from "@/app/hooks/useAreaApartments";
import { areaDisplayName } from "@/lib/area-utils";
import type { Area } from "types";
import { capture } from "@/lib/analytics";

const DEFAULT_FILTERS: AreaListFilters = createDefaultAreaListFilters("newest");

const PER_PAGE = 9;

type Props = {
  apartments: Apartment[];
  areas: Area[];
};

export function ApartmentsBrowse({ apartments, areas }: Props) {
  const [filters, setFilters] = useState<AreaListFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const filtered = useAreaApartments(apartments, filters);
  const areaById = useMemo(
    () => new Map(areas.map((a) => [a.id, a])),
    [areas]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * PER_PAGE,
    safePage * PER_PAGE
  );

  function onFiltersChange(next: AreaListFilters) {
    setFilters(next);
    setPage(1);
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
    capture("apartment_filters_reset", { source: "apartments_empty_state" });
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-charcoal">
            Available now
          </h2>
          <p className="mt-2 text-muted">
            {apartments.length === 0
              ? "New homes are added carefully — request a match while we expand the list."
              : filtered.length === apartments.length
                ? `${filtered.length} verified listing${filtered.length === 1 ? "" : "s"}`
                : `${filtered.length} of ${apartments.length} listing${apartments.length === 1 ? "" : "s"} match`}
          </p>
        </div>
      </div>

      {apartments.length > 0 ? (
        <div className="mt-8">
          <FilterBar
            filters={filters}
            onChange={onFiltersChange}
            defaults={DEFAULT_FILTERS}
            currencyLabel="USD"
          />
        </div>
      ) : null}

      {pageItems.length > 0 ? (
        <>
          <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((apt) => {
              const area = areaById.get(apt.area_id);
              const areaName = area ? areaDisplayName(area) : "Da Nang";
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
          {totalPages > 1 && (
            <nav
              className="mt-14 flex flex-wrap items-center justify-center gap-3"
              aria-label="Pagination"
            >
              {safePage > 1 && (
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-quieter border border-line px-4 py-2.5 text-sm font-medium text-charcoal transition hover:bg-sand"
                >
                  ← Previous
                </button>
              )}
              <span className="px-4 py-2.5 text-sm text-muted">
                Page {safePage} of {totalPages}
              </span>
              {safePage < totalPages && (
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-quieter border border-line px-4 py-2.5 text-sm font-medium text-charcoal transition hover:bg-sand"
                >
                  Next →
                </button>
              )}
            </nav>
          )}
        </>
      ) : apartments.length > 0 ? (
        <div className="mt-12 rounded-2xl border border-line bg-foam/60 px-6 py-14 text-center">
          <p className="mx-auto max-w-lg text-lg text-muted">
            No apartments match your filters. Try adjusting them, or ask us to
            find something.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex rounded-quieter border border-line bg-white px-6 py-3.5 text-base font-semibold text-charcoal transition hover:bg-sand"
            >
              Reset filters
            </button>
            <TrackedLink
              href="/contact"
              event="contact_cta_clicked"
              eventProps={{ source: "apartments_filters_empty" }}
              className="inline-flex rounded-quieter bg-ocean px-6 py-3.5 text-base font-semibold text-white transition hover:bg-ocean-deep"
            >
              Get matched
            </TrackedLink>
          </div>
        </div>
      ) : (
        <div className="mt-12 rounded-2xl border border-line bg-foam/60 px-6 py-14 text-center">
          <p className="mx-auto max-w-lg text-lg text-muted">
            No public listings yet. Tell us your budget and dates — we’ll send
            verified options within 24 hours.
          </p>
          <TrackedLink
            href="/contact"
            event="contact_cta_clicked"
            eventProps={{ source: "apartments_empty" }}
            className="mt-8 inline-flex rounded-quieter bg-ocean px-6 py-3.5 text-base font-semibold text-white transition hover:bg-ocean-deep"
          >
            Get matched
          </TrackedLink>
        </div>
      )}
    </>
  );
}
