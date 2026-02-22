import type { Area } from "types";
import { Section } from "@/app/components/sections";
import { formatAreaPriceDisplay, formatRentRange, RENT_UNIT_TYPES } from "@/lib/area-utils";
import { RangeBar } from "./RangeBar";

type AreaRentSnapshotProps = { area: Area };

export function AreaRentSnapshot({ area }: AreaRentSnapshotProps) {
  const ranges = RENT_UNIT_TYPES.map(({ key, label }) => ({
    key,
    label,
    range: formatRentRange(area, key),
  })).filter((r) => r.range != null);

  if (ranges.length === 0) return null;

  const scaleMax = Math.max(
    ...ranges.map((r) => (r.range ? Math.max(r.range.min, r.range.max) : 0))
  );

  const budgetLine = formatAreaPriceDisplay(area);
  const hasSnapshot = area.snapshot_date != null && String(area.snapshot_date).trim() !== "";

  return (
    <Section bg="bg-slate-50">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        What rent looks like in {area.name}
      </h2>
      {budgetLine && (
        <p className="mt-2 text-slate-600">
          Typical budget: {budgetLine}. Ranges below are based on local listings (USD).
        </p>
      )}
      <div className="mt-8 space-y-6">
        {ranges.map(({ key, label, range }) =>
          range ? (
            <RangeBar
              key={key}
              label={label}
              min={range.min}
              max={range.max}
              currency={range.currency}
              scaleMax={scaleMax}
            />
          ) : null
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-1 text-xs text-slate-500">
        {area.fx_usd_vnd != null && area.fx_usd_vnd > 0 && (
          <span>Reference rate: 1 USD ≈ {Math.round(area.fx_usd_vnd).toLocaleString()} ₫</span>
        )}
        {hasSnapshot && (
          <span>
            Rent data as of{" "}
            {new Date(area.snapshot_date!).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        )}
      </div>
    </Section>
  );
}
