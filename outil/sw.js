/* =============================================================================
   Service Worker — fonctionnement HORS-LIGNE (condition 1).
   Met en cache les fichiers de l'application pour qu'elle se recharge sans
   connexion (utile sur un terrain de sport sans wifi).
   Chemins RELATIFS : compatible avec le sous-chemin GitHub Pages.
   Pour publier une mise à jour, incrémentez CACHE_VERSION.
   ============================================================================= */
const CACHE_VERSION = "adp-rm-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  // Cache-first : sert depuis le cache, met à jour en arrière-plan si en ligne.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((resp) => {
          if (resp && resp.status === 200 && resp.type === "basic") {
            const copy = resp.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
          }
          return resp;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
