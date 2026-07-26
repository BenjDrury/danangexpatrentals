"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";
import { Button, Section, inputClass } from "@/components/ui";
import {
  bumpListing,
  publishListingToFacebook,
  savePostDraft,
} from "../actions";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { capture } from "@/lib/analytics";
import { FACEBOOK_POST_MAX_PHOTOS } from "@/lib/facebook-publish";

function listingImageUrls(mainImage: string | null | undefined, images: string[] | null | undefined) {
  return [
    ...new Set(
      [mainImage, ...(images ?? [])]
        .map((u) => (typeof u === "string" ? u.trim() : ""))
        .filter(Boolean),
    ),
  ].slice(0, FACEBOOK_POST_MAX_PHOTOS);
}

export function PostComposer({
  listingId,
  initialCaption,
  mainImage,
  images,
  facebookConnected,
  facebookPageName,
}: {
  listingId: string;
  initialCaption: string;
  mainImage?: string | null;
  images?: string[] | null;
  facebookConnected: boolean;
  facebookPageName: string | null;
}) {
  const allImages = useMemo(
    () => listingImageUrls(mainImage, images),
    [mainImage, images],
  );
  const [caption, setCaption] = useState(initialCaption);
  const [selected, setSelected] = useState<string[]>(allImages);
  const [step, setStep] = useState<"edit" | "confirm">("edit");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permalink, setPermalink] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { t } = useLocale();

  function removeImage(url: string) {
    setSelected((prev) => prev.filter((u) => u !== url));
    setStep("edit");
    setError(null);
  }

  function restoreImages() {
    setSelected(allImages);
    setError(null);
  }

  function goConfirm() {
    setError(null);
    setMessage(null);
    if (!caption.trim()) {
      setError(t("composer.errorCaption"));
      return;
    }
    setStep("confirm");
  }

  function postNow() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await publishListingToFacebook({
        listingId,
        caption,
        imageUrls: selected,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setPermalink(result.permalink ?? null);
      setMessage(t("composer.posted"));
      setStep("edit");
      capture("facebook_listing_posted", {
        listing_id: listingId,
        photo_count: selected.length,
      });
    });
  }

  return (
    <div className="space-y-6">
      <Section
        title={t("composer.fb.title")}
        description={
          facebookConnected
            ? t("composer.fb.subtitle", {
                page: facebookPageName?.trim() || t("composer.fb.pageFallback"),
              })
            : t("composer.fb.subtitleDisconnected")
        }
      >
        {!facebookConnected ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">{t("composer.fb.connectHint")}</p>
            <Button href="/settings" variant="primary" size="sm">
              {t("composer.fb.goSettings")}
            </Button>
          </div>
        ) : step === "edit" ? (
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-charcoal">
                  {t("composer.fb.photos", { count: String(selected.length) })}
                </p>
                {selected.length < allImages.length ? (
                  <button
                    type="button"
                    onClick={restoreImages}
                    className="text-xs font-medium text-ocean underline-offset-2 hover:underline"
                  >
                    {t("composer.fb.restorePhotos")}
                  </button>
                ) : null}
              </div>
              {selected.length === 0 ? (
                <p className="rounded-quieter bg-sand px-3 py-2 text-sm text-muted">
                  {t("composer.fb.noPhotos")}
                </p>
              ) : (
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {selected.map((url) => (
                    <li key={url} className="group relative aspect-square overflow-hidden rounded-quieter bg-sand">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(url)}
                        className="absolute right-1 top-1 rounded-md bg-charcoal/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white opacity-100 transition hover:bg-coral sm:opacity-0 sm:group-hover:opacity-100"
                        aria-label={t("composer.fb.removePhoto")}
                      >
                        {t("composer.fb.removePhoto")}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-xs text-muted">{t("composer.fb.photosHint")}</p>
            </div>

            <div>
              <label htmlFor="fb-caption" className="mb-1.5 block text-sm font-medium text-charcoal">
                {t("composer.fb.captionLabel")}
              </label>
              <textarea
                id="fb-caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={10}
                className={`${inputClass} font-sans leading-relaxed`}
              />
            </div>

            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={pending}
              onClick={goConfirm}
            >
              {t("composer.fb.continue")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-quieter border border-sand bg-foam px-4 py-3">
              <p className="text-sm font-semibold text-charcoal">
                {t("composer.fb.confirmTitle", {
                  page: facebookPageName?.trim() || t("composer.fb.pageFallback"),
                })}
              </p>
              <p className="mt-1 text-sm text-muted">
                {t("composer.fb.confirmPhotos", { count: String(selected.length) })}
              </p>
            </div>

            {selected.length > 0 ? (
              <ul className="flex gap-2 overflow-x-auto pb-1">
                {selected.map((url) => (
                  <li
                    key={url}
                    className="h-16 w-16 shrink-0 overflow-hidden rounded-quieter bg-sand"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </li>
                ))}
              </ul>
            ) : null}

            <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-quieter bg-sand px-3 py-2 text-xs leading-relaxed text-charcoal">
              {caption}
            </pre>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={pending}
                onClick={postNow}
              >
                {pending ? t("composer.fb.posting") : t("composer.fb.postNow")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={pending}
                onClick={() => setStep("edit")}
              >
                {t("composer.fb.back")}
              </Button>
            </div>
          </div>
        )}

        {(error || message) && (
          <p
            className={`mt-3 text-sm ${error ? "text-coral-deep" : "text-palm"}`}
            role="status"
          >
            {error ?? message}
            {permalink && !error ? (
              <>
                {" "}
                <a
                  href={permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline underline-offset-2"
                >
                  {t("composer.fb.viewPost")}
                </a>
              </>
            ) : null}
          </p>
        )}
      </Section>

      <Section title={t("composer.title")} description={t("composer.subtitle")}>
        <div className="flex flex-wrap gap-2">
          <CopyButton
            text={caption}
            label={t("composer.copyCaption")}
            copiedLabel={t("composer.copied")}
            event="post_caption_copied"
            eventProps={{ listing_id: listingId }}
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
                setError(result.error ? result.error : null);
                if (!result.error) capture("post_draft_saved", { listing_id: listingId });
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
                setError(result.error ? result.error : null);
                if (!result.error) capture("listing_bumped", { listing_id: listingId });
              });
            }}
            className="rounded-md bg-palm px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {t("composer.markBumped")}
          </button>
        </div>
        {!facebookConnected ? (
          <p className="mt-2 text-xs text-muted">
            <Link href="/settings" className="text-ocean underline-offset-2 hover:underline">
              {t("composer.fb.goSettings")}
            </Link>
          </p>
        ) : null}
      </Section>
    </div>
  );
}
