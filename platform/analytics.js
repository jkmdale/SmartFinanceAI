/**
 * SmartFinanceAI - Platform Analytics System
 * Usage analytics and tracking for production launch
 * 
 * Features:
 * - User behavior tracking with privacy protection
 * - Feature usage analytics
 * - Performance monitoring
 * - A/B testing framework
 * - Conversion funnel analysis
 * - Real-time dashboard metrics
 */

import { SecurityUtils } from '../utils/security-utils.js';
import ExternalAPIs from '../api/external-apis.js';

class PlatformAnalytics {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.userId = null;
    this.events = [];
    this.features = new Map();
    this.experiments = new Map();
    this.metrics = {
      pageViews: 0,
      sessionDuration: 0,
      interactions: 0,
      errors: 0
    };

    this.consentGiven = this.checkAnalyticsConsent();
    this.isEnabled = this.consentGiven;
    
    this.initialize();
  }

  /**
   * Initialization and Setup
   */
  initialize() {
    if (!this.isEnabled) return;

    this.sessionStartTime = Date.now();
    this.setupEventListeners();
    this.loadStoredData();
    this.startPerformanceTracking();
    
    console.log('📊 SmartFinanceAI Analytics initialized');
  }

  setupEventListeners() {
    // Page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.trackEvent('page_focus');
      } else {
        this.trackEvent('page_blur');
        this.saveAnalyticsData();
      }
    });

    // Before page unload
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });

    // Error tracking
    window.addEventListener('error', (event) => {
      this.trackError(event);
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(event, 'promise_rejection');
    });
  }

  /**
   * User Identification and Session Management
   */
  identifyUser(userId, userProperties = {}) {
    this.userId = SecurityUtils.hashUserId(userId);
    
    const userEvent = {
      event: 'user_identified',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      properties: this.sanitizeUserProperties(userProperties)
    };

    this.trackEvent('user_identified', userEvent.properties);
    this.saveUserContext(userProperties);
  }

  startSession() {
    this.sessionStartTime = Date.now();
    this.sessionId = this.generateSessionId();
    
    const sessionEvent = {
      event: 'session_start',
      timestamp: this.sessionStartTime,
      sessionId: this.sessionId,
      userId: this.userId,
      properties: {
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen: {
          width: screen.width,
          height: screen.height
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    };

    this.events.push(sessionEvent);
    this.sendToAnalytics(sessionEvent);
  }

  endSession() {
    const sessionDuration = Date.now() - this.sessionStartTime;
    
    const sessionEndEvent = {
      event: 'session_end',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      properties: {
        duration: sessionDuration,
        pageViews: this.metrics.pageViews,
        interactions: this.metrics.interactions,
        errors: this.metrics.errors
      }
    };

    this.events.push(sessionEndEvent);
    this.sendToAnalytics(sessionEndEvent);
    this.saveAnalyticsData();
  }

  /**
   * Event Tracking
   */
  trackEvent(eventName, properties = {}) {
    if (!this.isEnabled) return;

    const event = {
      event: eventName,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      properties: this.sanitizeProperties(properties)
    };

    this.events.push(event);
    this.updateMetrics(eventName);
    
    // Send immediately for critical events
    if (this.isCriticalEvent(eventName)) {
      this.sendToAnalytics(event);
    }

    // Batch send other events
    this.batchSendEvents();
  }

  trackPageView(page, properties = {}) {
    this.metrics.pageViews++;
    
    const pageViewEvent = {
      page: page,
      title: document.title,
      url: window.location.href,
      referrer: document.referrer,
      loadTime: this.getPageLoadTime(),
      ...properties
    };

    this.trackEvent('page_view', pageViewEvent);
  }

  trackUserAction(action, element, properties = {}) {
    this.metrics.interactions++;
    
    const actionEvent = {
      action: action,
      element: {
        tagName: element?.tagName,
        className: element?.className,
        id: element?.id,
        text: element?.textContent?.substring(0, 100)
      },
      ...properties
    };

    this.trackEvent('user_action', actionEvent);
  }

  trackError(error, type = 'javascript_error') {
    this.metrics.errors++;
    
    const errorEvent = {
      type: type,
      message: error.message || error.reason,
      filename: error.filename,
      lineno: error.lineno,
      colno: error.colno,
      stack: error.error?.stack?.substring(0, 1000), // Limit stack trace
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.trackEvent('error', errorEvent);
  }

  /**
   * Feature Usage Tracking
   */
  trackFeatureUsage(featureName, action = 'used', properties = {}) {
    // Update feature usage statistics
    if (!this.features.has(featureName)) {
      this.features.set(featureName, {
        firstUsed: Date.now(),
        usageCount: 0,
        lastUsed: null
      });
    }

    const feature = this.features.get(featureName);
    feature.usageCount++;
    feature.lastUsed = Date.now();

    const featureEvent = {
      feature: featureName,
      action: action,
      usageCount: feature.usageCount,
      isFirstUse: feature.usageCount === 1,
      ...properties
    };

    this.trackEvent('feature_usage', featureEvent);
  }

  trackGoalProgress(goalId, progress, properties = {}) {
    const goalEvent = {
      goalId: SecurityUtils.hashId(goalId),
      progress: Math.round(progress * 100) / 100, // Round to 2 decimal places
      milestone: this.calculateMilestone(progress),
      ...properties
    };

    this.trackEvent('goal_progress', goalEvent);
  }

  trackBudgetInteraction(category, action, amount = null) {
    const budgetEvent = {
      category: category,
      action: action, // 'created', 'updated', 'exceeded', 'achieved'
      amount: amount ? Math.round(amount / 100) * 100 : null, // Round to nearest $100
      timestamp: Date.now()
    };

    this.trackEvent('budget_interaction', budgetEvent);
  }

  trackTransactionImport(source, count, success = true) {
    const importEvent = {
      source: source, // 'csv', 'manual', 'api'
      transactionCount: count,
      success: success,
      fileSize: this.getImportFileSize(),
      processingTime: this.getImportProcessingTime()
    };

    this.trackEvent('transaction_import', importEvent);
  }

  /**
   * A/B Testing Framework
   */
  createExperiment(experimentName, variants, trafficAllocation = 1.0) {
    const experiment = {
      name: experimentName,
      variants: variants,
      trafficAllocation: trafficAllocation,
      startTime: Date.now(),
      participants: new Map(),
      conversions: new Map()
    };

    this.experiments.set(experimentName, experiment);
    return experiment;
  }

  assignToExperiment(experimentName) {
    const experiment = this.experiments.get(experimentName);
    if (!experiment || !this.userId) return null;

    // Check if user already assigned
    if (experiment.participants.has(this.userId)) {
      return experiment.participants.get(this.userId);
    }

    // Determine if user should participate
    const hash = this.hashString(this.userId + experimentName);
    const shouldParticipate = (hash % 100) < (experiment.trafficAllocation * 100);
    
    if (!shouldParticipate) return null;

    // Assign variant
    const variantIndex = hash % experiment.variants.length;
    const assignedVariant = experiment.variants[variantIndex];
    
    experiment.participants.set(this.userId, {
      variant: assignedVariant,
      assignedAt: Date.now()
    });

    // Track assignment
    this.trackEvent('experiment_assignment', {
      experiment: experimentName,
      variant: assignedVariant,
      participantCount: experiment.participants.size
    });

    return assignedVariant;
  }

  trackConversion(experimentName, conversionValue = 1) {
    const experiment = this.experiments.get(experimentName);
    if (!experiment || !this.userId || !experiment.participants.has(this.userId)) {
      return;
    }

    const participant = experiment.participants.get(this.userId);
    const conversion = {
      userId: this.userId,
      variant: participant.variant,
      value: conversionValue,
      convertedAt: Date.now(),
      timeToConversion: Date.now() - participant.assignedAt
    };

    if (!experiment.conversions.has(participant.variant)) {
      experiment.conversions.set(participant.variant, []);
    }
    experiment.conversions.get(participant.variant).push(conversion);

    this.trackEvent('experiment_conversion', {
      experiment: experimentName,
      variant: participant.variant,
      value: conversionValue,
      timeToConversion: conversion.timeToConversion
    });
  }

  /**
   * Performance Tracking
   */
  startPerformanceTracking() {
    // Track Core Web Vitals
    this.trackCoreWebVitals();
    
    // Track custom performance metrics
    this.trackCustomMetrics();
    
    // Set up periodic performance checks
    setInterval(() => {
      this.trackPerformanceSnapshot();
    }, 30000); // Every 30 seconds
  }

  trackCoreWebVitals() {
    // First Contentful Paint
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            this.trackEvent('performance_metric', {
              metric: 'first_contentful_paint',
              value: entry.startTime,
              rating: this.ratePerformanceMetric('fcp', entry.startTime)
            });
          }
        });
      });
      observer.observe({ entryTypes: ['paint'] });
    }

    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.trackEvent('performance_metric', {
          metric: 'largest_contentful_paint',
          value: lastEntry.startTime,
          rating: this.ratePerformanceMetric('lcp', lastEntry.startTime)
        });
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }

    // Cumulative Layout Shift
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        this.trackEvent('performance_metric', {
          metric: 'cumulative_layout_shift',
          value: clsValue,
          rating: this.ratePerformanceMetric('cls', clsValue)
        });
      });
      observer.observe({ entryTypes: ['layout-shift'] });
    }
  }

  trackCustomMetrics() {
    // API response times
    this.interceptFetchForTiming();
    
    // Memory usage
    if ('memory' in performance) {
      this.trackEvent('performance_metric', {
        metric: 'memory_usage',
        value: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      });
    }
  }

  trackPerformanceSnapshot() {
    const snapshot = {
      timestamp: Date.now(),
      memory: this.getMemoryUsage(),
      dom: {
        elements: document.querySelectorAll('*').length,
        listeners: this.estimateEventListeners()
      },
      network: this.getNetworkInfo(),
      battery: this.getBatteryInfo()
    };

    this.trackEvent('performance_snapshot', snapshot);
  }

  /**
   * Conversion Funnel Analysis
   */
  trackFunnelStep(funnelName, stepName, properties = {}) {
    const funnelEvent = {
      funnel: funnelName,
      step: stepName,
      stepTimestamp: Date.now(),
      sessionId: this.sessionId,
      ...properties
    };

    this.trackEvent('funnel_step', funnelEvent);
  }

  trackFunnelConversion(funnelName, properties = {}) {
    const conversionEvent = {
      funnel: funnelName,
      convertedAt: Date.now(),
      sessionId: this.sessionId,
      ...properties
    };

    this.trackEvent('funnel_conversion', conversionEvent);
  }

  trackFunnelDropoff(funnelName, stepName, reason = null) {
    const dropoffEvent = {
      funnel: funnelName,
      step: stepName,
      reason: reason,
      droppedAt: Date.now(),
      sessionId: this.sessionId
    };

    this.trackEvent('funnel_dropoff', dropoffEvent);
  }

  /**
   * Real-time Dashboard Metrics
   */
  getDashboardMetrics() {
    return {
      session: {
        id: this.sessionId,
        duration: Date.now() - this.sessionStartTime,
        pageViews: this.metrics.pageViews,
        interactions: this.metrics.interactions,
        errors: this.metrics.errors
      },
      features: Array.from(this.features.entries()).map(([name, data]) => ({
        name,
        usageCount: data.usageCount,
        lastUsed: data.lastUsed
      })),
      experiments: Array.from(this.experiments.entries()).map(([name, exp]) => ({
        name,
        participants: exp.participants.size,
        conversions: Array.from(exp.conversions.values()).flat().length
      })),
      performance: this.getPerformanceSummary()
    };
  }

  getFeatureAdoptionRate(featureName) {
    const feature = this.features.get(featureName);
    if (!feature) return 0;

    const totalUsers = this.getTotalActiveUsers();
    return totalUsers > 0 ? feature.usageCount / totalUsers : 0;
  }

  getUserSegment() {
    const sessionDuration = Date.now() - this.sessionStartTime;
    const interactionRate = this.metrics.interactions / Math.max(this.metrics.pageViews, 1);
    
    if (sessionDuration > 300000 && interactionRate > 5) { // 5+ minutes, high interaction
      return 'power_user';
    } else if (sessionDuration > 120000 && interactionRate > 2) { // 2+ minutes, medium interaction
      return 'engaged_user';
    } else if (sessionDuration > 30000) { // 30+ seconds
      return 'casual_user';
    } else {
      return 'bounce_user';
    }
  }

  /**
   * Privacy and Consent Management
   */
  checkAnalyticsConsent() {
    return localStorage.getItem('analytics_consent') === 'granted';
  }

  setAnalyticsConsent(granted) {
    localStorage.setItem('analytics_consent', granted ? 'granted' : 'denied');
    this.consentGiven = granted;
    this.isEnabled = granted;

    if (granted) {
      this.initialize();
    } else {
      this.clearAnalyticsData();
    }
  }

  clearAnalyticsData() {
    this.events = [];
    this.features.clear();
    this.experiments.clear();
    localStorage.removeItem('analytics_data');
    localStorage.removeItem('user_context');
  }

  /**
   * Data Management
   */
  saveAnalyticsData() {
    if (!this.isEnabled) return;

    const data = {
      sessionId: this.sessionId,
      userId: this.userId,
      events: this.events.slice(-100), // Keep last 100 events
      features: Array.from(this.features.entries()),
      metrics: this.metrics,
      timestamp: Date.now()
    };

    localStorage.setItem('analytics_data', JSON.stringify(data));
  }

  loadStoredData() {
    const stored = localStorage.getItem('analytics_data');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.features = new Map(data.features || []);
        this.metrics = { ...this.metrics, ...data.metrics };
      } catch (error) {
        console.warn('Failed to load analytics data:', error);
      }
    }
  }

  saveUserContext(userProperties) {
    const context = {
      userId: this.userId,
      properties: this.sanitizeUserProperties(userProperties),
      timestamp: Date.now()
    };

    localStorage.setItem('user_context', JSON.stringify(context));
  }

  /**
   * Data Transmission
   */
  sendToAnalytics(event) {
    if (!this.isEnabled || !navigator.onLine) return;

    // Send to external analytics service
    ExternalAPIs.trackEvent(event.event, event.properties, event.userId)
      .catch(error => {
        console.warn('Analytics transmission failed:', error);
      });
  }

  batchSendEvents() {
    // Batch send non-critical events every 10 seconds
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        const eventsToSend = this.events.filter(e => !this.isCriticalEvent(e.event));
        eventsToSend.forEach(event => this.sendToAnalytics(event));
        this.batchTimer = null;
      }, 10000);
    }
  }

  /**
   * Utility Methods
   */
  generateSessionId() {
    return SecurityUtils.generateRandomId(32);
  }

  sanitizeProperties(properties) {
    // Remove sensitive data from properties
    const sanitized = { ...properties };
    delete sanitized.password;
    delete sanitized.ssn;
    delete sanitized.accountNumber;
    delete sanitized.routingNumber;
    return sanitized;
  }

  sanitizeUserProperties(properties) {
    return {
      country: properties.country,
      tier: properties.tier,
      registrationDate: properties.registrationDate,
      // Exclude PII
    };
  }

  isCriticalEvent(eventName) {
    const criticalEvents = [
      'error',
      'user_identified',
      'session_start',
      'session_end',
      'experiment_conversion'
    ];
    return criticalEvents.includes(eventName);
  }

  updateMetrics(eventName) {
    // Update relevant metrics based on event type
    if (eventName === 'page_view') {
      this.metrics.pageViews++;
    } else if (eventName === 'user_action') {
      this.metrics.interactions++;
    } else if (eventName === 'error') {
      this.metrics.errors++;
    }
  }

  calculateMilestone(progress) {
    if (progress >= 1.0) return 'completed';
    if (progress >= 0.75) return '75_percent';
    if (progress >= 0.5) return '50_percent';
    if (progress >= 0.25) return '25_percent';
    return 'started';
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  getPageLoadTime() {
    if (window.performance && window.performance.timing) {
      return window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
    }
    return null;
  }

  ratePerformanceMetric(metric, value) {
    const thresholds = {
      fcp: { good: 1800, poor: 3000 },
      lcp: { good: 2500, poor: 4000 },
      cls: { good: 0.1, poor: 0.25 }
    };

    const threshold = thresholds[metric];
    if (!threshold) return 'unknown';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs_improvement';
    return 'poor';
  }

  interceptFetchForTiming() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = performance.now();
      try {
        const response = await originalFetch.apply(window, args);
        const duration = performance.now() - start;
        
        this.trackEvent('api_performance', {
          url: args[0],
          method: args[1]?.method || 'GET',
          status: response.status,
          duration: Math.round(duration),
          success: response.ok
        });
        
        return response;
      } catch (error) {
        const duration = performance.now() - start;
        
        this.trackEvent('api_performance', {
          url: args[0],
          method: args[1]?.method || 'GET',
          status: 0,
          duration: Math.round(duration),
          success: false,
          error: error.message
        });
        
        throw error;
      }
    };
  }

  getMemoryUsage() {
    if ('memory' in performance) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        usagePercentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
      };
    }
    return null;
  }

  estimateEventListeners() {
    // Rough estimation of event listeners
    return document.querySelectorAll('[onclick], [onchange], [onsubmit]').length;
  }

  getNetworkInfo() {
    if ('connection' in navigator) {
      return {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      };
    }
    return null;
  }

  getBatteryInfo() {
    // Note: Battery API is deprecated in most browsers
    if ('getBattery' in navigator) {
      return navigator.getBattery().then(battery => ({
        charging: battery.charging,
        level: battery.level,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime
      }));
    }
    return null;
  }

  getPerformanceSummary() {
    const entries = performance.getEntriesByType('navigation');
    if (entries.length > 0) {
      const nav = entries[0];
      return {
        domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
        loadComplete: nav.loadEventEnd - nav.loadEventStart,
        firstByte: nav.responseStart - nav.requestStart,
        domProcessing: nav.domComplete - nav.domLoading
      };
    }
    return null;
  }

  getTotalActiveUsers() {
    // This would typically come from your backend
    // For now, return a placeholder
    return 1000;
  }

  getImportFileSize() {
    // Get file size from current import operation
    return sessionStorage.getItem('import_file_size') || null;
  }

  getImportProcessingTime() {
    // Get processing time from current import operation
    return sessionStorage.getItem('import_processing_time') || null;
  }

  /**
   * Export Methods for External Access
   */
  exportData() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      events: this.events,
      features: Array.from(this.features.entries()),
      experiments: Array.from(this.experiments.entries()),
      metrics: this.metrics
    };
  }

  getInsights() {
    const sessionDuration = Date.now() - this.sessionStartTime;
    const userSegment = this.getUserSegment();
    
    return {
      userSegment: userSegment,
      sessionDuration: sessionDuration,
      engagementLevel: this.calculateEngagementLevel(),
      topFeatures: this.getTopFeatures(),
      conversionProbability: this.calculateConversionProbability(),
      recommendations: this.generateRecommendations()
    };
  }

  calculateEngagementLevel() {
    const sessionDuration = Date.now() - this.sessionStartTime;
    const interactionRate = this.metrics.interactions / Math.max(this.metrics.pageViews, 1);
    const featureUsage = this.features.size;

    let score = 0;
    
    // Time spent (40% weight)
    if (sessionDuration > 600000) score += 40; // 10+ minutes
    else if (sessionDuration > 300000) score += 30; // 5+ minutes
    else if (sessionDuration > 120000) score += 20; // 2+ minutes
    else if (sessionDuration > 60000) score += 10; // 1+ minute

    // Interaction rate (30% weight)
    if (interactionRate > 10) score += 30;
    else if (interactionRate > 5) score += 25;
    else if (interactionRate > 2) score += 15;
    else if (interactionRate > 1) score += 10;

    // Feature diversity (30% weight)
    if (featureUsage > 8) score += 30;
    else if (featureUsage > 5) score += 25;
    else if (featureUsage > 3) score += 15;
    else if (featureUsage > 1) score += 10;

    if (score >= 80) return 'very_high';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    if (score >= 20) return 'low';
    return 'very_low';
  }

  getTopFeatures() {
    return Array.from(this.features.entries())
      .sort((a, b) => b[1].usageCount - a[1].usageCount)
      .slice(0, 5)
      .map(([name, data]) => ({
        name,
        usageCount: data.usageCount,
        lastUsed: data.lastUsed
      }));
  }

  calculateConversionProbability() {
    const engagement = this.calculateEngagementLevel();
    const sessionDuration = Date.now() - this.sessionStartTime;
    const featureUsage = this.features.size;
    const hasCreatedGoal = this.events.some(e => e.event === 'goal_created');
    const hasImportedTransactions = this.events.some(e => e.event === 'transaction_import');

    let probability = 0.05; // Base 5% probability

    // Engagement multiplier
    const engagementMultipliers = {
      'very_high': 4.0,
      'high': 2.5,
      'medium': 1.5,
      'low': 0.8,
      'very_low': 0.3
    };
    probability *= engagementMultipliers[engagement] || 1.0;

    // Feature usage bonus
    if (hasCreatedGoal) probability *= 2.0;
    if (hasImportedTransactions) probability *= 1.8;
    if (featureUsage > 5) probability *= 1.5;

    // Session duration bonus
    if (sessionDuration > 600000) probability *= 1.8; // 10+ minutes
    else if (sessionDuration > 300000) probability *= 1.4; // 5+ minutes

    return Math.min(probability, 0.95); // Cap at 95%
  }

  generateRecommendations() {
    const recommendations = [];
    const engagement = this.calculateEngagementLevel();
    const featureUsage = this.features.size;

    if (engagement === 'low' || engagement === 'very_low') {
      recommendations.push({
        type: 'engagement',
        message: 'Try exploring our AI financial coach for personalized insights',
        action: 'show_ai_coach'
      });
    }

    if (featureUsage < 3) {
      recommendations.push({
        type: 'feature_discovery',
        message: 'Set up your first financial goal to get started',
        action: 'create_goal'
      });
    }

    if (!this.events.some(e => e.event === 'transaction_import')) {
      recommendations.push({
        type: 'data_import',
        message: 'Import your bank transactions to see your spending patterns',
        action: 'import_transactions'
      });
    }

    const conversionProbability = this.calculateConversionProbability();
    if (conversionProbability > 0.3) {
      recommendations.push({
        type: 'upgrade',
        message: 'Unlock premium features with unlimited goals and AI insights',
        action: 'show_premium_features'
      });
    }

    return recommendations;
  }

  /**
   * Launch Metrics for Production Monitoring
   */
  getLaunchMetrics() {
    return {
      timestamp: Date.now(),
      sessionHealth: {
        totalSessions: this.getTotalSessions(),
        averageSessionDuration: this.getAverageSessionDuration(),
        bounceRate: this.getBounceRate(),
        errorRate: this.getErrorRate()
      },
      featureAdoption: {
        totalFeatures: this.features.size,
        topFeatures: this.getTopFeatures(),
        adoptionRate: this.getOverallAdoptionRate()
      },
      userEngagement: {
        segment: this.getUserSegment(),
        level: this.calculateEngagementLevel(),
        interactionRate: this.metrics.interactions / Math.max(this.metrics.pageViews, 1)
      },
      conversion: {
        probability: this.calculateConversionProbability(),
        funnel: this.getFunnelMetrics(),
        experiments: this.getExperimentMetrics()
      },
      performance: {
        summary: this.getPerformanceSummary(),
        errors: this.metrics.errors,
        memory: this.getMemoryUsage()
      }
    };
  }

  getTotalSessions() {
    // Would typically come from aggregated data
    return parseInt(localStorage.getItem('total_sessions') || '1');
  }

  getAverageSessionDuration() {
    // Would typically come from aggregated data
    const sessions = JSON.parse(localStorage.getItem('session_durations') || '[]');
    if (sessions.length === 0) return Date.now() - this.sessionStartTime;
    
    const total = sessions.reduce((sum, duration) => sum + duration, 0);
    return total / sessions.length;
  }

  getBounceRate() {
    // Would typically come from aggregated data
    return parseFloat(localStorage.getItem('bounce_rate') || '0.3');
  }

  getErrorRate() {
    const totalEvents = this.events.length;
    const errorEvents = this.events.filter(e => e.event === 'error').length;
    return totalEvents > 0 ? errorEvents / totalEvents : 0;
  }

  getOverallAdoptionRate() {
    // Calculate adoption rate across all features
    const totalPossibleFeatures = 15; // Estimate of total available features
    return this.features.size / totalPossibleFeatures;
  }

  getFunnelMetrics() {
    const funnelEvents = this.events.filter(e => e.event === 'funnel_step');
    const conversionEvents = this.events.filter(e => e.event === 'funnel_conversion');
    
    return {
      totalSteps: funnelEvents.length,
      conversions: conversionEvents.length,
      conversionRate: funnelEvents.length > 0 ? conversionEvents.length / funnelEvents.length : 0
    };
  }

  getExperimentMetrics() {
    return Array.from(this.experiments.entries()).map(([name, experiment]) => ({
      name,
      participants: experiment.participants.size,
      conversions: Array.from(experiment.conversions.values()).flat().length,
      conversionRate: experiment.participants.size > 0 
        ? Array.from(experiment.conversions.values()).flat().length / experiment.participants.size 
        : 0
    }));
  }
}

// Singleton instance
const platformAnalytics = new PlatformAnalytics();

// Auto-start session
platformAnalytics.startSession();

export default platformAnalytics;