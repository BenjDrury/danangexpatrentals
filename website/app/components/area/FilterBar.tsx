"use client";

import { capture } from "@/lib/analytics";

export type UnitFilter = "all" | "studio" | "1br" | "2br" | "3br";
export type SortOption = "recommended" | "price_asc" | "price_desc" | "newest";

export type AreaListFilters = {
  unitType: UnitFilter;
  minPrice: number | null;
  maxPrice: number | null;
  furnishedOnly: boolean;
  minLeaseMonths: number | null;
  sort: SortOption;
};

const UNIT_OPTIONS: { value: UnitFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "studio", label: "Studio" },
  { value: "1br", label: "1 BR" },
  { value: "2br", label: "2 BR" },
  { value: "3br", label: "3 BR" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "price_asc", label: "Price: low → high" },
  { value: "price_desc", label: "Price: high → low" },
  { value: "newest", label: "Newest" },
];

type FilterBarProps = {
  filters: AreaListFilters;
  onChange: (f: AreaListFilters) => void;
  /** Currency for labels */
  currencyLabel?: string;
};

export function FilterBar({
  filters,
  onChange,
  currencyLabel = "USD",
}: FilterBarProps) {
  const update = (patch: Partial<AreaListFilters>) => {
    const next = { ...filters, ...patch };
    onChange(next);
    capture("apartment_filters_changed", {
      unit_type: next.unitType,
      min_price: next.minPrice,
      max_price: next.maxPrice,
      furnished_only: next.furnishedOnly,
      min_lease_months: next.minLeaseMonths,
      sort: next.sort,
      changed: Object.keys(patch).join(","),
    });
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-foam p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Unit type */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-muted">
            Unit type
          </label>
          <select
            value={filters.unitType}
            onChange={(e) => update({ unitType: e.target.value as UnitFilter })}
            className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-charcoal focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/15"
          >
            {UNIT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Min price */}
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
            className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-charcoal placeholder:text-muted focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/15"
          />
        </div>

        {/* Max price */}
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
            className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-charcoal placeholder:text-muted focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/15"
          />
        </div>

        {/* Sort */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-muted">
            Sort by
          </label>
          <select
            value={filters.sort}
            onChange={(e) => update({ sort: e.target.value as SortOption })}
            className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-charcoal focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/15"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters.furnishedOnly}
            onChange={(e) => update({ furnishedOnly: e.target.checked })}
            className="h-4 w-4 rounded border-line text-ocean focus:ring-ocean/30"
          />
          <span className="text-sm font-medium text-muted">Furnished only</span>
        </label>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted">Min. lease (months)</label>
          <input
            type="number"
            min={1}
            max={24}
            placeholder="Any"
            value={filters.minLeaseMonths ?? ""}
            onChange={(e) => {
              const v = e.target.value ? Number(e.target.value) : null;
              update({ minLeaseMonths: v });
            }}
            className="w-24 rounded-xl border border-line bg-white px-3 py-2 text-charcoal placeholder:text-muted focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/15"
          />
        </div>
      </div>
    </div>
  );
}
