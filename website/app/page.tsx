import { WHATSAPP_NUMBER } from "backend";
import Link from "next/link";
import Image from "next/image";
import { SECTION_CLASS } from "./lib/constants";

const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}`;

function CtaButton({
  href,
  primary,
  children,
  className = "",
}: {
  href: string;
  primary?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const isExternal = href.startsWith("http");
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-semibold transition-all duration-200";
  const styles = primary
    ? "bg-teal-500 text-white hover:bg-teal-600 shadow-lg shadow-teal-500/25 hover:shadow-teal-500/30"
    : "border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50";
  return (
    <Link
      href={href}
      {...(isExternal && { target: "_blank", rel: "noopener noreferrer" })}
      className={`${base} ${styles} ${className}`}
    >
      {children}
    </Link>
  );
}

function IconCheck() {
  return (
    <svg className="h-5 w-5 shrink-0 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
function IconLocation() {
  return (
    <svg className="h-4 w-4 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* ——— HERO ——— */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className={`${SECTION_CLASS} grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center`}>
          <div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Verified apartments in Da Nang — no scams, no stress.
            </h1>
            <p className="mt-6 text-lg text-slate-300 sm:text-xl">
              We help expats and remote workers find trusted rentals. Tell us your budget and move date — we&apos;ll send you real options within 24 hours.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <CtaButton href="/contact" primary>
                Get apartment matches
              </CtaButton>
              <CtaButton
                href={WHATSAPP_URL}
                className="border-slate-500 text-white hover:bg-slate-700/50"
              >
                Message us on WhatsApp
              </CtaButton>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl lg:aspect-square">
            <Image
              src="https://images.unsplash.com/photo-1529290130-4ca3753253ae?w=800&q=80"
              alt="Modern apartment balcony view, Da Nang"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>
        </div>
      </section>

      {/* ——— TRUST TEASER ——— */}
      <section className={`${SECTION_CLASS} bg-white`}>
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Why foreigners trust us
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Verified apartments only. English-friendly agents. Transparent pricing. We fix the usual chaos of renting in Da Nang as an expat.
          </p>
          <Link
            href="/why-us"
            className="mt-6 inline-flex text-teal-600 font-semibold hover:text-teal-700"
          >
            Learn more about us →
          </Link>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <blockquote className="rounded-2xl border border-slate-200 bg-slate-50/80 p-8">
            <p className="text-slate-700">
              &ldquo;Found my apartment within 3 days after arriving.&rdquo;
            </p>
            <footer className="mt-4 font-medium text-slate-900">— Mark, UK</footer>
          </blockquote>
          <blockquote className="rounded-2xl border border-slate-200 bg-slate-50/80 p-8">
            <p className="text-slate-700">
              &ldquo;Way easier than dealing with random Facebook agents.&rdquo;
            </p>
            <footer className="mt-4 font-medium text-slate-900">— Lisa, Germany</footer>
          </blockquote>
        </div>
      </section>

      {/* ——— EXAMPLE APARTMENTS ——— */}
      <section className={`${SECTION_CLASS} bg-slate-50`}>
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Example apartments we help expats find
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {[
            {
              image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80",
              title: "Modern 1BR near My Khe Beach",
              price: "$480/month",
              location: "My Khe",
              features: ["Furnished", "5 min walk to beach", "6-month lease possible"],
            },
            {
              image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80",
              title: "Studio in An Thuong expat area",
              price: "$320/month",
              location: "An Thuong",
              features: ["Balcony", "Utilities separate", "Available March"],
            },
            {
              image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80",
              title: "2BR serviced apartment near cafes",
              price: "$720/month",
              location: "My An",
              features: ["Cleaning included", "Quiet street", "Flexible lease"],
            },
          ].map((card, i) => (
            <article
              key={i}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50 transition hover:shadow-xl"
            >
              <div className="relative aspect-[4/3] bg-slate-200">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <IconLocation />
                  <span>{card.location}</span>
                </div>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{card.title}</h3>
                <p className="mt-2 text-xl font-bold text-teal-600">{card.price}</p>
                <ul className="mt-4 space-y-1 text-sm text-slate-600">
                  {card.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <IconCheck />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-12 text-center">
          <CtaButton href="/apartments" className="border-teal-500 text-teal-600 hover:bg-teal-50">
            See more options & area guides
          </CtaButton>
        </p>
        <p className="mt-6 text-center">
          <CtaButton href="/contact" primary>
            Tell us your budget — get matches
          </CtaButton>
        </p>
      </section>

      {/* ——— MAIN CTA (no form — form is on /contact) ——— */}
      <section className={`${SECTION_CLASS} bg-amber-50/30`}>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Tell us what you need — we&apos;ll send real options in 24h.
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Free. No spam. No obligation. <Link href="/how-it-works" className="text-teal-600 font-medium hover:underline">See how it works</Link>.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <CtaButton href="/contact" primary>
              Get apartment matches
            </CtaButton>
            <CtaButton href={WHATSAPP_URL} className="border-slate-300 text-slate-700">
              Chat on WhatsApp
            </CtaButton>
          </div>
        </div>
      </section>

      {/* ——— WHATSAPP CTA ——— */}
      <section className={`${SECTION_CLASS} bg-slate-900 text-white`}>
        <div className="mx-auto max-w-2xl rounded-3xl bg-[#25D366] p-10 text-center shadow-2xl sm:p-14">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Already in Da Nang?
          </h2>
          <p className="mt-4 text-lg opacity-95">
            Message us now and we&apos;ll help you find a place faster.
          </p>
          <Link
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center justify-center gap-3 rounded-xl bg-white px-8 py-4 text-lg font-bold text-[#25D366] shadow-lg transition hover:bg-slate-50"
          >
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Chat on WhatsApp
          </Link>
        </div>
      </section>
    </div>
  );
}
