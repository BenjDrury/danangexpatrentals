import { requireStudioCompany } from "@/lib/auth";
import { getCompanyName, getPartnerListings } from "@/lib/data/listings";
import { buildHomeFeed } from "@/lib/listing-validity";
import { HomeView } from "./HomeView";

export default async function HomePage() {
  const session = await requireStudioCompany();

  const [companyName, listings] = await Promise.all([
    getCompanyName(session.estateCompanyId),
    getPartnerListings(session.estateCompanyId),
  ]);

  const display =
    session.profile.display_name?.trim() || companyName || null;
  const feed = buildHomeFeed(listings);

  return (
    <HomeView
      displayName={display}
      feed={feed}
      listingsEmpty={listings.length === 0}
    />
  );
}
