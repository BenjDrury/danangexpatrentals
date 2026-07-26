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

async function loadCompanyGroupProps(
  companyId: string,
): Promise<Record<string, string | number>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("estate_companies")
    .select("name, page_url, page_followers, facebook_id")
    .eq("id", companyId)
    .maybeSingle();

  if (!data) return {};

  // Omit null/empty values — empty or null `$group_set` fields can wipe the
  // group's display `name` in the PostHog UI.
  const props: Record<string, string | number> = {};
  if (data.name) props.name = data.name as string;
  if (data.page_url) props.page_url = data.page_url as string;
  if (data.page_followers != null) {
    props.page_followers = data.page_followers as number;
  }
  if (data.facebook_id) props.facebook_id = data.facebook_id as string;
  return props;
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
    if (Object.keys(companyProps).length > 0) {
      posthog.groupIdentify({
        groupType: COMPANY_GROUP_TYPE,
        groupKey: companyId,
        properties: companyProps,
      });
    }
  }

  const name = studio.profile.display_name?.trim() || null;

  // Keep the person profile tied to our internal id + name on every server event.
  posthog.identify({
    distinctId: studio.user.id,
    properties: {
      email: studio.user.email ?? null,
      name,
      role: studio.profile.role,
      estate_company_id: companyId,
    },
  });

  posthog.capture({
    distinctId: studio.user.id,
    event,
    properties: {
      ...properties,
      email: studio.user.email ?? null,
      name,
      role: studio.profile.role,
      estate_company_id: companyId,
    },
    groups,
  });

  await posthog.flush();
}
