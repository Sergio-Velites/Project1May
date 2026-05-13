// SERVICE WORKER KILL-SWITCH — limpia cachés y se autodesinstala.
self.addEventListener("install", () => { self.skipWaiting(); });
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    try { const k = await caches.keys(); await Promise.all(k.map(c => caches.delete(c))); } catch {}
    try { await self.clients.claim(); } catch {}
    try { await self.registration.unregister(); } catch {}
    try { const cl = await self.clients.matchAll({ type: "window" }); for (const c of cl) c.navigate(c.url); } catch {}
  })());
});
self.addEventListener("fetch", () => {});
