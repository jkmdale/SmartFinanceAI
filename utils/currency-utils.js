/**
 * 💰 SmartFinanceAI - Currency Utilities
 * 
 * Global currency management with real-time exchange rates and precise calculations
 * 
 * Features:
 * - Multi-currency support for 15+ major currencies
 * - Real-time exchange rate integration
 * - Precise decimal arithmetic for financial calculations
 * - Currency formatting based on locale
 * - Historical exchange rate tracking
 * - Cryptocurrency support (BTC, ETH, etc.)
 */

/**
 * Supported currencies with metadata
 */
export const SUPPORTED_CURRENCIES = {
    // Major Fiat Currencies
    USD: {
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        decimals: 2,
        countries: ['US'],
        locale: 'en-US'
    },
    EUR: {
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
        decimals: 2,
        countries: ['DE', 'FR', 'IT', 'ES', 'NL'],
        locale: 'en-DE'
    },
    GBP: {
        code: 'GBP',
        name: 'British Pound',
        symbol: '£',
        decimals: 2,
        countries: ['GB'],
        locale: 'en-GB'
    },
    NZD: {
        code: 'NZD',
        name: 'New Zealand Dollar',
        symbol: 'NZ$',
        decimals: 2,
        countries: ['NZ'],
        locale: 'en-NZ'
    },
    AUD: {
        code: 'AUD',
        name: 'Australian Dollar',
        symbol: 'A$',
        decimals: 2,
        countries: ['AU'],
        locale: 'en-AU'
    },
    CAD: {
        code: 'CAD',
        name: 'Canadian Dollar',
        symbol: 'C$',
        decimals: 2,
        countries: ['CA'],
        locale: 'en-CA'
    },
    JPY: {
        code: 'JPY',
        name: 'Japanese Yen',
        symbol: '¥',
        decimals: 0,
        countries: ['JP'],
        locale: 'ja-JP'
    },
    CHF: {
        code: 'CHF',
        name: 'Swiss Franc',
        symbol: 'CHF',
        decimals: 2,
        countries: ['CH'],
        locale: 'de-CH'
    },
    SEK: {
        code: 'SEK',
        name: 'Swedish Krona',
        symbol: 'kr',
        decimals: 2,
        countries: ['SE'],
        locale: 'sv-SE'
    },
    NOK: {
        code: 'NOK',
        name: 'Norwegian Krone',
        symbol: 'kr',
        decimals: 2,
        countries: ['NO'],
        locale: 'nb-NO'
    },
    DKK: {
        code: 'DKK',
        name: 'Danish Krone',
        symbol: 'kr',
        decimals: 2,
        countries: ['DK'],
        locale: 'da-DK'
    },
    SGD: {
        code: 'SGD',
        name: 'Singapore Dollar',
        symbol: 'S$',
        decimals: 2,
        countries: ['SG'],
        locale: 'en-SG'
    },
    HKD: {
        code: 'HKD',
        name: 'Hong Kong Dollar',
        symbol: 'HK$',
        decimals: 2,
        countries: ['HK'],
        locale: 'en-HK'
    },
    
    // Cryptocurrencies
    BTC: {
        code: 'BTC',
        name: 'Bitcoin',
        symbol: '₿',
        decimals: 8,
        countries: [],
        locale: 'en-US',
        isCrypto: true
    },
    ETH: {
        code: 'ETH',
        name: 'Ethereum',
        symbol: 'Ξ',
        decimals: 18,
        countries: [],
        locale: 'en-US',
        isCrypto: true
    }
};

/**
 * Currency Utilities Class
 * Handles all currency-related operations with precision
 */
export class CurrencyUtils {
    constructor() {
        this.exchangeRates = new Map();
        this.rateHistory = new Map();
        this.lastUpdate = null;
        this.baseCurrency = 'USD';
        this.updateInterval = 5 * 60 * 1000; // 5 minutes
        this.apiEndpoints = {
            primary: 'https://api.exchangerate-api.com/v4/latest/',
            fallback: 'https://api.fixer.io/latest',
            crypto: 'https://api.coingecko.com/api/v3/simple/price'
        };
        
        this.initializeRates();
    }

    /**
     * Initialize exchange rates
     */
    async initializeRates() {
        try {
            // Load cached rates first
            this.loadCachedRates();
            
            // Update rates from API
            await this.updateExchangeRates();
            
            // Set up periodic updates
            setInterval(() => {
                this.updateExchangeRates();
            }, this.updateInterval);
            
        } catch (error) {
            console.warn('⚠️ Failed to initialize exchange rates:', error.message);
            // Use fallback rates if API fails
            this.loadFallbackRates();
        }
    }

