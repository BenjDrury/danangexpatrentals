import { requireStudioCompany } from "@/lib/auth";
import { getEstateCompany } from "@/lib/data/company";
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
  const [company, integration, team, facebookGroups] = await Promise.all([
    getEstateCompany(session.estateCompanyId),
    getCompanyIntegration(session.estateCompanyId, "facebook"),
    getCompanyTeam(session.estateCompanyId),
    listCompanyFacebookGroups(session.estateCompanyId),
  ]);
  const p = session.profile;

  return (
    <SettingsView
      company={{
        id: session.estateCompanyId,
        name: company?.name?.trim() || "",
        logoUrl: company?.logoUrl?.trim() || "",
        contactPhone: company?.contactPhone?.trim() || "",
        contactWhatsapp: company?.contactWhatsapp?.trim() || "",
        contactEmail: company?.contactEmail?.trim() || "",
      }}
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
