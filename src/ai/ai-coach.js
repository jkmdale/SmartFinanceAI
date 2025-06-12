/**
 * 🤖 SmartFinanceAI - AI Financial Coach
 * File: src/ai/ai-coach.js
 * 
 * Advanced AI-powered financial coaching system that provides personalized
 * insights, recommendations, and guidance based on user's financial data.
 * 
 * Features:
 * - Privacy-safe AI analysis (no raw data sent to external APIs)
 * - Spending pattern analysis and behavior insights
 * - Personalized budget recommendations
 * - Goal optimization strategies
 * - Natural language financial chat interface
 * - Predictive cash flow forecasting
 * - Country-specific financial advice
 * - Multi-language support
 * - Offline-capable insights engine
 * 
 * Privacy: All sensitive data is anonymized/aggregated before any AI processing
 * 
 * @author SmartFinanceAI Team
 * @version 1.0.0
 */

class AIFinancialCoach {
  constructor(databaseManager, localization) {
    this.database = databaseManager;
    this.localization = localization;
    this.insightsEngine = new FinancialInsightsEngine();
    this.patternAnalyzer = new SpendingPatternAnalyzer();
    this.budgetOptimizer = new BudgetOptimizer();
    this.goalCoach = new GoalCoach();
    this.chatInterface = new FinancialChatInterface();
    this.cashFlowPredictor = new CashFlowPredictor();
    
    // AI Configuration
    this.aiConfig = {
      useExternalAI: false, // Set to true if OpenAI API available
      apiKey: null, // Set from environment if available
      model: 'gpt-4',
      maxTokens: 1000,
      temperature: 0.7
    };
    
    // Cache for insights to improve performance
    this.insightsCache = new Map();
    this.lastAnalysis = null;
    this.analysisValidityPeriod = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Initialize AI Coach with user's financial data
   */
  async initialize(userId) {
    try {
      this.userId = userId;
      
      // Load user's financial profile
      this.userProfile = await this.database.getUserProfile(userId);
      this.transactions = await this.database.getTransactions(userId);
      this.goals = await this.database.getUserGoals(userId);
      this.budgets = await this.database.getUserBudgets(userId);
      
      // Initialize country-specific coaching rules
      await this.initializeCountrySpecificRules();
      
      // Perform initial analysis
      await this.performInitialAnalysis();
      
      console.log('AI Financial Coach initialized successfully');
      return true;
      
    } catch (error) {
      console.error('Failed to initialize AI Coach:', error);
      return false;
    }
  }

  /**
   * Initialize country-specific coaching rules and advice
   */
  async initializeCountrySpecificRules() {
    const country = this.userProfile?.country || 'US';
    const countryConfig = this.localization.getCountryConfig(country);
    
    this.countryRules = {
      country: country,
      currency: countryConfig.currency,
      emergencyFundMonths: countryConfig.emergencyFundMonths,
      taxYear: countryConfig.taxYear,
      retirementAccount: countryConfig.retirementAccount || '401k',
      
      // Country-specific advice templates
      advice: {
        'NZ': {
          emergencyFund: 'Build 3 months of expenses as NZ has strong social safety nets',
          retirement: 'Maximize KiwiSaver contributions and employer matching',
          housing: 'Consider First Home Grant and KiwiSaver withdrawal for deposit',
          tax: 'Financial year runs April-March, optimize timing of investments'
        },
        'AU': {
          emergencyFund: 'Build 3-6 months of expenses for financial security',
          retirement: 'Maximize superannuation contributions and salary sacrifice',
          housing: 'Explore First Home Super Saver Scheme for house deposits',
          tax: 'Financial year runs July-June, consider pre-tax investments'
        },
        'UK': {
          emergencyFund: 'Build 3-6 months of expenses in easy access savings',
          retirement: 'Maximize workplace pension and consider SIPP contributions',
          housing: 'Use Help to Buy ISA or Lifetime ISA for first home',
          tax: 'Utilize ISA allowances and consider pension tax relief'
        },
        'US': {
          emergencyFund: 'Build 6 months of expenses due to limited social safety net',
          retirement: 'Maximize 401k match, then max IRA, then max 401k',
          housing: 'Consider down payment assistance programs for first-time buyers',
          tax: 'Use tax-advantaged accounts like 401k, IRA, and HSA'
        },
        'CA': {
          emergencyFund: 'Build 3-6 months of expenses with TFSA for tax-free growth',
          retirement: 'Maximize RRSP contributions and employer matching',
          housing: 'Use First Time Home Buyer Incentive and RRSP Home Buyers Plan',
          tax: 'Balance RRSP (tax deduction) and TFSA (tax-free growth)'
        }
      }[country] || this.advice['US'] // Default to US advice
    };
  }

  /**
   * Perform comprehensive financial analysis
   */
  async performInitialAnalysis() {
    try {
      // Check if recent analysis exists
      if (this.hasValidCachedAnalysis()) {
        this.currentInsights = this.lastAnalysis;
        return this.currentInsights;
      }
      
      // Perform fresh analysis
      console.log('Performing comprehensive financial analysis...');
      
      const analysisData = {
        spendingPatterns: await this.patternAnalyzer.analyzeSpendingPatterns(this.transactions),
        budgetAnalysis: await this.budgetOptimizer.analyzeBudgetPerformance(this.transactions, this.budgets),
        goalProgress: await this.goalCoach.analyzeGoalProgress(this.goals, this.transactions),
        cashFlowForecast: await this.cashFlowPredictor.generateForecast(this.transactions),
        financialHealth: await this.calculateFinancialHealthScore(),
        insights: await this.generatePersonalizedInsights(),
        recommendations: await this.generateActionableRecommendations()
      };
      
      // Cache the analysis
      this.lastAnalysis = {
        timestamp: Date.now(),
        data: analysisData
      };
      
      this.currentInsights = this.lastAnalysis;
      
      // Store insights in database
      await this.database.saveUserInsights(this.userId, analysisData);
      
      return analysisData;
      
    } catch (error) {
      console.error('Analysis failed:', error);
      return this.generateFallbackInsights();
    }
  }

  /**
   * Check if cached analysis is still valid
   */
  hasValidCachedAnalysis() {
    if (!this.lastAnalysis) return false;
    
    const age = Date.now() - this.lastAnalysis.timestamp;
    return age < this.analysisValidityPeriod;
  }

  /**
   * Calculate comprehensive financial health score (0-100)
   */
  async calculateFinancialHealthScore() {
    const metrics = {
      emergencyFund: 0,    // 25 points
      debtToIncome: 0,     // 20 points
      savingsRate: 0,      // 20 points
      budgetAdherence: 0,  // 15 points
      goalProgress: 0,     // 10 points
      diversification: 0   // 10 points
    };
    
    try {
      const monthlyIncome = this.calculateMonthlyIncome();
      const monthlyExpenses = this.calculateMonthlyExpenses();
      const totalSavings = this.calculateTotalSavings();
      const totalDebt = this.calculateTotalDebt();
      
      // Emergency Fund Score (25 points)
      const emergencyFundMonths = totalSavings / monthlyExpenses;
      const targetMonths = this.countryRules.emergencyFundMonths;
      metrics.emergencyFund = Math.min(25, (emergencyFundMonths / targetMonths) * 25);
      
      // Debt-to-Income Score (20 points)
      const debtToIncomeRatio = totalDebt / (monthlyIncome * 12);
      if (debtToIncomeRatio <= 0.1) metrics.debtToIncome = 20;
      else if (debtToIncomeRatio <= 0.2) metrics.debtToIncome = 15;
      else if (debtToIncomeRatio <= 0.3) metrics.debtToIncome = 10;
      else if (debtToIncomeRatio <= 0.4) metrics.debtToIncome = 5;
      else metrics.debtToIncome = 0;
      
      // Savings Rate Score (20 points)
      const savingsRate = (monthlyIncome - monthlyExpenses) / monthlyIncome;
      if (savingsRate >= 0.2) metrics.savingsRate = 20;
      else if (savingsRate >= 0.15) metrics.savingsRate = 15;
      else if (savingsRate >= 0.1) metrics.savingsRate = 10;
      else if (savingsRate >= 0.05) metrics.savingsRate = 5;
      else metrics.savingsRate = 0;
      
      // Budget Adherence Score (15 points)
      if (this.budgets && this.budgets.length > 0) {
        const adherenceRate = this.calculateBudgetAdherence();
        metrics.budgetAdherence = adherenceRate * 15;
      }
      
      // Goal Progress Score (10 points)
      if (this.goals && this.goals.length > 0) {
        const avgProgress = this.goals.reduce((sum, goal) => sum + (goal.progress || 0), 0) / this.goals.length;
        metrics.goalProgress = (avgProgress / 100) * 10;
      }
      
      // Investment Diversification Score (10 points)
      const investmentAccounts = this.countNonCashAccounts();
      if (investmentAccounts >= 3) metrics.diversification = 10;
      else if (investmentAccounts >= 2) metrics.diversification = 7;
      else if (investmentAccounts >= 1) metrics.diversification = 4;
      else metrics.diversification = 0;
      
      const totalScore = Object.values(metrics).reduce((sum, score) => sum + score, 0);
      
      return {
        totalScore: Math.round(totalScore),
        breakdown: metrics,
        grade: this.getHealthGrade(totalScore),
        recommendations: this.generateHealthRecommendations(metrics)
      };
      
    } catch (error) {
      console.error('Health score calculation failed:', error);
      return {
        totalScore: 50,
        breakdown: metrics,
        grade: 'C',
        recommendations: ['Complete your financial profile for personalized insights']
      };
    }
  }

  /**
   * Get health grade based on score
   */
  getHealthGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  }

