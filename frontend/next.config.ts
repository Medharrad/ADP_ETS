import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root so Next.js doesn't get confused by the
  // root-level lockfile (used for the concurrently dev script).
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
