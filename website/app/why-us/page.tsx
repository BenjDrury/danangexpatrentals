import type { Metadata } from "next";
import { Section, SectionHero } from "../components/sections";
import { CtaButton } from "../components/CtaButton";

export const metadata: Metadata = {
  title: "Why Foreigners Trust Us — Da Nang Expat Rentals",
  description:
    "We verify apartments, work with English-friendly agents, and give honest pricing guidance. Find out why expats trust us to find rentals in Da Nang.",
};

export default function WhyUsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SectionHero
        variant="page"
        title="Why foreigners trust us to find apartments in Da Nang"
        subtitle="We built this because we saw how hard it was for expats to rent here. Here's what we do differently."
      />

      <Section bg="bg-slate-50">
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Why we built this</h2>
        <p className="mt-6 text-slate-700">
          Renting in Da Nang as a foreigner often means: Facebook groups full of outdated listings, agents who don't speak clear English, prices that jump for foreigners, and real scam risk when you try to book before arriving. We got tired of watching people waste time and money — so we started checking availability ourselves and only sending options we've verified with agents we know.
        </p>
      </Section>

      <Section bg="bg-white">
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">What makes us different</h2>
        <div className="mt-10 space-y-12">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-8">
            <h3 className="text-xl font-semibold text-slate-900">Verified apartments</h3>
            <p className="mt-4 text-slate-700">
              We don't just forward listing links. We check with agents that the place is still available and that it's real. No fake photos or "already rented" surprises.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-8">
            <h3 className="text-xl font-semibold text-slate-900">English-friendly agents</h3>
            <p className="mt-4 text-slate-700">
              We work with agents who can communicate in English. You get clear answers about contracts, deposits, and what's included — without the language stress.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-8">
            <h3 className="text-xl font-semibold text-slate-900">Real pricing guidance</h3>
            <p className="mt-4 text-slate-700">
              We tell you if something looks overpriced for the area. Our goal is to get you a fair deal, not to push the highest-commission listing.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-8">
            <h3 className="text-xl font-semibold text-slate-900">Remote help</h3>
            <p className="mt-4 text-slate-700">
              WhatsApp, availability checks, and coordination with agents — even if you're not in Da Nang yet. We help you secure a place before you land, or find something fast once you're here.
            </p>
          </div>
        </div>
      </Section>

      <Section bg="bg-slate-50">
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">What expats say</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          {[
            { quote: "Found my apartment within 3 days after arriving. No runaround.", author: "Mark", country: "UK", situation: "First time in Da Nang" },
            { quote: "Way easier than dealing with random Facebook agents. They actually checked what was available.", author: "Lisa", country: "Germany", situation: "Remote worker" },
            { quote: "I was booking from abroad — they verified the place and the agent spoke English. Huge relief.", author: "James", country: "Australia", situation: "Booked before arrival" },
            { quote: "Fair pricing and no pressure. Got a 1BR near the beach for what they said.", author: "Sarah", country: "Canada", situation: "6-month stay" },
          ].map((t) => (
            <blockquote key={t.author} className="rounded-2xl border border-slate-200 bg-white p-8">
              <p className="text-slate-700">&ldquo;{t.quote}&rdquo;</p>
              <footer className="mt-4 font-medium text-slate-900">
                — {t.author}, {t.country}
              </footer>
              <p className="mt-1 text-sm text-slate-500">{t.situation}</p>
            </blockquote>
          ))}
        </div>
      </Section>

      <Section bg="bg-white" className="text-center">
        <p className="text-lg text-slate-700">Ready to find your place?</p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <CtaButton href="/contact" primary>
            Get apartment matches
          </CtaButton>
          <CtaButton href="/">
            Back to home
          </CtaButton>
        </div>
      </Section>
    </div>
  );
}
