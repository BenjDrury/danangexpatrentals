"use server";

import { getServiceRoleClient } from "@/lib/supabase/server";
import {
  generateAuthLoginLink,
  getPartnerAppUrl,
  sendMagicLoginEmail,
} from "@/lib/email/auth-links";
import { AUTH_RATE_LIMITED } from "@/lib/auth-errors";

function safeNext(next: string | null | undefined): string {
  if (!next) return "/";
  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/";
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return "/";
  return trimmed;
}

/**
 * Generate a magic login link and email it via Resend (not Supabase SMTP).
 * Always returns a generic success to avoid account enumeration.
 */
export async function requestMagicLink(input: {
  email: string;
  next?: string;
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

  const siteUrl = await getPartnerAppUrl();
  const nextPath = safeNext(input.next);
  const redirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`;

  const generated = await generateAuthLoginLink(service, email, redirectTo, {
    existingOnly: true,
  });

  if (generated.error === AUTH_RATE_LIMITED) {
    return { error: AUTH_RATE_LIMITED };
  }

  if (generated.link) {
    const sent = await sendMagicLoginEmail({
      to: email,
      actionLink: generated.link.actionLink,
      appName: "Partner Studio",
    });
    if (sent.error) return { error: sent.error };
  }

  // Generic success whether or not the account exists (not_found → ok).
  return { ok: true };
}
