"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { label: "Apartments", href: "/apartments" },
  { label: "Neighbourhoods", href: "/areas" },
  { label: "Living here", href: "/moving-guide" },
];

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <span className="relative flex h-5 w-5 flex-col items-center justify-center gap-1">
      <span
        className={`block h-0.5 w-5 rounded-full bg-charcoal transition-all duration-300 ease-soft ${open ? "translate-y-1.5 rotate-45" : ""}`}
      />
      <span
        className={`block h-0.5 w-5 rounded-full bg-charcoal transition-all duration-300 ease-soft ${open ? "opacity-0" : "opacity-100"}`}
      />
      <span
        className={`block h-0.5 w-5 rounded-full bg-charcoal transition-all duration-300 ease-soft ${open ? "-translate-y-1.5 -rotate-45" : ""}`}
      />
    </span>
  );
}

export function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ease-soft ${
        scrolled || menuOpen
          ? "border-b border-line/80 bg-foam/95 shadow-[0_1px_0_rgba(42,42,40,0.04)] backdrop-blur-md"
          : "border-b border-transparent bg-foam/85 backdrop-blur-md"
      }`}
    >
      <div className="content-band flex h-16 items-center justify-between gap-4 sm:h-[4.25rem]">
        <Link
          href="/"
          onClick={closeMenu}
          className="font-display text-lg font-semibold tracking-tight text-charcoal transition hover:text-ocean focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean/40 focus-visible:ring-offset-2 sm:text-xl"
        >
          <span className="hidden sm:inline">Da Nang Expat Rentals</span>
          <span className="sm:hidden">DN Expat Rentals</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted transition hover:text-charcoal"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/apartments"
            onClick={closeMenu}
            className="hidden rounded-xl px-5 py-2.5 text-sm font-semibold transition sm:inline-flex"
            style={{ backgroundColor: "#2f6f7e", color: "#ffffff" }}
          >
            Explore apartments
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-sand md:hidden"
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
          >
            <HamburgerIcon open={menuOpen} />
          </button>
        </div>
      </div>

      <div
        className={`border-t border-line bg-foam/98 backdrop-blur-md md:hidden ${
          menuOpen ? "visible opacity-100" : "invisible max-h-0 overflow-hidden opacity-0"
        } transition-all duration-300 ease-soft`}
      >
        <nav className="content-band py-5" aria-label="Mobile">
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={closeMenu}
                  className="block rounded-xl px-4 py-3 text-base font-medium text-charcoal hover:bg-sand"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="mt-2 border-t border-line pt-3">
              <Link
                href="/apartments"
                onClick={closeMenu}
                className="block rounded-xl px-4 py-3 text-center text-base font-semibold"
                style={{ backgroundColor: "#2f6f7e", color: "#ffffff" }}
              >
                Explore apartments
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
