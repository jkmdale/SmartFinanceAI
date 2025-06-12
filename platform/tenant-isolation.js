/**
 * SmartFinanceAI - Multi-Tenant Data Isolation System
 * Ensures complete data separation between users and user groups
 * CRITICAL: This file implements bank-level security for user data
 */

class TenantIsolationManager {
  constructor() {
    this.currentTenant = null;
    this.accessControlList = new Map();
    this.dataContexts = new Map();
    this.auditLogger = null; // Will be injected
    this.encryptionService = null; // Will be injected
    
    // Initialize with strict security defaults
    this.securityConfig = {
      enforceStrictIsolation: true,
      auditAllAccess: true,
      encryptAllData: true,
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
      maxConcurrentSessions: 3
    };
  }

  /**
   * Initialize tenant context for authenticated user
   * @param {Object} user - Authenticated user object
   * @param {string} sessionId - Unique session identifier
   */
  async initializeTenant(user, sessionId) {
    try {
      // Validate user object
      if (!user || !user.id || !user.email) {
        throw new Error('Invalid user object for tenant initialization');
      }

      // Create tenant context
      const tenantId = this.generateTenantId(user);
      const dataContext = {
        tenantId,
        userId: user.id,
        userEmail: user.email,
        userType: user.type || 'individual', // individual, couple, family
        sessionId,
        permissions: this.generatePermissions(user),
        dataNamespace: `tenant_${tenantId}`,
        encryptionKey: await this.generateTenantEncryptionKey(user),
        createdAt: new Date().toISOString(),
        lastAccessAt: new Date().toISOString(),
        accessCount: 0
      };

      // Store tenant context
      this.currentTenant = dataContext;
      this.dataContexts.set(tenantId, dataContext);
      
      // Initialize access control
      this.accessControlList.set(tenantId, {
        allowedOperations: this.getAllowedOperations(user),
        restrictedData: this.getRestrictedData(user),
        sharedAccess: user.sharedAccess || []
      });

      // Audit log
      await this.auditLog('TENANT_INITIALIZED', {
        tenantId,
        userId: user.id,
        sessionId,
        userType: user.type
      });

      return tenantId;
    } catch (error) {
      await this.auditLog('TENANT_INIT_FAILED', {
        userId: user?.id,
        error: error.message
      });
      throw new Error(`Tenant initialization failed: ${error.message}`);
    }
  }

  /**
   * Generate unique tenant ID based on user data
   * @param {Object} user - User object
   * @returns {string} Unique tenant identifier
   */
  generateTenantId(user) {
    const baseString = `${user.id}_${user.email}_${Date.now()}`;
    return btoa(baseString).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }

