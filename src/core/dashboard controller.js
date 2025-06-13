/**
 * SmartFinanceAI - Dashboard Controller
 * Manages dashboard state, data loading, and real-time updates
 * Integrates with DatabaseManager and AccountManager for live data
 */

class DashboardController {
  constructor() {
    this.db = new DatabaseManager();
    this.accountManager = new AccountManager();
    this.state = {
      isLoading: true,
      hasData: false,
      user: null,
      accounts: [],
      recentTransactions: [],
      goals: [],
      financialSummary: {},
      budgetOverview: {},
      notifications: [],
      lastUpdate: null
    };
    
    this.updateInterval = null;
    this.refreshRate = 30000; // 30 seconds for real-time updates
    
    // Chart instances for cleanup
    this.chartInstances = {};
    
    // Dashboard widgets configuration
    this.widgets = {
      accountOverview: { enabled: true, order: 1, size: 'large' },
      goalProgress: { enabled: true, order: 2, size: 'medium' },
      recentTransactions: { enabled: true, order: 3, size: 'medium' },
      budgetStatus: { enabled: true, order: 4, size: 'small' },
      financialHealth: { enabled: true, order: 5, size: 'small' },
      insights: { enabled: true, order: 6, size: 'large' }
    };
  }

  /**
   * Initialize the dashboard
   */
  async initialize() {
    try {
      console.log('🚀 Initializing Dashboard...');
      
      // Initialize core systems
      await this.db.initializeDB();
      await this.accountManager.initialize();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Load initial data
      await this.loadDashboardData();
      
      // Start real-time updates if user has data
      if (this.state.hasData) {
        this.startRealTimeUpdates();
      }
      
      // Render dashboard
      this.renderDashboard();
      
      console.log('✅ Dashboard initialized successfully');
      
    } catch (error) {
      console.error('❌ Dashboard initialization failed:', error);
      this.showError('Failed to load dashboard. Please refresh the page.');
    }
  }

  /**
   * Load all dashboard data
   */
  async loadDashboardData() {
    this.showLoadingState();
    
    try {
      // Check if user has any financial data
      const summary = await this.db.getFinancialSummary();
      
      if (summary.accounts.total === 0) {
        // New user - show empty state
        this.showEmptyState();
        return;
      }
      
      // Load all dashboard data in parallel
      const [
        accounts,
        recentTransactions,
        goals,
        accountSummary
      ] = await Promise.all([
        this.accountManager.getUserAccounts(),
        this.loadRecentTransactions(),
        this.loadGoals(),
        this.accountManager.getAccountSummary()
      ]);
      
      // Update state
      this.state = {
        ...this.state,
        isLoading: false,
        hasData: true,
        accounts,
        recentTransactions,
        goals,
        financialSummary: summary,
        accountSummary,
        lastUpdate: new Date().toISOString()
      };
      
      // Calculate insights
      await this.generateInsights();
      
      console.log('📊 Dashboard data loaded:', this.state);
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      this.showError('Unable to load your financial data.');
    }
  }

  /**
   * Load recent transactions across all accounts
   */
  async loadRecentTransactions(limit = 20) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      return await this.db.getUserTransactions(
        null, 
        thirtyDaysAgo.toISOString().split('T')[0],
        null
      );
      
    } catch (error) {
      console.error('Failed to load recent transactions:', error);
      return [];
    }
  }

  /**
   * Load user goals
   */
  async loadGoals() {
    try {
      const goals = await this.db.getUserGoals();
      
      // Calculate progress for each goal
      return goals.map(goal => {
        const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
        const isCompleted = progressPercentage >= 100;
        
        // Calculate months remaining
        const today = new Date();
        const targetDate = new Date(goal.targetDate);
        const monthsRemaining = Math.max(0, 
          (targetDate.getFullYear() - today.getFullYear()) * 12 + 
          (targetDate.getMonth() - today.getMonth())
        );
        
        // Calculate required monthly contribution
        const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
        const requiredMonthly = monthsRemaining > 0 ? remainingAmount / monthsRemaining : 0;
        
        return {
          ...goal,
          progressPercentage: Math.