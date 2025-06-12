/**
 * SmartFinanceAI - External APIs Integration
 * Third-party service integrations for production launch
 * 
 * Features:
 * - Exchange rate APIs with fallback providers
 * - AI service integration with privacy safeguards
 * - Analytics and performance monitoring APIs
 * - Notification delivery services
 * - Payment processing framework (Stripe ready)
 */

import { SecurityUtils } from '../utils/security-utils.js';
import { ErrorHandler } from '../utils/error-handler.js';
import { PerformanceMonitor } from '../utils/performance-utils.js';

class ExternalAPIs {
  constructor() {
    this.apiKeys = {
      exchangeRate: process.env.EXCHANGE_RATE_API_KEY,
      openai: process.env.OPENAI_API_KEY,
      stripe: process.env.STRIPE_PUBLISHABLE_KEY,
      analytics: process.env.ANALYTICS_API_KEY
    };
    
    this.endpoints = {
      exchangeRate: {
        primary: 'https://api.exchangerate-api.com/v4/latest',
        fallback: 'https://api.fixer.io/latest',
        backup: 'https://openexchangerates.org/api/latest.json'
      },
      ai: {
        openai: 'https://api.openai.com/v1',
        localFallback: '/api/ai-fallback'
      },
      analytics: {
        events: 'https://api.analytics.smartfinanceai.com/events',
        performance: 'https://api.analytics.smartfinanceai.com/performance'
      },
      notifications: {
        push: 'https://api.notifications.smartfinanceai.com/push',
        email: 'https://api.notifications.smartfinanceai.com/email'
      }
    };
    
    this.cache = new Map();
    this.rateLimiter = new Map();
    this.monitor = new PerformanceMonitor();
  }

  /**
   * Exchange Rate API Integration
   * Real-time currency conversion with multiple fallback providers
   */
  async getExchangeRates(baseCurrency = 'USD') {
    const cacheKey = `exchange_rates_${baseCurrency}`;
    const cached = this.getCachedData(cacheKey, 300000); // 5 minutes cache
    
    if (cached) {
      return cached;
    }

    const providers = [
      () => this.fetchFromExchangeRateAPI(baseCurrency),
      () => this.fetchFromFixerIO(baseCurrency),
      () => this.fetchFromOpenExchangeRates(baseCurrency)
    ];

    for (const provider of providers) {
      try {
        const rates = await provider();
        this.setCachedData(cacheKey, rates);
        return rates;
      } catch (error) {
        console.warn('Exchange rate provider failed:', error.message);
        continue;
      }
    }

    throw new Error('All exchange rate providers unavailable');
  }

  async fetchFromExchangeRateAPI(baseCurrency) {
    const response = await fetch(`${this.endpoints.exchangeRate.primary}/${baseCurrency}`);
    if (!response.ok) throw new Error('Exchange rate API failed');
    
    const data = await response.json();
    return {
      base: data.base,
      rates: data.rates,
      timestamp: Date.now(),
      provider: 'exchangerate-api'
    };
  }

  async fetchFromFixerIO(baseCurrency) {
    const response = await fetch(
      `${this.endpoints.exchangeRate.fallback}?access_key=${this.apiKeys.exchangeRate}&base=${baseCurrency}`
    );
    if (!response.ok) throw new Error('Fixer.io API failed');
    
    const data = await response.json();
    return {
      base: data.base,
      rates: data.rates,
      timestamp: Date.now(),
      provider: 'fixer'
    };
  }

  async fetchFromOpenExchangeRates(baseCurrency) {
    const response = await fetch(
      `${this.endpoints.exchangeRate.backup}?app_id=${this.apiKeys.exchangeRate}&base=${baseCurrency}`
    );
    if (!response.ok) throw new Error('OpenExchangeRates API failed');
    
    const data = await response.json();
    return {
      base: data.base,
      rates: data.rates,
      timestamp: Date.now(),
      provider: 'openexchangerates'
    };
  }

