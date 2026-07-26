"use client";

import Link from "next/link";
import type { Apartment, Area } from "types";
import { ListingForm } from "./ListingForm";
import { PageHeader } from "@/components/ui";
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
    <div className="mx-auto max-w-2xl space-y-5 animate-fade-up">
      <PageHeader
        back={
          <Link href="/listings" className="mb-1 inline-block text-sm font-medium text-ocean hover:text-ocean-deep">
            {t("listings.back")}
          </Link>
        }
        title={t("listings.newTitle")}
        subtitle={t("listings.newSubtitle")}
      />
      <ListingForm
        areas={areas}
        estateCompanyId={estateCompanyId}
        isAdmin={isAdmin}
        usdVndRate={usdVndRate}
      />
    </div>
  );
}

/** @deprecated Edit is now `/listings/[id]?tab=details` — kept for any residual imports. */
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
    <div className="mx-auto max-w-2xl space-y-5 animate-fade-up">
      <PageHeader
        back={
          <Link
            href={`/listings/${listing.id}`}
            className="mb-1 inline-block text-sm font-medium text-ocean hover:text-ocean-deep"
          >
            {t("listings.backToListing")}
          </Link>
        }
        title={t("listings.editTitle")}
        subtitle={listing.title}
      />
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
