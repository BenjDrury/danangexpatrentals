import {
  DEFAULT_USD_VND_RATE,
  resolveUsdVndRate,
} from "types";
import { createClient } from "@/lib/supabase/server";

/** FX rate for listing price conversion (env FX_USD_VND overrides app_settings). */
export async function getUsdVndRate(): Promise<number> {
  const env = process.env.FX_USD_VND;
  const fromEnv = Number(env);
  if (Number.isFinite(fromEnv) && fromEnv > 0) {
    return resolveUsdVndRate({ env: fromEnv });
  }

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("app_settings")
      .select("usd_vnd_rate")
      .eq("id", "default")
      .maybeSingle();
    const settings = data?.usd_vnd_rate != null ? Number(data.usd_vnd_rate) : null;
    return resolveUsdVndRate({ settings });
  } catch {
    return DEFAULT_USD_VND_RATE;
  }
}
