"use client";

import { capture } from "@/lib/analytics";
import type { PropertyType, UtilitiesIncluded } from "types";

export type UnitFilter = "all" | "studio" | "1br" | "2br" | "3br";
export type SortOption = "recommended" | "price_asc" | "price_desc" | "newest";
export type PropertyTypeFilter = "all" | PropertyType;
export type UtilitiesFilter = "all" | UtilitiesIncluded | "included_or_partial";

export type AreaListFilters = {
  unitType: UnitFilter;
  propertyType: PropertyTypeFilter;
  minPrice: number | null;
  maxPrice: number | null;
  furnishedOnly: boolean;
  /** Show listings whose required min lease is at most this many months (excludes unspecified). */
  maxLeaseMonths: number | null;
  /** Show listings whose deposit is at most this many months of rent (excludes unspecified). */
  maxDepositMonths: number | null;
  utilities: UtilitiesFilter;
  sort: SortOption;
};

export function createDefaultAreaListFilters(
  sort: SortOption = "recommended",
): AreaListFilters {
  return {
    unitType: "all",
    propertyType: "all",
    minPrice: null,
    maxPrice: null,
    furnishedOnly: false,
    maxLeaseMonths: null,
    maxDepositMonths: null,
    utilities: "all",
    sort,
  };
}

export function areaListFiltersAreActive(
  filters: AreaListFilters,
  defaults: AreaListFilters,
): boolean {
  return (
    filters.unitType !== defaults.unitType ||
    filters.propertyType !== defaults.propertyType ||
    filters.minPrice !== defaults.minPrice ||
    filters.maxPrice !== defaults.maxPrice ||
    filters.furnishedOnly !== defaults.furnishedOnly ||
    filters.maxLeaseMonths !== defaults.maxLeaseMonths ||
    filters.maxDepositMonths !== defaults.maxDepositMonths ||
    filters.utilities !== defaults.utilities ||
    filters.sort !== defaults.sort
  );
}

const UNIT_OPTIONS: { value: UnitFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "studio", label: "Studio" },
  { value: "1br", label: "1 BR" },
  { value: "2br", label: "2 BR" },
  { value: "3br", label: "3 BR" },
];

const PROPERTY_TYPE_OPTIONS: { value: PropertyTypeFilter; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "villa", label: "Villa" },
  { value: "serviced", label: "Serviced" },
];

const UTILITIES_OPTIONS: { value: UtilitiesFilter; label: string }[] = [
  { value: "all", label: "Any" },
  { value: "included_or_partial", label: "Included or partial" },
  { value: "included", label: "Fully included" },
  { value: "partial", label: "Partial" },
  { value: "not_included", label: "Not included" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "price_asc", label: "Price: low → high" },
  { value: "price_desc", label: "Price: high → low" },
  { value: "newest", label: "Newest" },
];

const selectClass =
  "w-full rounded-xl border border-line bg-white px-4 py-2.5 text-charcoal focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/15";
const inputClass =
  "w-full rounded-xl border border-line bg-white px-4 py-2.5 text-charcoal placeholder:text-muted focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/15";

type FilterBarProps = {
  filters: AreaListFilters;
  onChange: (f: AreaListFilters) => void;
  /** Currency for labels */
  currencyLabel?: string;
  /** When provided, shows Reset filters when current filters differ. */
  defaults?: AreaListFilters;
};

export function FilterBar({
  filters,
  onChange,
  currencyLabel = "USD",
  defaults,
}: FilterBarProps) {
  const update = (patch: Partial<AreaListFilters>) => {
    const next = { ...filters, ...patch };
    onChange(next);
    capture("apartment_filters_changed", {
      unit_type: next.unitType,
      property_type: next.propertyType,
      min_price: next.minPrice,
      max_price: next.maxPrice,
      furnished_only: next.furnishedOnly,
      max_lease_months: next.maxLeaseMonths,
      max_deposit_months: next.maxDepositMonths,
      utilities: next.utilities,
      sort: next.sort,
      changed: Object.keys(patch).join(","),
    });
  };

  const showReset = Boolean(defaults && areaListFiltersAreActive(filters, defaults));

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-foam p-4 sm:p-5">
      {showReset && defaults ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              onChange(defaults);
              capture("apartment_filters_reset");
            }}
            className="text-sm font-medium text-muted transition hover:text-ocean"
          >
            Reset filters
          </button>
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-muted">
            Bedrooms
          </label>
          <select
            value={filters.unitType}
            onChange={(e) => update({ unitType: e.target.value as UnitFilter })}
            className={selectClass}
          >
            {UNIT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-muted">
            Property type
          </label>
          <select
            value={filters.propertyType}
            onChange={(e) =>
              update({ propertyType: e.target.value as PropertyTypeFilter })
            }
            className={selectClass}
          >
            {PROPERTY_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-muted">
            Min price ({currencyLabel})
          </label>
          <input
            type="number"
            min={0}
            step={50}
            placeholder="e.g. 300"
            value={filters.minPrice ?? ""}
            onChange={(e) => {
              const v = e.target.value ? Number(e.target.value) : null;
              update({ minPrice: v });
            }}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-muted">
            Max price ({currencyLabel})
          </label>
          <input
            type="number"
            min={0}
            step={50}
            placeholder="e.g. 800"
            value={filters.maxPrice ?? ""}
            onChange={(e) => {
              const v = e.target.value ? Number(e.target.value) : null;
              update({ maxPrice: v });
            }}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-muted">
            Lease ≤ (months)
          </label>
          <input
            type="number"
            min={1}
            max={24}
            placeholder="Any"
            value={filters.maxLeaseMonths ?? ""}
            onChange={(e) => {
              const v = e.target.value ? Number(e.target.value) : null;
              update({ maxLeaseMonths: v });
            }}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-muted">
            Keep places that allow stays of this length or less
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-muted">
            Deposit ≤ (months)
          </label>
          <input
            type="number"
            min={0}
            max={12}
            step={0.5}
            placeholder="Any"
            value={filters.maxDepositMonths ?? ""}
            onChange={(e) => {
              const v = e.target.value ? Number(e.target.value) : null;
              update({ maxDepositMonths: v });
            }}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-muted">
            Utilities
          </label>
          <select
            value={filters.utilities}
            onChange={(e) =>
              update({ utilities: e.target.value as UtilitiesFilter })
            }
            className={selectClass}
          >
            {UTILITIES_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-muted">
            Sort by
          </label>
          <select
            value={filters.sort}
            onChange={(e) => update({ sort: e.target.value as SortOption })}
            className={selectClass}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-5">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters.furnishedOnly}
            onChange={(e) => update({ furnishedOnly: e.target.checked })}
            className="h-4 w-4 rounded border-line text-ocean focus:ring-ocean/30"
          />
          <span className="text-sm font-medium text-muted">Furnished only</span>
        </label>
      </div>
    </div>
  );
}
