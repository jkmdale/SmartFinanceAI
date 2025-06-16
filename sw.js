// SmartFinanceAI Service Worker - Fixed Version
const CACHE_NAME = 'smartfinanceai-v1.0.1';
const urlsToCache = [
  '/SmartFinanceAI/',
  '/SmartFinanceAI/index.html',
  '/SmartFinanceAI/src/core/dashboard.html',
  '/SmartFinanceAI/src/auth/login.html',
  '/SmartFinanceAI/src/auth/signup.html',
  '/SmartFinanceAI/manifest.json'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Caching files');
        // Cache files individually to avoid failures
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(error => {
              console.log(`⚠️ Failed to cache ${url}:`, error);
              return null;
            })
          )
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Installation complete');
        // Force activate immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.log('❌ Service Worker: Cache failed', error);
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all pages immediately
      self.clients.claim()
    ])
  );
});

// Fetch Event - Network First Strategy for better performance
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external requests (like Supabase, CDN, etc.)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip requests with query parameters (likely dynamic)
  if (event.request.url.includes('?')) {
    return;
  }

  event.respondWith(
    // Try network first, then cache
    fetch(event.request)
      .then((response) => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response for caching
        const responseToCache = response.clone();

        // Cache the response
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          })
          .catch((error) => {
            console.log('Cache put failed:', error);
          });

        return response;
      })
      .catch((error) => {
        console.log('🌐 Network failed, trying cache:', event.request.url);
        
        // Network failed, try cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              console.log('📦 Serving from cache:', event.request.url);
              return response;
            }
            
            // If it's a page request and we don't have it cached, return a basic offline message
            if (event.request.destination === 'document') {
              return new Response(`
                <!DOCTYPE html>
                <html>
                <head>
                  <title>SmartFinanceAI - Offline</title>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <style>
                    body { 
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      margin: 0; padding: 20px; min-height: 100vh;
                      display: flex; align-items: center; justify-content: center;
                    }
                    .container { 
                      background: rgba(255,255,255,0.95); padding: 40px; 
                      border-radius: 20px; text-align: center; max-width: 400px;
                    }
                    h1 { color: #2d3748; margin-bottom: 20px; }
                    p { color: #4a5568; margin-bottom: 20px; }
                    button { 
                      background: linear-gradient(135deg, #667eea, #764ba2);
                      color: white; border: none; padding: 15px 30px;
                      border-radius: 10px; cursor: pointer; font-size: 16px;
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h1>📱 SmartFinanceAI</h1>
                    <p>🌐 You're currently offline</p>
                    <p>Please check your internet connection and try again.</p>
                    <button onclick="window.location.reload()">🔄 Retry</button>
                  </div>
                </body>
                </html>
              `, {
                headers: { 'Content-Type': 'text/html' }
              });
            }
            
            // For other resources, just throw the error
            throw error;
          });
      })
  );
});

// Background Sync for offline functionality
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Service Worker: Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

// Push Notifications
self.addEventListener('push', (event) => {
  console.log('📢 Service Worker: Push received');
  
  const title = 'SmartFinanceAI';
  const options = {
    body: event.data ? event.data.text() : 'New financial update available!',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiByeD0iMjQiIGZpbGw9InVybCgjZ3JhZGllbnQwX2xpbmVhcl8xXzEpIi8+CjxwYXRoIGQ9Ik05NiA0OEM4Mi43NDUyIDQ4IDcyIDU4Ljc0NTIgNzIgNzJWMTIwQzcyIDEzMy4yNTUgODIuNzQ1MiAxNDQgOTYgMTQ0UzEyMCAxMzMuMjU1IDEyMCAxMjBWNzJDMTIwIDU4Ljc0NTIgMTA5LjI1NSA0OCA5NiA0OFoiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuOSIvPgo8cGF0aCBkPSJNOTYgODBDMTAwLjQxOCA4MCAxMDQgODMuNTgyIDEwNCA4OFYxMDRDMTA0IDEwOC40MTggMTAwLjQxOCAxMTIgOTYgMTEyUzkxLjU4MiAxMDguNDE4IDg4IDEwNFY4OEM4OCA4My41ODIgOTEuNTgyIDgwIDk2IDgwWiIgZmlsbD0iIzY2N2VlYSIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudDBfbGluZWFyXzFfMSIgeDE9IjAiIHkxPSIwIiB4Mj0iMTkyIiB5Mj0iMTkyIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiM2NjdlZWEiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNzY0YmEyIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+',
    badge: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiByeD0iMjQiIGZpbGw9InVybCgjZ3JhZGllbnQwX2xpbmVhcl8xXzEpIi8+CjxwYXRoIGQ9Ik05NiA0OEM4Mi43NDUyIDQ4IDcyIDU4Ljc0NTIgNzIgNzJWMTIwQzcyIDEzMy4yNTUgODIuNzQ1MiAxNDQgOTYgMTQ0UzEyMCAxMzMuMjU1IDEyMCAxMjBWNzJDMTIwIDU4Ljc0NTIgMTA5LjI1NSA0OCA5NiA0OFoiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuOSIvPgo8cGF0aCBkPSJNOTYgODBDMTAwLjQxOCA4MCAxMDQgODMuNTgyIDEwNCA4OFYxMDRDMTA0IDEwOC40MTggMTAwLjQxOCAxMTIgOTYgMTEyUzkxLjU4MiAxMDguNDE4IDg4IDEwNFY4OEM4OCA4My41ODIgOTEuNTgyIDgwIDk2IDgwWiIgZmlsbD0iIzY2N2VlYSIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudDBfbGluZWFyXzFfMSIgeDE9IjAiIHkxPSIwIiB4Mj0iMTkyIiB5Mj0iMTkyIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiM2NjdlZWEiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNzY0YmEyIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ],
    requireInteraction: false,
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Service Worker: Notification clicked');
  
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
    console.log('🔄 Service Worker: Performing background sync');
    
    // Get pending transactions from IndexedDB or localStorage
    const pendingTransactions = await getPendingTransactions();
    
    if (pendingTransactions.length > 0) {
      console.log(`📝 Found ${pendingTransactions.length} pending transactions`);
      
      // Try to sync with server
      for (const transaction of pendingTransactions) {
        try {
          await syncTransaction(transaction);
          await removePendingTransaction(transaction.id);
        } catch (error) {
          console.log('❌ Failed to sync transaction:', error);
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Service Worker: Background sync failed', error);
  }
}

// Helper functions for offline sync
async function getPendingTransactions() {
  // This would typically use IndexedDB
  // For now, return empty array
  return [];
}

async function syncTransaction(transaction) {
  // This would sync with your Supabase backend
  console.log('🔄 Syncing transaction:', transaction);
}

async function removePendingTransaction(id) {
  // Remove from IndexedDB after successful sync
  console.log('✅ Removing synced transaction:', id);
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('🚀 Service Worker: Script loaded');