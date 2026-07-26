import { requireStudioCompany } from "@/lib/auth";
import { listCompanyFacebookGroups } from "@/lib/data/facebook-groups";
import { getCompanyIntegration } from "@/lib/data/integrations";
import { getCompanyTeam } from "@/lib/data/team";
import { isFacebookOAuthConfigured } from "@/lib/facebook-oauth";
import { SettingsView } from "./SettingsView";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ fb?: string }>;
}) {
  const session = await requireStudioCompany();
  const params = await searchParams;
  const integration = await getCompanyIntegration(session.estateCompanyId, "facebook");
  const team = await getCompanyTeam(session.estateCompanyId);
  const facebookGroups = await listCompanyFacebookGroups(session.estateCompanyId);
  const p = session.profile;

  return (
    <SettingsView
      profile={{
        userId: session.user.id,
        loginEmail: session.user.email ?? null,
        displayName: p.display_name?.trim() ?? "",
        avatarUrl: p.avatar_url?.trim() ?? "",
        phone: p.phone?.trim() ?? "",
        whatsapp: p.whatsapp?.trim() ?? "",
        contactEmail: p.contact_email?.trim() ?? "",
        bio: p.bio?.trim() ?? "",
      }}
      facebook={
        integration
          ? {
              status: integration.status,
              pageName: integration.external_account_name,
              connectedAt: integration.connected_at,
            }
          : { status: "disconnected", pageName: null, connectedAt: null }
      }
      oauthConfigured={isFacebookOAuthConfigured()}
      flash={params.fb?.trim() || null}
      members={team.members}
      invites={team.invites}
      missingServiceRole={team.missingServiceRole}
      facebookGroups={facebookGroups}
    />
  );
}
