import type { NextConfig } from "next";
import { config as loadSecretEnv } from "dotenv";
import {
  apartmentPath,
  areaPath,
  areaSlug,
  areaSlugAliases,
} from "./lib/area-utils";

// Load secrets from .secret.local (gitignored)
loadSecretEnv({ path: ".secret.local" });

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
    const seen = new Set<string>();

    const pushRedirect = (source: string, destination: string) => {
      if (!source || source === destination || seen.has(source)) return;
      seen.add(source);
      redirects.push({ source, destination, permanent: true });
    };

    const { data: areas } = await supabase
      .from("areas")
      .select("id, name, canonical_area_name")
      .order("id");
    for (const area of areas ?? []) {
      const fields = {
        id: String(area.id),
        name: String(area.name ?? ""),
        canonical_area_name: area.canonical_area_name
          ? String(area.canonical_area_name)
          : null,
      };
      const destination = areaPath(fields);
      const canonical = areaSlug(fields);
      for (const alias of areaSlugAliases(fields)) {
        if (alias === canonical) continue;
        pushRedirect(`/areas/${alias}`, destination);
      }
    }

    const { data: apartments } = await supabase
      .from("apartments")
      .select("id, title, public_slug");
    for (const apt of apartments ?? []) {
      const destination = apartmentPath({
        id: String(apt.id),
        title: apt.title ? String(apt.title) : null,
        public_slug: apt.public_slug ? String(apt.public_slug) : null,
      });
      pushRedirect(`/apartments/${String(apt.id)}`, destination);
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
