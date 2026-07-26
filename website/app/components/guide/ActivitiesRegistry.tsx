"use client";

import { useMemo, useState } from "react";
import type { Activity } from "types";
import { ActivityCard } from "@/app/components/guide/RegistryCards";
import {
  ACTIVITY_FEATURE_ALLOWLIST,
  ACTIVITY_PRICE_OPTIONS,
  DEFAULT_ACTIVITY_FILTERS,
  activityFiltersActive,
  categoryLabel,
  collectAreaOptions,
  collectCategoryOptions,
  collectFeatureOptions,
  featureLabel,
  filterActivities,
  type ActivityFilters,
} from "@/lib/registry-filters";
import { capture } from "@/lib/analytics";

const selectClass =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-charcoal focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/15";

export function ActivitiesRegistry({ activities }: { activities: Activity[] }) {
  const [filters, setFilters] = useState<ActivityFilters>(DEFAULT_ACTIVITY_FILTERS);

  const areaOptions = useMemo(() => collectAreaOptions(activities), [activities]);
  const categoryOptions = useMemo(() => collectCategoryOptions(activities), [activities]);
  const featureOptions = useMemo(
    () => collectFeatureOptions(activities, ACTIVITY_FEATURE_ALLOWLIST, 8),
    [activities]
  );

  const filtered = useMemo(() => filterActivities(activities, filters), [activities, filters]);
  const active = activityFiltersActive(filters);

  const byCategory = useMemo(() => {
    const groups = filtered.reduce<Record<string, Activity[]>>((acc, a) => {
      const key = a.category || "general";
      (acc[key] ??= []).push(a);
      return acc;
    }, {});
    const cats = Object.keys(groups).sort();
    return { groups, cats };
  }, [filtered]);

  const update = (patch: Partial<ActivityFilters>) => {
    setFilters((prev) => {
      const next = { ...prev, ...patch };
      capture("activity_filters_changed", {
        changed: Object.keys(patch).join(","),
        category: next.category,
        area_id: next.areaId,
        price_band: next.priceBand,
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
      capture("activity_filters_changed", {
        changed: "features",
        features: next.features.join(","),
      });
      return next;
    });
  };

  const resetFilters = () => {
    setFilters(DEFAULT_ACTIVITY_FILTERS);
    capture("activity_filters_reset");
  };

  return (
    <div className="mt-10">
      <div className="rounded-2xl border border-line bg-white/70 p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="text-sm font-medium text-ocean">Filter activities</p>
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
            <label htmlFor="act-cost" className="mb-1.5 block text-sm font-medium text-muted">
              Cost
            </label>
            <select
              id="act-cost"
              value={filters.priceBand}
              onChange={(e) =>
                update({ priceBand: e.target.value as ActivityFilters["priceBand"] })
              }
              className={selectClass}
            >
              {ACTIVITY_PRICE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="act-category" className="mb-1.5 block text-sm font-medium text-muted">
              Category
            </label>
            <select
              id="act-category"
              value={filters.category}
              onChange={(e) => update({ category: e.target.value })}
              className={selectClass}
            >
              <option value="">Any category</option>
              {categoryOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="act-area" className="mb-1.5 block text-sm font-medium text-muted">
              Area
            </label>
            <select
              id="act-area"
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
          Showing {filtered.length} of {activities.length}
        </p>
      </div>

      {filtered.length > 0 ? (
        <div className="mt-8 space-y-12">
          {byCategory.cats.map((cat) => (
            <div key={cat}>
              <h2 className="font-display text-xl font-semibold text-charcoal">
                {categoryLabel(cat)}
              </h2>
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                {byCategory.groups[cat].map((activity) => (
                  <ActivityCard key={activity.id} activity={activity} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-line bg-white px-6 py-10">
          <p className="text-muted">
            No activities match these filters. Try a wider cost band or category, or{" "}
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
