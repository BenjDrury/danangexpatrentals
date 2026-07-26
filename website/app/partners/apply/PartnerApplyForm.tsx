"use client";

import { useActionState } from "react";
import { capture } from "@/lib/analytics";
import {
  submitPartnerApplication,
  type PartnerApplicationState,
} from "@/app/actions/partner-application";
import { PARTNERS_WHATSAPP_URL } from "@/app/lib/contact-links";
import { TrackedLink } from "@/app/components/TrackedLink";

const initialState: PartnerApplicationState = { ok: false, error: "" };

const inputClass =
  "w-full rounded-quieter border border-line bg-foam px-4 py-3 text-charcoal placeholder:text-muted/60 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/15 transition";

export function PartnerApplyForm() {
  const [state, formAction, isPending] = useActionState(
    async (_: PartnerApplicationState, formData: FormData) => {
      const result = await submitPartnerApplication(formData);
      if (result.ok) {
        capture("partner_application_submitted", {
          has_company: !!String(formData.get("company_name") || "").trim(),
          has_role: !!String(formData.get("role") || "").trim(),
          has_areas: !!String(formData.get("areas") || "").trim(),
          has_inventory_note: !!String(formData.get("inventory_note") || "").trim(),
          source: "partner_apply_form",
        });
      } else {
        capture("partner_application_submit_failed", {
          error: result.error,
          source: "partner_apply_form",
        });
      }
      return result;
    },
    initialState,
  );

  if (state.ok) {
    return (
      <div className="rounded-soft bg-palm-soft px-6 py-10 text-center">
        <p className="font-display text-xl font-semibold text-charcoal">
          Thanks — we’ll be in touch within a day or two.
        </p>
        <p className="mt-2 text-muted">
          If it looks like a fit, we’ll follow up on WhatsApp or email about Partner Studio access.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.ok === false && state.error && (
        <p className="rounded-quieter bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-charcoal">
          Your name <span className="text-ocean">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          autoComplete="name"
          placeholder="e.g. Minh Nguyen"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-charcoal">
          Email <span className="text-ocean">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@agency.com"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="whatsapp" className="mb-1.5 block text-sm font-medium text-charcoal">
          WhatsApp number <span className="text-ocean">*</span>
        </label>
        <input
          type="text"
          id="whatsapp"
          name="whatsapp"
          required
          autoComplete="tel"
          placeholder="e.g. +84 912 345 678"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="company_name" className="mb-1.5 block text-sm font-medium text-charcoal">
          Company / agency <span className="text-muted">(optional)</span>
        </label>
        <input
          type="text"
          id="company_name"
          name="company_name"
          autoComplete="organization"
          placeholder="e.g. Da Nang Homes"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-charcoal">
          You are <span className="text-muted">(optional)</span>
        </label>
        <select id="role" name="role" defaultValue="" className={inputClass}>
          <option value="" disabled>
            Select…
          </option>
          <option value="agent">Real estate agent</option>
          <option value="owner">Property owner</option>
          <option value="property_manager">Property manager</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label htmlFor="areas" className="mb-1.5 block text-sm font-medium text-charcoal">
          Areas you cover <span className="text-muted">(optional)</span>
        </label>
        <input
          type="text"
          id="areas"
          name="areas"
          placeholder="e.g. An Thuong, My Khe, Son Tra"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="inventory_note" className="mb-1.5 block text-sm font-medium text-charcoal">
          Tell us about your inventory <span className="text-muted">(optional)</span>
        </label>
        <textarea
          id="inventory_note"
          name="inventory_note"
          rows={4}
          placeholder="Roughly how many apartments, typical price range, short vs long stays…"
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="mt-2 rounded-quieter bg-ocean px-6 py-3.5 text-base font-semibold text-white transition hover:bg-ocean-deep disabled:opacity-60"
      >
        {isPending ? "Sending…" : "Submit application"}
      </button>
      <p className="text-center text-sm text-muted">
        We reply within a few days. No spam.
        {PARTNERS_WHATSAPP_URL ? (
          <>
            {" "}
            Prefer chat?{" "}
            <TrackedLink
              href={PARTNERS_WHATSAPP_URL}
              event="partners_whatsapp_clicked"
              eventProps={{ source: "partner_apply_form" }}
              className="font-medium text-ocean transition hover:text-ocean-deep"
            >
              Message on WhatsApp
            </TrackedLink>
          </>
        ) : null}
      </p>
    </form>
  );
}
