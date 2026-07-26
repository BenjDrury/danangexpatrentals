import { Resend } from "resend";
import {
  RESEND_FROM_EMAIL,
  RESEND_REPLY_TO_EMAIL,
} from "backend";

let client: Resend | null | undefined;

export function getResendClient(): Resend | null {
  if (client !== undefined) return client;
  const key = process.env.RESEND_API_KEY?.trim();
  client = key ? new Resend(key) : null;
  return client;
}

export async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<{ error?: string; ok?: boolean }> {
  const resend = getResendClient();
  if (!resend) {
    return { error: "Server missing RESEND_API_KEY." };
  }

  const { error } = await resend.emails.send({
    from: RESEND_FROM_EMAIL,
    replyTo: RESEND_REPLY_TO_EMAIL,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });

  if (error) return { error: error.message };
  return { ok: true };
}
