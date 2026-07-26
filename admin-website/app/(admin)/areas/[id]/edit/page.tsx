import Link from "next/link";
import { notFound } from "next/navigation";
import { getAreaById } from "@/lib/data";
import { AreaEditForm } from "../AreaEditForm";

type Props = { params: Promise<{ id: string }> };

export default async function EditAreaPage({ params }: Props) {
  const { id } = await params;
  const area = await getAreaById(id);
  if (!area) notFound();

  return (
    <div className="animate-fade-up">
      <Link
        href="/areas"
        className="text-sm font-medium text-ocean transition hover:text-ocean-deep"
      >
        ← Areas
      </Link>
      <h1 className="mt-4 page-title">Edit area: {area.name}</h1>
      <p className="mt-1 text-sm text-muted" title={area.id}>
        Neighbourhood guide content & hero images
      </p>

      <AreaEditForm
        area={{
          id: area.id,
          name: area.name,
          images: Array.isArray(area.images) ? (area.images as string[]) : [],
          vibe: area.vibe ?? "",
          price_range: area.price_range ?? "",
          who: area.who ?? "",
        }}
      />
    </div>
  );
}
