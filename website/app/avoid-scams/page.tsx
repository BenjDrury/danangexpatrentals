import type { Metadata } from "next";
import { Section, SectionHero } from "../components/sections";
import { CtaButton } from "../components/CtaButton";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "How to Avoid Apartment Scams in Da Nang",
  description:
    "Fake listings, deposit traps, agent markups, and remote booking risks in Da Nang. How we verify apartments and protect you.",
  path: "/avoid-scams",
});

const WATCH_ITEMS = [
  {
    title: "Fake or outdated listings",
    body: "Photos and descriptions that don't match the place, or listings that are already rented. Often copied from other sites. Always verify current availability with the agent or a trusted middleman before you pay anything.",
  },
  {
    title: "Deposit traps",
    body: "Being asked for a large deposit before you've seen the place or signed a contract. Or deposits that disappear if you back out. Legitimate agents and landlords usually have clear terms. Don't send money without a written agreement and, ideally, having seen the apartment (or a video tour).",
  },
  {
    title: "Agent markups for foreigners",
    body: "Some agents quote higher prices to foreigners. Get a sense of typical rents for the area (we share this when we send options) and ask what's included. A trusted contact who knows local pricing helps.",
  },
  {
    title: "Remote booking risks",
    body: "Booking from abroad is convenient but riskier if you're dealing with strangers. Use someone who verifies availability and the agent, and who communicates clearly in English. Avoid paying big sums before you have a contract and a way to verify the place exists.",
  },
];

export default function AvoidScamsPage() {
  return (
    <div className="min-h-screen bg-foam">
      <SectionHero
        variant="page"
        title="How to avoid apartment scams in Da Nang"
        subtitle="Common risks when renting as a foreigner — and how to protect yourself."
      />

      <Section bg="bg-foam">
        <h2 className="text-2xl font-semibold text-charcoal sm:text-3xl">What to watch out for</h2>
        <div className="mt-10 space-y-10">
          {WATCH_ITEMS.map((item) => (
            <div key={item.title} className="rounded-soft border border-line bg-white p-8">
              <h3 className="text-xl font-semibold text-charcoal">{item.title}</h3>
              <p className="mt-4 text-charcoal/80">{item.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section bg="bg-white">
        <div className="mx-auto max-w-2xl rounded-soft border-2 border-ocean/30 bg-palm-soft/50 p-10 text-center">
          <h2 className="text-2xl font-semibold text-charcoal">
            That's why we verify apartments manually
          </h2>
          <p className="mt-6 text-charcoal/80">
            We don't just forward listing links. We check with agents that the place is still available and real. We work with people we know, and we give you honest pricing guidance. Less scam risk, less stress.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <CtaButton href="/contact" variant="primary">
              Get verified apartment options
            </CtaButton>
            <CtaButton href="/why-us" variant="secondary">
              Why trust us
            </CtaButton>
          </div>
        </div>
      </Section>
    </div>
  );
}
