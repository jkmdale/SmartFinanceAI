/**
 * ⚡ SmartFinanceAI - Performance Utilities
 * Performance monitoring and optimization tools
 * Part of: src/utils/performance-utils.js
 */

class PerformanceUtils {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.thresholds = {
      loadTime: 2000,        // 2 seconds
      renderTime: 16.67,     // 60 FPS (16.67ms per frame)
      memoryUsage: 50,       // 50MB
      bundleSize: 500,       // 500KB
      apiResponse: 1000      // 1 second
    };
    this.isMonitoring = false;
    this.performanceLog = [];
  }

  /**
   * Initialize performance monitoring
   */
  init() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.setupPerformanceObservers();
    this.monitorMemoryUsage();
    this.monitorNetworkRequests();
    this.trackPageLoad();
    
    console.log('🚀 Performance monitoring initialized');
  }

  /**
   * Setup Performance Observer for Core Web Vitals
   */
  setupPerformanceObservers() {
    if (!window.PerformanceObserver) return;

    // Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.recordMetric('LCP', lastEntry.startTime, {
          element: lastEntry.element?.tagName || 'unknown',
          url: lastEntry.url || 'inline'
        });
      });
      
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', lcpObserver);
    } catch (e) {
      console.warn('LCP observer not supported');
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.recordMetric('FID', entry.processingStart - entry.startTime, {
            eventType: entry.name
          });
        });
      });
      
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', fidObserver);
    } catch (e) {
      console.warn('FID observer not supported');
    }

    // Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        
        this.recordMetric('CLS', clsValue);
      });
      
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', clsObserver);
    } catch (e) {
      console.warn('CLS observer not supported');
    }

    // Long Tasks
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.recordMetric('LongTask', entry.duration, {
            startTime: entry.startTime,
            name: entry.name
          });
          
          if (entry.duration > 50) {
            this.logPerformanceIssue('long-task', {
              duration: entry.duration,
              startTime: entry.startTime
            });
          }
        });
      });
      
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', longTaskObserver);
    } catch (e) {
      console.warn('Long task observer not supported');
    }

    // Resource loading
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          const duration = entry.responseEnd - entry.startTime;
          
          this.recordMetric('Resource', duration, {
            name: entry.name,
            type: entry.initiatorType,
            size: entry.transferSize || 0
          });
          
          // Flag slow resources
          if (duration > 3000) {
            this.logPerformanceIssue('slow-resource', {
              url: entry.name,
              duration,
              size: entry.transferSize
            });
          }
        });
      });
      
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', resourceObserver);
    } catch (e) {
      console.warn('Resource observer not supported');
    }
  }

  /**
   * Monitor memory usage
   */
  monitorMemoryUsage() {
    if (!performance.memory) return;

    const checkMemory = () => {
      const memory = performance.memory;
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      const totalMB = memory.totalJSHeapSize / 1024 / 1024;
      const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;
      
      this.recordMetric('MemoryUsage', usedMB, {
        total: totalMB,
        limit: limitMB,
        percentage: (usedMB / limitMB) * 100
      });
      
      // Alert if memory usage is high
      if (usedMB > this.thresholds.memoryUsage) {
        this.logPerformanceIssue('high-memory-usage', {
          used: usedMB,
          total: totalMB,
          percentage: (usedMB / limitMB) * 100
        });
      }
    };

    // Check memory every 30 seconds
    setInterval(checkMemory, 30000);
    checkMemory(); // Initial check
  }

  /**
   * Monitor network requests
   */
  monitorNetworkRequests() {
    const originalFetch = window.fetch;
    const originalXHR = window.XMLHttpRequest;
    
    // Monitor fetch requests
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0];
      
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;
        
        this.recordMetric('APICall', duration, {
          url: typeof url === 'string' ? url : url.url,
          method: args[1]?.method || 'GET',
          status: response.status,
          success: response.ok
        });
        
        if (duration > this.thresholds.apiResponse) {
          this.logPerformanceIssue('slow-api-call', {
            url: typeof url === 'string' ? url : url.url,
            duration,
            status: response.status
          });
        }
        
        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        
        this.recordMetric('APICall', duration, {
          url: typeof url === 'string' ? url : url.url,
          method: args[1]?.method || 'GET',
          error: error.message,
          success: false
        });
        
        throw error;
      }
    };

    // Monitor XMLHttpRequest
    const perfUtils = this;
    window.XMLHttpRequest = function() {
      const xhr = new originalXHR();
      const originalOpen = xhr.open;
      const originalSend = xhr.send;
      let startTime;
      let url;
      let method;
      
      xhr.open = function(m, u, ...args) {
        method = m;
        url = u;
        return originalOpen.call(this, m, u, ...args);
      };
      
      xhr.send = function(...args) {
        startTime = performance.now();
        
        const originalOnLoad = xhr.onload;
        const originalOnError = xhr.onerror;
        
        xhr.onload = function() {
          const duration = performance.now() - startTime;
          
          perfUtils.recordMetric('APICall', duration, {
            url,
            method,
            status: xhr.status,
            success: xhr.status >= 200 && xhr.status < 300
          });
          
          if (originalOnLoad) originalOnLoad.call(this);
        };
        
        xhr.onerror = function() {
          const duration = performance.now() - startTime;
          
          perfUtils.recordMetric('APICall', duration, {
            url,
            method,
            error: 'Network error',
            success: false
          });
          
          if (originalOnError) originalOnError.call(this);
        };
        
        return originalSend.call(this, ...args);
      };
      
      return xhr;
    };
  }

  /**
   * Track page load performance
   */
  trackPageLoad() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        
        if (navigation) {
          const loadTime = navigation.loadEventEnd - navigation.navigationStart;
          const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.navigationStart;
          const firstByte = navigation.responseStart - navigation.navigationStart;
          
          this.recordMetric('PageLoad', loadTime, {
            domContentLoaded,
            firstByte,
            type: navigation.type
          });
          
          if (loadTime > this.thresholds.loadTime) {
            this.logPerformanceIssue('slow-page-load', {
              loadTime,
              domContentLoaded,
              firstByte
            });
          }
        }
      }, 0);
    });
  }

  /**
   * Record a performance metric
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   * @param {Object} metadata - Additional metadata
   */
  recordMetric(name, value, metadata = {}) {
    const metric = {
      name,
      value,
      metadata,
      timestamp: Date.now(),
      url: window.location.pathname
    };
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    this.metrics.get(name).push(metric);
    
    // Keep only last 100 entries per metric
    const entries = this.metrics.get(name);
    if (entries.length > 100) {
      entries.shift();
    }
    
    // Emit custom event
    window.dispatchEvent(new CustomEvent('performanceMetric', { detail: metric }));
  }

  /**
   * Log performance issues
   * @param {string} type - Issue type
   * @param {Object} details - Issue details
   */
  logPerformanceIssue(type, details) {
    const issue = {
      type,
      details,
      timestamp: Date.now(),
      url: window.location.pathname,
      userAgent: navigator.userAgent
    };
    
    this.performanceLog.push(issue);
    
    // Keep only last 50 issues
    if (this.performanceLog.length > 50) {
      this.performanceLog.shift();
    }
    
    console.warn(`Performance Issue: ${type}`, details);
    
    // Emit custom event
    window.dispatchEvent(new CustomEvent('performanceIssue', { detail: issue }));
  }

  /**
   * Get performance summary
   * @returns {Object} Performance summary
   */
  getPerformanceSummary() {
    const summary = {
      metrics: {},
      issues: this.performanceLog.length,
      timestamp: Date.now()
    };
    
    this.metrics.forEach((entries, name) => {
      if (entries.length === 0) return;
      
      const values = entries.map(e => e.value);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      const p95 = this.calculatePercentile(values, 95);
      
      summary.metrics[name] = {
        count: values.length,
        average: Math.round(avg * 100) / 100,
        min: Math.round(min * 100) / 100,
        max: Math.round(max * 100) / 100,
        p95: Math.round(p95 * 100) / 100,
        latest: values[values.length - 1]
      };
    });
    
    return summary;
  }

  /**
   * Calculate percentile
   * @param {Array} values - Array of values
   * @param {number} percentile - Percentile to calculate
   * @returns {number} Percentile value
   */
  calculatePercentile(values, percentile) {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    
    if (upper >= sorted.length) return sorted[sorted.length - 1];
    
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  /**
   * Measure function execution time
   * @param {Function} fn - Function to measure
   * @param {string} name - Measurement name
   * @returns {any} Function result
   */
  measureFunction(fn, name = 'anonymous') {
    return (...args) => {
      const startTime = performance.now();
      const result = fn.apply(this, args);
      const duration = performance.now() - startTime;
      
      this.recordMetric('FunctionExecution', duration, {
        name,
        args: args.length
      });
      
      return result;
    };
  }

  /**
   * Measure async function execution time
   * @param {Function} fn - Async function to measure
   * @param {string} name - Measurement name
   * @returns {Function} Wrapped async function
   */
  measureAsyncFunction(fn, name = 'anonymous') {
    return async (...args) => {
      const startTime = performance.now();
      try {
        const result = await fn.apply(this, args);
        const duration = performance.now() - startTime;
        
        this.recordMetric('AsyncFunctionExecution', duration, {
          name,
          args: args.length,
          success: true
        });
        
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        
        this.recordMetric('AsyncFunctionExecution', duration, {
          name,
          args: args.length,
          success: false,
          error: error.message
        });
        
        throw error;
      }
    };
  }

  /**
   * Debounce function for performance
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait