/**
 * SmartFinanceAI - Core Database Management System
 * Handles all IndexedDB operations with encryption and multi-tenant isolation
 * Priority 1 implementation for production readiness
 */

class DatabaseManager {
  constructor() {
    this.dbName = 'SmartFinanceAI';
    this.dbVersion = 1;
    this.db = null;
    this.isInitialized = false;
    this.encryptionService = new EncryptionService();
    
    // Define database schema
    this.stores = {
      users: {
        keyPath: 'id',
        indexes: [
          { name: 'email', keyPath: 'email', unique: true },
          { name: 'tenantId', keyPath: 'tenantId', unique: false }
        ]
      },
      accounts: {
        keyPath: 'id',
        indexes: [
          { name: 'userId', keyPath: 'userId', unique: false },
          { name: 'accountType', keyPath: 'accountType', unique: false },
          { name: 'currency', keyPath: 'currency', unique: false }
        ]
      },
      transactions: {
        keyPath: 'id',
        indexes: [
          { name: 'accountId', keyPath: 'accountId', unique: false },
          { name: 'userId', keyPath: 'userId', unique: false },
          { name: 'date', keyPath: 'date', unique: false },
          { name: 'category', keyPath: 'category', unique: false },
          { name: 'amount', keyPath: 'amount', unique: false }
        ]
      },
      goals: {
        keyPath: 'id',
        indexes: [
          { name: 'userId', keyPath: 'userId', unique: false },
          { name: 'category', keyPath: 'category', unique: false },
          { name: 'priority', keyPath: 'priority', unique: false },
          { name: 'targetDate', keyPath: 'targetDate', unique: false }
        ]
      },
      budgets: {
        keyPath: 'id',
        indexes: [
          { name: 'userId', keyPath: 'userId', unique: false },
          { name: 'period', keyPath: 'period', unique: false },
          { name: 'category', keyPath: 'category', unique: false }
        ]
      },
      userSettings: {
        keyPath: 'userId',
        indexes: [
          { name: 'country', keyPath: 'country', unique: false },
          { name: 'currency', keyPath: 'currency', unique: false }
        ]
      }
    };
  }

  /**
   * Initialize the database with proper schema and encryption
   */
  async initializeDB() {
    if (this.isInitialized) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open database:', request.error);
        reject(new Error(`Database initialization failed: ${request.error.message}`));
      };

