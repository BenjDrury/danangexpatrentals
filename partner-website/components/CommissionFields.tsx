"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";

const inputClass =
  "mt-1.5 block w-full rounded-quieter border border-line bg-foam/70 px-3.5 py-2.5 text-charcoal outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20";

type Props = {
  usd?: number | null;
  pct?: number | null;
  notes?: string | null;
  /** Compact layout for nested deal rows. */
  compact?: boolean;
};

function formatDefault(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(Number(n))) return "";
  const v = Number(n);
  return Number.isInteger(v) ? String(v) : String(v);
}

export function CommissionFields({ usd, pct, notes, compact }: Props) {
  const { t } = useLocale();

  return (
    <div className={compact ? "grid gap-3 sm:grid-cols-2" : "grid gap-4 sm:grid-cols-2"}>
      <label className="block text-sm">
        <span className="font-medium text-charcoal">{t("commission.usd")}</span>
        <input
          name="commission_usd"
          type="number"
          min={0}
          step="any"
          inputMode="decimal"
          defaultValue={formatDefault(usd)}
          className={inputClass}
          placeholder={t("commission.usdPlaceholder")}
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-charcoal">{t("commission.pct")}</span>
        <input
          name="commission_pct"
          type="number"
          min={0}
          max={100}
          step="any"
          inputMode="decimal"
          defaultValue={formatDefault(pct)}
          className={inputClass}
          placeholder={t("commission.pctPlaceholder")}
        />
      </label>
      <label className="block text-sm sm:col-span-2">
        <span className="font-medium text-charcoal">{t("commission.note")}</span>
        <input
          name="commission_note"
          defaultValue={notes ?? ""}
          className={inputClass}
          placeholder={t("commission.notePlaceholder")}
        />
      </label>
    </div>
  );
}
