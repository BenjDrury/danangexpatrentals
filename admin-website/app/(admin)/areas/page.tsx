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
          {areas.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4"
            >
              <div className="min-w-0">
                <span className="font-display text-lg font-semibold text-charcoal">
                  {a.name}
                </span>
                <span className="ml-3 text-sm text-muted">{a.id}</span>
              </div>
              <Link href={`/areas/${a.id}/edit`} className="btn-primary px-3 py-1.5">
                Edit
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
