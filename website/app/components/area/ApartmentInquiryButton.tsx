"use client";

import { useActionState, useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { capture } from "@/lib/analytics";
import { submitLead, type LeadState } from "@/app/actions/lead";

const initialState: LeadState = { ok: false, error: "" };

const inputClass =
  "w-full rounded-quieter border border-line bg-foam px-4 py-3 text-charcoal placeholder:text-muted/60 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/15 transition";

type Props = {
  apartmentId: string;
  apartmentTitle: string;
  priceLabel: string;
  areaId?: string;
  areaName?: string;
  className?: string;
};

export function ApartmentInquiryButton({
  apartmentId,
  apartmentTitle,
  priceLabel,
  areaId,
  areaName,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  const openOverlay = useCallback(() => {
    setOpen(true);
    capture("apartment_inquiry_clicked", {
      apartment_id: apartmentId,
      area_id: areaId ?? null,
      source: "apartment_detail",
    });
  }, [apartmentId, areaId]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  return (
    <>
      <button type="button" onClick={openOverlay} className={className}>
        Inquire about this apartment
      </button>

      {mounted &&
        open &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-charcoal/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={close}
          >
            <div
              className="max-h-[min(92dvh,40rem)] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-line bg-white px-5 py-4 sm:px-6">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-ocean">
                    Request this home
                  </p>
                  <h2
                    id={titleId}
                    className="mt-1 font-display text-lg font-semibold tracking-tight text-charcoal sm:text-xl"
                  >
                    {apartmentTitle}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {[areaName, priceLabel].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="flex size-10 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-muted transition hover:bg-sand hover:text-charcoal"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div className="px-5 py-5 sm:px-6 sm:py-6">
                <InquiryForm
                  apartmentId={apartmentId}
                  areaId={areaId}
                  areaName={areaName}
                  onDone={close}
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

function InquiryForm({
  apartmentId,
  areaId,
  areaName,
  onDone,
}: {
  apartmentId: string;
  areaId?: string;
  areaName?: string;
  onDone: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    async (_: LeadState, formData: FormData) => {
      const result = await submitLead(formData);
      if (result.ok) {
        capture("lead_submitted", {
          budget_range: null,
          length_of_stay: String(formData.get("length_of_stay") || "") || null,
          preferred_area: String(formData.get("preferred_area") || "") || null,
          has_move_date: !!formData.get("move_date"),
          has_email: !!formData.get("email"),
          has_apartment_id: true,
          has_area_id: !!formData.get("area_id"),
          source: "listing_inquiry_overlay",
        });
      } else {
        capture("lead_submit_failed", {
          error: result.error,
          source: "listing_inquiry_overlay",
        });
      }
      return result;
    },
    initialState
  );

  if (state.ok) {
    return (
      <div className="py-6 text-center">
        <p className="font-display text-xl font-semibold text-charcoal">
          Thanks — we’ll be in touch within 24 hours.
        </p>
        <p className="mt-2 text-muted">
          Watch for a WhatsApp message about this apartment.
        </p>
        <button
          type="button"
          onClick={onDone}
          className="mt-6 inline-flex rounded-quieter border border-line px-5 py-2.5 text-sm font-semibold text-charcoal transition hover:bg-sand"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-muted">
        A few details and we’ll check availability and next steps for this listing.
      </p>

      {state.ok === false && state.error ? (
        <p className="rounded-quieter bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {state.error}
        </p>
      ) : null}

      <input type="hidden" name="apartment_id" value={apartmentId} />
      {areaId ? <input type="hidden" name="area_id" value={areaId} /> : null}
      {areaName ? (
        <input type="hidden" name="preferred_area" value={areaName} />
      ) : null}

      <div>
        <label htmlFor="inquiry_move_date" className="mb-1.5 block text-sm font-medium text-charcoal">
          When do you need it?
        </label>
        <input
          type="text"
          id="inquiry_move_date"
          name="move_date"
          placeholder="e.g. ASAP, next month, flexible"
          className={inputClass}
          autoFocus
        />
      </div>

      <div>
        <label
          htmlFor="inquiry_length_of_stay"
          className="mb-1.5 block text-sm font-medium text-charcoal"
        >
          How long will you stay?
        </label>
        <input
          type="text"
          id="inquiry_length_of_stay"
          name="length_of_stay"
          placeholder="e.g. 1–3 months, 6 months, 1 year+"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="inquiry_whatsapp" className="mb-1.5 block text-sm font-medium text-charcoal">
          WhatsApp number <span className="text-ocean">*</span>
        </label>
        <input
          type="text"
          id="inquiry_whatsapp"
          name="whatsapp"
          required
          placeholder="e.g. +84 912 345 678"
          className={inputClass}
          autoComplete="tel"
        />
      </div>

      <div>
        <label htmlFor="inquiry_email" className="mb-1.5 block text-sm font-medium text-charcoal">
          Email <span className="text-muted">(optional)</span>
        </label>
        <input
          type="email"
          id="inquiry_email"
          name="email"
          placeholder="you@example.com"
          className={inputClass}
          autoComplete="email"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-1 rounded-quieter bg-ocean px-6 py-3.5 text-base font-semibold text-white transition hover:bg-ocean-deep disabled:opacity-60"
      >
        {isPending ? "Sending…" : "Send request"}
      </button>
      <p className="text-center text-sm text-muted">We reply within 24h. No spam.</p>
    </form>
  );
}
