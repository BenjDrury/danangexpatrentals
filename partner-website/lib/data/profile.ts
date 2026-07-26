import type { User } from "types";
import { createClient } from "@/lib/supabase/server";

export type PartnerProfile = Pick<
  User,
  | "id"
  | "display_name"
  | "avatar_url"
  | "phone"
  | "whatsapp"
  | "contact_email"
  | "bio"
  | "role"
  | "estate_company_id"
>;

export type PartnerProfileUpdate = {
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  contact_email: string | null;
  bio: string | null;
};

function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length ? trimmed : null;
}

export async function getPartnerProfile(
  userId: string,
): Promise<PartnerProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, display_name, avatar_url, phone, whatsapp, contact_email, bio, role, estate_company_id",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id as string,
    display_name: (data.display_name as string | null) ?? null,
    avatar_url: (data.avatar_url as string | null) ?? null,
    phone: (data.phone as string | null) ?? null,
    whatsapp: (data.whatsapp as string | null) ?? null,
    contact_email: (data.contact_email as string | null) ?? null,
    bio: (data.bio as string | null) ?? null,
    role: data.role as PartnerProfile["role"],
    estate_company_id: (data.estate_company_id as string | null) ?? null,
  };
}

export async function updatePartnerProfile(
  userId: string,
  input: PartnerProfileUpdate,
): Promise<{ error?: string; profile?: PartnerProfile }> {
  const supabase = await createClient();
  const payload = {
    display_name: emptyToNull(input.display_name),
    avatar_url: emptyToNull(input.avatar_url),
    phone: emptyToNull(input.phone),
    whatsapp: emptyToNull(input.whatsapp),
    contact_email: emptyToNull(input.contact_email),
    bio: emptyToNull(input.bio),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", userId)
    .select(
      "id, display_name, avatar_url, phone, whatsapp, contact_email, bio, role, estate_company_id",
    )
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "Profile not found." };

  return {
    profile: {
      id: data.id as string,
      display_name: (data.display_name as string | null) ?? null,
      avatar_url: (data.avatar_url as string | null) ?? null,
      phone: (data.phone as string | null) ?? null,
      whatsapp: (data.whatsapp as string | null) ?? null,
      contact_email: (data.contact_email as string | null) ?? null,
      bio: (data.bio as string | null) ?? null,
      role: data.role as PartnerProfile["role"],
      estate_company_id: (data.estate_company_id as string | null) ?? null,
    },
  };
}

/** Extract storage object path from a public avatars-bucket URL for this user. */
export function avatarStoragePath(
  publicUrl: string | null | undefined,
  userId: string,
): string | null {
  if (!publicUrl?.trim()) return null;
  const marker = "/storage/v1/object/public/avatars/";
  const idx = publicUrl.indexOf(marker);
  if (idx < 0) return null;
  const path = publicUrl.slice(idx + marker.length).split("?")[0];
  if (!path.startsWith(`${userId}/`)) return null;
  return path;
}
