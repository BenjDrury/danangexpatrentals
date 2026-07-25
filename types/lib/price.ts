/**
 * Listing price conversion + dual-currency display.
 * Rate: prefer FX_USD_VND env, else app_settings.usd_vnd_rate, else DEFAULT.
 */

export type PriceCurrency = "USD" | "VND";

export const DEFAULT_USD_VND_RATE = 25400;

export type ConvertedPrice = {
  usd: number;
  vnd: number;
  displayBoth: string;
  /** Synced into apartments.price_display for compatibility. */
  price_display: string;
};

export function resolveUsdVndRate(opts?: {
  env?: string | number | null;
  settings?: number | null;
}): number {
  const fromEnv = Number(opts?.env ?? (typeof process !== "undefined" ? process.env.FX_USD_VND : undefined));
  if (Number.isFinite(fromEnv) && fromEnv > 0) return fromEnv;
  const fromSettings = opts?.settings != null ? Number(opts.settings) : NaN;
  if (Number.isFinite(fromSettings) && fromSettings > 0) return fromSettings;
  return DEFAULT_USD_VND_RATE;
}

export function convertPrice(
  amount: number,
  from: PriceCurrency,
  rate: number = DEFAULT_USD_VND_RATE
): ConvertedPrice {
  const r = rate > 0 ? rate : DEFAULT_USD_VND_RATE;
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be a positive number");
  }
  let usd: number;
  let vnd: number;
  if (from === "USD") {
    usd = Math.round(amount);
    vnd = Math.round(amount * r);
  } else {
    vnd = Math.round(amount);
    usd = Math.max(1, Math.round(amount / r));
  }
  const displayBoth = formatPriceBoth(usd, vnd);
  return { usd, vnd, displayBoth, price_display: displayBoth };
}

export function formatUsd(amount: number): string {
  return `$${Math.round(amount).toLocaleString("en-US")}`;
}

/** Vietnamese grouping with ₫ suffix, e.g. 20.320.000₫ */
export function formatVnd(amount: number): string {
  return `${Math.round(amount).toLocaleString("vi-VN")}₫`;
}

export function formatPriceBoth(usd: number, vnd: number): string {
  return `${formatUsd(usd)} · ${formatVnd(vnd)}`;
}

/** Shape needed to render a listing price in view mode. */
export type ListingPriceFields = {
  price?: number | null;
  price_display?: string | null;
  price_usd?: number | null;
  price_vnd?: number | null;
  price_amount?: number | null;
  price_currency?: PriceCurrency | string | null;
};

/**
 * Dual-currency label for cards/detail. Falls back to price_display or USD-only.
 */
export function listingPriceLabel(
  apt: ListingPriceFields,
  opts?: { rate?: number }
): string {
  const usd =
    apt.price_usd != null && Number.isFinite(Number(apt.price_usd))
      ? Number(apt.price_usd)
      : apt.price != null && Number.isFinite(Number(apt.price))
        ? Number(apt.price)
        : null;
  let vnd =
    apt.price_vnd != null && Number.isFinite(Number(apt.price_vnd))
      ? Number(apt.price_vnd)
      : null;
  if (vnd == null && usd != null && opts?.rate && opts.rate > 0) {
    vnd = Math.round(usd * opts.rate);
  }
  if (usd != null && vnd != null) return formatPriceBoth(usd, vnd);
  if (apt.price_display?.trim()) return apt.price_display.trim();
  if (usd != null) return formatUsd(usd);
  return "Price on request";
}
