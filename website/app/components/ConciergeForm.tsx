"use client";

import { useActionState } from "react";
import { capture } from "@/lib/analytics";
import { submitLead, type LeadState } from "@/app/actions/lead";

const initialState: LeadState = { ok: false, error: "" };

const inputClass =
  "w-full rounded-quieter border border-line bg-foam px-4 py-3 text-charcoal placeholder:text-muted/60 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/15 transition";

type ConciergeFormProps = {
  initialPreferredArea?: string;
  initialAreaId?: string;
  initialApartmentId?: string;
  listingTitle?: string;
  listingPriceLabel?: string;
};

export function ConciergeForm({
  initialPreferredArea = "",
  initialAreaId,
  initialApartmentId,
  listingTitle,
  listingPriceLabel,
}: ConciergeFormProps = {}) {
  const [state, formAction, isPending] = useActionState(
    async (_: LeadState, formData: FormData) => {
      const result = await submitLead(formData);
      if (result.ok) {
        capture("lead_submitted", {
          budget_range: String(formData.get("budget_range") || "") || null,
          length_of_stay: String(formData.get("length_of_stay") || "") || null,
          preferred_area: String(formData.get("preferred_area") || "") || null,
          has_move_date: !!formData.get("move_date"),
          has_email: true,
          has_whatsapp: !!String(formData.get("whatsapp") || "").trim(),
          has_apartment_id: !!formData.get("apartment_id"),
          has_area_id: !!formData.get("area_id"),
          source: initialApartmentId ? "concierge_form_listing" : "concierge_form",
        });
      } else {
        capture("lead_submit_failed", {
          error: result.error,
          source: initialApartmentId ? "concierge_form_listing" : "concierge_form",
        });
      }
      return result;
    },
    initialState
  );

  if (state.ok) {
    return (
      <div className="rounded-soft bg-palm-soft px-6 py-10 text-center">
        <p className="font-display text-xl font-semibold text-charcoal">
          Thanks — we’ll be in touch within 24 hours.
        </p>
        <p className="mt-2 text-muted">
          {listingTitle
            ? "Watch for an email about this apartment."
            : "Watch for an email from us."}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {listingTitle ? (
        <div className="rounded-quieter border border-ocean/20 bg-ocean/5 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-ocean">
            Requesting this home
          </p>
          <p className="mt-1 font-medium text-charcoal">{listingTitle}</p>
          {listingPriceLabel || initialPreferredArea ? (
            <p className="mt-0.5 text-sm text-muted">
              {[initialPreferredArea, listingPriceLabel].filter(Boolean).join(" · ")}
            </p>
          ) : null}
        </div>
      ) : null}

      {state.ok === false && state.error && (
        <p className="rounded-quieter bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {state.error}
        </p>
      )}
      {!listingTitle ? (
        <div>
          <label htmlFor="budget_range" className="mb-1.5 block text-sm font-medium text-charcoal">
            Budget range
          </label>
          <input
            type="text"
            id="budget_range"
            name="budget_range"
            placeholder="e.g. $300–500/month"
            className={inputClass}
          />
        </div>
      ) : null}
      <div>
        <label htmlFor="move_date" className="mb-1.5 block text-sm font-medium text-charcoal">
          When do you need it?
        </label>
        <input
          type="text"
          id="move_date"
          name="move_date"
          placeholder="e.g. ASAP, next month, flexible"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="length_of_stay" className="mb-1.5 block text-sm font-medium text-charcoal">
          How long will you stay?
        </label>
        <input
          type="text"
          id="length_of_stay"
          name="length_of_stay"
          placeholder="e.g. 1–3 months, 6 months, 1 year+"
          className={inputClass}
        />
      </div>
      {!listingTitle ? (
        <div>
          <label htmlFor="preferred_area" className="mb-1.5 block text-sm font-medium text-charcoal">
            Preferred neighbourhood <span className="text-muted">(optional)</span>
          </label>
          <input
            type="text"
            id="preferred_area"
            name="preferred_area"
            defaultValue={initialPreferredArea}
            placeholder="e.g. An Thuong, My Khe"
            className={inputClass}
          />
        </div>
      ) : (
        <input type="hidden" name="preferred_area" value={initialPreferredArea} />
      )}
      {initialAreaId && <input type="hidden" name="area_id" value={initialAreaId} />}
      {initialApartmentId && (
        <input type="hidden" name="apartment_id" value={initialApartmentId} />
      )}
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-charcoal">
          Email <span className="text-ocean">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          placeholder="you@example.com"
          className={inputClass}
          autoComplete="email"
        />
      </div>
      <div>
        <label htmlFor="whatsapp" className="mb-1.5 block text-sm font-medium text-charcoal">
          WhatsApp number <span className="text-muted">(optional)</span>
        </label>
        <input
          type="text"
          id="whatsapp"
          name="whatsapp"
          placeholder="e.g. +84 912 345 678"
          className={inputClass}
          autoComplete="tel"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="mt-2 rounded-quieter bg-ocean px-6 py-3.5 text-base font-semibold text-white transition hover:bg-ocean-deep disabled:opacity-60"
      >
        {isPending
          ? "Sending…"
          : listingTitle
            ? "Send request"
            : "Send me apartment options"}
      </button>
      <p className="text-center text-sm text-muted">
        We reply within 24h. No spam. No obligation.
      </p>
    </form>
  );
}
