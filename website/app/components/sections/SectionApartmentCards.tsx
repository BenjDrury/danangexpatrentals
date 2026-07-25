import Image from "next/image";
import Link from "next/link";
import { CtaButton } from "../CtaButton";
import { Section } from "./Section";

function IconCheck() {
  return (
    <svg
      className="mt-0.5 h-4 w-4 shrink-0 text-palm"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export type ApartmentCard = {
  image: string;
  title: string;
  price: string;
  location: string;
  type?: string;
  features: string[];
  href?: string;
};

type SectionApartmentCardsProps = {
  heading: string;
  description?: string;
  cards: ApartmentCard[];
  primaryCta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
};

export function SectionApartmentCards({
  heading,
  description,
  cards,
  primaryCta,
  secondaryCta,
}: SectionApartmentCardsProps) {
  return (
    <Section bg="bg-foam">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-ocean">Verified homes</p>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-charcoal sm:text-4xl">
          {heading}
        </h2>
        {description && (
          <p className="mt-4 text-lg leading-relaxed text-muted">{description}</p>
        )}
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => {
          const content = (
            <>
              <div className="relative aspect-[4/3] overflow-hidden bg-sand">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  className="object-cover transition duration-700 ease-soft group-hover:scale-[1.03]"
                  sizes="(max-width: 768px) 100vw, 18rem"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm text-muted">{card.location}</p>
                  <p className="font-display text-lg font-semibold text-ocean">{card.price}</p>
                </div>
                <h3 className="mt-2 font-display text-xl font-semibold tracking-tight text-charcoal">
                  {card.title}
                </h3>
                {card.type && <p className="mt-1 text-sm text-muted">{card.type}</p>}
                {card.features.length > 0 && (
                  <ul className="mt-4 space-y-2 text-sm text-muted">
                    {card.features.slice(0, 3).map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <IconCheck />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          );

          return card.href ? (
            <Link
              key={i}
              href={card.href}
              className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[0_8px_30px_rgba(42,42,40,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(42,42,40,0.08)]"
            >
              {content}
            </Link>
          ) : (
            <article
              key={i}
              className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[0_8px_30px_rgba(42,42,40,0.04)]"
            >
              {content}
            </article>
          );
        })}
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        {primaryCta && (
          <CtaButton href={primaryCta.href} variant="secondary">
            {primaryCta.label}
          </CtaButton>
        )}
        {secondaryCta && (
          <CtaButton href={secondaryCta.href} variant="primary">
            {secondaryCta.label}
          </CtaButton>
        )}
      </div>
    </Section>
  );
}