  /**
   * Generate personalized insights based on user's financial data
   */
  async generatePersonalizedInsights() {
    const insights = [];
    
    try {
      // Spending Insights
      const spendingInsights = await this.generateSpendingInsights();
      insights.push(...spendingInsights);
      
      // Income Insights
      const incomeInsights = await this.generateIncomeInsights();
      insights.push(...incomeInsights);
      
      // Savings Insights
      const savingsInsights = await this.generateSavingsInsights();
      insights.push(...savingsInsights);
      
      // Goal Insights
      const goalInsights = await this.generateGoalInsights();
      insights.push(...goalInsights);
      
      // Country-specific insights
      const countryInsights = await this.generateCountrySpecificInsights();
      insights.push(...countryInsights);
      
      // Prioritize insights by importance
      return this.prioritizeInsights(insights);
      
    } catch (error) {
      console.error('Insight generation failed:', error);
      return this.getFallbackInsights();
    }
  }

  /**
   * Generate spending-related insights
   */
  async generateSpendingInsights() {
    const insights = [];
    const last30Days = this.getTransactionsInPeriod(30);
    const last60Days = this.getTransactionsInPeriod(60);
    
    // Category analysis
    const categorySpending = this.groupTransactionsByCategory(last30Days);
    const topCategory = Object.entries(categorySpending)
      .sort(([,a], [,b]) => Math.abs(b) - Math.abs(a))[0];
    
    if (topCategory) {
      insights.push({
        type: 'spending',
        category: 'category_analysis',
        title: `${topCategory[0]} is your biggest expense`,
        message: `You spent ${this.formatCurrency(Math.abs(topCategory[1]))} on ${topCategory[0]} this month.`,
        importance: 'high',
        actionable: true,
        suggestions: [
          `Review your ${topCategory[0]} expenses for potential savings`,
          `Set a monthly budget limit for ${topCategory[0]}`,
          `Look for alternatives or discounts in this category`
        ]
      });
    }
    
    // Spending trend analysis
    const currentSpending = this.sumTransactions(last30Days);
    const previousSpending = this.sumTransactions(last60Days.slice(30));
    const spendingChange = ((currentSpending - previousSpending) / previousSpending) * 100;
    
    if (Math.abs(spendingChange) > 15) {
      insights.push({
        type: 'spending',
        category: 'trend_analysis',
        title: spendingChange > 0 ? 'Spending increased significantly' : 'Great job reducing spending!',
        message: `Your spending ${spendingChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(spendingChange).toFixed(1)}% compared to last month.`,
        importance: spendingChange > 0 ? 'high' : 'medium',
        actionable: spendingChange > 0,
        suggestions: spendingChange > 0 ? [
          'Review recent large purchases',
          'Check for any subscription changes',
          'Set alerts for unusual spending'
        ] : [
          'Keep up the great work!',
          'Consider allocating savings to goals',
          'Review what changes led to reduced spending'
        ]
      });
    }
    
    // Unusual transaction detection
    const unusualTransactions = this.detectUnusualTransactions(last30Days);
    if (unusualTransactions.length > 0) {
      insights.push({
        type: 'spending',
        category: 'anomaly_detection',
        title: 'Unusual transactions detected',
        message: `Found ${unusualTransactions.length} transactions that seem unusual based on your patterns.`,
        importance: 'medium',
        actionable: true,
        data: unusualTransactions.slice(0, 3), // Show top 3
        suggestions: [
          'Review these transactions for accuracy',
          'Verify if these are one-time or recurring',
          'Update transaction categories if needed'
        ]
      });
    }
    
    return insights;
  }

  /**
   * Generate income-related insights
   */
  async generateIncomeInsights() {
    const insights = [];
    const incomeTransactions = this.getIncomeTransactions();
    
    if (incomeTransactions.length === 0) {
      insights.push({
        type: 'income',
        category: 'setup',
        title: 'Add your income for better insights',
        message: 'Track your salary and other income sources to get personalized financial coaching.',
        importance: 'high',
        actionable: true,
        suggestions: [
          'Add your primary salary/wage',
          'Include side income and bonuses',
          'Set up automatic income categorization'
        ]
      });
      return insights;
    }
    
    // Income stability analysis
    const monthlyIncomes = this.groupIncomeByMonth(incomeTransactions);
    const incomeVariability = this.calculateIncomeVariability(monthlyIncomes);
    
    if (incomeVariability > 0.2) {
      insights.push({
        type: 'income',
        category: 'stability',
        title: 'Variable income detected',
        message: 'Your income varies month to month. Consider building a larger emergency fund.',
        importance: 'medium',
        actionable: true,
        suggestions: [
          `Build ${this.countryRules.emergencyFundMonths + 2} months of expenses as emergency fund`,
          'Create a baseline budget using your lowest income month',
          'Consider income smoothing strategies'
        ]
      });
    }
    
    return insights;
  }

  /**
   * Generate savings-related insights
   */
  async generateSavingsInsights() {
    const insights = [];
    const monthlyIncome = this.calculateMonthlyIncome();
    const monthlyExpenses = this.calculateMonthlyExpenses();
    const monthlySavings = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlySavings / monthlyIncome;
    
    // Savings rate analysis
    if (savingsRate < 0) {
      insights.push({
        type: 'savings',
        category: 'deficit',
        title: 'You\'re spending more than you earn',
        message: `You have a monthly deficit of ${this.formatCurrency(Math.abs(monthlySavings))}.`,
        importance: 'critical',
        actionable: true,
        suggestions: [
          'Review and cut non-essential expenses immediately',
          'Look for ways to increase income',
          'Create a strict budget to eliminate deficit',
          'Consider debt consolidation if applicable'
        ]
      });
    } else if (savingsRate < 0.1) {
      insights.push({
        type: 'savings',
        category: 'low_savings',
        title: 'Low savings rate needs improvement',
        message: `You're saving ${(savingsRate * 100).toFixed(1)}% of income. Aim for at least 10%.`,
        importance: 'high',
        actionable: true,
        suggestions: [
          'Identify areas to reduce spending',
          'Automate savings transfers',
          'Set up a "pay yourself first" system',
          'Start with small, achievable savings goals'
        ]
      });
    } else if (savingsRate >= 0.2) {
      insights.push({
        type: 'savings',
        category: 'excellent_savings',
        title: 'Excellent savings rate!',
        message: `You're saving ${(savingsRate * 100).toFixed(1)}% of income. Great job!`,
        importance: 'positive',
        actionable: true,
        suggestions: [
          'Consider increasing investment contributions',
          'Explore tax-advantaged accounts',
          'Review if you can afford to take more investment risk',
          'Set up automatic investing'
        ]
      });
    }
    
    return insights;
  }

