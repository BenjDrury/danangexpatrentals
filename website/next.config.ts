import type { NextConfig } from "next";
import { config as loadSecretEnv } from "dotenv";

// Load secrets from .secret.local (gitignored)
loadSecretEnv({ path: ".secret.local" });

const nextConfig: NextConfig = {
  transpilePackages: ["backend"],
};

export default nextConfig;
