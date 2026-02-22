import Image from "next/image";
import { CtaButton } from "../CtaButton";
import { Section } from "./Section";

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

export type ApartmentCard = {
  image: string;
  title: string;
  price: string;
  location: string;
  features: string[];
};

type SectionApartmentCardsProps = {
  heading: string;
  cards: ApartmentCard[];
  primaryCta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
};

/**
 * Section with a heading, grid of apartment cards (image, location, title, price, features), and optional CTAs.
 */
export function SectionApartmentCards({
  heading,
  cards,
  primaryCta,
  secondaryCta,
}: SectionApartmentCardsProps) {
  return (
    <Section bg="bg-slate-50">
      <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
        {heading}
      </h2>
      <div className="mt-12 grid gap-8 sm:grid-cols-3">
        {cards.map((card, i) => (
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
              <h3 className="mt-2 text-lg font-semibold text-slate-900">
                {card.title}
              </h3>
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
      {(primaryCta || secondaryCta) && (
        <div className="mt-12 space-y-6">
          {secondaryCta && (
            <p className="text-center">
              <CtaButton href={secondaryCta.href} className="border-teal-500 text-teal-600 hover:bg-teal-50">
                {secondaryCta.label}
              </CtaButton>
            </p>
          )}
          {primaryCta && (
            <p className="text-center">
              <CtaButton href={primaryCta.href} primary>
                {primaryCta.label}
              </CtaButton>
            </p>
          )}
        </div>
      )}
    </Section>
  );
}
