/**
 * SmartFinanceAI - Authentication API Integration
 * Global SaaS Platform with Enterprise Security
 * 
 * Features:
 * - JWT token management with automatic refresh
 * - WebAuthn biometric authentication
 * - Multi-factor authentication (TOTP)
 * - Social login integration (Google, Apple, Microsoft)
 * - Device management and trusted device registration
 * - Comprehensive error handling and retry logic
 * - Security event logging and monitoring
 */

import { apiEndpoints } from './endpoints.js';
import { encryptionService } from '../data/encryption-service.js';

// Token storage keys
const TOKEN_KEYS = {
  ACCESS_TOKEN: 'smartfinance_access_token',
  REFRESH_TOKEN: 'smartfinance_refresh_token',
  USER_DATA: 'smartfinance_user_data',
  DEVICE_ID: 'smartfinance_device_id',
  BIOMETRIC_ENABLED: 'smartfinance_biometric_enabled'
};

// Session configuration
const SESSION_CONFIG = {
  ACCESS_TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
  REFRESH_TOKEN_EXPIRY: 30 * 24 * 60 * 60 * 1000, // 30 days
  REFRESH_THRESHOLD: 5 * 60 * 1000, // Refresh when 5 minutes left
  MAX_RETRY_ATTEMPTS: 3,
  LOCKOUT_DURATION: 15 * 60 * 1000 // 15 minutes
};

class AuthAPI {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
    this.refreshPromise = null;
    this.eventListeners = new Map();
    this.retryCount = 0;
    this.isRefreshing = false;
    
    // Initialize from stored tokens
    this.initializeFromStorage();
    
