import type { Metadata } from "next";
import { Section, SectionHero } from "../components/sections";
import { CtaButton } from "../components/CtaButton";
import { SITE_FAQS } from "../lib/faqs";
import { buildPageMetadata, faqPageJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "How It Works",
  description:
    "Find out how we match you with verified apartments in Da Nang. Tell us your budget and timing — we check real availability and send options within 24 hours.",
  path: "/how-it-works",
});

const STEPS = [
  { step: 1, title: "Tell us your budget & timing", body: "Share how long you want to stay and when you need the place. No commitment." },
  { step: 2, title: "We check real availability with agents", body: "We contact English-friendly agents and verify what's actually available." },
  { step: 3, title: "You get options within 24h", body: "We send you a shortlist of apartments that match your criteria." },
  { step: 4, title: "We help you contact / reserve / negotiate", body: "We introduce you to the agent, help with viewings, and can advise on pricing." },
];

const FAQ_ITEMS = SITE_FAQS.slice(0, 4);

export default function HowItWorksPage() {
  const faqLd = faqPageJsonLd(FAQ_ITEMS);

  return (
    <div className="min-h-screen bg-foam">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <SectionHero
        variant="page"
        title="How finding your apartment with us works"
        subtitle="Whether you’re already here or still planning — we check real availability and send options that fit how long you want to stay."
      />

      <Section bg="bg-foam">
        <h2 className="text-2xl font-semibold text-charcoal sm:text-3xl">Step-by-step process</h2>
        <ol className="mt-10 space-y-8">
          {STEPS.map((item) => (
            <li key={item.step} className="flex gap-6 rounded-soft border border-line bg-white p-6 shadow-sm">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-quieter bg-ocean text-lg font-semibold text-white">
                {item.step}
              </span>
              <div>
                <h3 className="text-lg font-semibold text-charcoal">{item.title}</h3>
                <p className="mt-2 text-muted">{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section bg="bg-white">
        <h2 className="text-2xl font-semibold text-charcoal sm:text-3xl">What happens after you submit</h2>
        <ul className="mt-8 space-y-4 text-charcoal/80">
          <li className="flex gap-3">
            <span className="text-ocean">✓</span>
            You&apos;ll get a WhatsApp message (or email) to confirm we received your request.
          </li>
          <li className="flex gap-3">
            <span className="text-ocean">✓</span>
            We confirm your budget, timing, and any area preferences.
          </li>
          <li className="flex gap-3">
            <span className="text-ocean">✓</span>
            We send you options — usually within 24 hours.
          </li>
          <li className="flex gap-3">
            <span className="text-ocean">✓</span>
            No obligation. If nothing fits, you&apos;re not locked in.
          </li>
        </ul>
      </Section>

      <Section bg="bg-foam">
        <h2 className="text-2xl font-semibold text-charcoal sm:text-3xl">FAQ</h2>
        <dl className="mt-10 space-y-8">
          {FAQ_ITEMS.map((faq) => (
            <div key={faq.question}>
              <dt className="text-lg font-semibold text-charcoal">{faq.question}</dt>
              <dd className="mt-2 text-muted">{faq.answer}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-8">
          <CtaButton href="/faq" variant="secondary">
            See all FAQs
          </CtaButton>
        </p>
      </Section>

      <Section bg="bg-white" className="text-center">
        <p className="text-lg text-charcoal/80">Ready to get started?</p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <CtaButton href="/contact" variant="primary">
            Get apartment matches
          </CtaButton>
          <CtaButton href="/" variant="secondary">
            Back to home
          </CtaButton>
        </div>
      </Section>
    </div>
  );
}
