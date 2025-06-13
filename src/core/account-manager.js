/**
 * SmartFinanceAI - Account Management System
 * 
 * Manages user financial accounts including bank accounts, credit cards,
 * investment accounts, and other financial instruments across multiple
 * currencies and institutions.
 * 
 * Features:
 * - Multi-currency account support
 * - Real-time balance tracking
 * - Account verification and validation
 * - Joint account management for couples
 * - Account categorization and grouping
 */

class AccountManager {
  constructor() {
    this.accounts = new Map();
    this.accountTypes = new Map();
    this.institutions = new Map();
    this.balanceHistory = new Map();
    this.listeners = new Set();
    
    // Account type definitions
    this.initializeAccountTypes();
    
    // Supported institutions
    this.initializeInstitutions();
    
    this.initialize();
  }

  async initialize() {
    try {
      console.log('Initializing Account Manager...');
      
      // Load existing accounts
      await this.loadAccounts();
      
      // Set up balance tracking
      this.setupBalanceTracking();
      
      // Initialize account validation
      this.setupAccountValidation();
      
      console.log('Account Manager initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize Account Manager:', error);
      throw error;
    }
  }

  /**
   * Initialize supported account types
   * @private
   */
  initializeAccountTypes() {
    this.accountTypes.set('checking', {
      name: 'Checking Account',
      category: 'banking',
      icon: 'credit-card',
      features: ['transactions', 'transfers', 'bills'],
      typical_balance_range: [0, 10000],
      interest_bearing: false
    });

    this.accountTypes.set('savings', {
      name: 'Savings Account',
      category: 'banking',
      icon: 'piggy-bank',
      features: ['savings', 'interest', 'goals'],
      typical_balance_range: [0, 100000],
      interest_bearing: true
    });

    this.accountTypes.set('credit_card', {
      name: 'Credit Card',
      category: 'credit',
      icon: 'credit-card',
      features: ['purchases', 'rewards', 'credit_limit'],
      typical_balance_range: [-50000, 0],
      interest_bearing: false,
      liability: true
    });

    this.accountTypes.set('investment', {
      name: 'Investment Account',
      category: 'investment',
      icon: 'trending-up',
      features: ['stocks', 'bonds', 'portfolio'],
      typical_balance_range: [0, 1000000],
      interest_bearing: false,
      volatile: true
    });

    this.accountTypes.set('retirement', {
      name: 'Retirement Account',
      category: 'retirement',
      icon: 'calendar',
      features: ['tax_advantage', 'long_term', 'employer_match'],
      typical_balance_range: [0, 2000000],
      interest_bearing: true,
      restricted: true
    });

    this.accountTypes.set('loan', {
      name: 'Loan',
      category: 'debt',
      icon: 'home',
      features: ['principal', 'interest', 'payments'],
      typical_balance_range: [-1000000, 0],
      interest_bearing: false,
      liability: true
    });
  }

  /**
   * Initialize supported financial institutions
   * @private
   */
  initializeInstitutions() {
    // New Zealand banks
    this.institutions.set('anz_nz', {
      name: 'ANZ New Zealand',
      country: 'NZ',
      routing_format: 'dd-dddd-ddddddd-dd',
      logo: '/images/banks/anz-nz.png',
      colors: { primary: '#003d5c', secondary: '#0066b3' },
      csv_formats: ['ANZ_NZ_STANDARD', 'ANZ_NZ_EXTENDED']
    });

    this.institutions.set('asb', {
      name: 'ASB Bank',
      country: 'NZ',
      routing_format: 'dd-dddd-ddddddd-dd',
      logo: '/images/banks/asb.png',
      colors: { primary: '#ffdd00', secondary: '#000000' },
      csv_formats: ['ASB_STANDARD']
    });

    this.institutions.set('bnz', {
      name: 'Bank of New Zealand',
      country: 'NZ',
      routing_format: 'dd-dddd-ddddddd-dd',
      logo: '/images/banks/bnz.png',
      colors: { primary: '#ff6900', secondary: '#003d5c' },
      csv_formats: ['BNZ_STANDARD']
    });

    // Australian banks
    this.institutions.set('commbank', {
      name: 'Commonwealth Bank',
      country: 'AU',
      routing_format: 'ddd-ddd',
      logo: '/images/banks/commbank.png',
      colors: { primary: '#ffcc00', secondary: '#000000' },
      csv_formats: ['CBA_STANDARD', 'CBA_DETAILED']
    });

    // US banks
    this.institutions.set('chase', {
      name: 'JPMorgan Chase',
      country: 'US',
      routing_format: 'ddddddddd',
      logo: '/images/banks/chase.png',
      colors: { primary: '#005cb9', secondary: '#ffffff' },
      csv_formats: ['CHASE_STANDARD', 'CHASE_CREDIT']
    });

    // UK banks
    this.institutions.set('lloyds', {
      name: 'Lloyds Bank',
      country: 'GB',
      routing_format: 'dd-dd-dd',
      logo: '/images/banks/lloyds.png',
      colors: { primary: '#00693c', secondary: '#c8102e' },
      csv_formats: ['LLOYDS_STANDARD']
    });
  }

