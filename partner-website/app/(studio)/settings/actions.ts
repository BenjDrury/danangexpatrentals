"use server";

import { revalidatePath } from "next/cache";
import { requirePartner } from "@/lib/auth";
import { captureServer } from "@/lib/analytics-server";
import {
  addCompanyFacebookGroupUrl,
  removeCompanyFacebookGroup,
} from "@/lib/data/facebook-groups";
import { disconnectCompanyIntegration } from "@/lib/data/integrations";
import { updateEstateCompany } from "@/lib/data/company";
import { createPartnerInvite, revokePartnerInvite } from "@/lib/data/team";

export async function saveCompanySettings(input: {
  name: string;
  logoUrl?: string;
  contactPhone?: string;
  contactWhatsapp?: string;
  contactEmail?: string;
}): Promise<{ error?: string; ok?: boolean }> {
  const session = await requirePartner();
  if (!session) return { error: "Unauthorized." };

  const result = await updateEstateCompany(session.estateCompanyId, {
    name: input.name,
    logoUrl: input.logoUrl ?? "",
    contactPhone: input.contactPhone ?? "",
    contactWhatsapp: input.contactWhatsapp ?? "",
    contactEmail: input.contactEmail ?? "",
  });
  if (result.error) return { error: result.error };

  await captureServer(
    "partner_company_updated",
    {
      has_name: Boolean(input.name.trim()),
      has_logo: Boolean(input.logoUrl?.trim()),
      has_phone: Boolean(input.contactPhone?.trim()),
      has_whatsapp: Boolean(input.contactWhatsapp?.trim()),
      has_contact_email: Boolean(input.contactEmail?.trim()),
    },
    session,
  );

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function disconnectFacebook(): Promise<{ error?: string; ok?: boolean }> {
  const session = await requirePartner();
  if (!session) return { error: "Unauthorized." };

  const result = await disconnectCompanyIntegration(session.estateCompanyId, "facebook");
  if (result.error) return { error: result.error };

  await captureServer("facebook_integration_disconnected", {}, session);

  revalidatePath("/settings");
  return { ok: true };
}

export async function addFacebookGroup(
  url: string,
): Promise<{ error?: string; ok?: boolean }> {
  const session = await requirePartner();
  if (!session) return { error: "Unauthorized." };

  const result = await addCompanyFacebookGroupUrl(url);
  if (result.error) return { error: result.error };

  await captureServer("facebook_group_added", {}, session);

  revalidatePath("/settings");
  return { ok: true };
}

export async function removeFacebookGroup(
  linkId: string,
): Promise<{ error?: string; ok?: boolean }> {
  const session = await requirePartner();
  if (!session) return { error: "Unauthorized." };

  const result = await removeCompanyFacebookGroup(linkId);
  if (result.error) return { error: result.error };

  await captureServer("facebook_group_removed", {}, session);

  revalidatePath("/settings");
  return { ok: true };
}

export async function inviteTeamMember(
  email: string,
): Promise<{ error?: string; inviteUrl?: string; token?: string }> {
  const session = await requirePartner();
  if (!session) return { error: "Unauthorized." };

  const result = await createPartnerInvite(email);
  if (result.error) return { error: result.error };

  await captureServer("team_member_invited", {}, session);

  revalidatePath("/settings");
  return {
    inviteUrl: result.inviteUrl,
    token: result.invite?.token,
  };
}

export async function revokeTeamInvite(
  inviteId: string,
): Promise<{ error?: string; ok?: boolean }> {
  const session = await requirePartner();
  if (!session) return { error: "Unauthorized." };

  const result = await revokePartnerInvite(inviteId);
  if (result.error) return { error: result.error };

  await captureServer("team_invite_revoked", {}, session);

  revalidatePath("/settings");
  return { ok: true };
}
