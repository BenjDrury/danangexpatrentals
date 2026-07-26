import { createClient } from "@/lib/supabase/server";

export type EstateCompany = {
  id: string;
  name: string;
  pageUrl: string | null;
  logoUrl: string | null;
  contactPhone: string | null;
  contactWhatsapp: string | null;
  contactEmail: string | null;
};

function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

function mapCompany(data: Record<string, unknown>): EstateCompany {
  return {
    id: data.id as string,
    name: (data.name as string) ?? "",
    pageUrl: (data.page_url as string | null) ?? null,
    logoUrl: (data.logo_url as string | null) ?? null,
    contactPhone: (data.contact_phone as string | null) ?? null,
    contactWhatsapp: (data.contact_whatsapp as string | null) ?? null,
    contactEmail: (data.contact_email as string | null) ?? null,
  };
}

const COMPANY_SELECT =
  "id, name, page_url, logo_url, contact_phone, contact_whatsapp, contact_email";

export async function getEstateCompany(
  estateCompanyId: string,
): Promise<EstateCompany | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("estate_companies")
    .select(COMPANY_SELECT)
    .eq("id", estateCompanyId)
    .maybeSingle();

  if (error || !data) return null;
  return mapCompany(data as Record<string, unknown>);
}

export async function updateEstateCompany(
  estateCompanyId: string,
  input: {
    name: string;
    contactPhone?: string;
    contactWhatsapp?: string;
    contactEmail?: string;
    logoUrl?: string;
  },
): Promise<{ error?: string; company?: EstateCompany }> {
  const name = input.name.trim();
  if (!name) return { error: "Company name is required." };
  if (name.length > 120) return { error: "Company name is too long." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("estate_companies")
    .update({
      name,
      contact_phone: emptyToNull(input.contactPhone),
      contact_whatsapp: emptyToNull(input.contactWhatsapp),
      contact_email: emptyToNull(input.contactEmail),
      logo_url: emptyToNull(input.logoUrl),
      updated_at: new Date().toISOString(),
    })
    .eq("id", estateCompanyId)
    .select(COMPANY_SELECT)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "Could not update company." };

  return { company: mapCompany(data as Record<string, unknown>) };
}
