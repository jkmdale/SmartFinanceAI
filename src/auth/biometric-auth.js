/**
 * SmartFinanceAI - Biometric Authentication System
 * WebAuthn implementation for secure biometric login
 */

class BiometricAuth {
    constructor() {
        this.isSupported = false;
        this.availableAuthenticators = [];
        this.registeredCredentials = [];
        this.rpId = window.location.hostname;
        this.rpName = 'SmartFinanceAI';
        
        this.init();
    }

    async init() {
        this.checkSupport();
        await this.loadRegisteredCredentials();
    }

    /**
     * Check if WebAuthn is supported on this device
     */
    checkSupport() {
        this.isSupported = !!(navigator.credentials && 
                             navigator.credentials.create && 
                             navigator.credentials.get &&
                             window.PublicKeyCredential);
        
        console.log('WebAuthn support:', this.isSupported);
        return this.isSupported;
    }

    /**
     * Get available authenticator types on this device
     */
    async getAvailableAuthenticators() {
        if (!this.isSupported) return [];

        const authenticators = [];

        try {
            // Check for platform authenticator (Face ID, Touch ID, Windows Hello)
            const platformAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            if (platformAvailable) {
                authenticators.push({
                    type: 'platform',
                    name: this.getPlatformAuthenticatorName(),
                    icon: this.getPlatformAuthenticatorIcon(),
                    attachment: 'platform'
                });
            }

            // Cross-platform authenticators (USB keys, etc.) are always potentially available
            authenticators.push({
                type: 'cross-platform',
                name: 'Security Key',
                icon: '🔑',
                attachment: 'cross-platform'
            });

        } catch (error) {
            console.error('Error checking authenticator availability:', error);
        }

        this.availableAuthenticators = authenticators;
        return authenticators;
    }

