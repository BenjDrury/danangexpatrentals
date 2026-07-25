"use server";

import {
  acceptPartnerInvite,
  createAccountAndAcceptInvite,
} from "@/lib/data/team";
import { createClient } from "@/lib/supabase/server";

export async function acceptInviteAction(
  token: string,
): Promise<{ error?: string; ok?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to accept this invite." };

  const result = await acceptPartnerInvite({
    token,
    userId: user.id,
    userEmail: user.email,
  });
  if (result.error) return { error: result.error };
  return { ok: true };
}

export async function createAccountFromInviteAction(params: {
  token: string;
  password: string;
  displayName?: string;
}): Promise<{ error?: string; email?: string; ok?: boolean }> {
  return createAccountAndAcceptInvite(params);
}
