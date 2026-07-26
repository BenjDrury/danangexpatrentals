import { TrackedLink } from "../TrackedLink";

type GuideLink = {
  href: string;
  title: string;
  body: string;
};

type ListingGuidesProps = {
  apartmentId: string;
  areaId?: string;
  areaName?: string;
  areaHref?: string;
};

function buildLinks(areaId?: string, areaName?: string, areaHref?: string): GuideLink[] {
  const links: GuideLink[] = [
    {
      href: "/moving-guide/cost-of-living",
      title: "Cost of living",
      body: "Food, transport, utilities, and monthly budget examples — so rent makes sense in context.",
    },
  ];

  if (areaId && areaName) {
    links.push({
      href: areaHref ?? `/areas/${areaId}`,
      title: `${areaName} guide`,
      body: "Rent snapshot, vibe, and what’s nearby in this neighbourhood.",
    });
  } else {
    links.push({
      href: "/moving-guide/neighbourhoods",
      title: "Best areas",
      body: "Beach strips, café hubs, city centre, or quieter inland — how each area feels.",
    });
  }

  links.push(
    {
      href: "/moving-guide/daily-life",
      title: "Daily life",
      body: "Beach mornings, café work days, example day tours, and settling-in logistics.",
    },
    {
      href: "/moving-guide/visas",
      title: "Visas & stays",
      body: "Practical orientation for short visits and longer stays while you plan housing.",
    },
    {
      href: "/avoid-scams",
      title: "Avoid rental scams",
      body: "What to watch for when renting in Da Nang — and how we verify listings.",
    },
  );

  return links;
}

/** Informational guide links below an apartment listing. */
export function ListingGuides({
  apartmentId,
  areaId,
  areaName,
  areaHref,
}: ListingGuidesProps) {
  const links = buildLinks(areaId, areaName, areaHref);

  return (
    <section className="w-full border-t border-line bg-sand/40 py-14 sm:py-16">
      <div className="content-band">
        <p className="text-sm font-medium text-ocean">While you’re looking</p>
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-charcoal sm:text-3xl">
          Useful guides
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
          Practical notes beyond this apartment — costs, neighbourhoods, and settling in.
        </p>

        <ul className="mt-8 divide-y divide-line border-y border-line">
          {links.map((link) => (
            <li key={link.href}>
              <TrackedLink
                href={link.href}
                event="listing_guide_clicked"
                eventProps={{
                  apartment_id: apartmentId,
                  area_id: areaId,
                  guide: link.href,
                }}
                className="group flex items-center justify-between gap-4 py-5 transition"
              >
                <div>
                  <h3 className="font-display text-base font-semibold text-charcoal transition group-hover:text-ocean sm:text-lg">
                    {link.title}
                  </h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted">{link.body}</p>
                </div>
                <span aria-hidden className="shrink-0 text-muted transition group-hover:text-ocean">
                  →
                </span>
              </TrackedLink>
            </li>
          ))}
        </ul>

        <p className="mt-6">
          <TrackedLink
            href="/moving-guide"
            event="listing_guide_clicked"
            eventProps={{
              apartment_id: apartmentId,
              area_id: areaId,
              guide: "/moving-guide",
            }}
            className="text-sm font-semibold text-ocean transition hover:text-ocean-deep"
          >
            Browse the full living guide →
          </TrackedLink>
        </p>
      </div>
    </section>
  );
}
