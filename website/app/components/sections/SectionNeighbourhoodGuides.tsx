import Image from "next/image";
import Link from "next/link";
import { Section } from "./Section";

export type NeighbourhoodGuide = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
};

type SectionNeighbourhoodGuidesProps = {
  heading?: string;
  description?: string;
  guides: NeighbourhoodGuide[];
};

export function SectionNeighbourhoodGuides({
  heading = "Neighbourhoods",
  description = "A quick feel for the main areas — beach, cafés, city, or somewhere quieter.",
  guides,
}: SectionNeighbourhoodGuidesProps) {
  return (
    <Section bg="bg-sand/50">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-ocean">Where to stay</p>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-charcoal sm:text-4xl">
          {heading}
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-muted">{description}</p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {guides.map((guide) => (
          <Link
            key={guide.id}
            href={`/areas/${guide.id}`}
            className="group overflow-hidden rounded-2xl border border-line/80 bg-white shadow-[0_8px_30px_rgba(42,42,40,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(42,42,40,0.08)]"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-sand">
              <Image
                src={guide.image}
                alt={guide.name}
                fill
                className="object-cover transition duration-700 ease-soft group-hover:scale-[1.04]"
                sizes="(max-width: 640px) 100vw, 28rem"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal/50 to-transparent p-4 pt-12">
                <p className="text-sm font-medium text-white/90">{guide.tagline}</p>
              </div>
            </div>
            <div className="p-5 sm:p-6">
              <h3 className="font-display text-xl font-semibold tracking-tight text-charcoal transition group-hover:text-ocean">
                {guide.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{guide.description}</p>
              <span className="mt-4 inline-flex text-sm font-semibold text-ocean">
                Explore area →
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10">
        <Link
          href="/areas"
          className="inline-flex rounded-xl border border-line bg-white px-5 py-3 text-sm font-semibold text-charcoal transition hover:bg-foam"
        >
          Browse all neighbourhoods
        </Link>
      </div>
    </Section>
  );
}
