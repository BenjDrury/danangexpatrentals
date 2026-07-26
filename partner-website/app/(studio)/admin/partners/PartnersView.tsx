"use client";

import { useActionState, useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  addPartnerInvite,
  deleteLanguageFeedback,
  startImpersonation,
  updateUsdVndRate,
  type AddPartnerState,
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
const addPartnerInitial: AddPartnerState = {};

function absoluteInviteUrl(path: string): string {
  if (typeof window === "undefined") return path;
  return new URL(path, window.location.origin).toString();
}

function whatsappHref(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

function pickContact(primary: string | null, fallback: string | null): string | null {
  const a = primary?.trim();
  if (a) return a;
  const b = fallback?.trim();
  return b || null;
}

function formatLastSignIn(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function PartnerContactLine({ partner }: { partner: AdminPartnerRow }) {
  const { t } = useLocale();
  const phone = pickContact(partner.phone, partner.companyPhone);
  const whatsapp = pickContact(partner.whatsapp, partner.companyWhatsapp);
  const contactEmail = pickContact(partner.contactEmail, partner.companyEmail);
  const wa = whatsapp ? whatsappHref(whatsapp) : null;

  const items: { key: string; node: ReactNode }[] = [];
  if (phone) {
    items.push({
      key: "phone",
      node: (
        <a href={`tel:${phone}`} className="text-ocean transition hover:text-ocean-deep">
          {phone}
        </a>
      ),
    });
  }
  if (whatsapp) {
    items.push({
      key: "wa",
      node: wa ? (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ocean transition hover:text-ocean-deep"
        >
          {t("admin.contactWhatsApp", { number: whatsapp })}
        </a>
      ) : (
        <span>{t("admin.contactWhatsApp", { number: whatsapp })}</span>
      ),
    });
  }
  if (contactEmail && contactEmail !== partner.email) {
    items.push({
      key: "ce",
      node: (
        <a
          href={`mailto:${contactEmail}`}
          className="text-ocean transition hover:text-ocean-deep"
        >
          {contactEmail}
        </a>
      ),
    });
  }

  if (items.length === 0) {
    return <p className="mt-1 text-xs text-muted">{t("admin.noContact")}</p>;
  }

  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
      {items.map((item, i) => (
        <span key={item.key} className="inline-flex items-center gap-2">
          {i > 0 ? <span aria-hidden className="text-line">·</span> : null}
          {item.node}
        </span>
      ))}
    </p>
  );
}

function InviteLinkReady({
  inviteUrl,
  loginUrl,
  email,
  emailed,
  emailError,
}: {
  inviteUrl: string;
  loginUrl?: string;
  email?: string;
  emailed?: boolean;
  emailError?: string;
}) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);
  const absoluteInvite = absoluteInviteUrl(inviteUrl);
  const copyTarget = loginUrl || absoluteInvite;

  return (
    <div className="mt-4 space-y-2 rounded-quieter border border-palm/30 bg-palm/5 px-4 py-3">
      <p className="text-sm font-medium text-palm">
        {emailed
          ? t("admin.addPartnerEmailSent", { email: email || "them" })
          : t("admin.addPartnerInviteReady", { email: email || "them" })}
      </p>
      {emailError ? (
        <p className="text-sm text-red-700" role="status">
          {emailError}
        </p>
      ) : null}
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {loginUrl
          ? t("admin.addPartnerLoginLinkLabel")
          : t("admin.addPartnerInviteLinkLabel")}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 break-all rounded-quieter bg-white/80 px-2.5 py-1.5 text-xs text-charcoal">
          {copyTarget}
        </code>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(copyTarget);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 2000);
            } catch {
              // ignore
            }
          }}
          className="shrink-0 rounded-quieter border border-palm/40 bg-white px-3 py-1.5 text-xs font-semibold text-palm transition hover:border-palm/60"
        >
          {copied ? t("admin.addPartnerLinkCopied") : t("admin.addPartnerCopyLink")}
        </button>
      </div>
      {loginUrl ? (
        <p className="text-xs text-muted">
          {t("admin.addPartnerInviteFallback", { url: absoluteInvite })}
        </p>
      ) : null}
    </div>
  );
}

function AddPartnerCard() {
  const { t } = useLocale();
  const [state, formAction, pending] = useActionState(
    addPartnerInvite,
    addPartnerInitial,
  );

  return (
    <section className="rounded-soft border border-line/80 bg-white/70 p-5">
      <h2 className="font-display text-lg font-semibold text-charcoal">
        {t("admin.addPartnerTitle")}
      </h2>
      <p className="mt-1 text-sm text-muted">{t("admin.addPartnerHint")}</p>
      <form action={formAction} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-charcoal">
            {t("admin.addPartnerCompany")}
          </span>
          <input
            type="text"
            name="company_name"
            required
            maxLength={120}
            placeholder={t("admin.addPartnerCompanyPlaceholder")}
            className="mt-1.5 block w-full rounded-quieter border border-line bg-foam/70 px-3.5 py-2.5 text-charcoal outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-charcoal">
            {t("admin.addPartnerEmail")}
          </span>
          <input
            type="email"
            name="email"
            required
            autoComplete="off"
            placeholder={t("admin.addPartnerEmailPlaceholder")}
            className="mt-1.5 block w-full rounded-quieter border border-line bg-foam/70 px-3.5 py-2.5 text-charcoal outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-quieter bg-admin px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-admin-deep disabled:opacity-50"
          >
            {pending
              ? t("admin.addPartnerSubmitting")
              : t("admin.addPartnerSubmit")}
          </button>
        </div>
      </form>
      {state.error ? (
        <p className="mt-3 text-sm text-red-700" role="status">
          {state.error}
        </p>
      ) : null}
      {state.inviteUrl ? (
        <InviteLinkReady
          inviteUrl={state.inviteUrl}
          loginUrl={state.loginUrl}
          email={state.email}
          emailed={state.emailed}
          emailError={state.emailError}
        />
      ) : null}
    </section>
  );
}