  /**
   * Generate goal-related insights
   */
  async generateGoalInsights() {
    const insights = [];
    
    if (!this.goals || this.goals.length === 0) {
      insights.push({
        type: 'goals',
        category: 'setup',
        title: 'Set financial goals for motivation',
        message: 'Create specific financial goals to stay motivated and track progress.',
        importance: 'medium',
        actionable: true,
        suggestions: [
          'Start with an emergency fund goal',
          'Set a savings goal for something you want',
          'Create long-term goals like retirement',
          'Use SMART goal criteria (Specific, Measurable, Achievable, Relevant, Time-bound)'
        ]
      });
      return insights;
    }
    
    // Analyze goal progress
    for (const goal of this.goals) {
      const progress = this.calculateGoalProgress(goal);
      
      if (progress.onTrack === false && progress.monthsRemaining > 0) {
        insights.push({
          type: 'goals',
          category: 'behind_schedule',
          title: `${goal.name} goal needs attention`,
          message: `You need to save ${this.formatCurrency(progress.requiredMonthlyContribution)} monthly to reach this goal on time.`,
          importance: 'medium',
          actionable: true,
          goalId: goal.id,
          suggestions: [
            `Increase monthly contribution to ${this.formatCurrency(progress.requiredMonthlyContribution)}`,
            'Review and adjust goal timeline if needed',
            'Look for additional income or expense cuts',
            'Consider breaking goal into smaller milestones'
          ]
        });
      } else if (progress.progressPercentage >= 90) {
        insights.push({
          type: 'goals',
          category: 'nearly_complete',
          title: `${goal.name} goal almost complete!`,
          message: `You're ${progress.progressPercentage.toFixed(1)}% of the way to your goal.`,
          importance: 'positive',
          actionable: true,
          goalId: goal.id,
          suggestions: [
            'Keep up the momentum',
            'Start planning your next goal',
            'Celebrate this achievement',
            'Consider what you learned from this goal'
          ]
        });
      }
    }
    
    return insights;
  }

  /**
   * Generate country-specific financial insights
   */
  async generateCountrySpecificInsights() {
    const insights = [];
    const country = this.countryRules.country;
    const advice = this.countryRules.advice;
    
    // Tax year optimization
    const currentDate = new Date();
    const taxYearEnd = this.getTaxYearEnd(country);
    const monthsUntilTaxYear = this.getMonthsUntil(taxYearEnd);
    
    if (monthsUntilTaxYear <= 3) {
      insights.push({
        type: 'tax',
        category: 'year_end_planning',
        title: 'Tax year ending soon',
        message: `${monthsUntilTaxYear} months until tax year end. Time for tax planning.`,
        importance: 'medium',
        actionable: true,
        suggestions: [
          advice.tax,
          'Review tax-advantaged investment contributions',
          'Consider tax-loss harvesting if applicable',
          'Gather documents for tax preparation'
        ]
      });
    }
    
    // Retirement account optimization
    if (country === 'NZ' && this.hasKiwiSaver()) {
      insights.push({
        type: 'retirement',
        category: 'kiwisaver',
        title: 'Optimize your KiwiSaver',
        message: advice.retirement,
        importance: 'medium',
        actionable: true,
        suggestions: [
          'Check if you\'re getting maximum employer contribution',
          'Review your KiwiSaver fund performance',
          'Consider increasing contribution rate',
          'Ensure you\'re getting government contribution'
        ]
      });
    }
    
    return insights;
  }

