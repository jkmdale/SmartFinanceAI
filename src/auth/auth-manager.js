/**
 * SmartFinanceAI - Authentication Manager
 * Handles user authentication, session management, and security
 * File: src/auth/auth-manager.js (REPLACEMENT)
 */

class AuthManager {
  constructor() {
    this.baseUrl = window.location.origin;
    this.sessionKey = 'smartfinance_session';
    this.refreshKey = 'smartfinance_refresh';
    this.deviceKey = 'smartfinance_device';
    
    this.currentUser = null;
    this.sessionTimer = null;
    this.refreshTimer = null;
    
    // WebAuthn support detection
    this.supportsWebAuthn = !!(navigator.credentials && navigator.credentials.create);
    
    // Session configuration
    this.config = {
      sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
      refreshDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
      autoRefreshMinutes: 30, // Auto-refresh 30 minutes before expiry
      maxLoginAttempts: 3,
      lockoutDuration: 15 * 60 * 1000 // 15 minutes
    };

    // Initialize on construction
    this.initialize();
  }

  /**
   * Initialize authentication system
   */
  async initialize() {
    try {
      // Check for existing session
      await this.checkExistingSession();
      
      // Set up auto-refresh timer
      this.setupAutoRefresh();
      
      // Listen for storage changes (multi-tab support)
      window.addEventListener('storage', this.handleStorageChange.bind(this));
      
      // Listen for visibility changes
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
      
      console.log('✅ AuthManager initialized');
      
    } catch (error) {
      console.error('❌ AuthManager initialization failed:', error);
    }
  }

  /**
   * USER REGISTRATION
   */

  /**
   * Register new user
   */
  async register(userData) {
    try {
      this.validateRegistrationData(userData);

      // Generate device ID
      const deviceId = this.generateDeviceId();
      
      // Create user account
      const user = {
        id: this.generateUserId(),
        email: userData.email.toLowerCase().trim(),
        firstName: userData.firstName.trim(),
        lastName: userData.lastName.trim(),
        country: userData.country || 'US',
        currency: userData.currency || 'USD',
        passwordHash: await this.hashPassword(userData.password),
        emailVerified: false,
        mfaEnabled: false,
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
        devices: [{
          id: deviceId,
          name: this.getDeviceName(),
          type: this.getDeviceType(),
          registeredAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString(),
          isTrusted: true
        }],
        settings: {
          theme: 'auto',
          language: 'en',
          privacyMode: false,
          notifications: {
            email: true,
            push: true,
            lowBalance: true,
            goalReminders: true,
            weeklyInsights: true
          }
        }
      };

      // Store user (in production, this would call API)
      await this.storeUser(user);

      // Create session
      const session = await this.createSession(user, deviceId);

      // Set up WebAuthn if supported
      if (this.supportsWebAuthn && userData.enableBiometrics) {
        try {
          await this.setupWebAuthn(user);
        } catch (error) {
          console.warn('WebAuthn setup failed:', error);
          // Continue with registration even if WebAuthn fails
        }
      }

      return {
        success: true,
        user: this.sanitizeUser(user),
        session: session,
        message: 'Account created successfully!'
      };

    } catch (error) {
      console.error('Registration failed:', error);
      return {
        success: false,
        error: error.message,
        message: 'Registration failed. Please try again.'
      };
    }
  }

  /**
   * Validate registration data
   */
  validateRegistrationData(data) {
    const errors = [];

    // Email validation
    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push('Valid email address is required');
    }

    // Password validation
    if (!data.password || data.password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!this.isStrongPassword(data.password)) {
      errors.push('Password must contain uppercase, lowercase, number, and special character');
    }

    // Name validation
    if (!data.firstName || data.firstName.trim().length === 0) {
      errors.push('First name is required');
    }

    if (!data.lastName || data.lastName.trim().length === 0) {
      errors.push('Last name is required');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }

  /**
   * USER LOGIN
   */

