import Image from "next/image";
import { SECTION_CLASS } from "@/app/lib/constants";
import { CtaButton } from "../CtaButton";
import { Section } from "./Section";

type HeroVariant = "page" | "home";

type SectionHeroProps = {
  variant: HeroVariant;
  title: string;
  subtitle: string;
  /** For "page": optional. For "home": primary + secondary */
  primaryCta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string; external?: boolean };
  /** Only for variant="home": optional right-column image (if not set, uses background image only) */
  image?: { src: string; alt: string };
};

/**
 * Hero section. "page" = centered title + subtitle (white bg). "home" = dark gradient, two columns, optional image.
 */
export function SectionHero({
  variant,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  image,
}: SectionHeroProps) {
  if (variant === "page") {
    return (
      <Section bg="bg-white">
        <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              {title}
            </h1>
            <p className="mt-6 text-lg text-slate-600">{subtitle}</p>
            {(primaryCta || secondaryCta) && (
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                {primaryCta && (
                  <CtaButton href={primaryCta.href} primary>
                    {primaryCta.label}
                  </CtaButton>
                )}
                {secondaryCta && (
                  <CtaButton
                    href={secondaryCta.href}
                    className={secondaryCta.external ? "border-slate-500 text-white hover:bg-slate-700/50" : undefined}
                  >
                    {secondaryCta.label}
                  </CtaButton>
                )}
              </div>
            )}
          </div>
      </Section>
    );
  }

  // variant === "home" — full-bleed hero with background image
  return (
    <section className="relative min-h-[70vh] overflow-hidden text-white flex flex-col justify-center">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/danang-hero-bg.jpg"
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
        />
      </div>
      {/* Overlay for text readability */}
      <div className="absolute inset-0 bg-slate-900/55" aria-hidden />
      {/* Content */}
      <div className={`${SECTION_CLASS} relative z-10 ${image ? "grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center" : ""}`}>
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl drop-shadow-sm">
            {title}
          </h1>
          <p className="mt-6 text-lg text-slate-200 sm:text-xl drop-shadow-sm">{subtitle}</p>
          <div className="mt-10 flex flex-wrap gap-4">
            {primaryCta && (
              <CtaButton href={primaryCta.href} primary>
                {primaryCta.label}
              </CtaButton>
            )}
            {secondaryCta && (
              <CtaButton
                href={secondaryCta.href}
                className="border-slate-400 text-white hover:bg-white/10 hover:border-slate-300"
              >
                {secondaryCta.label}
              </CtaButton>
            )}
          </div>
        </div>
        {image && (
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl lg:aspect-square ring-2 ring-white/20">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>
        )}
      </div>
    </section>
  );
}
