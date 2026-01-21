import type { NextConfig } from "next";
import withSerwist from "@serwist/next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {},
};

export default withSerwist({
  // Where your service worker source code is
  swSrc: "src/sw/sw.ts",

  // Where to output the compiled service worker
  swDest: "public/sw.js",

  // Disable SW in development (it caches aggressively, annoying in dev)
  disable: process.env.NODE_ENV === "development",

  // Optional: Additional files to precache
  // additionalPrecacheEntries: [{ url: "/offline", revision: "1" }],
})(nextConfig);
