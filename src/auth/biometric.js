// SmartFinanceAI Biometric Authentication Module
// File: src/auth/biometric.js

/**
 * Biometric Authentication Class
 * Handles WebAuthn-based biometric authentication (Face ID, Touch ID, Fingerprint, etc.)
 */
class BiometricAuth {
    constructor() {
        this.isSupported = this.checkSupport()
        this.credentialStorageKey = 'smartfinance_biometric_setup'
        this.credentialIdKey = 'smartfinance_credential_id'
        this.userEmailKey = 'smartfinance_user_email'
    }
    
    /**
     * Check if biometric authentication is supported
     */
    checkSupport() {
        if (!window.PublicKeyCredential) {
            console.warn('WebAuthn not supported in this browser')
            return false
        }
        
        return true
    }
    
    /**
     * Set up biometric authentication for a user
     */
    async setup(user) {
        if (!this.isSupported) {
            throw new Error('Biometric authentication not supported on this device')
        }
        
        if (!user || !user.id || !user.email) {
            throw new Error('Valid user object required for biometric setup')
        }
        
        try {
            console.log('Setting up biometric authentication for user:', user.email)
            
            // Generate a random challenge
            const challenge = crypto.getRandomValues(new Uint8Array(32))
            
            // Create the credential
            const credential = await navigator.credentials.create({
                publicKey: {
                    challenge: challenge,
                    rp: {
                        name: "SmartFinanceAI",
                        id: window.location.hostname,
                    },
                    user: {
                        id: new TextEncoder().encode(user.id),
                        name: user.email,
                        displayName: user.email.split('@')[0],
                    },
                    pubKeyCredParams: [
                        { alg: -7, type: "public-key" },  // ES256
                        { alg: -257, type: "public-key" } // RS256
                    ],
                    authenticatorSelection: {
                        authenticatorAttachment: "platform", // Built-in authenticator
                        userVerification: "required",
                        residentKey: "preferred"
                    },
                    timeout: 60000,
                    attestation: "direct"
                }
            })
            
            if (!credential) {
                throw new Error('Failed to create biometric credential')
            }
            
            // Store setup information securely
            const credentialData = {
                id: credential.id,
                rawId: Array.from(new Uint8Array(credential.rawId)),
                type: credential.type,
                userEmail: user.email,
                userId: user.id,
                setupDate: new Date().toISOString(),
                deviceInfo: this.getDeviceInfo()
            }
            
            localStorage.setItem(this.credentialStorageKey, 'true')
            localStorage.setItem(this.credentialIdKey, credential.id)
            localStorage.setItem(this.userEmailKey, user.email)
            
            // Store detailed credential data (encrypted in production)
            localStorage.setItem('smartfinance_credential_data', JSON.stringify(credentialData))
            
            console.log('Biometric authentication setup successful')
            return credential
            
        } catch (error) {
            console.error('Biometric setup failed:', error)
            
            // Clean up any partial setup
            this.clearSetup()
            
            // Provide user-friendly error messages
            if (error.name === 'NotAllowedError') {
                throw new Error('Biometric setup was cancelled or not allowed')
            } else if (error.name === 'NotSupportedError') {
                throw new Error('Biometric authentication not supported on this device')
            } else if (error.name === 'SecurityError') {
                throw new Error('Security error during biometric setup')
            } else if (error.name === 'InvalidStateError') {
                throw new Error('Biometric authenticator already registered')
            } else {
                throw new Error(`Biometric setup failed: ${error.message}`)
            }
        }
    }
    
