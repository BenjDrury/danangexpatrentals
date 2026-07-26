import type { NextConfig } from "next";
import { config as loadSecretEnv } from "dotenv";

// Load secrets from .secret.local (gitignored)
loadSecretEnv({ path: ".secret.local" });

function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

async function seoRedirects(): Promise<
  { source: string; destination: string; permanent: boolean }[]
> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(url, key);
    const redirects: { source: string; destination: string; permanent: boolean }[] =
      [];

    const { data: areas } = await supabase
      .from("areas")
      .select("id, name")
      .order("id");
    for (const area of areas ?? []) {
      const slug = slugify(String(area.name)) || String(area.id);
      if (slug && slug !== area.id) {
        redirects.push({
          source: `/areas/${area.id}`,
          destination: `/areas/${slug}`,
          permanent: true,
        });
      }
    }

    const { data: apartments } = await supabase
      .from("apartments")
      .select("id, title, public_slug");
    for (const apt of apartments ?? []) {
      const id = String(apt.id);
      const stored = apt.public_slug ? String(apt.public_slug).trim() : "";
      const derivedBase =
        slugify(String(apt.title ?? ""))
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 48) || "apartment";
      const destination = stored
        ? `/apartments/${stored}`
        : `/apartments/${derivedBase}-${id.slice(0, 8)}`;
      if (destination !== `/apartments/${id}`) {
        redirects.push({
          source: `/apartments/${id}`,
          destination,
          permanent: true,
        });
      }
    }

    return redirects;
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "images.pexels.com", pathname: "/**" },
      { protocol: "https", hostname: "mxjduqjqsgmztnjyfbfv.supabase.co", pathname: "/storage/v1/object/public/**" },
      // Facebook CDN (apartment imports) — regional hosts vary (scontent.*.fbcdn.net)
      { protocol: "https", hostname: "*.fbcdn.net", pathname: "/**" },
      { protocol: "https", hostname: "**.fbcdn.net", pathname: "/**" },
    ],
  },
  async redirects() {
    return seoRedirects();
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://eu-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
