"use client";

import { useState, useTransition } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Button, Section, inputClass } from "@/components/ui";
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
    <Section title={t("composer.title")} description={t("composer.subtitle")}>
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        rows={10}
        className={`${inputClass} font-sans leading-relaxed`}
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <CopyButton
          text={caption}
          label={t("composer.copyCaption")}
          copiedLabel={t("composer.copied")}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const result = await savePostDraft(listingId, caption);
              setMessage(result.error ?? t("composer.draftSaved"));
            });
          }}
        >
          {t("composer.saveDraft")}
        </Button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const result = await bumpListing(listingId);
              setMessage(result.error ?? t("composer.markedBumped"));
            });
          }}
          className="rounded-md bg-palm px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {t("composer.markBumped")}
        </button>
      </div>

      {message && (
        <p className="mt-2 text-sm text-palm" role="status">
          {message}
        </p>
      )}
    </Section>
  );
}
