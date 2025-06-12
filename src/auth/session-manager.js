/**
 * SmartFinanceAI - Session Management System
 * Secure JWT token management with auto-refresh and multi-device support
 */

class SessionManager {
    constructor() {
        this.accessToken = null;
        this.refreshToken = null;
        this.user = null;
        this.sessionExpiry = null;
        this.refreshThreshold = 5 * 60 * 1000; // Refresh 5 minutes before expiry
        this.refreshTimer = null;
        this.deviceId = null;
        this.sessionId = null;
        
        this.init();
    }

    /**
     * Initialize session manager
     */
    async init() {
        await this.generateDeviceId();
        await this.loadStoredSession();
        this.setupAutoRefresh();
        this.setupVisibilityHandlers();
        this.setupStorageListeners();
    }

    /**
     * Generate unique device identifier
     */
    async generateDeviceId() {
        let storedDeviceId = localStorage.getItem('smartfinance_device_id');
        
        if (!storedDeviceId) {
            // Generate device fingerprint
            const fingerprint = await this.generateDeviceFingerprint();
            storedDeviceId = this.hashString(fingerprint);
            localStorage.setItem('smartfinance_device_id', storedDeviceId);
        }
        
        this.deviceId = storedDeviceId;
    }

    /**
     * Generate device fingerprint for identification
     */
    async generateDeviceFingerprint() {
        const components = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            navigator.hardwareConcurrency || 'unknown',
            navigator.platform
        ];