  /**
   * AI Service Integration with Privacy Safeguards
   * NEVER sends raw financial data - only anonymized summaries
   */
  async getAIInsights(anonymizedSummary, userContext) {
    if (!this.validateAIInput(anonymizedSummary)) {
      throw new Error('Invalid AI input - contains sensitive data');
    }

    try {
      const response = await this.callOpenAI({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a financial advisor AI. You ONLY receive anonymized financial summaries - never raw transaction data. 
                     Provide helpful, country-specific financial advice based on the summary provided.
                     Country context: ${userContext.country}
                     Currency: ${userContext.currency}`
          },
          {
            role: 'user',
            content: `Financial Summary: ${JSON.stringify(anonymizedSummary)}`
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      return {
        insights: response.choices[0].message.content,
        confidence: this.calculateConfidence(response),
        timestamp: Date.now()
      };
    } catch (error) {
      // Fallback to rule-based insights if AI fails
      return this.generateFallbackInsights(anonymizedSummary, userContext);
    }
  }

  async callOpenAI(payload) {
    const response = await fetch(`${this.endpoints.ai.openai}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKeys.openai}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`OpenAI API failed: ${response.statusText}`);
    }

    return response.json();
  }

  validateAIInput(data) {
    const sensitivePatterns = [
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card patterns
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN patterns
      /\$\d+\.\d{2}/, // Exact dollar amounts
      /[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}/ // IBAN patterns
    ];

    const dataString = JSON.stringify(data);
    return !sensitivePatterns.some(pattern => pattern.test(dataString));
  }

  generateFallbackInsights(summary, context) {
    // Rule-based financial insights when AI is unavailable
    const insights = [];
    
    if (summary.savingsRate < 0.1) {
      insights.push("Consider increasing your savings rate to at least 10% of income");
    }
    
    if (summary.debtToIncomeRatio > 0.4) {
      insights.push("Your debt-to-income ratio is high. Focus on debt reduction strategies");
    }
    
    if (!summary.hasEmergencyFund) {
      const months = context.country === 'US' ? 6 : 3;
      insights.push(`Build an emergency fund covering ${months} months of expenses`);
    }

    return {
      insights: insights.join('. '),
      confidence: 0.8,
      timestamp: Date.now(),
      source: 'rule-based'
    };
  }

