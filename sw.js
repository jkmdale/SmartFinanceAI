const CACHE_NAME = 'smartfinanceai-v1';
const CACHE_ASSETS = [
  '/SmartFinanceAI/index.html',
  '/SmartFinanceAI/src/core/dashboard.html',
  '/SmartFinanceAI/manifest.json',
  '/SmartFinanceAI/styles/main.css',
  '/SmartFinanceAI/assets/img/logo-primary.svg'
];

// Install and cache files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHE_ASSETS))
  );
  self.skipWaiting();
});

// Activate and clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME && caches.delete(key)))
    )
  );
  self.clients.claim();
});

// Fetch from cache or network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request).catch(() => caches.match('/SmartFinanceAI/index.html'))
      );
    })
  );
});