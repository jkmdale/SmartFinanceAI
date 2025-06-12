/**
 * SmartFinanceAI - Global Currency Manager
 * 
 * Handles multi-currency support, real-time exchange rates,
 * currency formatting, and conversion for international users.
 * 
 * Features:
 * - Real-time exchange rates
 * - Multi-currency formatting
 * - Currency conversion
 * - Historical rate tracking
 * - Offline rate caching
 */

class CurrencyManager {
  constructor() {
    this.baseCurrency = 'USD';
    this.exchangeRates = new Map();
    this.historicalRates = new Map();
    this.updateInterval = null;
    this.lastUpdate = null;
    this.offlineRates = new Map();
    
    // Supported currencies
    this.supportedCurrencies = new Map([
      ['NZD', { name: 'New Zealand Dollar', symbol: '$', country: 'NZ', decimals: 2 }],
      ['AUD', { name: 'Australian Dollar', symbol: '$', country: 'AU', decimals: 2 }],
      ['USD', { name: 'US Dollar', symbol: '$', country: 'US', decimals: 2 }],
      ['GBP', { name: 'British Pound', symbol: '£', country: 'GB', decimals: 2 }],
      ['CAD', { name: 'Canadian Dollar', symbol: '$', country: 'CA', decimals: 2 }],
      ['EUR', { name: 'Euro', symbol: '€', country: 'EU', decimals: 2 }],
      ['JPY', { name: 'Japanese Yen', symbol: '¥', country: 'JP', decimals: 0 }],
      ['CHF', { name: 'Swiss Franc', symbol: 'Fr', country: 'CH', decimals: 2 }],
      ['SGD', { name: 'Singapore Dollar', symbol: '$', country: 'SG', decimals: 2 }]
    ]);

    // Update configuration
    this.config = {
      updateInterval: 15 * 60 * 1000, // 15 minutes
      maxCacheAge: 24 * 60 * 60 * 1000, // 24 hours
      retryAttempts: 3,
      retryDelay: 5000,
      apiEndpoint: 'https://api.exchangerate-api.com/v4/latest/',
      fallbackEndpoint: 'https://open.er-api.com/v6/latest/'
    };

    this.initialize();
  }

  async initialize() {
    try {
      console.log('Initializing Currency Manager...');
      
      // Load cached rates
      await this.loadCachedRates();
      
      // Update exchange rates
      await this.updateExchangeRates();
      
      // Start periodic updates
      this.startPeriodicUpdates();
      
      // Set up offline detection
      this.setupOfflineHandling();
      
      console.log('Currency Manager initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize Currency Manager:', error);
      // Continue with cached rates if available
      this.loadFallbackRates();
    }
  }

  /**
   * Get current exchange rate between two currencies
   * @param {string} fromCurrency - Source currency code
   * @param {string} toCurrency - Target currency code
   * @returns {Promise<number>} Exchange rate
   */
  async getExchangeRate(fromCurrency, toCurrency) {
    try {
      // Same currency
      if (fromCurrency === toCurrency) {
        return 1;
      }

      // Validate currencies
      if (!this.isValidCurrency(fromCurrency) || !this.isValidCurrency(toCurrency)) {
        throw new Error('Invalid currency code');
      }

      // Check if rates are available
      if (!this.exchangeRates.has(fromCurrency) || !this.exchangeRates.has(toCurrency)) {
        await this.updateExchangeRates();
      }

      const fromRate = this.exchangeRates.get(fromCurrency) || 1;
      const toRate = this.exchangeRates.get(toCurrency) || 1;

      // Convert via USD (base currency)
      if (fromCurrency === this.baseCurrency) {
        return toRate;
      } else if (toCurrency === this.baseCurrency) {
        return 1 / fromRate;
      } else {
        return toRate / fromRate;
      }

    } catch (error) {
      console.error(`Failed to get exchange rate ${fromCurrency} to ${toCurrency}:`, error);
      
      // Try fallback rates
      return this.getFallbackRate(fromCurrency, toCurrency);
    }
  }

  /**
   * Convert amount between currencies
   * @param {number} amount - Amount to convert
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @returns {Promise<object>} Conversion result
   */
  async convertCurrency(amount, fromCurrency, toCurrency) {
    try {
      const rate = await this.getExchangeRate(fromCurrency, toCurrency);
      const convertedAmount = amount * rate;
      
      const result = {
        originalAmount: amount,
        convertedAmount: convertedAmount,
        fromCurrency: fromCurrency,
        toCurrency: toCurrency,
        exchangeRate: rate,
        timestamp: new Date().toISOString(),
        formatted: {
          original: this.formatCurrency(amount, fromCurrency),
          converted: this.formatCurrency(convertedAmount, toCurrency)
        }
      };

      // Log conversion for audit
      if (window.auditLogger) {
        await window.auditLogger.logUserAction('CURRENCY_CONVERSION', {
          fromCurrency,
          toCurrency,
          amount,
          convertedAmount,
          rate
        });
      }

      return result;

    } catch (error) {
      console.error('Currency conversion failed:', error);
      throw new Error(`Failed to convert ${fromCurrency} to ${toCurrency}`);
    }
  }

