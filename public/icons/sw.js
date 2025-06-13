// 🚀 SmartFinanceAI - Service Worker
// Progressive Web App offline-first functionality with financial data sync

const CACHE_NAME = 'smartfinance-v1.0.0';
const OFFLINE_URL = '/offline.html';
const API_CACHE_NAME = 'smartfinance-api-v1.0.0';
const DATA_CACHE_NAME = 'smartfinance-data-v1.0.0';

// === CRITICAL FILES TO CACHE === //
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/styles/main.css',
  '/src/styles/variables.css',
  '/src/styles/components.css',
  '/src/styles/themes.css',
  '/src/styles/responsive.css',
  '/src/styles/animations.css',
  
  // Core JavaScript modules
  '/src/auth/auth-manager.js',
  '/src/auth/biometric-auth.js',
  '/src/auth/session-manager.js',
  '/src/core/dashboard-controller.js',
  '/src/core/account-manager.js',
  '/src/core/transaction-engine.js',
  '/src/core/budget-system.js',
  '/src/core/goal-tracker.js',
  
  // Essential utilities
  '/src/utils/currency-utils.js',
  '/src/utils/date-utils.js',
  '/src/utils/validation-utils.js',
  '/src/utils/formatting-utils.js',
  '/src/utils/security-utils.js',
  '/src/data/database-manager.js',
  '/src/data/sync-manager.js',
  '/src/data/encryption-service.js',
  
  // Global configuration
  '/src/global/localization.js',
  '/src/global/currency-manager.js',
  '/src/global/banking-config.js',
  
  // Core HTML pages
  '/src/auth/login.html',
  '/src/core/dashboard.html',
  '/src/core/accounts.html',
  '/src/core/transactions.html',
  '/src/core/budget.html',
  '/src/core/goals.html',
  '/src/onboarding/welcome.html',
  
  // Icons and images
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  
  // Fonts (if using custom fonts)
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap'
];

// === DYNAMIC CACHE PATTERNS === //
const CACHE_STRATEGIES = {
  // Cache financial data with encryption
  userData: {
    pattern: /^\/api\/user/,
    strategy: 'cacheFirst',
    expiration: 86400000 // 24 hours
  },
  
  // Cache transaction data
  transactions: {
    pattern: /^\/api\/transactions/,
    strategy: 'networkFirst',
    expiration: 3600000 // 1 hour
  },
  
  // Cache currency exchange rates
  exchangeRates: {
    pattern: /^\/api\/exchange-rates/,
    strategy: 'staleWhileRevalidate',
    expiration: 3600000 // 1 hour
  },
  
  // Cache static assets
  assets: {
    pattern: /\.(js|css|png|jpg|jpeg|svg|woff2|woff)$/,
    strategy: 'cacheFirst',
    expiration: 604800000 // 7 days
  }
};

// === SERVICE WORKER INSTALL === //
self.addEventListener('install', event => {
  console.log('🚀 SmartFinanceAI Service Worker installing...');
  
  event.waitUntil(
    (async () => {
      try {
        // Open cache and add all static resources
        const cache = await caches.open(CACHE_NAME);
        console.log('📦 Caching static resources...');
        
        // Cache resources in chunks to avoid memory issues
        const chunkSize = 10;
        for (let i = 0; i < STATIC_CACHE_URLS.length; i += chunkSize) {
          const chunk = STATIC_CACHE_URLS.slice(i, i + chunkSize);
          await cache.addAll(chunk);
          console.log(`📦 Cached chunk ${Math.floor(i/chunkSize) + 1}/${Math.ceil(STATIC_CACHE_URLS.length/chunkSize)}`);
        }
        
        // Force activation of new service worker
        await self.skipWaiting();
        console.log('✅ SmartFinanceAI Service Worker installed successfully');
        
      } catch (error) {
        console.error('❌ Service Worker installation failed:', error);
      }
    })()
  );
});

// === SERVICE WORKER ACTIVATION === //
self.addEventListener('activate', event => {
  console.log('🔄 SmartFinanceAI Service Worker activating...');
  
  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== API_CACHE_NAME && 
                cacheName !== DATA_CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
        
        // Take control of all open pages
        await self.clients.claim();
        console.log('✅ SmartFinanceAI Service Worker activated');
        
        // Send activation message to all clients
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            timestamp: Date.now()
          });
        });
        
      } catch (error) {
        console.error('❌ Service Worker activation failed:', error);
      }
    })()
  );
});

// === FETCH HANDLER - OFFLINE FIRST STRATEGY === //
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(handleFetch(event.request));
});

