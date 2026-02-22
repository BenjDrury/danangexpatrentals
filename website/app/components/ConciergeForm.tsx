"use client";

import { useActionState } from "react";
import { submitLead, type LeadState } from "@/app/actions/lead";

const initialState: LeadState = { ok: false, error: "" };

export function ConciergeForm() {
  const [state, formAction, isPending] = useActionState(
    async (_: LeadState, formData: FormData) => submitLead(formData),
    initialState
  );

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <p className="text-lg font-medium text-emerald-800">
          Thanks! We&apos;ll send you apartment options within 24 hours.
        </p>
        <p className="mt-2 text-emerald-700">Check your WhatsApp.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.ok === false && state.error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-800">{state.error}</p>
      )}
      <div>
        <label htmlFor="budget_range" className="mb-1 block text-sm font-medium text-stone-700">
          Budget range
        </label>
        <input
          type="text"
          id="budget_range"
          name="budget_range"
          placeholder="e.g. $300–500/month"
          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        />
      </div>
      <div>
        <label htmlFor="move_date" className="mb-1 block text-sm font-medium text-stone-700">
          Move date
        </label>
        <input
          type="text"
          id="move_date"
          name="move_date"
          placeholder="e.g. March 2025"
          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        />
      </div>
      <div>
        <label htmlFor="length_of_stay" className="mb-1 block text-sm font-medium text-stone-700">
          Length of stay
        </label>
        <input
          type="text"
          id="length_of_stay"
          name="length_of_stay"
          placeholder="e.g. 6 months, 1 year"
          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        />
      </div>
      <div>
        <label htmlFor="preferred_area" className="mb-1 block text-sm font-medium text-stone-700">
          Preferred area <span className="text-stone-400">(optional)</span>
        </label>
        <input
          type="text"
          id="preferred_area"
          name="preferred_area"
          placeholder="e.g. An Thuong, My Khe"
          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        />
      </div>
      <div>
        <label htmlFor="whatsapp" className="mb-1 block text-sm font-medium text-stone-700">
          WhatsApp number <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="whatsapp"
          name="whatsapp"
          required
          placeholder="e.g. +84 912 345 678"
          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        />
      </div>
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-stone-700">
          Email <span className="text-stone-400">(optional)</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="you@example.com"
          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="mt-2 rounded-xl bg-amber-500 px-6 py-4 text-lg font-semibold text-stone-900 transition hover:bg-amber-400 disabled:opacity-60"
      >
        {isPending ? "Sending…" : "👉 Send me apartment options"}
      </button>
      <p className="text-center text-sm text-stone-500">
        We reply within 24h. No spam. No obligation.
      </p>
    </form>
  );
}
