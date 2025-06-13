// SmartFinanceAI Service Worker
const CACHE_NAME = 'smartfinance-v1.0.0';
const STATIC_CACHE = 'smartfinance-static-v1';
const DYNAMIC_CACHE = 'smartfinance-dynamic-v1';

// Files to cache for offline functionality
const STATIC_FILES = [
  './',
  './index.html',
  './login.html',
  './dashboard.html',
  './manifest.json',
  './public/icons/favicon-16.png',
  './public/icons/favicon-32.png',
  './public/icons/favicon-48.png',
  './public/icons/icon-192.png',
  './public/icons/icon-512.png',
  './public/icons/apple-touch-icon.png'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('✅ Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached files or fetch from network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle different types of requests
  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('📱 Service Worker: Serving from cache:', request.url);
            return cachedResponse;
          }

          // Not in cache, fetch from network
          return fetch(request)
            .then((networkResponse) => {
              // Don't cache non-successful responses
              if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                return networkResponse;
              }

              // Clone the response before caching
              const responseClone = networkResponse.clone();

              // Cache dynamic content
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseClone);
                });

              console.log('🌐 Service Worker: Fetched from network:', request.url);
              return networkResponse;
            })
            .catch(() => {
              // Network failed, try to serve offline fallback
              if (request.destination === 'document') {
                return caches.match('./index.html');
              }
            });
        })
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background sync triggered');
  
  if (event.tag === 'financial-data-sync') {
    event.waitUntil(syncFinancialData());
  }
});

// Push notifications for financial alerts
self.addEventListener('push', (event) => {
  console.log('📢 Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'You have new financial insights!',
    icon: './public/icons/icon-192.png',
    badge: './public/icons/favicon-32.png',
    vibrate: [200, 100, 200],
    data: {
      url: './dashboard.html'
    },
    actions: [
      {
        action: 'view',
        title: 'View Dashboard',
        icon: './public/icons/icon-192.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('SmartFinanceAI', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Service Worker: Notification clicked');
  
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('./dashboard.html')
    );
  }
});

// Helper function for syncing financial data
async function syncFinancialData() {
  try {
    console.log('💰 Service Worker: Syncing financial data...');
    
    // In a real app, sync with your financial API
    const response = await fetch('/api/sync-financial-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      console.log('✅ Service Worker: Financial data synced successfully');
      
      // Show success notification
      self.registration.showNotification('SmartFinanceAI', {
        body: 'Your financial data has been updated!',
        icon: './public/icons/icon-192.png',
        tag: 'sync-success'
      });
    }
  } catch (error) {
    console.error('❌ Service Worker: Failed to sync financial data', error);
  }
}

// Handle app updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('🔄 Service Worker: Skipping waiting, updating app...');
    self.skipWaiting();
  }
});

// Periodic background sync for financial data
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'financial-update') {
    console.log('⏰ Service Worker: Periodic sync for financial updates');
    event.waitUntil(syncFinancialData());
  }
});

console.log('🚀 SmartFinanceAI Service Worker loaded successfully!');