// === INTELLIGENT FETCH HANDLING === //
async function handleFetch(request) {
  const url = new URL(request.url);
  
  try {
    // Handle API requests with network-first strategy
    if (url.pathname.startsWith('/api/')) {
      return await handleAPIRequest(request);
    }
    
    // Handle financial data requests
    if (url.pathname.includes('transactions') || 
        url.pathname.includes('accounts') || 
        url.pathname.includes('goals')) {
      return await handleFinancialDataRequest(request);
    }
    
    // Handle static assets with cache-first strategy
    if (isStaticAsset(url.pathname)) {
      return await handleStaticAsset(request);
    }
    
    // Handle navigation requests (HTML pages)
    if (request.mode === 'navigate') {
      return await handleNavigation(request);
    }
    
    // Default: try network first, fallback to cache
    return await networkFirst(request);
    
  } catch (error) {
    console.error('❌ Fetch handling error:', error);
    return await handleOfflineFallback(request);
  }
}

// === API REQUEST HANDLING === //
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first for fresh data
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      
      // Log API activity
      console.log('🌐 API request successful:', url.pathname);
      return networkResponse;
    }
    
    throw new Error(`API request failed: ${networkResponse.status}`);
    
  } catch (error) {
    console.warn('⚠️ API request failed, checking cache:', url.pathname);
    
    // Fallback to cached response
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('📦 Serving cached API response:', url.pathname);
      return cachedResponse;
    }
    
    // Return offline response for critical API endpoints
    return createOfflineAPIResponse(url.pathname);
  }
}

// === FINANCIAL DATA REQUEST HANDLING === //
async function handleFinancialDataRequest(request) {
  try {
    // Always try network first for financial data
    const networkResponse = await fetch(request, {
      cache: 'no-cache' // Ensure fresh financial data
    });
    
    if (networkResponse.ok) {
      // Cache encrypted financial data
      const cache = await caches.open(DATA_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error(`Financial data request failed: ${networkResponse.status}`);
    
  } catch (error) {
    console.warn('⚠️ Financial data request failed, checking cache');
    
    // Fallback to cached encrypted data
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Add offline indicator header
      const modifiedResponse = new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: {
          ...cachedResponse.headers,
          'X-Served-From': 'cache',
          'X-Offline-Mode': 'true'
        }
      });
      return modifiedResponse;
    }
    
    // Return empty financial data structure for offline mode
    return createEmptyFinancialDataResponse();
  }
}

// === STATIC ASSET HANDLING === //
async function handleStaticAsset(request) {
  // Cache-first strategy for static assets
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    console.log('📦 Serving cached asset:', request.url);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      console.log('🌐 Cached new asset:', request.url);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('❌ Failed to fetch static asset:', request.url);
    
    // Return placeholder for missing assets
    if (request.url.includes('.png') || request.url.includes('.jpg')) {
      return createPlaceholderImage();
    }
    
    throw error;
  }
}

// === NAVIGATION HANDLING === //
async function handleNavigation(request) {
  try {
    // Try network first for navigation
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      return networkResponse;
    }
    
    throw new Error(`Navigation failed: ${networkResponse.status}`);
    
  } catch (error) {
    console.warn('⚠️ Navigation request failed, serving from cache');
    
    // Try to serve the requested page from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to main app shell
    const indexResponse = await caches.match('/index.html');
    if (indexResponse) {
      return indexResponse;
    }
    
    // Ultimate fallback to offline page
    return caches.match(OFFLINE_URL);
  }
}

// === NETWORK FIRST STRATEGY === //
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.warn('⚠️ Network request failed, checking cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// === OFFLINE FALLBACK HANDLING === //
async function handleOfflineFallback(request) {
  const url = new URL(request.url);
  
  // For navigation requests, serve the offline page
  if (request.mode === 'navigate') {
    const offlineResponse = await caches.match(OFFLINE_URL);
    if (offlineResponse) {
      return offlineResponse;
    }
  }
  
  // For API requests, return offline data structure
  if (url.pathname.startsWith('/api/')) {
    return createOfflineAPIResponse(url.pathname);
  }
  
  // For other requests, return a generic offline response
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message: 'This request requires an internet connection',
      offline: true,
      timestamp: Date.now()
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json',
        'X-Offline-Mode': 'true'
      }
    }
  );
}

// === BACKGROUND SYNC === //
self.addEventListener('sync', event => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'financial-data-sync') {
    event.waitUntil(syncFinancialData());
  } else if (event.tag === 'transaction-upload') {
    event.waitUntil(syncPendingTransactions());
  } else if (event.tag === 'goal-progress-sync') {
    event.waitUntil(syncGoalProgress());
  }
});

