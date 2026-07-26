"use client";

import { SignOutButton } from "@/components/SignOutButton";
import { LangToggle } from "@/components/LangToggle";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { capture } from "@/lib/analytics";
import { getPublicSiteUrl } from "@/lib/public-url";

export function UnauthorizedView({ email }: { email?: string | null }) {
  const { t } = useLocale();

  return (
    <div className="studio-atmosphere relative flex min-h-screen flex-col items-center justify-center px-4 py-12 text-center">
      <div className="studio-grain pointer-events-none absolute inset-0 opacity-50" aria-hidden />
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <LangToggle />
      </div>
      <div className="relative max-w-md animate-fade-up">
        <p className="font-display text-sm font-semibold tracking-wide text-ocean">
          {t("brand.studio")}
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-charcoal">
          {t("unauthorized.title")}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">{t("unauthorized.body")}</p>
        {email ? (
          <p className="mt-3 text-sm text-muted">
            {t("unauthorized.signedInAs")}{" "}
            <span className="font-medium text-charcoal">{email}</span>
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <SignOutButton className="rounded-quieter bg-ocean px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-deep" />
        </div>
        <p className="mt-6 text-sm text-muted">
          {t("login.applyPrompt")}{" "}
          <a
            href={`${getPublicSiteUrl()}/partners/apply`}
            className="font-medium text-ocean transition hover:text-ocean-deep"
            onClick={() =>
              capture("partner_apply_cta_clicked", { source: "unauthorized_page" })
            }
          >
            {t("login.applyLink")}
          </a>
        </p>
      </div>
    </div>
  );
}
