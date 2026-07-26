"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { deleteListing } from "../actions";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function DeleteListingButton({ listingId }: { listingId: string }) {
  const { t } = useLocale();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="danger"
        size="sm"
        onClick={() => {
          setError(null);
          setConfirming(true);
        }}
      >
        {t("listings.delete")}
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <p className="max-w-xs text-right text-xs text-muted">{t("listings.deleteConfirm")}</p>
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
        >
          {t("listings.deleteCancel")}
        </Button>
        <Button
          type="button"
          variant="dangerSolid"
          size="sm"
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
        >
          {pending ? t("listings.deleting") : t("listings.deletePermanent")}
        </Button>
      </div>
      {error ? (
        <p className="max-w-xs text-right text-sm text-coral-deep" role="alert">
          {t("listings.deleteError")}
        </p>
      ) : null}
    </div>
  );
}
