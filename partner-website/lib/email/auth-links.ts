import { headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendTransactionalEmail } from "@/lib/email/resend";
import { AUTH_RATE_LIMITED, isAuthRateLimitError } from "@/lib/auth-errors";

export { AUTH_RATE_LIMITED, isAuthRateLimitError } from "@/lib/auth-errors";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Canonical Partner Studio origin for auth redirects and invite links. */
export async function getPartnerAppUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_PARTNER_URL?.replace(/\/$/, "");
  if (configured) return configured;

  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  if (host) return `${proto}://${host}`.replace(/\/$/, "");

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, "");
  }

  return "http://localhost:3002";
}

export type GeneratedAuthLink = {
  actionLink: string;
  type: "magiclink" | "invite";
};

/**
 * Build a one-click Supabase auth URL (does not send email).
 * Existing users → magiclink; new users → invite (creates auth user).
 */
export async function generateAuthLoginLink(
  service: SupabaseClient,
  emailRaw: string,
  redirectTo: string,
  opts?: { existingOnly?: boolean },
): Promise<{ link?: GeneratedAuthLink; error?: string }> {
  const email = normalizeEmail(emailRaw);
  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }

  const magic = await service.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });

  const magicLink = magic.data?.properties?.action_link;
  if (!magic.error && magicLink) {
    return { link: { actionLink: magicLink, type: "magiclink" } };
  }

  // Never hide rate limits behind "account not found" — callers must back off.
  if (isAuthRateLimitError(magic.error)) {
    return { error: AUTH_RATE_LIMITED };
  }

  if (opts?.existingOnly) {
    // Don't reveal whether the account exists.
    return { error: "not_found" };
  }

  const invite = await service.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo },
  });

  const inviteLink = invite.data?.properties?.action_link;
  if (!invite.error && inviteLink) {
    return { link: { actionLink: inviteLink, type: "invite" } };
  }

  if (isAuthRateLimitError(invite.error)) {
    return { error: AUTH_RATE_LIMITED };
  }

  return {
    error:
      magic.error?.message ||
      invite.error?.message ||
      "Could not create login link.",
  };
}

export async function sendMagicLoginEmail(input: {
  to: string;
  actionLink: string;
  appName?: string;
}): Promise<{ error?: string; ok?: boolean }> {
  const appName = input.appName ?? "Partner Studio";
  const subject = `Your ${appName} login link`;
  const text = [
    `Sign in to ${appName}:`,
    input.actionLink,
    "",
    "This link expires soon. If you didn’t request it, you can ignore this email.",
  ].join("\n");
  const html = `
    <p>Sign in to <strong>${escapeHtml(appName)}</strong>:</p>
    <p><a href="${escapeAttr(input.actionLink)}">Log in with this link</a></p>
    <p style="color:#666;font-size:13px">This link expires soon. If you didn’t request it, you can ignore this email.</p>
  `.trim();

  return sendTransactionalEmail({
    to: input.to,
    subject,
    text,
    html,
  });
}

export async function sendPartnerInviteEmail(input: {
  to: string;
  companyName: string;
  /** One-click auth URL that lands on the invite page after session is set. */
  loginLink: string;
  /** Plain invite page URL (password create / accept fallback). */
  inviteUrl: string;
}): Promise<{ error?: string; ok?: boolean }> {
  const company = input.companyName.trim() || "your team";
  const subject = `You're invited to ${company} on Partner Studio`;
  const text = [
    `You've been invited to Partner Studio for ${company}.`,
    "",
    "Accept your invite (signs you in):",
    input.loginLink,
    "",
    "Or open the invite page directly:",
    input.inviteUrl,
    "",
    "If you didn’t expect this, you can ignore this email.",
  ].join("\n");
  const html = `
    <p>You’ve been invited to Partner Studio for <strong>${escapeHtml(company)}</strong>.</p>
    <p><a href="${escapeAttr(input.loginLink)}"><strong>Accept invite &amp; sign in</strong></a></p>
    <p style="color:#666;font-size:13px">
      Or open the invite page:
      <a href="${escapeAttr(input.inviteUrl)}">${escapeHtml(input.inviteUrl)}</a>
    </p>
    <p style="color:#666;font-size:13px">If you didn’t expect this, you can ignore this email.</p>
  `.trim();

  return sendTransactionalEmail({
    to: input.to,
    subject,
    text,
    html,
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, "&#39;");
}
