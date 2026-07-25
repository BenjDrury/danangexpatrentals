import { requireStudioCompany } from "@/lib/auth";
import { getPartnerContacts, getPartnerListings } from "@/lib/data/listings";
import { createClient } from "@/lib/supabase/server";
import { ContactsView } from "./ContactsView";

type DealRow = {
  contact_id: string | null;
  apartment_id: string | null;
  notes: string | null;
  stage: string;
};

export default async function ContactsPage() {
  const session = await requireStudioCompany();

  const [contacts, listings] = await Promise.all([
    getPartnerContacts(session.estateCompanyId),
    getPartnerListings(session.estateCompanyId),
  ]);

  const supabase = await createClient();
  const { data: deals } = await supabase
    .from("partner_deals")
    .select("contact_id, apartment_id, notes, stage")
    .eq("estate_company_id", session.estateCompanyId)
    .order("updated_at", { ascending: false });

  const dealsByContact: Record<string, DealRow> = {};
  for (const d of (deals ?? []) as DealRow[]) {
    if (d.contact_id && !dealsByContact[d.contact_id]) {
      dealsByContact[d.contact_id] = d;
    }
  }

  const listingTitle = Object.fromEntries(listings.map((l) => [l.id, l.title]));

  return (
    <ContactsView
      contacts={contacts}
      listings={listings.map((l) => ({ id: l.id, title: l.title }))}
      dealsByContact={dealsByContact}
      listingTitle={listingTitle}
    />
  );
}