function InviteExistingForm({
  companyId,
  companyName,
  onDone,
}: {
  companyId: string;
  companyName: string;
  onDone: () => void;
}) {
  const { t } = useLocale();
  const [state, formAction, pending] = useActionState(
    addPartnerInvite,
    addPartnerInitial,
  );

  return (
    <div className="mt-2 w-full space-y-2 rounded-quieter border border-admin/25 bg-admin-soft/30 px-3 py-3 sm:max-w-md">
      <p className="text-xs text-muted">{t("admin.inviteExistingHint")}</p>
      <form action={formAction} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="estate_company_id" value={companyId} />
        <input type="hidden" name="company_name" value={companyName} />
        <label className="min-w-[12rem] flex-1">
          <span className="sr-only">{t("admin.addPartnerEmail")}</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="off"
            placeholder={t("admin.addPartnerEmailPlaceholder")}
            className="block w-full rounded-quieter border border-line bg-white px-3 py-2 text-sm text-charcoal outline-none transition focus:border-admin focus:ring-2 focus:ring-admin/20"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-quieter bg-admin px-3 py-2 text-sm font-semibold text-white transition hover:bg-admin-deep disabled:opacity-50"
        >
          {pending
            ? t("admin.addPartnerSubmitting")
            : t("admin.inviteExistingSubmit")}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-quieter border border-line px-3 py-2 text-sm font-medium text-muted transition hover:text-charcoal"
        >
          {t("admin.inviteExistingCancel")}
        </button>
      </form>
      {state.error ? (
        <p className="text-sm text-red-700" role="status">
          {state.error}
        </p>
      ) : null}
      {state.inviteUrl ? (
        <InviteLinkReady
          inviteUrl={state.inviteUrl}
          loginUrl={state.loginUrl}
          email={state.email}
          emailed={state.emailed}
          emailError={state.emailError}
        />
      ) : null}
    </div>
  );
}

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
  const { t, locale } = useLocale();
  const [query, setQuery] = useState("");
  const [inviteCompanyId, setInviteCompanyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return partners;
    return partners.filter((p) => {
      const haystack = [
        p.profileId,
        p.displayName,
        p.email,
        p.contactEmail,
        p.phone,
        p.whatsapp,
        p.companyPhone,
        p.companyWhatsapp,
        p.companyEmail,
        p.pendingInviteEmail,
        p.estateCompanyId,
        p.companyName,
        String(p.listingCount),
        p.hasLoggedIn ? "logged-in" : "never-logged-in",
        p.email ? "has-email" : "no-email",
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

      <AddPartnerCard />

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
                const inviting = Boolean(
                  p.companyOnly &&
                    p.estateCompanyId &&
                    inviteCompanyId === p.estateCompanyId,
                );
                const lastSignInLabel = formatLastSignIn(p.lastSignInAt, locale);
                return (
                  <li key={p.profileId} className="px-4 py-3.5 sm:px-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-charcoal">{title}</p>
                          {p.companyOnly ? (
                            <span className="rounded-quieter bg-admin-soft/70 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-admin-deep">
                              {t("admin.companyOnly")}
                            </span>
                          ) : null}
                          {p.email ? (
                            <span className="rounded-quieter bg-palm/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-palm">
                              {t("admin.hasLoginEmail")}
                            </span>
                          ) : (
                            <span className="rounded-quieter bg-sand px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                              {t("admin.noLoginEmail")}
                            </span>
                          )}
                          {p.companyOnly ? null : p.hasLoggedIn ? (
                            <span className="rounded-quieter bg-ocean/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ocean-deep">
                              {t("admin.hasLoggedIn")}
                            </span>
                          ) : (
                            <span className="rounded-quieter bg-sand px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                              {t("admin.neverLoggedIn")}
                            </span>
                          )}
                          {p.estateCompanyId ? (
                            <CopyDeepLinkButton companyId={p.estateCompanyId} />
                          ) : null}
                        </div>
                        <p className="mt-0.5 truncate text-sm text-muted">
                          {p.companyOnly
                            ? p.pendingInviteEmail
                              ? t("admin.pendingInvite", {
                                  email: p.pendingInviteEmail,
                                })
                              : t("admin.noUserYet")
                            : p.email || t("admin.noEmail")}
                          {p.estateCompanyId
                            ? ` · ${t("admin.listingCount").replace("{count}", String(p.listingCount))}`
                            : ` · ${t("admin.noCompany")}`}
                          {!p.companyOnly && lastSignInLabel
                            ? ` · ${t("admin.lastSignIn", { date: lastSignInLabel })}`
                            : null}
                        </p>
                        <PartnerContactLine partner={p} />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {p.companyOnly && p.estateCompanyId && !inviting ? (
                          <button
                            type="button"
                            onClick={() => setInviteCompanyId(p.estateCompanyId)}
                            className="rounded-quieter border border-admin/30 bg-white px-3.5 py-2 text-sm font-semibold text-admin-deep transition hover:border-admin/50"
                          >
                            {t("admin.inviteExisting")}
                          </button>
                        ) : null}
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
                          <span className="text-xs text-muted">
                            {t("admin.cannotBecome")}
                          </span>
                        )}
                      </div>
                    </div>
                    {inviting && p.estateCompanyId ? (
                      <InviteExistingForm
                        companyId={p.estateCompanyId}
                        companyName={p.companyName?.trim() || title}
                        onDone={() => setInviteCompanyId(null)}
                      />
                    ) : null}
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
