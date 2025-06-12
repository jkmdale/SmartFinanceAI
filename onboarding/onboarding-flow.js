// 🚀 SmartFinanceAI - Onboarding Flow Manager
// Comprehensive new user experience with guided setup, country selection, and financial initialization

class OnboardingFlow {
  constructor(authManager, localizationManager, databaseManager) {
    this.authManager = authManager;
    this.localizationManager = localizationManager;
    this.databaseManager = databaseManager;
    
    // Onboarding state
    this.currentStep = 0;
    this.totalSteps = 8;
    this.userData = {};
    this.isCompleted = false;
    this.canSkipSteps = false;
    
    // Step configuration
    this.steps = this.initializeSteps();
    
    // Progress tracking
    this.stepHistory = [];
    this.startTime = null;
    this.completionTime = null;
    
    // Event listeners
    this.stepChangeListeners = [];
    this.completionListeners = [];
    
    console.log('🎯 OnboardingFlow initialized');
  }
  
  // === STEP CONFIGURATION === //
  
  initializeSteps() {
    return [
      {
        id: 'welcome',
        title: 'Welcome to SmartFinanceAI',
        description: 'Your journey to financial wellness starts here',
        component: 'WelcomeStep',
        required: true,
        canSkip: false,
        estimatedTime: 1, // minutes
        validation: null
      },
      {
        id: 'country_selection',
        title: 'Select Your Country',
        description: 'Choose your country for localized financial features',
        component: 'CountrySelectionStep',
        required: true,
        canSkip: false,
        estimatedTime: 1,
        validation: this.validateCountrySelection.bind(this)
      },
      {
        id: 'account_creation',
        title: 'Create Your Account',
        description: 'Set up your secure SmartFinanceAI account',
        component: 'AccountCreationStep',
        required: true,
        canSkip: false,
        estimatedTime: 3,
        validation: this.validateAccountCreation.bind(this)
      },
      {
        id: 'security_setup',
        title: 'Secure Your Account',
        description: 'Enable biometric authentication and two-factor security',
        component: 'SecuritySetupStep',
        required: false,
        canSkip: true,
        estimatedTime: 2,
        validation: this.validateSecuritySetup.bind(this)
      },
      {
        id: 'financial_profile',
        title: 'Your Financial Profile',
        description: 'Tell us about your financial situation and goals',
        component: 'FinancialProfileStep',
        required: true,
        canSkip: false,
        estimatedTime: 4,
        validation: this.validateFinancialProfile.bind(this)
      },
      {
        id: 'account_setup',
        title: 'Add Your Accounts',
        description: 'Connect your bank accounts and financial institutions',
        component: 'AccountSetupStep',
        required: false,
        canSkip: true,
        estimatedTime: 5,
        validation: this.validateAccountSetup.bind(this)
      },
      {
        id: 'goal_creation',
        title: 'Set Your Goals',
        description: 'Define your financial objectives and aspirations',
        component: 'GoalCreationStep',
        required: false,
        canSkip: true,
        estimatedTime: 3,
        validation: this.validateGoalCreation.bind(this)
      },
      {
        id: 'completion',
        title: 'You\'re All Set!',
        description: 'Welcome to your financial command center',
        component: 'CompletionStep',
        required: true,
        canSkip: false,
        estimatedTime: 1,
        validation: null
      }
    ];
  }
  
  // === FLOW CONTROL === //
  
