import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Apartment } from "types";
import { requireStudioCompany } from "@/lib/auth";
import {
  getAreasForSelect,
  getListingDeals,
  getPartnerContacts,
  getPartnerListing,
} from "@/lib/data/listings";
import { getCompanyIntegration } from "@/lib/data/integrations";
import { listPublishFacebookGroups } from "@/lib/data/facebook-groups";
import { listListingFacebookBatches } from "@/lib/data/facebook-posts";
import { getUsdVndRate } from "@/lib/fx";
import { createClient } from "@/lib/supabase/server";
import { isValidityStale } from "@/lib/listing-validity";
import { buildListingCaption, needsBump } from "@/lib/post-composer";
import { apartmentPublicUrl, areaPublicUrl } from "@/lib/public-url";
import { ListingWorkspace } from "./ListingWorkspace";

export default async function ListingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireStudioCompany();

  const { id } = await params;
  const { tab } = await searchParams;
  const [listing, deals, contacts, areas, usdVndRate, facebook, facebookGroups, facebookHistory] =
    await Promise.all([
      getPartnerListing(session.estateCompanyId, id),
      getListingDeals(session.estateCompanyId, id),
      getPartnerContacts(session.estateCompanyId),
      getAreasForSelect(),
      getUsdVndRate(),
      getCompanyIntegration(session.estateCompanyId, "facebook"),
      listPublishFacebookGroups(session.estateCompanyId),
      listListingFacebookBatches(session.estateCompanyId, id, { limit: 12 }),
    ]);
  if (!listing) notFound();

  const supabase = await createClient();
  let area: { name: string; vibe?: string | null } | null = null;
  if (listing.area_id) {
    const { data } = await supabase
      .from("areas")
      .select("name, vibe")
      .eq("id", listing.area_id)
      .maybeSingle();
    if (data) area = data;
  }

  const publicUrl = apartmentPublicUrl(listing.id, listing.public_slug);
  const areaUrl = listing.area_id ? areaPublicUrl(listing.area_id) : null;
  const caption = buildListingCaption(listing as Apartment, area, publicUrl);
  const bump = needsBump(listing);
  const stale = isValidityStale(listing);

  const linkedContactIds = new Set(
    deals.map((d) => d.contact_id).filter(Boolean) as string[]
  );
  const availableContacts = contacts
    .filter((c) => !linkedContactIds.has(c.id))
    .map((c) => ({ id: c.id, name: c.name }));

  return (
    <Suspense fallback={null}>
      <ListingWorkspace
        listing={listing}
        areaName={area?.name ?? null}
        publicUrl={publicUrl}
        areaPublicUrl={areaUrl}
        caption={caption}
        bump={bump}
        stale={stale}
        isAdmin={session.isAdmin}
        deals={deals}
        availableContacts={availableContacts}
        areas={areas}
        estateCompanyId={session.estateCompanyId}
        usdVndRate={usdVndRate}
        initialTab={tab}
        facebookConnected={facebook?.status === "connected"}
        facebookPageName={facebook?.external_account_name ?? null}
        facebookGroups={facebookGroups}
        facebookHistory={facebookHistory}
      />
    </Suspense>
  );
}