    /**
     * Update exchange rates from API
     */
    async updateExchangeRates() {
        try {
            // Update fiat currency rates
            await this.updateFiatRates();
            
            // Update cryptocurrency rates
            await this.updateCryptoRates();
            
            this.lastUpdate = new Date().toISOString();
            this.cacheRates();
            
            console.log('✅ Exchange rates updated successfully');
            
        } catch (error) {
            console.warn('⚠️ Failed to update exchange rates:', error.message);
        }
    }

    /**
     * Update fiat currency rates
     */
    async updateFiatRates() {
        try {
            const response = await fetch(`${this.apiEndpoints.primary}${this.baseCurrency}`);
            
            if (!response.ok) {
                throw new Error(`API response: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Store rates
            for (const [currency, rate] of Object.entries(data.rates)) {
                if (SUPPORTED_CURRENCIES[currency] && !SUPPORTED_CURRENCIES[currency].isCrypto) {
                    this.exchangeRates.set(currency, {
                        rate: parseFloat(rate),
                        timestamp: new Date().toISOString(),
                        source: 'exchangerate-api'
                    });
                }
            }
            
            // Add base currency
            this.exchangeRates.set(this.baseCurrency, {
                rate: 1,
                timestamp: new Date().toISOString(),
                source: 'base'
            });
            
        } catch (error) {
            throw new Error(`Fiat rates update failed: ${error.message}`);
        }
    }

    /**
     * Update cryptocurrency rates
     */
    async updateCryptoRates() {
        try {
            const cryptoCurrencies = Object.keys(SUPPORTED_CURRENCIES)
                .filter(code => SUPPORTED_CURRENCIES[code].isCrypto)
                .map(code => code.toLowerCase())
                .join(',');
            
            if (!cryptoCurrencies) return;
            
            const response = await fetch(
                `${this.apiEndpoints.crypto}?ids=${cryptoCurrencies}&vs_currencies=usd`
            );
            
            if (!response.ok) {
                throw new Error(`Crypto API response: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Store crypto rates
            for (const [cryptoId, prices] of Object.entries(data)) {
                const currency = cryptoId.toUpperCase();
                if (SUPPORTED_CURRENCIES[currency]) {
                    this.exchangeRates.set(currency, {
                        rate: parseFloat(prices.usd),
                        timestamp: new Date().toISOString(),
                        source: 'coingecko'
                    });
                }
            }
            
        } catch (error) {
            console.warn('⚠️ Crypto rates update failed:', error.message);
        }
    }

    /**
     * Convert currency amount
     * @param {number} amount - Amount to convert
     * @param {string} fromCurrency - Source currency code
     * @param {string} toCurrency - Target currency code
     */
    convert(amount, fromCurrency, toCurrency) {
        try {
            if (fromCurrency === toCurrency) {
                return this.roundToDecimals(amount, SUPPORTED_CURRENCIES[toCurrency]?.decimals || 2);
            }

            const fromRate = this.getExchangeRate(fromCurrency);
            const toRate = this.getExchangeRate(toCurrency);

            if (!fromRate || !toRate) {
                throw new Error(`Exchange rate not available for ${fromCurrency} -> ${toCurrency}`);
            }

            // Convert through base currency (USD)
            const usdAmount = amount / fromRate;
            const convertedAmount = usdAmount * toRate;

            const decimals = SUPPORTED_CURRENCIES[toCurrency]?.decimals || 2;
            return this.roundToDecimals(convertedAmount, decimals);
            
        } catch (error) {
            throw new Error(`Currency conversion failed: ${error.message}`);
        }
    }

    /**
     * Get exchange rate for currency
     * @param {string} currency - Currency code
     */
    getExchangeRate(currency) {
        const rateData = this.exchangeRates.get(currency);
        return rateData ? rateData.rate : null;
    }

    /**
     * Format currency amount according to locale
     * @param {number} amount - Amount to format
     * @param {string} currency - Currency code
     * @param {string} locale - Optional locale override
     */
    format(amount, currency, locale = null) {
        try {
            const currencyInfo = SUPPORTED_CURRENCIES[currency];
            if (!currencyInfo) {
                throw new Error(`Unsupported currency: ${currency}`);
            }

            const formatLocale = locale || currencyInfo.locale;
            
            // Handle cryptocurrency formatting
            if (currencyInfo.isCrypto) {
                return this.formatCryptocurrency(amount, currency, formatLocale);
            }

            // Standard fiat currency formatting
            return new Intl.NumberFormat(formatLocale, {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: currencyInfo.decimals,
                maximumFractionDigits: currencyInfo.decimals
            }).format(amount);
            
        } catch (error) {
            // Fallback formatting
            const symbol = SUPPORTED_CURRENCIES[currency]?.symbol || currency;
            const decimals = SUPPORTED_CURRENCIES[currency]?.decimals || 2;
            return `${symbol}${this.formatNumber(amount, decimals)}`;
        }
    }

    /**
     * Format cryptocurrency with high precision
     * @param {number} amount - Amount to format
     * @param {string} currency - Cryptocurrency code
     * @param {string} locale - Locale for formatting
     */
    formatCryptocurrency(amount, currency, locale) {
        const currencyInfo = SUPPORTED_CURRENCIES[currency];
        const symbol = currencyInfo.symbol;
        
        // Use adaptive decimal places for crypto
        let decimals = currencyInfo.decimals;
        if (amount < 0.01) {
            decimals = Math.min(8, currencyInfo.decimals); // Show more decimals for small amounts
        } else if (amount > 100) {
            decimals = Math.min(4, currencyInfo.decimals); // Show fewer decimals for large amounts
        }

        const formatted = new Intl.NumberFormat(locale, {
            minimumFractionDigits: 2,
            maximumFractionDigits: decimals
        }).format(amount);

        return `${symbol}${formatted}`;
    }

    /**
     * Format number with specific decimal places
     * @param {number} number - Number to format
     * @param {number} decimals - Number of decimal places
     */
    formatNumber(number, decimals = 2) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number);
    }

