import { redirect } from "next/navigation";
import { getStudioUser } from "@/lib/auth";
import { getCompanyName } from "@/lib/data/listings";
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

  const companyName = studio.estateCompanyId
    ? await getCompanyName(studio.estateCompanyId)
    : null;
  const headerName =
    companyName ||
    studio.profile.display_name?.trim() ||
    null;

  return (
    <StudioShell
      companyName={headerName}
      email={studio.user.email}
      isAdmin={studio.isAdmin}
      estateCompanyId={studio.estateCompanyId}
    >
      {children}
    </StudioShell>
  );
}
