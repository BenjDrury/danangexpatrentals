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
    <div className="space-y-6">
      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Filters
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Min price (USD)
            </label>
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
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Max price (USD)
            </label>
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
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Min sqm
            </label>
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
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Max sqm
            </label>
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
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium text-slate-700">Features:</label>
          <select
            value={selectedFeature}
            onChange={(e) => setSelectedFeature(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
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
            className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
          >
            Add filter
          </button>
          {filters.features.length > 0 && (
            <span className="flex flex-wrap gap-1.5">
              {filters.features.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                >
                  {f}
                  <button
                    type="button"
                    onClick={() => removeFeatureFilter(f)}
                    className="rounded-full p-0.5 hover:bg-slate-200"
                    aria-label={`Remove ${f}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </span>
          )}
        </div>
        <p className="mt-3 text-sm text-slate-500">
          Showing {filtered.length} of {apartments.length} apartments
        </p>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-slate-500">No apartments match the filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Area
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Price
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Sqm
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Features
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filtered.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-900">{apt.title}</span>
                      <span className="ml-2 text-xs text-slate-400">({apt.bedrooms} BR)</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {areaNames[apt.area_id] ?? apt.area_id}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                      ${apt.price}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600">
                      {apt.size_sqm != null ? `${apt.size_sqm} m²` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600">
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
