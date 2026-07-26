"use server";

import {
  LEAD_NOTIFY_EMAIL,
  RESEND_FROM_EMAIL,
  RESEND_REPLY_TO_EMAIL,
} from "backend";
import { supabase } from "@/lib/supabase";
import { Resend } from "resend";
import { captureServer } from "@/lib/analytics-server";
import { WHATSAPP_URL } from "@/app/lib/contact-links";

const resend = new Resend(process.env.RESEND_API_KEY);

export type LeadState = { ok: true } | { ok: false; error: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function optionalUuid(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return UUID_RE.test(trimmed) ? trimmed : null;
}

function optionalAreaId(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= 64 ? trimmed : null;
}

export async function submitLead(formData: FormData): Promise<LeadState> {
  const budgetRange = formData.get("budget_range") as string;
  const moveDate = formData.get("move_date") as string;
  const lengthOfStay = formData.get("length_of_stay") as string;
  const preferredArea = (formData.get("preferred_area") as string) || null;
  const whatsapp = (formData.get("whatsapp") as string)?.trim();
  const email = (formData.get("email") as string)?.trim() || null;
  const apartmentId = optionalUuid(formData.get("apartment_id"));
  const areaId = optionalAreaId(formData.get("area_id"));

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
    apartment_id: apartmentId,
    area_id: areaId,
    source: "website",
  };

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    let { error } = await supabase.from("leads").insert(lead);
    if (error && (apartmentId || areaId)) {
      const { apartment_id: _a, area_id: _b, ...legacyLead } = lead;
      const retry = await supabase.from("leads").insert(legacyLead);
      error = retry.error;
    }
    if (error) {
      console.error("Supabase lead insert error:", error);
      return {
        ok: false,
        error: WHATSAPP_URL
          ? "Failed to save. Please try again or message us on WhatsApp."
          : "Failed to save. Please try again.",
      };
    }
  }

  if (resend && LEAD_NOTIFY_EMAIL && process.env.RESEND_API_KEY) {
    try {
      await resend.emails.send({
        from: RESEND_FROM_EMAIL,
        replyTo: RESEND_REPLY_TO_EMAIL,
        to: LEAD_NOTIFY_EMAIL,
        subject: `New lead: ${whatsapp} – ${budgetRange || "no budget"} – ${moveDate || "no date"}`,
        text: [
          `WhatsApp: ${whatsapp}`,
          email ? `Email: ${email}` : null,
          `Budget: ${budgetRange || "—"}`,
          `Move date: ${moveDate || "—"}`,
          `Length of stay: ${lengthOfStay || "—"}`,
          preferredArea ? `Area: ${preferredArea}` : null,
          apartmentId ? `Listing: ${apartmentId}` : null,
          areaId ? `Area id: ${areaId}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
      });
    } catch (e) {
      console.error("Resend notification error:", e);
    }
  }

  await captureServer("lead_submitted_server", {
    budget_range: budgetRange || null,
    length_of_stay: lengthOfStay || null,
    preferred_area: preferredArea,
    has_move_date: !!moveDate,
    has_email: !!email,
    has_apartment_id: !!apartmentId,
    has_area_id: !!areaId,
    source: "website",
  });

  return { ok: true };
}
