const CACHE_NAME = "sprachhero-cache-v14";
const APP_BASE_URL = new URL("./", self.registration.scope);

const FILES_TO_CACHE = [
  "",
  "index.html",
  "manifest.json",
  "app.js",
  "src/core/audio.js",
  "src/core/navigation.js",
  "src/core/storage.js",
  "src/core/storage_words.js",
  "src/core/utils.js",
  "src/core/xp.js",
  "src/pages/badges.js",
  "src/pages/dashboard.js",
  "src/pages/learn.js",
  "src/pages/learningpath.js",
  "src/pages/quests.js",
  "src/pages/settings.js",
  "src/pages/start.js",
  "src/pages/trainer.js",
  "src/story/achievementMeta.js",
  "src/story/story.js",
  "src/story/storyData.js",
  "src/story/storyEditor.js",
  "src/story/storyEngine.js",
  "src/ui/sound.js",
  "src/ui/toast.js",
  "src/ui/xp-fly.js",
  "css/core/animations.css",
  "css/core/base.css",
  "css/core/components.css",
  "css/core/layout.css",
  "css/core/mobile.css",
  "css/core/spacing.css",
  "css/core/theme.css",
  "css/core/typography.css",
  "css/sections/badges.css",
  "css/sections/dashboard.css",
  "css/sections/learn.css",
  "css/sections/learningpath.css",
  "css/sections/nav.css",
  "css/sections/quests.css",
  "css/sections/settings.css",
  "css/sections/start.css",
  "css/sections/story.css",
  "css/sections/trainer.css",
  "assets/hero.png",
  "assets/icons/icon-192.png",
  "assets/icons/icon-256.png",
  "assets/icons/icon-512.png",
  "assets/icons/icon-1024.png",
  "assets/sfx/levelup.wav",
  "assets/sounds/achievement.wav",
  "assets/sounds/big_achievement.wav",
  "data/sprachhero_en.csv",
  "data/sprachhero_es.csv",
  "data/sprachhero_fr.csv",
  "data/sprachhero_it.csv",
  "data/sprachhero_la.csv",
  "data/sprachhero_pt.csv",
  ...Array.from({ length: 10 }, (_, i) => `src/story/magic/magic${i + 1}.png`),
  ...Array.from({ length: 10 }, (_, i) => `src/story/comic/comic${i + 1}.png`),
  ...Array.from({ length: 10 }, (_, i) => `src/story/school/school${i + 1}.png`),
  ...Array.from({ length: 10 }, (_, i) => `src/story/magic/magic2-${i + 1}.jpg`),
  ...Array.from({ length: 10 }, (_, i) => `src/story/comic/comic2-${i + 1}.jpg`),
  ...Array.from({ length: 10 }, (_, i) => `src/story/school/school2-${i + 1}.jpg`)
].map(path => new URL(path, APP_BASE_URL).href);

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys
        .filter(key => key.startsWith("sprachhero-cache") && key !== CACHE_NAME)
        .map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== APP_BASE_URL.origin || !requestUrl.pathname.startsWith(APP_BASE_URL.pathname)) return;

  if (requestUrl.pathname.endsWith(".csv")) {
    const cacheUrl = new URL(requestUrl.pathname, APP_BASE_URL).href;
    event.respondWith(
      fetch(event.request).then(response => {
        if (response.ok) {
          return caches.open(CACHE_NAME)
            .then(cache => cache.put(cacheUrl, response.clone()))
            .then(() => response);
        }
        return response;
      }).catch(async () => (await caches.match(cacheUrl)) || Response.error())
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
