import { CtaButton } from "../CtaButton";
import { Section } from "./Section";

type SectionCtaProps = {
  /** Background class (e.g. "bg-amber-50/30", "bg-white") */
  bg: string;
  title: string;
  /** Subtitle can include links — pass as ReactNode */
  subtitle: React.ReactNode;
  primaryCta: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
};

/**
 * Centered CTA section: title, subtitle, primary and optional secondary button.
 */
export function SectionCta({
  bg,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
}: SectionCtaProps) {
  return (
    <Section bg={bg}>
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
          {title}
        </h2>
        <p className="mt-4 text-lg text-slate-600">{subtitle}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <CtaButton href={primaryCta.href} primary>
            {primaryCta.label}
          </CtaButton>
          {secondaryCta && (
            <CtaButton
              href={secondaryCta.href}
              className="border-slate-300 text-slate-700"
            >
              {secondaryCta.label}
            </CtaButton>
          )}
        </div>
      </div>
    </Section>
  );
}
