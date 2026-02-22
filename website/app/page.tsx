import Link from "next/link";
import { ConciergeForm } from "./components/ConciergeForm";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "84912345678";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}`;

function CtaButton({
  href,
  primary,
  children,
}: {
  href: string;
  primary?: boolean;
  children: React.ReactNode;
}) {
  const isExternal = href.startsWith("http");
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-lg font-semibold transition";
  const styles = primary
    ? "bg-amber-500 text-stone-900 hover:bg-amber-400"
    : "border-2 border-stone-300 text-stone-800 hover:border-stone-400 hover:bg-stone-100";
  return (
    <Link
      href={href}
      {...(isExternal && { target: "_blank", rel: "noopener noreferrer" })}
      className={`${base} ${styles}`}
    >
      {children}
    </Link>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="border-b border-stone-200 bg-white px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            Find a verified apartment in Da Nang — without scams, hidden fees, or language stress.
          </h1>
          <p className="mt-6 text-lg text-stone-600">
            We help expats, remote workers, and long-stay travelers find trusted rentals in Da
            Nang. Tell us your budget and move date — we&apos;ll send you suitable apartments
            within 24 hours.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <CtaButton href="#concierge-form" primary>
              👉 Get apartment matches
            </CtaButton>
            <CtaButton href={WHATSAPP_URL}>👉 Message us on WhatsApp</CtaButton>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-b border-stone-200 bg-stone-50 px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold text-stone-900">
            Why foreigners struggle to rent in Da Nang
          </h2>
          <ul className="mt-6 list-none space-y-3 text-stone-700">
            <li className="flex gap-3">
              <span className="text-amber-500">•</span>
              Listings online are outdated or already taken
            </li>
            <li className="flex gap-3">
              <span className="text-amber-500">•</span>
              Many agents don&apos;t speak English clearly
            </li>
            <li className="flex gap-3">
              <span className="text-amber-500">•</span>
              Prices vary wildly for foreigners
            </li>
            <li className="flex gap-3">
              <span className="text-amber-500">•</span>
              Hard to know which areas are actually livable
            </li>
            <li className="flex gap-3">
              <span className="text-amber-500">•</span>
              Scam risk when booking remotely
            </li>
          </ul>
          <p className="mt-8 text-lg font-medium text-stone-800">That&apos;s exactly why we built this.</p>
        </div>
      </section>

      {/* Value prop */}
      <section className="border-b border-stone-200 bg-white px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold text-stone-900">What we do differently</h2>
          <ul className="mt-6 list-none space-y-3 text-stone-700">
            <li className="flex gap-3">
              <span className="text-emerald-600">✔</span>
              We filter apartments suitable for foreigners
            </li>
            <li className="flex gap-3">
              <span className="text-emerald-600">✔</span>
              We work with English-friendly agents
            </li>
            <li className="flex gap-3">
              <span className="text-emerald-600">✔</span>
              We help you understand realistic pricing
            </li>
            <li className="flex gap-3">
              <span className="text-emerald-600">✔</span>
              We focus on expat-friendly areas like An Thuong & My An
            </li>
            <li className="flex gap-3">
              <span className="text-emerald-600">✔</span>
              We can match you manually if needed
            </li>
          </ul>
          <div className="mt-8">
            <CtaButton href="#concierge-form" primary>
              👉 Tell us what you need
            </CtaButton>
          </div>
        </div>
      </section>

      {/* Sample listings */}
      <section className="border-b border-stone-200 bg-stone-50 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-stone-900">
            Example apartments we help expats find
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-stone-900">Modern 1BR near My Khe Beach</h3>
              <p className="mt-2 text-xl font-bold text-amber-600">$480/month</p>
              <ul className="mt-4 space-y-1 text-sm text-stone-600">
                <li>Furnished</li>
                <li>5 min walk to beach</li>
                <li>6-month lease possible</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-stone-900">Studio in An Thuong expat area</h3>
              <p className="mt-2 text-xl font-bold text-amber-600">$320/month</p>
              <ul className="mt-4 space-y-1 text-sm text-stone-600">
                <li>Balcony</li>
                <li>Utilities separate</li>
                <li>Available March</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-stone-900">2BR serviced apartment near cafes</h3>
              <p className="mt-2 text-xl font-bold text-amber-600">$720/month</p>
              <ul className="mt-4 space-y-1 text-sm text-stone-600">
                <li>Cleaning included</li>
                <li>Quiet street</li>
                <li>Flexible lease</li>
              </ul>
            </div>
          </div>
          <p className="mt-8 text-center">
            <CtaButton href="#concierge-form" primary>
              👉 Don&apos;t see what you want? Tell us your budget.
            </CtaButton>
          </p>
        </div>
      </section>

      {/* Concierge form */}
      <section id="concierge-form" className="border-b border-stone-200 bg-white px-6 py-16">
        <div className="mx-auto max-w-xl">
          <h2 className="text-2xl font-bold text-stone-900">
            Tell us what you&apos;re looking for — we&apos;ll send options
          </h2>
          <p className="mt-4 text-stone-600">
            This service is free. We manually match you with apartments that fit your budget and move
            date.
          </p>
          <div className="mt-10">
            <ConciergeForm />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-stone-100 px-6 py-16">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-bold text-stone-900">Already in Da Nang?</h2>
          <p className="mt-4 text-stone-600">
            Message us directly and we&apos;ll help you find a place faster.
          </p>
          <div className="mt-8">
            <CtaButton href={WHATSAPP_URL} primary>
              👉 WhatsApp
            </CtaButton>
          </div>
        </div>
      </section>
    </div>
  );
}
