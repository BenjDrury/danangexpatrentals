import { notFound } from "next/navigation";
import { requireStudioCompany } from "@/lib/auth";
import { getAreasForSelect, getPartnerListing } from "@/lib/data/listings";
import { getUsdVndRate } from "@/lib/fx";
import { EditListingView } from "../../ListingPageViews";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireStudioCompany();

  const { id } = await params;
  const [listing, areas, usdVndRate] = await Promise.all([
    getPartnerListing(session.estateCompanyId, id),
    getAreasForSelect(),
    getUsdVndRate(),
  ]);
  if (!listing) notFound();

  return (
    <EditListingView
      areas={areas}
      estateCompanyId={session.estateCompanyId}
      listing={listing}
      isAdmin={session.isAdmin}
      usdVndRate={usdVndRate}
    />
  );
}
