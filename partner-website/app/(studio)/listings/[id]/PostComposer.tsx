"use client";

import { useState, useTransition } from "react";
import { CopyButton } from "@/components/CopyButton";
import { bumpListing, savePostDraft } from "../actions";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function PostComposer({
  listingId,
  initialCaption,
}: {
  listingId: string;
  initialCaption: string;
}) {
  const [caption, setCaption] = useState(initialCaption);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { t } = useLocale();

  return (
    <section className="space-y-4 rounded-soft border border-line/80 bg-white/75 p-5 sm:p-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-charcoal">{t("composer.title")}</h2>
        <p className="mt-1 text-sm text-muted">{t("composer.subtitle")}</p>
      </div>

      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        rows={12}
        className="w-full rounded-quieter border border-line bg-foam/60 px-3.5 py-3 font-sans text-sm leading-relaxed text-charcoal outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20"
      />

      <div className="flex flex-wrap gap-2">
        <CopyButton
          text={caption}
          label={t("composer.copyCaption")}
          copiedLabel={t("composer.copied")}
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const result = await savePostDraft(listingId, caption);
              setMessage(result.error ?? t("composer.draftSaved"));
            });
          }}
          className="rounded-quieter border border-line bg-white px-3.5 py-2 text-sm font-medium text-charcoal transition hover:border-ocean/40 hover:text-ocean disabled:opacity-50"
        >
          {t("composer.saveDraft")}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const result = await bumpListing(listingId);
              setMessage(result.error ?? t("composer.markedBumped"));
            });
          }}
          className="rounded-quieter bg-palm px-3.5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {t("composer.markBumped")}
        </button>
      </div>

      {message && (
        <p className="text-sm text-palm" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
