/**
 * SmartFinanceAI - Cache Manager
 * Global SaaS Platform File: src/data/cache-manager.js
 * 
 * Intelligent caching system for financial data with TTL, compression, and sync
 * Features: Multi-layer caching, offline support, intelligent prefetching, cache warming
 */

class CacheManager {
  constructor() {
    this.caches = new Map();
    this.cacheStores = {
      memory: new Map(),
      session: sessionStorage,
      local: localStorage,
      indexed: null // Will be initialized
    };
    
    this.config = {
      defaultTTL: 30 * 60 * 1000, // 30 minutes
      maxMemorySize: 50 * 1024 * 1024, // 50MB
      maxIndexedDBSize: 200 * 1024 * 1024, // 200MB
      compressionThreshold: 1024, // 1KB
      enableCompression: true,
      enableEncryption: true,
      syncInterval: 5 * 60 * 1000, // 5 minutes
      cleanupInterval: 10 * 60 * 1000, // 10 minutes
      prefetchEnabled: true,
      cacheWarmingEnabled: true
    };

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      compressionSaved: 0,
      memoryUsage: 0,
      indexedDBUsage: 0
    };

    this.eventListeners = new Map();
    this.compressionWorker = null;
    this.encryptionKey = null;
    
    this.init();
  }

  /**
   * Initialize the cache manager
   */
  async init() {
    try {
      await this.initIndexedDB();
      await this.initEncryption();
      await this.initCompressionWorker();
      this.setupPeriodicCleanup();
      this.setupSyncMonitoring();
      this.setupMemoryMonitoring();
      await this.warmupCache();
      
      console.log('CacheManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize CacheManager:', error);
      this.stats.errors++;
    }
  }

  /**
   * Initialize IndexedDB for persistent caching
   */
  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SmartFinanceAI_Cache', 2);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.cacheStores.indexed = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false });
          cacheStore.createIndex('category', 'category', { unique: false });
          cacheStore.createIndex('priority', 'priority', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('metadata')) {
          const metaStore = db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Initialize encryption for sensitive financial data
   */
  async initEncryption() {
    if (!this.config.enableEncryption) return;
    
    try {
      // Generate or retrieve encryption key
      const storedKey = localStorage.getItem('cache_encryption_key');
      if (storedKey) {
        this.encryptionKey = await crypto.subtle.importKey(
          'raw',
          Uint8Array.from(atob(storedKey), c => c.charCodeAt(0)),
          { name: 'AES-GCM' },
          false,
          ['encrypt', 'decrypt']
        );
      } else {
        this.encryptionKey = await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );
        
        const exportedKey = await crypto.subtle.exportKey('raw', this.encryptionKey);
        localStorage.setItem('cache_encryption_key', btoa(String.fromCharCode(...new Uint8Array(exportedKey))));
      }
    } catch (error) {
      console.warn('Encryption initialization failed, disabling encryption:', error);
      this.config.enableEncryption = false;
    }
  }

  /**
   * Initialize compression worker for large data
   */
  async initCompressionWorker() {
    if (!this.config.enableCompression) return;
    
    try {
      // Create compression worker blob
      const workerScript = `
        const pako = {
          deflate: function(data) {
            // Simple compression simulation - in production use pako.js
            return new TextEncoder().encode(JSON.stringify(data));
          },
          inflate: function(compressed) {
            // Simple decompression simulation
            return JSON.parse(new TextDecoder().decode(compressed));
          }
        };
        
        self.addEventListener('message', function(e) {
          const { action, data, id } = e.data;
          
          try {
            let result;
            if (action === 'compress') {
              result = pako.deflate(data);
            } else if (action === 'decompress') {
              result = pako.inflate(data);
            }
            
            self.postMessage({ id, result, success: true });
          } catch (error) {
            self.postMessage({ id, error: error.message, success: false });
          }
        });
      `;
      
      const blob = new Blob([workerScript], { type: 'application/javascript' });
      this.compressionWorker = new Worker(URL.createObjectURL(blob));
      
    } catch (error) {
      console.warn('Compression worker initialization failed:', error);
      this.config.enableCompression = false;
    }
  }

  /**
   * Get data from cache with intelligent fallback
   */
  async get(key, options = {}) {
    const startTime = performance.now();
    
    try {
      const {
        category = 'default',
        useMemory = true,
        useSession = true,
        useLocal = true,
        useIndexed = true,
        decrypt = false
      } = options;

      let result = null;
      let source = null;

      // Check memory cache first (fastest)
      if (useMemory && this.cacheStores.memory.has(key)) {
        const cached = this.cacheStores.memory.get(key);
        if (!this.isExpired(cached)) {
          result = cached.data;
          source = 'memory';
        } else {
          this.cacheStores.memory.delete(key);
        }
      }

      // Check session storage
      if (!result && useSession) {
        result = await this.getFromSessionStorage(key);
        if (result) source = 'session';
      }

      // Check local storage
      if (!result && useLocal) {
        result = await this.getFromLocalStorage(key);
        if (result) source = 'local';
      }

      // Check IndexedDB
      if (!result && useIndexed && this.cacheStores.indexed) {
        result = await this.getFromIndexedDB(key);
        if (result) source = 'indexed';
      }

      if (result) {
        this.stats.hits++;
        
        // Decrypt if needed
        if (decrypt && this.config.enableEncryption) {
          result = await this.decryptData(result);
        }
        
        // Decompress if needed
        if (result && result._compressed) {
          result = await this.decompressData(result.data);
        }
        
        // Promote to faster cache layers
        this.promoteToFasterCache(key, result, source, options);
        
        // Update access time
        this.updateAccessTime(key, source);
        
        this.emitEvent('cache:hit', { key, source, category, responseTime: performance.now() - startTime });
        return result;
      }

      this.stats.misses++;
      this.emitEvent('cache:miss', { key, category, responseTime: performance.now() - startTime });
      return null;

    } catch (error) {
      console.error('Cache get error:', error);
      this.stats.errors++;
      this.emitEvent('cache:error', { key, error: error.message, operation: 'get' });
      return null;
    }
  }

  /**
   * Set data in cache with intelligent storage selection
   */
  async set(key, data, options = {}) {
    const startTime = performance.now();
    
    try {
      const {
        ttl = this.config.defaultTTL,
        category = 'default',
        priority = 'normal', // low, normal, high, critical
        encrypt = false,
        compress = null, // auto-detect based on size
        persistent = false,
        replicate = true // replicate to multiple cache layers
      } = options;

      const expiresAt = Date.now() + ttl;
      const size = this.calculateDataSize(data);
      
      // Determine compression
      const shouldCompress = compress !== null ? compress : 
        (this.config.enableCompression && size > this.config.compressionThreshold);

      let processedData = data;
      
      // Compress if needed
      if (shouldCompress) {
        processedData = await this.compressData(data);
        this.stats.compressionSaved += size - this.calculateDataSize(processedData);
      }
      
      // Encrypt if needed
      if (encrypt && this.config.enableEncryption) {
        processedData = await this.encryptData(processedData);
      }

      const cacheEntry = {
        key,
        data: processedData,
        expiresAt,
        createdAt: Date.now(),
        accessedAt: Date.now(),
        category,
        priority,
        size,
        compressed: shouldCompress,
        encrypted: encrypt,
        accessCount: 0
      };

      // Determine storage strategy based on data characteristics
      const storageStrategy = this.determineStorageStrategy(cacheEntry);
      
      // Store in appropriate cache layers
      await this.storeInCacheLayers(cacheEntry, storageStrategy, replicate);
      
      this.stats.sets++;
      this.updateMemoryUsage();
      
      this.emitEvent('cache:set', { 
        key, 
        category, 
        size, 
        strategy: storageStrategy,
        responseTime: performance.now() - startTime 
      });

    } catch (error) {
      console.error('Cache set error:', error);
      this.stats.errors++;
      this.emitEvent('cache:error', { key, error: error.message, operation: 'set' });
    }
  }

  /**
   * Delete from all cache layers
   */
  async delete(key) {
    try {
      // Remove from memory
      this.cacheStores.memory.delete(key);
      
      // Remove from session storage
      try {
        this.cacheStores.session.removeItem(`cache_${key}`);
      } catch (e) { /* Ignore quota errors */ }
      
      // Remove from local storage
      try {
        this.cacheStores.local.removeItem(`cache_${key}`);
      } catch (e) { /* Ignore quota errors */ }
      
      // Remove from IndexedDB
      if (this.cacheStores.indexed) {
        const transaction = this.cacheStores.indexed.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        await new Promise((resolve, reject) => {
          const request = store.delete(key);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
      
      this.stats.deletes++;
      this.emitEvent('cache:delete', { key });
      
    } catch (error) {
      console.error('Cache delete error:', error);
      this.stats.errors++;
    }
  }

  /**
   * Clear cache by category or all
   */
  async clear(category = null) {
    try {
      if (category) {
        // Clear specific category
        await this.clearByCategory(category);
      } else {
        // Clear all caches
        this.cacheStores.memory.clear();
        
        // Clear session storage
        const sessionKeys = Object.keys(sessionStorage).filter(key => key.startsWith('cache_'));
        sessionKeys.forEach(key => sessionStorage.removeItem(key));
        
        // Clear local storage
        const localKeys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
        localKeys.forEach(key => localStorage.removeItem(key));
        
        // Clear IndexedDB
        if (this.cacheStores.indexed) {
          const transaction = this.cacheStores.indexed.transaction(['cache'], 'readwrite');
          const store = transaction.objectStore('cache');
          await new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
        }
      }
      
      this.updateMemoryUsage();
      this.emitEvent('cache:clear', { category });
      
    } catch (error) {
      console.error('Cache clear error:', error);
      this.stats.errors++;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 ? 
      (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2) : 0;
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      memoryUsageFormatted: this.formatBytes(this.stats.memoryUsage),
      indexedDBUsageFormatted: this.formatBytes(this.stats.indexedDBUsage),
      compressionSavedFormatted: this.formatBytes(this.stats.compressionSaved)
    };
  }

  /**
   * Prefetch data based on usage patterns
   */
  async prefetch(keys, options = {}) {
    if (!this.config.prefetchEnabled) return;
    
    const {
      priority = 'low',
      maxConcurrent = 3,
      category = 'prefetch'
    } = options;

    const prefetchPromises = [];
    
    for (let i = 0; i < keys.length; i += maxConcurrent) {
      const batch = keys.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (keyInfo) => {
        const { key, dataLoader } = keyInfo;
        
        try {
          // Check if already cached
          const cached = await this.get(key, { category });
          if (cached) return;
          
          // Load and cache data
          const data = await dataLoader();
          await this.set(key, data, { 
            category, 
            priority,
            ttl: this.config.defaultTTL * 2 // Longer TTL for prefetched data
          });
          
        } catch (error) {
          console.warn('Prefetch failed for key:', key, error);
        }
      });
      
      prefetchPromises.push(...batchPromises);
      
      // Wait for batch completion before starting next batch
      await Promise.allSettled(batchPromises);
    }
    
    this.emitEvent('cache:prefetch', { keys: keys.length, category });
  }

  /**
   * Intelligent cache warming on app startup
   */
  async warmupCache() {
    if (!this.config.cacheWarmingEnabled) return;
    
    try {
      const warmupTargets = [
        {
          key: 'user_preferences',
          loader: () => window.userManager?.getPreferences(),
          category: 'user',
          priority: 'high'
        },
        {
          key: 'country_config',
          loader: () => window.localization?.getCurrentConfig(),
          category: 'config',
          priority: 'high'
        },
        {
          key: 'currency_rates',
          loader: () => window.currencyManager?.getCurrentRates(),
          category: 'financial',
          priority: 'normal'
        },
        {
          key: 'categories',
          loader: () => window.categoryManager?.getCategories(),
          category: 'financial',
          priority: 'normal'
        }
      ];

      const warmupPromises = warmupTargets.map(async (target) => {
        try {
          const data = await target.loader();
          if (data) {
            await this.set(target.key, data, {
              category: target.category,
              priority: target.priority,
              ttl: this.config.defaultTTL * 3 // Longer TTL for warmed data
            });
          }
        } catch (error) {
          console.warn('Cache warmup failed for:', target.key, error);
        }
      });

      await Promise.allSettled(warmupPromises);
      this.emitEvent('cache:warmup', { targets: warmupTargets.length });
      
    } catch (error) {
      console.error('Cache warmup error:', error);
    }
  }

  /**
   * Get data from session storage
   */
  async getFromSessionStorage(key) {
    try {
      const cached = this.cacheStores.session.getItem(`cache_${key}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (!this.isExpired(parsed)) {
          return parsed.data;
        } else {
          this.cacheStores.session.removeItem(`cache_${key}`);
        }
      }
    } catch (error) {
      console.warn('Session storage get error:', error);
    }
    return null;
  }

  /**
   * Get data from local storage
   */
  async getFromLocalStorage(key) {
    try {
      const cached = this.cacheStores.local.getItem(`cache_${key}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (!this.isExpired(parsed)) {
          return parsed.data;
        } else {
          this.cacheStores.local.removeItem(`cache_${key}`);
        }
      }
    } catch (error) {
      console.warn('Local storage get error:', error);
    }
    return null;
  }

  /**
   * Get data from IndexedDB
   */
  async getFromIndexedDB(key) {
    try {
      if (!this.cacheStores.indexed) return null;
      
      const transaction = this.cacheStores.indexed.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      
      return new Promise((resolve, reject) => {
        const request = store.get(key);
        
        request.onsuccess = () => {
          const result = request.result;
          if (result && !this.isExpired(result)) {
            resolve(result.data);
          } else {
            if (result) {
              // Clean up expired entry
              this.delete(key);
            }
            resolve(null);
          }
        };
        
        request.onerror = () => reject(request.error);
      });
      
    } catch (error) {
      console.warn('IndexedDB get error:', error);
      return null;
    }
  }

  /**
   * Determine optimal storage strategy
   */
  determineStorageStrategy(cacheEntry) {
    const { size, priority, category, persistent } = cacheEntry;
    
    // Critical data always goes to all layers
    if (priority === 'critical') {
      return ['memory', 'session', 'local', 'indexed'];
    }
    
    // Large data goes to IndexedDB primarily
    if (size > 100 * 1024) { // 100KB+
      return persistent ? ['indexed', 'memory'] : ['indexed'];
    }
    
    // Frequently accessed data in memory + session
    if (category === 'user' || category === 'financial') {
      return ['memory', 'session', 'indexed'];
    }
    
    // Configuration data in all layers for reliability
    if (category === 'config') {
      return ['memory', 'session', 'local'];
    }
    
    // Default strategy
    return ['memory', 'session'];
  }

  /**
   * Store in multiple cache layers
   */
  async storeInCacheLayers(cacheEntry, strategy, replicate) {
    const storagePromises = [];
    
    for (const layer of strategy) {
      switch (layer) {
        case 'memory':
          if (this.hasMemorySpace(cacheEntry.size)) {
            this.cacheStores.memory.set(cacheEntry.key, cacheEntry);
          }
          break;
          
        case 'session':
          storagePromises.push(this.storeInSessionStorage(cacheEntry));
          break;
          
        case 'local':
          storagePromises.push(this.storeInLocalStorage(cacheEntry));
          break;
          
        case 'indexed':
          if (this.cacheStores.indexed) {
            storagePromises.push(this.storeInIndexedDB(cacheEntry));
          }
          break;
      }
    }
    
    if (replicate && storagePromises.length > 0) {
      await Promise.allSettled(storagePromises);
    }
  }

  /**
   * Store in session storage
   */
  async storeInSessionStorage(cacheEntry) {
    try {
      this.cacheStores.session.setItem(
        `cache_${cacheEntry.key}`, 
        JSON.stringify(cacheEntry)
      );
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        await this.evictFromSessionStorage();
        try {
          this.cacheStores.session.setItem(
            `cache_${cacheEntry.key}`, 
            JSON.stringify(cacheEntry)
          );
        } catch (retryError) {
          console.warn('Session storage quota exceeded:', retryError);
        }
      }
    }
  }

  /**
   * Store in local storage
   */
  async storeInLocalStorage(cacheEntry) {
    try {
      this.cacheStores.local.setItem(
        `cache_${cacheEntry.key}`, 
        JSON.stringify(cacheEntry)
      );
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        await this.evictFromLocalStorage();
        try {
          this.cacheStores.local.setItem(
            `cache_${cacheEntry.key}`, 
            JSON.stringify(cacheEntry)
          );
        } catch (retryError) {
          console.warn('Local storage quota exceeded:', retryError);
        }
      }
    }
  }

  /**
   * Store in IndexedDB
   */
  async storeInIndexedDB(cacheEntry) {
    try {
      const transaction = this.cacheStores.indexed.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      
      return new Promise((resolve, reject) => {
        const request = store.put(cacheEntry);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
    } catch (error) {
      console.warn('IndexedDB store error:', error);
    }
  }

  /**
   * Promote data to faster cache layers
   */
  promoteToFasterCache(key, data, source, options) {
    // If data came from slower cache, promote to faster ones
    if (source === 'indexed' || source === 'local') {
      // Promote to memory
      if (this.hasMemorySpace(this.calculateDataSize(data))) {
        this.cacheStores.memory.set(key, {
          key,
          data,
          expiresAt: Date.now() + this.config.defaultTTL,
          accessedAt: Date.now(),
          accessCount: 1
        });
      }
      
      // Promote to session storage
      if (source === 'indexed') {
        this.storeInSessionStorage({
          key,
          data,
          expiresAt: Date.now() + this.config.defaultTTL,
          accessedAt: Date.now()
        });
      }
    }
  }

  /**
   * Update access time and count
   */
  updateAccessTime(key, source) {
    if (source === 'memory') {
      const entry = this.cacheStores.memory.get(key);
      if (entry) {
        entry.accessedAt = Date.now();
        entry.accessCount = (entry.accessCount || 0) + 1;
      }
    }
  }

  /**
   * Compress data using worker
   */
  async compressData(data) {
    if (!this.compressionWorker) return data;
    
    return new Promise((resolve) => {
      const id = Math.random().toString(36);
      
      const handleMessage = (e) => {
        if (e.data.id === id) {
          this.compressionWorker.removeEventListener('message', handleMessage);
          if (e.data.success) {
            resolve({
              _compressed: true,
              data: e.data.result,
              originalSize: this.calculateDataSize(data)
            });
          } else {
            console.warn('Compression failed:', e.data.error);
            resolve(data);
          }
        }
      };
      
      this.compressionWorker.addEventListener('message', handleMessage);
      this.compressionWorker.postMessage({ action: 'compress', data, id });
      
      // Fallback timeout
      setTimeout(() => {
        this.compressionWorker.removeEventListener('message', handleMessage);
        resolve(data);
      }, 5000);
    });
  }

  /**
   * Decompress data using worker
   */
  async decompressData(compressedData) {
    if (!this.compressionWorker) return compressedData;
    
    return new Promise((resolve) => {
      const id = Math.random().toString(36);
      
      const handleMessage = (e) => {
        if (e.data.id === id) {
          this.compressionWorker.removeEventListener('message', handleMessage);
          if (e.data.success) {
            resolve(e.data.result);
          } else {
            console.warn('Decompression failed:', e.data.error);
            resolve(compressedData);
          }
        }
      };
      
      this.compressionWorker.addEventListener('message', handleMessage);
      this.compressionWorker.postMessage({ action: 'decompress', data: compressedData, id });
      
      // Fallback timeout
      setTimeout(() => {
        this.compressionWorker.removeEventListener('message', handleMessage);
        resolve(compressedData);
      }, 5000);
    });
  }

  /**
   * Encrypt sensitive data
   */
  async encryptData(data) {
    if (!this.encryptionKey) return data;
    
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(JSON.stringify(data));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        dataBuffer
      );
      
      return {
        _encrypted: true,
        data: Array.from(new Uint8Array(encryptedBuffer)),
        iv: Array.from(iv)
      };
      
    } catch (error) {
      console.warn('Encryption failed:', error);
      return data;
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decryptData(encryptedData) {
    if (!this.encryptionKey || !encryptedData._encrypted) return encryptedData;
    
    try {
      const dataBuffer = new Uint8Array(encryptedData.data);
      const iv = new Uint8Array(encryptedData.iv);
      
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        dataBuffer
      );
      
      const decoder = new TextDecoder();
      const decryptedString = decoder.decode(decryptedBuffer);
      return JSON.parse(decryptedString);
      
    } catch (error) {
      console.warn('Decryption failed:', error);
      return encryptedData;
    }
  }

  /**
   * Periodic cleanup of expired entries
   */
  setupPeriodicCleanup() {
    setInterval(() => {
      this.cleanupExpired();
    }, this.config.cleanupInterval);
  }

  /**
   * Clean up expired entries from all cache layers
   */
  async cleanupExpired() {
    try {
      const now = Date.now();
      let cleanedCount = 0;
      
      // Clean memory cache
      for (const [key, entry] of this.cacheStores.memory.entries()) {
        if (this.isExpired(entry)) {
          this.cacheStores.memory.delete(key);
          cleanedCount++;
        }
      }
      
      // Clean IndexedDB
      if (this.cacheStores.indexed) {
        const transaction = this.cacheStores.indexed.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        const index = store.index('expiresAt');
        
        const request = index.openCursor(IDBKeyRange.upperBound(now));
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            cursor.delete();
            cleanedCount++;
            cursor.continue();
          }
        };
      }
      
      this.updateMemoryUsage();
      
      if (cleanedCount > 0) {
        this.emitEvent('cache:cleanup', { cleanedCount });
      }
      
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }

  /**
   * Setup sync monitoring for online/offline changes
   */
  setupSyncMonitoring() {
    window.addEventListener('online', () => {
      this.syncWithServer();
    });
    
    window.addEventListener('offline', () => {
      this.emitEvent('cache:offline');
    });
  }

  /**
   * Setup memory usage monitoring
   */
  setupMemoryMonitoring() {
    setInterval(() => {
      this.updateMemoryUsage();
      this.checkMemoryPressure();
    }, 30000); // Every 30 seconds
  }

  /**
   * Update memory usage statistics
   */
  updateMemoryUsage() {
    let memoryUsage = 0;
    
    for (const [key, entry] of this.cacheStores.memory.entries()) {
      memoryUsage += this.calculateDataSize(entry);
    }
    
    this.stats.memoryUsage = memoryUsage;
  }

  /**
   * Check for memory pressure and evict if needed
   */
  checkMemoryPressure() {
    if (this.stats.memoryUsage > this.config.maxMemorySize) {
      this.evictFromMemory();
    }
  }

  /**
   * Evict entries from memory cache using LRU
   */
  evictFromMemory() {
    const entries = Array.from(this.cacheStores.memory.entries())
      .map(([key, entry]) => ({ key, ...entry }))
      .sort((a, b) => a.accessedAt - b.accessedAt); // LRU order
    
    const targetSize = this.config.maxMemorySize * 0.8; // Evict to 80%
    let currentSize = this.stats.memoryUsage;
    let evictedCount = 0;
    
    for (const entry of entries) {
      if (currentSize <= targetSize) break;
      
      this.cacheStores.memory.delete(entry.key);
      currentSize -= this.calculateDataSize(entry);
      evictedCount++;
    }
    
    this.updateMemoryUsage();
    this.emitEvent('cache:evict', { layer: 'memory', evictedCount });
  }

  /**
   * Evict from session storage
   */
  async evictFromSessionStorage() {
    const keys = Object.keys(sessionStorage).filter(key => key.startsWith('cache_'));
    const entries = [];
    
    for (const key of keys) {
      try {
        const data = JSON.parse(sessionStorage.getItem(key));
        entries.push({ key, accessedAt: data.accessedAt || 0 });
      } catch (e) {
        sessionStorage.removeItem(key); // Remove corrupted entries
      }
    }
    
    // Sort by access time (LRU)
    entries.sort((a, b) => a.accessedAt - b.accessedAt);
    
    // Remove oldest 25%
    const evictCount = Math.ceil(entries.length * 0.25);
    for (let i = 0; i < evictCount; i++) {
      sessionStorage.removeItem(entries[i].key);
    }
  }

  /**
   * Evict from local storage
   */
  async evictFromLocalStorage() {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
    const entries = [];
    
    for (const key of keys) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        entries.push({ key, accessedAt: data.accessedAt || 0 });
      } catch (e) {
        localStorage.removeItem(key); // Remove corrupted entries
      }
    }
    
    // Sort by access time (LRU)
    entries.sort((a, b) => a.accessedAt - b.accessedAt);
    
    // Remove oldest 25%
    const evictCount = Math.ceil(entries.length * 0.25);
    for (let i = 0; i < evictCount; i++) {
      localStorage.removeItem(entries[i].key);
    }
  }

  /**
   * Sync cache with server when back online
   */
  async syncWithServer() {
    if (!navigator.onLine) return;
    
    try {
      // Sync logic would go here in production
      // This could include uploading changes, downloading updates, etc.
      this.emitEvent('cache:sync', { status: 'completed' });
    } catch (error) {
      console.error('Cache sync error:', error);
      this.emitEvent('cache:sync', { status: 'failed', error: error.message });
    }
  }

  /**
   * Clear cache by category
   */
  async clearByCategory(category) {
    // Clear from memory
    for (const [key, entry] of this.cacheStores.memory.entries()) {
      if (entry.category === category) {
        this.cacheStores.memory.delete(key);
      }
    }
    
    // Clear from IndexedDB
    if (this.cacheStores.indexed) {
      const transaction = this.cacheStores.indexed.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const index = store.index('category');
      
      const request = index.openCursor(IDBKeyRange.only(category));
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
    }
  }

  /**
   * Utility methods
   */
  isExpired(entry) {
    return entry.expiresAt && Date.now() > entry.expiresAt;
  }

  hasMemorySpace(dataSize) {
    return this.stats.memoryUsage + dataSize <= this.config.maxMemorySize;
  }

  calculateDataSize(data) {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch (error) {
      return JSON.stringify(data).length * 2; // Rough estimate
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Event system
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const callbacks = this.eventListeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emitEvent(event, data) {
    if (this.eventListeners.has(event)) {
      const callbacks = this.eventListeners.get(event);
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Cache event callback error:', error);
        }
      });
    }
  }

  /**
   * Get cache health report
   */
  getHealthReport() {
    const stats = this.getStats();
    const memoryPressure = (this.stats.memoryUsage / this.config.maxMemorySize) * 100;
    
    return {
      overall: memoryPressure < 80 && parseFloat(stats.hitRate) > 70 ? 'healthy' : 'warning',
      memoryPressure: memoryPressure.toFixed(1) + '%',
      hitRate: stats.hitRate,
      errorRate: this.stats.errors / (this.stats.hits + this.stats.misses + this.stats.errors) * 100,
      recommendations: this.getRecommendations(stats, memoryPressure)
    };
  }

  /**
   * Get performance recommendations
   */
  getRecommendations(stats, memoryPressure) {
    const recommendations = [];
    
    if (parseFloat(stats.hitRate) < 70) {
      recommendations.push('Consider increasing cache TTL or improving prefetching');
    }
    
    if (memoryPressure > 80) {
      recommendations.push('Memory pressure high, consider reducing cache size');
    }
    
    if (this.stats.compressionSaved > 1024 * 1024) {
      recommendations.push('Compression is saving significant space');
    }
    
    return recommendations;
  }

  /**
   * Destroy cache manager
   */
  destroy() {
    // Close compression worker
    if (this.compressionWorker) {
      this.compressionWorker.terminate();
    }
    
    // Close IndexedDB connection
    if (this.cacheStores.indexed) {
      this.cacheStores.indexed.close();
    }
    
    // Clear all caches
    this.cacheStores.memory.clear();
    
    // Clear event listeners
    this.eventListeners.clear();
  }
}

// Initialize global cache manager
window.addEventListener('DOMContentLoaded', () => {
  if (!window.cacheManager) {
    window.cacheManager = new CacheManager();
  }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CacheManager;
}