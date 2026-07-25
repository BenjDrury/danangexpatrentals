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
      <div className="studio-grain pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <header className="relative border-b border-line/70 bg-white/55 backdrop-blur-md">
        {isAdmin ? (
          <div className="admin-stripe h-1 w-full" aria-hidden />
        ) : null}
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-ocean">
                  {t("brand.studio")}
                </p>
                {isAdmin ? (
                  <span className="rounded-quieter bg-admin-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-admin-deep">
                    {t("admin.badge")}
                  </span>
                ) : null}
                {isAdmin && estateCompanyId ? (
                  <Suspense fallback={null}>
                    <CopyDeepLinkButton companyId={estateCompanyId} />
                  </Suspense>
                ) : null}
              </div>
              <p className="mt-1 font-display text-lg font-semibold text-charcoal sm:text-xl">
                {companyName ||
                  (isAdmin ? t("admin.headerTitle") : t("home.partnerFallback"))}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 text-right">
              <LangToggle />
              <span className="max-w-[14rem] truncate text-xs text-muted sm:text-sm">{email}</span>
              <SignOutButton />
            </div>
          </div>
          <StudioNav isAdmin={isAdmin} />
        </div>
      </header>
      <main className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
