"use client";

import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { disableAnalyticsForAdmin, identifyUser, resetAnalytics } from "@/lib/analytics";

/**
 * Identify the signed-in user in PostHog (internal user id + display name),
 * or opt out admins. Call as soon as a Supabase session is known.
 */
export async function syncPostHogIdentity(user: User | null | undefined): Promise<void> {
  if (!user) {
    resetAnalytics();
    return;
  }

  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name, estate_company_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "admin") {
    disableAnalyticsForAdmin();
    return;
  }

  const companyId = profile?.estate_company_id ?? null;
  let companyName: string | null = null;
  let companyPageUrl: string | null = null;
  let companyFollowers: number | null = null;
  let companyFacebookId: string | null = null;

  // Always load company props with identity so groupidentify includes `name`.
  // Calling group() without props can send empty `$group_set` and wipe the label.
  if (companyId) {
    const { data: company } = await supabase
      .from("estate_companies")
      .select("name, page_url, page_followers, facebook_id")
      .eq("id", companyId)
      .maybeSingle();
    companyName = company?.name ?? null;
    companyPageUrl = company?.page_url ?? null;
    companyFollowers = company?.page_followers ?? null;
    companyFacebookId = company?.facebook_id ?? null;
  }

  const name = profile?.display_name?.trim() || null;

  identifyUser({
    id: user.id,
    email: user.email,
    name,
    role: profile?.role ?? null,
    companyId,
    companyName,
    companyPageUrl,
    companyFollowers,
    companyFacebookId,
    isAdmin: false,
  });
}
