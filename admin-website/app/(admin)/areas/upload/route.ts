import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

const AREAS_BUCKET = "areas";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Storage not configured. Set SUPABASE_SERVICE_ROLE_KEY in .env." },
      { status: 500 }
    );
  }
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }
  const file = formData.get("file") as File | null;
  if (!file?.size) {
    return NextResponse.json({ error: "No file selected." }, { status: 400 });
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const { data, error } = await supabase.storage
    .from(AREAS_BUCKET)
    .upload(safeName, file, { upsert: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${AREAS_BUCKET}`;
  const url = `${baseUrl}/${encodeURIComponent(data.path)}`;
  return NextResponse.json({ url });
}
