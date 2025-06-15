// SmartFinanceAI Configuration
// File: src/core/config.js

// Supabase Configuration
const supabaseUrl = 'https://gzznuwtxyyaqlbbrxsuz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6em51d3R4eXlhcWxiYnJ4c3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5ODE1NzgsImV4cCI6MjA2NTU1NzU3OH0.u-9MqMTAvSIf2V6qnt8oriNH-Sx-UXU0R6K3gsj5MSw' // Replace with your complete API key from Supabase dashboard
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey)

// App Configuration
const APP_CONFIG = {
    APP_NAME: 'SmartFinanceAI',
    VERSION: '1.0.0',
    ENVIRONMENT: 'development', // 'development' | 'production'
    
    // Navigation URLs
    DASHBOARD_URL: '../platform/dashboard.html',
    LOGIN_URL: '../auth/login.html',
    SIGNUP_URL: '../auth/signup.html',
    HOME_URL: '../index.html',
    
    // API Configuration (for future use)
    API_BASE_URL: 'https://api.smartfinanceai.com',
    
    // Feature Flags
    FEATURES: {
        BIOMETRIC_AUTH: true,
        MULTI_CURRENCY: true,
        DARK_MODE: false,
        OFFLINE_MODE: true
    },
    
    // Supported Countries & Currencies
    SUPPORTED_COUNTRIES: [
        { code: 'NZ', name: 'New Zealand', currency: 'NZD', flag: '🇳🇿' },
        { code: 'AU', name: 'Australia', currency: 'AUD', flag: '🇦🇺' },
        { code: 'GB', name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧' },
        { code: 'US', name: 'United States', currency: 'USD', flag: '🇺🇸' },
        { code: 'CA', name: 'Canada', currency: 'CAD', flag: '🇨🇦' }
    ],
    
    // Default Settings
    DEFAULTS: {
        CURRENCY: 'NZD',
        COUNTRY: 'NZ',
        EMERGENCY_FUND_MONTHS: 3,
        BUDGET_CATEGORIES: [
            'Housing',
            'Transportation', 
            'Food & Dining',
            'Utilities',
            'Healthcare',
            'Entertainment',
            'Shopping',
            'Personal Care',
            'Education',
            'Savings',
            'Other'
        ]
    }
}

// Utility Functions
const Utils = {
    // Format currency based on user's locale
    formatCurrency: (amount, currency = APP_CONFIG.DEFAULTS.CURRENCY) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount)
    },
    
    // Format date
    formatDate: (date) => {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(new Date(date))
    },
    
    // Get country flag emoji
    getCountryFlag: (countryCode) => {
        const country = APP_CONFIG.SUPPORTED_COUNTRIES.find(c => c.code === countryCode)
        return country ? country.flag : '🌍'
    },
    
    // Generate unique ID
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2)
    },
    
    // Debounce function for search/input
    debounce: (func, wait) => {
        let timeout
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout)
                func(...args)
            }
            clearTimeout(timeout)
            timeout = setTimeout(later, wait)
        }
    }
}

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APP_CONFIG, Utils, supabase }
}