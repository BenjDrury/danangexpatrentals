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
    ],
  },
};

export default nextConfig;
