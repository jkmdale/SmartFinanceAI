/**
 * SmartFinanceAI - Database Manager
 * Secure IndexedDB management for financial data with encryption
 * Path: src/data/database-manager.js
 */

class DatabaseManager {
  constructor() {
    this.dbName = 'SmartFinanceAI';
    this.dbVersion = 3;
    this.db = null;
    this.encryptionKey = null;
    this.isInitialized = false;
    
    // Database stores configuration
    this.stores = {
      users: { keyPath: 'id', indexes: ['email', 'country', 'createdAt'] },
      accounts: { keyPath: 'id', indexes: ['userId', 'bankName', 'type', 'currency'] },
      transactions: { keyPath: 'id', indexes: ['accountId', 'date', 'category', 'amount'] },
      goals: { keyPath: 'id', indexes: ['userId', 'category', 'priority', 'targetDate'] },
      budgets: { keyPath: 'id', indexes: ['userId', 'period', 'category'] },
      insights: { keyPath: 'id', indexes: ['userId', 'type', 'createdAt'] },
      settings: { keyPath: 'key', indexes: ['userId', 'category'] }
    };
  }

  /**
   * Initialize database connection and encryption
   */
  async initialize(userKey = null) {
    try {
      if (this.isInitialized && this.db) {
        return true;
      }

      // Set up encryption key if provided
      if (userKey) {
        this.encryptionKey = await this.deriveKey(userKey);
      }

      // Open database connection
      this.db = await this.openDatabase();
      this.isInitialized = true;
      
      console.log('✅ Database initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw new Error(`Database initialization failed: ${error.message}`);
    }
  }

  /**
   * Open IndexedDB database with proper stores
   */
  openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const transaction = event.target.transaction;

        // Create object stores
        Object.entries(this.stores).forEach(([storeName, config]) => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, {
              keyPath: config.keyPath,
              autoIncrement: config.keyPath === 'id'
            });

            // Create indexes
            config.indexes.forEach(indexName => {
              if (!store.indexNames.contains(indexName)) {
                store.createIndex(indexName, indexName, { unique: false });
              }
            });
          }
        });

        console.log('📊 Database stores created/updated');
      };
    });
  }

  /**
   * Derive encryption key from user password/biometric
   */
  async deriveKey(userKey) {
    try {
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(userKey),
        'PBKDF2',
        false,
        ['deriveKey']
      );

      const derivedKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: encoder.encode('SmartFinanceAI-Salt-2025'),
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      return derivedKey;
    } catch (error) {
      throw new Error(`Key derivation failed: ${error.message}`);
    }
  }

  /**
   * Encrypt sensitive data before storing
   */
  async encryptData(data) {
    if (!this.encryptionKey || !data) {
      return data;
    }

    try {
      const encoder = new TextEncoder();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        this.encryptionKey,
        encoder.encode(JSON.stringify(data))
      );

      return {
        encrypted: true,
        iv: Array.from(iv),
        data: Array.from(new Uint8Array(encryptedData))
      };
    } catch (error) {
      console.error('❌ Encryption failed:', error);
      return data;
    }
  }

  /**
   * Decrypt data after retrieval
   */
  async decryptData(encryptedData) {
    if (!encryptedData?.encrypted || !this.encryptionKey) {
      return encryptedData;
    }

    try {
      const iv = new Uint8Array(encryptedData.iv);
      const data = new Uint8Array(encryptedData.data);

      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        this.encryptionKey,
        data
      );

      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(decryptedData));
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      return null;
    }
  }

  /**
   * Generic create operation
   */
  async create(storeName, data) {
    try {
      if (!this.isInitialized) {
        throw new Error('Database not initialized');
      }

      // Add metadata
      const record = {
        ...data,
        id: data.id || this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Encrypt sensitive financial data
      if (['transactions', 'accounts', 'goals'].includes(storeName)) {
        record.encryptedData = await this.encryptData({
          amount: record.amount,
          balance: record.balance,
          targetAmount: record.targetAmount,
          currentAmount: record.currentAmount
        });
        
        // Remove plain text amounts
        delete record.amount;
        delete record.balance;
        delete record.targetAmount;
        delete record.currentAmount;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      await new Promise((resolve, reject) => {
        const request = store.add(record);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      console.log(`✅ Created ${storeName} record:`, record.id);
      return record;
    } catch (error) {
      console.error(`❌ Create ${storeName} failed:`, error);
      throw error;
    }
  }

  /**
   * Generic read operation
   */
  async read(storeName, id) {
    try {
      if (!this.isInitialized) {
        throw new Error('Database not initialized');
      }

      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      const record = await new Promise((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (!record) {
        return null;
      }

      // Decrypt sensitive data
      if (record.encryptedData) {
        const decryptedData = await this.decryptData(record.encryptedData);
        if (decryptedData) {
          Object.assign(record, decryptedData);
        }
        delete record.encryptedData;
      }

      return record;
    } catch (error) {
      console.error(`❌ Read ${storeName} failed:`, error);
      return null;
    }
  }

  /**
   * Generic update operation
   */
  async update(storeName, id, updates) {
    try {
      if (!this.isInitialized) {
        throw new Error('Database not initialized');
      }

      const existingRecord = await this.read(storeName, id);
      if (!existingRecord) {
        throw new Error(`Record not found: ${id}`);
      }

      const updatedRecord = {
        ...existingRecord,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Re-encrypt sensitive data
      if (['transactions', 'accounts', 'goals'].includes(storeName)) {
        updatedRecord.encryptedData = await this.encryptData({
          amount: updatedRecord.amount,
          balance: updatedRecord.balance,
          targetAmount: updatedRecord.targetAmount,
          currentAmount: updatedRecord.currentAmount
        });
        
        delete updatedRecord.amount;
        delete updatedRecord.balance;
        delete updatedRecord.targetAmount;
        delete updatedRecord.currentAmount;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      await new Promise((resolve, reject) => {
        const request = store.put(updatedRecord);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      console.log(`✅ Updated ${storeName} record:`, id);
      return updatedRecord;
    } catch (error) {
      console.error(`❌ Update ${storeName} failed:`, error);
      throw error;
    }
  }

  /**
   * Generic delete operation
   */
  async delete(storeName, id) {
    try {
      if (!this.isInitialized) {
        throw new Error('Database not initialized');
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      await new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      console.log(`✅ Deleted ${storeName} record:`, id);
      return true;
    } catch (error) {
      console.error(`❌ Delete ${storeName} failed:`, error);
      throw error;
    }
  }

  /**
   * Query records with filters
   */
  async query(storeName, filters = {}, options = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('Database not initialized');
      }

      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      let cursor;
      
      // Use index if specified in filters
      if (filters.index && store.indexNames.contains(filters.index)) {
        const index = store.index(filters.index);
        cursor = filters.value ? 
          index.openCursor(IDBKeyRange.only(filters.value)) :
          index.openCursor();
      } else {
        cursor = store.openCursor();
      }

      const results = [];
      
      await new Promise((resolve, reject) => {
        cursor.onsuccess = async (event) => {
          const cursor = event.target.result;
          
          if (cursor) {
            let record = cursor.value;
            
            // Decrypt sensitive data
            if (record.encryptedData) {
              const decryptedData = await this.decryptData(record.encryptedData);
              if (decryptedData) {
                Object.assign(record, decryptedData);
              }
              delete record.encryptedData;
            }
            
            // Apply filters
            let include = true;
            Object.entries(filters).forEach(([key, value]) => {
              if (key !== 'index' && key !== 'value' && record[key] !== value) {
                include = false;
              }
            });
            
            if (include) {
              results.push(record);
            }
            
            // Apply limit
            if (options.limit && results.length >= options.limit) {
              resolve();
              return;
            }
            
            cursor.continue();
          } else {
            resolve();
          }
        };
        
        cursor.onerror = () => reject(cursor.error);
      });

      // Apply sorting
      if (options.sortBy) {
        results.sort((a, b) => {
          const aVal = a[options.sortBy];
          const bVal = b[options.sortBy];
          
          if (options.sortOrder === 'desc') {
            return bVal > aVal ? 1 : -1;
          } else {
            return aVal > bVal ? 1 : -1;
          }
        });
      }

      return results;
    } catch (error) {
      console.error(`❌ Query ${storeName} failed:`, error);
      return [];
    }
  }

  /**
   * Specialized financial queries
   */
  async getTransactionsByAccount(accountId, dateRange = null) {
    const filters = { accountId };
    if (dateRange) {
      // For date range filtering, we'll filter after retrieval
      // as IndexedDB doesn't support complex range queries easily
    }
    
    const transactions = await this.query('transactions', filters, {
      sortBy: 'date',
      sortOrder: 'desc'
    });
    
    if (dateRange) {
      return transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= new Date(dateRange.start) && 
               transactionDate <= new Date(dateRange.end);
      });
    }
    
    return transactions;
  }

  async getUserGoals(userId, activeOnly = false) {
    const goals = await this.query('goals', { userId }, {
      sortBy: 'priority',
      sortOrder: 'asc'
    });
    
    if (activeOnly) {
      return goals.filter(g => g.status === 'active');
    }
    
    return goals;
  }

  async getAccountsByUser(userId) {
    return await this.query('accounts', { userId }, {
      sortBy: 'bankName',
      sortOrder: 'asc'
    });
  }

  /**
   * Bulk operations for CSV imports
   */
  async bulkCreate(storeName, records) {
    try {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const promises = records.map(async (record) => {
        const recordWithId = {
          ...record,
          id: record.id || this.generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Encrypt if needed
        if (['transactions', 'accounts', 'goals'].includes(storeName)) {
          recordWithId.encryptedData = await this.encryptData({
            amount: recordWithId.amount,
            balance: recordWithId.balance
          });
          delete recordWithId.amount;
          delete recordWithId.balance;
        }

        return new Promise((resolve, reject) => {
          const request = store.add(recordWithId);
          request.onsuccess = () => resolve(recordWithId);
          request.onerror = () => reject(request.error);
        });
      });

      const results = await Promise.all(promises);
      console.log(`✅ Bulk created ${results.length} ${storeName} records`);
      return results;
    } catch (error) {
      console.error(`❌ Bulk create ${storeName} failed:`, error);
      throw error;
    }
  }

  /**
   * Database maintenance
   */
  async getStorageUsage() {
    try {
      if (!navigator.storage || !navigator.storage.estimate) {
        return { quota: 0, usage: 0, percentage: 0 };
      }

      const estimate = await navigator.storage.estimate();
      return {
        quota: estimate.quota,
        usage: estimate.usage,
        percentage: Math.round((estimate.usage / estimate.quota) * 100)
      };
    } catch (error) {
      console.error('❌ Storage usage check failed:', error);
      return { quota: 0, usage: 0, percentage: 0 };
    }
  }

  async clearStore(storeName) {
    try {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      await new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      console.log(`✅ Cleared ${storeName} store`);
    } catch (error) {
      console.error(`❌ Clear ${storeName} failed:`, error);
      throw error;
    }
  }

  /**
   * Utility functions
   */
  generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
      console.log('✅ Database connection closed');
    }
  }

  /**
   * Export user data for backup
   */
  async exportUserData(userId) {
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        userId: userId,
        accounts: await this.query('accounts', { userId }),
        transactions: await this.query('transactions', { index: 'userId', value: userId }),
        goals: await this.query('goals', { userId }),
        budgets: await this.query('budgets', { userId }),
        settings: await this.query('settings', { userId })
      };

      return exportData;
    } catch (error) {
      console.error('❌ Export failed:', error);
      throw error;
    }
  }
}

// Global database instance
window.DatabaseManager = DatabaseManager;

export default DatabaseManager;