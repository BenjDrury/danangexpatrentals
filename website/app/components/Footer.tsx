import Link from "next/link";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.894 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" />
    </svg>
  );
}

const linkClass = "text-slate-500 transition hover:text-slate-900";

export function Footer({ whatsappUrl }: { whatsappUrl: string }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1 — Platform */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Platform
            </h3>
            <ul className="mt-4 flex flex-col gap-3">
              <li>
                <Link href="/apartments" className={linkClass}>
                  Apartments
                </Link>
              </li>
              <li>
                <Link href="/areas" className={linkClass}>
                  Areas
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className={linkClass}>
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/contact" className={linkClass}>
                  Get matches
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2 — Resources */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Resources
            </h3>
            <ul className="mt-4 flex flex-col gap-3">
              <li>
                <Link href="/avoid-scams" className={linkClass}>
                  Avoid scams in Da Nang
                </Link>
              </li>
              <li>
                <Link href="/faq" className={linkClass}>
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/moving-guide" className={linkClass}>
                  Moving to Da Nang guide
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 — Company */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Company
            </h3>
            <ul className="mt-4 flex flex-col gap-3">
              <li>
                <Link href="/why-us" className={linkClass}>
                  About / Why us
                </Link>
              </li>
              <li>
                <Link href="/contact" className={linkClass}>
                  Contact
                </Link>
              </li>
              <li>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-slate-500 transition hover:text-slate-900"
                >
                  <WhatsAppIcon className="h-4 w-4 shrink-0" />
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4 — Trust */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Trust
            </h3>
            <ul className="mt-4 flex flex-col gap-3 text-slate-600">
              <li className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
                <span>Verified apartments only</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
                <span>English-friendly agents</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
                <span>Transparent pricing</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 sm:flex-row">
          <p className="text-sm text-slate-500">
            © {currentYear} Da Nang Expat Rentals. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link href="/privacy" className={linkClass}>
              Privacy policy
            </Link>
            <Link href="/terms" className={linkClass}>
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