    /**
     * Authenticate using biometric
     */
    async authenticate() {
        if (!this.isSupported) {
            throw new Error('Biometric authentication not supported')
        }
        
        if (!this.hasSetup()) {
            throw new Error('Biometric authentication not set up')
        }
        
        try {
            const credentialId = localStorage.getItem(this.credentialIdKey)
            const userEmail = localStorage.getItem(this.userEmailKey)
            
            if (!credentialId || !userEmail) {
                throw new Error('Invalid biometric setup data')
            }
            
            console.log('Attempting biometric authentication for:', userEmail)
            
            // Generate a random challenge
            const challenge = crypto.getRandomValues(new Uint8Array(32))
            
            // Request biometric authentication
            const assertion = await navigator.credentials.get({
                publicKey: {
                    challenge: challenge,
                    allowCredentials: [{
                        id: Uint8Array.from(atob(credentialId), c => c.charCodeAt(0)),
                        type: 'public-key'
                    }],
                    userVerification: "required",
                    timeout: 60000
                }
            })
            
            if (!assertion) {
                throw new Error('Biometric authentication failed')
            }
            
            console.log('Biometric authentication successful')
            
            // Update last used time
            this.updateLastUsed()
            
            return {
                assertion,
                userEmail
            }
            
        } catch (error) {
            console.error('Biometric authentication failed:', error)
            
            if (error.name === 'NotAllowedError') {
                throw new Error('Biometric authentication was cancelled')
            } else if (error.name === 'SecurityError') {
                throw new Error('Security error during biometric authentication')
            } else if (error.name === 'InvalidStateError') {
                throw new Error('Invalid biometric state')
            } else {
                throw new Error(`Biometric authentication failed: ${error.message}`)
            }
        }
    }
    
    /**
     * Check if biometric setup exists
     */
    hasSetup() {
        return localStorage.getItem(this.credentialStorageKey) === 'true' &&
               localStorage.getItem(this.credentialIdKey) &&
               localStorage.getItem(this.userEmailKey)
    }
    
    /**
     * Clear biometric setup
     */
    clearSetup() {
        localStorage.removeItem(this.credentialStorageKey)
        localStorage.removeItem(this.credentialIdKey)
        localStorage.removeItem(this.userEmailKey)
        localStorage.removeItem('smartfinance_credential_data')
        console.log('Biometric setup cleared')
    }
    
    /**
     * Update last used timestamp
     */
    updateLastUsed() {
        const credentialData = localStorage.getItem('smartfinance_credential_data')
        if (credentialData) {
            try {
                const data = JSON.parse(credentialData)
                data.lastUsed = new Date().toISOString()
                localStorage.setItem('smartfinance_credential_data', JSON.stringify(data))
            } catch (error) {
                console.warn('Failed to update last used timestamp:', error)
            }
        }
    }
    
    /**
     * Get device-specific information for display
     */
    getDeviceInfo() {
        const userAgent = navigator.userAgent.toLowerCase()
        
        // iOS devices
        if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
            if (userAgent.includes('version/17') || userAgent.includes('version/16')) {
                return {
                    text: '📱 Face ID and Touch ID supported on this device',
                    icon: '📱',
                    type: 'ios'
                }
            }
            return {
                text: '📱 Touch ID supported on this device', 
                icon: '📱',
                type: 'ios'
            }
        }
        
        // Android devices
        if (userAgent.includes('android')) {
            return {
                text: '📱 Fingerprint and face unlock supported',
                icon: '📱', 
                type: 'android'
            }
        }
        
        // macOS
        if (userAgent.includes('mac')) {
            return {
                text: '💻 Touch ID supported on this Mac',
                icon: '💻',
                type: 'mac'
            }
        }
        
        // Windows
        if (userAgent.includes('windows')) {
            return {
                text: '💻 Windows Hello supported',
                icon: '💻',
                type: 'windows'
            }
        }
        
        // Generic
        return {
            text: '🔐 Biometric authentication available',
            icon: '🔐',
            type: 'generic'
        }
    }
    
    /**
     * Get setup statistics
     */
    getSetupInfo() {
        if (!this.hasSetup()) {
            return null
        }
        
        try {
            const credentialData = localStorage.getItem('smartfinance_credential_data')
            if (credentialData) {
                return JSON.parse(credentialData)
            }
        } catch (error) {
            console.warn('Failed to parse credential data:', error)
        }
        
        return {
            userEmail: localStorage.getItem(this.userEmailKey),
            setupDate: 'Unknown',
            lastUsed: 'Unknown',
            deviceInfo: this.getDeviceInfo()
        }
    }
}

