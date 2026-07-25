"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { listingPriceLabel, type Apartment } from "types";
import { StatusChip } from "@/components/StatusChip";
import { ListingImage } from "@/components/ListingImage";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type ListingRelation = {
  contacts: { id: string; name: string }[];
  commissionDisplay: string | null;
};

type Props = {
  listings: Apartment[];
  relations: Record<string, ListingRelation>;
  areaNames: Record<string, string>;
  bumpIds: string[];
  staleIds: string[];
  justDeleted?: boolean;
};

function formatShortDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ListingsView({
  listings,
  relations,
  areaNames,
  bumpIds,
  staleIds,
  justDeleted,
}: Props) {
  const { t } = useLocale();
  const router = useRouter();
  const bumpSet = new Set(bumpIds);
  const staleSet = new Set(staleIds);

  useEffect(() => {
    if (!justDeleted) return;
    const timer = window.setTimeout(() => {
      router.replace("/listings");
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [justDeleted, router]);

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-charcoal">
            {t("listings.title")}
          </h1>
          <p className="mt-2 text-muted">{t("listings.subtitle")}</p>
        </div>
        <Link
          href="/listings/new"
          className="rounded-quieter bg-ocean px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-deep"
        >
          {t("home.addListing")}
        </Link>
      </div>

      {justDeleted ? (
        <p
          className="rounded-quieter border border-palm/25 bg-palm-soft/70 px-4 py-3 text-sm font-medium text-palm"
          role="status"
        >
          {t("listings.deleteSuccess")}
        </p>
      ) : null}

      {listings.length === 0 ? (
        <div className="rounded-soft border border-dashed border-line bg-white/50 px-6 py-12 text-center">
          <p className="text-muted">{t("listings.empty")}</p>
          <Link href="/listings/new" className="mt-4 inline-block text-sm font-semibold text-ocean">
            {t("listings.createOne")}
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-soft border border-line/80 bg-white/70 shadow-[0_10px_36px_rgba(42,42,40,0.03)]">
          <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line/80 bg-foam/70 text-[0.7rem] font-semibold uppercase tracking-[0.06em] text-muted">
                <th className="px-4 py-3 font-semibold">{t("listings.col.listing")}</th>
                <th className="px-3 py-3 font-semibold">{t("listings.col.status")}</th>
                <th className="px-3 py-3 font-semibold">{t("listings.col.price")}</th>
                <th className="px-3 py-3 font-semibold">{t("listings.col.details")}</th>
                <th className="px-3 py-3 font-semibold">{t("listings.col.commission")}</th>
                <th className="px-3 py-3 font-semibold">{t("listings.col.contact")}</th>
                <th className="px-4 py-3 font-semibold">{t("listings.col.updated")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {listings.map((apt) => {
                const bump = bumpSet.has(apt.id);
                const stale = staleSet.has(apt.id);
                const rel = relations[apt.id];
                const contacts = rel?.contacts ?? [];
                const primaryContact = contacts[0] ?? null;
                const extraContacts = Math.max(0, contacts.length - 1);
                const areaName = areaNames[apt.area_id] ?? null;
                const updated =
                  formatShortDate(apt.last_validity_check) ??
                  formatShortDate(apt.updated_at);

                return (
                  <tr
                    key={apt.id}
                    className={`transition hover:bg-foam/55 ${
                      stale ? "bg-coral-soft/25" : ""
                    }`}
                  >
                    <td className="px-4 py-3 align-middle">
                      <Link
                        href={`/listings/${apt.id}`}
                        className="group flex min-w-0 items-center gap-3"
                      >
                        <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-sand">
                          {apt.main_image ? (
                            <ListingImage
                              src={apt.main_image}
                              alt=""
                              fill
                              className="object-cover transition duration-500 ease-soft group-hover:scale-[1.04]"
                              sizes="64px"
                            />
                          ) : null}
                        </span>
                        <span className="min-w-0">
                          <span className="line-clamp-2 font-display text-[0.95rem] font-semibold text-charcoal group-hover:text-ocean">
                            {apt.title}
                          </span>
                          <span className="mt-0.5 flex flex-wrap gap-1.5">
                            {stale ? (
                              <span className="rounded-md bg-coral-soft px-1.5 py-0.5 text-[0.65rem] font-semibold text-coral">
                                {t("listings.stale")}
                              </span>
                            ) : null}
                            {bump && !stale ? (
                              <span className="rounded-md bg-ocean/10 px-1.5 py-0.5 text-[0.65rem] font-semibold text-ocean">
                                {t("listings.bump")}
                              </span>
                            ) : null}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-3 align-middle">
                      <Link href={`/listings/${apt.id}`} className="inline-flex">
                        <StatusChip status={apt.status} />
                      </Link>
                    </td>
                    <td className="px-3 py-3 align-middle">
                      <Link
                        href={`/listings/${apt.id}`}
                        className="whitespace-nowrap font-medium text-charcoal hover:text-ocean"
                      >
                        {listingPriceLabel(apt)}
                      </Link>
                    </td>
                    <td className="px-3 py-3 align-middle text-muted">
                      <Link href={`/listings/${apt.id}`} className="hover:text-ocean">
                        <span className="whitespace-nowrap">
                          {apt.bedrooms != null ? `${apt.bedrooms} BR` : "—"}
                          {apt.size_sqm != null ? ` · ${apt.size_sqm} m²` : ""}
                        </span>
                        {areaName ? (
                          <span className="mt-0.5 block truncate text-xs">{areaName}</span>
                        ) : null}
                      </Link>
                    </td>
                    <td className="max-w-[10rem] px-3 py-3 align-middle">
                      {rel?.commissionDisplay ? (
                        <Link
                          href={`/listings/${apt.id}`}
                          className="line-clamp-2 text-charcoal hover:text-ocean"
                          title={rel.commissionDisplay}
                        >
                          {rel.commissionDisplay}
                        </Link>
                      ) : (
                        <span className="text-muted/70">{t("listings.dash")}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 align-middle">
                      {primaryContact ? (
                        <div className="min-w-0">
                          <Link
                            href={`/contacts/${primaryContact.id}`}
                            className="font-medium text-ocean transition hover:text-ocean-deep"
                          >
                            {primaryContact.name}
                          </Link>
                          {extraContacts > 0 ? (
                            <p className="mt-0.5 text-xs text-muted">
                              {t("listings.moreContacts", { count: extraContacts })}
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-muted/70">{t("listings.dash")}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle whitespace-nowrap text-muted">
                      <Link href={`/listings/${apt.id}`} className="hover:text-ocean">
                        {updated ?? t("listings.neverChecked")}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
