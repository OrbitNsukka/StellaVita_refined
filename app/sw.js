// StellaVita service worker: saves the whole app on the first visit, then
// answers every request from that saved copy, so the app works with no network.
// It never asks another site for anything.
//
// The two lines between the marks are written by `node tools/stamp_sw.mjs`.
// Run it after changing any file in app/. A test fails if it is forgotten.

// BEGIN STAMP
const VERSION = "c04e832bfb9c553f";
const FILES = ["./","css/app.css","data/Guidance_Content.md","data/Hazard_Links.json","data/Indicator_Thresholds.json","data/Limits_Statement.md","data/synthetic_demo_data.csv","data/synthetic_demo_data.meta.json","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/icon.svg","index.html","js/content.js","js/engine.js","js/entry.js","js/export.js","js/hazards.js","js/labels.js","js/sample.js","js/settings.js","js/store.js","js/ui.js","manifest.webmanifest"];
// END STAMP

const CACHE_PREFIX = "stellavita-refined-";
const CACHE = `${CACHE_PREFIX}${VERSION}`;
const START = "./";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // "reload" skips the browser's own cache, so the saved copy is the one on the server now.
      await cache.addAll(FILES.map((file) => new Request(file, { cache: "reload" })));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Only this app's own earlier copies are removed. Other apps on the same site keep theirs.
      for (const name of await caches.keys()) {
        if (name.startsWith(CACHE_PREFIX) && name !== CACHE) await caches.delete(name);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  // Nothing leaves the device: a request to another site is refused here.
  if (new URL(request.url).origin !== self.location.origin) {
    event.respondWith(Response.error());
    return;
  }
  if (request.method !== "GET") return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const saved = await cache.match(request, { ignoreSearch: true });
      if (saved) return saved;
      if (request.mode === "navigate") {
        const start = await cache.match(START);
        if (start) return start;
      }
      return fetch(request);
    })(),
  );
});
