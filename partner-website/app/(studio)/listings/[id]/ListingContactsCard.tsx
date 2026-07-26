"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Section, inputClass } from "@/components/ui";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import type { ListingDealRow, PartnerContact } from "@/lib/data/listings";
import {
  connectContactToListing,
  type ListingDealActionState,
} from "../actions";
import {
  createContact,
  type ContactFormState,
} from "../../contacts/actions";

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

function commissionLabel(deal: ListingDealRow): string | null {
  const parts: string[] = [];
  if (deal.expected_commission_usd != null) {
    parts.push(`$${deal.expected_commission_usd}`);
  }
  if (deal.expected_commission_pct != null) {
    parts.push(`${deal.expected_commission_pct}%`);
  }
  if (deal.notes?.trim()) parts.push(deal.notes.trim());
  return parts.length ? parts.join(" · ") : null;
}

function whatsappHref(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : `https://wa.me/`;
}

type Mode = "link" | "new";

type Props = {
  listingId: string;
  deals: ListingDealRow[];
  availableContacts: Pick<PartnerContact, "id" | "name">[];
};

export function ListingContactsCard({
  listingId,
  deals,
  availableContacts,
}: Props) {
  const { t } = useLocale();
  const router = useRouter();
  const contactDeals = deals.filter((d) => d.contact_id);
  const listingDefault = deals.find((d) => !d.contact_id) ?? null;
  const canLinkExisting = availableContacts.length > 0;
  const [mode, setMode] = useState<Mode>(canLinkExisting ? "link" : "new");

  const boundConnect = connectContactToListing.bind(null, listingId);
  const [connectState, connectAction, connecting] = useActionState<
    ListingDealActionState,
    FormData
  >(boundConnect, {});

  const [createState, createAction, creating] = useActionState<
    ContactFormState,
    FormData
  >(createContact, {});

  useEffect(() => {
    if (createState.ok || connectState.ok) {
      router.refresh();
    }
  }, [createState.ok, connectState.ok, router]);

  useEffect(() => {
    if (!canLinkExisting && mode === "link") setMode("new");
  }, [canLinkExisting, mode]);

  return (
    <Section
      title={t("workspace.contacts.title")}
      description={t("workspace.contacts.subtitle")}
      actions={
        <Button
          href={`/listings/${listingId}?tab=contacts`}
          variant="ghost"
          size="sm"
        >
          {t("workspace.contacts.manage")}
        </Button>
      }
    >
      {listingDefault ? (
        <p className="mb-2 text-xs text-muted">
          <span className="font-medium text-charcoal">
            {t("commission.listingDefault")}:
          </span>{" "}
          {commissionLabel(listingDefault) ?? t("workspace.contacts.noCommission")}
        </p>
      ) : null}

      {contactDeals.length === 0 ? (
        <p className="rounded-md border border-dashed border-line bg-foam/40 px-3 py-3 text-sm text-muted">
          {t("workspace.contacts.empty")}
        </p>
      ) : (
        <ul className="divide-y divide-line/70">
          {contactDeals.map((deal) => {
            const commission = commissionLabel(deal);
            return (
              <li key={deal.id} className="flex flex-wrap items-start justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <Link
                    href={`/contacts/${deal.contact_id}`}
                    className="font-medium text-charcoal hover:text-ocean"
                  >
                    {deal.contact_name ?? t("workspace.contacts.unnamed")}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted">{t(stageKey(deal.stage))}</p>
                  {commission ? (
                    <p className="mt-0.5 text-xs text-charcoal/80">{commission}</p>
                  ) : null}
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                    {deal.contact_phone ? (
                      <a
                        href={`tel:${deal.contact_phone}`}
                        className="font-medium text-ocean hover:underline"
                      >
                        {deal.contact_phone}
                      </a>
                    ) : null}
                    {deal.contact_whatsapp ? (
                      <a
                        href={whatsappHref(deal.contact_whatsapp)}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-palm hover:underline"
                      >
                        WhatsApp
                      </a>
                    ) : null}
                    {deal.contact_email ? (
                      <a
                        href={`mailto:${deal.contact_email}`}
                        className="font-medium text-ocean hover:underline"
                      >
                        {deal.contact_email}
                      </a>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-3 space-y-2.5 border-t border-line/70 pt-3">
        <div className="flex gap-1 rounded-md bg-foam/80 p-0.5">
          <button
            type="button"
            disabled={!canLinkExisting}
            onClick={() => setMode("link")}
            className={`flex-1 rounded px-2 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
              mode === "link"
                ? "bg-white text-charcoal shadow-sm"
                : "text-muted hover:text-charcoal"
            }`}
          >
            {t("workspace.contacts.linkExisting")}
          </button>
          <button
            type="button"
            onClick={() => setMode("new")}
            className={`flex-1 rounded px-2 py-1.5 text-xs font-semibold transition ${
              mode === "new"
                ? "bg-white text-charcoal shadow-sm"
                : "text-muted hover:text-charcoal"
            }`}
          >
            {t("workspace.contacts.addNew")}
          </button>
        </div>

        {mode === "link" && canLinkExisting ? (
          <form action={connectAction} className="flex flex-wrap items-end gap-2">
            <label className="min-w-[10rem] flex-1 text-sm">
              <span className="sr-only">{t("commission.pickContact")}</span>
              <select name="contact_id" required defaultValue="" className={inputClass}>
                <option value="" disabled>
                  {t("commission.pickContact")}
                </option>
                {availableContacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" size="sm" disabled={connecting}>
              {connecting ? t("contacts.connecting") : t("contacts.connect")}
            </Button>
            {connectState.error ? (
              <p className="w-full text-xs text-red-700" role="alert">
                {connectState.error}
              </p>
            ) : null}
            {connectState.ok ? (
              <p className="w-full text-xs text-palm" role="status">
                {t("commission.connected")}
              </p>
            ) : null}
          </form>
        ) : null}

        {mode === "new" ? (
          <form action={createAction} className="space-y-2">
            <input type="hidden" name="apartment_id" value={listingId} />
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-muted">
                {t("contacts.name")}
              </span>
              <input
                name="name"
                required
                className={inputClass}
                placeholder={t("workspace.contacts.namePlaceholder")}
              />
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-medium text-muted">
                  {t("contacts.phone")}
                </span>
                <input name="phone" className={inputClass} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-medium text-muted">
                  {t("contacts.whatsapp")}
                </span>
                <input name="whatsapp" className={inputClass} />
              </label>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-muted">
                {t("contacts.email")}
              </span>
              <input name="email" type="email" className={inputClass} />
            </label>
            <Button type="submit" size="sm" disabled={creating}>
              {creating ? t("contacts.saving") : t("workspace.contacts.addAndLink")}
            </Button>
            {createState.error ? (
              <p className="text-xs text-red-700" role="alert">
                {createState.error}
              </p>
            ) : null}
            {createState.ok ? (
              <p className="text-xs text-palm" role="status">
                {t("workspace.contacts.added")}
              </p>
            ) : null}
          </form>
        ) : null}
      </div>
    </Section>
  );
}
