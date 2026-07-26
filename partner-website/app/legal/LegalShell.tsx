"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { LangToggle } from "@/components/LangToggle";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function LegalShell({
  titleKey,
  updated,
  children,
}: {
  titleKey: "legal.terms.title" | "legal.privacy.title";
  updated: string;
  children: ReactNode;
}) {
  const { t } = useLocale();

  return (
    <div className="studio-atmosphere relative min-h-screen">
      <div className="studio-grain pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <header className="relative border-b border-line/70 bg-white/65 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="font-display text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ocean">
              {t("brand.studio")}
            </p>
            <p className="mt-0.5 truncate font-display text-base font-semibold text-charcoal">
              {t("brand.name")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <LangToggle />
            <Link
              href="/settings"
              className="rounded-quieter border border-line bg-white/80 px-3 py-1.5 text-sm font-medium text-charcoal transition hover:border-ocean/40"
            >
              {t("legal.backSettings")}
            </Link>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <article className="animate-fade-up rounded-soft border border-line/70 bg-white/80 px-5 py-8 shadow-[0_18px_50px_rgba(42,42,40,0.05)] backdrop-blur-sm sm:px-8 sm:py-10">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-charcoal sm:text-4xl">
            {t(titleKey)}
          </h1>
          <p className="mt-3 text-sm text-muted">
            {t("legal.updated", { date: updated })}
          </p>
          <div className="mt-8 space-y-8 text-base leading-relaxed text-charcoal/85">
            {children}
          </div>
        </article>
        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/terms" className="font-medium text-ocean transition hover:text-ocean-deep">
            {t("legal.terms.link")}
          </Link>
          <span className="mx-2 text-line">·</span>
          <Link href="/privacy" className="font-medium text-ocean transition hover:text-ocean-deep">
            {t("legal.privacy.link")}
          </Link>
        </p>
      </main>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-xl font-semibold tracking-tight text-charcoal">
        {title}
      </h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
