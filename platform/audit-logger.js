/**
 * SmartFinanceAI - Comprehensive Audit Logging System
 * 
 * Tracks all user actions and system events for security,
 * compliance, and debugging purposes.
 * 
 * Features:
 * - Complete user action tracking
 * - Security event monitoring
 * - Financial transaction auditing
 * - Privacy-compliant logging
 * - Real-time threat detection
 */

class AuditLogger {
  constructor() {
    this.logQueue = [];
    this.securityEvents = [];
    this.maxLogSize = 10000;
    this.maxSecurityEvents = 1000;
    this.batchSize = 50;
    this.flushInterval = 30000; // 30 seconds
    this.initialized = false;
    
    // Event categories
    this.eventCategories = {
      AUTH: 'authentication',
      FINANCIAL: 'financial_transaction',
      DATA: 'data_access',
      SECURITY: 'security_event',
      USER: 'user_action',
      SYSTEM: 'system_event',
      COMPLIANCE: 'compliance_check'
    };

    // Risk levels
    this.riskLevels = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
      CRITICAL: 4
    };

    this.initialize();
  }

  async initialize() {
    try {
      // Initialize IndexedDB for audit logs
      await this.initializeAuditDB();
      
      // Start periodic log flushing
      this.startPeriodicFlush();
      
      // Set up security monitoring
      this.initializeSecurityMonitoring();
      
      this.initialized = true;
      console.log('AuditLogger initialized successfully');
      
      // Log the initialization
      this.logEvent({
        category: this.eventCategories.SYSTEM,
        action: 'AUDIT_LOGGER_INITIALIZED',
        details: { timestamp: new Date().toISOString() }
      });
    } catch (error) {
      console.error('Failed to initialize AuditLogger:', error);
      throw error;
    }
  }

  /**
   * Initialize audit database
   * @private
   */
  async initializeAuditDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SmartFinanceAI_Audit', 1);

      request.onerror = () => {
        reject(new Error('Failed to initialize audit database'));
      };

      request.onsuccess = (event) => {
        this.auditDB = event.target.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create audit logs store
        if (!db.objectStoreNames.contains('audit_logs')) {
          const auditStore = db.createObjectStore('audit_logs', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          
          auditStore.createIndex('timestamp', 'timestamp', { unique: false });
          auditStore.createIndex('category', 'category', { unique: false });
          auditStore.createIndex('tenant_id', 'tenantId', { unique: false });
          auditStore.createIndex('risk_level', 'riskLevel', { unique: false });
          auditStore.createIndex('action', 'action', { unique: false });
        }

        // Create security events store
        if (!db.objectStoreNames.contains('security_events')) {
          const securityStore = db.createObjectStore('security_events', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          
          securityStore.createIndex('timestamp', 'timestamp', { unique: false });
          securityStore.createIndex('event_type', 'eventType', { unique: false });
          securityStore.createIndex('risk_level', 'riskLevel', { unique: false });
          securityStore.createIndex('tenant_id', 'tenantId', { unique: false });
        }
      };
    });
  }

  /**
   * Log user action or system event
   * @param {object} eventData - Event data to log
   */
  async logEvent(eventData) {
    try {
      if (!this.initialized) {
        console.warn('AuditLogger not initialized, queuing event');
        this.logQueue.push(eventData);
        return;
      }

      const auditEntry = this.createAuditEntry(eventData);
      
      // Add to queue for batch processing
      this.logQueue.push(auditEntry);
      
      // Check if immediate flush is needed for high-risk events
      if (auditEntry.riskLevel >= this.riskLevels.HIGH) {
        await this.flushLogs();
      }
      
      // Security event detection
      this.detectSecurityThreats(auditEntry);
      
    } catch (error) {
      console.error('Failed to log event:', error);
      // Don't throw error to avoid breaking main application flow
    }
  }

  /**
   * Create standardized audit entry
   * @private
   */
  createAuditEntry(eventData) {
    const baseEntry = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      tenantId: this.getCurrentTenantId(),
      sessionId: this.getSessionId(),
      userAgent: navigator.userAgent,
      ipAddress: this.getClientIP(),
      riskLevel: this.assessRiskLevel(eventData),
      ...eventData
    };

    // Sanitize sensitive data
    return this.sanitizeLogEntry(baseEntry);
  }

  /**
   * Log authentication events
   */
  async logAuthEvent(action, details = {}) {
    await this.logEvent({
      category: this.eventCategories.AUTH,
      action: action,
      details: {
        ...details,
        authMethod: details.authMethod || 'password',
        success: details.success !== false
      }
    });
  }

  /**
   * Log financial transaction events
   */
  async logFinancialEvent(action, details = {}) {
    // Remove sensitive financial amounts from logs
    const sanitizedDetails = {
      ...details,
      amount: details.amount ? this.maskAmount(details.amount) : undefined,
      balance: details.balance ? this.maskAmount(details.balance) : undefined,
      accountNumber: details.accountNumber ? this.maskAccountNumber(details.accountNumber) : undefined
    };

    await this.logEvent({
      category: this.eventCategories.FINANCIAL,
      action: action,
      details: sanitizedDetails
    });
  }

  /**
   * Log data access events
   */
  async logDataAccess(action, resource, details = {}) {
    await this.logEvent({
      category: this.eventCategories.DATA,
      action: action,
      resource: resource,
      details: {
        ...details,
        recordCount: details.recordCount || 1,
        queryType: details.queryType || 'READ'
      }
    });
  }

  /**
   * Log security events
   */
  async logSecurityEvent(eventType, details = {}) {
    const securityEvent = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      eventType: eventType,
      tenantId: this.getCurrentTenantId(),
      sessionId: this.getSessionId(),
      riskLevel: this.riskLevels.HIGH,
      details: details,
      userAgent: navigator.userAgent,
      ipAddress: this.getClientIP()
    };

    // Add to security events queue
    this.securityEvents.push(securityEvent);
    
    // Immediate processing for critical events
    if (this.isCriticalSecurityEvent(eventType)) {
      await this.processCriticalSecurityEvent(securityEvent);
    }

    // Also log as regular audit event
    await this.logEvent({
      category: this.eventCategories.SECURITY,
      action: eventType,
      details: details
    });
  }

  /**
   * Log user actions
   */
  async logUserAction(action, details = {}) {
    await this.logEvent({
      category: this.eventCategories.USER,
      action: action,
      details: {
        ...details,
        page: window.location.pathname,
        referrer: document.referrer
      }
    });
  }

  /**
   * Log compliance-related events
   */
  async logComplianceEvent(action, details = {}) {
    await this.logEvent({
      category: this.eventCategories.COMPLIANCE,
      action: action,
      details: {
        ...details,
        jurisdiction: details.jurisdiction || this.getJurisdiction(),
        regulatoryFramework: details.regulatoryFramework || 'GDPR'
      }
    });
  }

  /**
   * Assess risk level of an event
   * @private
   */
  assessRiskLevel(eventData) {
    const { category, action, details } = eventData;

    // Critical security events
    if (category === this.eventCategories.SECURITY) {
      return this.riskLevels.CRITICAL;
    }

    // Authentication failures
    if (category === this.eventCategories.AUTH && details?.success === false) {
      return this.riskLevels.HIGH;
    }

    // Large financial transactions
    if (category === this.eventCategories.FINANCIAL && details?.amount > 10000) {
      return this.riskLevels.MEDIUM;
    }

    // Data export/deletion
    if (category === this.eventCategories.DATA && 
        ['EXPORT', 'DELETE', 'BULK_OPERATION'].includes(action)) {
      return this.riskLevels.MEDIUM;
    }

    // Default to low risk
    return this.riskLevels.LOW;
  }

  /**
   * Detect security threats from audit events
   * @private
   */
  detectSecurityThreats(auditEntry) {
    const threats = [];

    // Multiple failed login attempts
    if (this.detectBruteForceAttempt(auditEntry)) {
      threats.push('BRUTE_FORCE_ATTACK');
    }

    // Unusual access patterns
    if (this.detectAnomalousAccess(auditEntry)) {
      threats.push('ANOMALOUS_ACCESS');
    }

    // Suspicious data access
    if (this.detectSuspiciousDataAccess(auditEntry)) {
      threats.push('SUSPICIOUS_DATA_ACCESS');
    }

    // Process detected threats
    threats.forEach(threat => {
      this.processThreatDetection(threat, auditEntry);
    });
  }

  /**
   * Detect brute force attack attempts
   * @private
   */
  detectBruteForceAttempt(auditEntry) {
    if (auditEntry.category !== this.eventCategories.AUTH || 
        auditEntry.details?.success !== false) {
      return false;
    }

    // Count failed attempts in last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentFailures = this.logQueue.filter(entry => 
      entry.category === this.eventCategories.AUTH &&
      entry.details?.success === false &&
      new Date(entry.timestamp) > fifteenMinutesAgo &&
      entry.tenantId === auditEntry.tenantId
    );

    return recentFailures.length >= 5; // 5 failures in 15 minutes
  }

  /**
   * Detect anomalous access patterns
   * @private
   */
  detectAnomalousAccess(auditEntry) {
    // Check for access from unusual locations or times
    const currentHour = new Date().getHours();
    const isUnusualTime = currentHour < 6 || currentHour > 22; // Outside 6 AM - 10 PM

    // Check for rapid sequential actions
    const lastMinute = new Date(Date.now() - 60 * 1000);
    const recentActions = this.logQueue.filter(entry =>
      new Date(entry.timestamp) > lastMinute &&
      entry.tenantId === auditEntry.tenantId
    );

    return isUnusualTime || recentActions.length > 30; // 30+ actions per minute
  }

  /**
   * Detect suspicious data access
   * @private
   */
  detectSuspiciousDataAccess(auditEntry) {
    if (auditEntry.category !== this.eventCategories.DATA) {
      return false;
    }

    // Large data exports
    if (auditEntry.action === 'EXPORT' && auditEntry.details?.recordCount > 1000) {
      return true;
    }

    // Bulk deletions
    if (auditEntry.action === 'DELETE' && auditEntry.details?.recordCount > 100) {
      return true;
    }

    return false;
  }

  /**
   * Process threat detection
   * @private
   */
  async processThreatDetection(threatType, auditEntry) {
    const threat = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      threatType: threatType,
      tenantId: auditEntry.tenantId,
      triggerEvent: auditEntry.id,
      riskScore: this.calculateThreatRiskScore(threatType),
      mitigationActions: this.getMitigationActions(threatType)
    };

    // Log security event
    await this.logSecurityEvent(`THREAT_DETECTED_${threatType}`, threat);

    // Take automatic mitigation actions
    await this.executeMitigationActions(threat);
  }

  /**
   * Calculate threat risk score
   * @private
   */
  calculateThreatRiskScore(threatType) {
    const scores = {
      'BRUTE_FORCE_ATTACK': 85,
      'ANOMALOUS_ACCESS': 70,
      'SUSPICIOUS_DATA_ACCESS': 80,
      'PRIVILEGE_ESCALATION': 95,
      'DATA_EXFILTRATION': 90
    };

    return scores[threatType] || 50;
  }

  /**
   * Get mitigation actions for threat type
   * @private
   */
  getMitigationActions(threatType) {
    const actions = {
      'BRUTE_FORCE_ATTACK': ['RATE_LIMIT', 'TEMP_LOCK_ACCOUNT'],
      'ANOMALOUS_ACCESS': ['REQUIRE_2FA', 'NOTIFY_USER'],
      'SUSPICIOUS_DATA_ACCESS': ['AUDIT_REVIEW', 'RESTRICT_EXPORT'],
      'PRIVILEGE_ESCALATION': ['IMMEDIATE_LOGOUT', 'ADMIN_ALERT'],
      'DATA_EXFILTRATION': ['BLOCK_ACCESS', 'EMERGENCY_ALERT']
    };

    return actions[threatType] || ['MONITOR'];
  }

  /**
   * Execute mitigation actions
   * @private
   */
  async executeMitigationActions(threat) {
    for (const action of threat.mitigationActions) {
      try {
        switch (action) {
          case 'RATE_LIMIT':
            await this.applyRateLimit(threat.tenantId);
            break;
          case 'TEMP_LOCK_ACCOUNT':
            await this.temporaryLockAccount(threat.tenantId);
            break;
          case 'REQUIRE_2FA':
            await this.requireTwoFactorAuth(threat.tenantId);
            break;
          case 'NOTIFY_USER':
            await this.notifyUserOfSuspiciousActivity(threat.tenantId);
            break;
          case 'IMMEDIATE_LOGOUT':
            await this.forceLogout(threat.tenantId);
            break;
          case 'ADMIN_ALERT':
            await this.sendAdminAlert(threat);
            break;
          default:
            console.log(`Mitigation action ${action} logged for manual review`);
        }

        await this.logEvent({
          category: this.eventCategories.SECURITY,
          action: `MITIGATION_${action}`,
          details: { threatId: threat.id, tenantId: threat.tenantId }
        });
      } catch (error) {
        console.error(`Failed to execute mitigation action ${action}:`, error);
      }
    }
  }

  /**
   * Flush logs to persistent storage
   */
  async flushLogs() {
    if (this.logQueue.length === 0 && this.securityEvents.length === 0) {
      return;
    }

    try {
      const transaction = this.auditDB.transaction(['audit_logs', 'security_events'], 'readwrite');
      
      // Store audit logs
      const auditStore = transaction.objectStore('audit_logs');
      for (const logEntry of this.logQueue) {
        await this.addToStore(auditStore, logEntry);
      }

      // Store security events
      const securityStore = transaction.objectStore('security_events');
      for (const securityEvent of this.securityEvents) {
        await this.addToStore(securityStore, securityEvent);
      }

      // Clear queues after successful storage
      this.logQueue = [];
      this.securityEvents = [];

      // Clean up old logs if needed
      await this.cleanupOldLogs();

    } catch (error) {
      console.error('Failed to flush logs:', error);
      // Keep logs in queue for retry
    }
  }

  /**
   * Add entry to IndexedDB store
   * @private
   */
  addToStore(store, data) {
    return new Promise((resolve, reject) => {
      const request = store.add(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clean up old logs to maintain storage limits
   * @private
   */
  async cleanupOldLogs() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const transaction = this.auditDB.transaction(['audit_logs', 'security_events'], 'readwrite');
      
      // Clean audit logs
      const auditStore = transaction.objectStore('audit_logs');
      const auditIndex = auditStore.index('timestamp');
      const auditRange = IDBKeyRange.upperBound(thirtyDaysAgo.toISOString());
      
      auditIndex.openCursor(auditRange).onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      // Clean security events (keep for 90 days)
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const securityStore = transaction.objectStore('security_events');
      const securityIndex = securityStore.index('timestamp');
      const securityRange = IDBKeyRange.upperBound(ninetyDaysAgo.toISOString());
      
      securityIndex.openCursor(securityRange).onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }

  /**
   * Start periodic log flushing
   * @private
   */
  startPeriodicFlush() {
    setInterval(() => {
      this.flushLogs();
    }, this.flushInterval);
  }

  /**
   * Initialize security monitoring
   * @private
   */
  initializeSecurityMonitoring() {
    // Monitor for page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.logUserAction('PAGE_VISIBILITY_CHANGE', {
        hidden: document.hidden
      });
    });

    // Monitor for navigation events
    window.addEventListener('beforeunload', () => {
      this.logUserAction('PAGE_UNLOAD', {
        page: window.location.pathname
      });
    });

    // Monitor for console access (potential debug attempts)
    const originalConsole = window.console;
    window.console = new Proxy(originalConsole, {
      get: (target, prop) => {
        if (typeof target[prop] === 'function') {
          return (...args) => {
            this.logSecurityEvent('CONSOLE_ACCESS', {
              method: prop,
              argsCount: args.length
            });
            return target[prop].apply(target, args);
          };
        }
        return target[prop];
      }
    });
  }

  /**
   * Utility methods
   */
  generateEventId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getCurrentTenantId() {
    // Get from tenant isolation service
    return window.currentTenantId || sessionStorage.getItem('tenantId') || 'unknown';
  }

  getSessionId() {
    return sessionStorage.getItem('sessionId') || 'unknown';
  }

  getClientIP() {
    // In production, this would be provided by your backend
    return 'client-ip-masked';
  }

  getJurisdiction() {
    // Determine based on user location or account settings
    return navigator.language.includes('US') ? 'US' : 'EU';
  }

  sanitizeLogEntry(entry) {
    // Remove or mask sensitive data
    const sanitized = { ...entry };
    
    if (sanitized.details) {
      delete sanitized.details.password;
      delete sanitized.details.token;
      delete sanitized.details.creditCard;
      delete sanitized.details.ssn;
    }

    return sanitized;
  }

  maskAmount(amount) {
    if (typeof amount !== 'number') return 'MASKED';
    // Only show magnitude range for audit purposes
    if (amount < 100) return 'SMALL';
    if (amount < 1000) return 'MEDIUM';
    if (amount < 10000) return 'LARGE';
    return 'VERY_LARGE';
  }

  maskAccountNumber(accountNumber) {
    if (!accountNumber) return 'MASKED';
    return `****${accountNumber.toString().slice(-4)}`;
  }

  isCriticalSecurityEvent(eventType) {
    const criticalEvents = [
      'PRIVILEGE_ESCALATION',
      'DATA_EXFILTRATION',
      'UNAUTHORIZED_ACCESS',
      'SYSTEM_COMPROMISE'
    ];
    return criticalEvents.includes(eventType);
  }

  async processCriticalSecurityEvent(event) {
    // Immediate notification to security team
    console.error('CRITICAL SECURITY EVENT:', event);
    
    // In production, send to security monitoring service
    try {
      await fetch('/api/security/critical-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.error('Failed to send critical security event:', error);
    }
  }

  // Mitigation action implementations (stubs for demo)
  async applyRateLimit(tenantId) {
    console.log(`Applying rate limit for tenant: ${tenantId}`);
  }

  async temporaryLockAccount(tenantId) {
    console.log(`Temporarily locking account for tenant: ${tenantId}`);
  }

  async requireTwoFactorAuth(tenantId) {
    console.log(`Requiring 2FA for tenant: ${tenantId}`);
  }

  async notifyUserOfSuspiciousActivity(tenantId) {
    console.log(`Notifying user of suspicious activity: ${tenantId}`);
  }

  async forceLogout(tenantId) {
    console.log(`Forcing logout for tenant: ${tenantId}`);
  }

  async sendAdminAlert(threat) {
    console.log('Sending admin alert:', threat);
  }

  /**
   * Get audit logs for a tenant
   */
  async getAuditLogs(tenantId, filters = {}) {
    return new Promise((resolve, reject) => {
      const transaction = this.auditDB.transaction(['audit_logs'], 'readonly');
      const store = transaction.objectStore('audit_logs');
      const index = store.index('tenant_id');
      
      const request = index.getAll(tenantId);
      
      request.onsuccess = () => {
        let logs = request.result;
        
        // Apply filters
        if (filters.category) {
          logs = logs.filter(log => log.category === filters.category);
        }
        if (filters.startDate) {
          logs = logs.filter(log => new Date(log.timestamp) >= filters.startDate);
        }
        if (filters.endDate) {
          logs = logs.filter(log => new Date(log.timestamp) <= filters.endDate);
        }
        
        resolve(logs);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Health check for audit system