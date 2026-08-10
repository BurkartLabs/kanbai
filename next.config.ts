import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits .next/standalone with a self-contained server.js and only the
  // node_modules actually reachable at runtime. Much smaller to ship to the
  // VPS, and it means production doesn't need a full `npm install`.
  output: "standalone",
};

export default nextConfig;