  /**
   * Create new financial account
   * @param {object} accountData - Account information
   * @returns {Promise<object>} Created account
   */
  async createAccount(accountData) {
    try {
      // Validate required fields
      this.validateAccountData(accountData);

      // Generate unique account ID
      const accountId = this.generateAccountId();

      // Create account object
      const account = {
        id: accountId,
        name: accountData.name,
        type: accountData.type,
        institution: accountData.institution,
        currency: accountData.currency || 'USD',
        account_number: accountData.account_number,
        balance: accountData.initial_balance || 0,
        available_balance: accountData.available_balance || accountData.initial_balance || 0,
        credit_limit: accountData.credit_limit || null,
        interest_rate: accountData.interest_rate || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
        is_primary: accountData.is_primary || false,
        owner_type: accountData.owner_type || 'individual', // individual, joint, business
        owners: accountData.owners || [this.getCurrentUserId()],
        metadata: {
          opening_date: accountData.opening_date,
          routing_number: accountData.routing_number,
          swift_code: accountData.swift_code,
          notes: accountData.notes,
          tags: accountData.tags || [],
          color: accountData.color || this.getDefaultAccountColor(accountData.type)
        }
      };

      // Validate account number format
      await this.validateAccountNumber(account);

      // Store account securely
      await this.storeAccount(account);

      // Add to memory cache
      this.accounts.set(accountId, account);

      // Initialize balance history
      await this.initializeBalanceHistory(accountId, account.balance);

      // Notify listeners
      this.notifyAccountChange('ACCOUNT_CREATED', account);

      // Log account creation
      if (window.auditLogger) {
        await window.auditLogger.logFinancialEvent('ACCOUNT_CREATED', {
          accountId: accountId,
          accountType: account.type,
          institution: account.institution,
          currency: account.currency,
          ownerType: account.owner_type
        });
      }

      console.log(`Account created: ${account.name} (${accountId})`);
      return account;

    } catch (error) {
      console.error('Failed to create account:', error);
      throw error;
    }
  }

