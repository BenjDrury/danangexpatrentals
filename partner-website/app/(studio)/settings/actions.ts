"use server";

import { revalidatePath } from "next/cache";
import { requirePartner } from "@/lib/auth";
import { captureServer } from "@/lib/analytics-server";
import {
  addCompanyFacebookGroupUrl,
  removeCompanyFacebookGroup,
} from "@/lib/data/facebook-groups";
import { disconnectCompanyIntegration } from "@/lib/data/integrations";
import {
  avatarStoragePath,
  updatePartnerProfile,
} from "@/lib/data/profile";
import { createPartnerInvite, revokePartnerInvite } from "@/lib/data/team";
import { createClient } from "@/lib/supabase/server";

export async function savePartnerProfile(input: {
  displayName: string;
  phone: string;
  whatsapp: string;
  contactEmail: string;
  bio: string;
  avatarUrl: string;
}): Promise<{ error?: string; ok?: boolean }> {
  const session = await requirePartner();
  if (!session) return { error: "Unauthorized." };

  // Always update the signed-in user's profile (not the impersonated company).
  const previousAvatar = session.profile.avatar_url ?? null;
  const nextAvatar = input.avatarUrl.trim() || null;

  const result = await updatePartnerProfile(session.user.id, {
    display_name: input.displayName,
    phone: input.phone,
    whatsapp: input.whatsapp,
    contact_email: input.contactEmail,
    bio: input.bio,
    avatar_url: nextAvatar,
  });
  if (result.error) return { error: result.error };

  if (previousAvatar && previousAvatar !== nextAvatar) {
    const oldPath = avatarStoragePath(previousAvatar, session.user.id);
    if (oldPath) {
      const supabase = await createClient();
      await supabase.storage.from("avatars").remove([oldPath]);
    }
  }

  await captureServer(
    "partner_profile_updated",
    {
      has_avatar: Boolean(nextAvatar),
      has_phone: Boolean(input.phone.trim()),
      has_whatsapp: Boolean(input.whatsapp.trim()),
      has_contact_email: Boolean(input.contactEmail.trim()),
      has_bio: Boolean(input.bio.trim()),
    },
    session,
  );

  revalidatePath("/settings");
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