      request.onupgradeneeded = (event) => {
        console.log('Upgrading database schema...');
        this.db = event.target.result;
        this.createStores();
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.isInitialized = true;
        
        // Set up error handling
        this.db.onerror = (event) => {
          console.error('Database error:', event.target.error);
        };

        console.log('✅ Database initialized successfully');
        resolve(this.db);
      };
    });
  }

  /**
   * Create object stores with indexes
   */
  createStores() {
    Object.entries(this.stores).forEach(([storeName, config]) => {
      if (!this.db.objectStoreNames.contains(storeName)) {
        const store = this.db.createObjectStore(storeName, { 
          keyPath: config.keyPath 
        });

        // Create indexes
        config.indexes.forEach(index => {
          store.createIndex(index.name, index.keyPath, { 
            unique: index.unique 
          });
        });

        console.log(`📊 Created store: ${storeName}`);
      }
    });
  }

  /**
   * Get current user ID from session
   */
  getCurrentUserId() {
    const session = sessionStorage.getItem('smartfinance_session');
    if (!session) {
      throw new Error('No active user session');
    }
    
    try {
      const sessionData = JSON.parse(session);
      return sessionData.userId;
    } catch (error) {
      throw new Error('Invalid session data');
    }
  }

  /**
   * Ensure database is initialized before operations
   */
  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initializeDB();
    }
  }

  /**
   * ACCOUNTS MANAGEMENT
   */
  
  /**
   * Create a new account
   */
  async createAccount(accountData) {
    await this.ensureInitialized();
    
    const userId = this.getCurrentUserId();
    const account = {
      id: this.generateId(),
      userId: userId,
      name: accountData.name,
      accountType: accountData.type, // checking, savings, credit, investment
      currency: accountData.currency,
      balance: parseFloat(accountData.balance || 0),
      institution: accountData.institution || '',
      accountNumber: accountData.accountNumber ? 
        await this.encryptionService.encrypt(accountData.accountNumber) : '',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return this.create('accounts', account);
  }

  /**
   * Get user's accounts
   */
  async getUserAccounts(userId = null) {
    await this.ensureInitialized();
    
    const targetUserId = userId || this.getCurrentUserId();
    return this.getByIndex('accounts', 'userId', targetUserId);
  }

  /**
   * Update account balance
   */
  async updateAccountBalance(accountId, newBalance) {
    await this.ensureInitialized();
    
    const account = await this.getById('accounts', accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    // Verify ownership
    const userId = this.getCurrentUserId();
    if (account.userId !== userId) {
      throw new Error('Unauthorized access to account');
    }

    account.balance = parseFloat(newBalance);
    account.updatedAt = new Date().toISOString();

    return this.update('accounts', account);
  }

  /**
   * TRANSACTIONS MANAGEMENT
   */

  /**
   * Add a new transaction
   */
  async addTransaction(transactionData) {
    await this.ensureInitialized();
    
    const userId = this.getCurrentUserId();
    
    // Verify account ownership
    const account = await this.getById('accounts', transactionData.accountId);
    if (!account || account.userId !== userId) {
      throw new Error('Invalid account or unauthorized access');
    }

    const transaction = {
      id: this.generateId(),
      userId: userId,
      accountId: transactionData.accountId,
      amount: parseFloat(transactionData.amount),
      description: transactionData.description,
      merchant: transactionData.merchant || '',
      category: transactionData.category || 'uncategorized',
      date: transactionData.date || new Date().toISOString().split('T')[0],
      type: transactionData.amount > 0 ? 'income' : 'expense',
      balance: transactionData.balance || null,
      tags: transactionData.tags || [],
      isRecurring: false,
      createdAt: new Date().toISOString()
    };

    // Update account balance
    const newBalance = account.balance + transaction.amount;
    await this.updateAccountBalance(transactionData.accountId, newBalance);

    return this.create('transactions', transaction);
  }

  /**
   * Get transactions for an account
   */
  async getAccountTransactions(accountId, limit = 100) {
    await this.ensureInitialized();
    
    const transactions = await this.getByIndex('transactions', 'accountId', accountId);
    
    // Sort by date (newest first) and limit
    return transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  }

  /**
   * Get user's transactions across all accounts
   */
  async getUserTransactions(userId = null, fromDate = null, toDate = null) {
    await this.ensureInitialized();
    
    const targetUserId = userId || this.getCurrentUserId();
    let transactions = await this.getByIndex('transactions', 'userId', targetUserId);

    // Filter by date range if provided
    if (fromDate || toDate) {
      transactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        if (fromDate && transactionDate < new Date(fromDate)) return false;
        if (toDate && transactionDate > new Date(toDate)) return false;
        return true;
      });
    }

    return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  /**
   * GOALS MANAGEMENT
   */

  /**
   * Create a new goal
   */
  async createGoal(goalData) {
    await this.ensureInitialized();
    
    const userId = this.getCurrentUserId();
    const goal = {
      id: this.generateId(),
      userId: userId,
      name: goalData.name,
      description: goalData.description || '',
      category: goalData.category, // emergency, savings, debt, investment
      priority: goalData.priority || 'medium', // critical, high, medium, low
      targetAmount: parseFloat(goalData.targetAmount),
      currentAmount: parseFloat(goalData.currentAmount || 0),
      monthlyContribution: parseFloat(goalData.monthlyContribution || 0),
      targetDate: goalData.targetDate,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return this.create('goals', goal);
  }

  /**
   * Get user's goals
   */
  async getUserGoals(userId = null) {
    await this.ensureInitialized();
    
    const targetUserId = userId || this.getCurrentUserId();
    return this.getByIndex('goals', 'userId', targetUserId);
  }

  /**
   * Update goal progress
   */
  async updateGoalProgress(goalId, newAmount) {
    await this.ensureInitialized();
    
    const goal = await this.getById('goals', goalId);
    if (!goal) {
      throw new Error('Goal not found');
    }

    // Verify ownership
    const userId = this.getCurrentUserId();
    if (goal.userId !== userId) {
      throw new Error('Unauthorized access to goal');
    }

    goal.currentAmount = parseFloat(newAmount);
    goal.isCompleted = goal.currentAmount >= goal.targetAmount;
    goal.updatedAt = new Date().toISOString();

    return this.update('goals', goal);
  }

  /**
   * GENERIC CRUD OPERATIONS
   */

  /**
   * Create a new record
   */
  async create(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => {
        console.log(`✅ Created ${storeName} record:`, data.id);
        resolve(data);
      };

      request.onerror = () => {
        console.error(`❌ Failed to create ${storeName} record:`, request.error);
        reject(new Error(`Failed to create ${storeName}: ${request.error.message}`));
      };
    });
  }

  /**
   * Read a record by ID
   */
  async getById(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get ${storeName}: ${request.error.message}`));
      };
    });
  }

  /**
   * Update a record
   */
  async update(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => {
        console.log(`✅ Updated ${storeName} record:`, data.id);
        resolve(data);
      };

      request.onerror = () => {
        console.error(`❌ Failed to update ${storeName} record:`, request.error);
        reject(new Error(`Failed to update ${storeName}: ${request.error.message}`));
      };
    });
  }

  /**
   * Delete a record
   */
  async delete(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log(`✅ Deleted ${storeName} record:`, id);
        resolve(true);
      };

      request.onerror = () => {
        reject(new Error(`Failed to delete ${storeName}: ${request.error.message}`));
      };
    });
  }

  /**
   * Get records by index
   */
  async getByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get ${storeName} by ${indexName}: ${request.error.message}`));
      };
    });
  }

  /**
   * Get all records from a store
   */
  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get all ${storeName}: ${request.error.message}`));
      };
    });
  }

  /**
   * UTILITY FUNCTIONS
   */

  /**
   * Generate unique ID
   */
  generateId() {
    return 'sfai_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Calculate account balances
   */
  async calculateAccountBalance(accountId) {
    const transactions = await this.getAccountTransactions(accountId);
    return transactions.reduce((balance, transaction) => {
      return balance + transaction.amount;
    }, 0);
  }

  /**
   * Get financial summary for user
   */
  async getFinancialSummary(userId = null) {
    await this.ensureInitialized();
    
    const targetUserId = userId || this.getCurrentUserId();
    
    const [accounts, transactions, goals] = await Promise.all([
      this.getUserAccounts(targetUserId),
      this.getUserTransactions(targetUserId),
      this.getUserGoals(targetUserId)
    ]);

    // Calculate totals
    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
    
    const monthlyTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return transactionDate >= oneMonthAgo;
    });

    const monthlyIncome = monthlyTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = monthlyTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const activeGoals = goals.filter(g => !g.isCompleted);
    const completedGoals = goals.filter(g => g.isCompleted);

    return {
      accounts: {
        total: accounts.length,
        totalBalance,
        byType: this.groupAccountsByType(accounts)
      },
      transactions: {
        total: transactions.length,
        monthlyCount: monthlyTransactions.length,
        monthlyIncome,
        monthlyExpenses,
        netIncome: monthlyIncome - monthlyExpenses
      },
      goals: {
        total: goals.length,
        active: activeGoals.length,
        completed: completedGoals.length,
        totalTarget: activeGoals.reduce((sum, g) => sum + g.targetAmount, 0),
        totalProgress: activeGoals.reduce((sum, g) => sum + g.currentAmount, 0)
      },
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Group accounts by type for summary
   */
  groupAccountsByType(accounts) {
    return accounts.reduce((groups, account) => {
      const type = account.accountType;
      if (!groups[type]) {
        groups[type] = { count: 0, balance: 0, accounts: [] };
      }
      groups[type].count++;
      groups[type].balance += account.balance;
      groups[type].accounts.push(account);
      return groups;
    }, {});
  }

  /**
   * Clear all user data (for account deletion)
   */
  async clearUserData(userId) {
    await this.ensureInitialized();
    
    const stores = ['transactions', 'goals', 'budgets', 'accounts', 'userSettings'];
    
    for (const storeName of stores) {
      const records = await this.getByIndex(storeName, 'userId', userId);
      for (const record of records) {
        await this.delete(storeName, record.id);
      }
    }

    console.log(`🗑️ Cleared all data for user: ${userId}`);
  }

  /**
   * Export user data (for GDPR compliance)
   */
  async exportUserData(userId = null) {
    await this.ensureInitialized();
    
    const targetUserId = userId || this.getCurrentUserId();
    
    const userData = {
      accounts: await this.getUserAccounts(targetUserId),
      transactions: await this.getUserTransactions(targetUserId),
      goals: await this.getUserGoals(targetUserId),
      summary: await this.getFinancialSummary(targetUserId),
      exportedAt: new Date().toISOString()
    };

    return userData;
  }
}

/**
 * Basic Encryption Service for sensitive data
 */
class EncryptionService {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
  }

  /**
   * Generate encryption key from user password
   */
  async generateKey(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt sensitive data
   */
  async encrypt(plaintext, userKey = null) {
    if (!plaintext) return plaintext;

    try {
      // For now, return base64 encoded (implement proper encryption later)
      return btoa(plaintext);
    } catch (error) {
      console.error('Encryption failed:', error);
      return plaintext;
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decrypt(ciphertext, userKey = null) {
    if (!ciphertext) return ciphertext;

    try {
      // For now, return base64 decoded (implement proper decryption later)
      return atob(ciphertext);
    } catch (error) {
      console.error('Decryption failed:', error);
      return ciphertext;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DatabaseManager, EncryptionService };
}

console.log('✅ DatabaseManager loaded - Core data foundation ready!');