    /**
     * Get platform-specific authenticator name
     */
    getPlatformAuthenticatorName() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
            return 'Face ID / Touch ID';
        } else if (userAgent.includes('mac')) {
            return 'Touch ID';
        } else if (userAgent.includes('android')) {
            return 'Fingerprint / Face Unlock';
        } else if (userAgent.includes('windows')) {
            return 'Windows Hello';
        } else {
            return 'Biometric Authentication';
        }
    }

    /**
     * Get platform-specific authenticator icon
     */
    getPlatformAuthenticatorIcon() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('mac')) {
            return '👤'; // Face ID representation
        } else if (userAgent.includes('android')) {
            return '👆'; // Fingerprint representation
        } else if (userAgent.includes('windows')) {
            return '🔐'; // Windows Hello representation
        } else {
            return '🔒'; // Generic biometric
        }
    }

    /**
     * Register a new biometric credential
     */
    async register(userId, userEmail, userName) {
        if (!this.isSupported) {
            throw new Error('WebAuthn is not supported on this device');
        }

        try {
            // Generate challenge from server
            const challenge = await this.getRegistrationChallenge(userId);

            // Create credential options
            const createOptions = {
                challenge: this.base64ToArrayBuffer(challenge),
                rp: {
                    id: this.rpId,
                    name: this.rpName
                },
                user: {
                    id: this.stringToArrayBuffer(userId),
                    name: userEmail,
                    displayName: userName
                },
                pubKeyCredParams: [
                    { alg: -7, type: 'public-key' },  // ES256
                    { alg: -257, type: 'public-key' } // RS256
                ],
                authenticatorSelection: {
                    authenticatorAttachment: 'platform', // Prefer platform authenticators
                    userVerification: 'required',
                    requireResidentKey: false
                },
                timeout: 60000,
                attestation: 'direct'
            };

            // Create credential
            const credential = await navigator.credentials.create({
                publicKey: createOptions
            });

            // Process and store credential
            const credentialData = await this.processNewCredential(credential, userId);
            
            // Store locally for quick access
            await this.storeCredentialLocally(credentialData);

            return {
                success: true,
                credentialId: credentialData.id,
                authenticatorType: credentialData.authenticatorType
            };

        } catch (error) {
            console.error('Biometric registration failed:', error);
            throw this.handleWebAuthnError(error);
        }
    }

    /**
     * Authenticate using biometric credential
     */
    async authenticate(userId = null) {
        if (!this.isSupported) {
            throw new Error('WebAuthn is not supported on this device');
        }

        try {
            // Get authentication challenge from server
            const { challenge, allowCredentials } = await this.getAuthenticationChallenge(userId);

            // Create authentication options
            const getOptions = {
                challenge: this.base64ToArrayBuffer(challenge),
                allowCredentials: allowCredentials.map(cred => ({
                    id: this.base64ToArrayBuffer(cred.id),
                    type: 'public-key',
                    transports: cred.transports || ['internal', 'usb', 'nfc', 'ble']
                })),
                userVerification: 'required',
                timeout: 60000
            };

            // Get credential
            const assertion = await navigator.credentials.get({
                publicKey: getOptions
            });

            // Verify authentication with server
            const authResult = await this.verifyAuthentication(assertion);

            if (authResult.verified) {
                // Update last used timestamp
                await this.updateCredentialUsage(authResult.credentialId);
                
                return {
                    success: true,
                    userId: authResult.userId,
                    credentialId: authResult.credentialId,
                    sessionToken: authResult.sessionToken
                };
            } else {
                throw new Error('Authentication verification failed');
            }

        } catch (error) {
            console.error('Biometric authentication failed:', error);
            throw this.handleWebAuthnError(error);
        }
    }

    /**
     * Get registration challenge from server
     */
    async getRegistrationChallenge(userId) {
        const response = await fetch('/api/auth/webauthn/register/begin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId })
        });

        if (!response.ok) {
            throw new Error('Failed to get registration challenge');
        }

        const data = await response.json();
        return data.challenge;
    }

    /**
     * Get authentication challenge from server
     */
    async getAuthenticationChallenge(userId) {
        const response = await fetch('/api/auth/webauthn/authenticate/begin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId })
        });

        if (!response.ok) {
            throw new Error('Failed to get authentication challenge');
        }

        return await response.json();
    }

    /**
     * Process newly created credential
     */
    async processNewCredential(credential, userId) {
        const credentialData = {
            id: this.arrayBufferToBase64(credential.rawId),
            rawId: credential.rawId,
            type: credential.type,
            response: {
                attestationObject: this.arrayBufferToBase64(credential.response.attestationObject),
                clientDataJSON: this.arrayBufferToBase64(credential.response.clientDataJSON)
            },
            userId: userId,
            createdAt: new Date().toISOString()
        };

        // Send to server for verification and storage
        const response = await fetch('/api/auth/webauthn/register/complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentialData)
        });

        if (!response.ok) {
            throw new Error('Failed to register credential on server');
        }

        const result = await response.json();
        return {
            id: credentialData.id,
            authenticatorType: result.authenticatorType,
            userId: userId,
            createdAt: credentialData.createdAt
        };
    }

    /**
     * Verify authentication assertion with server
     */
    async verifyAuthentication(assertion) {
        const authData = {
            id: this.arrayBufferToBase64(assertion.rawId),
            rawId: assertion.rawId,
            type: assertion.type,
            response: {
                authenticatorData: this.arrayBufferToBase64(assertion.response.authenticatorData),
                clientDataJSON: this.arrayBufferToBase64(assertion.response.clientDataJSON),
                signature: this.arrayBufferToBase64(assertion.response.signature),
                userHandle: assertion.response.userHandle ? 
                    this.arrayBufferToBase64(assertion.response.userHandle) : null
            }
        };

        const response = await fetch('/api/auth/webauthn/authenticate/complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(authData)
        });

        if (!response.ok) {
            throw new Error('Authentication verification failed');
        }

        return await response.json();
    }

    /**
     * Store credential data locally for quick access
     */
    async storeCredentialLocally(credentialData) {
        try {
            const stored = JSON.parse(localStorage.getItem('smartfinance_credentials') || '[]');
            stored.push({
                id: credentialData.id,
                userId: credentialData.userId,
                authenticatorType: credentialData.authenticatorType,
                createdAt: credentialData.createdAt,
                lastUsed: null
            });
            localStorage.setItem('smartfinance_credentials', JSON.stringify(stored));
        } catch (error) {
            console.warn('Failed to store credential locally:', error);
        }
    }

    /**
     * Load registered credentials from local storage
     */
    async loadRegisteredCredentials() {
        try {
            const stored = localStorage.getItem('smartfinance_credentials');
            this.registeredCredentials = stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.warn('Failed to load local credentials:', error);
            this.registeredCredentials = [];
        }
    }

    /**
     * Update credential usage timestamp
     */
    async updateCredentialUsage(credentialId) {
        try {
            const stored = JSON.parse(localStorage.getItem('smartfinance_credentials') || '[]');
            const credIndex = stored.findIndex(cred => cred.id === credentialId);
            
            if (credIndex !== -1) {
                stored[credIndex].lastUsed = new Date().toISOString();
                localStorage.setItem('smartfinance_credentials', JSON.stringify(stored));
            }
        } catch (error) {
            console.warn('Failed to update credential usage:', error);
        }
    }

    /**
     * Get list of registered credentials for user
     */
    getRegisteredCredentials(userId = null) {
        if (userId) {
            return this.registeredCredentials.filter(cred => cred.userId === userId);
        }
        return this.registeredCredentials;
    }

    /**
     * Remove a registered credential
     */
    async removeCredential(credentialId) {
        try {
            // Remove from server
            const response = await fetch(`/api/auth/webauthn/credentials/${credentialId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Remove from local storage
                const stored = JSON.parse(localStorage.getItem('smartfinance_credentials') || '[]');
                const filtered = stored.filter(cred => cred.id !== credentialId);
                localStorage.setItem('smartfinance_credentials', JSON.stringify(filtered));
                
                // Update local array
                this.registeredCredentials = filtered;
                
                return true;
            }
        } catch (error) {
            console.error('Failed to remove credential:', error);
        }
        return false;
    }

    /**
     * Check if user has any registered credentials
     */
    hasRegisteredCredentials(userId = null) {
        const credentials = this.getRegisteredCredentials(userId);
        return credentials.length > 0;
    }

    /**
     * Handle WebAuthn errors with user-friendly messages
     */
    handleWebAuthnError(error) {
        let userMessage = 'Biometric authentication failed. Please try again.';
        
        if (error.name === 'NotSupportedError') {
            userMessage = 'Biometric authentication is not supported on this device.';
        } else if (error.name === 'NotAllowedError') {
            userMessage = 'Biometric authentication was cancelled or timed out.';
        } else if (error.name === 'InvalidStateError') {
            userMessage = 'This authenticator is already registered.';
        } else if (error.name === 'ConstraintError') {
            userMessage = 'The authenticator does not meet the security requirements.';
        } else if (error.name === 'NotReadableError') {
            userMessage = 'Unable to read from the authenticator.';
        } else if (error.name === 'SecurityError') {
            userMessage = 'Security error occurred during authentication.';
        } else if (error.name === 'AbortError') {
            userMessage = 'Authentication request was aborted.';
        } else if (error.name === 'NetworkError') {
            userMessage = 'Network error occurred. Please check your connection.';
        }

        return new Error(userMessage);
    }

    /**
     * Utility: Convert string to ArrayBuffer
     */
    stringToArrayBuffer(str) {
        const encoder = new TextEncoder();
        return encoder.encode(str);
    }

    /**
     * Utility: Convert ArrayBuffer to base64
     */
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Utility: Convert base64 to ArrayBuffer
     */
    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * Test biometric authentication
     */
    async testAuthentication() {
        if (!this.isSupported) {
            throw new Error('WebAuthn is not supported on this device');
        }

        try {
            // Simple test authentication without server verification
            const challenge = crypto.getRandomValues(new Uint8Array(32));
            
            const getOptions = {
                challenge: challenge,
                allowCredentials: [], // Allow any credential
                userVerification: 'required',
                timeout: 30000
            };

            await navigator.credentials.get({
                publicKey: getOptions
            });

            return { success: true, message: 'Biometric test completed successfully' };
        } catch (error) {
            throw this.handleWebAuthnError(error);
        }
    }

    /**
     * Get device biometric capabilities info
     */
    async getDeviceInfo() {
        const info = {
            webAuthnSupported: this.isSupported,
            availableAuthenticators: await this.getAvailableAuthenticators(),
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            registeredCredentials: this.registeredCredentials.length
        };

        if (this.isSupported) {
            try {
                info.platformAuthenticatorAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            } catch (error) {
                info.platformAuthenticatorAvailable = false;
            }
        }

        return info;
    }
}

/**
 * Biometric Setup Class for onboarding flow
 */
class BiometricSetup {
    constructor() {
        this.biometricAuth = new BiometricAuth();
        this.currentUser = null;
        this.setupStep = 1;
    }

    static async init() {
        const setup = new BiometricSetup();
        await setup.initialize();
        return setup;
    }

    async initialize() {
        await this.loadCurrentUser();
        await this.checkDeviceCapabilities();
        this.bindSetupEvents();
    }

    async loadCurrentUser() {
        // Get current user from session or local storage
        try {
            const userData = localStorage.getItem('smartfinance_user');
            if (userData) {
                this.currentUser = JSON.parse(userData);
            }
        } catch (error) {
            console.warn('Failed to load user data:', error);
        }
    }

    async checkDeviceCapabilities() {
        const deviceInfo = await this.biometricAuth.getDeviceInfo();
        
        if (!deviceInfo.webAuthnSupported) {
            this.showNoBiometricSupport();
            return;
        }

        if (deviceInfo.availableAuthenticators.length === 0) {
            this.showNoBiometricSupport();
            return;
        }

        this.displayAvailableAuthenticators(deviceInfo.availableAuthenticators);
        this.showBiometricSetup();
    }

    showBiometricSetup() {
        document.getElementById('biometric-support-check').style.display = 'none';
        document.getElementById('biometric-setup-section').style.display = 'block';
        this.startSetupProcess();
    }

    showNoBiometricSupport() {
        document.getElementById('biometric-support-check').style.display = 'none';
        document.getElementById('no-biometric-section').style.display = 'block';
        document.getElementById('skip-button').textContent = 'Continue';
    }

    displayAvailableAuthenticators(authenticators) {
        const container = document.getElementById('available-biometrics');
        container.innerHTML = '';

        authenticators.forEach(auth => {
            const authElement = document.createElement('div');
            authElement.className = 'biometric-typ