  /**
   * Generate actionable recommendations based on analysis
   */
  async generateActionableRecommendations() {
    const recommendations = [];
    
    try {
      const financialHealth = await this.calculateFinancialHealthScore();
      const healthMetrics = financialHealth.breakdown;
      
      // Emergency fund recommendations
      if (healthMetrics.emergencyFund < 15) {
        recommendations.push({
          category: 'emergency_fund',
          priority: 'high',
          title: 'Build your emergency fund',
          description: `You need ${this.countryRules.emergencyFundMonths} months of expenses saved for emergencies.`,
          actions: [
            {
              action: 'Calculate target amount',
              description: `Target: ${this.formatCurrency(this.calculateMonthlyExpenses() * this.countryRules.emergencyFundMonths)}`,
              completed: false
            },
            {
              action: 'Open high-yield savings account',
              description: 'Keep emergency fund separate and accessible',
              completed: false
            },
            {
              action: 'Set up automatic transfer',
              description: 'Automate monthly contributions to emergency fund',
              completed: false
            }
          ],
          impact: 'High - Essential for financial security',
          timeframe: '6-12 months'
        });
      }
      
      // Budget recommendations
      if (healthMetrics.budgetAdherence < 10) {
        recommendations.push({
          category: 'budgeting',
          priority: 'high',
          title: 'Create and follow a budget',
          description: 'A budget helps you control spending and reach your goals faster.',
          actions: [
            {
              action: 'Create monthly budget',
              description: 'Use the 50/30/20 rule as a starting point',
              completed: false
            },
            {
              action: 'Track expenses weekly',
              description: 'Review spending vs budget every week',
              completed: false
            },
            {
              action: 'Set up spending alerts',
              description: 'Get notified when approaching budget limits',
              completed: false
            }
          ],
          impact: 'High - Foundation of financial success',
          timeframe: '1 month'
        });
      }
      
      // Debt recommendations
      if (healthMetrics.debtToIncome < 15) {
        recommendations.push({
          category: 'debt',
          priority: 'high',
          title: 'Reduce high-interest debt',
          description: 'Focus on paying off credit cards and high-interest loans first.',
          actions: [
            {
              action: 'List all debts',
              description: 'Include balances, interest rates, and minimum payments',
              completed: false
            },
            {
              action: 'Choose payoff strategy',
              description: 'Use debt avalanche (highest interest first) or snowball method',
              completed: false
            },
            {
              action: 'Make extra payments',
              description: 'Apply any extra money to debt payments',
              completed: false
            }
          ],
          impact: 'High - Saves money on interest',
          timeframe: '12-36 months'
        });
      }
      
      // Investment recommendations
      if (healthMetrics.diversification < 7) {
        recommendations.push({
          category: 'investing',
          priority: 'medium',
          title: 'Start investing for the future',
          description: `Maximize ${this.countryRules.retirementAccount} and consider additional investments.`,
          actions: [
            {
              action: 'Maximize employer match',
              description: 'Get full employer retirement account matching',
              completed: false
            },
            {
              action: 'Open investment account',
              description: 'Start with low-cost index funds',
              completed: false
            },
            {
              action: 'Automate investments',
              description: 'Set up automatic monthly contributions',
              completed: false
            }
          ],
          impact: 'High - Compound growth over time',
          timeframe: 'Ongoing'
        });
      }
      
      // Savings rate recommendations
      if (healthMetrics.savingsRate < 15) {
        recommendations.push({
          category: 'savings',
          priority: 'medium',
          title: 'Increase your savings rate',
          description: 'Aim to save at least 10-20% of your income.',
          actions: [
            {
              action: 'Identify expense cuts',
              description: 'Review discretionary spending for reductions',
              completed: false
            },
            {
              action: 'Increase income',
              description: 'Consider side hustles or skill development',
              completed: false
            },
            {
              action: 'Automate savings',
              description: 'Pay yourself first with automatic transfers',
              completed: false
            }
          ],
          impact: 'Medium - Accelerates goal achievement',
          timeframe: '3-6 months'
        });
      }
      
      return recommendations.sort((a, b) => {
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
      
    } catch (error) {
      console.error('Recommendation generation failed:', error);
      return this.getFallbackRecommendations();
    }
  }

  /**
   * Handle natural language chat queries about finances
   */
  async handleChatQuery(userMessage) {
    try {
      // Sanitize and parse user message
      const cleanMessage = this.sanitizeUserInput(userMessage);
      const intent = this.chatInterface.parseUserIntent(cleanMessage);
      
      // Generate context-aware response
      const response = await this.generateChatResponse(intent, cleanMessage);
      
      return {
        success: true,
        response: response,
        suggestions: this.generateFollowUpSuggestions(intent)
      };
      
    } catch (error) {
      console.error('Chat query failed:', error);
      return {
        success: false,
        response: "I'm having trouble understanding that. Could you try rephrasing your question?",
        suggestions: [
          "How much did I spend last month?",
          "What's my biggest expense category?",
          "Am I on track with my savings goals?",
          "Show me my financial health score"
        ]
      };
    }
  }

  /**
   * Generate chat response based on user intent
   */
  async generateChatResponse(intent, userMessage) {
    switch (intent.type) {
      case 'spending_query':
        return await this.handleSpendingQuery(intent);
        
      case 'income_query':
        return await this.handleIncomeQuery(intent);
        
      case 'goal_query':
        return await this.handleGoalQuery(intent);
        
      case 'budget_query':
        return await this.handleBudgetQuery(intent);
        
      case 'health_score_query':
        return await this.handleHealthScoreQuery(intent);
        
      case 'advice_request':
        return await this.handleAdviceRequest(intent);
        
      case 'prediction_query':
        return await this.handlePredictionQuery(intent);
        
      default:
        return await this.handleGeneralQuery(userMessage);
    }
  }

  /**
   * Handle spending-related queries
   */
  async handleSpendingQuery(intent) {
    const timeframe = intent.timeframe || 30; // Default to last 30 days
    const category = intent.category;
    
    let transactions = this.getTransactionsInPeriod(timeframe);
    
    if (category) {
      transactions = transactions.filter(t => 
        t.category && t.category.toLowerCase().includes(category.toLowerCase())
      );
    }
    
    const totalSpent = this.sumTransactions(transactions.filter(t => t.amount < 0));
    const transactionCount = transactions.filter(t => t.amount < 0).length;
    
    let response = `In the last ${timeframe} days, `;
    
    if (category) {
      response += `you spent ${this.formatCurrency(Math.abs(totalSpent))} on ${category} across ${transactionCount} transactions.`;
    } else {
      response += `you spent ${this.formatCurrency(Math.abs(totalSpent))} across ${transactionCount} transactions.`;
    }
    
    // Add context and insights
    const avgDaily = Math.abs(totalSpent) / timeframe;
    response += ` That's an average of ${this.formatCurrency(avgDaily)} per day.`;
    
    // Compare to previous period
    const previousTransactions = this.getTransactionsInPeriod(timeframe * 2).slice(timeframe);
    const previousSpent = Math.abs(this.sumTransactions(previousTransactions.filter(t => t.amount < 0)));
    const change = ((Math.abs(totalSpent) - previousSpent) / previousSpent) * 100;
    
    if (Math.abs(change) > 5) {
      response += ` This is ${change > 0 ? 'an increase' : 'a decrease'} of ${Math.abs(change).toFixed(1)}% compared to the previous ${timeframe} days.`;
    }
    
    return response;
  }

  /**
   * Handle income-related queries
   */
  async handleIncomeQuery(intent) {
    const timeframe = intent.timeframe || 30;
    const incomeTransactions = this.getIncomeTransactions(timeframe);
    
    if (incomeTransactions.length === 0) {
      return "I don't see any income transactions in your data yet. Add your salary and other income sources to get better insights about your earnings.";
    }
    
    const totalIncome = this.sumTransactions(incomeTransactions);
    const avgMonthlyIncome = this.calculateMonthlyIncome();
    
    let response = `In the last ${timeframe} days, you earned ${this.formatCurrency(totalIncome)}.`;
    
    if (timeframe >= 30) {
      response += ` Your average monthly income is ${this.formatCurrency(avgMonthlyIncome)}.`;
    }
    
    // Income stability insight
    const incomeVariability = this.calculateIncomeVariability(this.groupIncomeByMonth(incomeTransactions));
    if (incomeVariability > 0.2) {
      response += " Your income varies significantly month to month, so consider building a larger emergency fund.";
    }
    
    return response;
  }

  /**
   * Handle goal-related queries
   */
  async handleGoalQuery(intent) {
    if (!this.goals || this.goals.length === 0) {
      return "You haven't set any financial goals yet. Would you like help creating your first goal? I recommend starting with an emergency fund.";
    }
    
    const goalName = intent.goalName;
    let targetGoals = this.goals;
    
    if (goalName) {
      targetGoals = this.goals.filter(g => 
        g.name.toLowerCase().includes(goalName.toLowerCase())
      );
      
      if (targetGoals.length === 0) {
        return `I couldn't find a goal named "${goalName}". Your current goals are: ${this.goals.map(g => g.name).join(', ')}.`;
      }
    }
    
    let response = '';
    
    for (const goal of targetGoals) {
      const progress = this.calculateGoalProgress(goal);
      response += `**${goal.name}**: You're ${progress.progressPercentage.toFixed(1)}% complete (${this.formatCurrency(goal.currentAmount)} of ${this.formatCurrency(goal.targetAmount)}). `;
      
      if (progress.onTrack) {
        response += `You're on track to reach this goal by ${new Date(goal.targetDate).toLocaleDateString()}. `;
      } else {
        response += `To stay on track, you need to save ${this.formatCurrency(progress.requiredMonthlyContribution)} per month. `;
      }
    }
    
    return response.trim();
  }

  /**
   * Handle budget-related queries
   */
  async handleBudgetQuery(intent) {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyTransactions = this.getTransactionsForMonth(currentMonth, currentYear);
    
    if (!this.budgets || this.budgets.length === 0) {
      const monthlySpending = Math.abs(this.sumTransactions(monthlyTransactions.filter(t => t.amount < 0)));
      return `You don't have a budget set up yet. This month, you've spent ${this.formatCurrency(monthlySpending)}. Would you like help creating a budget?`;
    }
    
    const budget = this.budgets[0]; // Assume most recent budget
    const budgetPerformance = this.calculateBudgetPerformance(monthlyTransactions, budget);
    
    let response = `This month's budget performance:\n`;
    
    for (const [category, performance] of Object.entries(budgetPerformance)) {
      const percentUsed = (performance.spent / performance.budgeted) * 100;
      const status = percentUsed > 100 ? '🔴 Over' : percentUsed > 80 ? '🟡 High' : '🟢 Good';
      
      response += `${status} **${category}**: ${this.formatCurrency(performance.spent)} of ${this.formatCurrency(performance.budgeted)} (${percentUsed.toFixed(1)}%)\n`;
    }
    
    const totalBudgeted = Object.values(budgetPerformance).reduce((sum, p) => sum + p.budgeted, 0);
    const totalSpent = Object.values(budgetPerformance).reduce((sum, p) => sum + p.spent, 0);
    const remaining = totalBudgeted - totalSpent;
    
    response += `\n**Overall**: ${this.formatCurrency(remaining)} ${remaining >= 0 ? 'remaining' : 'over budget'} this month.`;
    
    return response;
  }

  /**
   * Handle health score queries
   */
  async handleHealthScoreQuery(intent) {
    const healthScore = await this.calculateFinancialHealthScore();
    
    let response = `Your financial health score is **${healthScore.totalScore}/100** (Grade: ${healthScore.grade}).\n\n`;
    
    response += "**Breakdown:**\n";
    response += `• Emergency Fund: ${healthScore.breakdown.emergencyFund.toFixed(0)}/25\n`;
    response += `• Debt Management: ${healthScore.breakdown.debtToIncome.toFixed(0)}/20\n`;
    response += `• Savings Rate: ${healthScore.breakdown.savingsRate.toFixed(0)}/20\n`;
    response += `• Budget Adherence: ${healthScore.breakdown.budgetAdherence.toFixed(0)}/15\n`;
    response += `• Goal Progress: ${healthScore.breakdown.goalProgress.toFixed(0)}/10\n`;
    response += `• Diversification: ${healthScore.breakdown.diversification.toFixed(0)}/10\n`;
    
    // Add top recommendation
    if (healthScore.recommendations && healthScore.recommendations.length > 0) {
      response += `\n**Top recommendation**: ${healthScore.recommendations[0]}`;
    }
    
    return response;
  }

  /**
   * Handle advice requests
   */
  async handleAdviceRequest(intent) {
    const topic = intent.topic || 'general';
    const countryAdvice = this.countryRules.advice;
    
    let response = '';
    
    switch (topic.toLowerCase()) {
      case 'emergency':
      case 'emergency fund':
        response = `${countryAdvice.emergencyFund}\n\n`;
        response += `**Action steps:**\n`;
        response += `1. Calculate ${this.countryRules.emergencyFundMonths} months of expenses\n`;
        response += `2. Open a separate high-yield savings account\n`;
        response += `3. Set up automatic monthly transfers\n`;
        response += `4. Start with $1,000 as your initial goal`;
        break;
        
      case 'retirement':
        response = `${countryAdvice.retirement}\n\n`;
        response += `**Action steps:**\n`;
        response += `1. Review your current ${this.countryRules.retirementAccount} contributions\n`;
        response += `2. Increase contribution rate if possible\n`;
        response += `3. Ensure you're getting maximum employer match\n`;
        response += `4. Review investment allocation annually`;
        break;
        
      case 'housing':
      case 'home':
        response = `${countryAdvice.housing}\n\n`;
        response += `**Action steps:**\n`;
        response += `1. Research first-time buyer programs\n`;
        response += `2. Save for 20% down payment to avoid PMI\n`;
        response += `3. Improve credit score for better rates\n`;
        response += `4. Factor in closing costs and moving expenses`;
        break;
        
      case 'tax':
      case 'taxes':
        response = `${countryAdvice.tax}\n\n`;
        response += `**Action steps:**\n`;
        response += `1. Maximize tax-advantaged account contributions\n`;
        response += `2. Keep organized records throughout the year\n`;
        response += `3. Consider tax-loss harvesting for investments\n`;
        response += `4. Review tax situation quarterly`;
        break;
        
      default:
        response = "Here are some general financial tips:\n\n";
        response += "💰 **Emergency Fund**: Start with $1,000, then build to 3-6 months expenses\n";
        response += "📊 **Budget**: Track spending and use the 50/30/20 rule as a starting point\n";
        response += "💳 **Debt**: Pay off high-interest debt first (avalanche method)\n";
        response += "📈 **Invest**: Start with employer 401k match, then diversify\n";
        response += "🎯 **Goals**: Set specific, measurable financial goals with deadlines";
    }
    
    return response;
  }

  /**
   * Handle prediction queries
   */
  async handlePredictionQuery(intent) {
    const timeframe = intent.timeframe || 90; // Default 3 months ahead
    const forecast = await this.cashFlowPredictor.generateForecast(this.transactions, timeframe);
    
    let response = `Based on your spending patterns, here's what I predict for the next ${timeframe} days:\n\n`;
    
    response += `**Cash Flow Forecast:**\n`;
    response += `• Expected income: ${this.formatCurrency(forecast.expectedIncome)}\n`;
    response += `• Expected expenses: ${this.formatCurrency(forecast.expectedExpenses)}\n`;
    response += `• Net cash flow: ${this.formatCurrency(forecast.netCashFlow)}\n`;
    
    if (forecast.lowBalanceRisk) {
      response += `\n⚠️ **Warning**: You may have low account balances around ${new Date(forecast.lowBalanceDate).toLocaleDateString()}. Consider adjusting spending or transferring funds.`;
    }
    
    if (forecast.unusualExpenses && forecast.unusualExpenses.length > 0) {
      response += `\n\n**Upcoming expenses to consider:**\n`;
      forecast.unusualExpenses.forEach(expense => {
        response += `• ${expense.description}: ${this.formatCurrency(expense.amount)} (${new Date(expense.date).toLocaleDateString()})\n`;
      });
    }
    
    return response;
  }

  /**
   * Handle general queries using basic pattern matching
   */
  async handleGeneralQuery(userMessage) {
    const message = userMessage.toLowerCase();
    
    // Pattern matching for common queries
    if (message.includes('help') || message.includes('what can you do')) {
      return this.getHelpMessage();
    }
    
    if (message.includes('thank')) {
      return "You're welcome! I'm here to help you achieve your financial goals. What would you like to know next?";
    }
    
    if (message.includes('hello') || message.includes('hi')) {
      return `Hello! I'm your AI financial coach. I can help you understand your spending, track goals, and make better financial decisions. What would you like to know?`;
    }
    
    // Default response
    return "I can help you with questions about spending, income, budgets, goals, and financial advice. Try asking something like 'How much did I spend on groceries last month?' or 'What's my financial health score?'";
  }

  /**
   * Get help message with available commands
   */
  getHelpMessage() {
    return `I'm your AI financial coach! Here's what I can help you with:

**💰 Spending Analysis**
• "How much did I spend last month?"
• "What's my biggest expense category?"
• "Show me my dining expenses"

**📊 Financial Health**
• "What's my financial health score?"
• "How are my finances doing?"
• "What should I improve?"

**🎯 Goals & Budgets**
• "How are my savings goals?"
• "Am I on track with my budget?"
• "When will I reach my emergency fund goal?"

**📈 Predictions & Advice**
• "What will my expenses be next month?"
• "How can I save more money?"
• "Give me retirement advice"

**🏠 Country-Specific Help**
• Tax planning advice for ${this.countryRules.country}
• ${this.countryRules.retirementAccount} optimization
• Local financial regulations

Just ask me anything about your finances in natural language!`;
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  /**
   * Calculate monthly income from transactions
   */
  calculateMonthlyIncome() {
    const incomeTransactions = this.getIncomeTransactions();
    if (incomeTransactions.length === 0) return 0;
    
    const totalIncome = this.sumTransactions(incomeTransactions);
    const months = this.getMonthsOfData();
    
    return months > 0 ? totalIncome / months : totalIncome;
  }

  /**
   * Calculate monthly expenses from transactions
   */
  calculateMonthlyExpenses() {
    const expenseTransactions = this.transactions.filter(t => t.amount < 0);
    if (expenseTransactions.length === 0) return 0;
    
    const totalExpenses = Math.abs(this.sumTransactions(expenseTransactions));
    const months = this.getMonthsOfData();
    
    return months > 0 ? totalExpenses / months : totalExpenses;
  }

  /**
   * Calculate total savings from accounts
   */
  calculateTotalSavings() {
    // This would integrate with account balances
    // For now, estimate from transaction patterns
    const monthlyIncome = this.calculateMonthlyIncome();
    const monthlyExpenses = this.calculateMonthlyExpenses();
    const monthlySavings = monthlyIncome - monthlyExpenses;
    const months = this.getMonthsOfData();
    
    return Math.max(0, monthlySavings * months);
  }

  /**
   * Calculate total debt (would integrate with account data)
   */
  calculateTotalDebt() {
    // This would integrate with account balances
    // For now, return 0 as placeholder
    return 0;
  }

  /**
   * Get transactions in specific time period (days)
   */
  getTransactionsInPeriod(days) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return this.transactions.filter(t => new Date(t.date) >= cutoffDate);
  }

  /**
   * Get transactions for specific month
   */
  getTransactionsForMonth(month, year) {
    return this.transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === month && date.getFullYear() === year;
    });
  }

