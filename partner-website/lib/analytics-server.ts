import { COMPANY_GROUP_TYPE } from "@/lib/analytics-constants";
import { getStudioUser, type PartnerSession, type StudioUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPostHogClient } from "@/lib/posthog-server";

export { COMPANY_GROUP_TYPE };

export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

type SessionLike = Pick<
  StudioUser | PartnerSession,
  "user" | "profile" | "estateCompanyId" | "isAdmin"
>;

async function loadCompanyGroupProps(companyId: string): Promise<Record<string, string | number | null>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("estate_companies")
    .select("name, page_url, page_followers, facebook_id")
    .eq("id", companyId)
    .maybeSingle();

  if (!data) return { name: null };

  return {
    name: data.name ?? null,
    page_url: data.page_url ?? null,
    page_followers: data.page_followers ?? null,
    facebook_id: data.facebook_id ?? null,
  };
}

/**
 * Server-side capture. Skips admins entirely.
 * Attaches the estate company as a PostHog group when available.
 */
export async function captureServer(
  event: string,
  properties: AnalyticsProperties = {},
  session?: SessionLike | null,
): Promise<void> {
  const studio = session === undefined ? await getStudioUser() : session;
  if (!studio || studio.isAdmin) return;

  const posthog = getPostHogClient();
  if (!posthog) return;

  const companyId = studio.estateCompanyId;
  const groups = companyId ? { [COMPANY_GROUP_TYPE]: companyId } : undefined;

  if (companyId) {
    const companyProps = await loadCompanyGroupProps(companyId);
    posthog.groupIdentify({
      groupType: COMPANY_GROUP_TYPE,
      groupKey: companyId,
      properties: companyProps,
    });
  }

  posthog.capture({
    distinctId: studio.user.id,
    event,
    properties: {
      ...properties,
      email: studio.user.email ?? null,
      name: studio.profile.display_name ?? null,
      role: studio.profile.role,
      estate_company_id: companyId,
    },
    groups,
  });

  await posthog.flush();
}
