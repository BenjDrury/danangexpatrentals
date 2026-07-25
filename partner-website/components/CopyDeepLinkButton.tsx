"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function CopyDeepLinkButton({ companyId }: { companyId: string }) {
  const { t } = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);

  function buildUrl(): string {
    const qs = searchParams.toString();
    const path = qs ? `${pathname}?${qs}` : pathname || "/";
    const url = new URL("/admin/view", window.location.origin);
    url.searchParams.set("company", companyId);
    url.searchParams.set("next", path);
    return url.toString();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(buildUrl());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={copied ? t("admin.deepLinkCopied") : t("admin.copyDeepLink")}
      aria-label={copied ? t("admin.deepLinkCopied") : t("admin.copyDeepLink")}
      className="inline-flex items-center gap-1.5 rounded-quieter border border-admin/40 bg-admin-soft/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-admin-deep transition hover:border-admin hover:bg-admin-soft"
    >
      {copied ? (
        <>
          <CheckIcon />
          <span>{t("admin.deepLinkCopied")}</span>
        </>
      ) : (
        <CopyIcon />
      )}
    </button>
  );
}

function CopyIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
