import Link from "next/link";
import { Section } from "./Section";

export type Testimonial = {
  quote: string;
  author: string;
};

type SectionTrustTeaserProps = {
  heading: string;
  description: string;
  linkHref: string;
  linkLabel: string;
  testimonials: Testimonial[];
};

/**
 * "Why foreigners trust us" style section: heading, short text, link, and 2 testimonial blockquotes.
 */
export function SectionTrustTeaser({
  heading,
  description,
  linkHref,
  linkLabel,
  testimonials,
}: SectionTrustTeaserProps) {
  return (
    <Section bg="bg-white">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
          {heading}
        </h2>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600">
          {description}
        </p>
        <Link
          href={linkHref}
          className="mt-6 inline-flex text-teal-600 font-semibold hover:text-teal-700"
        >
          {linkLabel}
        </Link>
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {testimonials.map((t) => (
          <blockquote
            key={t.author}
            className="rounded-2xl border border-slate-200 bg-slate-50/80 p-8"
          >
            <p className="text-slate-700">&ldquo;{t.quote}&rdquo;</p>
            <footer className="mt-4 font-medium text-slate-900">
              — {t.author}
            </footer>
          </blockquote>
        ))}
      </div>
    </Section>
  );
}
