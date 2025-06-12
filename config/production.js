// SmartFinanceAI - Production Environment Configuration
module.exports = {
  environment: 'production',
  
  // API Configuration
  api: {
    baseUrl: process.env.API_BASE_URL || 'https://api.smartfinanceai.com',
    timeout: 30000,
    retries: 3,
    enableMocks: false,
    enableLogging: false
  },
  
  // Database Configuration (IndexedDB)
  database: {
    name: 'SmartFinanceAI',
    version: 1,
    enableDebugMode: false,
    clearOnReload: false,
    enableBackup: true,
    backupInterval: 3600000 // 1 hour
  },
  
  // Authentication Configuration
  auth: {
    enableBiometric: true,
    sessionTimeout: 3600000, // 1 hour in production
    enableDevLogin: false,
    jwtSecret: process.env.JWT_SECRET,
    enableGoogleAuth: true,
    enableAppleAuth: true,
    requireMFA: true
  },
  
  // Feature Flags
  features: {
    aiCoaching: true,
    csvImport: true,
    goalTracking: true,
    budgetAnalysis: true,
    multiCurrency: true,
    offlineMode: true,
    biometricAuth: true,
    familyAccounts: true,
    investmentTracking: false, // Coming soon
    cryptoSupport: false,      // Future release
    businessFeatures: false   // Enterprise tier
  },
  
  // Logging Configuration
  logging: {
    level: 'error',
    enableConsole: false,
    enableFileLogging: true,
    enableErrorReporting: true,
    enablePerformanceLogging: true,
    enableUserActionTracking: false // Privacy compliance
  },
  
  // Security Configuration
  security: {
    enableCSP: true,
    enableHTTPS: true,
    enableEncryption: true,
    encryptionKey: process.env.ENCRYPTION_KEY,
    enableRateLimiting: true,
    maxLoginAttempts: 3,
    enableHSTS: true,
    enableXFrameOptions: true,
    enableXSSProtection: true
  },
  
  // Performance Configuration
  performance: {
    enableServiceWorker: true,
    enableCodeSplitting: true,
    enableMinification: true,
    enableCompression: true,
    enableCaching: true,
    bundleAnalyzer: false,
    enablePreloading: true,
    enableLazyLoading: true
  },
  
  // External Services
  services: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4',
      enableAI: true,
      rateLimitPerHour: 100
    },
    exchangeRates: {
      apiKey: process.env.EXCHANGE_RATE_API_KEY,
      provider: 'fixer.io',
      enableRealTime: true,
      cacheTimeout: 3600000 // 1 hour
    },
    analytics: {
      enableTracking: true,
      provider: 'google-analytics',
      trackingId: process.env.GA_TRACKING_ID
    },
    errorReporting: {
      provider: 'sentry',
      dsn: process.env.SENTRY_DSN,
      enableSourceMaps: true
    }
  },
  
  // CDN Configuration
  cdn: {
    enabled: true,
    baseUrl: process.env.CDN_BASE_URL || 'https://cdn.smartfinanceai.com',
    enableImageOptimization: true,
    enableAssetCaching: true
  },
  
  // Database Backup Configuration
  backup: {
    enableAutomaticBackup: true,
    backupInterval: 86400000, // 24 hours
    maxBackups: 30,
    enableCloudSync: true,
    cloudProvider: 'aws-s3'
  },
  
  // Currency Configuration
  currency: {
    default: 'USD',
    enableMultiCurrency: true,
    supportedCurrencies: ['USD', 'NZD', 'AUD', 'GBP', 'CAD', 'EUR', 'JPY'],
    exchangeRateProvider: 'fixer.io',
    enableRealTimeRates: true
  },
  
  // Country Configuration
  country: {
    default: 'US',
    supportedCountries: ['US', 'NZ', 'AU', 'GB', 'CA'],
    enableAutoDetection: true,
    enableGeoIP: true
  },
  
  // CSV Import Configuration
  csvImport: {
    maxFileSize: 52428800, // 50MB
    supportedFormats: ['csv', 'txt'],
    enablePreview: true,
    enableMapping: true,
    enableValidation: true,
    maxTransactions: 100000,
    enableVirusScanning: true
  },
  
  // AI Configuration
  ai: {
    enableMockResponses: false,
    enableRealAI: true,
    responseTimeout: 30000,
    enableInsights: true,
    enableRecommendations: true,
    enableChatbot: true,
    enableContentModeration: true
  },
  
  // PWA Configuration
  pwa: {
    enableOffline: true,
    enablePushNotifications: true,
    enableInstallPrompt: true,
    enableBackgroundSync: true,
    cacheStrategy: 'cacheFirst',
    enableAppShortcuts: true
  },
  
  // Compliance Configuration
  compliance: {
    enableGDPR: true,
    enableCCPA: true,
    enableDataRetention: true,
    dataRetentionPeriod: 31536000000, // 1 year
    enableConsentManagement: true,
    enableDataExport: true,
    enableDataDeletion: true
  },
  
  // Monitoring Configuration
  monitoring: {
    enableUptimeMonitoring: true,
    enablePerformanceMonitoring: true,
    enableErrorTracking: true,
    enableUserSessionTracking: false, // Privacy
    enableAPIMonitoring: true,
    alertThresholds: {
      errorRate: 0.01, // 1%
      responseTime: 2000, // 2 seconds
      uptime: 0.99 // 99%
    }
  },
  
  // Rate Limiting Configuration
  rateLimiting: {
    enabled: true,
    requests: {
      perMinute: 100,
      perHour: 1000,
      perDay: 10000
    },
    ai: {
      perMinute: 10,
      perHour: 100,
      perDay: 500
    },
    csvImport: {
      perMinute: 5,
      perHour: 20,
      perDay: 50
    }
  },
  
  // Caching Configuration
  caching: {
    enableBrowserCaching: true,
    enableCDNCaching: true,
    enableAPIResponseCaching: true,
    ttl: {
      static: 31536000, // 1 year
      api: 300,         // 5 minutes
      userdata: 60      // 1 minute
    }
  },
  
  // Deployment Configuration
  deployment: {
    environment: 'production',
    version: process.env.APP_VERSION || '1.0.0',
    buildHash: process.env.BUILD_HASH,
    deploymentTime: new Date().toISOString(),
    enableHealthChecks: true,
    enableGracefulShutdown: true
  }
};