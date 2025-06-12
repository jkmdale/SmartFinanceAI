// SmartFinanceAI - Development Environment Configuration
module.exports = {
  environment: 'development',
  
  // API Configuration
  api: {
    baseUrl: 'http://localhost:3001/api',
    timeout: 10000,
    retries: 3,
    enableMocks: true,
    enableLogging: true
  },
  
  // Database Configuration (IndexedDB)
  database: {
    name: 'SmartFinanceAI_Dev',
    version: 1,
    enableDebugMode: true,
    clearOnReload: false,
    enableBackup: true,
    backupInterval: 300000 // 5 minutes
  },
  
  // Authentication Configuration
  auth: {
    enableBiometric: true,
    sessionTimeout: 86400000, // 24 hours in dev
    enableDevLogin: true, // Quick login for development
    jwtSecret: 'dev-secret-key-not-for-production',
    enableGoogleAuth: false, // Disabled in dev
    enableAppleAuth: false   // Disabled in dev
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
    investmentTracking: false, // Not implemented yet
    cryptoSupport: false,      // Future feature
    businessFeatures: false   // Future feature
  },
  
  // Logging Configuration
  logging: {
    level: 'debug',
    enableConsole: true,
    enableFileLogging: false,
    enableErrorReporting: false,
    enablePerformanceLogging: true,
    enableUserActionTracking: true
  },
  
  // Security Configuration
  security: {
    enableCSP: false, // Relaxed in development
    enableHTTPS: false,
    enableEncryption: true,
    encryptionKey: 'dev-encryption-key-change-in-production',
    enableRateLimiting: false,
    maxLoginAttempts: 10 // Higher in dev
  },
  
  // Performance Configuration
  performance: {
    enableServiceWorker: false,
    enableCodeSplitting: true,
    enableMinification: false,
    enableCompression: false,
    enableCaching: false,
    bundleAnalyzer: true
  },
  
  // External Services
  services: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || 'sk-dev-key',
      model: 'gpt-4',
      enableAI: false // Use mock responses in dev
    },
    exchangeRates: {
      apiKey: process.env.EXCHANGE_RATE_API_KEY || 'free-tier-key',
      provider: 'fixer.io',
      enableRealTime: false // Use cached rates in dev
    },
    analytics: {
      enableTracking: false,
      provider: 'none'
    }
  },
  
  // Development Tools
  devTools: {
    enableHotReload: true,
    enableSourceMaps: true,
    enableDevServer: true,
    enableMockData: true,
    enableTestingMode: true,
    enableDebugPanel: true,
    port: 3000,
    host: 'localhost'
  },
  
  // Mock Data Configuration
  mockData: {
    generateTransactions: true,
    transactionCount: 100,
    generateAccounts: true,
    accountCount: 4,
    generateGoals: true,
    goalCount: 3,
    generateBudget: true,
    useRealisticData: true
  },
  
  // Testing Configuration
  testing: {
    enableE2E: true,
    enableUnitTests: true,
    enableIntegrationTests: true,
    enablePerformanceTests: false,
    testDataReset: true
  },
  
  // Currency Configuration
  currency: {
    default: 'USD',
    enableMultiCurrency: true,
    supportedCurrencies: ['USD', 'NZD', 'AUD', 'GBP', 'CAD', 'EUR'],
    exchangeRateProvider: 'mock'
  },
  
  // Country Configuration
  country: {
    default: 'US',
    supportedCountries: ['US', 'NZ', 'AU', 'GB', 'CA'],
    enableAutoDetection: true
  },
  
  // CSV Import Configuration
  csvImport: {
    maxFileSize: 10485760, // 10MB
    supportedFormats: ['csv', 'txt'],
    enablePreview: true,
    enableMapping: true,
    enableValidation: true,
    maxTransactions: 10000
  },
  
  // AI Configuration
  ai: {
    enableMockResponses: true,
    enableRealAI: false,
    responseDelay: 1000, // Simulate API delay
    enableInsights: true,
    enableRecommendations: true,
    enableChatbot: true
  },
  
  // PWA Configuration
  pwa: {
    enableOffline: true,
    enablePushNotifications: false,
    enableInstallPrompt: true,
    enableBackgroundSync: true,
    cacheStrategy: 'networkFirst'
  },
  
  // Debug Configuration
  debug: {
    enableVerboseLogging: true,
    enablePerformanceMonitoring: true,
    enableMemoryMonitoring: true,
    enableNetworkMonitoring: true,
    enableErrorBoundaries: true,
    enableReduxDevTools: true
  }
};