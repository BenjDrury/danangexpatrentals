"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/leads", label: "Leads" },
  { href: "/partner-applications", label: "Partners" },
  { href: "/apartments", label: "Apartments" },
  { href: "/areas", label: "Areas" },
  { href: "/apartment-types", label: "Apartment types" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto" aria-label="Admin">
      {LINKS.map((link) => {
        const active =
          link.href === "/"
            ? pathname === "/"
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`relative shrink-0 rounded-quieter px-3.5 py-2 text-sm font-medium transition ${
              active
                ? "bg-white/90 text-ocean shadow-sm"
                : "text-muted hover:bg-white/50 hover:text-charcoal"
            }`}
          >
            {link.label}
            {active ? (
              <span
                className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-ocean/70"
                aria-hidden
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
