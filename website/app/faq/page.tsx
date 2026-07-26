import type { Metadata } from "next";
import Link from "next/link";
import { Section, SectionHero } from "../components/sections";
import { TrackedLink } from "../components/TrackedLink";
import { SITE_FAQS } from "../lib/faqs";
import { WHATSAPP_URL } from "../lib/contact-links";
import { buildPageMetadata, faqPageJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "FAQ — Renting in Da Nang",
  description:
    "Answers about fees, short and long stays, remote booking, verification, neighbourhoods, and how matching works with Da Nang Expat Rentals.",
  path: "/faq",
});

export default function FaqPage() {
  const faqLd = faqPageJsonLd(SITE_FAQS);

  return (
    <div className="min-h-screen bg-foam">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <SectionHero
        variant="page"
        title="Frequently asked questions"
        subtitle="How matching works, what it costs, and what to expect when finding an apartment in Da Nang."
      />

      <Section bg="bg-foam">
        <dl className="mx-auto max-w-3xl space-y-10">
          {SITE_FAQS.map((faq) => (
            <div key={faq.question}>
              <dt className="font-display text-xl font-semibold tracking-tight text-charcoal">
                {faq.question}
              </dt>
              <dd className="mt-3 text-base leading-relaxed text-muted">{faq.answer}</dd>
            </div>
          ))}
        </dl>

        <div className="mx-auto mt-14 max-w-3xl border-t border-line pt-10 text-center">
          <p className="text-lg text-muted">Still unsure? Tell us what you need.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <TrackedLink
              href="/contact"
              event="contact_cta_clicked"
              eventProps={{ source: "faq" }}
              className="inline-flex rounded-quieter bg-ocean px-6 py-3 text-sm font-semibold text-white transition hover:bg-ocean-deep"
            >
              Get matched
            </TrackedLink>
            {WHATSAPP_URL ? (
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-quieter border border-line px-6 py-3 text-sm font-semibold text-charcoal transition hover:bg-sand"
              >
                Chat on WhatsApp
              </a>
            ) : (
              <Link
                href="/how-it-works"
                className="inline-flex rounded-quieter border border-line px-6 py-3 text-sm font-semibold text-charcoal transition hover:bg-sand"
              >
                How it works
              </Link>
            )}
          </div>
        </div>
      </Section>
    </div>
  );
}
