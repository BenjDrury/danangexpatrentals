import { redirect } from "next/navigation";
import { getStudioUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AnalyticsIdentity } from "@/components/AnalyticsIdentity";
import { StudioShell } from "./StudioShell";

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const studio = await getStudioUser();
  if (!studio) {
    redirect("/unauthorized");
  }

  let companyName: string | null = null;
  let companyPageUrl: string | null = null;
  let companyFollowers: number | null = null;
  let companyFacebookId: string | null = null;

  if (studio.estateCompanyId) {
    const supabase = await createClient();
    const { data: company } = await supabase
      .from("estate_companies")
      .select("name, page_url, page_followers, facebook_id")
      .eq("id", studio.estateCompanyId)
      .maybeSingle();
    companyName = company?.name ?? null;
    companyPageUrl = company?.page_url ?? null;
    companyFollowers = company?.page_followers ?? null;
    companyFacebookId = company?.facebook_id ?? null;
  }

  const headerName =
    companyName ||
    studio.profile.display_name?.trim() ||
    null;

  return (
    <>
      <AnalyticsIdentity
        id={studio.user.id}
        email={studio.user.email}
        name={studio.profile.display_name?.trim() || null}
        role={studio.profile.role}
        isAdmin={studio.isAdmin}
        companyId={studio.estateCompanyId}
        companyName={companyName}
        companyPageUrl={companyPageUrl}
        companyFollowers={companyFollowers}
        companyFacebookId={companyFacebookId}
        isImpersonating={studio.isImpersonating}
      />
      <StudioShell
        companyName={headerName}
        email={studio.user.email}
        isAdmin={studio.isAdmin}
        estateCompanyId={studio.estateCompanyId}
      >
        {children}
      </StudioShell>
    </>
  );
}
