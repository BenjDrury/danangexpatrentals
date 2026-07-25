import { requireStudioCompany } from "@/lib/auth";
import { getAreasForSelect } from "@/lib/data/listings";
import { getUsdVndRate } from "@/lib/fx";
import { NewListingView } from "../ListingPageViews";

export default async function NewListingPage() {
  const session = await requireStudioCompany();

  const [areas, usdVndRate] = await Promise.all([
    getAreasForSelect(),
    getUsdVndRate(),
  ]);

  return (
    <NewListingView
      areas={areas}
      estateCompanyId={session.estateCompanyId}
      isAdmin={session.isAdmin}
      usdVndRate={usdVndRate}
    />
  );
}
