const CACHE_NAME = 'smartfinanceai-v1';
const CACHE_ASSETS = [
  '/',
  '/SmartFinanceAI/index.html',
  '/SmartFinanceAI/dashboard.html',
  '/SmartFinanceAI/manifest.json',
  '/SmartFinanceAI/styles/main.css',
  '/SmartFinanceAI/assets/img/logo-primary.svg',
  '/SmartFinanceAI/icons/icon-192x192.png',
  '/SmartFinanceAI/icons/icon-512x512.png',
];

// Install and cache key assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHE_ASSETS))
  );
  self.skipWaiting();
});

// Serve from cache if available
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request).catch(() => {
          // Optional fallback if offline
          return caches.match('/SmartFinanceAI/index.html');
        })
      );
    })
  );