// Create global biometric instance
const biometricAuth = new BiometricAuth()

// Global utility functions for backward compatibility and ease of use
function initializeBiometrics() {
    const deviceInfoElement = document.getElementById('deviceInfo')
    
    if (!biometricAuth.isSupported) {
        if (deviceInfoElement) {
            deviceInfoElement.innerHTML = '⚠️ Biometric authentication not supported on this browser'
        }
        return false
    }
    
    const deviceInfo = biometricAuth.getDeviceInfo()
    if (deviceInfoElement) {
        deviceInfoElement.innerHTML = deviceInfo.text
    }
    
    // Show appropriate buttons based on setup status
    const setupButton = document.getElementById('setupBiometric')
    const loginButton = document.getElementById('biometricLogin')
    
    if (biometricAuth.hasSetup()) {
        if (setupButton) setupButton.style.display = 'none'
        if (loginButton) loginButton.style.display = 'block'
    } else {
        if (setupButton) setupButton.style.display = 'block'
        if (loginButton) loginButton.style.display = 'none'
    }
    
    return true
}

async function setupBiometric() {
    try {
        // Show loading state if setLoading function exists
        if (typeof setLoading === 'function') {
            setLoading(true)
        }
        
        // Show status if showStatus function exists
        if (typeof showStatus === 'function') {
            showStatus('Setting up biometric authentication...', 'info')
        }
        
        // Get current user from Supabase
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            throw new Error('Please sign in first before setting up biometrics')
        }
        
        // Setup biometric authentication
        await biometricAuth.setup(user)
        
        // Update UI
        const setupButton = document.getElementById('setupBiometric')
        const loginButton = document.getElementById('biometricLogin')
        
        if (setupButton) setupButton.style.display = 'none'
        if (loginButton) loginButton.style.display = 'block'
        
        if (typeof showStatus === 'function') {
            showStatus('🎉 Biometric authentication is now set up!', 'success')
        }
        
        // Redirect to dashboard after delay
        setTimeout(() => {
            if (typeof redirectToDashboard === 'function') {
                redirectToDashboard()
            } else {
                window.location.href = APP_CONFIG.DASHBOARD_URL
            }
        }, 3000)
        
    } catch (error) {
        console.error('Biometric setup error:', error)
        
        if (typeof showStatus === 'function') {
            showStatus(error.message, 'error')
        } else {
            alert(`Biometric setup failed: ${error.message}`)
        }
    }
    
    if (typeof setLoading === 'function') {
        setLoading(false)
    }
}

async function biometricLogin() {
    try {
        if (typeof setLoading === 'function') {
            setLoading(true)
        }
        
        if (typeof showStatus === 'function') {
            showStatus('Please authenticate with your biometric...', 'info')
        }
        
        // Perform biometric authentication
        const result = await biometricAuth.authenticate()
        
        if (typeof showStatus === 'function') {
            showStatus(`🎉 Welcome back, ${result.userEmail}!`, 'success')
        }
        
        // Redirect to dashboard
        setTimeout(() => {
            if (typeof redirectToDashboard === 'function') {
                redirectToDashboard()
            } else {
                window.location.href = APP_CONFIG.DASHBOARD_URL
            }
        }, 2000)
        
    } catch (error) {
        console.error('Biometric login error:', error)
        
        if (typeof showStatus === 'function') {
            showStatus(error.message, 'error')
        } else {
            alert(`Biometric login failed: ${error.message}`)
        }
    }
    
    if (typeof setLoading === 'function') {
        setLoading(false)
    }
}

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BiometricAuth, biometricAuth, initializeBiometrics, setupBiometric, biometricLogin }
}