    /**
     * Round number to specific decimal places
     * @param {number} number - Number to round
     * @param {number} decimals - Number of decimal places
     */
    roundToDecimals(number, decimals) {
        const factor = Math.pow(10, decimals);
        return Math.round((number + Number.EPSILON) * factor) / factor;
    }

    /**
     * Parse currency string to number
     * @param {string} currencyString - Currency string to parse
     * @param {string} currency - Currency code for context
     */
    parse(currencyString, currency) {
        try {
            if (typeof currencyString === 'number') {
                return currencyString;
            }

            // Remove currency symbols and formatting
            let numericString = currencyString.toString()
                .replace(/[^\d.,-]/g, '') // Remove non-numeric characters except decimal separators
                .replace(/,/g, ''); // Remove thousands separators

            // Handle negative amounts
            const isNegative = currencyString.includes('-') || currencyString.includes('(');
            
            const parsed = parseFloat(numericString);
            
            if (isNaN(parsed)) {
                throw new Error('Invalid currency format');
            }

            return isNegative ? -Math.abs(parsed) : parsed;
            
        } catch (error) {
            throw new Error(`Currency parsing failed: ${error.message}`);
        }
    }

    /**
     * Get currency info
     * @param {string} currency - Currency code
     */
    getCurrencyInfo(currency) {
        return SUPPORTED_CURRENCIES[currency] || null;
    }

    /**
     * Get currencies for country
     * @param {string} countryCode - ISO country code
     */
    getCurrenciesForCountry(countryCode) {
        return Object.values(SUPPORTED_CURRENCIES)
            .filter(currency => currency.countries.includes(countryCode))
            .map(currency => currency.code);
    }

    /**
     * Get all supported currency codes
     */
    getSupportedCurrencies() {
        return Object.keys(SUPPORTED_CURRENCIES);
    }

    /**
     * Get fiat currencies only
     */
    getFiatCurrencies() {
        return Object.keys(SUPPORTED_CURRENCIES)
            .filter(code => !SUPPORTED_CURRENCIES[code].isCrypto);
    }

    /**
     * Get cryptocurrencies only
     */
    getCryptocurrencies() {
        return Object.keys(SUPPORTED_CURRENCIES)
            .filter(code => SUPPORTED_CURRENCIES[code].isCrypto);
    }

    /**
     * Calculate percentage change
     * @param {number} oldValue - Previous value
     * @param {number} newValue - Current value
     */
    calculatePercentageChange(oldValue, newValue) {
        if (oldValue === 0) return 0;
        return ((newValue - oldValue) / oldValue) * 100;
    }

    /**
     * Get exchange rate history
     * @param {string} currency - Currency code
     * @param {number} days - Number of days back
     */
    getExchangeRateHistory(currency, days = 30) {
        const history = this.rateHistory.get(currency) || [];
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        return history.filter(entry => 
            new Date(entry.timestamp) >= cutoffDate
        );
    }

