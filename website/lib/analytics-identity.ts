"use client";

import type { User } from "@supabase/supabase-js";
import { createAuthClient } from "@/lib/supabase/auth-client";
import { disableAnalyticsForAdmin, identifyUser, resetAnalytics } from "@/lib/analytics";

/**
 * Sync PostHog with the shared Supabase session (set on partner/admin login).
 * Admins opt out; partners are identified for public-site browsing.
 */
export async function syncPostHogIdentity(user: User | null | undefined): Promise<void> {
  if (!user) {
    resetAnalytics();
    return;
  }

  const supabase = createAuthClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name, estate_company_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "admin") {
    disableAnalyticsForAdmin();
    return;
  }

  // Only studio roles get identified; anonymous visitors stay anonymous.
  if (profile?.role !== "partner") {
    return;
  }

  const companyId = profile.estate_company_id ?? null;
  let companyName: string | null = null;
  if (companyId) {
    const { data: company } = await supabase
      .from("estate_companies")
      .select("name")
      .eq("id", companyId)
      .maybeSingle();
    companyName = company?.name ?? null;
  }

  identifyUser({
    id: user.id,
    email: user.email,
    name: profile.display_name?.trim() || null,
    role: "partner",
    companyId,
    companyName,
    isAdmin: false,
  });
}
