import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const VISITOR_COOKIE = "dner_vid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const apartmentId =
    body &&
    typeof body === "object" &&
    "apartmentId" in body &&
    typeof (body as { apartmentId: unknown }).apartmentId === "string"
      ? (body as { apartmentId: string }).apartmentId.trim()
      : "";

  if (!UUID_RE.test(apartmentId)) {
    return new NextResponse(null, { status: 400 });
  }

  const cookieStore = await cookies();
  const existing = cookieStore.get(VISITOR_COOKIE)?.value;
  const visitorId = existing && UUID_RE.test(existing) ? existing : crypto.randomUUID();
  const isNewVisitor = visitorId !== existing;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const { error } = await supabase.rpc("record_listing_view", {
      p_apartment_id: apartmentId,
      p_visitor_id: visitorId,
    });
    if (error) {
      console.error("record_listing_view error:", error);
      return new NextResponse(null, { status: 500 });
    }
  }

  const response = new NextResponse(null, { status: 204 });
  if (isNewVisitor) {
    response.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
  }
  return response;
}