  /**
   * Analytics API Integration
   * Track user behavior and platform performance
   */
  async trackEvent(eventName, eventData, userId) {
    try {
      const anonymizedData = this.anonymizeAnalyticsData(eventData, userId);
      
      await fetch(this.endpoints.analytics.events, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKeys.analytics}`
        },
        body: JSON.stringify({
          event: eventName,
          data: anonymizedData,
          timestamp: Date.now(),
          session: this.getSessionId(),
          platform: 'web',
          version: '1.0.0'
        })
      });
    } catch (error) {
      // Analytics failures shouldn't break user experience
      console.warn('Analytics tracking failed:', error.message);
    }
  }

  async trackPerformance(metrics) {
    try {
      await fetch(this.endpoints.analytics.performance, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKeys.analytics}`
        },
        body: JSON.stringify({
          metrics,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          connection: navigator.connection?.effectiveType,
          url: window.location.href
        })
      });
    } catch (error) {
      console.warn('Performance tracking failed:', error.message);
    }
  }

  /**
   * Push Notification Service
   * Deliver financial alerts and insights
   */
  async sendPushNotification(userId, notification) {
    try {
      const response = await fetch(this.endpoints.notifications.push, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKeys.analytics}`
        },
        body: JSON.stringify({
          userId: SecurityUtils.hashUserId(userId),
          title: notification.title,
          body: notification.body,
          icon: notification.icon || '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          tag: notification.tag,
          data: notification.data,
          actions: notification.actions
        })
      });

      return response.ok;
    } catch (error) {
      console.warn('Push notification failed:', error.message);
      return false;
    }
  }

  /**
   * Payment Processing Integration (Stripe Ready)
   * Framework for subscription billing
   */
  async createPaymentIntent(amount, currency, metadata) {
    try {
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          currency: currency.toLowerCase(),
          metadata,
          automatic_payment_methods: {
            enabled: true
          }
        })
      });

      const { client_secret } = await response.json();
      return client_secret;
    } catch (error) {
      throw new Error(`Payment intent creation failed: ${error.message}`);
    }
  }

  async createSubscription(customerId, priceId, metadata) {
    try {
      const response = await fetch('/api/payments/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer: customerId,
          items: [{
            price: priceId
          }],
          metadata,
          expand: ['latest_invoice.payment_intent']
        })
      });

      return response.json();
    } catch (error) {
      throw new Error(`Subscription creation failed: ${error.message}`);
    }
  }

  /**
   * Utility Methods
   */
  getCachedData(key, maxAge) {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < maxAge) {
      return cached.data;
    }
    return null;
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  anonymizeAnalyticsData(data, userId) {
    return {
      ...data,
      userId: SecurityUtils.hashUserId(userId),
      amounts: data.amounts?.map(amount => Math.round(amount / 100) * 100), // Round to nearest $100
      timestamp: Math.floor(Date.now() / 3600000) * 3600000 // Round to nearest hour
    };
  }

  getSessionId() {
    if (!this.sessionId) {
      this.sessionId = SecurityUtils.generateSessionId();
    }
    return this.sessionId;
  }

  calculateConfidence(response) {
    // Calculate AI response confidence based on various factors
    const baseConfidence = 0.8;
    const lengthFactor = Math.min(response.choices[0].message.content.length / 200, 1);
    return Math.min(baseConfidence * lengthFactor, 0.95);
  }

  /**
   * Rate Limiting
   */
  async checkRateLimit(endpoint, maxRequests = 100, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.rateLimiter.has(endpoint)) {
      this.rateLimiter.set(endpoint, []);
    }
    
    const requests = this.rateLimiter.get(endpoint);
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      throw new Error(`Rate limit exceeded for ${endpoint}`);
    }
    
    recentRequests.push(now);
    this.rateLimiter.set(endpoint, recentRequests);
    
    return true;
  }

  /**
   * Health Check for All External Services
   */
  async healthCheck() {
    const services = {
      exchangeRate: this.checkExchangeRateHealth(),
      ai: this.checkAIHealth(),
      analytics: this.checkAnalyticsHealth(),
      notifications: this.checkNotificationsHealth()
    };

    const results = {};
    for (const [service, check] of Object.entries(services)) {
      try {
        await check;
        results[service] = { status: 'healthy', timestamp: Date.now() };
      } catch (error) {
        results[service] = { 
          status: 'unhealthy', 
          error: error.message, 
          timestamp: Date.now() 
        };
      }
    }

    return results;
  }

  async checkExchangeRateHealth() {
    const response = await fetch(this.endpoints.exchangeRate.primary + '/USD', {
      method: 'HEAD'
    });
    if (!response.ok) throw new Error('Exchange rate service unhealthy');
  }

  async checkAIHealth() {
    const response = await fetch(this.endpoints.ai.openai + '/models', {
      headers: {
        'Authorization': `Bearer ${this.apiKeys.openai}`
      }
    });
    if (!response.ok) throw new Error('AI service unhealthy');
  }

  async checkAnalyticsHealth() {
    const response = await fetch(this.endpoints.analytics.events + '/health');
    if (!response.ok) throw new Error('Analytics service unhealthy');
  }

  async checkNotificationsHealth() {
    const response = await fetch(this.endpoints.notifications.push + '/health');
    if (!response.ok) throw new Error('Notifications service unhealthy');
  }
}

// Singleton instance
const externalAPIs = new ExternalAPIs();

export default externalAPIs;