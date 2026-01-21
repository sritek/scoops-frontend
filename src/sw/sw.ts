/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

// Extend the ServiceWorkerGlobalScope with Serwist's types
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    // __SW_MANIFEST is injected by @serwist/next at build time
    // It contains all the URLs that should be precached
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  // Precache all assets from the manifest (generated at build time)
  precacheEntries: self.__SW_MANIFEST,

  // skipWaiting: When a new SW is installed, activate immediately
  // (don't wait for all tabs to close)
  skipWaiting: true,

  // clientsClaim: Take control of all open tabs immediately
  clientsClaim: true,

  // navigationPreload: Speed up navigation by starting network request
  // while SW is booting up
  navigationPreload: true,

  // runtimeCaching: Strategies for caching different types of requests
  // defaultCache includes sensible defaults for Next.js
  runtimeCaching: defaultCache,

  // Optional: Fallback page when offline and page isn't cached
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

// Register all the event listeners (install, activate, fetch, etc.)
serwist.addEventListeners();
