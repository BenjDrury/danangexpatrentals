"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Apartment } from "types";
import { createContact, type ContactFormState } from "./actions";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { CommissionFields } from "@/components/CommissionFields";
import { inputClass } from "@/components/ui";

export { inputClass } from "@/components/ui";

const initial: ContactFormState = {};

type Props = {
  listings: Pick<Apartment, "id" | "title">[];
  onCancel?: () => void;
};

export function ContactForm({ listings, onCancel }: Props) {
  const [state, formAction, pending] = useActionState(createContact, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const { t } = useLocale();
  const router = useRouter();

  useEffect(() => {
    if (state.ok && state.contactId) {
      router.push(`/contacts/${state.contactId}`);
    }
  }, [state, router]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded-soft border border-line/80 bg-white/75 p-5 sm:p-6 animate-fade-up"
    >
      <div>
        <h2 className="font-display text-xl font-semibold text-charcoal">{t("contacts.addTitle")}</h2>
        <p className="mt-1 text-sm text-muted">{t("contacts.addHint")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium text-charcoal">{t("contacts.name")}</span>
          <input name="name" required className={inputClass} placeholder="Alex" />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-charcoal">{t("contacts.phone")}</span>
          <input name="phone" className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-charcoal">{t("contacts.whatsapp")}</span>
          <input name="whatsapp" className={inputClass} />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium text-charcoal">{t("contacts.email")}</span>
          <input name="email" type="email" className={inputClass} />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium text-charcoal">{t("contacts.notes")}</span>
          <textarea name="notes" rows={2} className={inputClass} />
        </label>

        {listings.length > 0 && (
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium text-charcoal">{t("contacts.linkListing")}</span>
            <select name="apartment_id" defaultValue="" className={inputClass}>
              <option value="">{t("contacts.none")}</option>
              {listings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block text-sm sm:col-span-2">
          <span className="font-medium text-charcoal">{t("contacts.commission")}</span>
          <span className="mt-1 block text-xs text-muted">{t("commission.fieldsHint")}</span>
        </label>
        <div className="sm:col-span-2">
          <CommissionFields compact />
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-quieter bg-ocean px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-deep disabled:opacity-50"
        >
          {pending ? t("contacts.saving") : t("contacts.add")}
        </button>
        {onCancel && (
          <button
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="rounded-quieter border border-line bg-white px-4 py-2.5 text-sm font-medium text-charcoal transition hover:border-ocean/40 hover:text-ocean disabled:opacity-50"
          >
            {t("contacts.cancel")}
          </button>
        )}
      </div>
    </form>
  );
}
