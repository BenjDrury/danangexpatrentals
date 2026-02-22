"use server";

import { LEAD_NOTIFY_EMAIL, RESEND_FROM_EMAIL } from "backend";
import { supabase } from "@/lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export type LeadState = { ok: true } | { ok: false; error: string };

export async function submitLead(formData: FormData): Promise<LeadState> {
  const budgetRange = formData.get("budget_range") as string;
  const moveDate = formData.get("move_date") as string;
  const lengthOfStay = formData.get("length_of_stay") as string;
  const preferredArea = (formData.get("preferred_area") as string) || null;
  const whatsapp = (formData.get("whatsapp") as string)?.trim();
  const email = (formData.get("email") as string)?.trim() || null;

  if (!whatsapp) {
    return { ok: false, error: "WhatsApp number is required." };
  }

  const lead = {
    budget_range: budgetRange || null,
    move_date: moveDate || null,
    length_of_stay: lengthOfStay || null,
    preferred_area: preferredArea,
    whatsapp,
    email,
    source: "website",
  };

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const { error } = await supabase.from("leads").insert(lead);
    if (error) {
      console.error("Supabase lead insert error:", error);
      return { ok: false, error: "Failed to save. Please try again or message us on WhatsApp." };
    }
  }

  if (resend && LEAD_NOTIFY_EMAIL && process.env.RESEND_API_KEY) {
    try {
      await resend.emails.send({
        from: RESEND_FROM_EMAIL,
        to: LEAD_NOTIFY_EMAIL,
        subject: `New lead: ${whatsapp} – ${budgetRange || "no budget"} – ${moveDate || "no date"}`,
        text: [
          `WhatsApp: ${whatsapp}`,
          email ? `Email: ${email}` : null,
          `Budget: ${budgetRange || "—"}`,
          `Move date: ${moveDate || "—"}`,
          `Length of stay: ${lengthOfStay || "—"}`,
          preferredArea ? `Area: ${preferredArea}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
      });
    } catch (e) {
      console.error("Resend notification error:", e);
    }
  }

  return { ok: true };
}
