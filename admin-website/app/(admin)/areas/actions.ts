"use server";

import { revalidatePath } from "next/cache";
import { createClient, getServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

const AREAS_BUCKET = "areas";

export async function updateArea(
  id: string,
  formData: { name: string; images: string[]; vibe: string; price_range: string; who: string }
) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized. Only admins can edit areas." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("areas")
    .update({
      name: formData.name,
      images: formData.images,
      vibe: formData.vibe,
      price_range: formData.price_range,
      who: formData.who,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/areas");
  revalidatePath(`/areas/${id}/edit`);
  return { error: null };
}

export async function listAreaBucketImages(): Promise<
  { error: string | null; files?: { url: string; name: string }[] }
> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized." };
  const supabase = getServiceRoleClient();
  if (!supabase) return { error: "Storage not configured. Set SUPABASE_SERVICE_ROLE_KEY in .env." };
  const { data, error } = await supabase.storage.from(AREAS_BUCKET).list("", { limit: 200 });
  if (error) return { error: error.message };
  const baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${AREAS_BUCKET}`;
  const files = (data ?? [])
    .filter((f) => f.name && !f.name.startsWith("."))
    .map((f) => ({ name: f.name, url: `${baseUrl}/${encodeURIComponent(f.name)}` }));
  return { error: null, files };
}

export async function uploadAreaImage(
  _prev: unknown,
  formData: FormData
): Promise<{ error: string | null; url?: string }> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized." };
  const file = formData.get("file") as File | null;
  if (!file?.size) return { error: "No file selected." };
  const supabase = getServiceRoleClient();
  if (!supabase) return { error: "Storage not configured. Set SUPABASE_SERVICE_ROLE_KEY in .env." };
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const { data, error } = await supabase.storage.from(AREAS_BUCKET).upload(safeName, file, { upsert: true });
  if (error) return { error: error.message };
  const baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${AREAS_BUCKET}`;
  const url = `${baseUrl}/${encodeURIComponent(data.path)}`;
  return { error: null, url };
}

export async function deleteAreaBucketImage(name: string): Promise<{ error: string | null }> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized." };
  const supabase = getServiceRoleClient();
  if (!supabase) return { error: "Storage not configured. Set SUPABASE_SERVICE_ROLE_KEY in .env." };
  const { error } = await supabase.storage.from(AREAS_BUCKET).remove([name]);
  if (error) return { error: error.message };
  return { error: null };
}
