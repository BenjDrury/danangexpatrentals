import { notFound } from "next/navigation";
import type { Apartment } from "types";
import { requireStudioCompany } from "@/lib/auth";
import {
  getListingDeals,
  getPartnerContacts,
  getPartnerListing,
} from "@/lib/data/listings";
import { createClient } from "@/lib/supabase/server";
import { isValidityStale } from "@/lib/listing-validity";
import { buildListingCaption, needsBump } from "@/lib/post-composer";
import { apartmentPublicUrl, areaPublicUrl } from "@/lib/public-url";
import { ListingDetailView } from "./ListingDetailView";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireStudioCompany();

  const { id } = await params;
  const [listing, deals, contacts] = await Promise.all([
    getPartnerListing(session.estateCompanyId, id),
    getListingDeals(session.estateCompanyId, id),
    getPartnerContacts(session.estateCompanyId),
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
    <ListingDetailView
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
    />
  );
}
