"use client";

import { useMemo, useState } from "react";
import type { Apartment } from "types";

type AreaMap = Record<string, string>;

type Filters = {
  minPrice: number | null;
  maxPrice: number | null;
  minSqm: number | null;
  maxSqm: number | null;
  features: string[];
};

type ApartmentsListProps = {
  apartments: Apartment[];
  areaNames: AreaMap;
  /** All unique feature values across apartments (for filter dropdown) */
  allFeatures: string[];
};

function matchesFilters(apt: Apartment, filters: Filters): boolean {
  if (filters.minPrice != null && apt.price < filters.minPrice) return false;
  if (filters.maxPrice != null && apt.price > filters.maxPrice) return false;
  if (filters.minSqm != null && (apt.size_sqm == null || apt.size_sqm < filters.minSqm))
    return false;
  if (filters.maxSqm != null && (apt.size_sqm == null || apt.size_sqm > filters.maxSqm))
    return false;
  if (filters.features.length > 0) {
    const aptFeatures = apt.features.map((f) => f.toLowerCase());
    const required = filters.features.map((f) => f.toLowerCase());
    const hasAll = required.every((r) => aptFeatures.some((a) => a === r || a.includes(r)));
    if (!hasAll) return false;
  }
  return true;
}

export function ApartmentsList({
  apartments,
  areaNames,
  allFeatures,
}: ApartmentsListProps) {
  const [filters, setFilters] = useState<Filters>({
    minPrice: null,
    maxPrice: null,
    minSqm: null,
    maxSqm: null,
    features: [],
  });

  const [selectedFeature, setSelectedFeature] = useState<string>("");

  const filtered = useMemo(
    () => apartments.filter((apt) => matchesFilters(apt, filters)),
    [apartments, filters]
  );

  const addFeatureFilter = () => {
    if (!selectedFeature || filters.features.includes(selectedFeature)) return;
    setFilters((f) => ({ ...f, features: [...f.features, selectedFeature] }));
    setSelectedFeature("");
  };

  const removeFeatureFilter = (feature: string) => {
    setFilters((f) => ({
      ...f,
      features: f.features.filter((x) => x !== feature),
    }));
  };

  return (
    <div className="mt-8 space-y-8">
      <div className="surface p-5 sm:p-6">
        <h2 className="mb-4 font-display text-sm font-semibold tracking-wide text-muted">
          Filters
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="field-label">Min price (USD)</label>
            <input
              type="number"
              min={0}
              step={50}
              placeholder="Any"
              value={filters.minPrice ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  minPrice: e.target.value ? Number(e.target.value) : null,
                }))
              }
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">Max price (USD)</label>
            <input
              type="number"
              min={0}
              step={50}
              placeholder="Any"
              value={filters.maxPrice ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  maxPrice: e.target.value ? Number(e.target.value) : null,
                }))
              }
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">Min sqm</label>
            <input
              type="number"
              min={0}
              step={5}
              placeholder="Any"
              value={filters.minSqm ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  minSqm: e.target.value ? Number(e.target.value) : null,
                }))
              }
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">Max sqm</label>
            <input
              type="number"
              min={0}
              step={5}
              placeholder="Any"
              value={filters.maxSqm ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  maxSqm: e.target.value ? Number(e.target.value) : null,
                }))
              }
              className="field-input"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium text-charcoal">Features:</label>
          <select
            value={selectedFeature}
            onChange={(e) => setSelectedFeature(e.target.value)}
            className="field-select"
          >
            <option value="">Select feature</option>
            {allFeatures.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={addFeatureFilter}
            disabled={!selectedFeature}
            className="btn-primary px-3 py-2"
          >
            Add filter
          </button>
          {filters.features.length > 0 && (
            <span className="flex flex-wrap gap-1.5">
              {filters.features.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1 rounded-quieter bg-sand px-2.5 py-1 text-xs font-medium text-charcoal"
                >
                  {f}
                  <button
                    type="button"
                    onClick={() => removeFeatureFilter(f)}
                    className="rounded-quieter p-0.5 text-muted transition hover:bg-sand-deep hover:text-charcoal"
                    aria-label={`Remove ${f}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </span>
          )}
        </div>
        <p className="mt-3 text-sm text-muted">
          Showing {filtered.length} of {apartments.length} apartments
        </p>
      </div>

      <div className="surface overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-muted">No apartments match the filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line/80">
              <thead className="bg-sand/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                    Area
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                    Price
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                    Sqm
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                    Features
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {filtered.map((apt) => (
                  <tr key={apt.id} className="transition hover:bg-sand/30">
                    <td className="px-4 py-3">
                      <span className="font-medium text-charcoal">{apt.title}</span>
                      <span className="ml-2 text-xs text-muted">({apt.bedrooms} BR)</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted">
                      {areaNames[apt.area_id] ?? apt.area_id}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-charcoal">
                      ${apt.price}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-muted">
                      {apt.size_sqm != null ? `${apt.size_sqm} m²` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted">
                        {apt.features.length > 0 ? apt.features.join(", ") : "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
