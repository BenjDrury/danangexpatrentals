"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { listingPriceLabel, type Apartment, type Area } from "types";
import { StatusChip } from "@/components/StatusChip";
import { CopyButton } from "@/components/CopyButton";
import { ListingImage } from "@/components/ListingImage";
import { Button, PageHeader, Section, Tabs } from "@/components/ui";
import { isListingLiveStatus } from "@/lib/listing-status";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { ListingDealRow, PartnerContact } from "@/lib/data/listings";
import { confirmListingValidity } from "../actions";
import { ListingForm } from "../ListingForm";
import { ListingGallery } from "./ListingGallery";
import { ListingPhotosEditor } from "./ListingPhotosEditor";
import { StatusToggle } from "./StatusToggle";
import { PostComposer } from "./PostComposer";
import { DeleteListingButton } from "./DeleteListingButton";
import { ListingDealsPanel } from "./ListingDealsPanel";

export type ListingTab = "overview" | "details" | "photos" | "deals" | "promote";

const TABS: ListingTab[] = ["overview", "details", "photos", "deals", "promote"];

function normalizeTab(raw: string | null): ListingTab {
  if (raw && (TABS as string[]).includes(raw)) return raw as ListingTab;
  return "overview";
}

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
  areas: Pick<Area, "id" | "name">[];
  estateCompanyId: string;
  usdVndRate: number;
  initialTab?: string | null;
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

