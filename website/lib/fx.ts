import {
  DEFAULT_USD_VND_RATE,
  resolveUsdVndRate,
} from "types";

/** Public-site FX rate (env first; optional settingsRate from app_settings). */
export function getPublicUsdVndRate(settingsRate?: number | null): number {
  return resolveUsdVndRate({
    env: process.env.FX_USD_VND,
    settings: settingsRate ?? null,
  });
}

export { DEFAULT_USD_VND_RATE };
