// src/auth/auth-manager.js - Real Authentication Manager
export class AuthManager {
    constructor() {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.sessionExpiry = null;
        this.biometricManager = new BiometricManager();
        
        this.init();
    }
    
    init() {
        // Check existing session on startup
        this.checkExistingSession();
        
        // Set up form handlers if on login page
        this.setupLoginForm();
        
        console.log('🔐 AuthManager initialized');
    }
    
    checkExistingSession() {
        const session = localStorage.getItem('smartfinance_session');
        const expiry = localStorage.getItem('smartfinance_session_expiry');
        
        if (session && expiry) {
            try {
                const userData = JSON.parse(session);
                const expiryDate = new Date(expiry);
                const now = new Date();
                
                if (now < expiryDate) {
                    this.setAuthenticatedUser(userData);
                    return true;
                } else {
                    this.clearSession();
                }
            } catch (error) {
                console.error('Session validation error:', error);
                this.clearSession();
            }
        }
        
        return false;
    }
    
    setupLoginForm() {
        const loginForm = document.getElementById('login-form');
        const biometricButton = document.getElementById('biometric-login');
        const demoButton = document.getElementById('demo-login');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        if (biometricButton) {
            biometricButton.addEventListener('click', () => this.handleBiometricLogin());
        }
        
        if (demoButton) {
            demoButton.addEventListener('click', () => this.handleDemoLogin());
        }
    }
    
