import { redirect } from "next/navigation";
import { DEFAULT_USD_VND_RATE, resolveUsdVndRate } from "types";
import { requireAdmin } from "@/lib/auth";
import { listPartnersForAdmin } from "@/lib/data/partners";
import { createClient } from "@/lib/supabase/server";
import { PartnersView } from "./PartnersView";

export default async function AdminPartnersPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/unauthorized");

  const [{ partners, missingServiceRole }, settingsRate] = await Promise.all([
    listPartnersForAdmin(),
    (async () => {
      try {
        const supabase = await createClient();
        const { data } = await supabase
          .from("app_settings")
          .select("usd_vnd_rate")
          .eq("id", "default")
          .maybeSingle();
        const n = data?.usd_vnd_rate != null ? Number(data.usd_vnd_rate) : NaN;
        return Number.isFinite(n) && n > 0 ? n : DEFAULT_USD_VND_RATE;
      } catch {
        return DEFAULT_USD_VND_RATE;
      }
    })(),
  ]);

  const envRaw = process.env.FX_USD_VND;
  const envNum = Number(envRaw);
  const envOverride = Number.isFinite(envNum) && envNum > 0;
  const effectiveRate = resolveUsdVndRate({
    env: envOverride ? envNum : undefined,
    settings: settingsRate,
  });

  return (
    <PartnersView
      partners={partners}
      missingServiceRole={missingServiceRole}
      settingsRate={settingsRate}
      effectiveRate={effectiveRate}
      envOverride={envOverride}
    />
  );
}