  /**
   * Get income transactions
   */
  getIncomeTransactions(days = null) {
    let transactions = this.transactions.filter(t => t.amount > 0);
    
    if (days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      transactions = transactions.filter(t => new Date(t.date) >= cutoffDate);
    }
    
    return transactions;
  }

  /**
   * Group transactions by category
   */
  groupTransactionsByCategory(transactions) {
    const grouped = {};
    
    transactions.forEach(t => {
      const category = t.category || 'Other';
      grouped[category] = (grouped[category] || 0) + t.amount;
    });
    
    return grouped;
  }

  /**
   * Sum transaction amounts
   */
  sumTransactions(transactions) {
    return transactions.reduce((sum, t) => sum + t.amount, 0);
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount) {
    const currency = this.countryRules.currency;
    const locale = this.localization.getLocale(this.countryRules.country);
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(amount));
  }

  /**
   * Calculate months of data available
   */
  getMonthsOfData() {
    if (this.transactions.length === 0) return 0;
    
    const dates = this.transactions.map(t => new Date(t.date));
    const earliest = new Date(Math.min(...dates));
    const latest = new Date(Math.max(...dates));
    
    const months = (latest.getFullYear() - earliest.getFullYear()) * 12 + 
                   (latest.getMonth() - earliest.getMonth()) + 1;
    
    return Math.max(1, months);
  }

  /**
   * Calculate budget adherence rate
   */
  calculateBudgetAdherence() {
    if (!this.budgets || this.budgets.length === 0) return 0;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyTransactions = this.getTransactionsForMonth(currentMonth, currentYear);
    const budget = this.budgets[0];
    
    const performance = this.calculateBudgetPerformance(monthlyTransactions, budget);
    const categories = Object.keys(performance);
    
    let adherentCategories = 0;
    categories.forEach(category => {
      if (performance[category].spent <= performance[category].budgeted) {
        adherentCategories++;
      }
    });
    
    return categories.length > 0 ? adherentCategories / categories.length : 0;
  }

  /**
   * Calculate budget performance by category
   */
  calculateBudgetPerformance(transactions, budget) {
    const performance = {};
    const categorySpending = this.groupTransactionsByCategory(transactions.filter(t => t.amount < 0));
    
    Object.entries(budget.categories || {}).forEach(([category, budgetAmount]) => {
      performance[category] = {
        budgeted: budgetAmount,
        spent: Math.abs(categorySpending[category] || 0)
      };
    });
    
    return performance;
  }

  /**
   * Count non-cash accounts (investments, retirement, etc.)
   */
  countNonCashAccounts() {
    // This would integrate with account data
    // For now, estimate based on transaction categories
    const investmentCategories = ['Investment', 'Retirement', 'KiwiSaver', '401k'];
    const hasInvestments = this.transactions.some(t => 
      investmentCategories.includes(t.category)
    );
    
    return hasInvestments ? 1 : 0;
  }

  /**
   * Detect unusual transactions
   */
  detectUnusualTransactions(transactions) {
    const amounts = transactions.map(t => Math.abs(t.amount));
    const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    const threshold = avgAmount * 3; // 3x average is considered unusual
    
    return transactions.filter(t => Math.abs(t.amount) > threshold);
  }

  /**
   * Calculate income variability
   */
  calculateIncomeVariability(monthlyIncomes) {
    if (monthlyIncomes.length < 2) return 0;
    
    const amounts = Object.values(monthlyIncomes);
    const avg = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - avg, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    
    return avg > 0 ? stdDev / avg : 0;
  }

  /**
   * Group income by month
   */
  groupIncomeByMonth(incomeTransactions) {
    const grouped = {};
    
    incomeTransactions.forEach(t => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      grouped[key] = (grouped[key] || 0) + t.amount;
    });
    
    return grouped;
  }

  /**
   * Calculate goal progress
   */
  calculateGoalProgress(goal) {
    const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
    const targetDate = new Date(goal.targetDate);
    const today = new Date();
    const monthsRemaining = Math.max(0, (targetDate - today) / (1000 * 60 * 60 * 24 * 30));
    
    const remaining = goal.targetAmount - goal.currentAmount;
    const requiredMonthlyContribution = monthsRemaining > 0 ? remaining / monthsRemaining : 0;
    
    const onTrack = goal.monthlyContribution >= requiredMonthlyContribution;
    
    return {
      progressPercentage: Math.min(100, progressPercentage),
      monthsRemaining,
      requiredMonthlyContribution,
      onTrack
    };
  }

  /**
   * Check if user has KiwiSaver
   */
  hasKiwiSaver() {
    return this.transactions.some(t => 
      t.description && t.description.toLowerCase().includes('kiwisaver')
    );
  }

  /**
   * Get tax year end date for country
   */
  getTaxYearEnd(country) {
    const taxYearEnds = {
      'NZ': '2024-03-31',
      'AU': '2024-06-30',
      'UK': '2024-04-05',
      'US': '2024-12-31',
      'CA': '2024-12-31'
    };
    
    return new Date(taxYearEnds[country] || taxYearEnds['US']);
  }

  /**
   * Get months until specific date
   */
  getMonthsUntil(targetDate) {
    const today = new Date();
    const months = (targetDate.getFullYear() - today.getFullYear()) * 12 + 
                   (targetDate.getMonth() - today.getMonth());
    return Math.max(0, months);
  }

  /**
   * Sanitize user input for security
   */
  sanitizeUserInput(input) {
    return input
      .trim()
      .substring(0, 500) // Limit length
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/[<>]/g, ''); // Remove HTML tags
  }

  /**
   * Generate follow-up suggestions based on intent
   */
  generateFollowUpSuggestions(intent) {
    const suggestions = {
      'spending_query': [
        "Show me spending by category",
        "How does this compare to last month?",
        "What are my largest expenses?"
      ],
      'goal_query': [
        "How can I reach my goals faster?",
        "What's my savings rate?",
        "Should I adjust my goal timeline?"
      ],
      'budget_query': [
        "How can I improve my budget?",
        "What categories should I cut?",
        "Set up budget alerts"
      ],
      'advice_request': [
        "What's my next priority?",
        "How's my financial health?",
        "Show me my biggest opportunities"
      ]
    };
    
    return suggestions[intent.type] || [
      "What's my financial health score?",
      "How much did I spend last month?",
      "Show me my savings goals",
      "Give me personalized advice"
    ];
  }

  /**
   * Generate fallback insights when analysis fails
   */
  generateFallbackInsights() {
    return [
      {
        type: 'general',
        category: 'welcome',
        title: 'Welcome to SmartFinanceAI',
        message: 'Start by importing your bank statements to get personalized financial insights.',
        importance: 'medium',
        actionable: true,
        suggestions: [
          'Import bank statements via CSV upload',
          'Set up your first financial goal',
          'Create a monthly budget',
          'Complete your financial profile'
        ]
      }
    ];
  }

  /**
   * Get fallback recommendations
   */
  getFallbackRecommendations() {
    return [
      {
        category: 'setup',
        priority: 'high',
        title: 'Complete your financial setup',
        description: 'Add your financial data to get personalized recommendations.',
        actions: [
          {
            action: 'Import bank statements',
            description: 'Upload CSV files from your bank',
            completed: false
          },
          {
            action: 'Set financial goals',
            description: 'Create specific, measurable goals',
            completed: false
          },
          {
            action: 'Create budget',
            description: 'Set monthly spending limits by category',
            completed: false
          }
        ],
        impact: 'High - Foundation for all other features',
        timeframe: '1 week'
      }
    ];
  }

  /**
   * Prioritize insights by importance and relevance
   */
  prioritizeInsights(insights) {
    const priorityOrder = { 'critical': 5, 'high': 4, 'medium': 3, 'positive': 2, 'low': 1 };
    
    return insights
      .sort((a, b) => priorityOrder[b.importance] - priorityOrder[a.importance])
      .slice(0, 10); // Limit to top 10 insights
  }

  /**
   * Generate health recommendations based on score breakdown
   */
  generateHealthRecommendations(metrics) {
    const recommendations = [];
    
    if (metrics.emergencyFund < 15) {
      recommendations.push('Build your emergency fund to 3-6 months of expenses');
    }
    
    if (metrics.debtToIncome < 15) {
      recommendations.push('Focus on reducing high-interest debt');
    }
    
    if (metrics.savingsRate < 15) {
      recommendations.push('Increase your savings rate to at least 10%');
    }
    
    if (metrics.budgetAdherence < 10) {
      recommendations.push('Create and follow a monthly budget');
    }
    
    if (metrics.goalProgress < 5) {
      recommendations.push('Set specific financial goals with deadlines');
    }
    
    if (metrics.diversification < 7) {
      recommendations.push('Start investing for long-term growth');
    }
    
    return recommendations;
  }
}