  /**
   * Generate tenant-specific encryption key
   * @param {Object} user - User object
   * @returns {Promise<CryptoKey>} Encryption key for tenant
   */
  async generateTenantEncryptionKey(user) {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(`${user.id}_${user.email}_${user.passwordHash}`),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode(user.id),
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
   * Generate user permissions based on user type and subscription
   * @param {Object} user - User object
   * @returns {Object} Permissions object
   */
  generatePermissions(user) {
    const basePermissions = {
      read: ['accounts', 'transactions', 'goals', 'budgets'],
      write: ['accounts', 'transactions', 'goals', 'budgets'],
      delete: ['transactions', 'goals'],
      admin: []
    };

    // Subscription-based permissions
    if (user.subscription === 'premium') {
      basePermissions.read.push('advanced_analytics', 'investment_tracking');
      basePermissions.write.push('advanced_analytics', 'investment_tracking');
      basePermissions.admin.push('export_data');
    }

    if (user.subscription === 'professional') {
      basePermissions.read.push('business_features', 'api_access');
      basePermissions.write.push('business_features');
      basePermissions.admin.push('api_access', 'white_label');
    }

    // User type specific permissions
    if (user.type === 'couple' && user.partnerId) {
      basePermissions.shared = {
        partnerId: user.partnerId,
        sharedAccounts: user.sharedAccounts || [],
        sharedGoals: user.sharedGoals || [],
        permissions: user.partnerPermissions || 'full'
      };
    }

    if (user.type === 'family' && user.familyMembers) {
      basePermissions.family = {
        members: user.familyMembers || [],
        parentalControls: user.parentalControls || true,
        allowanceManagement: user.allowanceManagement || false
      };
    }

    return basePermissions;
  }

  /**
   * Get allowed operations for user
   * @param {Object} user - User object
   * @returns {Array} List of allowed operations
   */
  getAllowedOperations(user) {
    const operations = [
      'VIEW_DASHBOARD',
      'MANAGE_ACCOUNTS',
      'VIEW_TRANSACTIONS',
      'ADD_TRANSACTIONS',
      'EDIT_TRANSACTIONS',
      'DELETE_TRANSACTIONS',
      'MANAGE_GOALS',
      'MANAGE_BUDGETS',
      'VIEW_REPORTS',
      'IMPORT_CSV',
      'CHANGE_SETTINGS'
    ];

    // Add premium operations
    if (user.subscription === 'premium' || user.subscription === 'professional') {
      operations.push(
        'ADVANCED_ANALYTICS',
        'INVESTMENT_TRACKING',
        'EXPORT_DATA',
        'AI_COACHING_ADVANCED'
      );
    }

    // Add professional operations
    if (user.subscription === 'professional') {
      operations.push(
        'BUSINESS_FEATURES',
        'API_ACCESS',
        'WHITE_LABEL_OPTIONS',
        'PRIORITY_SUPPORT'
      );
    }

    return operations;
  }

  /**
   * Get restricted data types for user
   * @param {Object} user - User object
   * @returns {Array} List of restricted data types
   */
  getRestrictedData(user) {
    const restricted = [];

    // Free tier restrictions
    if (!user.subscription || user.subscription === 'free') {
      restricted.push(
        'ADVANCED_ANALYTICS',
        'INVESTMENT_TRACKING',
        'BUSINESS_FEATURES',
        'API_ACCESS',
        'PRIORITY_SUPPORT'
      );
    }

    // Add age-based restrictions for family accounts
    if (user.type === 'family' && user.isMinor) {
      restricted.push(
        'CREDIT_CARD_MANAGEMENT',
        'LOAN_APPLICATIONS',
        'INVESTMENT_FEATURES'
      );
    }

    return restricted;
  }

  /**
   * Validate access to specific data or operation
   * @param {string} operation - Operation being attempted
   * @param {string} dataType - Type of data being accessed
   * @param {Object} context - Additional context
   * @returns {Promise<boolean>} Whether access is allowed
   */
  async validateAccess(operation, dataType, context = {}) {
    try {
      if (!this.currentTenant) {
        throw new Error('No active tenant context');
      }

      const tenantId = this.currentTenant.tenantId;
      const acl = this.accessControlList.get(tenantId);
      
      if (!acl) {
        throw new Error('Access control list not found for tenant');
      }

      // Check if operation is allowed
      if (!acl.allowedOperations.includes(operation)) {
        await this.auditLog('ACCESS_DENIED', {
          tenantId,
          operation,
          dataType,
          reason: 'Operation not allowed'
        });
        return false;
      }

      // Check if data type is restricted
      if (acl.restrictedData.includes(dataType)) {
        await this.auditLog('ACCESS_DENIED', {
          tenantId,
          operation,
          dataType,
          reason: 'Data type restricted'
        });
        return false;
      }

      // Validate shared access for couple/family accounts
      if (context.sharedAccess && !this.validateSharedAccess(context)) {
        await this.auditLog('ACCESS_DENIED', {
          tenantId,
          operation,
          dataType,
          reason: 'Shared access validation failed'
        });
        return false;
      }

      // Update access tracking
      this.currentTenant.lastAccessAt = new Date().toISOString();
      this.currentTenant.accessCount++;

      // Audit successful access
      await this.auditLog('ACCESS_GRANTED', {
        tenantId,
        operation,
        dataType
      });

      return true;
    } catch (error) {
      await this.auditLog('ACCESS_ERROR', {
        tenantId: this.currentTenant?.tenantId,
        operation,
        dataType,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Validate shared access for couple/family accounts
   * @param {Object} context - Access context
   * @returns {boolean} Whether shared access is valid
   */
  validateSharedAccess(context) {
    if (!this.currentTenant.permissions.shared) {
      return false;
    }

    const sharedConfig = this.currentTenant.permissions.shared;
    
    // Check if accessing shared account
    if (context.accountId && sharedConfig.sharedAccounts.includes(context.accountId)) {
      return true;
    }

    // Check if accessing shared goal
    if (context.goalId && sharedConfig.sharedGoals.includes(context.goalId)) {
      return true;
    }

    // Check partner permissions
    if (context.partnerId === sharedConfig.partnerId) {
      return sharedConfig.permissions === 'full' || 
             (sharedConfig.permissions === 'view_only' && context.operation.startsWith('VIEW'));
    }

    return false;
  }

  /**
   * Create isolated data namespace for tenant
   * @param {string} dataType - Type of data being stored
   * @returns {string} Namespaced key for data storage
   */
  createDataNamespace(dataType) {
    if (!this.currentTenant) {
      throw new Error('No active tenant context for data namespace creation');
    }

    return `${this.currentTenant.dataNamespace}_${dataType}`;
  }

  /**
   * Encrypt tenant data before storage
   * @param {any} data - Data to encrypt
   * @returns {Promise<Object>} Encrypted data object
   */
  async encryptTenantData(data) {
    if (!this.currentTenant) {
      throw new Error('No active tenant context for encryption');
    }

    const jsonData = JSON.stringify(data);
    const encodedData = new TextEncoder().encode(jsonData);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.currentTenant.encryptionKey,
      encodedData
    );

    return {
      data: Array.from(new Uint8Array(encryptedData)),
      iv: Array.from(iv),
      timestamp: new Date().toISOString(),
      tenantId: this.currentTenant.tenantId
    };
  }

  /**
   * Decrypt tenant data after retrieval
   * @param {Object} encryptedData - Encrypted data object
   * @returns {Promise<any>} Decrypted data
   */
  async decryptTenantData(encryptedData) {
    if (!this.currentTenant) {
      throw new Error('No active tenant context for decryption');
    }

    // Verify tenant ownership
    if (encryptedData.tenantId !== this.currentTenant.tenantId) {
      throw new Error('Data does not belong to current tenant');
    }

    const encryptedArray = new Uint8Array(encryptedData.data);
    const iv = new Uint8Array(encryptedData.iv);

    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.currentTenant.encryptionKey,
      encryptedArray
    );

    const jsonString = new TextDecoder().decode(decryptedData);
    return JSON.parse(jsonString);
  }

  /**
   * Clean up tenant context and data
   * @param {string} tenantId - Tenant ID to clean up
   */
  async cleanupTenant(tenantId) {
    try {
      // Audit cleanup
      await this.auditLog('TENANT_CLEANUP', { tenantId });

      // Remove from active contexts
      this.dataContexts.delete(tenantId);
      this.accessControlList.delete(tenantId);

      // Clear current tenant if it matches
      if (this.currentTenant && this.currentTenant.tenantId === tenantId) {
        this.currentTenant = null;
      }

      return true;
    } catch (error) {
      await this.auditLog('TENANT_CLEANUP_FAILED', {
        tenantId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get tenant information (safe subset)
   * @returns {Object} Safe tenant information
   */
  getTenantInfo() {
    if (!this.currentTenant) {
      return null;
    }

    return {
      tenantId: this.currentTenant.tenantId,
      userId: this.currentTenant.userId,
      userType: this.currentTenant.userType,
      dataNamespace: this.currentTenant.dataNamespace,
      permissions: this.currentTenant.permissions,
      sessionId: this.currentTenant.sessionId,
      lastAccessAt: this.currentTenant.lastAccessAt
    };
  }

  /**
   * Audit log helper
   * @param {string} action - Action being logged
   * @param {Object} details - Additional details
   */
  async auditLog(action, details) {
    if (this.auditLogger) {
      await this.auditLogger.log({
        action,
        timestamp: new Date().toISOString(),
        tenantId: details.tenantId || this.currentTenant?.tenantId,
        userId: details.userId || this.currentTenant?.userId,
        sessionId: details.sessionId || this.currentTenant?.sessionId,
        details,
        severity: this.getActionSeverity(action)
      });
    }
  }

  /**
   * Get severity level for audit action
   * @param {string} action - Action name
   * @returns {string} Severity level
   */
  getActionSeverity(action) {
    const criticalActions = [
      'ACCESS_DENIED', 
      'TENANT_INIT_FAILED', 
      'TENANT_CLEANUP_FAILED',
      'ACCESS_ERROR'
    ];
    
    const warningActions = [
      'TENANT_CLEANUP',
      'SHARED_ACCESS_DENIED'
    ];

    if (criticalActions.includes(action)) return 'critical';
    if (warningActions.includes(action)) return 'warning';
    return 'info';
  }

  /**
   * Set dependencies (to be called during app initialization)
   * @param {Object} dependencies - Required services
   */
  setDependencies(dependencies) {
    this.auditLogger = dependencies.auditLogger;
    this.encryptionService = dependencies.encryptionService;
  }

  /**
   * Validate tenant session
   * @returns {boolean} Whether current session is valid
   */
  validateSession() {
    if (!this.currentTenant) {
      return false;
    }

    const sessionAge = Date.now() - new Date(this.currentTenant.createdAt).getTime();
    if (sessionAge > this.securityConfig.sessionTimeout) {
      this.cleanupTenant(this.currentTenant.tenantId);
      return false;
    }

    return true;
  }
}

// Export singleton instance
const tenantIsolationManager = new TenantIsolationManager();
export default tenantIsolationManager;