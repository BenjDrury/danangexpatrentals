"use client";

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
    onChange({ ...filters, ...patch });
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Unit type */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Unit type
          </label>
          <select
            value={filters.unitType}
            onChange={(e) => update({ unitType: e.target.value as UnitFilter })}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
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
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
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
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        {/* Max price */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
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
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        {/* Sort */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Sort by
          </label>
          <select
            value={filters.sort}
            onChange={(e) => update({ sort: e.target.value as SortOption })}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
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
            className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
          />
          <span className="text-sm font-medium text-slate-700">Furnished only</span>
        </label>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">Min. lease (months)</label>
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
            className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
      </div>
    </div>
  );
}
