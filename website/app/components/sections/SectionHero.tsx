import Image from "next/image";
import { SECTION_CLASS } from "@/app/lib/constants";
import { CtaButton } from "../CtaButton";
import { Section } from "./Section";

type HeroVariant = "page" | "home";

type SectionHeroProps = {
  variant: HeroVariant;
  title: string;
  subtitle: string;
  brand?: string;
  primaryCta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string; external?: boolean };
  image?: { src: string; alt: string };
};

export function SectionHero({
  variant,
  title,
  subtitle,
  brand = "Da Nang Expat Rentals",
  primaryCta,
  secondaryCta,
}: SectionHeroProps) {
  if (variant === "page") {
    return (
      <Section bg="bg-foam" className="pt-28 sm:pt-36">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-charcoal sm:text-5xl text-balance">
            {title}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted sm:text-xl">{subtitle}</p>
          {(primaryCta || secondaryCta) && (
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {primaryCta && (
                <CtaButton href={primaryCta.href} variant="primary">
                  {primaryCta.label}
                </CtaButton>
              )}
              {secondaryCta && (
                <CtaButton href={secondaryCta.href} variant="secondary">
                  {secondaryCta.label}
                </CtaButton>
              )}
            </div>
          )}
        </div>
      </Section>
    );
  }

  return (
    <section className="relative flex min-h-svh items-end overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/danang-hero-bg.jpg"
          alt="Da Nang coastline at golden hour"
          fill
          className="object-cover object-center animate-soft-zoom"
          sizes="100vw"
          priority
        />
        <div className="hero-scrim" aria-hidden />
      </div>

      <div className={`${SECTION_CLASS} relative z-10 w-full pb-14 pt-28 sm:pb-20 sm:pt-36`}>
        <div className="max-w-2xl">
          <p className="animate-fade-up font-display text-sm font-medium hero-copy sm:text-base">
            {brand}
          </p>
          <h1 className="animate-fade-up-delay mt-4 font-display text-4xl font-semibold tracking-tight text-balance hero-copy sm:text-5xl lg:text-[3.5rem]">
            {title}
          </h1>
          <p className="animate-fade-up-delay-2 mt-5 max-w-xl text-lg leading-relaxed hero-copy-muted sm:text-xl">
            {subtitle}
          </p>
          <div className="animate-fade-up-delay-2 mt-9 flex flex-wrap gap-3">
            {primaryCta && (
              <CtaButton href={primaryCta.href} variant="onDark">
                {primaryCta.label}
              </CtaButton>
            )}
            {secondaryCta && (
              <CtaButton href={secondaryCta.href} variant="onDarkSecondary">
                {secondaryCta.label}
              </CtaButton>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
