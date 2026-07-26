"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { formatUsd, type Apartment } from "types";
import { CommissionFields } from "@/components/CommissionFields";
import { StatusChip } from "@/components/StatusChip";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import {
  connectListing,
  disconnectDeal,
  updateContact,
  updateDealCommission,
  type ContactFormState,
  type DealActionState,
} from "../actions";
import { inputClass } from "../ContactForm";
import { DeleteContactButton } from "./DeleteContactButton";

type ConnectedListing = {
  dealId: string;
  apartmentId: string | null;
  title: string | null;
  status: Apartment["status"] | null;
  stage: string;
  notes: string | null;
  expected_commission_usd: number | null;
  expected_commission_pct: number | null;
};

type Props = {
  contact: {
    id: string;
    name: string;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    notes: string | null;
  };
  connected: ConnectedListing[];
  availableListings: Pick<Apartment, "id" | "title">[];
};

const STAGE_KEYS: Record<string, MessageKey> = {
  inquiry: "contacts.stage.inquiry",
  viewing: "contacts.stage.viewing",
  negotiation: "contacts.stage.negotiation",
  won: "contacts.stage.won",
  lost: "contacts.stage.lost",
};

function stageKey(stage: string): MessageKey {
  return STAGE_KEYS[stage] ?? "contacts.stage.inquiry";
}

