"use client";

import { useState, useTransition } from "react";
import { deleteListing } from "../actions";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function DeleteListingButton({ listingId }: { listingId: string }) {
  const { t } = useLocale();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => {
          setError(null);
          setConfirming(true);
        }}
        className="rounded-quieter border border-coral/35 bg-coral-soft/50 px-4 py-2 text-sm font-semibold text-coral-deep transition hover:border-coral hover:bg-coral-soft"
      >
        {t("listings.delete")}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <p className="max-w-xs text-right text-sm text-muted">{t("listings.deleteConfirm")}</p>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
          className="rounded-quieter border border-line bg-white px-4 py-2 text-sm font-medium text-charcoal transition hover:border-ocean/40 hover:text-ocean disabled:opacity-50"
        >
          {t("listings.deleteCancel")}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await deleteListing(listingId);
              if (result?.error) {
                setError(result.error);
              }
            });
          }}
          className="rounded-quieter bg-coral px-4 py-2 text-sm font-semibold text-white transition hover:bg-coral-deep disabled:opacity-50"
        >
          {pending ? t("listings.deleting") : t("listings.deletePermanent")}
        </button>
      </div>
      {error ? (
        <p className="max-w-xs text-right text-sm text-coral-deep" role="alert">
          {t("listings.deleteError")}
        </p>
      ) : null}
    </div>
  );
}
