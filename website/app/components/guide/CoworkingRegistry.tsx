"use client";

import { useMemo, useState } from "react";
import type { CoworkingSpace } from "types";
import { CoworkingCard } from "@/app/components/guide/RegistryCards";
import {
  COWORKING_FEATURE_ALLOWLIST,
  COWORKING_PRICE_OPTIONS,
  DEFAULT_COWORKING_FILTERS,
  PASS_TYPE_OPTIONS,
  collectAreaOptions,
  collectFeatureOptions,
  coworkingFiltersActive,
  featureLabel,
  filterCoworkingSpaces,
  type CoworkingFilters,
} from "@/lib/registry-filters";
import { capture } from "@/lib/analytics";

const selectClass =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-charcoal focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/15";

export function CoworkingRegistry({
  spaces,
  areaHrefById = {},
}: {
  spaces: CoworkingSpace[];
  areaHrefById?: Record<string, string>;
}) {
  const [filters, setFilters] = useState<CoworkingFilters>(DEFAULT_COWORKING_FILTERS);

  const areaOptions = useMemo(() => collectAreaOptions(spaces), [spaces]);
  const featureOptions = useMemo(
    () => collectFeatureOptions(spaces, COWORKING_FEATURE_ALLOWLIST, 8),
    [spaces]
  );

  const filtered = useMemo(() => filterCoworkingSpaces(spaces, filters), [spaces, filters]);
  const active = coworkingFiltersActive(filters);

  const update = (patch: Partial<CoworkingFilters>) => {
    setFilters((prev) => {
      const next = { ...prev, ...patch };
      capture("coworking_filters_changed", {
        changed: Object.keys(patch).join(","),
        area_id: next.areaId,
        price_band: next.priceBand,
        pass_type: next.passType,
      });
      return next;
    });
  };

  const toggleFeature = (tag: string) => {
    setFilters((prev) => {
      const next = {
        ...prev,
        features: prev.features.includes(tag)
          ? prev.features.filter((t) => t !== tag)
          : [...prev.features, tag],
      };
      capture("coworking_filters_changed", {
        changed: "features",
        features: next.features.join(","),
      });
      return next;
    });
  };

  const resetFilters = () => {
    setFilters(DEFAULT_COWORKING_FILTERS);
    capture("coworking_filters_reset");
  };

  return (
    <div className="mt-10">
      <div className="rounded-2xl border border-line bg-white/70 p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="text-sm font-medium text-ocean">Filter spaces</p>
          {active && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm font-medium text-muted transition hover:text-ocean"
            >
              Reset filters
            </button>
          )}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="cw-cost" className="mb-1.5 block text-sm font-medium text-muted">
              Cost
            </label>
            <select
              id="cw-cost"
              value={filters.priceBand}
              onChange={(e) =>
                update({ priceBand: e.target.value as CoworkingFilters["priceBand"] })
              }
              className={selectClass}
            >
              {COWORKING_PRICE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="cw-area" className="mb-1.5 block text-sm font-medium text-muted">
              Area
            </label>
            <select
              id="cw-area"
              value={filters.areaId}
              onChange={(e) => update({ areaId: e.target.value })}
              className={selectClass}
            >
              <option value="">Any area</option>
              {areaOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="cw-pass" className="mb-1.5 block text-sm font-medium text-muted">
              Pass type
            </label>
            <select
              id="cw-pass"
              value={filters.passType}
              onChange={(e) =>
                update({ passType: e.target.value as CoworkingFilters["passType"] })
              }
              className={selectClass}
            >
              {PASS_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {featureOptions.length > 0 && (
          <fieldset className="mt-5">
            <legend className="text-sm font-medium text-muted">Features</legend>
            <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-2">
              {featureOptions.map((tag) => (
                <label key={tag} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.features.includes(tag)}
                    onChange={() => toggleFeature(tag)}
                    className="h-4 w-4 rounded border-line text-ocean focus:ring-ocean/30"
                  />
                  <span className="text-sm text-charcoal">{featureLabel(tag)}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <p className="mt-4 text-sm text-muted">
          Showing {filtered.length} of {spaces.length}
        </p>
      </div>

      {filtered.length > 0 ? (
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {filtered.map((spot) => (
            <CoworkingCard
              key={spot.id}
              spot={spot}
              areaHref={spot.area_id ? areaHrefById[spot.area_id] : null}
            />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-line bg-white px-6 py-10">
          <p className="text-muted">
            No spaces match these filters. Try a wider cost band, or{" "}
            <button
              type="button"
              onClick={resetFilters}
              className="font-medium text-ocean transition hover:text-ocean-deep"
            >
              reset filters
            </button>
            .
          </p>
        </div>
      )}
    </div>
  );
}
