// ──────────────────────────────────────────────────────────────────────────
// SERVICE WORKER KILL-SWITCH
// ──────────────────────────────────────────────────────────────────────────
// El SW de CRA/Workbox que estaba aquí cacheaba agresivamente todo el
// bundle, impidiendo que los usuarios recibieran nuevos deploys hasta
// cerrar todas las pestañas. Esto rompía la experiencia tras cada fix.
//
// Este SW se instala automáticamente cuando un cliente con el SW antiguo
// detecta que el archivo /game/service-worker.js cambió. Al activarse:
//   1. Salta el waiting → toma control inmediato.
//   2. Borra TODAS las cachés (precache de Workbox + cualquier otra).
//   3. Se desinstala a sí mismo (registration.unregister()).
//   4. Recarga las pestañas activas para servir el bundle fresco de red.
//
// Tras esto, las próximas visitas no tendrán SW y siempre obtendrán el
// HTML/JS más reciente directamente de Vercel (con sus headers no-store).
// ──────────────────────────────────────────────────────────────────────────

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch (e) {
        // ignore
      }
      try {
        await self.clients.claim();
      } catch (e) {
        // ignore
      }
      try {
        await self.registration.unregister();
      } catch (e) {
        // ignore
      }
      try {
        const clientsList = await self.clients.matchAll({ type: "window" });
        for (const client of clientsList) {
          client.navigate(client.url);
        }
      } catch (e) {
        // ignore
      }
    })()
  );
});

self.addEventListener("fetch", () => {
  // No interceptamos: el navegador hace fetch normal a la red.
});
