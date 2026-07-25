"use client";

import Link from "next/link";
import type { Apartment, Area } from "types";
import { ListingForm } from "./ListingForm";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function NewListingView({
  areas,
  estateCompanyId,
  isAdmin,
  usdVndRate,
}: {
  areas: Pick<Area, "id" | "name">[];
  estateCompanyId: string;
  isAdmin?: boolean;
  usdVndRate: number;
}) {
  const { t } = useLocale();

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-up">
      <div>
        <Link href="/listings" className="text-sm font-medium text-ocean hover:text-ocean-deep">
          {t("listings.back")}
        </Link>
        <h1 className="mt-3 font-display text-3xl font-semibold text-charcoal">
          {t("listings.newTitle")}
        </h1>
        <p className="mt-2 text-muted">{t("listings.newSubtitle")}</p>
      </div>
      <ListingForm
        areas={areas}
        estateCompanyId={estateCompanyId}
        isAdmin={isAdmin}
        usdVndRate={usdVndRate}
      />
    </div>
  );
}

export function EditListingView({
  areas,
  estateCompanyId,
  listing,
  isAdmin,
  usdVndRate,
}: {
  areas: Pick<Area, "id" | "name">[];
  estateCompanyId: string;
  listing: Apartment;
  isAdmin?: boolean;
  usdVndRate: number;
}) {
  const { t } = useLocale();

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-up">
      <div>
        <Link
          href={`/listings/${listing.id}`}
          className="text-sm font-medium text-ocean hover:text-ocean-deep"
        >
          {t("listings.backToListing")}
        </Link>
        <h1 className="mt-3 font-display text-3xl font-semibold text-charcoal">
          {t("listings.editTitle")}
        </h1>
        <p className="mt-2 text-muted">{listing.title}</p>
      </div>
      <ListingForm
        areas={areas}
        estateCompanyId={estateCompanyId}
        listing={listing}
        isAdmin={isAdmin}
        usdVndRate={usdVndRate}
      />
    </div>
  );
}
