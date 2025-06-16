// SmartFinanceAI Service Worker
const CACHE_NAME = 'smartfinanceai-v1.0.0';
const urlsToCache = [
  '/SmartFinanceAI/',
  '/SmartFinanceAI/index.html',
  '/SmartFinanceAI/src/core/dashboard.html',
  '/SmartFinanceAI/src/auth/login.html',
  '/SmartFinanceAI/src/auth/signup.html',
  '/SmartFinanceAI/manifest.json',
  // Add your CSS files
  '/SmartFinanceAI/styles/global.css',
  '/SmartFinanceAI/styles/auth.css',
  // Add your JS files
  '/SmartFinanceAI/core/config.js',
  '/SmartFinanceAI/auth/biometric.js',
  // Icons
  '/SmartFinanceAI/icons/icon-192.png',
  '/SmartFinanceAI/icons/icon-512.png'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Service Worker: Cache failed', error);
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch Event - Cache First Strategy
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external requests (like Supabase, CDN, etc.)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          console.log('Service Worker: Serving from cache', event.request.url);
          return response;
        }

        console.log('Service Worker: Fetching from network', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.log('Service Worker: Fetch failed', error);
            
            // Return offline page if available
            if (event.request.destination === 'document') {
              return caches.match('/SmartFinanceAI/offline.html');
            }
          });
      })
  );
});

// Background Sync for offline functionality
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

// Push Notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'New financial update available!',
    icon: '/SmartFinanceAI/icons/icon-192.png',
    badge: '/SmartFinanceAI/icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/SmartFinanceAI/icons/icon-192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/SmartFinanceAI/icons/icon-192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('SmartFinanceAI', options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/SmartFinanceAI/src/core/dashboard.html')
    );
  }
});

// Background sync function
async function doBackgroundSync() {
  try {
    // Sync offline transactions, goals, etc.
    console.log('Service Worker: Performing background sync');
    
    // Add your sync logic here
    // Example: sync pending transactions to Supabase
    
  } catch (error) {
    console.log('Service Worker: Background sync failed', error);
  }
}