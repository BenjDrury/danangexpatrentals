"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteLanguageFeedback,
  startImpersonation,
  updateUsdVndRate,
  type FxRateState,
} from "@/app/(studio)/admin/actions";
import { CopyDeepLinkButton } from "@/components/CopyDeepLinkButton";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { AdminPartnerRow } from "@/lib/data/partners";
import type { LanguageFeedbackRow } from "@/lib/language-feedback";
import {
  readLanguageFeedbackEnabled,
  writeLanguageFeedbackEnabled,
} from "@/lib/language-feedback";

const fxInitial: FxRateState = {};

function FxRateCard({
  settingsRate,
  effectiveRate,
  envOverride,
}: {
  settingsRate: number;
  effectiveRate: number;
  envOverride: boolean;
}) {
  const { t } = useLocale();
  const [state, formAction, pending] = useActionState(updateUsdVndRate, fxInitial);

  return (
    <section className="rounded-soft border border-line/80 bg-white/70 p-5">
      <h2 className="font-display text-lg font-semibold text-charcoal">
        {t("admin.fxTitle")}
      </h2>
      <p className="mt-1 text-sm text-muted">{t("admin.fxHint")}</p>
      {envOverride ? (
        <p className="mt-2 text-xs text-admin-deep">{t("admin.fxEnvOverride")}</p>
      ) : null}
      <form action={formAction} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="block min-w-[10rem] flex-1">
          <span className="text-sm font-medium text-charcoal">{t("admin.fxLabel")}</span>
          <input
            type="number"
            name="usd_vnd_rate"
            min={1000}
            max={100000}
            step={100}
            required
            defaultValue={Math.round(settingsRate)}
            className="mt-1.5 block w-full rounded-quieter border border-line bg-foam/70 px-3.5 py-2.5 text-charcoal outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
          />
        </label>
        <button
          type="submit"
          disabled={pending || envOverride}
          className="rounded-quieter bg-admin px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-admin-deep disabled:opacity-50"
        >
          {pending ? t("admin.fxSaving") : t("admin.fxSave")}
        </button>
      </form>
      <p className="mt-2 text-xs text-muted">
        Effective: {Math.round(effectiveRate).toLocaleString("en-US")} VND/USD
      </p>
      {(state.error || state.ok) && (
        <p
          className={`mt-2 text-sm ${state.error ? "text-red-700" : "text-palm"}`}
          role="status"
        >
          {state.error ?? t("admin.fxSaved")}
        </p>
      )}
    </section>
  );
}

