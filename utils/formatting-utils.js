/**
 * SmartFinanceAI - Formatting Utilities
 * Global SaaS Platform File: src/utils/formatting-utils.js
 * 
 * Advanced formatting utilities for financial data
 * Features: Multi-currency, number formatting, text utilities, country-specific formatting
 */

class FormattingUtils {
  constructor() {
    this.countryConfigs = {
      'NZ': {
        currency: 'NZD',
        locale: 'en-NZ',
        currencySymbol: '$',
        numberFormat: {
          decimal: '.',
          thousands: ','
        },
        phoneFormat: '+64 X XXX XXXX'
      },
      'AU': {
        currency: 'AUD',
        locale: 'en-AU',
        currencySymbol: '$',
        numberFormat: {
          decimal: '.',
          thousands: ','
        },
        phoneFormat: '+61 X XXXX XXXX'
      },
      'UK': {
        currency: 'GBP',
        locale: 'en-GB',
        currencySymbol: '£',
        numberFormat: {
          decimal: '.',
          thousands: ','
        },
        phoneFormat: '+44 XXXX XXX XXX'
      },
      'US': {
        currency: 'USD',
        locale: 'en-US',
        currencySymbol: '$',
        numberFormat: {
          decimal: '.',
          thousands: ','
        },
        phoneFormat: '+1 (XXX) XXX-XXXX'
      },
      'CA': {
        currency: 'CAD',
        locale: 'en-CA',
        currencySymbol: '$',
        numberFormat: {
          decimal: '.',
          thousands: ','
        },
        phoneFormat: '+1 (XXX) XXX-XXXX'
      }
    };

    this.currencySymbols = {
      'USD': '$',
      'CAD': 'C$',
      'AUD': 'A$',
      'NZD': 'NZ$',
      'GBP': '£',
      'EUR': '€',
      'JPY': '¥',
      'CNY': '¥',
      'INR': '₹',
      'BTC': '₿',
      'ETH': 'Ξ'
    };
  }

  /**
   * Format currency with proper localization
   */
  formatCurrency(amount, currency = 'USD', country = 'US', options = {}) {
    const {
      showSymbol = true,
      showCode = false,
      minimumFractionDigits = 2,
      maximumFractionDigits = 2,
      useGrouping = true,
      compact = false,
      showSign = false
    } = options;

    if (typeof amount !== 'number' || isNaN(amount)) {
      return showSymbol ? this.currencySymbols[currency] + '0.00' : '0.00';
    }

    const config = this.countryConfigs[country] || this.countryConfigs['US'];
    
    try {
      // Handle compact notation for large numbers
      if (compact && Math.abs(amount) >= 1000) {
        return this.formatCompactCurrency(amount, currency, config.locale, showSymbol);
      }

      const formatOptions = {
        style: 'currency',
        currency,
        minimumFractionDigits,
        maximumFractionDigits,
        useGrouping
      };

      let formatted = new Intl.NumberFormat(config.locale, formatOptions).format(amount);

      // Add currency code if requested
      if (showCode && !formatted.includes(currency)) {
        formatted += ` ${currency}`;
      }

      // Add explicit sign if requested
      if (showSign && amount > 0) {
        formatted = '+' + formatted;
      }

      // Remove symbol if not wanted
      if (!showSymbol) {
        const symbol = this.currencySymbols[currency] || currency;
        formatted = formatted.replace(symbol, '').trim();
      }

      return formatted;

    } catch (error) {
      // Fallback formatting
      const symbol = showSymbol ? this.currencySymbols[currency] || '' : '';
      const formattedNumber = this.formatNumber(amount, {
        minimumFractionDigits,
        maximumFractionDigits,
        useGrouping
      });
      
      return `${symbol}${formattedNumber}${showCode ? ' ' + currency : ''}`;
    }
  }

  /**
   * Format compact currency (1.2K, 1.5M, etc.)
   */
  formatCompactCurrency(amount, currency, locale, showSymbol = true) {
    const symbol = showSymbol ? this.currencySym