/**
 * 📊 Financial Insights Engine
 * 
 * Generates comprehensive financial insights and analysis
 */
class FinancialInsightsEngine {
  constructor() {
    this.insightTypes = ['spending', 'income', 'savings', 'trends', 'opportunities'];
  }

  /**
   * Generate comprehensive financial insights
   */
  async generateInsights(transactions, goals, budgets) {
    const insights = [];
    
    // Implement insight generation logic
    // This would be expanded based on specific business rules
    
    return insights;
  }
}

/**
 * 📈 Spending Pattern Analyzer
 * 
 * Analyzes spending patterns and behaviors
 */
class SpendingPatternAnalyzer {
  constructor() {
    this.patterns = ['daily', 'weekly', 'monthly', 'seasonal'];
  }

  /**
   * Analyze comprehensive spending patterns
   */
  async analyzeSpendingPatterns(transactions) {
    const analysis = {
      dailyPatterns: this.analyzeDailyPatterns(transactions),
      weeklyPatterns: this.analyzeWeeklyPatterns(transactions),
      monthlyTrends: this.analyzeMonthlyTrends(transactions),
      categoryBreakdown: this.analyzeCategorySpending(transactions),
      seasonalPatterns: this.analyzeSeasonalPatterns(transactions),
      unusualTransactions: this.detectAnomalies(transactions)
    };
    
    return analysis;
  }

  analyzeDailyPatterns(transactions) {
    // Implement daily pattern analysis
    return {};
  }

  analyzeWeeklyPatterns(transactions) {
    // Implement weekly pattern analysis
    return {};
  }

  analyzeMonthlyTrends(transactions) {
    // Implement monthly trend analysis
    return {};
  }

  analyzeCategorySpending(transactions) {
    // Implement category analysis
    return {};
  }

  analyzeSeasonalPatterns(transactions) {
    // Implement seasonal analysis
    return {};
  }

  detectAnomalies(transactions) {
    // Implement anomaly detection
    return [];
  }
}

/**
 * 🎯 Goal Coach
 * 
 * Provides goal-specific coaching and optimization
 */
class GoalCoach {
  constructor() {
    this.goalStrategies = {
      'emergency_fund': this.optimizeEmergencyFund,
      'debt_payoff': this.optimizeDebtPayoff,
      'savings': this.optimizeSavings,
      'investment': this.optimizeInvestment,
      'house_deposit': this.optimizeHouseDeposit
    };
  }

  /**
   * Analyze goal progress and provide recommendations
   */
  async analyzeGoalProgress(goals, transactions) {
    const analysis = {};
    
    for (const goal of goals) {
      analysis[goal.id] = {
        progress: this.calculateGoalProgress(goal, transactions),
        recommendations: this.generateGoalRecommendations(goal, transactions),
        timeline: this.optimizeGoalTimeline(goal, transactions),
        milestones: this.generateMilestones(goal)
      };
    }
    
    return analysis;
  }