        // Add canvas fingerprint if available
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillText('SmartFinanceAI fingerprint', 2, 2);
            components.push(canvas.toDataURL());
        } catch (e) {
            components.push('canvas_unavailable');
        }

        return components.join('|');
    }

    /**
     * Hash string using crypto API
     */
    async hashString(str) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hash = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hash));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Load stored session from secure storage
     */
    async loadStoredSession() {
        try {
            const sessionData = localStorage.getItem('smartfinance_session');
            if (sessionData) {
                const session = JSON.parse(sessionData);
                
                // Verify session is still valid
                if (session.expiry && new Date(session.expiry) > new Date()) {
                    this.accessToken = session.accessToken;
                    this.refreshToken = session.refreshToken;
                    this.user = session.user;
                    this.sessionExpiry = new Date(session.expiry);
                    this.sessionId = session.sessionId;
                    
                    // Validate token with server
                    const isValid = await this.validateToken();
                    if (!isValid) {
                        await this.clearSession();
                    }
                } else {
                    // Session expired, try to refresh
                    if (session.refreshToken) {
                        this.refreshToken = session.refreshToken;
                        const refreshed = await this.refreshSession();
                        if (!refreshed) {
                            await this.clearSession();
                        }
                    } else {
                        await this.clearSession();
                    }
                }
            }
        } catch (error) {
            console.error('Error loading stored session:', error);
            await this.clearSession();
        }
    }

    /**
     * Create new session after successful authentication
     */
    async createSession(authResponse) {
        try {
            this.accessToken = authResponse.accessToken;
            this.refreshToken = authResponse.refreshToken;
            this.user = authResponse.user;
            this.sessionExpiry = new Date(authResponse.expiresAt);
            this.sessionId = authResponse.sessionId;

            // Store session data
            await this.storeSession();

            // Setup auto refresh
            this.setupAutoRefresh();

            // Track session creation
            this.trackSessionEvent('session_created', {
                userId: this.user.id,
                deviceId: this.deviceId,
                sessionId: this.sessionId
            });

            return true;
        } catch (error) {
            console.error('Error creating session:', error);
            return false;
        }
    }

    /**
     * Store session data securely
     */
    async storeSession() {
        try {
            const sessionData = {
                accessToken: this.accessToken,
                refreshToken: this.refreshToken,
                user: this.user,
                expiry: this.sessionExpiry?.toISOString(),
                sessionId: this.sessionId,
                deviceId: this.deviceId,
                lastActivity: new Date().toISOString()
            };

            localStorage.setItem('smartfinance_session', JSON.stringify(sessionData));
            
            // Also store user data separately for quick access
            localStorage.setItem('smartfinance_user', JSON.stringify(this.user));
            
        } catch (error) {
            console.error('Error storing session:', error);
            throw error;
        }
    }

    /**
     * Refresh session using refresh token
     */
    async refreshSession() {
        if (!this.refreshToken) {
            console.warn('No refresh token available');
            return false;
        }

        try {
            const response = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refreshToken: this.refreshToken,
                    deviceId: this.deviceId,
                    sessionId: this.sessionId
                })
            });

            if (response.ok) {
                const refreshData = await response.json();
                
                this.accessToken = refreshData.accessToken;
                this.sessionExpiry = new Date(refreshData.expiresAt);
                
                // Update refresh token if provided
                if (refreshData.refreshToken) {
                    this.refreshToken = refreshData.refreshToken;
                }

                await this.storeSession();
                this.setupAutoRefresh();

                // Track successful refresh
                this.trackSessionEvent('session_refreshed', {
                    userId: this.user?.id,
                    sessionId: this.sessionId
                });

                return true;
            } else {
                console.warn('Token refresh failed:', response.status);
                await this.clearSession();
                return false;
            }
        } catch (error) {
            console.error('Error refreshing session:', error);
            await this.clearSession();
            return false;
        }
    }

    /**
     * Validate current token with server
     */
    async validateToken() {
        if (!this.accessToken) return false;

        try {
            const response = await fetch('/api/auth/validate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    deviceId: this.deviceId,
                    sessionId: this.sessionId
                })
            });

            if (response.ok) {
                const validationData = await response.json();
                
                // Update user data if provided
                if (validationData.user) {
                    this.user = { ...this.user, ...validationData.user };
                    await this.storeSession();
                }

                return validationData.valid === true;
            }

            return false;
        } catch (error) {
            console.error('Error validating token:', error);
            return false;
        }
    }

    /**
     * Setup automatic token refresh
     */
    setupAutoRefresh() {
        // Clear existing timer
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }

        if (!this.sessionExpiry || !this.accessToken) {
            return;
        }

        const now = new Date().getTime();
        const expiryTime = this.sessionExpiry.getTime();
        const timeUntilRefresh = expiryTime - now - this.refreshThreshold;

        if (timeUntilRefresh > 0) {
            this.refreshTimer = setTimeout(async () => {
                console.log('Auto-refreshing session...');
                await this.refreshSession();
            }, timeUntilRefresh);
        } else {
            // Token expires soon, refresh immediately
            this.refreshSession();
        }
    }

    /**
     * Setup page visibility handlers to manage session
     */
    setupVisibilityHandlers() {
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // Page became visible, check session validity
                this.validateSessionOnFocus();
            }
        });

        // Handle page unload
        window.addEventListener('beforeunload', () => {
            this.updateLastActivity();
        });
    }

    /**
     * Setup storage event listeners for multi-tab session sync
     */
    setupStorageListeners() {
        window.addEventListener('storage', (event) => {
            if (event.key === 'smartfinance_session') {
                if (event.newValue === null) {
                    // Session was cleared in another tab
                    this.handleSessionCleared();
                } else {
                    // Session was updated in another tab
                    this.handleSessionUpdated(event.newValue);
                }
            }
        });
    }

    /**
     * Handle session validation when page gains focus
     */
    async validateSessionOnFocus() {
        if (this.accessToken) {
            const isValid = await this.validateToken();
            if (!isValid) {
                this.handleInvalidSession();
            } else {
                this.updateLastActivity();
            }
        }
    }

    /**
     * Handle session cleared in another tab
     */
    handleSessionCleared() {
        this.accessToken = null;
        this.refreshToken = null;
        this.user = null;
        this.sessionExpiry = null;
        this.sessionId = null;

        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }

        // Redirect to login if on protected page
        if (this.isProtectedPage()) {
            this.redirectToLogin('session_ended');
        }
    }

    /**
     * Handle session updated in another tab
     */
    handleSessionUpdated(newSessionData) {
        try {
            const session = JSON.parse(newSessionData);
            
            // Only update if it's a newer session
            const newExpiry = new Date(session.expiry);
            if (!this.sessionExpiry || newExpiry > this.sessionExpiry) {
                this.accessToken = session.accessToken;
                this.refreshToken = session.refreshToken;
                this.user = session.user;
                this.sessionExpiry = newExpiry;
                this.sessionId = session.sessionId;
                
                this.setupAutoRefresh();
            }
        } catch (error) {
            console.error('Error handling session update:', error);
        }
    }

    /**
     * Clear session data and logout
     */
    async clearSession(reason = 'logout') {
        try {
            // Notify server about session termination
            if (this.accessToken && this.sessionId) {
                await this.notifySessionEnd(reason);
            }

            // Clear local data
            this.accessToken = null;
            this.refreshToken = null;
            this.user = null;
            this.sessionExpiry = null;
            this.sessionId = null;

            // Clear timers
            if (this.refreshTimer) {
                clearTimeout(this.refreshTimer);
                this.refreshTimer = null;
            }

            // Clear storage
            localStorage.removeItem('smartfinance_session');
            localStorage.removeItem('smartfinance_user');

            // Track session end
            this.trackSessionEvent('session_ended', {
                reason: reason,
                deviceId: this.deviceId
            });

        } catch (error) {
            console.error('Error clearing session:', error);
        }
    }

    /**
     * Notify server about session termination
     */
    async notifySessionEnd(reason) {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    deviceId: this.deviceId,
                    reason: reason
                })
            });
        } catch (error) {
            console.warn('Failed to notify server about session end:', error);
        }
    }

    /**
     * Update last activity timestamp
     */
    updateLastActivity() {
        if (this.accessToken) {
            const sessionData = localStorage.getItem('smartfinance_session');
            if (sessionData) {
                try {
                    const session = JSON.parse(sessionData);
                    session.lastActivity = new Date().toISOString();
                    localStorage.setItem('smartfinance_session', JSON.stringify(session));
                } catch (error) {
                    console.warn('Failed to update last activity:', error);
                }
            }
        }
    }

    /**
     * Get current user data
     */
    getCurrentUser() {
        return this.user;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!(this.accessToken && this.sessionExpiry && this.sessionExpiry > new Date());
    }

    /**
     * Get access token for API requests
     */
    getAccessToken() {
        if (this.isAuthenticated()) {
            return this.accessToken;
        }
        return null;
    }

    /**
     * Get session information
     */
    getSessionInfo() {
        return {
            isAuthenticated: this.isAuthenticated(),
            user: this.user,
            sessionId: this.sessionId,
            deviceId: this.deviceId,
            expiresAt: this.sessionExpiry,
            timeUntilExpiry: this.sessionExpiry ? this.sessionExpiry.getTime() - new Date().getTime() : 0
        };
    }

    /**
     * Check if current page requires authentication
     */
    isProtectedPage() {
        const protectedPaths = [
            '/core/',
            '/dashboard',
            '/accounts',
            '/transactions',
            '/budget',
            '/goals',
            '/reports',
            '/settings'
        ];

        const currentPath = window.location.pathname;
        return protectedPaths.some(path => currentPath.includes(path));
    }

    /**
     * Handle invalid session
     */
    handleInvalidSession() {
        this.clearSession('invalid_token');
        
        if (this.isProtectedPage()) {
            this.redirectToLogin('session_invalid');
        }
    }

    /**
     * Redirect to login page
     */
    redirectToLogin(reason = 'auth_required') {
        const loginUrl = `/auth/login.html?reason=${reason}&redirect=${encodeURIComponent(window.location.pathname)}`;
        window.location.href = loginUrl;
    }

    /**
     * Create authenticated fetch wrapper
     */
    createAuthenticatedFetch() {
        return async (url, options = {}) => {
            const token = this.getAccessToken();
            
            if (!token) {
                throw new Error('No valid authentication token');
            }

            const authOptions = {
                ...options,
                headers: {
                    ...options.headers,
                    'Authorization': `Bearer ${token}`,
                    'X-Device-ID': this.deviceId,
                    'X-Session-ID': this.sessionId
                }
            };

            const response = await fetch(url, authOptions);

            // Handle token expiry
            if (response.status === 401) {
                const refreshed = await this.refreshSession();
                if (refreshed) {
                    // Retry with new token
                    authOptions.headers['Authorization'] = `Bearer ${this.getAccessToken()}`;
                    return await fetch(url, authOptions);
                } else {
                    this.handleInvalidSession();
                    throw new Error('Authentication failed');
                }
            }

            return response;
        };
    }

    /**
     * Track session events for analytics
     */
    trackSessionEvent(eventType, data = {}) {
        try {
            // Send to analytics service
            if (window.analytics && typeof window.analytics.track === 'function') {
                window.analytics.track(eventType, {
                    ...data,
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent,
                    sessionDuration: this.getSessionDuration()
                });
            }
        } catch (error) {
            console.warn('Failed to track session event:', error);
        }
    }

    /**
     * Get current session duration
     */
    getSessionDuration() {
        if (!this.sessionExpiry) return 0;
        
        const sessionData = localStorage.getItem('smartfinance_session');
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                const sessionStart = new Date(session.expiry).getTime() - (24 * 60 * 60 * 1000); // Assuming 24h session
                return new Date().getTime() - sessionStart;
            } catch (error) {
                return 0;
            }
        }
        return 0;
    }

    /**
     * Get device sessions (for security page)
     */
    async getDeviceSessions() {
        const token = this.getAccessToken();
        if (!token) return [];

        try {
            const response = await fetch('/api/auth/sessions', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Failed to get device sessions:', error);
        }

        return [];
    }

    /**
     * Revoke session on specific device
     */
    async revokeSession(sessionId) {
        const token = this.getAccessToken();
        if (!token) return false;

        try {
            const response = await fetch(`/api/auth/sessions/${sessionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return response.ok;
        } catch (error) {
            console.error('Failed to revoke session:', error);
            return false;
        }
    }

    /**
     * Update session settings
     */
    async updateSessionSettings(settings) {
        const token = this.getAccessToken();
        if (!token) return false;

        try {
            const response = await fetch('/api/auth/session-settings', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });

            return response.ok;
        } catch (error) {
            console.error('Failed to update session settings:', error);
            return false;
        }
    }
}

/**
 * Session middleware for protecting pages
 */
class SessionGuard {
    constructor(sessionManager) {
        this.sessionManager = sessionManager;
    }

    /**
     * Protect current page - redirect if not authenticated
     */
    async protectPage() {
        if (!this.sessionManager.isAuthenticated()) {
            this.sessionManager.redirectToLogin();
            return false;
        }

        // Validate token with server
        const isValid = await this.sessionManager.validateToken();
        if (!isValid) {
            this.sessionManager.handleInvalidSession();
            return false;
        }

        return true;
    }

    /**
     * Require specific permissions
     */
    requirePermissions(permissions) {
        const user = this.sessionManager.getCurrentUser();
        if (!user || !user.permissions) {
            return false;
        }

        return permissions.every(permission => 
            user.permissions.includes(permission)
        );
    }

    /**
     * Require specific subscription tier
     */
    requireSubscription(tier) {
        const user = this.sessionManager.getCurrentUser();
        if (!user || !user.subscription) {
            return false;
        }

        const tierLevels = {
            'free': 0,
            'premium': 1,
            'professional': 2
        };

        const userLevel = tierLevels[user.subscription.tier] || 0;
        const requiredLevel = tierLevels[tier] || 0;

        return userLevel >= requiredLevel;
    }
}

// Create global session manager instance
const sessionManager = new SessionManager();
const sessionGuard = new SessionGuard(sessionManager);

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SessionManager, SessionGuard };
}

// Global access
window.sessionManager = sessionManager;
window.sessionGuard = sessionGuard;

// Auto-protect pages that require authentication
document.addEventListener('DOMContentLoaded', async () => {
    if (sessionManager.isProtectedPage()) {
        const isProtected = await sessionGuard.protectPage();
        if (isProtected) {
            // Update last activity
            sessionManager.updateLastActivity();
            
            // Setup activity tracking
            ['click', 'keypress', 'scroll', 'mousemove'].forEach(event => {
                document.addEventListener(event, () => {
                    sessionManager.updateLastActivity();
                }, { passive: true, capture: false });
            });
        }
    }
});