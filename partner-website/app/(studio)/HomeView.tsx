"use client";

import Link from "next/link";
import { useTransition } from "react";
import { listingPriceLabel } from "types";
import type { HomeFeedItem } from "@/lib/listing-validity";
import { confirmListingValidity } from "./listings/actions";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { ListingImage } from "@/components/ListingImage";

type Props = {
  displayName: string | null;
  feed: HomeFeedItem[];
  listingsEmpty: boolean;
};

function ValidityCard({ item }: { item: Extract<HomeFeedItem, { type: "validity" }> }) {
  const { t } = useLocale();
  const [pending, startTransition] = useTransition();
  const { listing, daysSinceCheck, stale } = item;

  function act(outcome: "available" | "reserved" | "rented") {
    startTransition(async () => {
      await confirmListingValidity(listing.id, outcome);
    });
  }

  const daysLabel =
    daysSinceCheck == null
      ? t("feed.validity.neverChecked")
      : t("feed.validity.daysAgo", { days: daysSinceCheck });

  return (
    <article
      className={`overflow-hidden rounded-soft border bg-white/80 shadow-[0_10px_36px_rgba(42,42,40,0.04)] transition ${
        stale ? "border-coral/35" : "border-line/80"
      }`}
    >
      <div className="flex flex-col sm:flex-row">
        <div className="relative aspect-[16/10] shrink-0 bg-sand sm:aspect-auto sm:w-40 sm:self-stretch">
          {listing.main_image ? (
            <ListingImage
              src={listing.main_image}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 160px"
            />
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-4 p-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {stale ? (
                <span className="rounded-md bg-coral-soft px-2 py-0.5 text-xs font-semibold text-coral">
                  {t("feed.validity.staleBadge")}
                </span>
              ) : (
                <span className="rounded-md bg-palm-soft px-2 py-0.5 text-xs font-semibold text-palm">
                  {t("feed.validity.needsCheckBadge")}
                </span>
              )}
              <span className="text-xs text-muted">{daysLabel}</span>
            </div>
            <h3 className="mt-2 font-display text-lg font-semibold text-charcoal">
              <Link href={`/listings/${listing.id}`} className="hover:text-ocean">
                {listing.title}
              </Link>
            </h3>
            <p className="mt-1 text-sm text-muted">
              {listingPriceLabel(listing)}
              {listing.bedrooms != null ? ` · ${listing.bedrooms} BR` : ""}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-charcoal/90">
              {stale ? t("feed.validity.stalePrompt") : t("feed.validity.prompt")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => act("available")}
              className="rounded-quieter bg-ocean px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-ocean-deep disabled:opacity-60"
            >
              {t("feed.validity.confirmAvailable")}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => act("reserved")}
              className="rounded-quieter border border-line bg-white px-3.5 py-2 text-sm font-semibold text-charcoal transition hover:border-ocean/40 hover:text-ocean disabled:opacity-60"
            >
              {t("feed.validity.markReserved")}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => act("rented")}
              className="rounded-quieter border border-line bg-white px-3.5 py-2 text-sm font-semibold text-charcoal transition hover:border-coral/40 hover:text-coral disabled:opacity-60"
            >
              {t("feed.validity.markRented")}
            </button>
            <Link
              href={`/listings/${listing.id}`}
              className="rounded-quieter px-3 py-2 text-sm font-medium text-muted transition hover:text-ocean"
            >
              {t("feed.validity.openListing")}
            </Link>
          </div>
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
    <div className="space-y-10">
      <section className="animate-fade-up">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-charcoal sm:text-4xl">
          {t("home.welcome", { name })}
        </h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-muted">{t("home.intro")}</p>
      </section>

      <section className="animate-fade-up-delay space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-charcoal">
            {t("feed.title")}
          </h2>
          {feed.length > 0 ? (
            <span className="text-xs font-medium text-muted">
              {t("feed.count", { count: feed.length })}
            </span>
          ) : null}
        </div>

        {listingsEmpty ? (
          <div className="rounded-soft border border-dashed border-line bg-white/50 px-6 py-10 text-center">
            <h3 className="font-display text-xl font-semibold text-charcoal">
              {t("home.emptyTitle")}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{t("home.emptyBody")}</p>
            <Link
              href="/listings/new"
              className="mt-6 inline-flex rounded-quieter bg-ocean px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-deep"
            >
              {t("home.createFirst")}
            </Link>
          </div>
        ) : caughtUp ? (
          <div className="rounded-soft border border-palm/20 bg-palm-soft/40 px-6 py-10 text-center">
            <h3 className="font-display text-xl font-semibold text-charcoal">
              {t("feed.caughtUpTitle")}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{t("feed.caughtUpBody")}</p>
            <Link
              href="/listings"
              className="mt-6 inline-flex rounded-quieter border border-line bg-white/80 px-5 py-2.5 text-sm font-semibold text-charcoal transition hover:border-ocean/35 hover:text-ocean"
            >
              {t("feed.caughtUpCta")}
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
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
