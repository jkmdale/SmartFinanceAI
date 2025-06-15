const CACHE_NAME = 'smartfinance-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/budget.html',
  '/dashboard.html',
  '/styles.css',
  '/glass.css',
  '/js/main.js',
  '/js/auth.js',
  '/js/budget.js',
  '/js/dashboard.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request);
    })
  );
});