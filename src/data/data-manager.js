// 🚀 SmartFinanceAI - Database Manager
// IndexedDB-based offline-first financial data storage with encryption

class DatabaseManager {
  constructor() {
    this.dbName = 'SmartFinanceAI';
    this.dbVersion = 1;
    this.db = null;
    this.isInitialized = false;
    this.encryptionService = null;
    this.currentUserId = null;
    this.syncQueue = [];
    
    // Database schema configuration
    this.stores = {
      users: 'users',
      accounts: 'accounts',
      transactions: 'transactions',
      categories: 'categories',
      goals: 'goals',
      budgets: 'budgets',
      insights: 'insights',
      sync_queue: 'sync_queue',
      settings: 'settings',
      cache: 'cache'
    };
    
    // Sensitive fields that require encryption
    this.sensitiveFields = {
      users: ['email', 'phone', 'address'],
      accounts: ['accountNumber', 'routingNumber', 'balance'],
      transactions: ['amount', 'balance', 'description', 'merchant'],
      goals: ['targetAmount', 'currentAmount'],
      budgets: ['amount', 'spent'],
      insights: ['data', 'recommendations']
    };
    
    console.log('💾 DatabaseManager initialized');
  }
  
  // === DATABASE INITIALIZATION === //
  
  async initialize(userId = null) {
    try {
      if (!window.indexedDB) {
        throw new Error('IndexedDB not supported in this browser');
      }
      
      this.currentUserId = userId;
      console.log('🔧 Initializing database for user:', userId || 'anonymous');
      
      // Open database connection
      this.db = await this.openDatabase();
      
      // Initialize encryption service
      await this.initializeEncryption();
      
      // Set up sync queue monitoring
      this.setupSyncQueueMonitoring();
      
      // Initialize default data if needed
      await this.initializeDefaultData();
      
      this.isInitialized = true;
      console.log('✅ Database initialized successfully');
      
      return true;
      
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }
  
  async openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => {
        reject(new Error(`Database opening failed: ${request.error}`));
      };
      
      request.onsuccess = (event) => {
        console.log('📂 Database opened successfully');
        resolve(event.target.result);
      };
      
      request.onupgradeneeded = (event) => {
        console.log('🔄 Database upgrade needed');
        this.handleDatabaseUpgrade(event.target.result, event.oldVersion);
      };
    });
  }
  
  handleDatabaseUpgrade(db, oldVersion) {
    console.log(`🔄 Upgrading database from version ${oldVersion} to ${this.dbVersion}`);
    
    // === USERS STORE === //
    if (!db.objectStoreNames.contains(this.stores.users)) {
      const usersStore = db.createObjectStore(this.stores.users, { 
        keyPath: 'id',
        autoIncrement: false 
      });
      usersStore.createIndex('email', 'email', { unique: true });
      usersStore.createIndex('createdAt', 'createdAt', { unique: false });
      console.log('📋 Created users store');
    }
    
    // === ACCOUNTS STORE === //
    if (!db.objectStoreNames.contains(this.stores.accounts)) {
      const accountsStore = db.createObjectStore(this.stores.accounts, { 
        keyPath: 'id',
        autoIncrement: false 
      });
      accountsStore.createIndex('userId', 'userId', { unique: false });
      accountsStore.createIndex('bankName', 'bankName', { unique: false });
      accountsStore.createIndex('accountType', 'accountType', { unique: false });
      accountsStore.createIndex('isActive', 'isActive', { unique: false });
      console.log('🏦 Created accounts store');
    }
    
    // === TRANSACTIONS STORE === //
    if (!db.objectStoreNames.contains(this.stores.transactions)) {
      const transactionsStore = db.createObjectStore(this.stores.transactions, { 
        keyPath: 'id',
        autoIncrement: false 
      });
      transactionsStore.createIndex('userId', 'userId', { unique: false });
      transactionsStore.createIndex('accountId', 'accountId', { unique: false });
      transactionsStore.createIndex('date', 'date', { unique: false });
      transactionsStore.createIndex('category', 'category', { unique: false });
      transactionsStore.createIndex('amount', 'amount', { unique: false });
      transactionsStore.createIndex('merchant', 'merchant', { unique: false });
      transactionsStore.createIndex('isPending', 'isPending', { unique: false });
      console.log('💳 Created transactions store');
    }
    
    // === CATEGORIES STORE === //
    if (!db.objectStoreNames.contains(this.stores.categories)) {
      const categoriesStore = db.createObjectStore(this.stores.categories, { 
        keyPath: 'id',
        autoIncrement: false 
      });
      categoriesStore.createIndex('userId', 'userId', { unique: false });
      categoriesStore.createIndex('parentId', 'parentId', { unique: false });
      categoriesStore.createIndex('type', 'type', { unique: false });
      console.log('📊 Created categories store');
    }
    
    // === GOALS STORE === //
    if (!db.objectStoreNames.contains(this.stores.goals)) {
      const goalsStore = db.createObjectStore(this.stores.goals, { 
        keyPath: 'id',
        autoIncrement: false 
      });
      goalsStore.createIndex('userId', 'userId', { unique: false });
      goalsStore.createIndex('priority', 'priority', { unique: false });
      goalsStore.createIndex('targetDate', 'targetDate', { unique: false });
      goalsStore.createIndex('isActive', 'isActive', { unique: false });
      console.log('🎯 Created goals store');
    }
    
    // === BUDGETS STORE === //
    if (!db.objectStoreNames.contains(this.stores.budgets)) {
      const budgetsStore = db.createObjectStore(this.stores.budgets, { 
        keyPath: 'id',
        autoIncrement: false 
      });
      budgetsStore.createIndex('userId', 'userId', { unique: false });
      budgetsStore.createIndex('period', 'period', { unique: false });
      budgetsStore.createIndex('categoryId', 'categoryId', { unique: false });
      console.log('💰 Created budgets store');
    }
    
    // === AI INSIGHTS STORE === //
    if (!db.objectStoreNames.contains(this.stores.insights)) {
      const insightsStore = db.createObjectStore(this.stores.insights, { 
        keyPath: 'id',
        autoIncrement: false 
      });
      insightsStore.createIndex('userId', 'userId', { unique: false });
      insightsStore.createIndex('type', 'type', { unique: false });
      insightsStore.createIndex('createdAt', 'createdAt', { unique: false });
      insightsStore.createIndex('priority', 'priority', { unique: false });
      console.log('🤖 Created insights store');
    }
    
    // === SYNC QUEUE STORE === //
    if (!db.objectStoreNames.contains(this.stores.sync_queue)) {
      const syncStore = db.createObjectStore(this.stores.sync_queue, { 
        keyPath: 'id',
        autoIncrement: true 
      });
      syncStore.createIndex('userId', 'userId', { unique: false });
      syncStore.createIndex('operation', 'operation', { unique: false });
      syncStore.createIndex('priority', 'priority', { unique: false });
      syncStore.createIndex('createdAt', 'createdAt', { unique: false });
      console.log('🔄 Created sync queue store');
    }
    
    // === SETTINGS STORE === //
    if (!db.objectStoreNames.contains(this.stores.settings)) {
      const settingsStore = db.createObjectStore(this.stores.settings, { 
        keyPath: 'key'
      });
      settingsStore.createIndex('userId', 'userId', { unique: false });
      console.log('⚙️ Created settings store');
    }
    
    // === CACHE STORE === //
    if (!db.objectStoreNames.contains(this.stores.cache)) {
      const cacheStore = db.createObjectStore(this.stores.cache, { 
        keyPath: 'key'
      });
      cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false });
      console.log('💾 Created cache store');
    }
  }
  
  // === ENCRYPTION SETUP === //
  
  async initializeEncryption() {
    if (!window.crypto || !window.crypto.subtle) {
      console.warn('⚠️ Web Crypto API not available - data will not be encrypted');
      return;
    }
    
    try {
      // Import or generate encryption key
      const encryptionKey = await this.getOrCreateEncryptionKey();
      
      this.encryptionService = {
        key: encryptionKey,
        encrypt: this.encryptData.bind(this),
        decrypt: this.decryptData.bind(this)
      };
      
      console.log('🔐 Encryption service initialized');
      
    } catch (error) {
      console.error('❌ Encryption initialization failed:', error);
      // Continue without encryption but log warning
      console.warn('⚠️ Continuing without encryption - data security may be compromised');
    }
  }
  
  async getOrCreateEncryptionKey() {
    // Try to get existing key from secure storage
    let keyData = localStorage.getItem('smartfinance_key_data');
    
    if (keyData) {
      try {
        const keyInfo = JSON.parse(keyData);
        return await window.crypto.subtle.importKey(
          'raw',
          new Uint8Array(keyInfo.key),
          { name: 'AES-GCM' },
          false,
          ['encrypt', 'decrypt']
        );
      } catch (error) {
        console.warn('⚠️ Could not import existing key, generating new one');
      }
    }
    
    // Generate new encryption key
    const key = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    // Export and store key (in production, use more secure storage)
    const exportedKey = await window.crypto.subtle.exportKey('raw', key);
    localStorage.setItem('smartfinance_key_data', JSON.stringify({
      key: Array.from(new Uint8Array(exportedKey)),
      created: Date.now()
    }));
    
    return key;
  }
  
  async encryptData(data) {
    if (!this.encryptionService) {
      return data; // Return unencrypted if encryption not available
    }
    
    try {
      const jsonData = JSON.stringify(data);
      const encoder = new TextEncoder();
      const dataArray = encoder.encode(jsonData);
      
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encryptedData = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        this.encryptionService.key,
        dataArray
      );
      
      return {
        encrypted: Array.from(new Uint8Array(encryptedData)),
        iv: Array.from(iv),
        timestamp: Date.now()
      };
      
    } catch (error) {
      console.error('❌ Encryption failed:', error);
      return data; // Return unencrypted if encryption fails
    }
  }
  
  async decryptData(encryptedData) {
    if (!this.encryptionService || !encryptedData.encrypted) {
      return encryptedData; // Return as-is if not encrypted
    }
    
    try {
      const iv = new Uint8Array(encryptedData.iv);
      const encrypted = new Uint8Array(encryptedData.encrypted);
      
      const decryptedData = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        this.encryptionService.key,
        encrypted
      );
      
      const decoder = new TextDecoder();
      const jsonString = decoder.decode(decryptedData);
      return JSON.parse(jsonString);
      
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      throw new Error('Failed to decrypt data - key may be incorrect');
    }
  }
  
  // === SENSITIVE DATA ENCRYPTION === //
  
  async encryptSensitiveFields(record, storeName) {
    if (!this.encryptionService || !this.sensitiveFields[storeName]) {
      return record;
    }
    
    const encryptedRecord = { ...record };
    const fieldsToEncrypt = this.sensitiveFields[storeName];
    
    for (const field of fieldsToEncrypt) {
      if (record[field] !== undefined && record[field] !== null) {
        encryptedRecord[field] = await this.encryptData(record[field]);
      }
    }
    
    return encryptedRecord;
  }
  
  async decryptSensitiveFields(record, storeName) {
    if (!this.encryptionService || !this.sensitiveFields[storeName]) {
      return record;
    }
    
    const decryptedRecord = { ...record };
    const fieldsToDecrypt = this.sensitiveFields[storeName];
    
    for (const field of fieldsToDecrypt) {
      if (record[field] && record[field].encrypted) {
        try {
          decryptedRecord[field] = await this.decryptData(record[field]);
        } catch (error) {
          console.error(`❌ Failed to decrypt field ${field}:`, error);
          decryptedRecord[field] = null; // Set to null if decryption fails
        }
      }
    }
    
    return decryptedRecord;
  }
  
  // === CORE DATA OPERATIONS === //
  
  async create(storeName, data) {
    this.validateInitialized();
    
    try {
      // Add metadata
      const record = {
        ...data,
        id: data.id || this.generateId(),
        userId: data.userId || this.currentUserId,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        synced: false
      };
      
      // Encrypt sensitive data
      const encryptedRecord = await this.encryptSensitiveFields(record, storeName);
      
      // Store in IndexedDB
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(encryptedRecord);
      
      await this.promisifyRequest(request);
      
      // Add to sync queue
      await this.addToSyncQueue('create', storeName, record.id);
      
      console.log(`✅ Created ${storeName} record:`, record.id);
      return record;
      
    } catch (error) {
      console.error(`❌ Failed to create ${storeName} record:`, error);
      throw error;
    }
  }
  
  async read(storeName, id) {
    this.validateInitialized();
    
    try {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      
      const result = await this.promisifyRequest(request);
      
      if (!result) {
        return null;
      }
      
      // Decrypt sensitive data
      const decryptedRecord = await this.decryptSensitiveFields(result, storeName);
      
      console.log(`📖 Read ${storeName} record:`, id);
      return decryptedRecord;
      
    } catch (error) {
      console.error(`❌ Failed to read ${storeName} record:`, error);
      throw error;
    }
  }
  
  async update(storeName, id, updates) {
    this.validateInitialized();
    
    try {
      // Get existing record
      const existingRecord = await this.read(storeName, id);
      if (!existingRecord) {
        throw new Error(`Record not found: ${id}`);
      }
      
      // Merge updates
      const updatedRecord = {
        ...existingRecord,
        ...updates,
        id: existingRecord.id, // Preserve ID
        userId: existingRecord.userId, // Preserve user ID
        createdAt: existingRecord.createdAt, // Preserve creation time
        updatedAt: new Date().toISOString(),
        version: (existingRecord.version || 1) + 1,
        synced: false
      };
      
      // Encrypt sensitive data
      const encryptedRecord = await this.encryptSensitiveFields(updatedRecord, storeName);
      
      // Store in IndexedDB
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(encryptedRecord);
      
      await this.promisifyRequest(request);
      
      // Add to sync queue
      await this.addToSyncQueue('update', storeName, id);
      
      console.log(`✅ Updated ${storeName} record:`, id);
      return updatedRecord;
      
    } catch (error) {
      console.error(`❌ Failed to update ${storeName} record:`, error);
      throw error;
    }
  }
  
  async delete(storeName, id) {
    this.validateInitialized();
    
    try {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      
      await this.promisifyRequest(request);
      
      // Add to sync queue
      await this.addToSyncQueue('delete', storeName, id);
      
      console.log(`🗑️ Deleted ${storeName} record:`, id);
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to delete ${storeName} record:`, error);
      throw error;
    }
  }
  
  async list(storeName, options = {}) {
    this.validateInitialized();
    
    try {
      const {
        indexName = null,
        range = null,
        limit = null,
        offset = 0,
        direction = 'next',
        filter = null
      } = options;
      
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      let source = indexName ? store.index(indexName) : store;
      let request = source.openCursor(range, direction);
      
      const results = [];
      let currentOffset = 0;
      
      return new Promise((resolve, reject) => {
        request.onsuccess = async (event) => {
          const cursor = event.target.result;
          
          if (!cursor) {
            resolve(results);
            return;
          }
          
          try {
            // Apply offset
            if (currentOffset < offset) {
              currentOffset++;
              cursor.continue();
              return;
            }
            
            // Apply limit
            if (limit && results.length >= limit) {
              resolve(results);
              return;
            }
            
            // Decrypt record
            const decryptedRecord = await this.decryptSensitiveFields(cursor.value, storeName);
            
            // Apply filter
            if (!filter || filter(decryptedRecord)) {
              results.push(decryptedRecord);
            }
            
            cursor.continue();
            
          } catch (error) {
            reject(error);
          }
        };
        
        request.onerror = () => reject(request.error);
      });
      
    } catch (error) {
      console.error(`❌ Failed to list ${storeName} records:`, error);
      throw error;
    }
  }
  
  // === FINANCIAL DATA OPERATIONS === //
  
  async getAccountsByUser(userId = null) {
    const targetUserId = userId || this.currentUserId;
    return this.list(this.stores.accounts, {
      indexName: 'userId',
      range: IDBKeyRange.only(targetUserId),
      filter: (account) => account.isActive !== false
    });
  }
  
  async getTransactionsByAccount(accountId, options = {}) {
    const { startDate, endDate, category, limit } = options;
    
    let range = null;
    if (startDate && endDate) {
      range = IDBKeyRange.bound(startDate, endDate);
    } else if (startDate) {
      range = IDBKeyRange.lowerBound(startDate);
    } else if (endDate) {
      range = IDBKeyRange.upperBound(endDate);
    }
    
    return this.list(this.stores.transactions, {
      indexName: 'date',
      range: range,
      limit: limit,
      direction: 'prev', // Most recent first
      filter: (transaction) => {
        if (transaction.accountId !== accountId) return false;
        if (category && transaction.category !== category) return false;
        return true;
      }
    });
  }
  
  async getActiveGoals(userId = null) {
    const targetUserId = userId || this.currentUserId;
    return this.list(this.stores.goals, {
      indexName: 'userId',
      range: IDBKeyRange.only(targetUserId),
      filter: (goal) => goal.isActive !== false
    });
  }
  
  async getBudgetsByPeriod(period, userId = null) {
    const targetUserId = userId || this.c