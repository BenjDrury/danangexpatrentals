"use server";

import { getServiceRoleClient } from "@/lib/supabase/server";
import {
  generateMagicLoginLink,
  getAdminAppUrl,
  sendMagicLoginEmail,
} from "@/lib/email/auth-links";

/**
 * Generate a magic login link and email it via Resend (not Supabase SMTP).
 * Always returns a generic success to avoid account enumeration.
 */
export async function requestMagicLink(input: {
  email: string;
}): Promise<{ error?: string; ok?: boolean }> {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }

  const service = getServiceRoleClient();
  if (!service) {
    return {
      error:
        "Server missing SUPABASE_SERVICE_ROLE_KEY. Add it and restart to send login links.",
    };
  }

  if (!process.env.RESEND_API_KEY?.trim()) {
    return {
      error: "Server missing RESEND_API_KEY. Add it and restart to send login links.",
    };
  }

  const siteUrl = await getAdminAppUrl();
  const redirectTo = `${siteUrl}/auth/callback`;

  const generated = await generateMagicLoginLink(service, email, redirectTo);
  if (generated.actionLink) {
    const sent = await sendMagicLoginEmail({
      to: email,
      actionLink: generated.actionLink,
    });
    if (sent.error) return { error: sent.error };
  }

  return { ok: true };
}
