"use server";

import { revalidatePath } from "next/cache";
import { requirePartner } from "@/lib/auth";
import {
  addCompanyFacebookGroupUrl,
  removeCompanyFacebookGroup,
} from "@/lib/data/facebook-groups";
import { disconnectCompanyIntegration } from "@/lib/data/integrations";
import { createPartnerInvite, revokePartnerInvite } from "@/lib/data/team";

export async function disconnectFacebook(): Promise<{ error?: string; ok?: boolean }> {
  const session = await requirePartner();
  if (!session) return { error: "Unauthorized." };

  const result = await disconnectCompanyIntegration(session.estateCompanyId, "facebook");
  if (result.error) return { error: result.error };

  revalidatePath("/settings");
  return { ok: true };
}

export async function addFacebookGroup(
  url: string,
): Promise<{ error?: string; ok?: boolean }> {
  const result = await addCompanyFacebookGroupUrl(url);
  if (result.error) return { error: result.error };
  revalidatePath("/settings");
  return { ok: true };
}

export async function removeFacebookGroup(
  linkId: string,
): Promise<{ error?: string; ok?: boolean }> {
  const result = await removeCompanyFacebookGroup(linkId);
  if (result.error) return { error: result.error };
  revalidatePath("/settings");
  return { ok: true };
}

export async function inviteTeamMember(
  email: string,
): Promise<{ error?: string; inviteUrl?: string; token?: string }> {
  const result = await createPartnerInvite(email);
  if (result.error) return { error: result.error };

  revalidatePath("/settings");
  return {
    inviteUrl: result.inviteUrl,
    token: result.invite?.token,
  };
}

export async function revokeTeamInvite(
  inviteId: string,
): Promise<{ error?: string; ok?: boolean }> {
  const result = await revokePartnerInvite(inviteId);
  if (result.error) return { error: result.error };
  revalidatePath("/settings");
  return { ok: true };
}
