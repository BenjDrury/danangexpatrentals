"use client";

import { useTransition } from "react";
import {
  requestListingLive,
  updateListingStatus,
  approveListingLive,
} from "../actions";
import {
  ALL_LISTING_STATUSES,
} from "@/lib/listing-status";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { statusMessageKey } from "@/lib/i18n/messages";
import { StatusChip } from "@/components/StatusChip";

type Props = {
  listingId: string;
  status?: string | null;
  isAdmin?: boolean;
  rejectionNote?: string | null;
};

export function StatusToggle({ listingId, status, isAdmin, rejectionNote }: Props) {
  const [pending, startTransition] = useTransition();
  const { t } = useLocale();
  const value = status ?? "draft";
  const canRequestLive = value === "draft";
  const isPendingReview = value === "pending_review";

  return (
    <div className="flex flex-col gap-3">
      {isAdmin ? (
        <div className="rounded-quieter border border-admin/30 bg-admin-soft/50 p-3 sm:p-3.5">
          <label className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-medium text-admin-deep">{t("status.label")}</span>
            <select
              value={value}
              disabled={pending}
              onChange={(e) => {
                const next = e.target.value;
                startTransition(async () => {
                  await updateListingStatus(listingId, next);
                });
              }}
              className="rounded-quieter border border-admin/35 bg-white px-3 py-2 text-charcoal outline-none focus:border-admin focus:ring-2 focus:ring-admin/25"
            >
              {ALL_LISTING_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(statusMessageKey(s))}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="font-medium text-charcoal">{t("status.label")}</span>
          <StatusChip status={value} />
          <span className="text-xs text-muted">{t("status.partnerReadOnlyHint")}</span>
        </div>
      )}

      {value === "reserved" ? (
        <p className="max-w-md text-xs leading-relaxed text-muted">{t("status.reservedHint")}</p>
      ) : null}

      {rejectionNote && value === "draft" ? (
        <p className="max-w-lg rounded-quieter border border-coral/25 bg-coral-soft/40 px-3 py-2 text-xs text-coral">
          <span className="font-semibold">{t("status.rejectionLabel")} </span>
          {rejectionNote}
        </p>
      ) : null}

      {canRequestLive ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              await requestListingLive(listingId);
            });
          }}
          className="w-fit rounded-quieter bg-ocean px-4 py-2 text-sm font-semibold text-white transition hover:bg-ocean-deep disabled:opacity-60"
        >
          {pending ? t("status.requestingLive") : t("status.requestLive")}
        </button>
      ) : null}

      {isPendingReview ? (
        <p className="text-xs text-muted">{t("status.pendingReviewHint")}</p>
      ) : null}

      {isAdmin && isPendingReview ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              await approveListingLive(listingId);
            });
          }}
          className="w-fit rounded-quieter bg-admin px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-admin-deep disabled:opacity-60"
        >
          {pending ? t("approvals.approving") : t("approvals.approve")}
        </button>
      ) : null}
    </div>
  );
}
