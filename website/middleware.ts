import { type NextRequest } from "next/server";
import { syncSharedAuth } from "@/lib/supabase/auth-proxy";

export async function middleware(request: NextRequest) {
  return syncSharedAuth(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/data|favicon.ico|robots.txt|sitemap|ingest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|woff2?)$).*)",
  ],
};