  calculateGoalProgress(goal, transactions) {
    // Calculate actual progress based on transactions
    const relevantTransactions = this.getGoalRelatedTransactions(goal, transactions);
    const actualContributions = relevantTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    return {
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount + actualContributions,
      progressPercentage: ((goal.currentAmount + actualContributions) / goal.targetAmount) * 100,
      monthlyContribution: goal.monthlyContribution,
      actualMonthlyContribution: this.calculateActualMonthlyContribution(relevantTransactions)
    };
  }

  generateGoalRecommendations(goal, transactions) {
    const strategy = this.goalStrategies[goal.type] || this.optimizeGenericGoal;
    return strategy.call(this, goal, transactions);
  }

  optimizeGoalTimeline(goal, transactions) {
    const progress = this.calculateGoalProgress(goal, transactions);
    const remaining = goal.targetAmount - progress.currentAmount;
    const monthsToTarget = new Date(goal.targetDate).getTime() - Date.now();
    const monthsRemaining = Math.max(0, monthsToTarget / (1000 * 60 * 60 * 24 * 30));
    
    return {
      onTrack: progress.actualMonthlyContribution >= (remaining / monthsRemaining),
      requiredMonthlyContribution: monthsRemaining > 0 ? remaining / monthsRemaining : 0,
      projectedCompletionDate: this.calculateProjectedCompletion(goal, progress),
      recommendations: this.getTimelineRecommendations(goal, progress, monthsRemaining)
    };
  }

  generateMilestones(goal) {
    const milestones = [];
    const percentages = [25, 50, 75, 90, 100];
    
    percentages.forEach(pct => {
      milestones.push({
        percentage: pct,
        amount: (goal.targetAmount * pct) / 100,
        description: this.getMilestoneDescription(goal.type, pct),
        achieved: (goal.currentAmount / goal.targetAmount) * 100 >= pct
      });
    });
    
    return milestones;
  }

  getGoalRelatedTransactions(goal, transactions) {
    // Filter transactions related to this specific goal
    // This would be expanded based on goal tracking implementation
    return transactions.filter(t => 
      t.goalId === goal.id || 
      (goal.categories && goal.categories.includes(t.category))
    );
  }

  calculateActualMonthlyContribution(transactions) {
    if (transactions.length === 0) return 0;
    
    const monthsSpan = this.getMonthsSpan(transactions);
    const totalContributions = transactions.reduce((sum, t) => sum + t.amount, 0);
    
    return monthsSpan > 0 ? totalContributions / monthsSpan : 0;
  }

  getMonthsSpan(transactions) {
    if (transactions.length < 2) return 1;
    
    const dates = transactions.map(t => new Date(t.date)).sort();
    const earliest = dates[0];
    const latest = dates[dates.length - 1];
    
    return Math.max(1, (latest.getFullYear() - earliest.getFullYear()) * 12 + 
                       (latest.getMonth() - earliest.getMonth()) + 1);
  }

  calculateProjectedCompletion(goal, progress) {
    if (progress.actualMonthlyContribution <= 0) return null;
    
    const remaining = goal.targetAmount - progress.currentAmount;
    const monthsNeeded = remaining / progress.actualMonthlyContribution;
    
    const projectedDate = new Date();
    projectedDate.setMonth(projectedDate.getMonth() + monthsNeeded);
    
    return projectedDate.toISOString();
  }

  getTimelineRecommendations(goal, progress, monthsRemaining) {
    const recommendations = [];
    
    if (progress.actualMonthlyContribution < goal.monthlyContribution) {
      recommendations.push('Increase your monthly contributions to stay on track');
    }
    
    if (monthsRemaining > 0 && progress.actualMonthlyContribution * monthsRemaining < (goal.targetAmount - progress.currentAmount)) {
      recommendations.push('Consider extending your timeline or increasing contributions');
    }
    
    return recommendations;
  }

  getMilestoneDescription(goalType, percentage) {
    const descriptions = {
      'emergency_fund': {
        25: 'Great start on your safety net!',
        50: 'Halfway to financial security',
        75: 'Almost there - you\'re building real security',
        90: 'So close! Keep pushing',
        100: 'Congratulations! You\'re financially secure'
      },
      'house_deposit': {
        25: 'You\'re on your way to homeownership!',
        50: 'Halfway to your dream home',
        75: 'Almost ready to start house hunting',
        90: 'Time to get pre-approved for a mortgage',
        100: 'Ready to buy your home!'
      }
    };
    
    return descriptions[goalType]?.[percentage] || `${percentage}% complete!`;
  }

  optimizeEmergencyFund(goal, transactions) {
    return [
      'Keep emergency fund in high-yield savings account',
      'Aim for 3-6 months of essential expenses',
      'Don\'t invest emergency fund - keep it liquid',
      'Review and adjust target based on expense changes'
    ];
  }

  optimizeDebtPayoff(goal, transactions) {
    return [
      'Focus on highest interest debt first (avalanche method)',
      'Consider debt consolidation if beneficial',
      'Avoid taking on new debt while paying off existing debt',
      'Celebrate small wins to stay motivated'
    ];
  }

  optimizeSavings(goal, transactions) {
    return [
      'Automate savings transfers on payday',
      'Use high-yield savings account for better returns',
      'Consider increasing savings rate gradually',
      'Track progress weekly to stay motivated'
    ];
  }

  optimizeInvestment(goal, transactions) {
    return [
      'Start with low-cost index funds',
      'Diversify across asset classes',
      'Increase contributions during market downturns',
      'Review and rebalance portfolio annually'
    ];
  }

  optimizeHouseDeposit(goal, transactions) {
    return [
      'Research first-time buyer programs',
      'Save 20% to avoid mortgage insurance',
      'Keep deposit funds in conservative investments',
      'Factor in closing costs and moving expenses'
    ];
  }

  optimizeGenericGoal(goal, transactions) {
    return [
      'Break large goals into smaller milestones',
      'Automate contributions when possible',
      'Review progress monthly',
      'Adjust timeline if circumstances change'
    ];
  }
}

/**
 * 💬 Financial Chat Interface
 * 
 * Handles natural language processing for financial queries
 */
class FinancialChatInterface {
  constructor() {
    this.intentPatterns = this.initializeIntentPatterns();
    this.entityExtractors = this.initializeEntityExtractors();
  }

  /**
   * Initialize intent recognition patterns
   */
  initializeIntentPatterns() {
    return {
      'spending_query': [
        /how much.*spend.*last\s+(\d+)?\s*(day|week|month)/i,
        /what.*spent.*on\s+(\w+)/i,
        /spending.*(\w+)/i,
        /expenses.*last\s+(\w+)/i
      ],
      'income_query': [
        /how much.*earn/i,
        /what.*income/i,
        /salary/i,
        /paycheck/i
      ],
      'goal_query': [
        /how.*goal/i,
        /progress.*(\w+)/i,
        /savings.*goal/i,
        /emergency.*fund/i
      ],
      'budget_query': [
        /budget/i,
        /how much.*left/i,
        /remaining.*budget/i,
        /over.*budget/i
      ],
      'health_score_query': [
        /health.*score/i,
        /financial.*health/i,
        /how.*doing/i,
        /overall.*finance/i
      ],
      'advice_request': [
        /advice/i,
        /recommend/i,
        /should.*do/i,
        /help.*with/i,
        /how.*improve/i
      ],
      'prediction_query': [
        /predict/i,
        /forecast/i,
        /what.*next/i,
        /future.*expense/i
      ]
    };
  }

  /**
   * Initialize entity extraction patterns
   */
  initializeEntityExtractors() {
    return {
      timeframe: {
        pattern: /(\d+)?\s*(day|week|month|year)s?/i,
        extractor: (match) => {
          const number = match[1] ? parseInt(match[1]) : 1;
          const unit = match[2].toLowerCase();
          
          switch (unit) {
            case 'day': return number;
            case 'week': return number * 7;
            case 'month': return number * 30;
            case 'year': return number * 365;
            default: return 30;
          }
        }
      },
      category: {
        pattern: /(?:on|for)\s+(\w+)/i,
        extractor: (match) => match[1]
      },
      amount: {
        pattern: /\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        extractor: (match) => parseFloat(match[1].replace(/,/g, ''))
      },
      goalName: {
        pattern: /goal\s+(?:named\s+)?["']?(\w+(?:\s+\w+)*)["']?/i,
        extractor: (match) => match[1]
      }
    };
  }

  /**
   * Parse user intent from natural language input
   */
  parseUserIntent(userInput) {
    const intent = {
      type: 'general',
      confidence: 0,
      entities: {}
    };
    
    // Determine intent type
    for (const [intentType, patterns] of Object.entries(this.intentPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(userInput)) {
          intent.type = intentType;
          intent.confidence = 0.8;
          break;
        }
      }
      if (intent.confidence > 0) break;
    }
    
    // Extract entities
    for (const [entityType, config] of Object.entries(this.entityExtractors)) {
      const match = userInput.match(config.pattern);
      if (match) {
        intent.entities[entityType] = config.extractor(match);
      }
    }
    
    // Map entities to intent properties
    if (intent.entities.timeframe) intent.timeframe = intent.entities.timeframe;
    if (intent.entities.category) intent.category = intent.entities.category;
    if (intent.entities.amount) intent.amount = intent.entities.amount;
    if (intent.entities.goalName) intent.goalName = intent.entities.goalName;
    
    return intent;
  }

