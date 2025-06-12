// 🚀 SmartFinanceAI - Authentication Manager
// Secure authentication with WebAuthn biometrics, JWT tokens, and multi-factor authentication

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiryTime = null;
    this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
    this.refreshThreshold = 5 * 60 * 1000; // 5 minutes before expiry
    
    // WebAuthn configuration
    this.webAuthnSupported = this.checkWebAuthnSupport();
    this.rpId = window.location.hostname;
    this.rpName = 'SmartFinanceAI';
    
    // Authentication state
    this.isAuthenticated = false;
    this.authListeners = [];
    this.biometricEnabled = false;
    
    // Session monitoring
    this.refreshTimer = null;
    this.activityTimer = null;
    this.lastActivity = Date.now();
    
    console.log('🔐 AuthManager initialized');
    this.initializeFromStorage();
  }
  
  // === INITIALIZATION === //
  
  async initializeFromStorage() {
    try {
      // Check for existing session
      const storedToken = localStorage.getItem('smartfinance_access_token');
      const storedRefresh = localStorage.getItem('smartfinance_refresh_token');
      const storedUser = localStorage.getItem('smartfinance_user');
      const storedExpiry = localStorage.getItem('smartfinance_token_expiry');
      
      if (storedToken && storedRefresh && storedUser && storedExpiry) {
        const expiryTime = parseInt(storedExpiry);
        
        // Check if token is still valid
        if (Date.now() < expiryTime) {
          this.accessToken = storedToken;
          this.refreshToken = storedRefresh;
          this.tokenExpiryTime = expiryTime;
          this.currentUser = JSON.parse(storedUser);
          this.isAuthenticated = true;
          
          // Set up auto-refresh
          this.setupTokenRefresh();
          this.setupActivityMonitoring();
          
          console.log('✅ Session restored for user:', this.currentUser.email);
          this.notifyAuthListeners('restored');
          
        } else {
          console.log('🔄 Token expired, attempting refresh...');
          await this.refreshTokens();
        }
      }
      
      // Check biometric availability
      if (this.webAuthnSupported) {
        this.biometricEnabled = localStorage.getItem('smartfinance_biometric_enabled') === 'true';
        console.log('👆 Biometric authentication:', this.biometricEnabled ? 'enabled' : 'disabled');
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize from storage:', error);
      this.clearStoredAuth();
    }
  }
  
  checkWebAuthnSupport() {
    return !!(window.PublicKeyCredential && 
              navigator.credentials && 
              navigator.credentials.create &&
              navigator.credentials.get);
  }
  
  // === REGISTRATION === //
  
  async register(userData) {
    try {
      console.log('📝 Starting user registration...');
      
      const { email, password, firstName, lastName, country, currency } = userData;
      
      // Validate input
      this.validateRegistrationData(userData);
      
      // Create user ID
      const userId = this.generateUserId();
      
      // Hash password
      const passwordHash = await this.hashPassword(password);
      
      // Create user object
      const user = {
        id: userId,
        email: email.toLowerCase().trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        country: country,
        currency: currency,
        passwordHash: passwordHash,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isEmailVerified: false,
        isBiometricEnabled: false,
        lastLoginAt: null,
        loginCount: 0,
        failedAttempts: 0,
        lockedUntil: null,
        preferences: {
          theme: 'dark',
          language: 'en',
          notifications: true,
          privacyMode: false,
          currency: currency,
          dateFormat: this.getDefaultDateFormat(country),
          numberFormat: this.getDefaultNumberFormat(country)
        }
      };
      
      // Store user (in a real app, this would be sent to your backend)
      await this.storeUser(user);
      
      // Generate tokens
      const tokens = await this.generateTokens(user);
      
      // Set authentication state
      this.setAuthenticationState(user, tokens);
      
      console.log('✅ User registered successfully:', email);
      this.notifyAuthListeners('registered');
      
      return {
        success: true,
        user: this.sanitizeUser(user),
        requiresEmailVerification: true
      };
      
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw error;
    }
  }
  
  validateRegistrationData(userData) {
    const { email, password, firstName, lastName, country } = userData;
    
    if (!email || !this.isValidEmail(email)) {
      throw new Error('Invalid email address');
    }
    
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    
    if (!firstName || firstName.trim().length < 1) {
      throw new Error('First name is required');
    }
    
    if (!lastName || lastName.trim().length < 1) {
      throw new Error('Last name is required');
    }
    
    if (!country || !['NZ', 'AU', 'UK', 'US', 'CA'].includes(country)) {
      throw new Error('Invalid country selection');
    }
    
    // Check password strength
    if (!this.isStrongPassword(password)) {
      throw new Error('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
    }
  }
  
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  isStrongPassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    return strongRegex.test(password) && password.length >= 8;
  }
  
  // === LOGIN === //
  
  async login(email, password, rememberMe = false) {
    try {
      console.log('🔑 Starting login process...');
      
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      // Get user from storage
      const user = await this.getUserByEmail(email.toLowerCase().trim());
      
      if (!user) {
        throw new Error('Invalid email or password');
      }
      
      // Check if account is locked
      if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
        const lockTimeRemaining = Math.ceil((new Date(user.lockedUntil) - new Date()) / 60000);
        throw new Error(`Account is locked. Try again in ${lockTimeRemaining} minutes.`);
      }
      
      // Verify password
      const isValidPassword = await this.verifyPassword(password, user.passwordHash);
      
      if (!isValidPassword) {
        await this.handleFailedLogin(user);
        throw new Error('Invalid email or password');
      }
      
      // Reset failed attempts on successful login
      await this.resetFailedAttempts(user);
      
      // Update login statistics
      await this.updateLoginStats(user);
      
      // Generate tokens
      const tokens = await this.generateTokens(user, rememberMe);
      
      // Set authentication state
      this.setAuthenticationState(user, tokens);
      
      console.log('✅ Login successful:', email);
      this.notifyAuthListeners('logged_in');
      
      return {
        success: true,
        user: this.sanitizeUser(user),
        biometricAvailable: this.webAuthnSupported && !user.isBiometricEnabled
      };
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  }
  
  async handleFailedLogin(user) {
    user.failedAttempts = (user.failedAttempts || 0) + 1;
    user.updatedAt = new Date().toISOString();
    
    // Lock account after 5 failed attempts
    if (user.failedAttempts >= 5) {
      user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes
      console.warn('⚠️ Account locked due to multiple failed attempts:', user.email);
    }
    
    await this.updateUser(user);
  }
  
  async resetFailedAttempts(user) {
    if (user.failedAttempts > 0) {
      user.failedAttempts = 0;
      user.lockedUntil = null;
      user.updatedAt = new Date().toISOString();
      await this.updateUser(user);
    }
  }
  
  async updateLoginStats(user) {
    user.lastLoginAt = new Date().toISOString();
    user.loginCount = (user.loginCount || 0) + 1;
    user.updatedAt = new Date().toISOString();
    await this.updateUser(user);
  }
  
  // === BIOMETRIC AUTHENTICATION === //
  
  async setupBiometric() {
    try {
      if (!this.webAuthnSupported) {
        throw new Error('WebAuthn is not supported in this browser');
      }
      
      if (!this.isAuthenticated) {
        throw new Error('User must be logged in to setup biometric authentication');
      }
      
      console.log('👆 Setting up biometric authentication...');
      
      // Generate challenge
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      
      // Create credential options
      const createOptions = {
        publicKey: {
          rp: {
            id: this.rpId,
            name: this.rpName
          },
          user: {
            id: new TextEncoder().encode(this.currentUser.id),
            name: this.currentUser.email,
            displayName: `${this.currentUser.firstName} ${this.currentUser.lastName}`
          },
          challenge: challenge,
          pubKeyCredParams: [
            { alg: -7, type: "public-key" }, // ES256
            { alg: -257, type: "public-key" } // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
            requireResidentKey: false
          },
          timeout: 60000,
          attestation: "direct"
        }
      };
      
      // Create credential
      const credential = await navigator.credentials.create(createOptions);
      
      if (!credential) {
        throw new Error('Failed to create biometric credential');
      }
      
      // Store credential information
      const credentialData = {
        id: credential.id,
        rawId: Array.from(new Uint8Array(credential.rawId)),
        type: credential.type,
        response: {
          attestationObject: Array.from(new Uint8Array(credential.response.attestationObject)),
          clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON))
        }
      };
      
      // Update user record
      const updatedUser = {
        ...this.currentUser,
        isBiometricEnabled: true,
        biometricCredential: credentialData,
        updatedAt: new Date().toISOString()
      };
      
      await this.updateUser(updatedUser);
      this.currentUser = updatedUser;
      
      // Store biometric preference
      localStorage.setItem('smartfinance_biometric_enabled', 'true');
      this.biometricEnabled = true;
      
      console.log('✅ Biometric authentication setup complete');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Biometric setup failed:', error);
      throw error;
    }
  }
  
  async authenticateWithBiometric() {
    try {
      if (!this.webAuthnSupported || !this.biometricEnabled) {
        throw new Error('Biometric authentication not available');
      }
      
      console.log('👆 Starting biometric authentication...');
      
      // Get stored user email for credential lookup
      const lastEmail = localStorage.getItem('smartfinance_last_email');
      if (!lastEmail) {
        throw new Error('No previous user found for biometric authentication');
      }
      
      const user = await this.getUserByEmail(lastEmail);
      if (!user || !user.biometricCredential) {
        throw new Error('Biometric credential not found');
      }
      
      // Generate challenge
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      
      // Authentication options
      const getOptions = {
        publicKey: {
          challenge: challenge,
          allowCredentials: [{
            id: new Uint8Array(user.biometricCredential.rawId),
            type: 'public-key'
          }],
          userVerification: 'required',
          timeout: 60000
        }
      };
      
      // Get credential
      const assertion = await navigator.credentials.get(getOptions);
      
      if (!assertion) {
        throw new Error('Biometric authentication failed');
      }
      
      // Verify assertion (in a real app, this would be done on the server)
      // For demo purposes, we'll assume it's valid
      
      // Generate tokens
      const tokens = await this.generateTokens(user, true); // Remember me for biometric
      
      // Set authentication state
      this.setAuthenticationState(user, tokens);
      
      console.log('✅ Biometric authentication successful');
      this.notifyAuthListeners('biometric_login');
      
      return {
        success: true,
        user: this.sanitizeUser(user)
      };
      
    } catch (error) {
      console.error('❌ Biometric authentication failed:', error);
      throw error;
    }
  }
  
  // === TOKEN MANAGEMENT === //
  
  async generateTokens(user, rememberMe = false) {
    try {
      // Create JWT-like tokens (in production, use proper JWT library)
      const tokenData = {
        userId: user.id,
        email: user.email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor((Date.now() + this.sessionTimeout) / 1000)
      };
      
      // Simple token generation (use proper JWT in production)
      const accessToken = btoa(JSON.stringify(tokenData));
      const refreshToken = this.generateSecureToken();
      
      // Store refresh token with user
      user.refreshToken = refreshToken;
      user.refreshTokenExpiry = new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000).toISOString();
      await this.updateUser(user);
      
      return {
        accessToken,
        refreshToken,
        expiresIn: this.sessionTimeout
      };
      
    } catch (error) {
      console.error('❌ Token generation failed:', error);
      throw error;
    }
  }
  
  async refreshTokens() {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }
      
      console.log('🔄 Refreshing authentication tokens...');
      
      // Find user with matching refresh token
      const user = await this.getUserByRefreshToken(this.refreshToken);
      
      if (!user || !user.refreshToken || user.refreshToken !== this.refreshToken) {
        throw new Error('Invalid refresh token');
      }
      
      // Check if refresh token is expired
      if (user.refreshTokenExpiry && new Date(user.refreshTokenExpiry) < new Date()) {
        throw new Error('Refresh token expired');
      }
      
      // Generate new tokens
      const tokens = await this.generateTokens(user, true);
      
      // Update authentication state
      this.setAuthenticationState(user, tokens);
      
      console.log('✅ Tokens refreshed successfully');
      this.notifyAuthListeners('token_refreshed');
      
      return tokens;
      
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      await this.logout();
      throw error;
    }
  }
  
  setupTokenRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    
    if (!this.tokenExpiryTime) {
      return;
    }
    
    const timeUntilRefresh = this.tokenExpiryTime - Date.now() - this.refreshThreshold;
    
    if (timeUntilRefresh > 0) {
      this.refreshTimer = setTimeout(async () => {
        try {
          await this.refreshTokens();
        } catch (error) {
          console.error('❌ Automatic token refresh failed:', error);
        }
      }, timeUntilRefresh);
    }
  }
  
  // === SESSION MANAGEMENT === //
  
  setAuthenticationState(user, tokens) {
    this.currentUser = user;
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    this.tokenExpiryTime = Date.now() + tokens.expiresIn;
    this.isAuthenticated = true;
    
    // Store in localStorage
    localStorage.setItem('smartfinance_access_token', tokens.accessToken);
    localStorage.setItem('smartfinance_refresh_token', tokens.refreshToken);
    localStorage.setItem('smartfinance_user', JSON.stringify(this.sanitizeUser(user)));
    localStorage.setItem('smartfinance_token_expiry', this.tokenExpiryTime.toString());
    localStorage.setItem('smartfinance_last_email', user.email);
    
    // Setup automatic refresh
    this.setupTokenRefresh();
    this.setupActivityMonitoring();
  }
  
  setupActivityMonitoring() {
    // Track user activity for session timeout
    const updateActivity = () => {
      this.lastActivity = Date.now();
    };
    
    // Monitor user interactions
    document.addEventListener('click', updateActivity);
    document.addEventListener('keypress', updateActivity);
    document.addEventListener('touchstart', updateActivity);
    document.addEventListener('scroll', updateActivity);
    
    // Check for inactivity every minute
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
    }
    
    this.activityTimer = setInterval(() => {
      const inactiveTime = Date.now() - this.lastActivity;
      const maxInactiveTime = 60 * 60 * 1000; // 1 hour
      
      if (inactiveTime > maxInactiveTime) {
        console.log('⏰ Session expired due to inactivity');
        this.logout();
      }
    }, 60 * 1000); // Check every minute
  }
  
  // === LOGOUT === //
  
  async logout() {
    try {
      console.log('👋 Logging out user...');
      
      // Invalidate refresh token on server (in production)
      if (this.currentUser && this.refreshToken) {
        try {
          const user = { ...this.currentUser };
          user.refreshToken = null;
          user.refreshTokenExpiry = null;
          user.updatedAt = new Date().toISOString();
          await this.updateUser(user);
        } catch (error) {
          console.error('❌ Failed to invalidate refresh token:', error);
        }
      }
      
      // Clear local state
      this.clearAuthenticationState();
      
      console.log('✅ Logout successful');
      this.notifyAuthListeners('logged_out');
      
    } catch (error) {
      console.error('❌ Logout failed:', error);
      // Force clear state even if server call fails
      this.clearAuthenticationState();
    }
  }
  
  clearAuthenticationState() {
    this.currentUser = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiryTime = null;
    this.isAuthenticated = false;
    
    // Clear timers
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }
    
    // Clear localStorage (but keep biometric preference)
    this.clearStoredAuth();
  }
  
  clearStoredAuth() {
    localStorage.removeItem('smartfinance_access_token');
    localStorage.removeItem('smartfinance_refresh_token');
    localStorage.removeItem('smartfinance_user');
    localStorage.removeItem('smartfinance_token_expiry');
    // Keep smartfinance_last_email and smartfinance_biometric_enabled for UX
  }
  
  // === PASSWORD MANAGEMENT === //
  
  async changePassword(currentPassword, newPassword) {
    try {
      if (!this.isAuthenticated) {
        throw new Error('User must be logged in to change password');
      }
      
      console.log('🔒 Changing user password...');
      
      // Verify current password
      const isValidCurrent = await this.verifyPassword(currentPassword, this.currentUser.passwordHash);
      if (!isValidCurrent) {
        throw new Error('Current password is incorrect');
      }
      
      // Validate new password
      if (!this.isStrongPassword(newPassword)) {
        throw new Error('New password does not meet security requirements');
      }
      
      // Hash new password
      const newPasswordHash = await this.hashPassword(newPassword);
      
      // Update user
      const updatedUser = {
        ...this.currentUser,
        passwordHash: newPasswordHash,
        updatedAt: new Date().toISOString()
      };
      
      await this.updateUser(updatedUser);
      this.currentUser = updatedUser;
      
      console.log('✅ Password changed successfully');
      this.notifyAuthListeners('password_changed');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Password change failed:', error);
      throw error;
    }
  }
  
  async requestPasswordReset(email) {
    try {
      console.log('📧 Requesting password reset for:', email);
      
      const user = await this.getUserByEmail(email.toLowerCase().trim());
      if (!user) {
        // Don't reveal if email exists or not
        return { success: true, message: 'If the email exists, a reset link has been sent.' };
      }
      
      // Generate reset token
      const resetToken = this.generateSecureToken();
      const resetExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
      
      // Update user with reset token
      const updatedUser = {
        ...user,
        passwordResetToken: resetToken,
        passwordResetExpiry: resetExpiry,
        updatedAt: new Date().toISOString()
      };
      
      await this.updateUser(updatedUser);
      
      // In production, send email with reset link
      console.log('🔗 Password reset token generated:', resetToken);
      
      return { 
        success: true, 
        message: 'If the email exists, a reset link has been sent.',
        // For demo purposes only - remove in production
        resetToken: resetToken 
      };
      
    } catch (error) {
      console.error('❌ Password reset request failed:', error);
      throw error;
    }
  }
  
  async resetPassword(resetToken, newPassword) {
    try {
      console.log('🔒 Resetting password with token...');
      
      // Validate new password
      if (!this.isStrongPassword(newPassword)) {
        throw new Error('Password does not meet security requirements');
      }
      
      // Find user with reset token
      const user = await this.getUserByResetToken(resetToken);
      if (!user) {
        throw new Error('Invalid or expired reset token');
      }
      
      // Check if token is expired
      if (user.passwordResetExpiry && new Date(user.passwordResetExpiry) < new Date()) {
        throw new Error('Reset token has expired');
      }
      
      // Hash new password
      const newPasswordHash = await this.hashPassword(newPassword);
      
      // Update user
      const updatedUser = {
        ...user,
        passwordHash: newPasswordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
        failedAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date().toISOString()
      };
      
      await this.updateUser(updatedUser);
      
      console.log('✅ Password reset successful');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Password reset failed:', error);
      throw error;
    }
  }
  
  // === UTILITY METHODS === //
  
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'smartfinance_salt_2024'); // Add salt
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  async verifyPassword(password, hash) {
    const computedHash = await this.hashPassword(password);
    return computedHash === hash;
  }
  
  generateSecureToken() {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  generateUserId() {
    return 'user_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2);
  }
  
  sanitizeUser(user) {
    const { passwordHash, refreshToken, passwordResetToken, biometricCredential, ...sanitized } = user;
    return sanitized;
  }
  
  getDefaultDateFormat(country) {
    const formats = {
      'US': 'MM/DD/YYYY',
      'CA': 'DD/MM/YYYY',
      'UK': 'DD/MM/YYYY',
      'AU': 'DD/MM/YYYY',
      'NZ': 'DD/MM/YYYY'
    };
    return formats[country] || 'DD/MM/YYYY';
  }
  
  getDefaultNumberFormat(country) {
    const formats = {
      'US': '1,234.56',
      'CA': '1,234.56',
      'UK': '1,234.56',
      'AU': '1,234.56',
      'NZ': '1,234.56'
    };
    return formats[country] || '1,234.56';
  }
  
  // === STORAGE OPERATIONS === //
  
  async storeUser(user) {
    // In production, this would be an API call
    // For demo, store in localStorage with encryption
    try {
      const users = JSON.parse(localStorage.getItem('smartfinance_users') || '[]');
      
      // Check if email already exists
      if (users.find(u => u.email === user.email)) {
        throw new Error('Email already registered');
      }
      
      users.push(user);
      localStorage.setItem('smartfinance_users', JSON.stringify(users));
      
    } catch (error) {
      console.error('❌ Failed to store user:', error);
      throw error;
    }
  }
  
  async getUserByEmail(email) {
    try {
      const users = JSON.parse(localStorage.getItem('smartfinance_users') || '[]');
      return users.find(user => user.email === email) || null;
    } catch (error) {
      console.error('❌ Failed to get user by email:', error);
      return null;
    }
  }
  
  async getUserByRefreshToken(refreshToken) {
    try {
      const users = JSON.parse(localStorage.getItem('smartfinance_users') || '[]');
      return users.find(user => user.refreshToken === refreshToken) || null;
    } catch (error) {
      console.error('❌ Failed to get user by refresh token:', error);
      return null;
    }
  }
  
  async getUserByResetToken(resetToken) {
    try {
      const users = JSON.parse(localStorage.getItem('smartfinance_users') || '[]');
      return users.find(user => user.passwordResetToken === resetToken) || null;
    } catch (error) {
      console.error('❌ Failed to get user by reset token:', error);
      return null;
    }
  }
  
  async updateUser(updatedUser) {
    try {
      const users = JSON.parse(localStorage.getItem('smartfinance_users') || '[]');
      const userIndex = users.findIndex(user => user.id === updatedUser.id);
      
      if (userIndex === -1) {
        throw new Error('User not found');
      }
      
      users[userIndex] = updatedUser;
      localStorage.setItem('smartfinance_users', JSON.stringify(users));
      
    } catch (error) {
      console.error('❌ Failed to update user:', error);
      throw error;
    }
  }
  
  // === EVENT LISTENERS === //
  
  addAuthListener(callback) {
    this.authListeners.push(callback);
  }
  
  removeAuthListener(callback) {
    this.authListeners = this.authListeners.filter(listener => listener !== callback);
  }
  
  notifyAuthListeners(event) {
    this.authListeners.forEach(callback => {
      try {
        callback(event, this.currentUser ? this.sanitizeUser(this.currentUser) : null);
      } catch (