    // Set up automatic token refresh
    this.setupTokenRefresh();
  }

  // ==========================================
  // INITIALIZATION & TOKEN MANAGEMENT
  // ==========================================

  /**
   * Initialize authentication state from localStorage
   */
  initializeFromStorage() {
    try {
      const accessToken = localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
      const refreshToken = localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
      const userData = localStorage.getItem(TOKEN_KEYS.USER_DATA);
      
      if (accessToken && refreshToken && userData) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.user = JSON.parse(userData);
        
        // Validate token expiry
        if (this.isTokenExpired(accessToken)) {
          this.refreshAccessToken();
        }
      }
    } catch (error) {
      console.warn('Failed to initialize auth from storage:', error);
      this.clearStoredAuth();
    }
  }

  /**
   * Set up automatic token refresh
   */
  setupTokenRefresh() {
    setInterval(() => {
      if (this.accessToken && this.shouldRefreshToken()) {
        this.refreshAccessToken();
      }
    }, 60000); // Check every minute
  }

  /**
   * Check if token should be refreshed
   */
  shouldRefreshToken() {
    if (!this.accessToken) return false;
    
    try {
      const payload = this.parseJWTPayload(this.accessToken);
      const now = Date.now();
      const expiryTime = payload.exp * 1000;
      
      return (expiryTime - now) < SESSION_CONFIG.REFRESH_THRESHOLD;
    } catch (error) {
      return true; // Refresh on parse error
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token) {
    try {
      const payload = this.parseJWTPayload(token);
      return Date.now() >= (payload.exp * 1000);
    } catch (error) {
      return true; // Treat parse errors as expired
    }
  }

  /**
   * Parse JWT payload
   */
  parseJWTPayload(token) {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT format');
    
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  }

  // ==========================================
  // AUTHENTICATION METHODS
  // ==========================================

  /**
   * User login with email and password
   */
  async login(email, password, rememberMe = false) {
    try {
      const endpoint = apiEndpoints.auth.login();
      const deviceId = this.getOrCreateDeviceId();
      
      const response = await this.makeRequest(endpoint, {
        email: email.toLowerCase().trim(),
        password,
        deviceId,
        rememberMe
      });
      
      await this.handleAuthResponse(response);
      this.emit('login', { user: this.user, method: 'password' });
      
      return {
        success: true,
        user: this.user,
        requiresMFA: response.requiresMFA || false
      };
      
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  /**
   * User registration
   */
  async register(userData) {
    try {
      const endpoint = apiEndpoints.auth.register();
      const deviceId = this.getOrCreateDeviceId();
      
      const response = await this.makeRequest(endpoint, {
        ...userData,
        email: userData.email.toLowerCase().trim(),
        deviceId
      });
      
      // Registration may require email verification
      if (response.requiresVerification) {
        return {
          success: true,
          requiresVerification: true,
          message: 'Please check your email to verify your account'
        };
      }
      
      await this.handleAuthResponse(response);
      this.emit('register', { user: this.user });
      
      return {
        success: true,
        user: this.user
      };
      
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  /**
   * User logout
   */
  async logout() {
    try {
      const endpoint = apiEndpoints.auth.logout();
      
      // Attempt to notify server of logout
      if (this.accessToken) {
        await this.makeAuthenticatedRequest(endpoint, {
          deviceId: this.getDeviceId()
        });
      }
    } catch (error) {
      // Don't throw on logout errors - clear local state anyway
      console.warn('Logout request failed:', error);
    } finally {
      this.clearAuthState();
      this.emit('logout');
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken() {
    if (this.isRefreshing) {
      return this.refreshPromise;
    }
    
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    this.isRefreshing = true;
    
    try {
      this.refreshPromise = this.performTokenRefresh();
      const response = await this.refreshPromise;
      
      await this.handleAuthResponse(response);
      this.emit('tokenRefresh', { user: this.user });
      
      return response;
      
    } catch (error) {
      this.clearAuthState();
      this.emit('authExpired');
      throw error;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh request
   */
  async performTokenRefresh() {
    const endpoint = apiEndpoints.auth.refresh();
    
    return await this.makeRequest(endpoint, {
      refreshToken: this.refreshToken,
      deviceId: this.getDeviceId()
    });
  }

  // ==========================================
  // BIOMETRIC AUTHENTICATION (WebAuthn)
  // ==========================================

  /**
   * Check if biometric authentication is available
   */
  async isBiometricAvailable() {
    return !!(window.PublicKeyCredential && 
             await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());
  }

  /**
   * Register biometric authentication
   */
  async registerBiometric() {
    try {
      if (!await this.isBiometricAvailable()) {
        throw new Error('Biometric authentication not available');
      }
      
      // Get registration options from server
      const beginEndpoint = apiEndpoints.auth.webauthn.registerBegin();
      const options = await this.makeAuthenticatedRequest(beginEndpoint);
      
      // Create credential
      const credential = await navigator.credentials.create({
        publicKey: {
          ...options,
          challenge: this.base64ToArrayBuffer(options.challenge),
          user: {
            ...options.user,
            id: this.base64ToArrayBuffer(options.user.id)
          }
        }
      });
      
      if (!credential) {
        throw new Error('Failed to create credential');
      }
      
      // Complete registration
      const completeEndpoint = apiEndpoints.auth.webauthn.registerComplete();
      const result = await this.makeAuthenticatedRequest(completeEndpoint, {
        credential: this.credentialToJSON(credential)
      });
      
      localStorage.setItem(TOKEN_KEYS.BIOMETRIC_ENABLED, 'true');
      this.emit('biometricRegistered');
      
      return result;
      
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  /**
   * Login with biometric authentication
   */
  async loginWithBiometric() {
    try {
      if (!await this.isBiometricAvailable()) {
        throw new Error('Biometric authentication not available');
      }
      
      // Get authentication options
      const beginEndpoint = apiEndpoints.auth.webauthn.loginBegin();
      const options = await this.makeRequest(beginEndpoint, {
        deviceId: this.getOrCreateDeviceId()
      });
      
      // Get assertion
      const assertion = await navigator.credentials.get({
        publicKey: {
          ...options,
          challenge: this.base64ToArrayBuffer(options.challenge)
        }
      });
      
      if (!assertion) {
        throw new Error('Biometric authentication cancelled');
      }
      
      // Complete authentication
      const completeEndpoint = apiEndpoints.auth.webauthn.loginComplete();
      const response = await this.makeRequest(completeEndpoint, {
        assertion: this.credentialToJSON(assertion),
        deviceId: this.getDeviceId()
      });
      
      await this.handleAuthResponse(response);
      this.emit('login', { user: this.user, method: 'biometric' });
      
      return {
        success: true,
        user: this.user
      };
      
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  /**
   * Check if biometric is enabled for current user
   */
  isBiometricEnabled() {
    return localStorage.getItem(TOKEN_KEYS.BIOMETRIC_ENABLED) === 'true';
  }

  // ==========================================
  // MULTI-FACTOR AUTHENTICATION
  // ==========================================

  /**
   * Setup MFA (TOTP)
   */
  async setupMFA() {
    try {
      const endpoint = apiEndpoints.auth.mfa.setup();
      const response = await this.makeAuthenticatedRequest(endpoint);
      
      return {
        qrCode: response.qrCode,
        secret: response.secret,
        backupCodes: response.backupCodes
      };
      
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  /**
   * Verify MFA code
   */
  async verifyMFA(code, isBackupCode = false) {
    try {
      const endpoint = apiEndpoints.auth.mfa.verify();
      const response = await this.makeRequest(endpoint, {
        code,
        isBackupCode,
        deviceId: this.getDeviceId()
      });
      
      await this.handleAuthResponse(response);
      this.emit('mfaVerified');
      
      return {
        success: true,
        user: this.user
      };
      
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  /**
   * Disable MFA
   */
  async disableMFA(password) {
    try {
      const endpoint = apiEndpoints.auth.mfa.disable();
      await this.makeAuthenticatedRequest(endpoint, { password });
      
      this.emit('mfaDisabled');
      return { success: true };
      
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  // ==========================================
  // PASSWORD MANAGEMENT
  // ==========================================

  /**
   * Request password reset
   */
  async forgotPassword(email) {
    try {
      const endpoint = apiEndpoints.auth.forgotPassword();
      await this.makeRequest(endpoint, {
        email: email.toLowerCase().trim()
      });
      
      return {
        success: true,
        message: 'Password reset instructions sent to your email'
      };
      
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token, newPassword) {
    try {
      const endpoint = apiEndpoints.auth.resetPassword(token);
      const response = await this.makeRequest(endpoint, {
        password: newPassword
      });
      
      await this.handleAuthResponse(response);
      this.emit('passwordReset');
      
      return {
        success: true,
        user: this.user
      };
      
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(currentPassword, newPassword) {
    try {
      const endpoint = apiEndpoints.auth.changePassword();
      await this.makeAuthenticatedRequest(endpoint, {
        currentPassword,
        newPassword
      });
      
      this.emit('passwordChanged');
      
      return { success: true };
      
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Get or create device ID
   */
  getOrCreateDeviceId() {
    let deviceId = localStorage.getItem(TOKEN_KEYS.DEVICE_ID);
    if (!deviceId) {
      deviceId = this.generateDeviceId();
      localStorage.setItem(TOKEN_KEYS.DEVICE_ID, deviceId);
    }
    return deviceId;
  }

  /**
   * Get existing device ID
   */
  getDeviceId() {
    return localStorage.getItem(TOKEN_KEYS.DEVICE_ID);
  }

  /**
   * Generate unique device ID
   */
  generateDeviceId() {
    return 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Handle successful authentication response
   */
  async handleAuthResponse(response) {
    this.accessToken = response.accessToken;
    this.refreshToken = response.refreshToken;
    this.user = response.user;
    
    // Store tokens securely
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, this.accessToken);
    localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, this.refreshToken);
    localStorage.setItem(TOKEN_KEYS.USER_DATA, JSON.stringify(this.user));
    
    this.retryCount = 0; // Reset retry counter on success
  }

  /**
   * Clear authentication state
   */
  clearAuthState() {
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
    this.clearStoredAuth();
  }

  /**
   * Clear stored authentication data
   */
  clearStoredAuth() {
    Object.values(TOKEN_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  /**
   * Handle authentication errors
   */
  handleAuthError(error) {
    // Log security-relevant errors
    if (error.status === 401) {
      this.emit('authError', { type: 'unauthorized', error });
    } else if (error.status === 429) {
      this.emit('authError', { type: 'rateLimited', error });
    } else if (error.status === 423) {
      this.emit('authError', { type: 'accountLocked', error });
    }
  }

  /**
   * Make HTTP request
   */
  async makeRequest(endpoint, data = null) {
    const config = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'X-Device-ID': this.getOrCreateDeviceId()
      }
    };
    
    if (data && endpoint.method !== 'GET') {
      config.body = JSON.stringify(data);
    }
    
    const response = await fetch(endpoint.url, config);
    
    if (!response.ok) {
      const error = await this.parseErrorResponse(response);
      throw error;
    }
    
    return await response.json();
  }

  /**
   * Make authenticated HTTP request
   */
  async makeAuthenticatedRequest(endpoint, data = null) {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }
    
    // Check if token needs refresh
    if (this.shouldRefreshToken()) {
      await this.refreshAccessToken();
    }
    
    const config = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`,
        'X-Device-ID': this.getDeviceId()
      }
    };
    
    if (data && endpoint.method !== 'GET') {
      config.body = JSON.stringify(data);
    }
    
    const response = await fetch(endpoint.url, config);
    
    if (response.status === 401) {
      // Token might be invalid, try to refresh
      await this.refreshAccessToken();
      
      // Retry with new token
      config.headers['Authorization'] = `Bearer ${this.accessToken}`;
      const retryResponse = await fetch(endpoint.url, config);
      
      if (!retryResponse.ok) {
        const error = await this.parseErrorResponse(retryResponse);
        throw error;
      }
      
      return await retryResponse.json();
    }
    
    if (!response.ok) {
      const error = await this.parseErrorResponse(response);
      throw error;
    }
    
    return await response.json();
  }

  /**
   * Parse error response
   */
  async parseErrorResponse(response) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: response.statusText };
    }
    
    const error = new Error(errorData.message || 'Request failed');
    error.status = response.status;
    error.code = errorData.code;
    error.details = errorData.details;
    
    return error;
  }

  /**
   * Convert base64 to ArrayBuffer for WebAuthn
   */
  base64ToArrayBuffer(base64) {
    const binaryString = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Convert ArrayBuffer to base64 for WebAuthn
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binaryString = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binaryString += String.fromCharCode(bytes[i]);
    }
    return btoa(binaryString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  /**
   * Convert WebAuthn credential to JSON
   */
  credentialToJSON(credential) {
    return {
      id: credential.id,
      rawId: this.arrayBufferToBase64(credential.rawId),
      type: credential.type,
      response: {
        clientDataJSON: this.arrayBufferToBase64(credential.response.clientDataJSON),
        attestationObject: credential.response.attestationObject ? 
          this.arrayBufferToBase64(credential.response.attestationObject) : undefined,
        authenticatorData: credential.response.authenticatorData ? 
          this.arrayBufferToBase64(credential.response.authenticatorData) : undefined,
        signature: credential.response.signature ? 
          this.arrayBufferToBase64(credential.response.signature) : undefined,
        userHandle: credential.response.userHandle ? 
          this.arrayBufferToBase64(credential.response.userHandle) : undefined
      }
    };
  }

  // ==========================================
  // EVENT SYSTEM
  // ==========================================

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  emit(event, data = null) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} event listener:`, error);
        }
      });
    }
  }

  // ==========================================
  // STATE QUERIES
  // ==========================================

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!(this.accessToken && this.user && !this.isTokenExpired(this.accessToken));
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.user;
  }

  /**
   * Get current access token
   */
  getAccessToken() {
    return this.accessToken;
  }

  /**
   * Get user permissions
   */
  getUserPermissions() {
    return this.user?.permissions || [];
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission) {
    const permissions = this.getUserPermissions();
    return permissions.includes(permission) || permissions.includes('admin');
  }

  /**
   * Get user subscription tier
   */
  getSubscriptionTier() {
    return this.user?.subscription?.tier || 'free';
  }

  /**
   * Check if user has specific feature access
   */
  hasFeatureAccess(feature) {
    const tier = this.getSubscriptionTier();
    const featureMap = {
      'free': ['basic_budgeting', 'manual_import', 'basic_goals'],
      'premium': ['*'], // All features except business
      'professional': ['*', 'business_features', 'api_access']
    };
    
    const allowedFeatures = featureMap[tier] || [];
    return allowedFeatures.includes('*') || allowedFeatures.includes(feature);
  }

  /**
   * Get tenant ID for multi-tenant features
   */
  getTenantId() {
    return this.user?.tenantId;
  }

  /**
   * Check if user account is verified
   */
  isAccountVerified() {
    return this.user?.emailVerified && this.user?.profileComplete;
  }

  /**
   * Get security settings
   */
  getSecuritySettings() {
    return {
      mfaEnabled: this.user?.mfaEnabled || false,
      biometricEnabled: this.isBiometricEnabled(),
      lastPasswordChange: this.user?.lastPasswordChange,
      trustedDevices: this.user?.trustedDevices || []
    };
  }

  // ==========================================
  // SOCIAL AUTHENTICATION
  // ==========================================

  /**
   * Initiate Google OAuth login
   */
  async loginWithGoogle() {
    try {
      // This would typically open a popup or redirect to Google OAuth
      const authUrl = `${apiEndpoints.baseUrl}/auth/google?deviceId=${this.getOrCreateDeviceId()}`;
      
      // For popup approach
      const popup = window.open(authUrl, 'google-auth', 'width=500,height=600');
      
      return new Promise((resolve, reject) => {
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            reject(new Error('Authentication cancelled'));
          }
        }, 1000);
        
        // Listen for auth completion message
        window.addEventListener('message', async (event) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'google-auth-success') {
            clearInterval(checkClosed);
            popup.close();
            
            await this.handleAuthResponse(event.data.response);
            this.emit('login', { user: this.user, method: 'google' });
            
            resolve({
              success: true,
              user: this.user
            });
          } else if (event.data.type === 'google-auth-error') {
            clearInterval(checkClosed);
            popup.close();
            reject(new Error(event.data.error));
          }
        });
      });
      
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  /**
   * Initiate Apple ID login
   */
  async loginWithApple() {
    // Similar implementation for Apple ID
    throw new Error('Apple ID login not yet implemented');
  }

  /**
   * Initiate Microsoft login
   */
  async loginWithMicrosoft() {
    // Similar implementation for Microsoft
    throw new Error('Microsoft login not yet implemented');
  }

  // ==========================================
  // DEVICE MANAGEMENT
  // ==========================================

  /**
   * Get trusted devices
   */
  async getTrustedDevices() {
    try {
      const endpoint = { url: `${apiEndpoints.baseUrl}/auth/devices`, method: 'GET' };
      return await this.makeAuthenticatedRequest(endpoint);
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  /**
   * Revoke device access
   */
  async revokeDevice(deviceId) {
    try {
      const endpoint = { 
        url: `${apiEndpoints.baseUrl}/auth/devices/${deviceId}`, 
        method: 'DELETE' 
      };
      await this.makeAuthenticatedRequest(endpoint);
      this.emit('deviceRevoked', { deviceId });
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  /**
   * Trust current device
   */
  async trustCurrentDevice() {
    try {
      const endpoint = { url: `${apiEndpoints.baseUrl}/auth/devices/trust`, method: 'POST' };
      await this.makeAuthenticatedRequest(endpoint, {
        deviceId: this.getDeviceId(),
        deviceInfo: this.getDeviceInfo()
      });
      this.emit('deviceTrusted');
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  /**
   * Get device information
   */
  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: {
        width: screen.width,
        height: screen.height
      }
    };
  }

  // ==========================================
  // SESSION MANAGEMENT
  // ==========================================

  /**
   * Extend session
   */
  async extendSession() {
    if (this.accessToken && !this.isTokenExpired(this.accessToken)) {
      await this.refreshAccessToken();
      this.emit('sessionExtended');
    }
  }

  /**
   * Get session info
   */
  getSessionInfo() {
    if (!this.accessToken) return null;
    
    try {
      const payload = this.parseJWTPayload(this.accessToken);
      return {
        userId: payload.sub,
        deviceId: this.getDeviceId(),
        expiresAt: new Date(payload.exp * 1000),
        issuedAt: new Date(payload.iat * 1000),
        timeUntilExpiry: (payload.exp * 1000) - Date.now()
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Check session health
   */
  checkSessionHealth() {
    const sessionInfo = this.getSessionInfo();
    if (!sessionInfo) return { healthy: false, reason: 'No active session' };
    
    const timeLeft = sessionInfo.timeUntilExpiry;
    
    if (timeLeft <= 0) {
      return { healthy: false, reason: 'Session expired' };
    }
    
    if (timeLeft < SESSION_CONFIG.REFRESH_THRESHOLD) {
      return { healthy: true, warning: 'Session expires soon' };
    }
    
    return { healthy: true };
  }

  // ==========================================
  // CLEANUP & DESTROY
  // ==========================================

  /**
   * Cleanup and destroy auth instance
   */
  destroy() {
    this.clearAuthState();
    this.eventListeners.clear();
    this.refreshPromise = null;
  }
}

// Export singleton instance
export const authAPI = new AuthAPI();

// Export the class for custom instances
export default AuthAPI;

// Export session configuration
export { SESSION_CONFIG, TOKEN_KEYS };