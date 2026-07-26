import Link from "next/link";
import { getAreas } from "@/lib/data";

export default async function AdminAreasPage() {
  const areas = await getAreas();

  return (
    <div className="animate-fade-up">
      <h1 className="page-title">Areas</h1>
      <p className="page-lead">
        Edit areas shown on the main site. Changes appear on the public areas page.
      </p>

      {areas.length === 0 ? (
        <p className="mt-6 text-muted">
          No areas yet. Run the Supabase seed or add in Supabase Table Editor.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-line/80 border-y border-line/80">
          {areas.map((a) => {
            const thumb =
              Array.isArray(a.images) && a.images.length > 0
                ? String(a.images.find(Boolean) ?? "")
                : "";
            return (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-quieter bg-sand">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full items-center justify-center text-[10px] text-muted">
                        No img
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <span
                      className="font-display text-lg font-semibold text-charcoal"
                      title={a.id}
                    >
                      {a.name}
                    </span>
                    {a.vibe ? (
                      <p className="mt-0.5 line-clamp-1 text-sm text-muted">{a.vibe}</p>
                    ) : null}
                  </div>
                </div>
                <Link href={`/areas/${a.id}/edit`} className="btn-primary px-3 py-1.5">
                  Edit
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
