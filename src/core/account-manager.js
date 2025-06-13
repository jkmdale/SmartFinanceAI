/**
 * SmartFinanceAI - Account Management System
 * Handles all account operations, balance calculations, and multi-currency support
 * Priority 2 implementation for core functionality
 */

class AccountManager {
  constructor() {
    this.db = new DatabaseManager();
    this.currencyManager = new CurrencyManager();
    this.eventEmitter = new EventEmitter();
    
    // Account type configurations
    this.accountTypes = {
      checking: {
        name: 'Checking Account',
        icon: '💳',
        description: 'Day-to-day spending account',
        features: ['debitCard', 'onlineBanking', 'directDeposit'],
        defaultCurrency: 'USD'
      },
      savings: {
        name: 'Savings Account',
        icon: '💰',
        description: 'Interest-bearing savings account',
        features: ['interestEarning', 'goalTracking'],
        defaultCurrency: 'USD'
      },
      credit: {
        name: 'Credit Card',
        icon: '💳',
        description: 'Credit card account',
        features: ['creditLimit', 'rewards', 'balance'],
        defaultCurrency: 'USD',
        isCredit: true
      },
      investment: {
        name: 'Investment Account',
        icon: '📈',
        description: 'Brokerage or retirement account',
        features: ['portfolioTracking', 'dividends', 'capitalGains'],
        defaultCurrency: 'USD'
      },
      loan: {
        name: 'Loan Account',
        icon: '🏠',
        description: 'Mortgage, personal, or auto loan',
        features: ['amortization', 'paymentSchedule'],
        defaultCurrency: 'USD',
        isDebt: true
      }
    };

    // Global banking institutions
    this.bankingInstitutions = {
      // New Zealand
      'NZ': [
        { code: 'ANZ_NZ', name: 'ANZ Bank New Zealand', logo: '/banks/anz-nz.png' },
        { code: 'ASB_NZ', name: 'ASB Bank', logo: '/banks/asb.png' },
        { code: 'BNZ_NZ', name: 'Bank of New Zealand', logo: '/banks/bnz.png' },
        { code: 'KIWIBANK_NZ', name: 'Kiwibank', logo: '/banks/kiwibank.png' },
        { code: 'WESTPAC_NZ', name: 'Westpac New Zealand', logo: '/banks/westpac-nz.png' }
      ],
      // Australia  
      'AU': [
        { code: 'CBA_AU', name: 'Commonwealth Bank', logo: '/banks/cba.png' },
        { code: 'WESTPAC_AU', name: 'Westpac Banking Corporation', logo: '/banks/westpac-au.png' },
        { code: 'ANZ_AU', name: 'ANZ Bank Australia', logo: '/banks/anz-au.png' },
        { code: 'NAB_AU', name: 'National Australia Bank', logo: '/banks/nab.png' }
      ],
      // United States
      'US': [
        { code: 'CHASE_US', name: 'JPMorgan Chase', logo: '/banks/chase.png' },
        { code: 'BOA_US', name: 'Bank of America', logo: '/banks/boa.png' },
        { code: 'WELLS_US', name: 'Wells Fargo', logo: '/banks/wells.png' },
        { code: 'CITI_US', name: 'Citibank', logo: '/banks/citi.png' }
      ],
      // United Kingdom
      'GB': [
        { code: 'BARCLAYS_GB', name: 'Barclays', logo: '/banks/barclays.png' },
        { code: 'HSBC_GB', name: 'HSBC UK', logo: '/banks/hsbc.png' },
        { code: 'LLOYDS_GB', name: 'Lloyds Bank', logo: '/banks/lloyds.png' },
        { code: 'NATWEST_GB', name: 'NatWest', logo: '/banks/natwest.png' }
      ],
      // Canada
      'CA': [
        { code: 'RBC_CA', name: 'Royal Bank of Canada', logo: '/banks/rbc.png' },
        { code: 'TD_CA', name: 'TD Bank', logo: '/banks/td.png' },
        { code: 'SCOTIA_CA', name: 'Scotiabank', logo: '/banks/scotia.png' },
        { code: 'BMO_CA', name: 'Bank of Montreal', logo: '/banks/bmo.png' }
      ]
    };
  }

  /**
   * Initialize the account manager
   */
  async initialize() {
    await this.db.initializeDB();
    console.log('✅ AccountManager initialized');
  }

  /**
   * CREATE ACCOUNT OPERATIONS
   */

  /**
   * Create a new account with validation
   */
  async createAccount(accountData) {
    try {
      // Validate required fields
      this.validateAccountData(accountData);

      // Get user's country for defaults
      const userSettings = await this.getUserSettings();
      const country = userSettings?.country || 'US';

      // Prepare account data with defaults
      const processedData = {
        name: accountData.name.trim(),
        type: accountData.type,
        currency: accountData.currency || this.getDefaultCurrency(country),
        balance: this.parseAmount(accountData.balance),
        institution: accountData.institution || '',
        accountNumber: accountData.accountNumber || '',
        sortCode: accountData.sortCode || '', // For UK banks
        routingNumber: accountData.routingNumber || '', // For US banks
        bsb: accountData.bsb || '', // For AU banks
        country: country,
        isJointAccount: accountData.isJointAccount || false,
        sharedWith: accountData.sharedWith || [],
        notes: accountData.notes || ''
      };

      // Create the account
      const newAccount = await this.db.createAccount(processedData);

      // Emit event for UI updates
      this.eventEmitter.emit('accountCreated', newAccount);

      // Log for analytics
      this.logAccountActivity('account_created', newAccount.id, {
        type: newAccount.accountType,
        currency: newAccount.currency,
        country: country
      });

      return {
        success: true,
        account: newAccount,
        message: `${this.accountTypes[newAccount.accountType].name} created successfully`
      };

    } catch (error) {
      console.error('Failed to create account:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to create account. Please check your information and try again.'
      };
    }
  }

  /**
   * Validate account data before creation
   */
  validateAccountData(data) {
    const errors = [];

    // Required fields
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Account name is required');
    }

    if (!data.type || !this.accountTypes[data.type]) {
      errors.push('Valid account type is required');
    }

    if (data.balance && !this.isValidAmount(data.balance)) {
      errors.push('Invalid balance amount');
    }

    if (data.name && data.name.length > 50) {
      errors.push('Account name must be 50 characters or less');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }

  /**
   * ACCOUNT RETRIEVAL OPERATIONS
   */

  /**
   * Get all accounts for current user with enhanced data
   */
  async getUserAccounts(includeInactive = false) {
    try {
      const accounts = await this.db.getUserAccounts();
      
      // Filter active accounts unless requested otherwise
      const filteredAccounts = includeInactive ? 
        accounts : accounts.filter(account => account.isActive);

      // Enhance accounts with additional data
      const enhancedAccounts = await Promise.all(
        filteredAccounts.map(account => this.enhanceAccountData(account))
      );

      // Sort by account type priority and name
      enhancedAccounts.sort((a, b) => {