  async startOnboarding(userData = {}) {
    try {
      console.log('🎯 Starting onboarding flow...');
      
      this.userData = { ...userData };
      this.currentStep = 0;
      this.isCompleted = false;
      this.startTime = new Date();
      this.stepHistory = [];
      
      // Initialize analytics
      this.trackEvent('onboarding_started', {
        timestamp: this.startTime.toISOString(),
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`
      });
      
      await this.initializeStep(this.currentStep);
      
      return {
        success: true,
        currentStep: this.getCurrentStepInfo(),
        progress: this.getProgress()
      };
      
    } catch (error) {
      console.error('❌ Failed to start onboarding:', error);
      throw error;
    }
  }
  
  async nextStep(stepData = {}) {
    try {
      const currentStepInfo = this.steps[this.currentStep];
      
      // Validate current step if validation function exists
      if (currentStepInfo.validation) {
        const validationResult = await currentStepInfo.validation(stepData);
        if (!validationResult.valid) {
          throw new Error(validationResult.error);
        }
      }
      
      // Store step data
      this.userData[currentStepInfo.id] = stepData;
      
      // Track step completion
      this.trackStepCompletion(currentStepInfo.id, stepData);
      
      // Process step-specific logic
      await this.processStepData(currentStepInfo.id, stepData);
      
      // Move to next step
      if (this.currentStep < this.totalSteps - 1) {
        this.currentStep++;
        await this.initializeStep(this.currentStep);
        
        this.notifyStepChange();
        
        return {
          success: true,
          currentStep: this.getCurrentStepInfo(),
          progress: this.getProgress()
        };
      } else {
        // Complete onboarding
        return await this.completeOnboarding();
      }
      
    } catch (error) {
      console.error('❌ Failed to proceed to next step:', error);
      throw error;
    }
  }
  
  async previousStep() {
    try {
      if (this.currentStep > 0) {
        this.currentStep--;
        await this.initializeStep(this.currentStep);
        
        this.notifyStepChange();
        
        return {
          success: true,
          currentStep: this.getCurrentStepInfo(),
          progress: this.getProgress()
        };
      } else {
        throw new Error('Already at first step');
      }
      
    } catch (error) {
      console.error('❌ Failed to go to previous step:', error);
      throw error;
    }
  }
  
  async skipStep() {
    try {
      const currentStepInfo = this.steps[this.currentStep];
      
      if (!currentStepInfo.canSkip) {
        throw new Error('This step cannot be skipped');
      }
      
      // Track step skip
      this.trackEvent('step_skipped', {
        stepId: currentStepInfo.id,
        stepIndex: this.currentStep
      });
      
      // Move to next step without validation
      if (this.currentStep < this.totalSteps - 1) {
        this.currentStep++;
        await this.initializeStep(this.currentStep);
        
        this.notifyStepChange();
        
        return {
          success: true,
          currentStep: this.getCurrentStepInfo(),
          progress: this.getProgress()
        };
      } else {
        return await this.completeOnboarding();
      }
      
    } catch (error) {
      console.error('❌ Failed to skip step:', error);
      throw error;
    }
  }
  
  async jumpToStep(stepIndex) {
    try {
      if (stepIndex < 0 || stepIndex >= this.totalSteps) {
        throw new Error('Invalid step index');
      }
      
      // Only allow jumping backwards or to completed steps
      if (stepIndex > this.currentStep && !this.canSkipSteps) {
        throw new Error('Cannot jump forward in onboarding');
      }
      
      this.currentStep = stepIndex;
      await this.initializeStep(this.currentStep);
      
      this.notifyStepChange();
      
      return {
        success: true,
        currentStep: this.getCurrentStepInfo(),
        progress: this.getProgress()
      };
      
    } catch (error) {
      console.error('❌ Failed to jump to step:', error);
      throw error;
    }
  }
  
  // === STEP INITIALIZATION === //
  
  async initializeStep(stepIndex) {
    const stepInfo = this.steps[stepIndex];
    
    console.log(`🎯 Initializing step: ${stepInfo.title}`);
    
    // Track step start
    this.trackEvent('step_started', {
      stepId: stepInfo.id,
      stepIndex: stepIndex,
      timestamp: new Date().toISOString()
    });
    
    // Step-specific initialization
    switch (stepInfo.id) {
      case 'welcome':
        await this.initializeWelcomeStep();
        break;
      case 'country_selection':
        await this.initializeCountrySelectionStep();
        break;
      case 'account_creation':
        await this.initializeAccountCreationStep();
        break;
      case 'security_setup':
        await this.initializeSecuritySetupStep();
        break;
      case 'financial_profile':
        await this.initializeFinancialProfileStep();
        break;
      case 'account_setup':
        await this.initializeAccountSetupStep();
        break;
      case 'goal_creation':
        await this.initializeGoalCreationStep();
        break;
      case 'completion':
        await this.initializeCompletionStep();
        break;
    }
  }
  
  // === STEP-SPECIFIC INITIALIZATION === //
  
  async initializeWelcomeStep() {
    // Set up welcome step data
    this.stepData = {
      features: [
        {
          icon: '🤖',
          title: 'AI Financial Coach',
          description: 'Get personalized insights and recommendations'
        },
        {
          icon: '🌍',
          title: 'Global Support',
          description: 'Works with banks and currencies worldwide'
        },
        {
          icon: '🎯',
          title: 'Goal Tracking',
          description: 'Set and achieve your financial objectives'
        },
        {
          icon: '🔒',
          title: 'Bank-Level Security',
          description: 'Your data is encrypted and protected'
        }
      ],
      estimatedSetupTime: this.calculateTotalEstimatedTime()
    };
  }
  
  async initializeCountrySelectionStep() {
    this.stepData = {
      supportedCountries: this.localizationManager.getSupportedCountries(),
      preselectedCountry: this.detectUserCountry(),
      countryBenefits: {
        'NZ': ['KiwiSaver integration', 'NZ tax year support', 'Major NZ banks'],
        'AU': ['Superannuation tracking', 'AU tax year support', 'Big 4 banks'],
        'UK': ['ISA optimization', 'UK tax year support', 'Open Banking ready'],
        'US': ['401(k) planning', 'Federal tax support', 'Major US banks'],
        'CA': ['RRSP optimization', 'Canadian tax support', 'Big 5 banks']
      }
    };
  }
  
  async initializeAccountCreationStep() {
    this.stepData = {
      selectedCountry: this.userData.country_selection?.country,
      requirements: {
        email: 'Valid email address required',
        password: 'Minimum 8 characters with mixed case, numbers, and symbols',
        name: 'First and last name required',
        terms: 'Must accept terms of service and privacy policy'
      },
      features: [
        'End-to-end encryption',
        'Biometric authentication',
        'Multi-device sync',
        'Offline functionality'
      ]
    };
  }
  
  async initializeSecuritySetupStep() {
    this.stepData = {
      biometricAvailable: this.authManager.webAuthnSupported,
      securityOptions: [
        {
          id: 'biometric',
          title: 'Biometric Authentication',
          description: 'Use fingerprint or face recognition for secure login',
          icon: '👆',
          recommended: true,
          available: this.authManager.webAuthnSupported
        },
        {
          id: 'two_factor',
          title: 'Two-Factor Authentication',
          description: 'Add an extra layer of security with TOTP',
          icon: '🔐',
          recommended: true,
          available: true
        },
        {
          id: 'recovery_codes',
          title: 'Recovery Codes',
          description: 'Backup codes for account recovery',
          icon: '🔑',
          recommended: true,
          available: true
        }
      ]
    };
  }
  
  async initializeFinancialProfileStep() {
    const country = this.localizationManager.getCurrentCountry();
    
    this.stepData = {
      country: country,
      incomeRanges: this.getIncomeRanges(country.currency),
      employmentTypes: [
        { id: 'employed', label: 'Employed (Full-time)', icon: '💼' },
        { id: 'self_employed', label: 'Self-employed', icon: '🚀' },
        { id: 'part_time', label: 'Part-time employed', icon: '⏰' },
        { id: 'unemployed', label: 'Unemployed', icon: '🔍' },
        { id: 'retired', label: 'Retired', icon: '🏖️' },
        { id: 'student', label: 'Student', icon: '📚' }
      ],
      financialGoals: [
        { id: 'emergency_fund', label: 'Build Emergency Fund', priority: 'high' },
        { id: 'debt_freedom', label: 'Become Debt-Free', priority: 'high' },
        { id: 'home_ownership', label: 'Buy a Home', priority: 'medium' },
        { id: 'retirement', label: 'Retirement Planning', priority: 'medium' },
        { id: 'investment', label: 'Grow Investments', priority: 'medium' },
        { id: 'education', label: 'Education Savings', priority: 'low' },
        { id: 'travel', label: 'Travel Fund', priority: 'low' }
      ],
      riskTolerance: [
        { id: 'conservative', label: 'Conservative', description: 'Prefer safety over returns' },
        { id: 'moderate', label: 'Moderate', description: 'Balanced approach to risk and return' },
        { id: 'aggressive', label: 'Aggressive', description: 'Higher risk for higher returns' }
      ]
    };
  }
  
  async initializeAccountSetupStep() {
    const country = this.localizationManager.getCurrentCountry();
    
    this.stepData = {
      supportedBanks: country.banks,
      accountTypes: [
        { id: 'checking', label: 'Checking/Current Account', icon: '💳', common: true },
        { id: 'savings', label: 'Savings Account', icon: '🏦', common: true },
        { id: 'credit_card', label: 'Credit Card', icon: '💸', common: true },
        { id: 'investment', label: 'Investment Account', icon: '📈', common: false },
        { id: 'retirement', label: 'Retirement Account', icon: '🏖️', common: false },
        { id: 'loan', label: 'Loan Account', icon: '🏠', common: false }
      ],
      importMethods: [
        { id: 'csv', label: 'CSV Upload', description: 'Import bank statements', icon: '📄' },
        { id: 'manual', label: 'Manual Entry', description: 'Enter accounts manually', icon: '✏️' },
        { id: 'api', label: 'Bank Connection', description: 'Connect via Open Banking', icon: '🔗', available: false }
      ]
    };
  }
  
  async initializeGoalCreationStep() {
    const country = this.localizationManager.getCurrentCountry();
    const profile = this.userData.financial_profile || {};
    
    this.stepData = {
      suggestedGoals: this.generateSuggestedGoals(profile, country),
      goalTemplates: this.getGoalTemplates(country),
      timeframes: [
        { id: 'short', label: 'Short-term (< 1 year)', icon: '🎯' },
        { id: 'medium', label: 'Medium-term (1-5 years)', icon: '📅' },
        { id: 'long', label: 'Long-term (5+ years)', icon: '🚀' }
      ]
    };
  }
  
  async initializeCompletionStep() {
    this.stepData = {
      summary: this.generateOnboardingSummary(),
      nextSteps: [
        { id: 'import_transactions', title: 'Import your first transactions', icon: '📊' },
        { id: 'set_budget', title: 'Create your first budget', icon: '💰' },
        { id: 'explore_insights', title: 'Explore AI insights', icon: '🤖' },
        { id: 'invite_partner', title: 'Invite your partner', icon: '👥' }
      ],
      achievements: [
        { id: 'account_created', title: 'Account Created', icon: '✅' },
        { id: 'security_enabled', title: 'Security Enabled', icon: '🔒' },
        { id: 'goals_set', title: 'Goals Established', icon: '🎯' },
        { id: 'ready_to_go', title: 'Ready to Go!', icon: '🚀' }
      ]
    };
  }
  
  // === VALIDATION FUNCTIONS === //
  
  async validateCountrySelection(data) {
    if (!data.country) {
      return { valid: false, error: 'Please select your country' };
    }
    
    if (!this.localizationManager.validateCountryCode(data.country)) {
      return { valid: false, error: 'Invalid country selection' };
    }
    
    return { valid: true };
  }
  
  async validateAccountCreation(data) {
    const { email, password, firstName, lastName, terms } = data;
    
    if (!email || !this.isValidEmail(email)) {
      return { valid: false, error: 'Please enter a valid email address' };
    }
    
    if (!password || !this.isStrongPassword(password)) {
      return { valid: false, error: 'Password must be at least 8 characters with uppercase, lowercase, numbers, and symbols' };
    }
    
    if (!firstName || firstName.trim().length < 1) {
      return { valid: false, error: 'First name is required' };
    }
    
    if (!lastName || lastName.trim().length < 1) {
      return { valid: false, error: 'Last name is required' };
    }
    
    if (!terms) {
      return { valid: false, error: 'You must accept the terms of service and privacy policy' };
    }
    
    return { valid: true };
  }
  
  async validateSecuritySetup(data) {
    // Security setup is optional, so always valid
    return { valid: true };
  }
  
  async validateFinancialProfile(data) {
    const { employment, income, goals } = data;
    
    if (!employment) {
      return { valid: false, error: 'Please select your employment status' };
    }
    
    if (!income || income === '') {
      return { valid: false, error: 'Please select your income range' };
    }
    
    if (!goals || goals.length === 0) {
      return { valid: false, error: 'Please select at least one financial goal' };
    }
    
    return { valid: true };
  }
  
  async validateAccountSetup(data) {
    // Account setup is optional
    return { valid: true };
  }
  
  async validateGoalCreation(data) {
    // Goal creation is optional
    return { valid: true };
  }
  
  // === STEP DATA PROCESSING === //
  
  async processStepData(stepId, data) {
    switch (stepId) {
      case 'country_selection':
        await this.processCountrySelection(data);
        break;
      case 'account_creation':
        await this.processAccountCreation(data);
        break;
      case 'security_setup':
        await this.processSecuritySetup(data);
        break;
      case 'financial_profile':
        await this.processFinancialProfile(data);
        break;
      case 'account_setup':
        await this.processAccountSetup(data);
        break;
      case 'goal_creation':
        await this.processGoalCreation(data);
        break;
    }
  }
  
  async processCountrySelection(data) {
    // Set localization
    this.localizationManager.setCountry(data.country);
    
    console.log(`🌍 Country set to: ${data.country}`);
  }
  
  async processAccountCreation(data) {
    try {
      // Create user account
      const registrationData = {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        country: this.userData.country_selection?.country || 'US',
        currency: this.localizationManager.currentCurrency
      };
      
      const result = await this.authManager.register(registrationData);
      
      if (result.success) {
        // Initialize database for new user
        await this.databaseManager.initialize(result.user.id);
        
        console.log('✅ User account created and database initialized');
      }
      
    } catch (error) {
      console.error('❌ Account creation failed:', error);
      throw error;
    }
  }
  
  async processSecuritySetup(data) {
    try {
      if (data.enableBiometric && this.authManager.webAuthnSupported) {
        await this.authManager.setupBiometric();
        console.log('✅ Biometric authentication enabled');
      }
      
      if (data.enableTwoFactor) {
        const twoFactorResult = await this.authManager.setupTwoFactor();
        this.userData.twoFactorSecret = twoFactorResult.secret;
        this.userData.backupCodes = twoFactorResult.backupCodes;
        console.log('✅ Two-factor authentication enabled');
      }
      
    } catch (error) {
      console.error('❌ Security setup failed:', error);
      // Don't throw error - security setup is optional
    }
  }
  
  async processFinancialProfile(data) {
    try {
      // Create user financial profile
      const profileData = {
        employment: data.employment,
        income: data.income,
        dependents: data.dependents || 0,
        riskTolerance: data.riskTolerance || 'moderate',
        primaryGoals: data.goals || [],
        experienceLevel: data.experienceLevel || 'beginner',
        preferences: {
          budgetingMethod: data.budgetingMethod || 'percentage',
          investmentStyle: data.investmentStyle || 'passive',
          notificationFrequency: data.notificationFrequency || 'weekly'
        }
      };
      
      // Store profile in database
      await this.databaseManager.create('users', {
        id: this.authManager.currentUser.id,
        ...this.authManager.currentUser,
        financialProfile: profileData
      });
      
      console.log('✅ Financial profile created');
      
    } catch (error) {
      console.error('❌ Financial profile creation failed:', error);
      throw error;
    }
  }
  
  async processAccountSetup(data) {
    try {
      if (data.accounts && data.accounts.length > 0) {
        for (const account of data.accounts) {
          await this.databaseManager.create('accounts', {
            ...account,
            userId: this.authManager.currentUser.id,
            isActive: true,
            createdDuringOnboarding: true
          });
        }
        
        console.log(`✅ ${data.accounts.length} accounts created`);
      }
      
    } catch (error) {
      console.error('❌ Account setup failed:', error);
      // Don't throw error - account setup is optional
    }
  }
  
  async processGoalCreation(data) {
    try {
      if (data.goals && data.goals.length > 0) {
        for (const goal of data.goals) {
          await this.databaseManager.create('goals', {
            ...goal,
            userId: this.authManager.currentUser.id,
            isActive: true,
            createdDuringOnboarding: true,
            startDate: new Date().toISOString()
          });
        }
        
        console.log(`✅ ${data.goals.length} goals created`);
      }
      
    } catch (error) {
      console.error('❌ Goal creation failed:', error);
      // Don't throw error - goal creation is optional
    }
  }
  
  // === ONBOARDING COMPLETION === //
  
  async completeOnboarding() {
    try {
      console.log('🎉 Completing onboarding flow...');
      
      this.isCompleted = true;
      this.completionTime = new Date();
      
      // Calculate completion stats
      const completionStats = {
        totalTime: this.completionTime - this.startTime,
        stepsCompleted: this.stepHistory.length,
        stepsSkipped: this.getSkippedSteps().length,
        completionRate: this.getCompletionRate()
      };
      
      // Store onboarding completion
      await this.storeOnboardingCompletion(completionStats);
      
      // Track completion event
      this.trackEvent('onboarding_completed', {
        ...completionStats,
        timestamp: this.completionTime.toISOString()
      });
      
      // Notify completion listeners
      this.notifyCompletionListeners(completionStats);
      
      console.log('✅ Onboarding completed successfully');
      
      return {
        success: true,
        completed: true,
        stats: completionStats,
        nextSteps: this.stepData.nextSteps
      };
      
    } catch (error) {
      console.error('❌ Onboarding completion failed:', error);
      throw error;
    }
  }
  
  // === UTILITY METHODS === //
  
  getCurrentStepInfo() {
    const step = this.steps[this.currentStep];
    return {
      ...step,
      index: this.currentStep,
      isFirst: this.currentStep === 0,
      isLast: this.currentStep === this.totalSteps - 1,
      data: this.stepData || {}
    };
  }
  
  getProgress() {
    return {
      current: this.currentStep + 1,
      total: this.totalSteps,
      percentage: Math.round(((this.currentStep + 1) / this.totalSteps) * 100),
      estimatedTimeRemaining: this.calculateRemainingTime()
    };
  }
  
  calculateTotalEstimatedTime() {
    return this.steps.reduce((total, step) => total + step.estimatedTime, 0);
  }
  
  calculateRemainingTime() {
    const remainingSteps = this.steps.slice(this.currentStep + 1);
    return remainingSteps.reduce((total, step) => total + step.estimatedTime, 0);
  }
  
  detectUserCountry() {
    // Try to detect user's country from various sources
    
    // 1. Browser language
    const language = navigator.language || navigator.userLanguage;
    if (language) {
      const countryMap = {
        'en-NZ': 'NZ',
        'en-AU': 'AU',
        'en-GB': 'UK',
        'en-US': 'US',
        'en-CA': 'CA'
      };
      
      if (countryMap[language]) {
        return countryMap[language];
      }
    }
    
    // 2. Timezone (basic detection)
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone) {
      if (timezone.includes('Auckland') || timezone.includes('New_Zealand')) {
        return 'NZ';
      } else if (timezone.includes('Sydney') || timezone.includes('Melbourne')) {
        return 'AU';
      } else if (timezone.includes('London')) {
        return 'UK';
      } else if (timezone.includes('Toronto') || timezone.includes('Vancouver')) {
        return 'CA';
      }
    }
    
    // 3. Default to US
    return 'US';
  }
  
  getIncomeRanges(currency) {
    const ranges = {
      'USD': [
        { id: 'under_25k', label: 'Under $25,000', value: 25000 },
        { id: '25k_50k', label: '$25,000 - $50,000', value: 50000 },
        { id: '50k_75k', label: '$50,000 - $75,000', value: 75000 },
        { id: '75k_100k', label: '$75,000 - $100,000', value: 100000 },
        { id: '100k_150k', label: '$100,000 - $150,000', value: 150000 },
        { id: 'over_150k', label: 'Over $150,000', value: 200000 }
      ],
      'NZD': [
        { id: 'under_35k', label: 'Under $35,000', value: 35000 },
        { id: '35k_55k', label: '$35,000 - $55,000', value: 55000 },
        { id: '55k_75k', label: '$55,000 - $75,000', value: 75000 },
        { id: '75k_100k', label: '$75,000 - $100,000', value: 100000 },
        { id: '100k_150k