"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CopyButton } from "@/components/CopyButton";
import { Button, Section } from "@/components/ui";
import type { FacebookGroupOption } from "@/lib/data/facebook-groups";
import type { ListingFacebookBatchSummary } from "@/lib/data/facebook-posts";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { capture } from "@/lib/analytics";
import {
  bumpListing,
  clearListingFacebookHistory,
  savePostDraft,
} from "../actions";
import { FacebookPublishOverlay } from "./FacebookPublishOverlay";

function formatPostedAt(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function PostComposer({
  listingId,
  initialCaption,
  mainImage,
  images,
  facebookConnected,
  facebookPageName,
  facebookGroups,
  facebookHistory,
}: {
  listingId: string;
  initialCaption: string;
  mainImage?: string | null;
  images?: string[] | null;
  facebookConnected: boolean;
  facebookPageName: string | null;
  facebookGroups: FacebookGroupOption[];
  facebookHistory: ListingFacebookBatchSummary[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { t, locale } = useLocale();

  useEffect(() => {
    if (searchParams.get("publish") === "1") {
      setOpen(true);
    }
  }, [searchParams]);

  function closeOverlay() {
    setOpen(false);
    if (searchParams.get("publish") === "1") {
      router.replace(`/listings/${listingId}?tab=promote`);
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Section
        title={t("composer.fb.title")}
        description={t("composer.fb.promoteSubtitle")}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => {
              setOpen(true);
              capture("facebook_publish_overlay_opened", { listing_id: listingId });
            }}
          >
            {t("composer.fb.publishCta")}
          </Button>
          {!facebookConnected ? (
            <p className="text-sm text-muted">
              <Link href="/settings" className="text-ocean underline-offset-2 hover:underline">
                {t("composer.fb.goSettings")}
              </Link>
              {" · "}
              {t("composer.fb.promotePageOptional")}
            </p>
          ) : (
            <p className="text-sm text-muted">
              {t("composer.fb.promoteConnected", {
                page: facebookPageName?.trim() || t("composer.fb.pageFallback"),
                count: String(
                  facebookGroups.filter((g) => g.kind === "default").length || 3,
                ),
              })}
            </p>
          )}
        </div>
      </Section>

      <Section
        title={t("composer.fb.history.title")}
        description={t("composer.fb.history.subtitle")}
      >
        {facebookHistory.length === 0 ? (
          <p className="text-sm text-muted">{t("composer.fb.history.empty")}</p>
        ) : (
          <ul className="space-y-3">
            {facebookHistory.map((batch) => (
              <li
                key={batch.batchId}
                className="rounded-quieter border border-line/70 bg-white/70 px-3 py-2.5"
              >
                <p className="text-sm font-medium text-charcoal">
                  {formatPostedAt(batch.postedAt, locale)}
                  <span className="ml-2 text-xs font-normal text-muted">
                    {t("composer.fb.history.photos", {
                      count: String(batch.photoCount),
                    })}
                  </span>
                </p>
                <ul className="mt-1.5 space-y-0.5 text-sm text-muted">
                  {batch.destinations.map((d, i) => (
                    <li key={`${batch.batchId}-${i}`}>
                      {d.destination === "page" ? (
                        d.permalink ? (
                          <a
                            href={d.permalink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-ocean underline-offset-2 hover:underline"
                          >
                            {d.label}
                          </a>
                        ) : (
                          d.label
                        )
                      ) : d.groupUrl ? (
                        <a
                          href={d.groupUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline-offset-2 hover:underline"
                        >
                          {d.label}
                        </a>
                      ) : (
                        d.label
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
        {facebookHistory.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const result = await clearListingFacebookHistory(listingId, 21);
                  setMessage(
                    result.error ??
                      t("composer.fb.history.clearedOld", {
                        count: String(result.cleared ?? 0),
                      }),
                  );
                  setError(result.error ?? null);
                  if (!result.error) router.refresh();
                });
              }}
            >
              {t("composer.fb.history.clearOld")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const result = await clearListingFacebookHistory(listingId);
                  setMessage(
                    result.error ??
                      t("composer.fb.history.clearedAll", {
                        count: String(result.cleared ?? 0),
                      }),
                  );
                  setError(result.error ?? null);
                  if (!result.error) router.refresh();
                });
              }}
            >
              {t("composer.fb.history.clearAll")}
            </Button>
          </div>
        ) : null}
      </Section>

      <Section title={t("composer.title")} description={t("composer.subtitle")}>
        <div className="flex flex-wrap gap-2">
          <CopyButton
            text={initialCaption}
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
                const result = await savePostDraft(listingId, initialCaption);
                setMessage(result.error ?? t("composer.draftSaved"));
                setError(result.error ?? null);
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
                setError(result.error ?? null);
                if (!result.error) capture("listing_bumped", { listing_id: listingId });
              });
            }}
            className="rounded-md bg-palm px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {t("composer.markBumped")}
          </button>
        </div>
        {(error || message) && (
          <p
            className={`mt-2 text-sm ${error ? "text-coral-deep" : "text-palm"}`}
            role="status"
          >
            {error ?? message}
          </p>
        )}
      </Section>

      <FacebookPublishOverlay
        open={open}
        onClose={closeOverlay}
        listingId={listingId}
        initialCaption={initialCaption}
        mainImage={mainImage}
        images={images}
        facebookConnected={facebookConnected}
        facebookPageName={facebookPageName}
        groups={facebookGroups}
      />
    </div>
  );
}
