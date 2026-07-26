"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { IMPERSONATE_COOKIE, requireAdmin } from "@/lib/auth";
import { setImpersonationCookie } from "@/lib/impersonation";
import { createClient, getServiceRoleClient } from "@/lib/supabase/server";

export type FxRateState = { error?: string; ok?: boolean };

export type LanguageFeedbackState = { error?: string; ok?: boolean };

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

export async function submitLanguageFeedback(input: {
  selectedText: string;
  pagePath: string;
  locale: string;
  comment: string;
}): Promise<LanguageFeedbackState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized." };

  const selectedText = input.selectedText.trim();
  const pagePath = input.pagePath.trim().slice(0, 500);
  const locale = input.locale.trim();
  const comment = input.comment.trim().slice(0, 4000);

  if (!selectedText || selectedText.length > 4000) {
    return { error: "Select some text to send feedback." };
  }
  if (!pagePath) {
    return { error: "Missing page path." };
  }
  if (locale !== "en" && locale !== "vi") {
    return { error: "Invalid locale." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("language_feedback").insert({
    selected_text: selectedText,
    page_path: pagePath,
    locale,
    comment,
    created_by: admin.user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/partners");
  return { ok: true };
}

export async function deleteLanguageFeedback(
  id: string,
): Promise<LanguageFeedbackState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized." };

  const feedbackId = id?.trim();
  if (!feedbackId) return { error: "Missing feedback id." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("language_feedback")
    .delete()
    .eq("id", feedbackId);

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

/** Clears view-as cookie; admin returns to the partner picker. */
export async function stopImpersonation() {
  const admin = await requireAdmin();
  if (!admin) {
    redirect("/unauthorized");
  }

  const jar = await cookies();
  jar.delete(IMPERSONATE_COOKIE);

  redirect("/admin/partners");
}
