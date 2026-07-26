import { headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendTransactionalEmail } from "@/lib/email/resend";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function getAdminAppUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_ADMIN_URL?.replace(/\/$/, "");
  if (configured) return configured;

  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  if (host) return `${proto}://${host}`.replace(/\/$/, "");

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, "");
  }

  return "http://localhost:3001";
}

export async function generateMagicLoginLink(
  service: SupabaseClient,
  emailRaw: string,
  redirectTo: string,
): Promise<{ actionLink?: string; error?: string }> {
  const email = normalizeEmail(emailRaw);
  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }

  const { data, error } = await service.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });

  const actionLink = data?.properties?.action_link;
  if (error || !actionLink) {
    return { error: error?.message ?? "not_found" };
  }
  return { actionLink };
}

export async function sendMagicLoginEmail(input: {
  to: string;
  actionLink: string;
}): Promise<{ error?: string; ok?: boolean }> {
  const subject = "Your Admin login link";
  const text = [
    "Sign in to Da Nang Expat Rentals Admin:",
    input.actionLink,
    "",
    "This link expires soon. If you didn’t request it, you can ignore this email.",
  ].join("\n");
  const html = `
    <p>Sign in to <strong>Da Nang Expat Rentals Admin</strong>:</p>
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
