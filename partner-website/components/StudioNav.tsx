"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";

const LINKS: { href: string; key: MessageKey }[] = [
  { href: "/", key: "nav.home" },
  { href: "/listings", key: "nav.listings" },
  { href: "/contacts", key: "nav.contacts" },
  { href: "/guides", key: "nav.guides" },
  { href: "/settings", key: "nav.settings" },
];

export function StudioNav({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <nav className="flex gap-1 overflow-x-auto" aria-label={t("nav.aria")}>
      {LINKS.map((link) => {
        const active =
          link.href === "/"
            ? pathname === "/"
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`relative rounded-quieter px-3.5 py-2 text-sm font-medium transition ${
              active
                ? "bg-white/90 text-ocean shadow-sm"
                : "text-muted hover:bg-white/50 hover:text-charcoal"
            }`}
          >
            {t(link.key)}
            {active && (
              <span
                className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-ocean/70"
                aria-hidden
              />
            )}
          </Link>
        );
      })}
      {isAdmin ? (
        <>
          <Link
            href="/admin/approvals"
            className={`relative rounded-quieter px-3.5 py-2 text-sm font-semibold transition ${
              pathname.startsWith("/admin/approvals")
                ? "bg-admin-soft text-admin-deep shadow-sm"
                : "text-admin/80 hover:bg-admin-soft/70 hover:text-admin-deep"
            }`}
          >
            {t("nav.approvals")}
            {pathname.startsWith("/admin/approvals") && (
              <span
                className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-admin"
                aria-hidden
              />
            )}
          </Link>
          <Link
            href="/admin/partners"
            className={`relative rounded-quieter px-3.5 py-2 text-sm font-semibold transition ${
              pathname.startsWith("/admin/partners")
                ? "bg-admin-soft text-admin-deep shadow-sm"
                : "text-admin/80 hover:bg-admin-soft/70 hover:text-admin-deep"
            }`}
          >
            {t("nav.admin")}
            {pathname.startsWith("/admin/partners") && (
              <span
                className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-admin"
                aria-hidden
              />
            )}
          </Link>
        </>
      ) : null}
    </nav>
  );
}