function ConnectedDealRow({
  contactId,
  row,
}: {
  contactId: string;
  row: ConnectedListing;
}) {
  const { t } = useLocale();
  const boundUpdate = updateDealCommission.bind(null, row.dealId);
  const [saveState, saveAction, saving] = useActionState<DealActionState, FormData>(
    boundUpdate,
    {}
  );
  const [disconnectPending, startDisconnect] = useTransition();
  const [disconnectError, setDisconnectError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  return (
    <li className="space-y-3 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          {row.apartmentId && row.title ? (
            <Link
              href={`/listings/${row.apartmentId}`}
              className="font-display text-lg font-semibold text-charcoal transition hover:text-ocean"
            >
              {row.title}
            </Link>
          ) : (
            <p className="font-display text-lg font-semibold text-charcoal">
              {t("contacts.inquiryOnly")}
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted">
            {row.status && <StatusChip status={row.status} />}
            <span>{t(stageKey(row.stage))}</span>
            {row.expected_commission_usd != null && Number(row.expected_commission_usd) > 0 ? (
              <span>· {formatUsd(Number(row.expected_commission_usd))}</span>
            ) : null}
            {row.expected_commission_pct != null && Number(row.expected_commission_pct) > 0 ? (
              <span>· {Number(row.expected_commission_pct)}%</span>
            ) : null}
            {row.notes ? <span>· {row.notes}</span> : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="rounded-quieter border border-line bg-white px-3.5 py-2 text-sm font-medium text-charcoal transition hover:border-ocean/40 hover:text-ocean"
          >
            {editing ? t("commission.cancelEdit") : t("commission.edit")}
          </button>
          <button
            type="button"
            disabled={disconnectPending}
            onClick={() => {
              setDisconnectError(null);
              startDisconnect(async () => {
                const result = await disconnectDeal(contactId, row.dealId);
                if (result?.error) setDisconnectError(result.error);
              });
            }}
            className="rounded-quieter border border-line bg-white px-3.5 py-2 text-sm font-medium text-muted transition hover:border-coral/40 hover:text-coral-deep disabled:opacity-50"
          >
            {t("contacts.disconnect")}
          </button>
        </div>
      </div>

      {editing ? (
        <form action={saveAction} className="space-y-3 rounded-quieter border border-line/60 bg-foam/30 p-4">
          <CommissionFields
            compact
            usd={row.expected_commission_usd}
            pct={row.expected_commission_pct}
            notes={row.notes}
          />
          {saveState.error && (
            <p className="text-sm text-red-700" role="alert">
              {saveState.error}
            </p>
          )}
          {saveState.ok && (
            <p className="text-sm text-palm" role="status">
              {t("commission.saved")}
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded-quieter bg-ocean px-4 py-2 text-sm font-semibold text-white transition hover:bg-ocean-deep disabled:opacity-50"
          >
            {saving ? t("commission.saving") : t("commission.save")}
          </button>
        </form>
      ) : null}

      {disconnectError && (
        <p className="text-sm text-coral-deep" role="alert">
          {disconnectError}
        </p>
      )}
    </li>
  );
}

export function ContactDetailView({ contact, connected, availableListings }: Props) {
  const { t } = useLocale();
  const boundUpdate = updateContact.bind(null, contact.id);
  const [saveState, saveAction, saving] = useActionState<ContactFormState, FormData>(
    boundUpdate,
    {}
  );

  const boundConnect = connectListing.bind(null, contact.id);
  const [connectState, connectAction, connecting] = useActionState<DealActionState, FormData>(
    boundConnect,
    {}
  );

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/contacts" className="text-sm font-medium text-ocean hover:text-ocean-deep">
            {t("contacts.back")}
          </Link>
          <h1 className="mt-2 font-display text-2xl font-semibold text-charcoal">{contact.name}</h1>
          <p className="mt-1 text-sm text-muted">{t("contacts.detailSubtitle")}</p>
        </div>
        <DeleteContactButton contactId={contact.id} />
      </div>

      <form action={saveAction} className="space-y-3 rounded-lg border border-line/80 bg-white/75 p-4">
        <h2 className="font-display text-base font-semibold text-charcoal">{t("contacts.details")}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium text-charcoal">{t("contacts.name")}</span>
            <input name="name" required defaultValue={contact.name} className={inputClass} />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-charcoal">{t("contacts.phone")}</span>
            <input name="phone" defaultValue={contact.phone ?? ""} className={inputClass} />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-charcoal">{t("contacts.whatsapp")}</span>
            <input name="whatsapp" defaultValue={contact.whatsapp ?? ""} className={inputClass} />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium text-charcoal">{t("contacts.email")}</span>
            <input
              name="email"
              type="email"
              defaultValue={contact.email ?? ""}
              className={inputClass}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium text-charcoal">{t("contacts.notes")}</span>
            <textarea
              name="notes"
              rows={3}
              defaultValue={contact.notes ?? ""}
              className={inputClass}
            />
          </label>
        </div>

        {saveState.error && (
          <p className="text-sm text-red-700" role="alert">
            {saveState.error}
          </p>
        )}
        {saveState.ok && (
          <p className="text-sm text-palm" role="status">
            {t("contacts.updated")}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-quieter bg-ocean px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-deep disabled:opacity-50"
        >
          {saving ? t("contacts.saving") : t("contacts.saveChanges")}
        </button>
      </form>

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-charcoal">
            {t("contacts.connectedListings")}
          </h2>
          <p className="mt-1 text-sm text-muted">{t("contacts.connectedHint")}</p>
        </div>

        {connected.length === 0 ? (
          <p className="rounded-soft border border-dashed border-line bg-white/50 px-5 py-8 text-sm text-muted">
            {t("contacts.connectedEmpty")}
          </p>
        ) : (
          <ul className="divide-y divide-line/80 border-y border-line/80">
            {connected.map((row) => (
              <ConnectedDealRow key={row.dealId} contactId={contact.id} row={row} />
            ))}
          </ul>
        )}

        {availableListings.length > 0 && (
          <form
            action={connectAction}
            className="space-y-3 rounded-soft border border-line/70 bg-foam/40 p-4 sm:p-5"
          >
            <p className="text-sm font-medium text-charcoal">{t("contacts.connectListing")}</p>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <label className="block text-sm sm:col-span-1">
                <span className="sr-only">{t("contacts.linkListing")}</span>
                <select name="apartment_id" required defaultValue="" className={inputClass}>
                  <option value="" disabled>
                    {t("contacts.pickListing")}
                  </option>
                  {availableListings.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                disabled={connecting}
                className="rounded-quieter border border-ocean/30 bg-white px-4 py-2.5 text-sm font-semibold text-ocean transition hover:border-ocean hover:bg-ocean/5 disabled:opacity-50"
              >
                {connecting ? t("contacts.connecting") : t("contacts.connect")}
              </button>
            </div>
            <CommissionFields compact />
            {connectState.error && (
              <p className="text-sm text-red-700" role="alert">
                {connectState.error}
              </p>
            )}
            {connectState.ok && (
              <p className="text-sm text-palm" role="status">
                {t("contacts.connected")}
              </p>
            )}
          </form>
        )}
      </section>
    </div>
  );
}
