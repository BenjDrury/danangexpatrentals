"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { CommissionFields } from "@/components/CommissionFields";
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

const inputClass =
  "mt-1.5 block w-full rounded-quieter border border-line bg-foam/70 px-3.5 py-2.5 text-charcoal outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20";

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

  return (
    <li className="space-y-3 py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {deal.contact_id && deal.contact_name ? (
            <Link
              href={`/contacts/${deal.contact_id}`}
              className="font-display text-lg font-semibold text-charcoal transition hover:text-ocean"
            >
              {deal.contact_name}
            </Link>
          ) : (
            <p className="font-display text-lg font-semibold text-charcoal">
              {t("commission.listingDefault")}
            </p>
          )}
          <p className="mt-1 text-sm text-muted">{t(stageKey(deal.stage))}</p>
        </div>
        {deal.contact_id ? (
          <button
            type="button"
            disabled={disconnectPending}
            onClick={() => {
              setDisconnectError(null);
              startDisconnect(async () => {
                const result = await disconnectDeal(deal.contact_id!, deal.id);
                if (result?.error) setDisconnectError(result.error);
              });
            }}
            className="rounded-quieter border border-line bg-white px-3.5 py-2 text-sm font-medium text-muted transition hover:border-coral/40 hover:text-coral-deep disabled:opacity-50"
          >
            {t("contacts.disconnect")}
          </button>
        ) : null}
      </div>

      <form action={action} className="space-y-3">
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
        <button
          type="submit"
          disabled={pending}
          className="rounded-quieter bg-ocean px-4 py-2 text-sm font-semibold text-white transition hover:bg-ocean-deep disabled:opacity-50"
        >
          {pending ? t("commission.saving") : t("commission.save")}
        </button>
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
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-charcoal">
          {t("commission.sectionTitle")}
        </h2>
        <p className="mt-1 text-sm text-muted">{t("commission.sectionHint")}</p>
      </div>

      {contactDeals.length > 0 || listingDefault ? (
        <ul className="divide-y divide-line/80 border-y border-line/80">
          {listingDefault ? <DealCommissionEditor deal={listingDefault} /> : null}
          {contactDeals.map((deal) => (
            <DealCommissionEditor key={deal.id} deal={deal} />
          ))}
        </ul>
      ) : (
        <p className="rounded-soft border border-dashed border-line bg-white/50 px-5 py-6 text-sm text-muted">
          {t("commission.empty")}
        </p>
      )}

      {!listingDefault ? (
        <form
          action={defaultAction}
          className="space-y-3 rounded-soft border border-line/70 bg-foam/40 p-4 sm:p-5"
        >
          <p className="text-sm font-medium text-charcoal">{t("commission.setDefault")}</p>
          <p className="text-sm text-muted">{t("commission.setDefaultHint")}</p>
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
          <button
            type="submit"
            disabled={defaultPending}
            className="rounded-quieter border border-ocean/30 bg-white px-4 py-2.5 text-sm font-semibold text-ocean transition hover:border-ocean hover:bg-ocean/5 disabled:opacity-50"
          >
            {defaultPending ? t("commission.saving") : t("commission.save")}
          </button>
        </form>
      ) : null}

      {availableContacts.length > 0 ? (
        <form
          action={connectAction}
          className="space-y-3 rounded-soft border border-line/70 bg-foam/40 p-4 sm:p-5"
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
          <button
            type="submit"
            disabled={connecting}
            className="rounded-quieter border border-ocean/30 bg-white px-4 py-2.5 text-sm font-semibold text-ocean transition hover:border-ocean hover:bg-ocean/5 disabled:opacity-50"
          >
            {connecting ? t("contacts.connecting") : t("contacts.connect")}
          </button>
        </form>
      ) : null}
    </section>
  );
}
