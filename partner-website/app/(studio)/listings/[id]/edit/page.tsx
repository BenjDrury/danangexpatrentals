import { redirect } from "next/navigation";

/** Legacy edit URL — listing management lives in the workspace Details tab. */
export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/listings/${id}?tab=details`);
}
