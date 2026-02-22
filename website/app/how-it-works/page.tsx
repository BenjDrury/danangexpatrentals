import type { Metadata } from "next";
import Link from "next/link";
import { SECTION_CLASS } from "../lib/constants";

export const metadata: Metadata = {
  title: "How It Works — Da Nang Expat Rentals",
  description:
    "Find out how we match you with verified apartments in Da Nang. Tell us your budget and move date — we check real availability and send options within 24 hours.",
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className={`${SECTION_CLASS} bg-white`}>
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            How finding your apartment with us works
          </h1>
          <p className="mt-6 text-lg text-slate-600">
            Remote booking is safe when you work with someone who checks real availability and speaks your language. Here’s our process.
          </p>
        </div>
      </section>

      {/* Step-by-step */}
      <section className={`${SECTION_CLASS} bg-slate-50`}>
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Step-by-step process</h2>
        <ol className="mt-10 space-y-8">
          {[
            { step: 1, title: "Tell us your budget & move date", body: "Fill in the form or message us on WhatsApp. No commitment." },
            { step: 2, title: "We check real availability with agents", body: "We contact English-friendly agents and verify what’s actually available." },
            { step: 3, title: "You get options within 24h", body: "We send you a shortlist of apartments that match your criteria." },
            { step: 4, title: "We help you contact / reserve / negotiate", body: "We introduce you to the agent, help with viewings, and can advise on pricing." },
          ].map((item) => (
            <li key={item.step} className="flex gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-lg font-bold text-white">
                {item.step}
              </span>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-slate-600">{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* What happens after submission */}
      <section className={`${SECTION_CLASS} bg-white`}>
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">What happens after you submit</h2>
        <ul className="mt-8 space-y-4 text-slate-700">
          <li className="flex gap-3">
            <span className="text-teal-500">✓</span>
            You’ll get a WhatsApp message (or email) to confirm we received your request.
          </li>
          <li className="flex gap-3">
            <span className="text-teal-500">✓</span>
            We confirm your budget, move date, and any area preferences.
          </li>
          <li className="flex gap-3">
            <span className="text-teal-500">✓</span>
            We send you options — usually within 24 hours.
          </li>
          <li className="flex gap-3">
            <span className="text-teal-500">✓</span>
            No obligation. If nothing fits, you’re not locked in.
          </li>
        </ul>
      </section>

      {/* FAQ */}
      <section className={`${SECTION_CLASS} bg-slate-50`}>
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">FAQ</h2>
        <dl className="mt-10 space-y-8">
          {[
            { q: "Do I pay anything?", a: "Our matching service is free. You only pay rent and any fees to the landlord or agent when you sign a lease." },
            { q: "Can I book before arriving?", a: "Yes. We help many people secure a place remotely. We verify availability and can arrange viewings by video or in person once you’re in Da Nang." },
            { q: "What if I don’t like the options?", a: "No obligation. Tell us what’s missing and we can look for more, or you can walk away. No pressure." },
            { q: "Do you show apartments in person?", a: "We work with local agents who can show apartments. If you’re already in Da Nang, we can help arrange viewings. If you’re remote, we coordinate with agents on your behalf." },
          ].map((faq) => (
            <div key={faq.q}>
              <dt className="text-lg font-semibold text-slate-900">{faq.q}</dt>
              <dd className="mt-2 text-slate-600">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* CTA */}
      <section className={`${SECTION_CLASS} bg-white text-center`}>
        <p className="text-lg text-slate-700">Ready to get started?</p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link
            href="/contact"
            className="inline-flex rounded-xl bg-teal-500 px-6 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-teal-600"
          >
            Get apartment matches
          </Link>
          <Link
            href="/"
            className="inline-flex rounded-xl border-2 border-slate-200 px-6 py-4 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to home
          </Link>
        </div>
      </section>
    </div>
  );
}