    async handleLogin(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const email = formData.get('email').trim();
        const password = formData.get('password');
        const remember = formData.get('remember') === 'on';
        
        // Validate inputs
        if (!this.validateEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }
        
        if (!password || password.length < 8) {
            this.showError('Password must be at least 8 characters long');
            return;
        }
        
        // Show loading state
        this.setLoginLoading(true);
        
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Validate credentials
            const isValid = await this.validateCredentials(email, password);
            
            if (isValid) {
                // Create user session
                const userData = {
                    email: email,
                    name: this.extractNameFromEmail(email),
                    loginMethod: 'password',
                    isDemo: email.includes('demo'),
                    preferences: {
                        currency: 'USD',
                        theme: 'dark',
                        notifications: true
                    }
                };
                
                // Save session
                this.createSession(userData, remember);
                
                // Set authenticated state
                this.setAuthenticatedUser(userData);
                
                // Show success and redirect
                this.showSuccess('Login successful! Welcome back!');
                
                setTimeout(() => {
                    window.app?.router?.navigate('/dashboard');
                }, 1500);
                
            } else {
                this.showError('Invalid email or password. Please try again.');
            }
            
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Login failed. Please try again.');
        } finally {
            this.setLoginLoading(false);
        }
    }
    
    async handleBiometricLogin() {
        try {
            this.setBiometricLoading(true);
            
            const result = await this.biometricManager.authenticate();
            
            if (result.success) {
                // Get stored user data for biometric login
                const storedUser = localStorage.getItem('smartfinance_biometric_user');
                
                if (storedUser) {
                    const userData = JSON.parse(storedUser);
                    userData.loginMethod = 'biometric';
                    
                    this.createSession(userData, true);
                    this.setAuthenticatedUser(userData);
                    
                    this.showSuccess('Biometric authentication successful!');
                    
                    setTimeout(() => {
                        window.app?.router?.navigate('/dashboard');
                    }, 1500);
                } else {
                    this.showError('No biometric account found. Please log in with password first.');
                }
            } else {
                this.showError(result.error || 'Biometric authentication failed');
            }
            
        } catch (error) {
            console.error('Biometric login error:', error);
            this.showError('Biometric authentication unavailable');
        } finally {
            this.setBiometricLoading(false);
        }
    }
    
    handleDemoLogin() {
        const demoUser = {
            email: 'demo@smartfinanceai.com',
            name: 'Demo User',
            loginMethod: 'demo',
            isDemo: true,
            preferences: {
                currency: 'USD',
                theme: 'dark',
                notifications: false
            }
        };
        
        this.createSession(demoUser, false);
        this.setAuthenticatedUser(demoUser);
        
        this.showSuccess('Demo mode activated! Exploring with sample data.');
        
        setTimeout(() => {
            window.app?.router?.navigate('/dashboard');
        }, 1500);
    }
    
    async validateCredentials(email, password) {
        // Demo credentials for testing
        const validCredentials = [
            { email: 'demo@smartfinanceai.com', password: 'demo123456' },
            { email: 'test@example.com', password: 'password123' },
            { email: 'user@smartfinanceai.com', password: 'smartfinance123' },
            { email: 'admin@smartfinanceai.com', password: 'admin123456' }
        ];
        
        // In a real app, this would be an API call
        return validCredentials.some(cred => 
            cred.email.toLowerCase() === email.toLowerCase() && 
            cred.password === password
        );
    }
    
    createSession(userData, remember = false) {
        const session = {
            ...userData,
            loginTime: new Date().toISOString(),
            sessionId: this.generateSessionId(),
            remember: remember
        };
        
        // Store session
        localStorage.setItem('smartfinance_session', JSON.stringify(session));
        
        // Set expiry based on remember me
        const expiry = new Date();
        if (remember) {
            expiry.setDate(expiry.getDate() + 30); // 30 days
        } else {
            expiry.setHours(expiry.getHours() + 24); // 24 hours
        }
        
        localStorage.setItem('smartfinance_session_expiry', expiry.toISOString());
        
        // Store user for biometric login if not demo
        if (!userData.isDemo) {
            localStorage.setItem('smartfinance_biometric_user', JSON.stringify(userData));
        }
        
        // Save email for remember me
        if (remember) {
            localStorage.setItem('smartfinance_remember_email', userData.email);
        }
    }
    
    setAuthenticatedUser(userData) {
        this.isAuthenticated = true;
        this.currentUser = userData;
        
        // Dispatch authentication event
        window.dispatchEvent(new CustomEvent('smartfinance:auth-changed', {
            detail: {
                isAuthenticated: true,
                user: userData
            }
        }));
        
        console.log('✅ User authenticated:', userData.email);
    }
    
    logout() {
        // Clear session data
        this.clearSession();
        
        // Reset state
        this.isAuthenticated = false;
        this.currentUser = null;
        
        // Dispatch authentication event
        window.dispatchEvent(new CustomEvent('smartfinance:auth-changed', {
            detail: {
                isAuthenticated: false,
                user: null
            }
        }));
        
        // Show logout message
        this.showSuccess('Signed out successfully!');
        
        // Redirect to login
        setTimeout(() => {
            window.app?.router?.navigate('/auth/login');
        }, 1000);
        
        console.log('👋 User logged out');
    }
    
    clearSession() {
        localStorage.removeItem('smartfinance_session');
        localStorage.removeItem('smartfinance_session_expiry');
        // Keep biometric user data and remember email for convenience
    }
    
    // Utility methods
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    extractNameFromEmail(email) {
        const name = email.split('@')[0];
        return name.charAt(0).toUpperCase() + name.slice(1);
    }
    
    generateSessionId() {
        return 'sess_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
    
    // UI helper methods
    setLoginLoading(loading) {
        const button = document.getElementById('login-button');
        const text = document.getElementById('login-text');
        
        if (button && text) {
            button.disabled = loading;
            if (loading) {
                button.classList.add('loading');
                text.textContent = '';
            } else {
                button.classList.remove('loading');
                text.textContent = 'Sign In';
            }
        }
    }
    
    setBiometricLoading(loading) {
        const button = document.getElementById('biometric-login');
        const text = document.getElementById('biometric-text');
        
        if (button && text) {
            button.disabled = loading;
            text.textContent = loading ? 'Authenticating...' : 'Sign in with Face ID / Fingerprint';
        }
    }
    
    showError(message) {
        this.showAlert(message, 'error');
    }
    
    showSuccess(message) {
        this.showAlert(message, 'success');
    }
    
    showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alert-container');
        if (!alertContainer) return;
        
        alertContainer.innerHTML = '';
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        
        alertContainer.appendChild(alert);
        
        // Auto-remove after delay
        const timeout = type === 'error' ? 8000 : 5000;
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, timeout);
    }
}

// Biometric Authentication Manager
export class BiometricManager {
    constructor() {
        this.isSupported = false;
        this.checkSupport();
    }
    
