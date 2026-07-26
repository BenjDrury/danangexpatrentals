import type { ReactNode } from "react";
import { Section } from "./sections";

export function LegalDoc({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-foam">
      <Section bg="bg-white">
        <article className="mx-auto max-w-2xl">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-charcoal sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-sm text-muted">Last updated: {updated}</p>
          <div className="legal-prose mt-10 space-y-8 text-base leading-relaxed text-charcoal/85">
            {children}
          </div>
        </article>
      </Section>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-xl font-semibold tracking-tight text-charcoal">
        {title}
      </h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
