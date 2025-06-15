/**
 * SmartFinanceAI Service Worker
 * Handles caching, offline functionality, and background sync
 */

const CACHE_NAME = 'smartfinance-v1.0.0';
const STATIC_CACHE = 'smartfinance-static-v1.0.0';
const DYNAMIC_CACHE = 'smartfinance-dynamic-v1.0.0';

// Files to cache immediately when service worker installs
const STATIC_FILES = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/transactions.html',
  '/goals.html',
  '/settings.html',
  '/styles.css',
  '/responsive.css',
  '/app.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/manifest.json'
];

// Files to cache on first request
const CACHE_ON_REQUEST = [
  '/api/',
  '/data/',
  '/images/'
];

/**
 * Service Worker Installation
 * Cache static files immediately
 */
self.addEventListener('install', event => {
  console.log('🔧 Service Worker Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('📦 Caching static files...');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('✅ Static files cached successfully');
        return self.skipWaiting(); // Activate immediately
      })
      .catch(error => {
        console.error('❌ Failed to cache static files:', error);
      })
  );
});

/**
 * Service Worker Activation
 * Clean up old caches
 */
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Delete old caches that don't match current version
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated successfully');
        return self.clients.claim(); // Take control of all pages
      })
      .catch(error => {
        console.error('❌ Service Worker activation failed:', error);
      })
  );
});

/**
 * Fetch Event Handler
 * Implements Cache First strategy with network fallback
 */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip external URLs (CDN, APIs, etc.)
  if (url.origin !== location.origin) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        // Return cached version if available
        if (cachedResponse) {
          console.log('📱 Serving from cache:', request.url);
          return cachedResponse;
        }
        
        // Fetch from network and cache for future
        return fetch(request)
          .then(networkResponse => {
            // Don't cache error responses
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }
            
            // Cache dynamic content
            const responseClone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE)
              .then(cache => {
                cache.put(request, responseClone);
                console.log('💾 Cached new resource:', request.url);
              });
            
            return networkResponse;
          })
          .catch(() => {
            // Offline fallback
            if (request.destination === 'document') {
              return caches.match('/offline.html') || 
                     new Response('You are offline. Please check your connection.');
            }
            
            // Fallback for other resources
            return new Response('Resource not available offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

/**
 * Background Sync
 * Handle offline form submissions and data sync
 */
self.addEventListener('sync', event => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'financial-data-sync') {
    event.waitUntil(syncFinancialData());
  }
  
  if (event.tag === 'transaction-sync') {
    event.waitUntil(syncPendingTransactions());
  }
});

/**
 * Push Notification Handler
 * Handle financial alerts and reminders
 */
self.addEventListener('push', event => {
  console.log('📱 Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New financial update available',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    vibrate: [200, 100, 200],
    tag: 'financial-notification',
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/icons/view-icon.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss-icon.png'
      }
    ],
    data: {
      url: '/dashboard',
      timestamp: Date.now()
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('SmartFinanceAI', options)
  );
});

/**
 * Notification Click Handler
 */
self.addEventListener('notificationclick', event => {
  console.log('🖱️ Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/dashboard')
    );
  }
});

/**
 * Sync Financial Data
 * Background sync for financial data when back online
 */
async function syncFinancialData() {
  try {
    console.log('💰 Syncing financial data...');
    
    // Get pending data from IndexedDB
    const pendingData = await getPendingFinancialData();
    
    if (pendingData.length > 0) {
      // Send to server
      const response = await fetch('/api/sync/financial-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pendingData)
      });
      
      if (response.ok) {
        // Clear pending data
        await clearPendingFinancialData();
        console.log('✅ Financial data synced successfully');
        
        // Notify user
        self.registration.showNotification('Data Synced', {
          body: 'Your financial data has been synchronized.',
          icon: '/icons/icon-192.png',
          tag: 'sync-success'
        });
      }
    }
  } catch (error) {
    console.error('❌ Financial data sync failed:', error);
  }
}

/**
 * Sync Pending Transactions
 * Background sync for offline transaction submissions
 */
async function syncPendingTransactions() {
  try {
    console.log('💳 Syncing pending transactions...');
    
    // Implementation for syncing transactions
    // This would integrate with your app's transaction management
    
  } catch (error) {
    console.error('❌ Transaction sync failed:', error);
  }
}

/**
 * Helper function to get pending financial data
 * Replace with your actual IndexedDB implementation
 */
async function getPendingFinancialData() {
  // Placeholder - implement based on your data storage strategy
  return [];
}

/**
 * Helper function to clear pending financial data
 * Replace with your actual IndexedDB implementation
 */
async function clearPendingFinancialData() {
  // Placeholder - implement based on your data storage strategy
  return true;
}

/**
 * Message Handler
 * Handle messages from the main app
 */
self.addEventListener('message', event => {
  console.log('📨 Message received:', event.data);
  
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
        
      case 'CACHE_FINANCIAL_DATA':
        cacheFinancialData(event.data.data);
        break;
        
      case 'GET_CACHE_STATUS':
        getCacheStatus().then(status => {
          event.ports[0].postMessage(status);
        });
        break;
        
      default:
        console.log('🤷‍♂️ Unknown message type:', event.data.type);
    }
  }
});

/**
 * Cache financial data for offline use
 */
async function cacheFinancialData(data) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const response = new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=86400' // 24 hours
      }
    });
    
    await cache.put('/data/financial-cache', response);
    console.log('💾 Financial data cached for offline use');
  } catch (error) {
    console.error('❌ Failed to cache financial data:', error);
  }
}

/**
 * Get cache status and size
 */
async function getCacheStatus() {
  try {
    const cacheNames = await caches.keys();
    let totalSize = 0;
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      totalSize += keys.length;
    }
    
    return {
      caches: cacheNames.length,
      totalFiles: totalSize,
      lastUpdated: Date.now()
    };
  } catch (error) {
    console.error('❌ Failed to get cache status:', error);
    return null;
  }
}