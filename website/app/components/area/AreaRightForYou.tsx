import Image from "next/image";
import type { Area } from "types";
import { Section } from "@/app/components/sections";
import { getWhoTags, isEmpty } from "@/lib/area-utils";

type AreaRightForYouProps = { area: Area };

function Card({
  title,
  children,
  variant = "default",
}: {
  title: string;
  children: React.ReactNode;
  variant?: "default" | "tradeoff";
}) {
  return (
    <div
      className={
        variant === "tradeoff"
          ? "rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/80 to-white p-5 shadow-sm"
          : "rounded-2xl border border-teal-200/60 bg-gradient-to-br from-teal-50/40 to-white p-5 shadow-sm"
      }
    >
      <h3
        className={
          variant === "tradeoff"
            ? "text-sm font-semibold uppercase tracking-wider text-amber-800"
            : "text-sm font-semibold uppercase tracking-wider text-teal-800"
        }
      >
        {title}
      </h3>
      <div className="mt-3 text-slate-700">{children}</div>
    </div>
  );
}

export function AreaRightForYou({ area }: AreaRightForYouProps) {
  const whoTags = getWhoTags(area.who);
  const extraBestFor: string[] = [];
  if (!isEmpty(area.tenant_profile_tag)) extraBestFor.push(area.tenant_profile_tag!);
  if (!isEmpty(area.expat_community_presence))
    extraBestFor.push(`Expat community: ${area.expat_community_presence!}`);

  const tradeoffs: { title: string; text: string }[] = [];
  if (!isEmpty(area.safety_notes))
    tradeoffs.push({ title: "Safety", text: area.safety_notes! });
  if (!isEmpty(area.noise_air_quality_notes))
    tradeoffs.push({
      title: "Noise & air",
      text: area.noise_air_quality_notes!,
    });
  if (!isEmpty(area.flood_typhoon_risk))
    tradeoffs.push({ title: "Weather risk", text: area.flood_typhoon_risk! });

  const hasBestFor = whoTags.length > 0 || extraBestFor.length > 0;
  if (!hasBestFor && tradeoffs.length === 0) return null;

  const gallery = (area as { images?: string[] | null }).images?.filter(Boolean) ?? [];
  const sideImage = gallery.length > 1 ? gallery[1] : gallery[0] ?? null;

  return (
    <Section bg="bg-white">
      <p className="text-sm font-medium uppercase tracking-wider text-teal-600">
        A good fit?
      </p>
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Who {area.name} suits — and what to know
      </h2>
      <p className="mt-2 max-w-2xl text-slate-600">
        Best for certain lifestyles; a few things to keep in mind before you decide.
      </p>
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr,minmax(280px,360px)] lg:items-start">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-slate-800">Best for</h3>
            {hasBestFor ? (
              <Card title="Who it suits">
                <div className="flex flex-wrap gap-2">
                  {whoTags.map((label) => (
                    <span
                      key={label}
                      className="inline-flex rounded-full bg-teal-100 px-3.5 py-1.5 text-sm font-medium text-teal-800"
                    >
                      {label}
                    </span>
                  ))}
                </div>
                {extraBestFor.length > 0 && (
                  <ul className="mt-3 list-inside list-disc space-y-1 text-sm leading-relaxed text-slate-700">
                    {extraBestFor.map((text, i) => (
                      <li key={i}>{text}</li>
                    ))}
                  </ul>
                )}
              </Card>
            ) : (
              <p className="text-slate-500">—</p>
            )}
          </div>
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-slate-800">Things to know</h3>
            {tradeoffs.length > 0 ? (
              <div className="space-y-3">
                {tradeoffs.map((t) => (
                  <Card key={t.title} title={t.title} variant="tradeoff">
                    <p className="text-sm leading-relaxed">{t.text}</p>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-500">
                No major tradeoffs noted for this area.
              </p>
            )}
          </div>
        </div>
        {sideImage && (
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-md lg:sticky lg:top-6">
            <Image
              src={sideImage}
              alt=""
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 360px, 100vw"
            />
          </div>
        )}
      </div>
    </Section>
  );
}
