/**
 * SmartFinanceAI - Dashboard Controller
 * 
 * Manages the main dashboard state, data loading, and user interactions.
 * Handles both empty state (new users) and data-rich states.
 * 
 * Features:
 * - Dual-state dashboard (empty/populated)
 * - Real-time financial data updates
 * - Interactive widgets and charts
 * - Privacy mode toggle
 * - Smart insights and recommendations
 */

class DashboardController {
  constructor() {
    this.state = {
      isLoading: true,
      hasData: false,
      privacyMode: false,
      selectedTimeframe: '30d',
      widgets: new Map(),
      alerts: [],
      insights: [],
      refreshInterval: null
    };

    this.config = {
      refreshInterval: 5 * 60 * 1000, // 5 minutes
      animationDuration: 300,
      chartColors: {
        primary: '#8b5cf6',
        secondary: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444'
      }
    };

    this.eventHandlers = new Map();
    this.initialize();
  }

  async initialize() {
    try {
      console.log('Initializing Dashboard Controller...');
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Load dashboard data
      await this.loadDashboardData();
      
      // Initialize widgets
      await this.initializeWidgets();
      
      // Start real-time updates
      this.startRealTimeUpdates();
      
      // Check for user guidance needs
      await this.checkUserGuidance();
      
      console.log('Dashboard Controller initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize Dashboard Controller:', error);
      this.handleError(error);
    }
  }

