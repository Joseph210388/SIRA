self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const path = new URL(event.request.url).pathname;
  // Los trozos de Next cambian en cada arranque. Si el worker los intercepta, al volver atrás el navegador pide un archivo que ya no existe.
  if (path.startsWith("/_next/")) return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
