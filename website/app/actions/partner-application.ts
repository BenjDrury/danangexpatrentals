"use server";

import { LEAD_NOTIFY_EMAIL, RESEND_FROM_EMAIL } from "backend";
import { supabase } from "@/lib/supabase";
import { Resend } from "resend";
import { captureServer } from "@/lib/analytics-server";
import { PARTNERS_WHATSAPP_URL } from "@/app/lib/contact-links";

const resend = new Resend(process.env.RESEND_API_KEY);

export type PartnerApplicationState = { ok: true } | { ok: false; error: string };

export async function submitPartnerApplication(
  formData: FormData,
): Promise<PartnerApplicationState> {
  const name = (formData.get("name") as string)?.trim() || "";
  const email = (formData.get("email") as string)?.trim() || "";
  const whatsapp = (formData.get("whatsapp") as string)?.trim() || "";
  const companyName = (formData.get("company_name") as string)?.trim() || null;
  const facebookPage = (formData.get("facebook_page") as string)?.trim() || null;
  const role = (formData.get("role") as string)?.trim() || null;
  const selectedAreas = formData
    .getAll("areas")
    .map((v) => String(v).trim())
    .filter(Boolean);
  const areas = selectedAreas.length > 0 ? selectedAreas.join(", ") : null;
  const inventoryNote = (formData.get("inventory_note") as string)?.trim() || null;

  if (!name) {
    return { ok: false, error: "Name is required." };
  }
  if (!email) {
    return { ok: false, error: "Email is required." };
  }
  if (!whatsapp) {
    return { ok: false, error: "WhatsApp number is required." };
  }

  const application = {
    name,
    email,
    whatsapp,
    company_name: companyName,
    facebook_page: facebookPage,
    role,
    areas,
    inventory_note: inventoryNote,
    source: "website",
  };

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const { error } = await supabase.from("partner_applications").insert(application);
    if (error) {
      console.error("Supabase partner application insert error:", error);
      return {
        ok: false,
        error: PARTNERS_WHATSAPP_URL
          ? "Failed to save. Please try again or message us on WhatsApp."
          : "Failed to save. Please try again.",
      };
    }
  }

  if (resend && LEAD_NOTIFY_EMAIL && process.env.RESEND_API_KEY) {
    try {
      await resend.emails.send({
        from: RESEND_FROM_EMAIL,
        to: LEAD_NOTIFY_EMAIL,
        subject: `Partner application: ${name}${companyName ? ` (${companyName})` : ""}`,
        text: [
          `Name: ${name}`,
          `Email: ${email}`,
          `WhatsApp: ${whatsapp}`,
          companyName ? `Company: ${companyName}` : null,
          facebookPage ? `Facebook page: ${facebookPage}` : null,
          role ? `Role: ${role}` : null,
          areas ? `Areas: ${areas}` : null,
          inventoryNote ? `Inventory: ${inventoryNote}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
      });
    } catch (e) {
      console.error("Resend partner application notification error:", e);
    }
  }

  await captureServer("partner_application_submitted_server", {
    has_company: !!companyName,
    has_facebook_page: !!facebookPage,
    has_role: !!role,
    has_areas: !!areas,
    areas_count: selectedAreas.length,
    has_inventory_note: !!inventoryNote,
    source: "website",
  });

  return { ok: true };
}
