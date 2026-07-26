import type { Area } from "types";
import { Section } from "@/app/components/sections";
import { areaDisplayName, formatAreaPriceDisplay, formatRentRange, RENT_UNIT_TYPES } from "@/lib/area-utils";
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
    <Section bg="bg-sand/50">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-ocean">Rent snapshot</p>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-charcoal sm:text-4xl">
          What rent looks like in {areaDisplayName(area)}
        </h2>
        {budgetLine && (
          <p className="mt-4 text-lg leading-relaxed text-muted">
            Typical budget: {budgetLine}. Ranges below are based on local listings (USD).
          </p>
        )}
      </div>

      <div className="mt-10 rounded-2xl border border-line bg-white p-6 shadow-[0_6px_24px_rgba(42,42,40,0.03)] sm:p-8">
        <div className="space-y-6">
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
        <div className="mt-6 flex flex-wrap items-baseline gap-x-6 gap-y-1 border-t border-line pt-4 text-xs text-muted">
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
      </div>
    </Section>
  );
}
