"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { listingPriceLabel, type Apartment } from "types";
import { StatusChip } from "@/components/StatusChip";
import { ListingImage } from "@/components/ListingImage";
import { Button, PageHeader } from "@/components/ui";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { LISTING_STATUS_FILTERS, listingDisplayStatus } from "@/lib/listing-status";
import { statusMessageKey } from "@/lib/i18n/messages";
import { confirmListingValidity } from "./actions";

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

type AttentionFilter = "all" | "stale" | "bump" | "attention";

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

function QuickActions({
  listingId,
  stale,
  bump,
}: {
  listingId: string;
  stale: boolean;
  bump: boolean;
}) {
  const { t } = useLocale();
  const [pending, startTransition] = useTransition();

  if (!stale && !bump) {
    return (
      <Button
        href={`/listings/${listingId}?tab=details`}
        variant="ghost"
        size="sm"
      >
        {t("listings.quick.edit")}
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      {stale ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              await confirmListingValidity(listingId, "available");
            });
          }}
          className="rounded-md bg-ocean px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-ocean-deep disabled:opacity-60"
        >
          {t("listings.quick.confirm")}
        </button>
      ) : null}
      {bump ? (
        <Link
          href={`/listings/${listingId}?tab=promote`}
          className="text-xs font-medium text-ocean hover:text-ocean-deep"
        >
          {t("listings.quick.promote")}
        </Link>
      ) : null}
    </div>
  );
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
  const bumpSet = useMemo(() => new Set(bumpIds), [bumpIds]);
  const staleSet = useMemo(() => new Set(staleIds), [staleIds]);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [areaId, setAreaId] = useState<string>("all");
  const [attention, setAttention] = useState<AttentionFilter>("all");

  useEffect(() => {
    if (!justDeleted) return;
    const timer = window.setTimeout(() => {
      router.replace("/listings");
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [justDeleted, router]);

  const areaOptions = useMemo(() => {
    const ids = new Set(listings.map((l) => l.area_id).filter(Boolean) as string[]);
    return [...ids]
      .map((id) => ({ id, name: areaNames[id] ?? id }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [listings, areaNames]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter((apt) => {
      if (status !== "all" && listingDisplayStatus(apt.status, apt.live_rejection_note) !== status) {
        return false;
      }
      if (areaId !== "all" && apt.area_id !== areaId) return false;
      const isStale = staleSet.has(apt.id);
      const isBump = bumpSet.has(apt.id);
      if (attention === "stale" && !isStale) return false;
      if (attention === "bump" && !isBump) return false;
      if (attention === "attention" && !isStale && !isBump) return false;
      if (q) {
        const hay = [
          apt.title,
          areaNames[apt.area_id ?? ""] ?? "",
          listingPriceLabel(apt),
          ...(relations[apt.id]?.contacts.map((c) => c.name) ?? []),
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    listings,
    query,
    status,
    areaId,
    attention,
    staleSet,
    bumpSet,
    areaNames,
    relations,
  ]);

  const attentionCount = listings.filter(
    (a) => staleSet.has(a.id) || bumpSet.has(a.id)
  ).length;

  return (
    <div className="space-y-4 animate-fade-up">
      <PageHeader
        title={t("listings.title")}
        subtitle={t("listings.subtitle")}
        actions={
          <Button href="/listings/new" size="sm">
            {t("home.addListing")}
          </Button>
        }
      />

      {justDeleted ? (
        <p
          className="rounded-md border border-palm/25 bg-palm-soft/70 px-3 py-2 text-sm font-medium text-palm"
          role="status"
        >
          {t("listings.deleteSuccess")}
        </p>
      ) : null}

      {listings.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-white/50 px-5 py-10 text-center">
          <p className="text-muted">{t("listings.empty")}</p>
          <Link href="/listings/new" className="mt-3 inline-block text-sm font-semibold text-ocean">
            {t("listings.createOne")}
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="listings-search" className="sr-only">
              {t("listings.filter.search")}
            </label>
            <input
              id="listings-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("listings.filter.search")}
              className="h-9 min-w-[12rem] flex-1 rounded-md border border-line bg-white px-3 text-sm text-charcoal outline-none transition placeholder:text-muted/70 focus:border-ocean focus:ring-2 focus:ring-ocean/20 sm:max-w-xs"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-9 rounded-md border border-line bg-white px-2.5 text-sm text-charcoal outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
              aria-label={t("listings.filter.status")}
            >
              <option value="all">{t("listings.filter.allStatuses")}</option>
              {LISTING_STATUS_FILTERS.map((s) => (
                <option key={s} value={s}>
                  {t(statusMessageKey(s))}
                </option>
              ))}
            </select>
            <select
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              className="h-9 max-w-[10rem] rounded-md border border-line bg-white px-2.5 text-sm text-charcoal outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
              aria-label={t("listings.filter.area")}
            >
              <option value="all">{t("listings.filter.allAreas")}</option>
              {areaOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <select
              value={attention}
              onChange={(e) => setAttention(e.target.value as AttentionFilter)}
              className="h-9 rounded-md border border-line bg-white px-2.5 text-sm text-charcoal outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
              aria-label={t("listings.filter.attention")}
            >
              <option value="all">{t("listings.filter.allAttention")}</option>
              <option value="attention">
                {t("listings.filter.needsAttention")}
                {attentionCount > 0 ? ` (${attentionCount})` : ""}
              </option>
              <option value="stale">{t("listings.filter.staleOnly")}</option>
              <option value="bump">{t("listings.filter.bumpOnly")}</option>
            </select>
            <p className="ml-auto text-xs text-muted">
              {t("listings.filter.resultCount", {
                shown: filtered.length,
                total: listings.length,
              })}
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line bg-white/50 px-5 py-8 text-center text-sm text-muted">
              {t("listings.filter.empty")}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-line/80 bg-white/70">
              <table className="w-full min-w-[62rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-line/80 bg-foam/70 text-[0.65rem] font-semibold uppercase tracking-[0.06em] text-muted">
                    <th className="whitespace-nowrap px-3 py-2.5 font-semibold">{t("listings.col.listing")}</th>
                    <th className="whitespace-nowrap px-2 py-2.5 font-semibold">{t("listings.col.status")}</th>
                    <th className="whitespace-nowrap px-2 py-2.5 font-semibold">{t("listings.col.price")}</th>
                    <th className="whitespace-nowrap px-2 py-2.5 font-semibold">{t("listings.col.details")}</th>
                    <th className="whitespace-nowrap px-2 py-2.5 font-semibold">{t("listings.col.views")}</th>
                    <th className="whitespace-nowrap px-2 py-2.5 font-semibold">{t("listings.col.commission")}</th>
                    <th className="whitespace-nowrap px-2 py-2.5 font-semibold">{t("listings.col.contact")}</th>
                    <th className="whitespace-nowrap px-2 py-2.5 font-semibold">{t("listings.col.updated")}</th>
                    <th className="whitespace-nowrap px-3 py-2.5 font-semibold">{t("listings.col.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70">
                  {filtered.map((apt) => {
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
                        <td className="px-3 py-2 align-middle">
                          <Link
                            href={`/listings/${apt.id}`}
                            className="group flex min-w-0 items-center gap-2.5"
                          >
                            <span className="relative h-9 w-12 shrink-0 overflow-hidden rounded bg-sand">
                              {apt.main_image ? (
                                <ListingImage
                                  src={apt.main_image}
                                  alt=""
                                  fill
                                  className="object-cover transition duration-500 ease-soft group-hover:scale-[1.04]"
                                  sizes="48px"
                                />
                              ) : null}
                            </span>
                            <span className="min-w-0">
                              <span className="truncate font-display text-sm font-semibold text-charcoal group-hover:text-ocean">
                                {apt.title}
                              </span>
                              <span className="mt-0.5 flex flex-wrap gap-1">
                                {stale ? (
                                  <span className="rounded bg-coral-soft px-1 py-0.5 text-[0.65rem] font-semibold text-coral">
                                    {t("listings.stale")}
                                  </span>
                                ) : null}
                                {bump && !stale ? (
                                  <span className="rounded bg-ocean/10 px-1 py-0.5 text-[0.65rem] font-semibold text-ocean">
                                    {t("listings.bump")}
                                  </span>
                                ) : null}
                              </span>
                            </span>
                          </Link>
                        </td>
                        <td className="px-2 py-2 align-middle">
                          <Link href={`/listings/${apt.id}`} className="inline-flex">
                            <StatusChip
                              status={apt.status}
                              rejectionNote={apt.live_rejection_note}
                            />
                          </Link>
                        </td>
                        <td className="px-2 py-2 align-middle">
                          <Link
                            href={`/listings/${apt.id}`}
                            className="whitespace-nowrap font-medium text-charcoal hover:text-ocean"
                          >
                            {listingPriceLabel(apt)}
                          </Link>
                        </td>
                        <td className="px-2 py-2 align-middle text-muted">
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
                        <td className="px-2 py-2 align-middle whitespace-nowrap text-muted">
                          <Link href={`/listings/${apt.id}`} className="hover:text-ocean">
                            {t("listings.viewsSummary", {
                              views: apt.view_count ?? 0,
                              unique: apt.unique_view_count ?? 0,
                            })}
                          </Link>
                        </td>
                        <td className="max-w-[9rem] px-2 py-2 align-middle">
                          {rel?.commissionDisplay ? (
                            <Link
                              href={`/listings/${apt.id}?tab=contacts`}
                              className="line-clamp-2 text-charcoal hover:text-ocean"
                              title={rel.commissionDisplay}
                            >
                              {rel.commissionDisplay}
                            </Link>
                          ) : (
                            <span className="text-muted/70">{t("listings.dash")}</span>
                          )}
                        </td>
                        <td className="px-2 py-2 align-middle">
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
                        <td className="px-2 py-2 align-middle whitespace-nowrap text-muted">
                          <Link href={`/listings/${apt.id}`} className="hover:text-ocean">
                            {updated ?? t("listings.neverChecked")}
                          </Link>
                        </td>
                        <td className="px-3 py-2 align-middle">
                          <QuickActions
                            listingId={apt.id}
                            stale={stale}
                            bump={bump}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
