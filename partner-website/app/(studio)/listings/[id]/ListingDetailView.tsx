"use client";

import Link from "next/link";
import { listingPriceLabel, type Apartment } from "types";
import { StatusChip } from "@/components/StatusChip";
import { CopyButton } from "@/components/CopyButton";
import { isListingLiveStatus } from "@/lib/listing-status";
import { ListingGallery } from "./ListingGallery";
import { StatusToggle } from "./StatusToggle";
import { PostComposer } from "./PostComposer";
import { DeleteListingButton } from "./DeleteListingButton";
import { ListingDealsPanel } from "./ListingDealsPanel";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { ListingDealRow, PartnerContact } from "@/lib/data/listings";

type Props = {
  listing: Apartment;
  areaName: string | null;
  publicUrl: string;
  areaPublicUrl: string | null;
  caption: string;
  bump: boolean;
  stale: boolean;
  isAdmin?: boolean;
  deals: ListingDealRow[];
  availableContacts: Pick<PartnerContact, "id" | "name">[];
};

function formatValidityDate(iso: string | null | undefined, locale: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAvailableFrom(iso: string | null | undefined, locale: string): string | null {
  if (!iso) return null;
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ListingDetailView({
  listing,
  areaName,
  publicUrl,
  areaPublicUrl,
  caption,
  bump,
  stale,
  isAdmin,
  deals,
  availableContacts,
}: Props) {
  const { t, locale } = useLocale();
  const validityLabel =
    formatValidityDate(listing.last_validity_check, locale) ?? t("listings.neverChecked");
  const availableFromLabel = formatAvailableFrom(listing.available_from, locale);
  const isLive = isListingLiveStatus(listing.status) && !stale;

  return (
    <div className="space-y-10 animate-fade-up">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/listings" className="text-sm font-medium text-ocean hover:text-ocean-deep">
            {t("listings.back")}
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-semibold text-charcoal">{listing.title}</h1>
            <StatusChip status={listing.status} />
            {stale && (
              <span className="rounded-md bg-coral-soft px-2 py-0.5 text-xs font-semibold text-coral">
                {t("listings.stale")}
              </span>
            )}
            {bump && !stale && (
              <span className="animate-soft-pulse text-xs font-semibold text-ocean">
                {t("listings.needsBump")}
              </span>
            )}
          </div>
          <p className="mt-2 text-muted">
            {listingPriceLabel(listing)}
            {areaName ? ` · ${areaName}` : ""}
            {` · ${listing.bedrooms} BR`}
            {listing.size_sqm != null ? ` · ${listing.size_sqm} m²` : ""}
          </p>
          {availableFromLabel ? (
            <p className="mt-2 text-sm text-muted">
              <span className="font-medium text-charcoal">{t("listings.availableFrom")} </span>
              {availableFromLabel}
            </p>
          ) : null}
          <p className="mt-2 text-sm text-muted">
            <span className="font-medium text-charcoal">{t("listings.lastValidityCheck")} </span>
            {validityLabel}
          </p>
          {stale ? (
            <p className="mt-2 max-w-xl text-sm text-coral">{t("listings.validityStaleHint")}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-start justify-end gap-2">
          <Link
            href={`/listings/${listing.id}/edit`}
            className="rounded-quieter border border-line bg-white px-4 py-2 text-sm font-semibold text-charcoal transition hover:border-ocean/40 hover:text-ocean"
          >
            {t("listings.edit")}
          </Link>
          <DeleteListingButton listingId={listing.id} />
        </div>
      </div>

      {isLive ? (
        <section className="rounded-soft border border-palm/25 bg-palm-soft/40 px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-palm">
                <span className="size-2 rounded-full bg-palm" aria-hidden />
                {t("listings.liveBadge")}
              </p>
              <p className="mt-1 max-w-xl text-sm text-muted">{t("listings.liveHint")}</p>
            </div>
            <CopyButton
              text={publicUrl}
              label={t("listings.copyPublicLink")}
              copiedLabel={t("listings.linkCopied")}
            />
          </div>
          <ul className="mt-4 space-y-2">
            <li className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                {t("listings.publicListingLink")}
              </p>
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-0.5 block truncate text-sm font-medium text-ocean underline-offset-2 hover:underline"
              >
                {publicUrl}
              </a>
            </li>
            {areaPublicUrl ? (
              <li className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  {t("listings.publicAreaLink")}
                  {areaName ? ` · ${areaName}` : ""}
                </p>
                <a
                  href={areaPublicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 block truncate text-sm font-medium text-ocean underline-offset-2 hover:underline"
                >
                  {areaPublicUrl}
                </a>
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}

      <ListingGallery
        listingId={listing.id}
        mainImage={listing.main_image}
        images={listing.images}
      />

      <div className="flex flex-wrap items-center gap-6">
        <StatusToggle
          listingId={listing.id}
          status={listing.status}
          isAdmin={isAdmin}
          rejectionNote={listing.live_rejection_note}
        />
      </div>

      {listing.description && (
        <p className="max-w-2xl text-base leading-relaxed text-muted">{listing.description}</p>
      )}

      {listing.partner_notes && (
        <p className="rounded-quieter border border-dashed border-line bg-sand/50 px-4 py-3 text-sm text-muted">
          <span className="font-medium text-charcoal">{t("listings.notes")} </span>
          {listing.partner_notes}
        </p>
      )}

      <ListingDealsPanel
        listingId={listing.id}
        deals={deals}
        availableContacts={availableContacts}
      />

      <PostComposer listingId={listing.id} initialCaption={caption} />
    </div>
  );
}
