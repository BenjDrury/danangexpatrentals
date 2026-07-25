"use client";

import { useState } from "react";
import Link from "next/link";
import type { Apartment } from "types";
import { ContactForm } from "./ContactForm";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type Contact = {
  id: string;
  name: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  notes?: string | null;
};

type DealRow = {
  contact_id: string | null;
  apartment_id: string | null;
  notes: string | null;
  stage: string;
};

type Props = {
  contacts: Contact[];
  listings: Pick<Apartment, "id" | "title">[];
  dealsByContact: Record<string, DealRow>;
  listingTitle: Record<string, string>;
};

export function ContactsView({
  contacts,
  listings,
  dealsByContact,
  listingTitle,
}: Props) {
  const { t } = useLocale();
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-10 animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-charcoal">{t("contacts.title")}</h1>
          <p className="mt-2 max-w-xl text-muted">{t("contacts.subtitle")}</p>
        </div>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-quieter bg-ocean px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-deep"
          >
            {t("contacts.add")}
          </button>
        )}
      </div>

      {adding && <ContactForm listings={listings} onCancel={() => setAdding(false)} />}

      {contacts.length === 0 ? (
        <div className="rounded-soft border border-dashed border-line bg-white/50 px-6 py-12 text-center">
          <p className="text-muted">{t("contacts.empty")}</p>
          {!adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="mt-4 inline-block text-sm font-semibold text-ocean"
            >
              {t("contacts.add")} →
            </button>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-line/80 border-y border-line/80">
          {contacts.map((c) => {
            const deal = dealsByContact[c.id];
            return (
              <li key={c.id}>
                <Link
                  href={`/contacts/${c.id}`}
                  className="group block py-5 transition hover:bg-foam/40"
                >
                  <p className="font-display text-lg font-semibold text-charcoal group-hover:text-ocean">
                    {c.name}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                    {c.phone && <span>{c.phone}</span>}
                    {c.whatsapp && <span>WA {c.whatsapp}</span>}
                    {c.email && <span>{c.email}</span>}
                  </div>
                  {c.notes && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted">{c.notes}</p>
                  )}
                  {deal && (
                    <p className="mt-2 text-sm text-ocean">
                      {deal.apartment_id
                        ? listingTitle[deal.apartment_id] ?? t("contacts.linkedListing")
                        : t("contacts.inquiry")}
                      {deal.notes ? ` · ${deal.notes}` : ""}
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