  /**
   * Login with email and password
   */
  async login(email, password, rememberMe = false) {
    try {
      // Check for rate limiting
      this.checkRateLimit(email);

      // Find user
      const user = await this.findUserByEmail(email);
      if (!user) {
        this.recordFailedAttempt(email);
        throw new Error('Invalid email or password');
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        this.recordFailedAttempt(email);
        throw new Error('Invalid email or password');
      }

      // Clear failed attempts
      this.clearFailedAttempts(email);

      // Check if device is trusted
      const deviceId = this.getStoredDeviceId() || this.generateDeviceId();
      const isTrustedDevice = user.devices.some(device => device.id === deviceId);

      // Update device info
      await this.updateDeviceInfo(user.id, deviceId);

      // Create session
      const sessionDuration = rememberMe ? this.config.refreshDuration : this.config.sessionDuration;
      const session = await this.createSession(user, deviceId, sessionDuration);

      // Update last login
      await this.updateLastLogin(user.id);

      return {
        success: true,
        user: this.sanitizeUser(user),
        session: session,
        requiresMFA: user.mfaEnabled && !isTrustedDevice,
        message: 'Login successful!'
      };

    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        error: error.message,
        message: 'Login failed. Please check your credentials.'
      };
    }
  }

  /**
   * Login with WebAuthn (biometric)
   */
  async loginWithWebAuthn() {
    try {
      if (!this.supportsWebAuthn) {
        throw new Error('WebAuthn not supported on this device');
      }

      // Get stored credentials
      const storedCredentials = this.getStoredCredentials();
      if (!storedCredentials || storedCredentials.length === 0) {
        throw new Error('No biometric credentials found. Please set up biometric authentication first.');
      }

      // Create authentication challenge
      const challenge = this.generateChallenge();
      
      // Request authentication
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new TextEncoder().encode(challenge),
          allowCredentials: storedCredentials.map(cred => ({
            id: this.base64ToArrayBuffer(cred.id),
            type: 'public-key',
            transports: ['internal', 'usb', 'nfc', 'ble']
          })),
          timeout: 60000,
          userVerification: 'preferred'
        }
      });

      // Verify credential (in production, verify on server)
      const user = await this.verifyWebAuthnCredential(credential);
      if (!user) {
        throw new Error('Biometric authentication failed');
      }

      // Create session
      const deviceId = this.getStoredDeviceId() || this.generateDeviceId();
      const session = await this.createSession(user, deviceId);

      return {
        success: true,
        user: this.sanitizeUser(user),
        session: session,
        message: 'Biometric login successful!'
      };

    } catch (error) {
      console.error('WebAuthn login failed:', error);
      return {
        success: false,
        error: error.message,
        message: 'Biometric login failed. Please try again or use password.'
      };
    }
  }

  /**
   * SESSION MANAGEMENT
   */

  /**
   * Create user session
   */
  async createSession(user, deviceId, duration = null) {
    const sessionDuration = duration || this.config.sessionDuration;
    const refreshDuration = this.config.refreshDuration;

    const session = {
      userId: user.id,
      deviceId: deviceId,
      sessionId: this.generateSessionId(),
      accessToken: this.generateToken(),
      refreshToken: this.generateToken(),
      issuedAt: Date.now(),
      expiresAt: Date.now() + sessionDuration,
      refreshExpiresAt: Date.now() + refreshDuration,
      country: user.country,
      currency: user.currency,
      permissions: this.getUserPermissions(user)
    };

    // Store session
    sessionStorage.setItem(this.sessionKey, JSON.stringify(session));
    localStorage.setItem(this.refreshKey, session.refreshToken);
    localStorage.setItem(this.deviceKey, deviceId);

    // Set current user
    this.currentUser = user;

    // Start session timer
    this.startSessionTimer(session.expiresAt);

    return session;
  }

  /**
   * Check existing session
   */
  async checkExistingSession() {
    try {
      const sessionData = sessionStorage.getItem(this.sessionKey);
      if (!sessionData) {
        return false;
      }

      const session = JSON.parse(sessionData);
      
      // Check if session is expired
      if (session.expiresAt <= Date.now()) {
        // Try to refresh session
        return await this.refreshSession();
      }

      // Load user data
      this.currentUser = await this.findUserById(session.userId);
      if (!this.currentUser) {
        this.clearSession();
        return false;
      }

      // Start session timer
      this.startSessionTimer(session.expiresAt);

      return true;

    } catch (error) {
      console.error('Session check failed:', error);
      this.clearSession();
      return false;
    }
  }

  /**
   * Refresh session using refresh token
   */
  async refreshSession() {
    try {
      const refreshToken = localStorage.getItem(this.refreshKey);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Verify refresh token (in production, verify on server)
      const session = JSON.parse(sessionStorage.getItem(this.sessionKey) || '{}');
      if (session.refreshExpiresAt <= Date.now()) {
        throw new Error('Refresh token expired');
      }

      // Get user
      const user = await this.findUserById(session.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Create new session
      const deviceId = localStorage.getItem(this.deviceKey);
      const newSession = await this.createSession(user, deviceId);

      return true;

    } catch (error) {
      console.error('Session refresh failed:', error);
      this.clearSession();
      return false;
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      // Clear timers
      if (this.sessionTimer) {
        clearTimeout(this.sessionTimer);
        this.sessionTimer = null;
      }

      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer);
        this.refreshTimer = null;
      }

      // Clear session data
      this.clearSession();

      // Clear current user
      this.currentUser = null;

      return {
        success: true,
        message: 'Logged out successfully'
      };

    } catch (error) {
      console.error('Logout failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clear session data
   */
  clearSession() {
    sessionStorage.removeItem(this.sessionKey);
    localStorage.removeItem(this.refreshKey);
    // Keep device ID for trusted device recognition
  }

  /**
   * WEBAUTHN SETUP
   */

  /**
   * Setup WebAuthn for user
   */
  async setupWebAuthn(user) {
    try {
      if (!this.supportsWebAuthn) {
        throw new Error('WebAuthn not supported');
      }

      // Generate challenge
      const challenge = this.generateChallenge();
      
      // Create credential
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new TextEncoder().encode(challenge),
          rp: {
            name: 'SmartFinanceAI',
            id: window.location.hostname
          },
          user: {
            id: new TextEncoder().encode(user.id),
            name: user.email,
            displayName: `${user.firstName} ${user.lastName}`
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' }, // ES256
            { alg: -257, type: 'public-key' } // RS256
          ],
          timeout: 60000,
          attestation: 'direct',
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'preferred',
            residentKey: 'preferred'
          }
        }
      });

      // Store credential
      const credentialData = {
        id: this.arrayBufferToBase64(credential.rawId),
        publicKey: this.arrayBufferToBase64(credential.response.publicKey),
        createdAt: new Date().toISOString()
      };

      await this.storeWebAuthnCredential(user.id, credentialData);

      return {
        success: true,
        message: 'Biometric authentication set up successfully!'
      };

    } catch (error) {
      console.error('WebAuthn setup failed:', error);
      throw error;
    }
  }

  /**
   * UTILITY FUNCTIONS
   */

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return this.currentUser !== null && this.hasValidSession();
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser ? this.sanitizeUser(this.currentUser) : null;
  }

  /**
   * Get current session
   */
  getCurrentSession() {
    try {
      const sessionData = sessionStorage.getItem(this.sessionKey);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch {
      return null;
    }
  }

  /**
   * Check if session is valid
   */
  hasValidSession() {
    try {
      const session = this.getCurrentSession();
      return session && session.expiresAt > Date.now();
    } catch {
      return false;
    }
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check password strength
   */
  isStrongPassword(password) {
    // At least 8 characters, uppercase, lowercase, number, special char
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    return password.length >= 8 && strongRegex.test(password);
  }

  /**
   * Hash password
   */
  async hashPassword(password) {
    // In production, use proper password hashing (bcrypt, scrypt, Argon2)
    // For demo, using simple hash
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'smartfinance_salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Verify password
   */
  async verifyPassword(password, hash) {
    const computedHash = await this.hashPassword(password);
    return computedHash === hash;
  }

  /**
   * Generate unique IDs
   */
  generateUserId() {
    return 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  generateSessionId() {
    return 'sess_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  generateDeviceId() {
    return 'dev_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  generateToken() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0')).join('');
  }

  generateChallenge() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Device detection
   */
  getDeviceName() {
    const ua = navigator.userAgent;
    if (ua.includes('iPhone')) return 'iPhone';
    if (ua.includes('iPad')) return 'iPad';
    if (ua.includes('Android')) return 'Android Device';
    if (ua.includes('Mac')) return 'Mac';
    if (ua.includes('Windows')) return 'Windows PC';
    return 'Unknown Device';
  }

  getDeviceType() {
    const ua = navigator.userAgent;
    if (/Mobile|Android|iPhone|iPad/.test(ua)) return 'mobile';
    if (/Tablet|iPad/.test(ua)) return 'tablet';
    return 'desktop';
  }

  getStoredDeviceId() {
    return localStorage.getItem(this.deviceKey);
  }

  /**
   * Rate limiting
   */
  checkRateLimit(email) {
    const attempts = this.getFailedAttempts(email);
    if (attempts.count >= this.config.maxLoginAttempts) {
      const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
      if (timeSinceLastAttempt < this.config.lockoutDuration) {
        const remainingTime = Math.ceil((this.config.lockoutDuration - timeSinceLastAttempt) / 60000);
        throw new Error(`Account temporarily locked. Try again in ${remainingTime} minutes.`);
      } else {
        this.clearFailedAttempts(email);
      }
    }
  }

  getFailedAttempts(email) {
    const key = `failed_attempts_${email}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : { count: 0, lastAttempt: 0 };
  }

  recordFailedAttempt(email) {
    const key = `failed_attempts_${email}`;
    const attempts = this.getFailedAttempts(email);
    attempts.count++;
    attempts.lastAttempt = Date.now();
    localStorage.setItem(key, JSON.stringify(attempts));
  }

  clearFailedAttempts(email) {
    const key = `failed_attempts_${email}`;
    localStorage.removeItem(key);
  }

  /**
   * Timer management
   */
  startSessionTimer(expiresAt) {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }

    const timeUntilExpiry = expiresAt - Date.now();
    const refreshTime = Math.max(0, timeUntilExpiry - (this.config.autoRefreshMinutes * 60000));

    this.sessionTimer = setTimeout(() => {
      this.refreshSession();
    }, refreshTime);
  }

  setupAutoRefresh() {
    // Check session every 5 minutes
    this.refreshTimer = setInterval(() => {
      if (this.isAuthenticated()) {
        const session = this.getCurrentSession();
        const timeUntilExpiry = session.expiresAt - Date.now();
        
        // Auto-refresh if less than 30 minutes remaining
        if (timeUntilExpiry < (this.config.autoRefreshMinutes * 60000)) {
          this.refreshSession();
        }
      }
    }, 5 * 60000); // 5 minutes
  }

  /**
   * Event handlers
   */
  handleStorageChange(event) {
    // Handle logout in other tabs
    if (event.key === this.sessionKey && event.newValue === null) {
      this.currentUser = null;
      window.location.href = '/auth/login';
    }
  }

  handleVisibilityChange() {
    // Refresh session when page becomes visible
    if (!document.hidden && this.isAuthenticated()) {
      this.checkExistingSession();
    }
  }

  /**
   * Data access methods (mock implementation)
   */
  async storeUser(user) {
    // In production, this would call your API
    const users = JSON.parse(localStorage.getItem('smartfinance_users') || '[]');
    users.push(user);
    localStorage.setItem('smartfinance_users', JSON.stringify(users));
  }

  async findUserByEmail(email) {
    // In production, this would call your API
    const users = JSON.parse(localStorage.getItem('smartfinance_users') || '[]');
    return users.find(user => user.email === email.toLowerCase());
  }

  async findUserById(userId) {
    // In production, this would call your API
    const users = JSON.parse(localStorage.getItem('smartfinance_users') || '[]');
    return users.find(user => user.id === userId);
  }

  async updateLastLogin(userId) {
    // In production, this would call your API
    const users = JSON.parse(localStorage.getItem('smartfinance_users') || '[]');
    const userIndex = users.findIndex(user => user.id === userId);
    if (userIndex !== -1) {
      users[userIndex].lastLoginAt = new Date().toISOString();
      localStorage.setItem('smartfinance_users', JSON.stringify(users));
    }
  }

  async updateDeviceInfo(userId, deviceId) {
    // In production, this would call your API
    const users = JSON.parse(localStorage.getItem('smartfinance_users') || '[]');
    const userIndex = users.findIndex(user => user.id === userId);
    if (userIndex !== -1) {
      const user = users[userIndex];
      const deviceIndex = user.devices.findIndex(device => device.id === deviceId);
      
      if (deviceIndex !== -1) {
        user.devices[deviceIndex].lastUsedAt = new Date().toISOString();
      } else {
        user.devices.push({
          id: deviceId,
          name: this.getDeviceName(),
          type: this.getDeviceType(),
          registeredAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString(),
          isTrusted: false
        });
      }
      
      localStorage.setItem('smartfinance_users', JSON.stringify(users));
    }
  }

  /**
   * WebAuthn credential storage
   */
  async storeWebAuthnCredential(userId, credentialData) {
    const key = `webauthn_${userId}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push(credentialData);
    localStorage.setItem(key, JSON.stringify(existing));
  }

  getStoredCredentials() {
    const session = this.getCurrentSession();
    if (!session) return [];
    
    const key = `webauthn_${session.userId}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  async verifyWebAuthnCredential(credential) {
    // In production, verify credential on server
    // For demo, just return current user
    const session = this.getCurrentSession();
    return session ? await this.findUserById(session.userId) : null;
  }

  /**
   * Utility functions
   */
  sanitizeUser(user) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  getUserPermissions(user) {
    return [
      'read:accounts',
      'write:accounts',
      'read:transactions',
      'write:transactions',
      'read:goals',
      'write:goals',
      'read:budgets',
      'write:budgets'
    ];
  }

  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

// Create global instance
const authManager = new AuthManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AuthManager };
}

console.log('✅ AuthManager loaded - Authentication system ready!');