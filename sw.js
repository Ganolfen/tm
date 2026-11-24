/* Time & Motion service worker: keeps the app's own files on the phone so it opens with no signal.
   It caches only the app (never session data, which lives in IndexedDB). Bump VERSION with every release. */
const VERSION = "tm-0.2.0-phase2";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-512.png"];
// Install fetches past the browser's HTTP cache (GitHub Pages lets browsers keep files ~10 min), so an update gets the new files.
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Cache first, so the app opens instantly and offline; a fresh copy is fetched in the background for next time.
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(caches.open(VERSION).then(async (c) => {
    const hit = await c.match(req, { ignoreSearch: true });
    const net = fetch(req, { cache: "no-cache" }).then((r) => { if (r && r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
    return hit || (await net) || new Response("Offline and not cached", { status: 503 });
  }));
});
