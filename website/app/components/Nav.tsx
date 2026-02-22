"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { label: "How it works", href: "/how-it-works" },
  { label: "Apartments", href: "/apartments" },
  { label: "Why us", href: "/why-us" },
  { label: "Areas", href: "/areas" },
  { label: "Avoid scams", href: "/avoid-scams" },
  { label: "Contact", href: "/contact" },
];

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <span className="relative flex h-5 w-5 flex-col items-center justify-center gap-1">
      <span
        className={`block h-0.5 w-5 rounded-full bg-slate-700 transition-all duration-200 ${open ? "translate-y-1.5 rotate-45" : ""}`}
      />
      <span
        className={`block h-0.5 w-5 rounded-full bg-slate-700 transition-all duration-200 ${open ? "opacity-0" : "opacity-100"}`}
      />
      <span
        className={`block h-0.5 w-5 rounded-full bg-slate-700 transition-all duration-200 ${open ? "-translate-y-1.5 -rotate-45" : ""}`}
      />
    </span>
  );
}

export function Nav({ whatsappUrl }: { whatsappUrl: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header
      className={`sticky top-0 z-50 h-[60px] border-b transition-all duration-200 sm:h-[70px] ${
        scrolled
          ? "border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-md"
          : "border-slate-200/50 bg-white/95 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-4 px-6">
        {/* Logo — left */}
        <Link
          href="/"
          onClick={closeMenu}
          className="font-semibold text-slate-800 transition hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:ring-offset-2 rounded-lg px-1 -ml-1"
        >
          <span className="hidden sm:inline">Da Nang Expat Rentals</span>
          <span className="sm:hidden">DN Expat Rentals</span>
        </Link>

        {/* Center — desktop links */}
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeMenu}
              className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right — WhatsApp + CTA (desktop) / WhatsApp + hamburger (mobile) */}
        <div className="flex items-center gap-3">
          <Link
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#20BD5A] focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:ring-offset-2"
          >
            <WhatsAppIcon className="h-5 w-5 shrink-0" />
            <span className="hidden sm:inline">Chat on WhatsApp</span>
            <span className="sm:hidden">WhatsApp</span>
          </Link>

          <Link
            href="/contact"
            onClick={closeMenu}
            className="hidden rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:ring-offset-2 sm:inline-flex"
          >
            Get matches
          </Link>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 md:hidden"
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
          >
            <HamburgerIcon open={menuOpen} />
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      <div
        className={`border-t border-slate-200 bg-white/98 backdrop-blur-md md:hidden ${
          menuOpen ? "visible opacity-100" : "invisible opacity-0"
        } transition-all duration-200`}
      >
        <nav className="mx-auto max-w-6xl px-6 py-4" aria-label="Mobile">
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={closeMenu}
                  className="block rounded-lg px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="mt-2 border-t border-slate-100 pt-2">
              <Link
                href="/contact"
                onClick={closeMenu}
                className="block rounded-lg px-4 py-3 text-base font-bold text-teal-600 hover:bg-teal-50"
              >
                Get matches
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