export function ListingWorkspace({
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
  areas,
  estateCompanyId,
  usdVndRate,
  initialTab,
}: Props) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = normalizeTab(searchParams.get("tab") ?? initialTab ?? null);
  const [pending, startTransition] = useTransition();

  const validityLabel =
    formatValidityDate(listing.last_validity_check, locale) ?? t("listings.neverChecked");
  const availableFromLabel = formatAvailableFrom(listing.available_from, locale);
  const isLive = isListingLiveStatus(listing.status) && !stale;
  const photoCount =
    (listing.main_image ? 1 : 0) + (listing.images?.filter(Boolean).length ?? 0);
  const contactDeals = deals.filter((d) => d.contact_id).length;

  function setTab(next: ListingTab) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "overview") params.delete("tab");
    else params.set("tab", next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function confirmAvailable() {
    startTransition(async () => {
      await confirmListingValidity(listing.id, "available");
    });
  }

  const tabItems = [
    { id: "overview" as const, label: t("workspace.tab.overview") },
    { id: "details" as const, label: t("workspace.tab.details") },
    {
      id: "photos" as const,
      label: t("workspace.tab.photos"),
      badge: photoCount > 0 ? photoCount : null,
    },
    {
      id: "deals" as const,
      label: t("workspace.tab.deals"),
      badge: contactDeals > 0 ? contactDeals : null,
    },
    {
      id: "promote" as const,
      label: t("workspace.tab.promote"),
      badge: bump ? "!" : null,
    },
  ];

  return (
    <div className="space-y-4 animate-fade-up">
      <PageHeader
        back={
          <Link
            href="/listings"
            className="mb-1 inline-block text-sm font-medium text-ocean hover:text-ocean-deep"
          >
            {t("listings.back")}
          </Link>
        }
        title={
          <span className="inline-flex flex-wrap items-center gap-2">
            <span>{listing.title}</span>
            <StatusChip status={listing.status} />
            {stale ? (
              <span className="rounded bg-coral-soft px-1.5 py-0.5 text-xs font-semibold text-coral">
                {t("listings.stale")}
              </span>
            ) : null}
            {bump && !stale ? (
              <span className="text-xs font-semibold text-ocean">{t("listings.needsBump")}</span>
            ) : null}
          </span>
        }
        subtitle={
          <>
            {listingPriceLabel(listing)}
            {areaName ? ` · ${areaName}` : ""}
            {` · ${listing.bedrooms} BR`}
            {listing.size_sqm != null ? ` · ${listing.size_sqm} m²` : ""}
          </>
        }
        actions={<DeleteListingButton listingId={listing.id} />}
      />

      <Tabs
        items={tabItems}
        value={tab}
        onChange={setTab}
        ariaLabel={t("workspace.tabsAria")}
      />

      <div
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        className="min-h-[12rem] pt-1"
      >
        {tab === "overview" ? (
          <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
            <div className="space-y-4">
              {stale || bump ? (
                <Section
                  title={stale ? t("listings.stale") : t("listings.needsBump")}
                  description={
                    stale
                      ? t("listings.validityStaleHint")
                      : t("workspace.bumpHint")
                  }
                >
                  <div className="flex flex-wrap gap-2">
                    {stale ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={pending}
                        onClick={confirmAvailable}
                      >
                        {t("feed.validity.confirmAvailable")}
                      </Button>
                    ) : null}
                    {bump ? (
                      <Button
                        href={`/listings/${listing.id}?tab=promote`}
                        variant="secondary"
                        size="sm"
                      >
                        {t("workspace.openPromote")}
                      </Button>
                    ) : null}
                  </div>
                </Section>
              ) : null}

              {isLive ? (
                <section className="rounded-lg border border-palm/25 bg-palm-soft/40 px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="inline-flex items-center gap-2 text-sm font-semibold text-palm">
                        <span className="size-1.5 rounded-full bg-palm" aria-hidden />
                        {t("listings.liveBadge")}
                      </p>
                      <p className="mt-0.5 text-sm text-muted">{t("listings.liveHint")}</p>
                    </div>
                    <CopyButton
                      text={publicUrl}
                      label={t("listings.copyPublicLink")}
                      copiedLabel={t("listings.linkCopied")}
                    />
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    <li className="min-w-0">
                      <p className="text-[0.65rem] font-medium uppercase tracking-wide text-muted">
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
                        <p className="text-[0.65rem] font-medium uppercase tracking-wide text-muted">
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

              {listing.description ? (
                <p className="max-w-2xl text-sm leading-relaxed text-muted">
                  {listing.description}
                </p>
              ) : null}

              {listing.partner_notes ? (
                <p className="rounded-md border border-dashed border-line bg-sand/50 px-3 py-2 text-sm text-muted">
                  <span className="font-medium text-charcoal">{t("listings.notes")} </span>
                  {listing.partner_notes}
                </p>
              ) : null}
            </div>

            <aside className="space-y-4">
              <Section title={t("status.label")}>
                <StatusToggle
                  listingId={listing.id}
                  status={listing.status}
                  isAdmin={isAdmin}
                  rejectionNote={listing.live_rejection_note}
                />
              </Section>

              <Section title={t("workspace.summary")}>
                <dl className="space-y-2 text-sm">
                  {availableFromLabel ? (
                    <div>
                      <dt className="text-xs text-muted">{t("listings.availableFrom")}</dt>
                      <dd className="font-medium text-charcoal">{availableFromLabel}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="text-xs text-muted">{t("listings.lastValidityCheck")}</dt>
                    <dd className="font-medium text-charcoal">{validityLabel}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">{t("workspace.photoCount")}</dt>
                    <dd className="font-medium text-charcoal">{photoCount}</dd>
                  </div>
                </dl>
                <div className="mt-3 flex flex-col gap-1.5">
                  <Button
                    href={`/listings/${listing.id}?tab=details`}
                    variant="secondary"
                    size="sm"
                    className="w-full"
                  >
                    {t("workspace.editDetails")}
                  </Button>
                  <Button
                    href={`/listings/${listing.id}?tab=photos`}
                    variant="ghost"
                    size="sm"
                    className="w-full"
                  >
                    {t("workspace.managePhotos")}
                  </Button>
                </div>
              </Section>

              {listing.main_image ? (
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-sand lg:hidden">
                  <ListingImage
                    src={listing.main_image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                </div>
              ) : null}
            </aside>
          </div>
        ) : null}

        {tab === "details" ? (
          <div className="max-w-2xl">
            <ListingForm
              areas={areas}
              estateCompanyId={estateCompanyId}
              listing={listing}
              isAdmin={isAdmin}
              usdVndRate={usdVndRate}
              includePhotos={false}
            />
          </div>
        ) : null}

        {tab === "photos" ? (
          <div className="max-w-3xl">
            <ListingPhotosEditor
              listingId={listing.id}
              estateCompanyId={estateCompanyId}
              mainImage={listing.main_image}
              images={listing.images}
            />
          </div>
        ) : null}

        {tab === "deals" ? (
          <div className="max-w-2xl">
            <ListingDealsPanel
              listingId={listing.id}
              deals={deals}
              availableContacts={availableContacts}
            />
          </div>
        ) : null}

        {tab === "promote" ? (
          <div className="max-w-2xl">
            <PostComposer listingId={listing.id} initialCaption={caption} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
