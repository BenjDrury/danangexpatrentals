"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { label: "Apartments", href: "/apartments" },
  { label: "Areas", href: "/areas" },
  { label: "How it works", href: "/how-it-works" },
];

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

export function Nav() {
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
          ? "border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md"
          : "border-slate-200/50 bg-white/95 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-4 px-6">
        {/* Logo — left */}
        <Link
          href="/"
          onClick={closeMenu}
          className="-ml-1 rounded-lg px-1 font-semibold text-slate-800 transition hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:ring-offset-2"
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

        {/* Right — CTA (desktop) / hamburger (mobile) */}
        <div className="flex items-center gap-3">
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