    async checkSupport() {
        try {
            if (window.PublicKeyCredential && 
                PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
                
                this.isSupported = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            }
        } catch (error) {
            console.log('Biometric support check failed:', error);
            this.isSupported = false;
        }
        
        return this.isSupported;
    }
    
    async authenticate() {
        if (!this.isSupported) {
            return { success: false, error: 'Biometric authentication not supported' };
        }
        
        try {
            const credentialRequestOptions = {
                publicKey: {
                    challenge: new Uint8Array(32),
                    allowCredentials: [{
                        id: new Uint8Array(32),
                        type: 'public-key',
                        transports: ['internal']
                    }],
                    timeout: 60000,
                    userVerification: 'required'
                }
            };
            
            const credential = await navigator.credentials.get(credentialRequestOptions);
            
            if (credential) {
                return { success: true, credential: credential };
            } else {
                return { success: false, error: 'Authentication failed' };
            }
            
        } catch (error) {
            let errorMessage = 'Biometric authentication failed';
            
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Authentication was cancelled or failed';
            } else if (error.name === 'InvalidStateError') {
                errorMessage = 'Please set up biometric authentication in your device settings first';
            }
            
            return { success: false, error: errorMessage };
        }
    }
    
    async register(userInfo) {
        if (!this.isSupported) {
            return { success: false, error: 'Biometric authentication not supported' };
        }
        
        try {
            const credential = await navigator.credentials.create({
                publicKey: {
                    challenge: new Uint8Array(32),
                    rp: {
                        name: "SmartFinanceAI",
                        id: window.location.hostname,
                    },
                    user: {
                        id: new TextEncoder().encode(userInfo.email),
                        name: userInfo.email,
                        displayName: userInfo.name || "SmartFinanceAI User",
                    },
                    pubKeyCredParams: [{alg: -7, type: "public-key"}],
                    authenticatorSelection: {
                        authenticatorAttachment: "platform",
                        userVerification: "required"
                    },
                    timeout: 60000,
                    attestation: "direct"
                }
            });
            
            if (credential) {
                // Store credential info
                localStorage.setItem('smartfinance_biometric_id', credential.id);
                return { success: true, credential: credential };
            }
            
        } catch (error) {
            console.error('Biometric registration error:', error);
            return { success: false, error: 'Failed to register biometric authentication' };
        }
    }
}

// Registration Manager
export class RegistrationManager {
    constructor() {
        this.setupRegistrationForm();
    }
    
    setupRegistrationForm() {
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegistration(e));
        }
    }
    
    async handleRegistration(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const name = formData.get('name').trim();
        const email = formData.get('email').trim();
        const password = formData.get('password');
        
        // Validation
        if (!name || name.length < 2) {
            this.showError('Please enter your full name');
            return;
        }
        
        if (!this.validateEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }
        
        if (!password || password.length < 8) {
            this.showError('Password must be at least 8 characters long');
            return;
        }
        
        // Check if user already exists
        if (this.userExists(email)) {
            this.showError('An account with this email already exists');
            return;
        }
        
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Store user data
            const userData = {
                name: name,
                email: email,
                registrationDate: new Date().toISOString(),
                preferences: {
                    currency: 'USD',
                    theme: 'dark',
                    notifications: true
                }
            };
            
            localStorage.setItem('smartfinance_user_' + email, JSON.stringify(userData));
            
            this.showSuccess('Account created successfully! Redirecting to login...');
            
            setTimeout(() => {
                window.app?.router?.navigate('/auth/login');
            }, 2000);
            
        } catch (error) {
            console.error('Registration error:', error);
            this.showError('Registration failed. Please try again.');
        }
    }
    
    userExists(email) {
        return localStorage.getItem('smartfinance_user_' + email) !== null;
    }
    
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    showError(message) {
        this.showAlert(message, 'error');
    }
    
    showSuccess(message) {
        this.showAlert(message, 'success');
    }
    
    showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alert-container');
        if (!alertContainer) return;
        
        alertContainer.innerHTML = '';
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        
        alertContainer.appendChild(alert);
        
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, type === 'error' ? 8000 : 5000);
    }
}

// Auto-initialize based on current page
document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('login') || currentPath === '/') {
        new AuthManager();
    } else if (currentPath.includes('register')) {
        new RegistrationManager();
    }
});

export default AuthManager;