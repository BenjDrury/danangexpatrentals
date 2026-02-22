"use client";

import { useActionState } from "react";
import { submitLead, type LeadState } from "@/app/actions/lead";

const initialState: LeadState = { ok: false, error: "" };

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition";

type ConciergeFormProps = {
  /** Prefill preferred area (e.g. from /contact?preferred_area=An+Thuong) */
  initialPreferredArea?: string;
  /** Optional area ID for context (hidden input so we can include in notifications) */
  initialAreaId?: string;
  /** Optional apartment ID when requesting a specific listing (hidden input) */
  initialApartmentId?: string;
};

export function ConciergeForm({
  initialPreferredArea = "",
  initialAreaId,
  initialApartmentId,
}: ConciergeFormProps = {}) {
  const [state, formAction, isPending] = useActionState(
    async (_: LeadState, formData: FormData) => submitLead(formData),
    initialState
  );

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-teal-200 bg-teal-50 p-8 text-center">
        <p className="text-lg font-semibold text-teal-800">
          Thanks! We&apos;ll send you apartment options within 24 hours.
        </p>
        <p className="mt-2 text-teal-700">Check your WhatsApp.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.ok === false && state.error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="budget_range" className="mb-1.5 block text-sm font-medium text-slate-700">
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
      <div>
        <label htmlFor="move_date" className="mb-1.5 block text-sm font-medium text-slate-700">
          Move date
        </label>
        <input
          type="text"
          id="move_date"
          name="move_date"
          placeholder="e.g. March 2025"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="length_of_stay" className="mb-1.5 block text-sm font-medium text-slate-700">
          Length of stay
        </label>
        <input
          type="text"
          id="length_of_stay"
          name="length_of_stay"
          placeholder="e.g. 6 months, 1 year"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="preferred_area" className="mb-1.5 block text-sm font-medium text-slate-700">
          Preferred area <span className="text-slate-400">(optional)</span>
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
      {initialAreaId && (
        <input type="hidden" name="area_id" value={initialAreaId} />
      )}
      {initialApartmentId && (
        <input type="hidden" name="apartment_id" value={initialApartmentId} />
      )}
      <div>
        <label htmlFor="whatsapp" className="mb-1.5 block text-sm font-medium text-slate-700">
          WhatsApp number <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="whatsapp"
          name="whatsapp"
          required
          placeholder="e.g. +84 912 345 678"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
          Email <span className="text-slate-400">(optional)</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="you@example.com"
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="mt-2 rounded-xl bg-teal-500 px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-teal-500/25 transition hover:bg-teal-600 disabled:opacity-60"
      >
        {isPending ? "Sending…" : "Send me apartment options"}
      </button>
      <p className="text-center text-sm text-slate-500">
        We reply within 24h. No spam. No obligation.
      </p>
    </form>
  );
}
