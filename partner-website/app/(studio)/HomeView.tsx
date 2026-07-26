"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { listingPriceLabel } from "types";
import type { HomeFeedItem } from "@/lib/listing-validity";
import { confirmListingValidity } from "./listings/actions";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import posthog from "posthog-js";
import { ListingImage } from "@/components/ListingImage";
import { Button, PageHeader } from "@/components/ui";

type Props = {
  displayName: string | null;
  feed: HomeFeedItem[];
  listingsEmpty: boolean;
};

function ValidityCard({ item }: { item: Extract<HomeFeedItem, { type: "validity" }> }) {
  const { t } = useLocale();
  const [pending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const { listing, daysSinceCheck, stale } = item;

  function act(outcome: "available" | "reserved" | "rented") {
    setMenuOpen(false);
    startTransition(async () => {
      await confirmListingValidity(listing.id, outcome);
      posthog.capture("listing_validity_confirmed", { listing_id: listing.id, outcome });
    });
  }

  const daysLabel =
    daysSinceCheck == null
      ? t("feed.validity.neverChecked")
      : t("feed.validity.daysAgo", { days: daysSinceCheck });

  return (
    <article
      className={`flex gap-3 overflow-hidden rounded-lg border bg-white/80 transition ${
        stale ? "border-coral/35" : "border-line/80"
      }`}
    >
      <div className="relative hidden h-auto w-20 shrink-0 bg-sand sm:block">
        {listing.main_image ? (
          <ListingImage
            src={listing.main_image}
            alt=""
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 px-3 py-3 sm:pr-4">
        <div className="flex flex-wrap items-center gap-2">
          {stale ? (
            <span className="rounded bg-coral-soft px-1.5 py-0.5 text-[0.65rem] font-semibold text-coral">
              {t("feed.validity.staleBadge")}
            </span>
          ) : (
            <span className="rounded bg-palm-soft px-1.5 py-0.5 text-[0.65rem] font-semibold text-palm">
              {t("feed.validity.needsCheckBadge")}
            </span>
          )}
          <span className="text-xs text-muted">{daysLabel}</span>
        </div>
        <div>
          <h3 className="font-display text-base font-semibold text-charcoal">
            <Link href={`/listings/${listing.id}`} className="hover:text-ocean">
              {listing.title}
            </Link>
          </h3>
          <p className="mt-0.5 text-sm text-muted">
            {listingPriceLabel(listing)}
            {listing.bedrooms != null ? ` · ${listing.bedrooms} BR` : ""}
          </p>
          <p className="mt-1.5 text-sm text-charcoal/90">
            {stale ? t("feed.validity.stalePrompt") : t("feed.validity.prompt")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => act("available")}
            className="rounded-md bg-ocean px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-ocean-deep disabled:opacity-60"
          >
            {t("feed.validity.confirmAvailable")}
          </button>
          <div className="relative">
            <button
              type="button"
              disabled={pending}
              onClick={() => setMenuOpen((o) => !o)}
              className="rounded-md border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-muted transition hover:border-ocean/40 hover:text-ocean disabled:opacity-60"
              aria-expanded={menuOpen}
            >
              {t("feed.validity.moreActions")}
            </button>
            {menuOpen ? (
              <div className="absolute left-0 z-10 mt-1 min-w-[10rem] rounded-md border border-line bg-white py-1 shadow-md">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => act("reserved")}
                  className="block w-full px-3 py-1.5 text-left text-xs font-medium text-charcoal hover:bg-foam"
                >
                  {t("feed.validity.markReserved")}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => act("rented")}
                  className="block w-full px-3 py-1.5 text-left text-xs font-medium text-coral hover:bg-foam"
                >
                  {t("feed.validity.markRented")}
                </button>
              </div>
            ) : null}
          </div>
          <Link
            href={`/listings/${listing.id}`}
            className="px-2 py-1.5 text-xs font-medium text-muted transition hover:text-ocean"
          >
            {t("feed.validity.openListing")}
          </Link>
        </div>
      </div>
    </article>
  );
}

export function HomeView({ displayName, feed, listingsEmpty }: Props) {
  const { t } = useLocale();
  const name = displayName?.trim() || t("home.thereFallback");
  const caughtUp = !listingsEmpty && feed.length === 0;

  return (
    <div className="space-y-6">
      <section className="animate-fade-up">
        <PageHeader
          title={t("home.welcome", { name })}
          subtitle={t("home.intro")}
          actions={
            !listingsEmpty ? (
              <Button href="/listings" variant="secondary" size="sm">
                {t("home.viewListings")}
              </Button>
            ) : null
          }
        />
      </section>

      <section className="animate-fade-up-delay space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-charcoal">
            {t("feed.title")}
          </h2>
          {feed.length > 0 ? (
            <span className="text-xs font-medium text-muted">
              {t("feed.count", { count: feed.length })}
            </span>
          ) : null}
        </div>

        {listingsEmpty ? (
          <div className="rounded-lg border border-dashed border-line bg-white/50 px-5 py-8 text-center">
            <h3 className="font-display text-lg font-semibold text-charcoal">
              {t("home.emptyTitle")}
            </h3>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">{t("home.emptyBody")}</p>
            <Button href="/listings/new" size="sm" className="mt-4">
              {t("home.createFirst")}
            </Button>
          </div>
        ) : caughtUp ? (
          <div className="rounded-lg border border-palm/20 bg-palm-soft/40 px-5 py-8 text-center">
            <h3 className="font-display text-lg font-semibold text-charcoal">
              {t("feed.caughtUpTitle")}
            </h3>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">{t("feed.caughtUpBody")}</p>
            <Button href="/listings" variant="secondary" size="sm" className="mt-4">
              {t("feed.caughtUpCta")}
            </Button>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {feed.map((item) => {
              if (item.type === "validity") {
                return (
                  <li key={`validity-${item.listing.id}`}>
                    <ValidityCard item={item} />
                  </li>
                );
              }
              return null;
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
