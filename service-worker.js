/* ============================================================
   SprachHero – SERVICE WORKER (final, ohne Versionsnummer)
   Automatisches Cache-Cleanup + neue CSS-Struktur integriert
   ============================================================ */

const CACHE_NAME = "sprachhero-cache";

const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",

  // JS
  "/app.js",
  "/src/app.js",
  "/src/pages/trainer.js",
  "/src/core/storage.js",
  "/src/core/utils.js",
  "/src/core/navigation.js",

  // CSS – neue Struktur
  "/css/core/base.css",
  "/css/core/components.css",
  "/css/core/layout.css",

  "/css/sections/nav.css",
  "/css/sections/start.css",
  "/css/sections/learn.css",
  "/css/sections/trainer.css",
  "/css/sections/dashboard.css",
  "/css/sections/story.css",
  "/css/sections/learningpath.css",
  "/css/sections/quests.css"

  ];

/* ------------------------------------------------------------
   INSTALL – Cache aufbauen
   ------------------------------------------------------------ */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

/* ------------------------------------------------------------
   ACTIVATE – alte Caches löschen
   ------------------------------------------------------------ */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

/* ------------------------------------------------------------
   FETCH – Cache first, dann Netzwerk
   ------------------------------------------------------------ */
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});
