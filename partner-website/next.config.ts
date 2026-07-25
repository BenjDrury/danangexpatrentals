import type { NextConfig } from "next";
import path from "path";
import { config as loadSecretEnv } from "dotenv";

// Load before config object — absolute path so cwd does not matter
loadSecretEnv({ path: path.join(__dirname, ".secret.local") });

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "**.fbcdn.net", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
