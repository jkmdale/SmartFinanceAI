/**
 * SmartFinanceAI Multi-Tenant User Management System
 * Handles user operations, data isolation, and tenant management for global SaaS platform
 */

class UserManager {
    constructor() {
        this.version = '1.0.0';
        this.apiBaseUrl = this.getApiBaseUrl();
        this.encryptionKey = this.getEncryptionKey();
        this.currentUser = null;
        this.userSession = null;
        
        // Initialize user session on load
        this.initializeSession();
    }

    // === SESSION MANAGEMENT ===

    async initializeSession() {
        try {
            const savedAuth = localStorage.getItem('smartfinance_auth');
            const savedUser = localStorage.getItem('smartfinance_user');
            
            if (savedAuth && savedUser) {
                const authData = JSON.parse(savedAuth);
                const userData = JSON.parse(savedUser);
                
                // Check if token is still valid
                if (this.isTokenValid(authData.token)) {
                    this.currentUser = userData;
                    this.userSession = authData;
                    await this.validateSessionWithServer();
                } else {
                    await this.refreshToken();
                }
            }
        } catch (error) {
            console.error('[UserManager] Session initialization failed:', error);
            this.clearSession();
        }
    }

    isTokenValid(token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 > Date.now();
        } catch (error) {
            return false;
        }
    }

    async validateSessionWithServer() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/validate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.userSession.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Session validation failed');
            }

            const data = await response.json();
            this.updateUserData(data.user);
            
        } catch (error) {
            console.error('[UserManager] Session validation failed:', error);
            await this.refreshToken();
        }
    }

    async refreshToken() {
        try {
            const refreshToken = this.userSession?.refreshToken;
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await fetch(`${this.apiBaseUrl}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const data = await response.json();
            await this.updateSession(data);
            
        } catch (error) {
            console.error('[UserManager] Token refresh failed:', error);
            this.clearSession();
            this.redirectToLogin();
        }
    }

    // === USER REGISTRATION ===

    async registerUser(registrationData) {
        try {
            this.validateRegistrationData(registrationData);

            const response = await fetch(`${this.apiBaseUrl}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...registrationData,
                    timestamp: Date.now(),
                    userAgent: navigator.userAgent,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Registration failed');
            }

            const data = await response.json();
            
            // Store temporary registration data
            localStorage.setItem('smartfinance_registration_temp', JSON.stringify({
                userId: data.userId,
                email: registrationData.email,
                requiresVerification: data.requiresVerification
            }));

            return data;

        } catch (error) {
            console.error('[UserManager] Registration failed:', error);
            throw error;
        }
    }

    validateRegistrationData(data) {
        const required = ['email', 'password', 'firstName', 'lastName', 'country', 'currency'];
        const missing = required.filter(field => !data[field]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }

        if (!this.isValidEmail(data.email)) {
            throw new Error('Invalid email address');
        }

        if (!this.isValidPassword(data.password)) {
            throw new Error('Password does not meet security requirements');
        }

        if (!this.isSupportedCountry(data.country)) {
            throw new Error('Country not currently supported');
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPassword(password) {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    }

    isSupportedCountry(countryCode) {
        const supportedCountries = ['NZ', 'AU', 'US', 'GB', 'CA'];
        return supportedCountries.includes(countryCode);
    }

    // === EMAIL VERIFICATION ===

    async sendVerificationEmail(email) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/send-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                throw new Error('Failed to send verification email');
            }

            return await response.json();

        } catch (error) {
            console.error('[UserManager] Verification email failed:', error);
            throw error;
        }
    }

    async verifyEmail(token) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Email verification failed');
            }

            const data = await response.json();
            
            // Clear temporary registration data
            localStorage.removeItem('smartfinance_registration_temp');
            
            return data;

        } catch (error) {
            console.error('[UserManager] Email verification failed:', error);
            throw error;
        }
    }

    // === USER AUTHENTICATION ===

    async loginUser(credentials) {
        try {
            this.validateLoginCredentials(credentials);

            const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...credentials,
                    timestamp: Date.now(),
                    userAgent: navigator.userAgent,
                    deviceId: this.getDeviceId()
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Login failed');
            }

            const data = await response.json();
            await this.updateSession(data);
            
            // Track login analytics
            this.trackUserEvent('login', {
                method: credentials.method || 'password',
                country: this.currentUser.country,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            });

            return data;

        } catch (error) {
            console.error('[UserManager] Login failed:', error);
            throw error;
        }
    }

    validateLoginCredentials(credentials) {
        if (!credentials.email || !credentials.password) {
            throw new Error('Email and password are required');
        }

        if (!this.isValidEmail(credentials.email)) {
            throw new Error('Invalid email address');
        }
    }

    // === BIOMETRIC AUTHENTICATION ===

    async setupBiometricAuth() {
        try {
            if (!this.isBiometricSupported()) {
                throw new Error('Biometric authentication not supported');
            }

            if (!this.currentUser) {
                throw new Error('User must be logged in to setup biometric auth');
            }

            const credential = await navigator.credentials.create({
                publicKey: {
                    challenge: this.generateChallenge(),
                    rp: {
                        name: "SmartFinanceAI",
                        id: window.location.hostname
                    },
                    user: {
                        id: new TextEncoder().encode(this.currentUser.id),
                        name: this.currentUser.email,
                        displayName: `${this.currentUser.firstName} ${this.currentUser.lastName}`
                    },
                    pubKeyCredParams: [
                        { alg: -7, type: "public-key" },
                        { alg: -257, type: "public-key" }
                    ],
                    authenticatorSelection: {
                        authenticatorAttachment: "platform",
                        userVerification: "required",
                        requireResidentKey: false
                    },
                    timeout: 60000,
                    attestation: "direct"
                }
            });

            // Store biometric setup on server
            await this.storeBiometricCredential(credential);
            
            // Update local user data
            this.currentUser.biometricEnabled = true;
            this.updateUserData(this.currentUser);

            return true;

        } catch (error) {
            console.error('[UserManager] Biometric setup failed:', error);
            throw error;
        }
    }

    async authenticateWithBiometric(email = null) {
        try {
            if (!this.isBiometricSupported()) {
                throw new Error('Biometric authentication not supported');
            }

            const userEmail = email || this.currentUser?.email;
            if (!userEmail) {
                throw new Error('Email required for biometric authentication');
            }

            // Get challenge from server
            const challengeResponse = await fetch(`${this.apiBaseUrl}/auth/biometric-challenge`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail })
            });

            if (!challengeResponse.ok) {
                throw new Error('Failed to get biometric challenge');
            }

            const { challenge } = await challengeResponse.json();

            const assertion = await navigator.credentials.get({
                publicKey: {
                    challenge: new Uint8Array(challenge),
                    timeout: 60000,
                    userVerification: "required"
                }
            });

            // Verify assertion with server
            const verifyResponse = await fetch(`${this.apiBaseUrl}/auth/biometric-verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: userEmail,
                    assertion: {
                        id: assertion.id,
                        rawId: Array.from(new Uint8Array(assertion.rawId)),
                        response: {
                            authenticatorData: Array.from(new Uint8Array(assertion.response.authenticatorData)),
                            clientDataJSON: Array.from(new Uint8Array(assertion.response.clientDataJSON)),
                            signature: Array.from(new Uint8Array(assertion.response.signature))
                        }
                    }
                })
            });

            if (!verifyResponse.ok) {
                throw new Error('Biometric verification failed');
            }

            const data = await verifyResponse.json();
            await this.updateSession(data);

            this.trackUserEvent('biometric_login', {
                success: true,
                country: this.currentUser.country
            });

            return data;

        } catch (error) {
            console.error('[UserManager] Biometric authentication failed:', error);
            this.trackUserEvent('biometric_login', {
                success: false,
                error: error.message
            });
            throw error;
        }
    }

    isBiometricSupported() {
        return !!(
            'PublicKeyCredential' in window &&
            'credentials' in navigator &&
            typeof navigator.credentials.create === 'function'
        );
    }

    // === USER PROFILE MANAGEMENT ===

    async updateUserProfile(updates) {
        try {
            if (!this.currentUser) {
                throw new Error('User not logged in');
            }

            const response = await fetch(`${this.apiBaseUrl}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.userSession.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Profile update failed');
            }

            const updatedUser = await response.json();
            this.updateUserData(updatedUser);

            this.trackUserEvent('profile_update', {
                fields: Object.keys(updates),
                country: this.currentUser.country
            });

            return updatedUser;

        } catch (error) {
            console.error('[UserManager] Profile update failed:', error);
            throw error;
        }
    }

    async changePassword(currentPassword, newPassword) {
        try {
            if (!this.currentUser) {
                throw new Error('User not logged in');
            }

            if (!this.isValidPassword(newPassword)) {
                throw new Error('New password does not meet security requirements');
            }

            const response = await fetch(`${this.apiBaseUrl}/users/change-password`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.userSession.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Password change failed');
            }

            this.trackUserEvent('password_change', {
                country: this.currentUser.country
            });

            return await response.json();

        } catch (error) {
            console.error('[UserManager] Password change failed:', error);
            throw error;
        }
    }

    // === SUBSCRIPTION MANAGEMENT ===

    async getSubscriptionStatus() {
        try {
            if (!this.currentUser) {
                throw new Error('User not logged in');
            }

            const response = await fetch(`${this.apiBaseUrl}/users/subscription`, {
                headers: {
                    'Authorization': `Bearer ${this.userSession.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to get subscription status');
            }

            const subscription = await response.json();
            this.currentUser.subscription = subscription;
            this.updateUserData(this.currentUser);

            return subscription;

        } catch (error) {
            console.error('[UserManager] Subscription check failed:', error);
            return { tier: 'free', status: 'active' }; // Default fallback
        }
    }

    async upgradeSubscription(tier, paymentMethod = null) {
        try {
            if (!this.currentUser) {
                throw new Error('User not logged in');
            }

            const response = await fetch(`${this.apiBaseUrl}/users/subscription/upgrade`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.userSession.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tier,
                    paymentMethod,
                    currency: this.currentUser.currency,
                    country: this.currentUser.country
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Subscription upgrade failed');
            }

            const data = await response.json();
            
            // Update user subscription data
            this.currentUser.subscription = data.subscription;
            this.updateUserData(this.currentUser);

            this.trackUserEvent('subscription_upgrade', {
                fromTier: this.currentUser.subscription?.tier || 'free',
                toTier: tier,
                country: this.currentUser.country
            });

            return data;

        } catch (error) {
            console.error('[UserManager] Subscription upgrade failed:', error);
            throw error;
        }
    }

    // === FEATURE ACCESS CONTROL ===

    hasFeatureAccess(feature) {
        if (!this.currentUser?.subscription) {
            return this.getFreeFeatures().includes(feature);
        }

        const tier = this.currentUser.subscription.tier;
        const features = this.getFeaturesByTier(tier);
        return features.includes(feature);
    }

    getFreeFeatures() {
        return [
            'basic_budgeting',
            'manual_transactions',
            'basic_goals',
            'csv_import',
            'basic_reports',
            'mobile_app'
        ];
    }

    getPremiumFeatures() {
        return [
            ...this.getFreeFeatures(),
            'unlimited_goals',
            'ai_insights',
            'advanced_reports',
            'automatic_categorization',
            'bill_reminders',
            'investment_tracking',
            'couples_features',
            'data_export'
        ];
    }

    getProfessionalFeatures() {
        return [
            ...this.getPremiumFeatures(),
            'business_accounts',
            'tax_optimization',
            'api_access',
            'white_label',
            'priority_support',
            'advanced_analytics',
            'custom_categories'
        ];
    }

    getFeaturesByTier(tier) {
        switch (tier) {
            case 'professional':
                return this.getProfessionalFeatures();
            case 'premium':
                return this.getPremiumFeatures();
            case 'free':
            default:
                return this.getFreeFeatures();
        }
    }

    // === DATA ISOLATION & TENANT MANAGEMENT ===

    getTenantId() {
        return this.currentUser?.tenantId || this.currentUser?.id;
    }

    async getUserData(dataType) {
        try {
            if (!this.currentUser) {
                throw new Error('User not logged in');
            }

            const response = await fetch(`${this.apiBaseUrl}/users/data/${dataType}`, {
                headers: {
                    'Authorization': `Bearer ${this.userSession.token}`,
                    'X-Tenant-ID': this.getTenantId()
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to get ${dataType} data`);
            }

            return await response.json();

        } catch (error) {
            console.error(`[UserManager] Get ${dataType} data failed:`, error);
            return null;
        }
    }

    async saveUserData(dataType, data) {
        try {
            if (!this.currentUser) {
                throw new Error('User not logged in');
            }

            const response = await fetch(`${this.apiBaseUrl}/users/data/${dataType}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.userSession.token}`,
                    'Content-Type': 'application/json',
                    'X-Tenant-ID': this.getTenantId()
                },
                body: JSON.stringify({
                    data,
                    timestamp: Date.now()
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || `Failed to save ${dataType} data`);
            }

            return await response.json();

        } catch (error) {
            console.error(`[UserManager] Save ${dataType} data failed:`, error);
            throw error;
        }
    }

    // === FAMILY/COUPLES MANAGEMENT ===

    async inviteSpouse(email, permissions = {}) {
        try {
            if (!this.hasFeatureAccess('couples_features')) {
                throw new Error('Couples features require Premium subscription');
            }

            const response = await fetch(`${this.apiBaseUrl}/users/invite-spouse`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.userSession.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    permissions: {
                        viewAccounts: permissions.viewAccounts || false,
                        editBudget: permissions.editBudget || false,
                        manageGoals: permissions.manageGoals || false,
                        viewReports: permissions.viewReports || true,
                        ...permissions
                    }
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Spouse invitation failed');
            }

            this.trackUserEvent('spouse_invited', {
                country: this.currentUser.country
            });

            return await response.json();

        } catch (error) {
            console.error('[UserManager] Spouse invitation failed:', error);
            throw error;
        }
    }

    async acceptSpouseInvitation(invitationToken) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/users/accept-spouse-invitation`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.userSession.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ invitationToken })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to accept invitation');
            }

            const data = await response.json();
            this.updateUserData(data.user);

            this.trackUserEvent('spouse_invitation_accepted', {
                country: this.currentUser.country
            });

            return data;

        } catch (error) {
            console.error('[UserManager] Accept invitation failed:', error);
            throw error;
        }
    }

    // === ANALYTICS & TRACKING ===

    trackUserEvent(event, properties = {}) {
        try {
            const eventData = {
                userId: this.currentUser?.id,
                event,
                properties: {
                    ...properties,
                    timestamp: Date.now(),
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                    sessionId: this.userSession?.sessionId
                }
            };

            // Send to analytics service (non-blocking)
            fetch(`${this.apiBaseUrl}/analytics/track`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.userSession?.token}`
                },
                body: JSON.stringify(eventData)
            }).catch(error => {
                console.warn('[UserManager] Analytics tracking failed:', error);
            });

            // Also store locally for offline sync
            this.storeOfflineEvent(eventData);

        } catch (error) {
            console.warn('[UserManager] Event tracking failed:', error);
        }
    }

    storeOfflineEvent(eventData) {
        try {
            const offlineEvents = JSON.parse(localStorage.getItem('smartfinance_offline_events') || '[]');
            offlineEvents.push(eventData);
            
            // Keep only last 100 events
            if (offlineEvents.length > 100) {
                offlineEvents.splice(0, offlineEvents.length - 100);
            }
            
            localStorage.setItem('smartfinance_offline_events', JSON.stringify(offlineEvents));
        } catch (error) {
            console.warn('[UserManager] Offline event storage failed:', error);
        }
    }

    // === UTILITY METHODS ===

    async updateSession(sessionData) {
        this.currentUser = sessionData.user;
        this.userSession = {
            token: sessionData.token,
            refreshToken: sessionData.refreshToken,
            sessionId: sessionData.sessionId,
            expiresAt: sessionData.expiresAt,
            lastActive: Date.now()
        };

        // Store in localStorage
        localStorage.setItem('smartfinance_auth', JSON.stringify(this.userSession));
        localStorage.setItem('smartfinance_user', JSON.stringify(this.currentUser));

        // Update last active timestamp
        this.updateLastActive();
    }

    updateUserData(userData) {
        this.currentUser = { ...this.currentUser, ...userData };
        localStorage.setItem('smartfinance_user', JSON.stringify(this.currentUser));
    }

    updateLastActive() {
        if (this.userSession) {
            this.userSession.lastActive = Date.now();
            localStorage.setItem('smartfinance_auth', JSON.stringify(this.userSession));
        }
    }

    clearSession() {
        this.currentUser = null;
        this.userSession = null;
        localStorage.removeItem('smartfinance_auth');
        localStorage.removeItem('smartfinance_user');
        localStorage.removeItem('smartfinance_registration_temp');
    }

    redirectToLogin() {
        const currentPath = window.location.pathname;
        const loginUrl = '/auth/login.html';
        
        if (currentPath !== loginUrl) {
            window.location.href = loginUrl;
        }
    }

    getApiBaseUrl() {
        // In production, this would be your actual API URL
        return process.env.REACT_APP_API_URL || 'https://api.smartfinanceai.com';
    }

    getEncryptionKey() {
        // In production, this would be properly secured
        return process.env.REACT_APP_ENCRYPTION_KEY || 'fallback-key-for-development';
    }

    getDeviceId() {
        let deviceId = localStorage.getItem('smartfinance_device_id');
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('smartfinance_device_id', deviceId);
        }
        return deviceId;
    }

    generateChallenge() {
        return new Uint8Array(32);
    }

    async storeBiometricCredential(credential) {
        const response = await fetch(`${this.apiBaseUrl}/auth/biometric-store`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.userSession.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                credentialId: credential.id,
                publicKey: Array.from(new Uint8Array(credential.response.publicKey)),
                attestationObject: Array.from(new Uint8Array(credential.response.attestationObject))
            })
        });

        if (!response.ok) {
            throw new Error('Failed to store biometric credential');
        }
    }

    // === PUBLIC API ===

    getCurrentUser() {
        return this.currentUser;
    }

    getUserSession() {
        return this.userSession;
    }

    isLoggedIn() {
        return !!(this.currentUser && this.userSession && this.isTokenValid(this.userSession.token));
    }

    async logout() {
        try {
            if (this.userSession?.token) {
                // Notify server of logout
                await fetch(`${this.apiBaseUrl}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.userSession.token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.warn('[UserManager] Logout notification failed:', error);
        } finally {
            this.trackUserEvent('logout', {
                country: this.currentUser?.country
            });
            this.clearSession();
            this.redirectToLogin();
        }
    }
}

// Create global instance
window.UserManager = new UserManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserManager;
}

console.log('[UserManager] Multi-tenant user management system initialized');