/**
 * SmartFinanceAI - API Endpoint Definitions
 * Global SaaS Platform with Multi-Tenant Architecture
 * 
 * Features:
 * - RESTful API endpoint definitions for all platform operations
 * - Multi-tenant routing with user isolation
 * - Country-specific endpoint configurations
 * - Rate limiting and security headers
 * - Comprehensive error handling and retry logic
 * - Real-time websocket endpoints for live updates
 */

// Base API configuration
const API_CONFIG = {
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://api.smartfinanceai.com' 
    : 'http://localhost:3001',
  VERSION: 'v1',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1 second
};

// WebSocket configuration for real-time features
const WS_CONFIG = {
  BASE_URL: process.env.NODE_ENV === 'production'
    ? 'wss://ws.smartfinanceai.com'
    : 'ws://localhost:3002',
  RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 2000
};

class APIEndpoints {
  constructor() {
    this.baseUrl = `${API_CONFIG.BASE_URL}/api/${API_CONFIG.VERSION}`;
    this.wsUrl = WS_CONFIG.BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Client-Version': '1.0.0',
      'X-Platform': 'web'
    };
  }

  // ==========================================
  // AUTHENTICATION ENDPOINTS
  // ==========================================

  auth = {
    // User authentication
    login: () => ({
      url: `${this.baseUrl}/auth/login`,
      method: 'POST'
    }),
    
    logout: () => ({
      url: `${this.baseUrl}/auth/logout`, 
      method: 'POST'
    }),
    
    register: () => ({
      url: `${this.baseUrl}/auth/register`,
      method: 'POST'
    }),
    
    // Token management
    refresh: () => ({
      url: `${this.baseUrl}/auth/refresh`,
      method: 'POST'
    }),
    
    verify: (token) => ({
      url: `${this.baseUrl}/auth/verify/${token}`,
      method: 'GET'
    }),
    
    // Password management
    forgotPassword: () => ({
      url: `${this.baseUrl}/auth/forgot-password`,
      method: 'POST'
    }),
    
    resetPassword: (token) => ({
      url: `${this.baseUrl}/auth/reset-password/${token}`,
      method: 'POST'
    }),
    
    changePassword: () => ({
      url: `${this.baseUrl}/auth/change-password`,
      method: 'PUT'
    }),
    
    // Biometric authentication (WebAuthn)
    webauthn: {
      registerBegin: () => ({
        url: `${this.baseUrl}/auth/webauthn/register/begin`,
        method: 'POST'
      }),
      
      registerComplete: () => ({
        url: `${this.baseUrl}/auth/webauthn/register/complete`,
        method: 'POST'
      }),
      
      loginBegin: () => ({
        url: `${this.baseUrl}/auth/webauthn/login/begin`,
        method: 'POST'
      }),
      
      loginComplete: () => ({
        url: `${this.baseUrl}/auth/webauthn/login/complete`,
        method: 'POST'
      })
    },
    
    // Multi-factor authentication
    mfa: {
      setup: () => ({
        url: `${this.baseUrl}/auth/mfa/setup`,
        method: 'POST'
      }),
      
      verify: () => ({
        url: `${this.baseUrl}/auth/mfa/verify`,
        method: 'POST'
      }),
      
      disable: () => ({
        url: `${this.baseUrl}/auth/mfa/disable`,
        method: 'DELETE'
      })
    }
  };

  // ==========================================
  // USER MANAGEMENT ENDPOINTS
  // ==========================================

  users = {
    // User profile
    getProfile: () => ({
      url: `${this.baseUrl}/users/profile`,
      method: 'GET'
    }),
    
    updateProfile: () => ({
      url: `${this.baseUrl}/users/profile`,
      method: 'PUT'
    }),
    
    deleteAccount: () => ({
      url: `${this.baseUrl}/users/profile`,
      method: 'DELETE'
    }),
    
    // User preferences
    getPreferences: () => ({
      url: `${this.baseUrl}/users/preferences`,
      method: 'GET'
    }),
    
    updatePreferences: () => ({
      url: `${this.baseUrl}/users/preferences`,
      method: 'PUT'
    }),
    
    // Avatar management
    uploadAvatar: () => ({
      url: `${this.baseUrl}/users/avatar`,
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    
    deleteAvatar: () => ({
      url: `${this.baseUrl}/users/avatar`,
      method: 'DELETE'
    }),
    
    // Family/couples management
    family: {
      getMembers: () => ({
        url: `${this.baseUrl}/users/family/members`,
        method: 'GET'
      }),
      
      invite: () => ({
        url: `${this.baseUrl}/users/family/invite`,
        method: 'POST'
      }),
      
      acceptInvite: (token) => ({
        url: `${this.baseUrl}/users/family/invite/${token}/accept`,
        method: 'POST'
      }),
      
      removeMember: (memberId) => ({
        url: `${this.baseUrl}/users/family/members/${memberId}`,
        method: 'DELETE'
      }),
      
      updatePermissions: (memberId) => ({
        url: `${this.baseUrl}/users/family/members/${memberId}/permissions`,
        method: 'PUT'
      })
    }
  };

  // ==========================================
  // SUBSCRIPTION & BILLING ENDPOINTS
  // ==========================================

  subscriptions = {
    // Subscription management
    getCurrent: () => ({
      url: `${this.baseUrl}/subscriptions/current`,
      method: 'GET'
    }),
    
    upgrade: () => ({
      url: `${this.baseUrl}/subscriptions/upgrade`,
      method: 'POST'
    }),
    
    downgrade: () => ({
      url: `${this.baseUrl}/subscriptions/downgrade`,
      method: 'POST'
    }),
    
    cancel: () => ({
      url: `${this.baseUrl}/subscriptions/cancel`,
      method: 'POST'
    }),
    
    // Billing
    getBillingHistory: () => ({
      url: `${this.baseUrl}/subscriptions/billing/history`,
      method: 'GET'
    }),
    
    updatePaymentMethod: () => ({
      url: `${this.baseUrl}/subscriptions/billing/payment-method`,
      method: 'PUT'
    }),
    
    // Usage tracking
    getUsage: () => ({
      url: `${this.baseUrl}/subscriptions/usage`,
      method: 'GET'
    })
  };

  // ==========================================
  // ACCOUNT MANAGEMENT ENDPOINTS  
  // ==========================================

  accounts = {
    // Account CRUD operations
    getAll: () => ({
      url: `${this.baseUrl}/accounts`,
      method: 'GET'
    }),
    
    getById: (accountId) => ({
      url: `${this.baseUrl}/accounts/${accountId}`,
      method: 'GET'
    }),
    
    create: () => ({
      url: `${this.baseUrl}/accounts`,
      method: 'POST'
    }),
    
    update: (accountId) => ({
      url: `${this.baseUrl}/accounts/${accountId}`,
      method: 'PUT'
    }),
    
    delete: (accountId) => ({
      url: `${this.baseUrl}/accounts/${accountId}`,
      method: 'DELETE'
    }),
    
    // Account balance and history
    getBalance: (accountId) => ({
      url: `${this.baseUrl}/accounts/${accountId}/balance`,
      method: 'GET'
    }),
    
    getBalanceHistory: (accountId, period = '1Y') => ({
      url: `${this.baseUrl}/accounts/${accountId}/balance/history`,
      method: 'GET',
      params: { period }
    }),
    
    // Account linking (for bank connections)
    link: () => ({
      url: `${this.baseUrl}/accounts/link`,
      method: 'POST'
    }),
    
    unlink: (accountId) => ({
      url: `${this.baseUrl}/accounts/${accountId}/unlink`,
      method: 'POST'
    }),
    
    // Sync accounts with bank
    sync: (accountId) => ({
      url: `${this.baseUrl}/accounts/${accountId}/sync`,
      method: 'POST'
    }),
    
    syncAll: () => ({
      url: `${this.baseUrl}/accounts/sync-all`,
      method: 'POST'
    })
  };

  // ==========================================
  // TRANSACTION ENDPOINTS
  // ==========================================

  transactions = {
    // Transaction CRUD
    getAll: (params = {}) => ({
      url: `${this.baseUrl}/transactions`,
      method: 'GET',
      params
    }),
    
    getById: (transactionId) => ({
      url: `${this.baseUrl}/transactions/${transactionId}`,
      method: 'GET'
    }),
    
    create: () => ({
      url: `${this.baseUrl}/transactions`,
      method: 'POST'
    }),
    
    update: (transactionId) => ({
      url: `${this.baseUrl}/transactions/${transactionId}`,
      method: 'PUT'
    }),
    
    delete: (transactionId) => ({
      url: `${this.baseUrl}/transactions/${transactionId}`,
      method: 'DELETE'
    }),
    
    // Bulk operations
    bulkCreate: () => ({
      url: `${this.baseUrl}/transactions/bulk`,
      method: 'POST'
    }),
    
    bulkUpdate: () => ({
      url: `${this.baseUrl}/transactions/bulk`,
      method: 'PUT'
    }),
    
    bulkDelete: () => ({
      url: `${this.baseUrl}/transactions/bulk`,
      method: 'DELETE'
    }),
    
    // CSV import
    uploadCsv: () => ({
      url: `${this.baseUrl}/transactions/import/csv`,
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    
    previewCsv: () => ({
      url: `${this.baseUrl}/transactions/import/csv/preview`,
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    
    // Categorization
    categorize: (transactionId) => ({
      url: `${this.baseUrl}/transactions/${transactionId}/categorize`,
      method: 'PUT'
    }),
    
    bulkCategorize: () => ({
      url: `${this.baseUrl}/transactions/categorize/bulk`,
      method: 'PUT'
    }),
    
    // Duplicate detection
    findDuplicates: () => ({
      url: `${this.baseUrl}/transactions/duplicates`,
      method: 'GET'
    }),
    
    mergeDuplicates: () => ({
      url: `${this.baseUrl}/transactions/duplicates/merge`,
      method: 'POST'
    }),
    
    // Search and filtering
    search: (query, filters = {}) => ({
      url: `${this.baseUrl}/transactions/search`,
      method: 'GET',
      params: { q: query, ...filters }
    }),
    
    // Analytics
    getSpendingByCategory: (period = '1M') => ({
      url: `${this.baseUrl}/transactions/analytics/spending-by-category`,
      method: 'GET',
      params: { period }
    }),
    
    getSpendingTrends: (period = '1Y') => ({
      url: `${this.baseUrl}/transactions/analytics/spending-trends`,
      method: 'GET',
      params: { period }
    })
  };

  // ==========================================
  // BUDGET ENDPOINTS
  // ==========================================

  budgets = {
    // Budget CRUD
    getAll: () => ({
      url: `${this.baseUrl}/budgets`,
      method: 'GET'
    }),
    
    getById: (budgetId) => ({
      url: `${this.baseUrl}/budgets/${budgetId}`,
      method: 'GET'
    }),
    
    create: () => ({
      url: `${this.baseUrl}/budgets`,
      method: 'POST'
    }),
    
    update: (budgetId) => ({
      url: `${this.baseUrl}/budgets/${budgetId}`,
      method: 'PUT'
    }),
    
    delete: (budgetId) => ({
      url: `${this.baseUrl}/budgets/${budgetId}`,
      method: 'DELETE'
    }),
    
    // Budget templates
    getTemplates: (country) => ({
      url: `${this.baseUrl}/budgets/templates`,
      method: 'GET',
      params: { country }
    }),
    
    createFromTemplate: (templateId) => ({
      url: `${this.baseUrl}/budgets/from-template/${templateId}`,
      method: 'POST'
    }),
    
    // Budget analysis
    getProgress: (budgetId, period = 'current') => ({
      url: `${this.baseUrl}/budgets/${budgetId}/progress`,
      method: 'GET',
      params: { period }
    }),
    
    getVariance: (budgetId) => ({
      url: `${this.baseUrl}/budgets/${budgetId}/variance`,
      method: 'GET'
    }),
    
    // Auto-budgeting
    generateFromHistory: (months = 3) => ({
      url: `${this.baseUrl}/budgets/generate`,
      method: 'POST',
      params: { months }
    }),
    
    optimize: (budgetId) => ({
      url: `${this.baseUrl}/budgets/${budgetId}/optimize`,
      method: 'POST'
    })
  };

  // ==========================================
  // GOALS ENDPOINTS
  // ==========================================

  goals = {
    // Goal CRUD
    getAll: () => ({
      url: `${this.baseUrl}/goals`,
      method: 'GET'
    }),
    
    getById: (goalId) => ({
      url: `${this.baseUrl}/goals/${goalId}`,
      method: 'GET'
    }),
    
    create: () => ({
      url: `${this.baseUrl}/goals`,
      method: 'POST'
    }),
    
    update: (goalId) => ({
      url: `${this.baseUrl}/goals/${goalId}`,
      method: 'PUT'
    }),
    
    delete: (goalId) => ({
      url: `${this.baseUrl}/goals/${goalId}`,
      method: 'DELETE'
    }),
    
    // Goal templates
    getTemplates: (country) => ({
      url: `${this.baseUrl}/goals/templates`,
      method: 'GET',
      params: { country }
    }),
    
    createFromTemplate: (templateId) => ({
      url: `${this.baseUrl}/goals/from-template/${templateId}`,
      method: 'POST'
    }),
    
    // Goal progress
    updateProgress: (goalId) => ({
      url: `${this.baseUrl}/goals/${goalId}/progress`,
      method: 'PUT'
    }),
    
    getProgress: (goalId) => ({
      url: `${this.baseUrl}/goals/${goalId}/progress`,
      method: 'GET'
    }),
    
    // Goal optimization
    optimize: (goalId) => ({
      url: `${this.baseUrl}/goals/${goalId}/optimize`,
      method: 'POST'
    }),
    
    calculateTimeline: (goalId) => ({
      url: `${this.baseUrl}/goals/${goalId}/timeline`,
      method: 'GET'
    })
  };

  // ==========================================
  // AI & ANALYTICS ENDPOINTS
  // ==========================================

  ai = {
    // Financial health scoring
    getHealthScore: () => ({
      url: `${this.baseUrl}/ai/health-score`,
      method: 'GET'
    }),
    
    // AI coaching
    getInsights: (period = '1M') => ({
      url: `${this.baseUrl}/ai/insights`,
      method: 'GET',
      params: { period }
    }),
    
    getRecommendations: () => ({
      url: `${this.baseUrl}/ai/recommendations`,
      method: 'GET'
    }),
    
    // Predictions
    predictCashFlow: (months = 6) => ({
      url: `${this.baseUrl}/ai/predictions/cash-flow`,
      method: 'GET',
      params: { months }
    }),
    
    predictExpenses: (category, months = 3) => ({
      url: `${this.baseUrl}/ai/predictions/expenses`,
      method: 'GET',
      params: { category, months }
    }),
    
    // Natural language queries
    query: () => ({
      url: `${this.baseUrl}/ai/query`,
      method: 'POST'
    }),
    
    // Anomaly detection
    detectAnomalies: (period = '3M') => ({
      url: `${this.baseUrl}/ai/anomalies`,
      method: 'GET',
      params: { period }
    })
  };

  // ==========================================
  // REPORTING ENDPOINTS
  // ==========================================

  reports = {
    // Financial reports
    getNetWorth: (period = '1Y') => ({
      url: `${this.baseUrl}/reports/net-worth`,
      method: 'GET',
      params: { period }
    }),
    
    getCashFlow: (period = '1Y') => ({
      url: `${this.baseUrl}/reports/cash-flow`,
      method: 'GET',
      params: { period }
    }),
    
    getIncomeExpense: (period = '1Y') => ({
      url: `${this.baseUrl}/reports/income-expense`,
      method: 'GET',
      params: { period }
    }),
    
    // Tax reports
    getTaxSummary: (taxYear) => ({
      url: `${this.baseUrl}/reports/tax-summary`,
      method: 'GET',
      params: { taxYear }
    }),
    
    // Export capabilities
    exportTransactions: (format = 'csv', filters = {}) => ({
      url: `${this.baseUrl}/reports/export/transactions`,
      method: 'GET',
      params: { format, ...filters }
    }),
    
    exportBudget: (budgetId, format = 'pdf') => ({
      url: `${this.baseUrl}/reports/export/budget/${budgetId}`,
      method: 'GET',
      params: { format }
    })
  };

  // ==========================================
  // SYSTEM & CONFIGURATION ENDPOINTS
  // ==========================================

  system = {
    // Health check
    health: () => ({
      url: `${this.baseUrl}/system/health`,
      method: 'GET'
    }),
    
    // Country configurations
    getCountries: () => ({
      url: `${this.baseUrl}/system/countries`,
      method: 'GET'
    }),
    
    getCountryConfig: (country) => ({
      url: `${this.baseUrl}/system/countries/${country}`,
      method: 'GET'