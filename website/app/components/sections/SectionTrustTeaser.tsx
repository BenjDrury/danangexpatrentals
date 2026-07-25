import Link from "next/link";
import { Section } from "./Section";

const TRUST_POINTS = [
  {
    title: "Verified listings",
    body: "Every apartment we share has been checked for availability and basic accuracy.",
    icon: "1",
  },
  {
    title: "Honest photos",
    body: "You see the place as it is — not heavily staged marketing images.",
    icon: "2",
  },
  {
    title: "Clear pricing",
    body: "Monthly rent up front, with notes on deposits and utilities when we have them.",
    icon: "3",
  },
  {
    title: "Local guidance",
    body: "Neighbourhood advice from someone living in Da Nang and working with local agents.",
    icon: "4",
  },
];

type SectionTrustTeaserProps = {
  heading?: string;
  description?: string;
  linkHref?: string;
  linkLabel?: string;
  testimonials?: { quote: string; author: string }[];
};

export function SectionTrustTeaser({
  heading = "What you can expect",
  description = "We shortlist real apartments and help you understand the area — so you can decide with less guesswork.",
  linkHref = "/why-us",
  linkLabel = "How we work",
}: SectionTrustTeaserProps) {
  return (
    <Section bg="bg-white">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium text-ocean">Why it works</p>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-charcoal sm:text-4xl">
          {heading}
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-muted">{description}</p>
      </div>

      <ul className="mt-12 grid gap-4 sm:grid-cols-2">
        {TRUST_POINTS.map((point) => (
          <li
            key={point.title}
            className="rounded-2xl border border-line bg-foam p-6 shadow-[0_6px_24px_rgba(42,42,40,0.03)]"
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full font-display text-sm font-semibold text-white"
              style={{ backgroundColor: "#2f6f7e" }}
              aria-hidden
            >
              {point.icon}
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold text-charcoal">
              {point.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{point.body}</p>
          </li>
        ))}
      </ul>

      <div className="mt-10 text-center">
        <Link
          href={linkHref}
          className="inline-flex text-sm font-semibold text-ocean transition hover:text-ocean-deep"
        >
          {linkLabel} →
        </Link>
      </div>
    </Section>
  );
}
