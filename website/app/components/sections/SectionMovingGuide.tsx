import Image from "next/image";
import Link from "next/link";
import { Section } from "./Section";
import { CtaButton } from "../CtaButton";

const HOME_TOPICS = [
  {
    href: "/moving-guide/daily-life",
    title: "Daily life",
    body: "Example day tours with photos — beach mornings, Hội An, Son Tra loops.",
  },
  {
    href: "/moving-guide/cost-of-living",
    title: "Cost of living",
    body: "Housing, food, transport, surf lessons — realistic example prices.",
  },
  {
    href: "/moving-guide/coworking",
    title: "Coworking",
    body: "Live registry of work spots and desk options.",
  },
  {
    href: "/moving-guide/activities",
    title: "Things to do",
    body: "Surf, yoga, day trips, and food — with ballpark prices.",
  },
] as const;

export function SectionMovingGuide() {
  return (
    <Section bg="bg-sand/60">
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_10px_40px_rgba(42,42,40,0.05)]">
        <div className="grid lg:grid-cols-2">
          <div className="relative min-h-[240px] bg-sand lg:min-h-full">
            <Image
              src="/danang-my-khe.jpg"
              alt="Da Nang coastline"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 28rem"
            />
          </div>
          <div className="p-7 sm:p-9">
            <p className="text-sm font-medium text-ocean">City guide</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-charcoal">
              Living in Da Nang
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted">
              Practical notes beyond the apartment — start with how daily life actually feels.
            </p>

            <ul className="mt-7 divide-y divide-line border-y border-line">
              {HOME_TOPICS.map((topic) => (
                <li key={topic.href}>
                  <Link
                    href={topic.href}
                    className="group flex items-center justify-between gap-4 py-4 transition"
                  >
                    <div>
                      <h3 className="font-display text-base font-semibold text-charcoal transition group-hover:text-ocean">
                        {topic.title}
                      </h3>
                      <p className="mt-0.5 text-sm text-muted">{topic.body}</p>
                    </div>
                    <span aria-hidden className="text-muted transition group-hover:text-ocean">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-7">
              <CtaButton href="/moving-guide/daily-life" variant="primary">
                Explore daily life
              </CtaButton>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