function LanguageFeedbackSettingsCard({
  recent,
}: {
  recent: LanguageFeedbackRow[];
}) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setEnabled(readLanguageFeedbackEnabled());
  }, []);

  function toggle(next: boolean) {
    writeLanguageFeedbackEnabled(next);
    setEnabled(next);
  }

  return (
    <section className="rounded-soft border border-line/80 bg-white/70 p-5 space-y-4">
      <div>
        <h2 className="font-display text-lg font-semibold text-charcoal">
          {t("langFeedback.title")}
        </h2>
        <p className="mt-1 text-sm text-muted">{t("langFeedback.hint")}</p>
      </div>

      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-quieter border border-line/70 bg-foam/50 px-4 py-3">
        <span className="text-sm font-medium text-charcoal">
          {t("langFeedback.toggle")}
        </span>
        <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={enabled}
            onChange={(e) => toggle(e.target.checked)}
          />
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-line transition peer-checked:bg-admin peer-focus-visible:ring-2 peer-focus-visible:ring-admin/30"
          />
          <span
            aria-hidden
            className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5"
          />
        </span>
      </label>

      <p className="text-xs text-muted">
        {enabled ? t("langFeedback.enabledNote") : t("langFeedback.disabledNote")}
      </p>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
          {t("langFeedback.recentTitle")}
        </h3>
        {recent.length === 0 ? (
          <p className="text-sm text-muted">{t("langFeedback.recentEmpty")}</p>
        ) : (
          <ul className="divide-y divide-line/60 overflow-hidden rounded-soft border border-line/70 bg-white/80">
            {recent.map((row) => (
              <li key={row.id} className="space-y-1.5 px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 text-sm font-medium text-charcoal">
                    “{row.selectedText}”
                  </p>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      startTransition(async () => {
                        setMessage(null);
                        const result = await deleteLanguageFeedback(row.id);
                        if (result.error) {
                          setMessage(result.error);
                          return;
                        }
                        router.refresh();
                      });
                    }}
                    className="shrink-0 text-xs font-medium text-coral transition hover:text-coral-deep disabled:opacity-50"
                  >
                    {t("langFeedback.delete")}
                  </button>
                </div>
                {row.comment ? (
                  <p className="text-sm text-muted">{row.comment}</p>
                ) : null}
                <p className="text-[11px] text-muted">
                  {row.locale.toUpperCase()} · {row.pagePath} ·{" "}
                  {row.createdAt
                    ? new Date(row.createdAt).toLocaleString(
                        locale === "vi" ? "vi-VN" : "en-GB",
                      )
                    : "—"}
                </p>
              </li>
            ))}
          </ul>
        )}
        {message ? (
          <p className="text-sm text-coral-deep" role="status">
            {message}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function PartnersView({
  partners,
  missingServiceRole,
  settingsRate,
  effectiveRate,
  envOverride,
  languageFeedback,
}: {
  partners: AdminPartnerRow[];
  missingServiceRole?: boolean;
  settingsRate: number;
  effectiveRate: number;
  envOverride: boolean;
  languageFeedback: LanguageFeedbackRow[];
}) {
  const { t } = useLocale();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return partners;
    return partners.filter((p) => {
      const haystack = [
        p.profileId,
        p.displayName,
        p.email,
        p.estateCompanyId,
        p.companyName,
        String(p.listingCount),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [partners, query]);

  return (
    <div className="animate-fade-up space-y-5">
      <header className="space-y-1">
        <p className="font-display text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-admin-deep">
          {t("admin.badge")}
        </p>
        <h1 className="font-display text-2xl font-semibold text-charcoal">
          {t("admin.partnersTitle")}
        </h1>
        <p className="max-w-xl text-sm text-muted">{t("admin.partnersSubtitle")}</p>
      </header>

      <FxRateCard
        settingsRate={settingsRate}
        effectiveRate={effectiveRate}
        envOverride={envOverride}
      />

      <LanguageFeedbackSettingsCard recent={languageFeedback} />

      {missingServiceRole ? (
        <p className="rounded-soft border border-admin/30 bg-admin-soft/60 px-5 py-8 text-sm text-admin-deep">
          {t("admin.missingServiceRole")}
        </p>
      ) : partners.length === 0 ? (
        <p className="rounded-soft border border-line/80 bg-white/60 px-5 py-8 text-sm text-muted">
          {t("admin.partnersEmpty")}
        </p>
      ) : (
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="sr-only">{t("admin.partnersSearch")}</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("admin.partnersSearch")}
              autoComplete="off"
              className="w-full rounded-soft border border-admin/25 bg-white/80 px-4 py-2.5 text-sm text-charcoal shadow-sm outline-none transition placeholder:text-muted/80 focus:border-admin/50 focus:ring-2 focus:ring-admin/20"
            />
          </label>

          {filtered.length === 0 ? (
            <p className="rounded-soft border border-line/80 bg-white/60 px-5 py-8 text-sm text-muted">
              {t("admin.partnersSearchEmpty")}
            </p>
          ) : (
            <ul className="divide-y divide-line/70 overflow-hidden rounded-soft border border-line/80 bg-white/70">
              {filtered.map((p) => {
                const title =
                  p.companyName?.trim() ||
                  p.displayName?.trim() ||
                  t("admin.unnamedPartner");
                return (
                  <li
                    key={p.profileId}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-charcoal">{title}</p>
                        {p.companyOnly ? (
                          <span className="rounded-quieter bg-admin-soft/70 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-admin-deep">
                            {t("admin.companyOnly")}
                          </span>
                        ) : null}
                        {p.estateCompanyId ? (
                          <CopyDeepLinkButton companyId={p.estateCompanyId} />
                        ) : null}
                      </div>
                      <p className="mt-0.5 truncate text-sm text-muted">
                        {p.companyOnly
                          ? t("admin.noUserYet")
                          : p.email || t("admin.noEmail")}
                        {p.estateCompanyId
                          ? ` · ${t("admin.listingCount").replace("{count}", String(p.listingCount))}`
                          : ` · ${t("admin.noCompany")}`}
                      </p>
                    </div>
                    {p.estateCompanyId ? (
                      <form action={startImpersonation.bind(null, p.estateCompanyId)}>
                        <button
                          type="submit"
                          className="rounded-quieter border border-admin/30 bg-admin-soft/50 px-3.5 py-2 text-sm font-semibold text-admin-deep transition hover:border-admin/50"
                        >
                          {t("admin.become")}
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-muted">{t("admin.cannotBecome")}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
