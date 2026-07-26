"use client";

import { Suspense } from "react";
import { CopyDeepLinkButton } from "@/components/CopyDeepLinkButton";
import { SignOutButton } from "@/components/SignOutButton";
import { StudioNav } from "@/components/StudioNav";
import { LangToggle } from "@/components/LangToggle";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function StudioShell({
  companyName,
  email,
  isAdmin,
  estateCompanyId,
  children,
}: {
  companyName: string | null;
  email?: string | null;
  isAdmin?: boolean;
  /** Active company (cookie or admin default) — enables deep-link copy for admins. */
  estateCompanyId?: string | null;
  children: React.ReactNode;
}) {
  const { t } = useLocale();

  return (
    <div className="studio-atmosphere relative min-h-screen">
      <div className="studio-grain pointer-events-none absolute inset-0 opacity-30" aria-hidden />
      <header className="relative border-b border-line/70 bg-white/65 backdrop-blur-md">
        {isAdmin ? (
          <div className="admin-stripe h-0.5 w-full" aria-hidden />
        ) : null}
        <div className="mx-auto flex max-w-6xl flex-col gap-2.5 px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ocean">
                  {t("brand.studio")}
                </p>
                {isAdmin ? (
                  <span className="rounded bg-admin-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-admin-deep">
                    {t("admin.badge")}
                  </span>
                ) : null}
                {isAdmin && estateCompanyId ? (
                  <Suspense fallback={null}>
                    <CopyDeepLinkButton companyId={estateCompanyId} />
                  </Suspense>
                ) : null}
              </div>
              <p className="mt-0.5 truncate font-display text-base font-semibold text-charcoal sm:text-lg">
                {companyName ||
                  (isAdmin ? t("admin.headerTitle") : t("home.partnerFallback"))}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <LangToggle />
              <span className="hidden max-w-[12rem] truncate text-xs text-muted sm:inline">
                {email}
              </span>
              <SignOutButton />
            </div>
          </div>
          <StudioNav isAdmin={isAdmin} />
        </div>
      </header>
      <main className="relative mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6">{children}</main>
    </div>
  );
}
