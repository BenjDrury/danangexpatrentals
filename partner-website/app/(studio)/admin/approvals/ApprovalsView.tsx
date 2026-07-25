"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { listingPriceLabel } from "types";
import {
  approveListingLive,
  rejectListingLive,
} from "@/app/(studio)/listings/actions";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { PendingApprovalRow } from "@/lib/data/approvals";
import { StatusChip } from "@/components/StatusChip";
import { ListingImage } from "@/components/ListingImage";

function formatAvailableFrom(iso: string | null | undefined, locale: string): string | null {
  if (!iso) return null;
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ApprovalCard({ row }: { row: PendingApprovalRow }) {
  const { t, locale } = useLocale();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { listing, companyName } = row;
  const availableFrom = formatAvailableFrom(listing.available_from, locale);

  function approve() {
    setError(null);
    startTransition(async () => {
      const result = await approveListingLive(listing.id);
      if (result.error) setError(result.error);
    });
  }

  function reject() {
    setError(null);
    startTransition(async () => {
      const result = await rejectListingLive(listing.id, note);
      if (result.error) setError(result.error);
    });
  }

  return (
    <article className="overflow-hidden rounded-soft border border-admin/25 bg-white/85 shadow-[0_10px_36px_rgba(91,33,182,0.06)]">
      <div className="flex flex-col sm:flex-row">
        <div className="relative aspect-[16/10] shrink-0 bg-admin-soft/40 sm:aspect-auto sm:w-44 sm:self-stretch">
          {listing.main_image ? (
            <ListingImage
              src={listing.main_image}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 176px"
            />
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-4 p-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip status={listing.status} />
              {companyName ? (
                <span className="rounded-md bg-admin-soft px-2 py-0.5 text-xs font-semibold text-admin-deep">
                  {companyName}
                </span>
              ) : null}
            </div>
            <h3 className="mt-2 font-display text-lg font-semibold text-charcoal">
              <Link href={`/listings/${listing.id}`} className="hover:text-admin-deep">
                {listing.title}
              </Link>
            </h3>
            <p className="mt-1 text-sm text-muted">
              {listingPriceLabel(listing)}
              {listing.bedrooms != null ? ` · ${listing.bedrooms} BR` : ""}
              {availableFrom
                ? ` · ${t("approvals.availableFrom")} ${availableFrom}`
                : ""}
            </p>
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-medium text-muted">{t("approvals.rejectNote")}</span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("approvals.rejectNotePlaceholder")}
              disabled={pending}
              className="w-full rounded-quieter border border-admin/20 bg-white px-3 py-2 text-sm text-charcoal outline-none transition placeholder:text-muted/70 focus:border-admin/50 focus:ring-2 focus:ring-admin/15"
            />
          </label>

          {error ? (
            <p className="text-sm text-coral" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={approve}
              className="rounded-quieter bg-admin px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-admin-deep disabled:opacity-60"
            >
              {pending ? t("approvals.approving") : t("approvals.approve")}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={reject}
              className="rounded-quieter border border-line bg-white px-3.5 py-2 text-sm font-semibold text-charcoal transition hover:border-coral/40 hover:text-coral disabled:opacity-60"
            >
              {pending ? t("approvals.rejecting") : t("approvals.reject")}
            </button>
            <Link
              href={`/listings/${listing.id}`}
              className="rounded-quieter px-3 py-2 text-sm font-medium text-admin-deep transition hover:underline"
            >
              {t("approvals.review")}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export function ApprovalsView({
  rows,
  missingServiceRole,
}: {
  rows: PendingApprovalRow[];
  missingServiceRole?: boolean;
}) {
  const { t } = useLocale();

  return (
    <div className="animate-fade-up space-y-8">
      <header className="space-y-2">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-admin-deep">
          {t("admin.badge")}
        </p>
        <h1 className="font-display text-2xl font-semibold text-charcoal sm:text-3xl">
          {t("approvals.title")}
        </h1>
        <p className="max-w-xl text-sm text-muted sm:text-base">{t("approvals.subtitle")}</p>
      </header>

      {missingServiceRole ? (
        <p className="rounded-soft border border-admin/30 bg-admin-soft/60 px-5 py-8 text-sm text-admin-deep">
          {t("admin.missingServiceRole")}
        </p>
      ) : rows.length === 0 ? (
        <p className="rounded-soft border border-admin/20 bg-admin-soft/30 px-5 py-10 text-center text-sm text-admin-deep">
          {t("approvals.empty")}
        </p>
      ) : (
        <ul className="space-y-4">
          {rows.map((row) => (
            <li key={row.listing.id}>
              <ApprovalCard row={row} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