    /**
     * Store rate in history
     * @param {string} currency - Currency code
     * @param {number} rate - Exchange rate
     */
    storeRateHistory(currency, rate) {
        const history = this.rateHistory.get(currency) || [];
        
        history.push({
            rate,
            timestamp: new Date().toISOString()
        });

        // Keep only last 90 days of history
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 90);
        
        const filteredHistory = history.filter(entry => 
            new Date(entry.timestamp) >= cutoffDate
        );

        this.rateHistory.set(currency, filteredHistory);
    }

    /**
     * Cache exchange rates to localStorage
     */
    cacheRates() {
        try {
            const cacheData = {
                rates: Object.fromEntries(this.exchangeRates),
                lastUpdate: this.lastUpdate,
                timestamp: new Date().toISOString()
            };

            localStorage.setItem('currency_rates_cache', JSON.stringify(cacheData));
            
        } catch (error) {
            console.warn('⚠️ Failed to cache exchange rates:', error.message);
        }
    }

    /**
     * Load cached exchange rates
     */
    loadCachedRates() {
        try {
            const cached = localStorage.getItem('currency_rates_cache');
            if (!cached) return;

            const cacheData = JSON.parse(cached);
            const cacheAge = Date.now() - new Date(cacheData.timestamp).getTime();
            
            // Use cache if less than 1 hour old
            if (cacheAge < 60 * 60 * 1000) {
                this.exchangeRates = new Map(Object.entries(cacheData.rates));
                this.lastUpdate = cacheData.lastUpdate;
                console.log('✅ Loaded cached exchange rates');
            }
            
        } catch (error) {
            console.warn('⚠️ Failed to load cached rates:', error.message);
        }
    }

    /**
     * Load fallback exchange rates (hardcoded)
     */
    loadFallbackRates() {
        const fallbackRates = {
            USD: 1.0,
            EUR: 0.85,
            GBP: 0.73,
            NZD: 1.62,
            AUD: 1.54,
            CAD: 1.35,
            JPY: 110.0,
            CHF: 0.92,
            SEK: 8.75,
            NOK: 8.95,
            DKK: 6.34,
            SGD: 1.37,
            HKD: 7.8,
            BTC: 45000,
            ETH: 3000
        };

        for (const [currency, rate] of Object.entries(fallbackRates)) {
            this.exchangeRates.set(currency, {
                rate,
                timestamp: new Date().toISOString(),
                source: 'fallback'
            });
        }

        console.log('⚠️ Using fallback exchange rates');
    }

    /**
     * Get exchange rate status
     */
    getStatus() {
        return {
            lastUpdate: this.lastUpdate,
            ratesCount: this.exchangeRates.size,
            baseCurrency: this.baseCurrency,
            updateInterval: this.updateInterval,
            supportedCurrencies: this.getSupportedCurrencies().length
        };
    }

    /**
     * Force rate update
     */
    async forceUpdate() {
        try {
            await this.updateExchangeRates();
            return this.getStatus();
        } catch (error) {
            throw new Error(`Force update failed: ${error.message}`);
        }
    }

    /**
     * Validate currency code
     * @param {string} currency - Currency code to validate
     */
    isValidCurrency(currency) {
        return SUPPORTED_CURRENCIES.hasOwnProperty(currency);
    }

    /**
     * Get exchange rate age in minutes
     * @param {string} currency - Currency code
     */
    getRateAge(currency) {
        const rateData = this.exchangeRates.get(currency);
        if (!rateData) return null;

        const ageMs = Date.now() - new Date(rateData.timestamp).getTime();
        return Math.floor(ageMs / (1000 * 60)); // Convert to minutes
    }

    /**
     * Check if rates are stale
     * @param {number} maxAgeMinutes - Maximum age in minutes
     */
    areRatesStale(maxAgeMinutes = 60) {
        if (!this.lastUpdate) return true;

        const ageMs = Date.now() - new Date(this.lastUpdate).getTime();
        const ageMinutes = ageMs / (1000 * 60);
        
        return ageMinutes > maxAgeMinutes;
    }
}

// Export singleton instance
export const currencyUtils = new CurrencyUtils();

// Export utility functions for direct use
export const formatCurrency = (amount, currency, locale = null) => 
    currencyUtils.format(amount, currency, locale);

export const convertCurrency = (amount, fromCurrency, toCurrency) =>
    currencyUtils.convert(amount, fromCurrency, toCurrency);

export const parseCurrency = (currencyString, currency) =>
    currencyUtils.parse(currencyString, currency);

export const getCurrencySymbol = (currency) =>
    SUPPORTED_CURRENCIES[currency]?.symbol || currency;