import type { NextConfig } from "next";
import { config as loadSecretEnv } from "dotenv";

// Load secrets from .secret.local (gitignored)
loadSecretEnv({ path: ".secret.local" });

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
};

export default nextConfig;
