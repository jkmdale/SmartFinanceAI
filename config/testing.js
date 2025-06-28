// SmartFinanceAI - Testing Environment Configuration
module.exports = {
  environment: 'testing',
  
  
  // API Configuration
  api: {
    baseUrl: 'http://localhost:3001/api/test',
    timeout: 5000,
    retries: 1,
    enableMocks: true,
    enableLogging: true
  },
  
  // Database Configuration (IndexedDB)
  database: {
    name: 'SmartFinanceAI_Test',
    version: 1,
    enableDebugMode: true,
    clearOnReload: true, // Always start fresh for tests
    enableBackup: false,
    backupInterval: null
  },
  
  // Authentication Configuration
  auth: {
    enableBiometric: false, // Disabled for automated testing
    sessionTimeout: 3600000, // 1 hour
    enableDevLogin: true,
    jwtSecret: 'test-secret-key',
    enableGoogleAuth: false,
    enableAppleAuth: false,
    requireMFA: false
  },
  
  // Feature Flags
  features: {
    aiCoaching: true,
    csvImport: true,
    goalTracking: true,
    budgetAnalysis: true,
    multiCurrency: true,
    offlineMode: false, // Simplify testing
    biometricAuth: false,
    familyAccounts: true,
    investmentTracking: false,
    cryptoSupport: false,
    businessFeatures: false
  },
  
  // Logging Configuration
  logging: {
    level: 'debug',
    enableConsole: true,
    enableFileLogging: true,
    enableErrorReporting: false,
    enablePerformanceLogging: true,
    enableUserActionTracking: true
  },
  
  // Security Configuration
  security: {
    enableCSP: false,
    enableHTTPS: false,
    enableEncryption: false, // Simplify for testing
    encryptionKey: 'test-encryption-key',
    enableRateLimiting: false,
    maxLoginAttempts: 100 // No limits in testing
  },
  
  // Performance Configuration
  performance: {
    enableServiceWorker: false,
    enableCodeSplitting: false,
    enableMinification: false,
    enableCompression: false,
    enableCaching: false,
    bundleAnalyzer: false
  },
  
  // External Services
  services: {
    openai: {
      apiKey: 'test-openai-key',
      model: 'gpt-3.5-turbo',
      enableAI: false // Use mocks
    },
    exchangeRates: {
      apiKey: 'test-exchange-rate-key',
      provider: 'mock',
      enableRealTime: false
    },
    analytics: {
      enableTracking: false,
      provider: 'none'
    }
  },
  
  // Test Configuration
  testing: {
    framework: 'jest',
    enableE2E: true,
    enableUnitTests: true,
    enableIntegrationTests: true,
    enablePerformanceTests: true,
    enableAccessibilityTests: true,
    enableVisualRegressionTests: false,
    testTimeout: 30000,
    retries: 2,
    parallel: true,
    coverage: {
      threshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
  
  // Mock Data Configuration
  mockData: {
    generateTransactions: true,
    transactionCount: 50,
    generateAccounts: true,
    accountCount: 3,
    generateGoals: true,
    goalCount: 2,
    generateBudget: true,
    useRealisticData: true,
    enableDeterministicData: true, // Same data for consistent tests
    seed: 12345 // Random seed for reproducible data
  },
  
  // Test Users Configuration
  testUsers: {
    basic: {
      email: 'test@smartfinanceai.com',
      password: 'TestPassword123!',
      country: 'US',
      currency: 'USD'
    },
    premium: {
      email: 'premium@smartfinanceai.com',
      password: 'TestPassword123!',
      country: 'NZ',
      currency: 'NZD',
      subscription: 'premium'
    },
    family: {
      email: 'family@smartfinanceai.com',
      password: 'TestPassword123!',
      country: 'AU',
      currency: 'AUD',
      accountType: 'family'
    }
  },
  
  // Test Data Scenarios
  testScenarios: {
    emptyUser: {
      hasAccounts: false,
      hasTransactions: false,
      hasGoals: false,
      hasBudget: false
    },
    basicUser: {
      hasAccounts: true,
      hasTransactions: true,
      hasGoals: false,
      hasBudget: false
    },
    completeUser: {
      hasAccounts: true,
      hasTransactions: true,
      hasGoals: true,
      hasBudget: true
    }
  },
  
  // Currency Configuration
  currency: {
    default: 'USD',
    enableMultiCurrency: true,
    supportedCurrencies: ['USD', 'NZD', 'AUD', 'GBP', 'CAD'],
    exchangeRateProvider: 'mock',
    testRates: {
      'USD': 1.0,
      'NZD': 1.6,
      'AUD': 1.5,
      'GBP': 0.8,
      'CAD': 1.3
    }
  },
  
  // Country Configuration
  country: {
    default: 'US',
    supportedCountries: ['US', 'NZ', 'AU', 'GB', 'CA'],
    enableAutoDetection: false // Force explicit selection in tests
  },
  
  // CSV Import Configuration
  csvImport: {
    maxFileSize: 1048576, // 1MB for testing
    supportedFormats: ['csv', 'txt'],
    enablePreview: true,
    enableMapping: true,
    enableValidation: true,
    maxTransactions: 1000
  },
  
  // AI Configuration
  ai: {
    enableMockResponses: true,
    enableRealAI: false,
    responseDelay: 100, // Fast responses for testing
    enableInsights: true,
    enableRecommendations: true,
    enableChatbot: true,
    mockResponses: {
      financialHealth: {
        score: 75,
        status: 'good',
        recommendations: ['Increase emergency fund', 'Reduce dining expenses']
      },
      budgetAnalysis: {
        variance: -150,
        categories: {
          'food': { budget: 500, spent: 450, variance: 50 },
          'transportation': { budget: 300, spent: 350, variance: -50 }
        }
      }
    }
  },
  
  // Performance Testing Configuration
  performance: {
    enableTesting: true,
    loadTime: {
      target: 2000, // 2 seconds
      threshold: 3000 // 3 seconds max
    },
    memoryUsage: {
      target: 50, // 50MB
      threshold: 100 // 100MB max
    },
    bundleSize: {
      target: 500, // 500KB
      threshold: 1000 // 1MB max
    }
  },
  
  // Accessibility Testing Configuration
  accessibility: {
    enableTesting: true,
    standard: 'WCAG2.1AA',
    rules: {
      'color-contrast': true,
      'keyboard-navigation': true,
      'screen-reader': true,
      'focus-management': true
    }
  },
  
  // Browser Testing Configuration
  browsers: {
    desktop: ['chrome', 'firefox', 'safari', 'edge'],
    mobile: ['chrome-mobile', 'safari-mobile'],
    enableCrossBrowserTesting: true,
    enableMobileTesting: true
  },
  
  // Test Reporting Configuration
  reporting: {
    enableJunitReports: true,
    enableHtmlReports: true,
    enableCoverageReports: true,
    enableScreenshots: true,
    enableVideos: false,
    outputDir: './test-results'
  },
  
  // Continuous Integration Configuration
  ci: {
    enableParallelTesting: true,
    maxWorkers: 4,
    enableRetries: true,
    maxRetries: 2,
    enableArtifacts: true,
    enableSlackNotifications: false
  }
};