  /**
   * Format currency amount according to locale
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code
   * @param {string} locale - Locale (optional, auto-detected)
   * @returns {string} Formatted currency string
   */
  formatCurrency(amount, currency, locale = null) {
    try {
      // Validate inputs
      if (typeof amount !== 'number' || isNaN(amount)) {
        return 'Invalid amount';
      }

      if (!this.isValidCurrency(currency)) {
        return `${amount} ${currency}`;
      }

      // Determine locale from currency if not provided
      if (!locale) {
        locale = this.getLocaleForCurrency(currency);
      }

      const currencyInfo = this.supportedCurrencies.get(currency);
      
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: currencyInfo.decimals,
        maximumFractionDigits: currencyInfo.decimals
      }).format(amount);

    } catch (error) {
      console.error('Currency formatting failed:', error);
      
      // Fallback formatting
      const currencyInfo = this.supportedCurrencies.get(currency);
      const symbol = currencyInfo?.symbol || currency;
      return `${symbol}${amount.toFixed(currencyInfo?.decimals || 2)}`;
    }
  }

  /**
   * Format currency with custom options
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code
   * @param {object} options - Formatting options
   * @returns {string} Formatted currency string
   */
  formatCurrencyAdvanced(amount, currency, options = {}) {
    const defaultOptions = {
      style: 'currency',
      currency: currency,
      notation: options.compact ? 'compact' : 'standard',
      compactDisplay: 'short',
      minimumFractionDigits: options.minimumDecimals || 0,
      maximumFractionDigits: options.maximumDecimals || 2,
      useGrouping: options.useGrouping !== false
    };

    const locale = options.locale || this.getLocaleForCurrency(currency);
    
    try {
      return new Intl.NumberFormat(locale, defaultOptions).format(amount);
    } catch (error) {
      console.error('Advanced currency formatting failed:', error);
      return this.formatCurrency(amount, currency, locale);
    }
  }

  /**
   * Get historical exchange rates
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @param {Date} date - Historical date
   * @returns {Promise<number>} Historical exchange rate
   */
  async getHistoricalRate(fromCurrency, toCurrency, date) {
    try {
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const rateKey = `${fromCurrency}-${toCurrency}-${dateKey}`;
      
      // Check cache first
      if (this.historicalRates.has(rateKey)) {
        return this.historicalRates.get(rateKey);
      }

      // Fetch historical rate
      const rate = await this.fetchHistoricalRate(fromCurrency, toCurrency, date);
      
      // Cache the result
      this.historicalRates.set(rateKey, rate);
      
      return rate;

    } catch (error) {
      console.error('Failed to get historical rate:', error);
      
      // Fallback to current rate with warning
      console.warn('Using current rate as fallback for historical data');
      return this.getExchangeRate(fromCurrency, toCurrency);
    }
  }

  /**
   * Update exchange rates from API
   */
  async updateExchangeRates() {
    try {
      console.log('Updating exchange rates...');
      
      // Check if we need to update (rate limiting)
      if (this.lastUpdate && 
          Date.now() - this.lastUpdate < 5 * 60 * 1000) { // 5 minutes
        console.log('Skipping update - too recent');
        return;
      }

      const rates = await this.fetchExchangeRates();
      
      if (rates && Object.keys(rates).length > 0) {
        // Update rates
        this.exchangeRates.clear();
        Object.entries(rates).forEach(([currency, rate]) => {
          this.exchangeRates.set(currency, rate);
        });

        // Update timestamp
        this.lastUpdate = Date.now();
        
        // Cache the rates
        await this.cacheRates(rates);
        
        console.log(`Updated ${Object.keys(rates).length} exchange rates`);
        
        // Notify listeners
        this.notifyRateUpdate();
      }

    } catch (error) {
      console.error('Failed to update exchange rates:', error);
      
      // Try fallback endpoint
      try {
        const fallbackRates = await this.fetchFallbackRates();
        if (fallbackRates) {
          this.exchangeRates.clear();
          Object.entries(fallbackRates).forEach(([currency, rate]) => {
            this.exchangeRates.set(currency, rate);
          });
          this.lastUpdate = Date.now();
        }
      } catch (fallbackError) {
        console.