"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { IMPERSONATE_COOKIE, requireAdmin } from "@/lib/auth";
import { setImpersonationCookie } from "@/lib/impersonation";
import { createClient, getServiceRoleClient } from "@/lib/supabase/server";

export type FxRateState = { error?: string; ok?: boolean };

export async function updateUsdVndRate(
  _prev: FxRateState,
  formData: FormData
): Promise<FxRateState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized." };

  const raw = String(formData.get("usd_vnd_rate") ?? "").trim();
  const rate = Number(raw);
  if (!Number.isFinite(rate) || rate < 1000 || rate > 100_000) {
    return { error: "Enter a rate between 1,000 and 100,000." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_settings")
    .update({
      usd_vnd_rate: Math.round(rate),
      updated_at: new Date().toISOString(),
    })
    .eq("id", "default");

  if (error) return { error: error.message };

  revalidatePath("/admin/partners");
  return { ok: true };
}

export async function startImpersonation(
  companyId: string,
  _formData?: FormData,
) {
  const admin = await requireAdmin();
  if (!admin) {
    redirect("/unauthorized");
  }

  const id = companyId?.trim();
  if (!id) {
    redirect("/admin/partners");
  }

  // Verify company exists (service role — admins may lack broad profile reads)
  const service = getServiceRoleClient();
  if (service) {
    const { data } = await service
      .from("estate_companies")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (!data) {
      redirect("/admin/partners");
    }
  }

  await setImpersonationCookie(id);
  redirect("/");
}

/** Clears view-as cookie; admin falls back to profile.estate_company_id if set. */
export async function stopImpersonation() {
  const admin = await requireAdmin();
  if (!admin) {
    redirect("/unauthorized");
  }

  const jar = await cookies();
  jar.delete(IMPERSONATE_COOKIE);

  redirect("/admin/partners");
}
