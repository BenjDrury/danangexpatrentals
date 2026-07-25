import { notFound } from "next/navigation";
import { requireStudioCompany } from "@/lib/auth";
import {
  getContactDeals,
  getPartnerContact,
  getPartnerListings,
} from "@/lib/data/listings";
import { ContactDetailView } from "./ContactDetailView";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireStudioCompany();
  const { id } = await params;

  const [contact, deals, listings] = await Promise.all([
    getPartnerContact(session.estateCompanyId, id),
    getContactDeals(session.estateCompanyId, id),
    getPartnerListings(session.estateCompanyId),
  ]);

  if (!contact) notFound();

  const listingById = Object.fromEntries(
    listings.map((l) => [
      l.id,
      { id: l.id, title: l.title, status: l.status ?? null },
    ])
  );

  const connected = deals.map((d) => ({
    dealId: d.id,
    apartmentId: d.apartment_id,
    title: d.apartment_id
      ? listingById[d.apartment_id]?.title ?? null
      : null,
    status: d.apartment_id ? listingById[d.apartment_id]?.status ?? null : null,
    stage: d.stage,
    notes: d.notes,
    expected_commission_usd: d.expected_commission_usd,
    expected_commission_pct: d.expected_commission_pct,
  }));

  const connectedApartmentIds = new Set(
    deals.map((d) => d.apartment_id).filter(Boolean) as string[]
  );
  const availableListings = listings
    .filter((l) => !connectedApartmentIds.has(l.id))
    .map((l) => ({ id: l.id, title: l.title }));

  return (
    <ContactDetailView
      contact={contact}
      connected={connected}
      availableListings={availableListings}
    />
  );
}