  /**
   * Load dashboard data based on user state
   */
  async loadDashboardData() {
    try {
      this.setState({ isLoading: true });

      // Get user's financial data summary
      const dataSummary = await this.getFinancialDataSummary();
      
      // Determine dashboard state
      const hasData = this.hasFinancialData(dataSummary);
      
      if (hasData) {
        // Load full dashboard data
        await this.loadPopulatedDashboard(dataSummary);
      } else {
        // Show empty state dashboard
        await this.loadEmptyStateDashboard();
      }

      this.setState({ 
        isLoading: false, 
        hasData: hasData 
      });

      // Log dashboard load
      if (window.auditLogger) {
        await window.auditLogger.logUserAction('DASHBOARD_LOADED', {
          hasData: hasData,
          widgetCount: this.state.widgets.size,
          timeframe: this.state.selectedTimeframe
        });
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      this.setState({ isLoading: false });
      throw error;
    }
  }

  /**
   * Load populated dashboard with financial data
   * @private
   */
  async loadPopulatedDashboard(dataSummary) {
    try {
      // Load financial overview
      const overview = await this.loadFinancialOverview();
      
      // Load recent transactions
      const recentTransactions = await this.loadRecentTransactions();
      
      // Load goals progress
      const goalsProgress = await this.loadGoalsProgress();
      
      // Load budget status
      const budgetStatus = await this.loadBudgetStatus();
      
      // Load AI insights
      const insights = await this.loadAIInsights();
      
      // Load alerts and notifications
      const alerts = await this.loadAlerts();

      // Update state
      this.setState({
        overview: overview,
        recentTransactions: recentTransactions,
        goalsProgress: goalsProgress,
        budgetStatus: budgetStatus,
        insights: insights,
        alerts: alerts
      });

      // Render populated dashboard
      await this.renderPopulatedDashboard();
      
    } catch (error) {
      console.error('Failed to load populated dashboard:', error);
      throw error;
    }
  }

  /**
   * Load empty state dashboard for new users
   * @private
   */
  async loadEmptyStateDashboard() {
    try {
      // Get onboarding progress
      const onboardingProgress = await this.getOnboardingProgress();
      
      // Get suggested first steps
      const suggestedSteps = await this.getSuggestedFirstSteps();
      
      // Get demo data for previews
      const demoData = await this.getDemoData();

      // Update state
      this.setState({
        onboardingProgress: onboardingProgress,
        suggestedSteps: suggestedSteps,
        demoData: demoData
      });

      // Render empty state dashboard
      await this.renderEmptyStateDashboard();
      
    } catch (error) {
      console.error('Failed to load empty state dashboard:', error);
      throw error;
    }
  }

  /**
   * Render populated dashboard
   * @private
   */
  async renderPopulatedDashboard() {
    const container = document.getElementById('dashboard-container');
    if (!container) return;

    container.innerHTML = `
      <div class="dashboard-header">
        ${this.renderDashboardHeader()}
      </div>
      
      <div class="dashboard-grid">
        ${this.renderFinancialOverview()}
        ${this.renderQuickActions()}
        ${this.renderGoalsWidget()}
        ${this.renderBudgetWidget()}
        ${this.renderTransactionsWidget()}
        ${this.renderInsightsWidget()}
        ${this.renderChartsWidget()}
        ${this.renderAlertsWidget()}
      </div>
    `;

    // Initialize interactive elements
    await this.initializeInteractiveElements();
    
    // Apply animations
    this.applyEntryAnimations();
  }

  /**
   * Render empty state dashboard
   * @private
   */
  async renderEmptyStateDashboard() {
    const container = document.getElementById('dashboard-container');
    if (!container) return;

    container.innerHTML = `
      <div class="empty-state-dashboard">
        ${this.renderWelcomeSection()}
        ${this.renderOnboardingProgress()}
        ${this.renderQuickSetupActions()}
        ${this.renderFeaturePreview()}
        ${this.renderGettingStartedGuide()}
      </div>
    `;

    // Initialize empty state interactions
    await this.initializeEmptyStateInteractions();
  }

  /**
   * Render dashboard header
   * @private
   */
  renderDashboardHeader() {
    const currentUser = this.getCurrentUser();
    const greeting = this.getTimeBasedGreeting();
    
    return `
      <div class="dashboard-welcome">
        <h1 class="welcome-title">
          ${greeting}, ${currentUser.displayName || 'there'}! 👋
        </h1>
        <p class="welcome-subtitle">
          Here's your financial overview for ${this.formatTimeframe(this.state.selectedTimeframe)}
        </p>
      </div>
      
      <div class="dashboard-controls">
        <div class="timeframe-selector">
          ${this.renderTimeframeSelector()}
        </div>
        
        <div class="dashboard-actions">
          ${this.renderPrivacyToggle()}
          ${this.renderRefreshButton()}
          ${this.renderQuickAddButton()}
        </div>
      </div>
    `;
  }

  /**
   * Render financial overview widget
   * @private
   */
  renderFinancialOverview() {
    const overview = this.state.overview;
    if (!overview) return '';

    return `
      <div class="widget financial-overview glass" data-widget="overview">
        <div class="widget-header">
          <h3 class="widget-title">Financial Overview</h3>
          <button class="widget-expand" data-action="expand-overview">
            <i class="icon-expand"></i>
          </button>
        </div>
        
        <div class="overview-grid">
          <div class="overview-item">
            <div class="overview-label">Total Balance</div>
            <div class="overview-value financial-amount ${this.state.privacyMode ? 'privacy-blur' : ''}" 
                 data-financial="${overview.totalBalance}">
              ${this.formatCurrency(overview.totalBalance)}
            </div>
            <div class="overview-change ${overview.balanceChange >= 0 ? 'positive' : 'negative'}">
              ${overview.balanceChange >= 0 ? '+' : ''}${this.formatCurrency(overview.balanceChange)} this month
            </div>
          </div>
          
          <div class="overview-item">
            <div class="overview-label">Monthly Income</div>
            <div class="overview-value financial-amount ${this.state.privacyMode ? 'privacy-blur' : ''}"
                 data-financial="${overview.monthlyIncome}">
              ${this.formatCurrency(overview.monthlyIncome)}
            </div>
            <div class="overview-change ${overview.incomeChange >= 0 ? 'positive' : 'negative'}">
              ${overview.incomeChange >= 0 ? '+' : ''}${this.formatCurrency(overview.incomeChange)} vs last month
            </div>
          </div>
          
          <div class="overview-item">
            <div class="overview-label">Monthly Spending</div>
            <div class="overview-value financial-amount ${this.state.privacyMode ? 'privacy-blur' : ''}"
                 data-financial="${overview.monthlySpending}">
              ${this.formatCurrency(overview.monthlySpending)}
            </div>
            <div class="overview-change ${overview.spendingChange <= 0 ? 'positive' : 'negative'}">
              ${overview.spendingChange >= 0 ? '+' : ''}${this.formatCurrency(overview.spendingChange)} vs last month
            </div>
          </div>
          
          <div class="overview-item">
            <div class="overview-label">Savings Rate</div>
            <div class="overview-value">
              ${overview.savingsRate.toFixed(1)}%
            </div>
            <div class="overview-change ${overview.savingsRateChange >= 0 ? 'positive' : 'negative'}">
              ${overview.savingsRateChange >= 0 ? '+' : ''}${overview.savingsRateChange.toFixed(1)}% vs last month
            </div>
          </div>
        </div>
        
        <div class="financial-health">
          <div class="health-score">
            <div class="health-label">Financial Health Score</div>
            <div class="health-value">
              <span class="health-number">${overview.healthScore}</span>
              <span class="health-max">/100</span>
            </div>
          </div>
          <div class="health-progress">
            <div class="health-bar">
              <div class="health-fill" style="width: ${overview.healthScore}%"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render goals widget
   * @private
   */
  renderGoalsWidget() {
    const goals = this.state.goalsProgress;
    if (!goals || goals.length === 0) {
      return this.renderEmptyGoalsWidget();
    }

    return `
      <div class="widget goals-widget glass" data-widget="goals">
        <div class="widget-header">
          <h3 class="widget-title">
            Goals Progress
            <span class="goals-count">${goals.length}</span>
          </h3>
          <button class="widget-action" data-action="view-all-goals">
            View All
          </button>
        </div>