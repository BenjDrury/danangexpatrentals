"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePartner } from "@/lib/auth";
import { hasAnyCommission, parseCommissionFormData } from "@/lib/deal-commission";
import { createClient } from "@/lib/supabase/server";

export type ContactFormState = {
  error?: string;
  ok?: boolean;
  contactId?: string;
};

async function assertContactOwned(
  supabase: Awaited<ReturnType<typeof createClient>>,
  estateCompanyId: string,
  contactId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("partner_contacts")
    .select("id")
    .eq("id", contactId)
    .eq("estate_company_id", estateCompanyId)
    .maybeSingle();
  return Boolean(data);
}

function revalidateDealPaths(opts: {
  contactId?: string | null;
  apartmentId?: string | null;
}) {
  revalidatePath("/contacts");
  revalidatePath("/listings");
  if (opts.contactId) revalidatePath(`/contacts/${opts.contactId}`);
  if (opts.apartmentId) revalidatePath(`/listings/${opts.apartmentId}`);
}

export async function createContact(
  _prev: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const session = await requirePartner();
  if (!session) return { error: "Unauthorized." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };

  const phone = String(formData.get("phone") ?? "").trim() || null;
  const whatsapp = String(formData.get("whatsapp") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const apartmentId = String(formData.get("apartment_id") ?? "").trim() || null;
  const commission = parseCommissionFormData(formData);
  if ("error" in commission) return { error: commission.error };

  const supabase = await createClient();
  const { data: contact, error } = await supabase
    .from("partner_contacts")
    .insert({
      estate_company_id: session.estateCompanyId,
      name,
      phone,
      whatsapp,
      email,
      notes,
    })
    .select("id")
    .single();

  if (error || !contact) {
    if (error?.message?.toLowerCase().includes("partner_contacts")) {
      return { error: "Contacts table missing — run supabase/12-partner-portal.sql." };
    }
    return { error: error?.message ?? "Could not save contact." };
  }

  if (apartmentId || hasAnyCommission(commission)) {
    const { error: dealError } = await supabase.from("partner_deals").insert({
      estate_company_id: session.estateCompanyId,
      contact_id: contact.id,
      apartment_id: apartmentId,
      notes: commission.notes,
      expected_commission_usd: commission.expected_commission_usd,
      expected_commission_pct: commission.expected_commission_pct,
      stage: "inquiry",
    });
    if (dealError && !dealError.message.toLowerCase().includes("partner_deals")) {
      return { error: `Contact saved, but deal note failed: ${dealError.message}` };
    }
  }

  revalidateDealPaths({ contactId: contact.id, apartmentId });
  return { ok: true, contactId: contact.id };
}

export async function updateContact(
  contactId: string,
  _prev: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const session = await requirePartner();
  if (!session) return { error: "Unauthorized." };
  if (!contactId?.trim()) return { error: "Missing contact." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };

  const phone = String(formData.get("phone") ?? "").trim() || null;
  const whatsapp = String(formData.get("whatsapp") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const supabase = await createClient();
  const owned = await assertContactOwned(supabase, session.estateCompanyId, contactId);
  if (!owned) return { error: "Contact not found." };

  const { error } = await supabase
    .from("partner_contacts")
    .update({
      name,
      phone,
      whatsapp,
      email,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contactId)
    .eq("estate_company_id", session.estateCompanyId);

  if (error) return { error: error.message };

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${contactId}`);
  return { ok: true, contactId };
}

export async function deleteContact(contactId: string): Promise<{ error?: string }> {
  const session = await requirePartner();
  if (!session) return { error: "Unauthorized." };
  if (!contactId?.trim()) return { error: "Missing contact." };

  const supabase = await createClient();
  const owned = await assertContactOwned(supabase, session.estateCompanyId, contactId);
  if (!owned) return { error: "Contact not found." };

  // Clear deal links first so FK set-null leaves no orphaned contact refs in UI.
  await supabase
    .from("partner_deals")
    .update({ contact_id: null, updated_at: new Date().toISOString() })
    .eq("contact_id", contactId)
    .eq("estate_company_id", session.estateCompanyId);

  const { error } = await supabase
    .from("partner_contacts")
    .delete()
    .eq("id", contactId)
    .eq("estate_company_id", session.estateCompanyId);

  if (error) return { error: error.message };

  revalidatePath("/contacts");
  redirect("/contacts");
}

export type DealActionState = { error?: string; ok?: boolean };

export async function connectListing(
  contactId: string,
  _prev: DealActionState,
  formData: FormData
): Promise<DealActionState> {
  const session = await requirePartner();
  if (!session) return { error: "Unauthorized." };
  if (!contactId?.trim()) return { error: "Missing contact." };

  const apartmentId = String(formData.get("apartment_id") ?? "").trim();
  if (!apartmentId) return { error: "Pick a listing to connect." };
  const commission = parseCommissionFormData(formData);
  if ("error" in commission) return { error: commission.error };

  const supabase = await createClient();
  const owned = await assertContactOwned(supabase, session.estateCompanyId, contactId);
  if (!owned) return { error: "Contact not found." };

  const { data: listing } = await supabase
    .from("apartments")
    .select("id")
    .eq("id", apartmentId)
    .eq("estate_company_id", session.estateCompanyId)
    .maybeSingle();
  if (!listing) return { error: "Listing not found." };

  const { data: existing } = await supabase
    .from("partner_deals")
    .select("id")
    .eq("estate_company_id", session.estateCompanyId)
    .eq("contact_id", contactId)
    .eq("apartment_id", apartmentId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("partner_deals")
      .update({
        notes: commission.notes,
        expected_commission_usd: commission.expected_commission_usd,
        expected_commission_pct: commission.expected_commission_pct,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) return { error: error.message };
    revalidateDealPaths({ contactId, apartmentId });
    return { ok: true };
  }

  const { error } = await supabase.from("partner_deals").insert({
    estate_company_id: session.estateCompanyId,
    contact_id: contactId,
    apartment_id: apartmentId,
    notes: commission.notes,
    expected_commission_usd: commission.expected_commission_usd,
    expected_commission_pct: commission.expected_commission_pct,
    stage: "inquiry",
  });

  if (error) {
    if (error.message.toLowerCase().includes("partner_deals")) {
      return { error: "Deals table missing — run supabase/12-partner-portal.sql." };
    }
    return { error: error.message };
  }

  revalidateDealPaths({ contactId, apartmentId });
  return { ok: true };
}

export async function updateDealCommission(
  dealId: string,
  _prev: DealActionState,
  formData: FormData
): Promise<DealActionState> {
  const session = await requirePartner();
  if (!session) return { error: "Unauthorized." };
  if (!dealId?.trim()) return { error: "Missing deal." };

  const commission = parseCommissionFormData(formData);
  if ("error" in commission) return { error: commission.error };

  const supabase = await createClient();
  const { data: deal, error: fetchError } = await supabase
    .from("partner_deals")
    .select("id, contact_id, apartment_id")
    .eq("id", dealId)
    .eq("estate_company_id", session.estateCompanyId)
    .maybeSingle();

  if (fetchError) return { error: fetchError.message };
  if (!deal) return { error: "Deal not found." };

  const { error } = await supabase
    .from("partner_deals")
    .update({
      notes: commission.notes,
      expected_commission_usd: commission.expected_commission_usd,
      expected_commission_pct: commission.expected_commission_pct,
      updated_at: new Date().toISOString(),
    })
    .eq("id", dealId)
    .eq("estate_company_id", session.estateCompanyId);

  if (error) return { error: error.message };

  revalidateDealPaths({
    contactId: deal.contact_id,
    apartmentId: deal.apartment_id,
  });
  return { ok: true };
}

export async function disconnectDeal(
  contactId: string,
  dealId: string
): Promise<{ error?: string }> {
  const session = await requirePartner();
  if (!session) return { error: "Unauthorized." };
  if (!contactId?.trim() || !dealId?.trim()) return { error: "Missing deal." };

  const supabase = await createClient();
  const owned = await assertContactOwned(supabase, session.estateCompanyId, contactId);
  if (!owned) return { error: "Contact not found." };

  const { data: deal } = await supabase
    .from("partner_deals")
    .select("apartment_id")
    .eq("id", dealId)
    .eq("contact_id", contactId)
    .eq("estate_company_id", session.estateCompanyId)
    .maybeSingle();

  const { error } = await supabase
    .from("partner_deals")
    .delete()
    .eq("id", dealId)
    .eq("contact_id", contactId)
    .eq("estate_company_id", session.estateCompanyId);

  if (error) return { error: error.message };

  revalidateDealPaths({
    contactId,
    apartmentId: deal?.apartment_id ?? null,
  });
  return {};
}
