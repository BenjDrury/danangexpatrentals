"use client";

import { useState, useTransition } from "react";
import { deleteContact } from "../actions";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function DeleteContactButton({ contactId }: { contactId: string }) {
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
        {t("contacts.delete")}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <p className="max-w-xs text-right text-sm text-muted">{t("contacts.deleteConfirm")}</p>
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
          {t("contacts.cancel")}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await deleteContact(contactId);
              if (result?.error) setError(result.error);
            });
          }}
          className="rounded-quieter bg-coral px-4 py-2 text-sm font-semibold text-white transition hover:bg-coral-deep disabled:opacity-50"
        >
          {pending ? t("contacts.deleting") : t("contacts.deletePermanent")}
        </button>
      </div>
      {error ? (
        <p className="max-w-xs text-right text-sm text-coral-deep" role="alert">
          {t("contacts.deleteError")}
        </p>
      ) : null}
    </div>
  );
}
