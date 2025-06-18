const CACHE_NAME = "smartfinance-v1";
const urlsToCache = [
  "/SmartFinanceAI/",
  "/SmartFinanceAI/index.html",
  "/SmartFinanceAI/manifest.json",
  "/SmartFinanceAI/styles/main.css",
  "/SmartFinanceAI/scripts/main.js"
];

// Install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) return caches.delete(cache);
        })
      )
    )
  );
});

// Fetch
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});