  /**
   * Generate contextual response based on intent
   */
  generateResponse(intent, context) {
    // This would be expanded with more sophisticated NLP
    // For now, return basic structure for handler to use
    return {
      intent: intent,
      context: context,
      needsData: this.determineDataNeeds(intent)
    };
  }

  /**
   * Determine what data is needed to answer query
   */
  determineDataNeeds(intent) {
    const dataNeeds = {
      'spending_query': ['transactions'],
      'income_query': ['transactions'],
      'goal_query': ['goals', 'transactions'],
      'budget_query': ['budgets', 'transactions'],
      'health_score_query': ['transactions', 'goals', 'budgets'],
      'advice_request': ['transactions', 'goals', 'budgets'],
      'prediction_query': ['transactions']
    };
    
    return dataNeeds[intent.type] || [];
  }
}

/**
 * 📊 Cash Flow Predictor
 * 
 * Predicts future cash flows and financial positions
 */
class CashFlowPredictor {
  constructor() {
    this.predictionModels = ['linear', 'seasonal', 'trend'];
  }

  /**
   * Generate cash flow forecast
   */
  async generateForecast(transactions, daysAhead = 90) {
    try {
      const historicalData = this.prepareHistoricalData(transactions);
      const patterns = this.analyzePatterns(historicalData);
      
      const forecast = {
        timeframe: daysAhead,
        expectedIncome: this.predictIncome(patterns, daysAhead),
        expectedExpenses: this.predictExpenses(patterns, daysAhead),
        netCashFlow: 0,
        lowBalanceRisk: false,
        lowBalanceDate: null,
        unusualExpenses: this.predictUnusualExpenses(patterns, daysAhead),
        confidence: this.calculatePredictionConfidence(patterns)
      };
      
      forecast.netCashFlow = forecast.expectedIncome - forecast.expectedExpenses;
      
      // Assess low balance risk
      if (forecast.netCashFlow < 0) {
        forecast.lowBalanceRisk = true;
        forecast.lowBalanceDate = this.estimateLowBalanceDate(patterns, daysAhead);
      }
      
      return forecast;
      
    } catch (error) {
      console.error('Cash flow prediction failed:', error);
      return this.getFallbackForecast(daysAhead);
    }
  }

  prepareHistoricalData(transactions) {
    // Group transactions by day/week/month for pattern analysis
    const daily = this.groupTransactionsByDay(transactions);
    const weekly = this.groupTransactionsByWeek(transactions);
    const monthly = this.groupTransactionsByMonth(transactions);
    
    return { daily, weekly, monthly };
  }

  analyzePatterns(historicalData) {
    return {
      dailyAverage: this.calculateDailyAverages(historicalData.daily),
      weeklyTrend: this.calculateTrend(historicalData.weekly),
      monthlySeasonality: this.calculateSeasonality(historicalData.monthly),
      volatility: this.calculateVolatility(historicalData.daily)
    };
  }

  predictIncome(patterns, daysAhead) {
    // Simple linear prediction based on historical average
    const dailyIncomeAvg = patterns.dailyAverage.income || 0;
    return Math.max(0, dailyIncomeAvg * daysAhead);
  }

  predictExpenses(patterns, daysAhead) {
    // Simple linear prediction with trend adjustment
    const dailyExpenseAvg = Math.abs(patterns.dailyAverage.expenses || 0);
    const trendAdjustment = patterns.weeklyTrend.expenses || 0;
    
    return dailyExpenseAvg * daysAhead * (1 + trendAdjustment);
  }

  predictUnusualExpenses(patterns, daysAhead) {
    // Predict potential large expenses based on historical patterns
    const unusualThreshold = patterns.dailyAverage.expenses * 3;
    const frequency = this.calculateUnusualExpenseFrequency(patterns);
    
    const predictions = [];
    const expectedCount = Math.floor((daysAhead / 30) * frequency);
    
    for (let i = 0; i < expectedCount; i++) {
      predictions.push({
        description: 'Potential large expense',
        amount: unusualThreshold * (1 + Math.random()), // Add some randomness
        date: new Date(Date.now() + Math.random() * daysAhead * 24 * 60 * 60 * 1000),
        confidence: 0.6
      });
    }
    
    return predictions;
  }

  calculatePredictionConfidence(patterns) {
    // Calculate confidence based on data quality and consistency
    const dataPoints = patterns.dailyAverage.dataPoints || 0;
    const volatility = patterns.volatility || 1;
    
    let confidence = Math.min(0.9, dataPoints / 90); // More data = higher confidence
    confidence *= Math.max(0.3, 1 - volatility); // Lower volatility = higher confidence
    
    return Math.round(confidence * 100);
  }

  estimateLowBalanceDate(patterns, daysAhead) {
    // Estimate when account might reach low balance
    const dailyBurn = Math.abs(patterns.dailyAverage.expenses - patterns.dailyAverage.income);
    const estimatedDays = Math.max(1, Math.min(daysAhead, 30)); // Conservative estimate
    
    const date = new Date();
    date.setDate(date.getDate() + estimatedDays);
    return date.toISOString();
  }

  getFallbackForecast(daysAhead) {
    return {
      timeframe: daysAhead,
      expectedIncome: 0,
      expectedExpenses: 0,
      netCashFlow: 0,
      lowBalanceRisk: false,
      lowBalanceDate: null,
      unusualExpenses: [],
      confidence: 0
    };
  }

  groupTransactionsByDay(transactions) {
    const grouped = {};
    
    transactions.forEach(t => {
      const date = new Date(t.date).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = { income: 0, expenses: 0, count: 0 };
      }
      
      if (t.amount > 0) {
        grouped[date].income += t.amount;
      } else {
        grouped[date].expenses += t.amount;
      }
      grouped[date].count++;
    });
    
    return grouped;
  }

  groupTransactionsByWeek(transactions) {
    // Implementation for weekly grouping
    return {};
  }

  groupTransactionsByMonth(transactions) {
    // Implementation for monthly grouping
    return {};
  }

  calculateDailyAverages(dailyData) {
    const days = Object.keys(dailyData);
    if (days.length === 0) return { income: 0, expenses: 0, dataPoints: 0 };
    
    const totals = days.reduce((acc, day) => ({
      income: acc.income + dailyData[day].income,
      expenses: acc.expenses + dailyData[day].expenses
    }), { income: 0, expenses: 0 });
    
    return {
      income: totals.income / days.length,
      expenses: totals.expenses / days.length,
      dataPoints: days.length
    };
  }

  calculateTrend(weeklyData) {
    // Simple trend calculation
    return { income: 0, expenses: 0 };
  }

  calculateSeasonality(monthlyData) {
    // Seasonal pattern calculation
    return {};
  }

  calculateVolatility(dailyData) {
    // Calculate volatility measure
    return 0.5; // Default moderate volatility
  }

  calculateUnusualExpenseFrequency(patterns) {
    // Calculate how often unusual expenses occur
    return 1; // Default: once per month
  }
}

// Export classes for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AIFinancialCoach,
    FinancialInsightsEngine,
    SpendingPatternAnalyzer,
    BudgetOptimizer,
    GoalCoach,
    FinancialChatInterface,
    CashFlowPredictor
  };
} else if (typeof window !== 'undefined') {
  window.AIFinancialCoach = AIFinancialCoach;
  window.FinancialInsightsEngine = FinancialInsightsEngine;
  window.SpendingPatternAnalyzer = SpendingPatternAnalyzer;
  window.BudgetOptimizer = BudgetOptimizer;
  window.GoalCoach = GoalCoach;
  window.FinancialChatInterface = FinancialChatInterface;
  window.CashFlowPredictor = CashFlowPredictor;
}