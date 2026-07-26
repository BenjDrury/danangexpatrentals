"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { CommissionFields } from "@/components/CommissionFields";
import { Button, Section, inputClass } from "@/components/ui";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import type { ListingDealRow, PartnerContact } from "@/lib/data/listings";
import {
  connectContactToListing,
  saveListingExpectedCommission,
  type ListingDealActionState,
} from "../actions";
import {
  disconnectDeal,
  updateDealCommission,
  type DealActionState,
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

function whatsappHref(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : `https://wa.me/`;
}

type Props = {
  listingId: string;
  deals: ListingDealRow[];
  availableContacts: Pick<PartnerContact, "id" | "name">[];
};

function DealCommissionEditor({ deal }: { deal: ListingDealRow }) {
  const { t } = useLocale();
  const bound = updateDealCommission.bind(null, deal.id);
  const [state, action, pending] = useActionState<DealActionState, FormData>(bound, {});
  const [disconnectPending, startDisconnect] = useTransition();
  const [disconnectError, setDisconnectError] = useState<string | null>(null);
  const isContact = Boolean(deal.contact_id);

  return (
    <li className="space-y-2.5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          {isContact && deal.contact_name ? (
            <Link
              href={`/contacts/${deal.contact_id}`}
              className="font-display text-base font-semibold text-charcoal transition hover:text-ocean"
            >
              {deal.contact_name}
            </Link>
          ) : (
            <p className="font-display text-base font-semibold text-charcoal">
              {t("commission.listingDefault")}
            </p>
          )}
          <p className="mt-0.5 text-xs text-muted">{t(stageKey(deal.stage))}</p>
          {isContact ? (
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
              {!deal.contact_phone && !deal.contact_whatsapp && !deal.contact_email ? (
                <span className="text-muted">{t("workspace.contacts.noReach")}</span>
              ) : null}
            </div>
          ) : (
            <p className="mt-1 text-xs text-muted">{t("commission.setDefaultHint")}</p>
          )}
        </div>
        {isContact ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disconnectPending}
            onClick={() => {
              setDisconnectError(null);
              startDisconnect(async () => {
                const result = await disconnectDeal(deal.contact_id!, deal.id);
                if (result?.error) setDisconnectError(result.error);
              });
            }}
          >
            {t("contacts.disconnect")}
          </Button>
        ) : null}
      </div>

      <form action={action} className="space-y-2.5">
        <CommissionFields
          compact
          usd={deal.expected_commission_usd}
          pct={deal.expected_commission_pct}
          notes={deal.notes}
        />
        {state.error && (
          <p className="text-sm text-red-700" role="alert">
            {state.error}
          </p>
        )}
        {state.ok && (
          <p className="text-sm text-palm" role="status">
            {t("commission.saved")}
          </p>
        )}
        {disconnectError && (
          <p className="text-sm text-coral-deep" role="alert">
            {disconnectError}
          </p>
        )}
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? t("commission.saving") : t("commission.save")}
        </Button>
      </form>
    </li>
  );
}

export function ListingDealsPanel({ listingId, deals, availableContacts }: Props) {
  const { t } = useLocale();
  const listingDefault = deals.find((d) => !d.contact_id) ?? null;
  const contactDeals = deals.filter((d) => d.contact_id);

  const boundSaveDefault = saveListingExpectedCommission.bind(null, listingId);
  const [defaultState, defaultAction, defaultPending] = useActionState<
    ListingDealActionState,
    FormData
  >(boundSaveDefault, {});

  const boundConnect = connectContactToListing.bind(null, listingId);
  const [connectState, connectAction, connecting] = useActionState<
    ListingDealActionState,
    FormData
  >(boundConnect, {});

  return (
    <div className="space-y-5">
      <Section
        title={t("workspace.contacts.tabTitle")}
        description={t("workspace.contacts.tabHint")}
        bare
      >
        {contactDeals.length > 0 ? (
          <ul className="divide-y divide-line/80 border-y border-line/80">
            {contactDeals.map((deal) => (
              <DealCommissionEditor key={deal.id} deal={deal} />
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed border-line bg-white/50 px-4 py-5 text-sm text-muted">
            {t("workspace.contacts.empty")}
          </p>
        )}

        {availableContacts.length > 0 ? (
          <form
            action={connectAction}
            className="mt-4 space-y-2.5 rounded-lg border border-line/70 bg-foam/40 p-3.5"
          >
            <p className="text-sm font-medium text-charcoal">{t("commission.connectContact")}</p>
            <label className="block text-sm">
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
            <p className="text-xs text-muted">{t("commission.fieldsHint")}</p>
            <CommissionFields compact />
            {connectState.error && (
              <p className="text-sm text-red-700" role="alert">
                {connectState.error}
              </p>
            )}
            {connectState.ok && (
              <p className="text-sm text-palm" role="status">
                {t("commission.connected")}
              </p>
            )}
            <Button type="submit" variant="secondary" size="sm" disabled={connecting}>
              {connecting ? t("contacts.connecting") : t("contacts.connect")}
            </Button>
          </form>
        ) : (
          <p className="mt-3 text-sm text-muted">
            <Link href="/contacts" className="font-medium text-ocean hover:underline">
              {t("workspace.contacts.addFirst")}
            </Link>
          </p>
        )}
      </Section>

      <Section
        title={t("commission.listingDefault")}
        description={t("commission.setDefaultHint")}
      >
        {listingDefault ? (
          <ul className="divide-y divide-line/80 border-t border-line/80">
            <DealCommissionEditor deal={listingDefault} />
          </ul>
        ) : (
          <form action={defaultAction} className="space-y-2.5">
            <CommissionFields compact />
            {defaultState.error && (
              <p className="text-sm text-red-700" role="alert">
                {defaultState.error}
              </p>
            )}
            {defaultState.ok && (
              <p className="text-sm text-palm" role="status">
                {t("commission.saved")}
              </p>
            )}
            <Button type="submit" variant="secondary" size="sm" disabled={defaultPending}>
              {defaultPending ? t("commission.saving") : t("commission.save")}
            </Button>
          </form>
        )}
      </Section>
    </div>
  );
}
