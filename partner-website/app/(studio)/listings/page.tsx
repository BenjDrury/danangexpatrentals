import { requireStudioCompany } from "@/lib/auth";
import {
  getAreasForSelect,
  getListingRelationSummaries,
  getPartnerListings,
} from "@/lib/data/listings";
import { isValidityStale } from "@/lib/listing-validity";
import { needsBump } from "@/lib/post-composer";
import { ListingsView } from "./ListingsView";

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const session = await requireStudioCompany();
  const { deleted } = await searchParams;

  const [listings, relations, areas] = await Promise.all([
    getPartnerListings(session.estateCompanyId),
    getListingRelationSummaries(session.estateCompanyId),
    getAreasForSelect(),
  ]);

  const bumpIds = listings.filter((apt) => needsBump(apt)).map((a) => a.id);
  const staleIds = listings.filter((apt) => isValidityStale(apt)).map((a) => a.id);
  const areaNames = Object.fromEntries(areas.map((a) => [a.id, a.name]));

  return (
    <ListingsView
      listings={listings}
      relations={relations}
      areaNames={areaNames}
      bumpIds={bumpIds}
      staleIds={staleIds}
      justDeleted={deleted === "1"}
    />
  );
}