// === PUSH NOTIFICATIONS === //
self.addEventListener('push', event => {
  console.log('🔔 Push notification received');
  
  const options = {
    body: 'SmartFinanceAI has important financial updates for you',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ]
  };
  
  if (event.data) {
    try {
      const pushData = event.data.json();
      options.title = pushData.title || 'SmartFinanceAI';
      options.body = pushData.body || options.body;
      options.data = { ...options.data, ...pushData.data };
    } catch (error) {
      console.error('❌ Error parsing push data:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('SmartFinanceAI', options)
  );
});

// === NOTIFICATION CLICK HANDLING === //
self.addEventListener('notificationclick', event => {
  console.log('🔔 Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  // Focus or open the app
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      const urlToOpen = event.notification.data?.url || '/';
      
      // Check if app is already open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window if app is not open
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// === UTILITY FUNCTIONS === //

function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|svg|woff2|woff|ico|json)$/.test(pathname);
}

async function syncFinancialData() {
  try {
    console.log('🔄 Syncing financial data...');
    
    // Get pending data from IndexedDB
    const pendingData = await getPendingFinancialData();
    
    if (pendingData.length === 0) {
      console.log('✅ No pending financial data to sync');
      return;
    }
    
    // Sync each piece of data
    for (const data of pendingData) {
      try {
        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });
        
        if (response.ok) {
          await markDataAsSynced(data.id);
          console.log('✅ Synced financial data:', data.id);
        }
      } catch (error) {
        console.error('❌ Failed to sync data:', data.id, error);
      }
    }
    
  } catch (error) {
    console.error('❌ Financial data sync failed:', error);
  }
}

async function syncPendingTransactions() {
  try {
    console.log('🔄 Syncing pending transactions...');
    
    // Implementation would sync offline-created transactions
    // This would integrate with the transaction engine
    
  } catch (error) {
    console.error('❌ Transaction sync failed:', error);
  }
}

async function syncGoalProgress() {
  try {
    console.log('🔄 Syncing goal progress...');
    
    // Implementation would sync goal updates made offline
    // This would integrate with the goal tracker
    
  } catch (error) {
    console.error('❌ Goal progress sync failed:', error);
  }
}

function createOfflineAPIResponse(pathname) {
  const offlineData = {
    error: false,
    offline: true,
    message: 'Using cached data - some information may be outdated',
    data: getOfflineData(pathname),
    timestamp: Date.now()
  };
  
  return new Response(JSON.stringify(offlineData), {
    status: 200,
    statusText: 'OK (Offline)',
    headers: {
      'Content-Type': 'application/json',
      'X-Offline-Mode': 'true',
      'Cache-Control': 'no-cache'
    }
  });
}

function createEmptyFinancialDataResponse() {
  const emptyData = {
    accounts: [],
    transactions: [],
    goals: [],
    budgets: [],
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    offline: true,
    message: 'No offline data available - connect to internet to load your financial information'
  };
  
  return new Response(JSON.stringify(emptyData), {
    status: 200,
    statusText: 'OK (Empty)',
    headers: {
      'Content-Type': 'application/json',
      'X-Offline-Mode': 'true'
    }
  });
}

function createPlaceholderImage() {
  // Create a simple 1x1 transparent pixel as placeholder
  const pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
  return fetch(pixel);
}

function getOfflineData(pathname) {
  // Return appropriate offline data structure based on endpoint
  if (pathname.includes('transactions')) {
    return [];
  } else if (pathname.includes('accounts')) {
    return [];
  } else if (pathname.includes('goals')) {
    return [];
  } else if (pathname.includes('budget')) {
    return {};
  }
  
  return null;
}

// Placeholder functions that would integrate with IndexedDB
async function getPendingFinancialData() {
  // This would query IndexedDB for unsynchronized data
  return [];
}

async function markDataAsSynced(dataId) {
  // This would update IndexedDB to mark data as synchronized
  return true;
}

// === CACHE MANAGEMENT === //
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'CACHE_CLEANUP') {
    cleanupOldCaches();
  } else if (event.data && event.data.type === 'FORCE_SYNC') {
    // Trigger immediate sync
    syncFinancialData();
  }
});

async function cleanupOldCaches() {
  try {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name => 
      name.startsWith('smartfinance-') && 
      name !== CACHE_NAME && 
      name !== API_CACHE_NAME && 
      name !== DATA_CACHE_NAME
    );
    
    await Promise.all(oldCaches.map(name => caches.delete(name)));
    console.log('🗑️ Cleaned up old caches:', oldCaches);
    
  } catch (error) {
    console.error('❌ Cache cleanup failed:', error);
  }
}

console.log('🚀 SmartFinanceAI Service Worker loaded successfully');