  /**
   * Update existing account
   * @param {string} accountId - Account ID to update
   * @param {object} updates - Fields to update
   * @returns {Promise<object>} Updated account
   */
  async updateAccount(accountId, updates) {
    try {
      const account = this.accounts.get(accountId);
      if (!account) {
        throw new Error('Account not found');
      }

      // Validate updates
      this.validateAccountUpdates(updates);

      // Create updated account
      const updatedAccount = {
        ...account,
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Special handling for balance updates
      if (updates.balance !== undefined && updates.balance !== account.balance) {
        await this.recordBalanceChange(accountId, account.balance, updates.balance);
      }

      // Store updated account
      await this.storeAccount(updatedAccount);

      // Update memory cache
      this.accounts.set(accountId, updatedAccount);

      // Notify listeners
      this.notifyAccountChange('ACCOUNT_UPDATED', updatedAccount, account);

      // Log account update
      if (window.auditLogger) {
        await window.auditLogger.logFinancialEvent('ACCOUNT_UPDATED', {
          accountId: accountId,
          updatedFields: Object.keys(updates),
          balanceChanged: updates.balance !== undefined
        });
      }

      return updatedAccount;

    } catch (error) {
      console.error('Failed to update account:', error);
      throw error;
    }
  }

  /**
   * Delete account
   * @param {string} accountId - Account ID to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteAccount(accountId) {
    try {
      const account = this.accounts.get(accountId);
      if (!account) {
        throw new Error('Account not found');
      }

      // Check for pending transactions
      const hasPendingTransactions = await this.checkPendingTransactions(accountId);
      if (hasPendingTransactions) {
        throw new Error('Cannot delete account with pending transactions');
      }

      // Soft delete (mark as inactive)
      const deletedAccount = {
        ...account,
        is_active: false,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Store updated account
      await this.storeAccount(deletedAccount);

      // Remove from active cache
      this.accounts.delete(accountId);

      // Notify listeners
      this.notifyAccountChange('ACCOUNT_DELETED', deletedAccount);

      // Log account deletion
      if (window.auditLogger) {
        await window.auditLogger.logFinancialEvent('ACCOUNT_DELETED', {
          accountId: accountId,
          accountType: account.type,
          finalBalance: account.balance
        });
      }

      return true;

    } catch (error) {
      console.error('Failed to delete account:', error);
      throw error;
    }
  }

  /**
   * Get account by ID
   * @param {string} accountId - Account ID
   * @returns {object|null} Account or null if not found
   */
  getAccount(accountId) {
    return this.accounts.get(accountId) || null;
  }

  /**
   * Get all user accounts
   * @param {object} filters - Optional filters
   * @returns {Array} Array of accounts
   */
  getAccounts(filters = {}) {
    let accounts = Array.from(this.accounts.values());

    // Apply filters
    if (filters.type) {
      accounts = accounts.filter(account => account.type === filters.type);
    }

    if (filters.institution) {
      accounts = accounts.filter(account => account.institution === filters.institution);
    }

    if (filters.currency) {
      accounts = accounts.filter(account => account.currency === filters.currency);
    }

    if (filters.is_active !== undefined) {
      accounts = accounts.filter(account => account.is_active === filters.is_active);
    }

    if (filters.owner_type) {
      accounts = accounts.filter(account => account.owner_type === filters.owner_type);
    }

    // Sort by name
    accounts.sort((a, b) => a.name.localeCompare(b.name));

    return accounts;
  }

  /**
   * Get accounts grouped by type
   * @returns {object} Accounts grouped by type
   */
  getAccountsByType() {
    const grouped = {};
    
    for (const account of this.accounts.values()) {
      if (!grouped[account.type]) {
        grouped[account.type] = [];
      }
      grouped[account.type].push(account);
    }

    return grouped;
  }

  /**
   * Get account summary statistics
   * @returns {object} Account summary
   */
  getAccountSummary() {
    const accounts = Array.from(this.accounts.values());
    const summary = {
      total_accounts: accounts.length,
      by_type: {},
      by_currency: {},
      total_assets: 0,
      total_liabilities: 0,
      net_worth: 0,
      currencies: new Set()
    };

    for (const account of accounts) {
      // Count by type
      summary.by_type[account.type] = (summary.by_type[account.type] || 0) + 1;

      // Count by currency
      summary.by_currency[account.currency] = (summary.by_currency[account.currency] || 0) + 1;
      summary.currencies.add(account.currency);

      // Calculate totals (convert to base currency if needed)
      const accountType = this.accountTypes.get(account.type);
      if (accountType?.liability) {
        summary.total_liabilities += Math.abs(account.balance);
      } else {
        summary.total_assets += account.balance;
      }
    }

    summary.net_worth = summary.total_assets - summary.total_liabilities;
    summary.currencies = Array.from(summary.currencies);

    return summary;
  }

  /**
   * Update account balance
   * @param {string} accountId - Account ID
   * @param {number} newBalance - New balance
   * @param {string} reason - Reason for balance change
   * @returns {Promise<object>} Updated account
   */
  async updateBalance(accountId, newBalance, reason = 'manual_update') {
    try {
      const account = this.accounts.get(accountId);
      if (!account) {
        throw new Error('Account not found');
      }

      const oldBalance = account.balance;

      // Update account
      const updatedAccount = await this.updateAccount(accountId, {
        balance: newBalance,
        available_balance: newBalance, // Simplified - in production, calculate properly
        updated_at: new Date().toISOString()
      });

      // Log balance change
      if (window.auditLogger) {
        await window.auditLogger.logFinancialEvent('BALANCE_UPDATED', {
          accountId: accountId,
          oldBalance: oldBalance,
          newBalance: newBalance,
          change: newBalance - oldBalance,
          reason: reason
        });
      }

      return updatedAccount;

    } catch (error) {
      console.error('Failed to update balance:', error);
      throw error;
    }
  }

  /**
   * Get account balance history
   * @param {string} accountId - Account ID
   * @param {number} days - Number of days of history
   * @returns {Array} Balance history
   */
  async getBalanceHistory(accountId, days = 30) {
    try {
      const history = this.balanceHistory.get(accountId) || [];
      const cutoffDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));

      return history.filter(entry => new Date(entry.timestamp) >= cutoffDate);

    } catch (error) {
      console.error('Failed to get balance history:', error);
      return [];
    }
  }

  /**
   * Validate account data
   * @private
   */
  validateAccountData(accountData) {
    const required = ['name', 'type', 'institution', 'currency'];
    
    for (const field of required) {
      if (!accountData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate account type
    if (!this.accountTypes.has(accountData.type)) {
      throw new Error('Invalid account type');
    }

    // Validate institution
    if (!this.institutions.has(accountData.institution)) {
      throw new Error('Invalid institution');
    }

    // Validate currency
    if (window.currencyManager && !window.currencyManager.isValidCurrency(accountData.currency)) {
      throw new Error('Invalid currency');
    }

    // Validate balance for credit accounts
    const accountType = this.accountTypes.get(accountData.type);
    if (accountType.liability && accountData.initial_balance > 0) {
      throw new Error('Liability accounts should have negative or zero balance');
    }
  }

  /**
   * Validate account updates
   * @private
   */
  validateAccountUpdates(updates) {
    // Prevent updating critical fields
    const immutableFields = ['id', 'created_at', 'account_number'];
    
    for (const field of immutableFields) {
      if (updates.hasOwnProperty(field)) {
        throw new Error(`Cannot update immutable field: ${field}`);
      }
    }

    // Validate balance if provided
    if (updates.balance !== undefined && typeof updates.balance !== 'number') {
      throw new Error('Balance must be a number');
    }
  }

  /**
   * Validate account number format
   * @private
   */
  async validateAccountNumber(account) {
    const institution = this.institutions.get(account.institution);
    if (!institution || !institution.routing_format) {
      return true; // Skip validation if format not defined
    }

    // Basic validation - in production, implement proper format checking
    if (!account.account_number || account.account_number.length < 5) {
      throw new Error('Invalid account number format');
    }

    return true;
  }

  /**
   * Store account securely
   * @private
   */
  async storeAccount(account) {
    try {
      // Use tenant isolation for secure storage
      if (window.tenantIsolation) {
        await window.tenantIsolation.secureDataAccess('WRITE', 'accounts', account);
      } else {
        // Fallback to local storage (development only)
        const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
        const existingIndex = accounts.findIndex(a => a.id === account.id);
        
        if (existingIndex >= 0) {
          accounts[existingIndex] = account;
        } else {
          accounts.push(account);
        }
        
        localStorage.setItem('accounts', JSON.stringify(accounts));
      }

    } catch (error) {
      console.error('Failed to store account:', error);
      throw error;
    }
  }

  /**
   * Load accounts from storage
   * @private
   */
  async loadAccounts() {
    try {
      let accounts = [];

      if (window.tenantIsolation) {
        accounts = await window.tenantIsolation.secureDataAccess('READ', 'accounts');
      } else {
        // Fallback to local storage
        accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
      }

      // Load into memory cache
      this.accounts.clear();
      accounts.forEach(account => {
        if (account.is_active) {
          this.accounts.set(account.id, account);
        }
      });

      console.log(`Loaded ${this.accounts.size} accounts`);

    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  }

  /**
   * Record balance change in history
   * @private
   */
  async recordBalanceChange(accountId, oldBalance, newBalance) {
    try {
      const historyEntry = {
        timestamp: new Date().toISOString(),
        old_balance: oldBalance,
        new_balance: newBalance,
        change: newBalance - oldBalance
      };

      if (!this.balanceHistory.has(accountId)) {
        this.balanceHistory.set(accountId, []);
      }

      const history = this.balanceHistory.get(accountId);
      history.push(historyEntry);

      // Keep only last 1000 entries
      if (history.length > 1000) {
        history.splice(0, history.length - 1000);
      }

    } catch (error) {
      console.error('Failed to record balance change:', error);
    }
  }

  /**
   * Initialize balance history for new account
   * @private
   */
  async initializeBalanceHistory(accountId, initialBalance) {
    const historyEntry = {
      timestamp: new Date().toISOString(),
      old_balance: 0,
      new_balance: initialBalance,
      change: initialBalance
    };

    this.balanceHistory.set(accountId, [historyEntry]);
  }

  /**
   * Setup balance tracking
   * @private
   */
  setupBalanceTracking() {
    // Set up periodic balance snapshots
    setInterval(() => {
      this.createBalanceSnapshots();
    }, 24 * 60 * 60 * 1000); // Daily snapshots
  }

  /**
   * Create daily balance snapshots
   * @private
   */
  async createBalanceSnapshots() {
    try {
      for (const [accountId, account] of this.accounts) {
        const historyEntry = {
          timestamp: new Date().toISOString(),
          old_balance: account.balance,
          new_balance: account.balance,
          change: 0,
          snapshot: true
        };

        if (!this.balanceHistory.has(accountId)) {
          this.balanceHistory.set(accountId, []);
        }

        this.balanceHistory.get(accountId).push(historyEntry);
      }

    } catch (error) {
      console.error('Failed to create balance snapshots:', error);
    }
  }

  /**
   * Setup account validation
   * @private
   */
  setupAccountValidation() {
    // Periodic account health checks
    setInterval(() => {
      this.validateAccountHealth();
    }, 60 * 60 * 1000); // Hourly checks
  }

  /**
   * Validate account health
   * @private
   */
  async validateAccountHealth() {
    try {
      for (const account of this.accounts.values()) {
        // Check for unusual balance changes
        const recentHistory = await this.getBalanceHistory(account.id, 7);
        if (recentHistory.length > 1) {
          const changes = recentHistory.map(h => Math.abs(h.change));
          const maxChange = Math.max(...changes);
          const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;

          if (maxChange > avgChange * 10) {
            console.warn(`Unusual balance change detected for account ${account.id}`);
          }
        }

        // Check for negative balances on non-credit accounts
        const accountType = this.accountTypes.get(account.type);
        if (!accountType.liability && account.balance < 0) {
          console.warn(`Negative balance on non-credit account ${account.id}`);
        }
      }

    } catch (error) {
      console.error('Account health validation failed:', error);
    }
  }

  /**
   * Check for pending transactions
   * @private
   */
  async checkPendingTransactions(accountId) {
    // In production, check with transaction manager
    // For now, return false
    return false;
  }

  /**
   * Utility methods
   */
  generateAccountId() {
    return `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getCurrentUserId() {
    // Get from session manager
    return window.sessionManager?.getCurrentSession()?.userHandle || 'unknown';
  }

  getDefaultAccountColor(accountType) {
    const colors = {
      'checking': '#3b82f6',    // Blue
      'savings': '#10b981',     // Green
      'credit_card': '#ef4444', // Red
      'investment': '#8b5cf6',  // Purple
      'retirement': '#f59e0b',  // Amber
      'loan': '#6b7280'         // Gray
    };
    
    return colors[accountType] || '#6b7280';
  }

  /**
   * Event handling
   */
  addEventListener(callback) {
    this.listeners.add(callback);
  }

  removeEventListener(callback) {
    this.listeners.delete(callback);
  }

  notifyAccountChange(event, account, previousAccount = null) {
    this.listeners.forEach(callback => {
      try {
        callback(event, account, previousAccount);
      } catch (error) {
        console.error('Account listener error:', error);
      }
    });
  }

  /**
   * Import/Export functionality
   */
  async exportAccounts(format = 'json') {
    try {
      const accounts = Array.from(this.accounts.values());
      
      if (format === 'json') {
        return JSON.stringify({
          export_date: new Date().toISOString(),
          account_count: accounts.length,
          accounts: accounts
        }, null, 2);
      }
      
      if (format === 'csv') {
        const headers = ['Name', 'Type', 'Institution', 'Currency', 'Balance', 'Created'];
        const rows = accounts.map(account => [
          account.name,
          account.type,
          account.institution,
          account.currency,
          account.balance,
          account.created_at
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
      }

      throw new Error('Unsupported export format');

    } catch (error) {
      console.error('Failed to export accounts:', error);
      throw error;
    }
  }

  /**
   * Account search and filtering
   */
  searchAccounts(query) {
    const lowercaseQuery = query.toLowerCase();
    
    return Array.from(this.accounts.values()).filter(account =>
      account.name.toLowerCase().includes(lowercaseQuery) ||
      account.type.toLowerCase().includes(lowercaseQuery) ||
      account.institution.toLowerCase().includes(lowercaseQuery) ||
      account.currency.toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * Get supported account types
   */
  getSupportedAccountTypes() {
    return Array.from(this.accountTypes.entries()).map(([key, value]) => ({
      id: key,
      ...value
    }));
  }

  /**
   * Get supported institutions
   */
  getSupportedInstitutions(country = null) {
    let institutions = Array.from(this.institutions.entries()).map(([key, value]) => ({
      id: key,
      ...value
    }));

    if (country) {
      institutions = institutions.filter(inst => inst.country === country);
    }

    return institutions;
  }

  /**
   * Health check
   */
  healthCheck() {
    return {
      accounts_loaded: this.accounts.size,
      account_types: this.accountTypes.size,
      institutions: this.institutions.size,
      balance_history_accounts: this.balanceHistory.size,
      listeners: this.listeners.size,
      total_balance: Array.from(this.accounts.values()).reduce((sum, acc) => sum + acc.balance, 0)
    };
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.accounts.clear();
    this.balanceHistory.clear();
    this.listeners.clear();
    
    console.log('Account Manager cleanup completed');
  }
}

// Export singleton instance
export const accountManager = new AccountManager();
export default accountManager;
