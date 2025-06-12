/**
 * SmartFinanceAI - Transaction Processing Engine
 * 
 * Handles all financial transaction processing, categorization,
 * validation, and analysis. Supports multiple currencies and
 * intelligent transaction matching.
 * 
 * Features:
 * - Automatic transaction categorization
 * - Duplicate detection and merging
 * - Real-time balance updates
 * - Transaction search and filtering
 * - Merchant name standardization
 * - Multi-currency support
 */

class TransactionEngine {
  constructor() {
    this.transactions = new Map();
    this.categories = new Map();
    this.merchants = new Map();
    this.duplicateThreshold = 0.95;
    this.listeners = new Set();
    
    // Initialize category system
    this.initializeCategories();
    
    // Initialize merchant database
    this.initializeMerchants();
    
    this.initialize();
  }

  async initialize() {
    try {
      console.log('Initializing Transaction Engine...');
      
      // Load existing transactions
      await this.loadTransactions();
      
      // Load merchant mappings
      await this.loadMerchantMappings();
      
      // Set up automatic categorization
      this.setupAutoCategorization();
      
      // Initialize duplicate detection
      this.setupDuplicateDetection();
      
      console.log('Transaction Engine initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize Transaction Engine:', error);
      throw error;
    }
  }

  /**
   * Initialize transaction categories
   * @private
   */
  initializeCategories() {
    const categories = [
      { id: 'income', name: 'Income', type: 'income', icon: 'trending-up', color: '#10b981' },
      { id: 'salary', name: 'Salary', parent: 'income', keywords: ['salary', 'wage', 'payroll'] },
      { id: 'freelance', name: 'Freelance', parent: 'income', keywords: ['freelance', 'contract', 'consulting']