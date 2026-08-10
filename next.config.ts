import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Note: no `output: "standalone"`. That's for self-hosting, where you copy
  // .next/standalone and run server.js yourself. Vercel produces its own
  // output format, so setting it there is at best redundant.
};

export default nextConfig;
