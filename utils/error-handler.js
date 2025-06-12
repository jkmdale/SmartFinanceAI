/**
 * 🚨 SmartFinanceAI - Global Error Handler
 * Comprehensive error handling and reporting system
 * Part of: src/utils/error-handler.js
 */

class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 100;
    this.isProduction = process.env.NODE_ENV === 'production';
    this.userId = null;
    this.sessionId = this.generateSessionId();
    this.errorCounts = new Map();
    this.lastErrors = new Map();
    this.suppressedErrors = new Set();
    
    // Error severity levels
    this.SEVERITY = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };
    
    // Error categories
    this.CATEGORIES = {
      NETWORK: 'network',
      AUTHENTICATION: 'authentication',
      VALIDATION: 'validation',
      SECURITY: 'security',
      FINANCIAL: 'financial',
      UI: 'ui',
      PERFORMANCE: 'performance',
      BROWSER: 'browser',
      UNKNOWN: 'unknown'
    };
    
    this.init();
  }

  /**
   * Initialize error handling
   */
  init() {
    this.setupGlobalErrorHandlers();
    this.setupUnhandledRejectionHandler();
    this.setupConsoleErrorCapture();
    
    console.log('🚨 Global error handler initialized');
  }

  /**
   * Generate unique session ID
   * @returns {string} Session ID
   */
  generateSessionId() {
    return 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  /**
   * Setup global error handlers
   */
  setupGlobalErrorHandlers() {
    // Global JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        type: 'javascript',
        source: 'window.error'
      });
    });

    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.handleResourceError(event);
      }
    }, true);

    // CSS and other resource errors
    document.addEventListener('DOMContentLoaded', () => {
      // Monitor image loading errors
      document.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', (event) => {
          this.handleResourceError(event, 'image');
        });
      });

      // Monitor script loading errors
      document.querySelectorAll('script').forEach(script => {
        script.addEventListener('error', (event) => {
          this.handleResourceError(event, 'script');
        });
      });

      // Monitor link/CSS loading errors
      document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        link.addEventListener('error', (event) => {
          this.handleResourceError(event, 'stylesheet');
        });
      });
    });
  }

  /**
   * Setup unhandled promise rejection handler
   */
  setupUnhandledRejectionHandler() {
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        message: event.reason?.message || 'Unhandled Promise Rejection',
        error: event.reason,
        type: 'promise',
        source: 'unhandledrejection',
        promise: true
      });
    });
  }

  /**
   * Setup console error capture
   */
  setupConsoleErrorCapture() {
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args) => {
      this.handleConsoleError('error', args);
      originalError.apply(console, args);
    };
    
    console.warn = (...args) => {
      this.handleConsoleError('warn', args);
      originalWarn.apply(console, args);
    };
  }

  /**
   * Handle console errors and warnings
   * @param {string} level - Error level
   * @param {Array} args - Console arguments
   */
  handleConsoleError(level, args) {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    this.handleError({
      message,
      type: 'console',
      level,
      source: `console.${level}`,
      args
    });
  }

  /**
   * Handle resource loading errors
   * @param {Event} event - Error event
   * @param {string} resourceType - Type of resource
   */
  handleResourceError(event, resourceType = 'unknown') {
    const target = event.target;
    const src = target.src || target.href || 'unknown';
    
    this.handleError({
      message: `Failed to load ${resourceType}: ${src}`,
      filename: src,
      type: 'resource',
      resourceType,
      source: 'resource.error',
      category: this.CATEGORIES.NETWORK,
      severity: this.SEVERITY.MEDIUM
    });
  }

  /**
   * Main error handling method
   * @param {Object} errorInfo - Error information
   */
  handleError(errorInfo) {
    try {
      const processedError = this.processError(errorInfo);
      
      // Check if this error should be suppressed
      if (this.shouldSuppressError(processedError)) {
        return;
      }
      
      // Rate limiting - don't log the same error too frequently
      if (this.isRateLimited(processedError)) {
        return;
      }
      
      // Store error
      this.storeError(processedError);
      
      // Handle based on severity
      this.handleBySeverity(processedError);
      
      // Report error if necessary
      this.reportError(processedError);
      
    } catch (handlerError) {
      // Fallback logging if error handler itself fails
      console.error('Error handler failed:', handlerError);
      console.error('Original error:', errorInfo);
    }
  }

  /**
   * Process and enrich error information
   * @param {Object} errorInfo - Raw error information
   * @returns {Object} Processed error
   */
  processError(errorInfo) {
    const error = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      
      // Error details
      message: errorInfo.message || 'Unknown error',
      stack: errorInfo.error?.stack || errorInfo.stack || null,
      filename: errorInfo.filename || null,
      lineno: errorInfo.lineno || null,
      colno: errorInfo.colno || null,
      
      // Error classification
      type: errorInfo.type || 'unknown',
      category: errorInfo.category || this.categorizeError(errorInfo),
      severity: errorInfo.severity || this.calculateSeverity(errorInfo),
      
      // Context
      source: errorInfo.source || 'unknown',
      context: this.gatherContext(errorInfo),
      
      // Additional data
      ...errorInfo
    };
    
    return error;
  }

  /**
   * Generate unique error ID
   * @returns {string} Error ID
   */
  generateErrorId() {
    return 'err_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  /**
   * Categorize error based on content
   * @param {Object} errorInfo - Error information
   * @returns {string} Error category
   */
  categorizeError(errorInfo) {
    const message = (errorInfo.message || '').toLowerCase();
    const filename = (errorInfo.filename || '').toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || 
        message.includes('connection') || filename.includes('api')) {
      return this.CATEGORIES.NETWORK;
    }
    
    if (message.includes('unauthorized') || message.includes('forbidden') || 
        message.includes('authentication') || message.includes('token')) {
      return this.CATEGORIES.AUTHENTICATION;
    }
    
    if (message.includes('validation') || message.includes('invalid') || 
        message.includes('required') || message.includes('format')) {
      return this.CATEGORIES.VALIDATION;
    }
    
    if (message.includes('financial') || message.includes('transaction') || 
        message.includes('account') || message.includes('balance')) {
      return this.CATEGORIES.FINANCIAL;
    }
    
    if (message.includes('security') || message.includes('xss') || 
        message.includes('csrf') || message.includes('injection')) {
      return this.CATEGORIES.SECURITY;
    }
    
    if (message.includes('dom') || message.includes('element') || 
        message.includes('render') || errorInfo.type === 'ui') {
      return this.CATEGORIES.UI;
    }
    
    if (message.includes('performance') || message.includes('memory') || 
        message.includes('timeout') || errorInfo.type === 'performance') {
      return this.CATEGORIES.PERFORMANCE;
    }
    
    if (message.includes('browser') || message.includes('compatibility') || 
        errorInfo.type === 'browser') {
      return this.CATEGORIES.BROWSER;
    }
    
    return this.CATEGORIES.UNKNOWN;
  }

  /**
   * Calculate error severity
   * @param {Object} errorInfo - Error information
   * @returns {string} Severity level
   */
  calculateSeverity(errorInfo) {
    const message = (errorInfo.message || '').toLowerCase();
    const category = errorInfo.category || this.categorizeError(errorInfo);
    
    // Critical errors
    if (category === this.CATEGORIES.SECURITY ||
        message.includes('critical') ||
        message.includes('fatal') ||
        message.includes('crash')) {
      return this.SEVERITY.CRITICAL;
    }
    
    // High severity errors
    if (category === this.CATEGORIES.FINANCIAL ||
        category === this.CATEGORIES.AUTHENTICATION ||
        message.includes('error') ||
        errorInfo.type === 'javascript') {
      return this.SEVERITY.HIGH;
    }
    
    // Medium severity errors
    if (category === this.CATEGORIES.NETWORK ||
        category === this.CATEGORIES.VALIDATION ||
        errorInfo.type === 'resource') {
      return this.SEVERITY.MEDIUM;
    }
    
    // Low severity (warnings, etc.)
    return this.SEVERITY.LOW;
  }

  /**
   * Gather contextual information
   * @param {Object} errorInfo - Error information
   * @returns {Object} Context information
   */
  gatherContext(errorInfo) {
    const context = {
      timestamp: Date.now(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : null,
      memory: performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      } : null,
      storage: {
        localStorage: this.getStorageSize('localStorage'),
        sessionStorage: this.getStorageSize('sessionStorage')
      }
    };
    
    // Add financial context if relevant
    if (errorInfo.category === this.CATEGORIES.FINANCIAL) {
      context.financial = {
        hasUserData: !!localStorage.getItem('user_data'),
        accountCount: this.getAccountCount(),
        transactionCount: this.getTransactionCount()
      };
    }
    
    return context;
  }

  /**
   * Get storage size
   * @param {string} storageType - Type of storage
   * @returns {number} Size in KB
   */
  getStorageSize(storageType) {
    try {
      const storage = window[storageType];
      let total = 0;
      for (let key in storage) {
        if (storage.hasOwnProperty(key)) {
          total += storage[key].length + key.length;
        }
      }
      return Math.round(total / 1024);
    } catch (e) {
      return 0;
    }
  }

  /**
   * Get account count from storage
   * @returns {number} Account count
   */
  getAccountCount() {
    try {
      const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
      return Array.isArray(accounts) ? accounts.length : 0;
    } catch (e) {
      return 0;
    }
  }

  /**
   * Get transaction count from storage
   * @returns {number} Transaction count
   */
  getTransactionCount() {
    try {
      const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
      return Array.isArray(transactions) ? transactions.length : 0;
    } catch (e) {
      return 0;
    }
  }

  /**
   * Check if error should be suppressed
   * @param {Object} error - Processed error