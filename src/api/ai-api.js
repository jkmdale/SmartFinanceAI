/**
 * SmartFinanceAI - AI Intelligence API
 * Advanced AI services for financial coaching, predictions, and insights
 * File: src/api/ai-api.js
 */

import { apiRequest, handleApiError } from './endpoints.js';
import { sanitizeInput } from '../utils/validation-utils.js';
import { logUserAction } from '../platform/audit-logger.js';

class AIAPI {
  constructor() {
    this.baseUrl = '/api/v1/ai';
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes for AI insights
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * Get AI-powered financial health score and analysis
   */
  async getFinancialHealthScore(financialData) {
    try {
      const cacheKey = `health_score_${this.hashFinancialData(financialData)}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      // Anonymize financial data before sending to AI
      const anonymizedData = this.anonymizeFinancialData(financialData);

      const response = await apiRequest(`${this.baseUrl}/health-score`, {
        method: 'POST',
        body: anonymizedData,
        requiresAuth: true
      });

      if (response.success) {
        const result = {
          score: response.data.score,
          breakdown: response.data.breakdown,
          improvements: response.data.improvements,
          benchmarks: response.data.benchmarks,
          trends: response.data.trends
        };

        // Cache the result
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });

        await logUserAction('ai_health_score_generated', {
          score: result.score,
          improvements: result.improvements.length
        });

        return result;
      }

      throw new Error(response.message || 'Failed to generate health score');
    } catch (error) {
      console.error('Error getting financial health score:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get AI-powered spending insights and patterns
   */
  async getSpendingInsights(transactionData, options = {}) {
    try {
      const cacheKey = `spending_insights_${this.hashTransactionData(transactionData)}_${options.period || 'month'}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      // Anonymize transaction data
      const anonymizedTransactions = this.anonymizeTransactionData(transactionData);

      const response = await apiRequest(`${this.baseUrl}/spending-insights`, {
        method: 'POST',
        body: {
          transactions: anonymizedTransactions,
          period: options.period || 'month',
          includeForecasts: options.includeForecasts || true,
          includeAnomalies: options.includeAnomalies || true
        },
        requiresAuth: true
      });

      if (response.success) {
        const result = {
          patterns: response.data.patterns,
          trends: response.data.trends,
          anomalies: response.data.anomalies,
          forecasts: response.data.forecasts,
          recommendations: response.data.recommendations,
          insights: response.data.insights
        };

        // Cache the result
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });

        await logUserAction('ai_spending_insights_generated', {
          patterns: result.patterns.length,
          anomalies: result.anomalies.length,
          recommendations: result.recommendations.length
        });

        return result;
      }

      throw new Error(response.message || 'Failed to generate spending insights');
    } catch (error) {
      console.error('Error getting spending insights:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get AI-powered financial coaching and advice
   */
  async getFinancialCoaching(userQuery, context = {}) {
    try {
      // Sanitize user input
      const sanitizedQuery = sanitizeInput(userQuery);
      
      // Prepare context with anonymized financial data
      const anonymizedContext = this.anonymizeFinancialContext(context);

      const response = await apiRequest(`${this.baseUrl}/coaching`, {
        method: 'POST',
        body: {
          query: sanitizedQuery,
          context: anonymizedContext,
          country: context.country || 'US',
          language: context.language || 'en'
        },
        requiresAuth: true
      });

      if (response.success) {
        await logUserAction('ai_coaching_requested', {
          queryLength: sanitizedQuery.length,
          country: context.country,
          responseGenerated: !!response.data.advice
        });

        return {
          advice: response.data.advice,
          actionItems: response.data.actionItems,
          resources: response.data.resources,
          followUpQuestions: response.data.followUpQuestions,
          confidence: response.data.confidence
        };
      }

      throw new Error(response.message || 'Failed to get financial coaching');
    } catch (error) {
      console.error('Error getting financial coaching:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get AI-powered goal optimization suggestions
   */
  async optimizeGoals(goals, financialSituation) {
    try {
      const cacheKey = `goal_optimization_${this.hashGoalData(goals)}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout * 2) { // Longer cache
        return cached.data;
      }

      // Anonymize goal and financial data
      const anonymizedGoals = this.anonymizeGoalData(goals);
      const anonymizedSituation = this.anonymizeFinancialData(financialSituation);

      const response = await apiRequest(`${this.baseUrl}/optimize-goals`, {
        method: 'POST',
        body: {
          goals: anonymizedGoals,
          financialSituation: anonymizedSituation
        },
        requiresAuth: true
      });

      if (response.success) {
        const result = {
          optimizations: response.data.optimizations,
          priorityRecommendations: response.data.priorityRecommendations,
          timelineAdjustments: response.data.timelineAdjustments,
          contributionSuggestions: response.data.contributionSuggestions,
          scenarios: response.data.scenarios
        };

        // Cache the result
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });

        await logUserAction('ai_goal_optimization_generated', {
          goalsOptimized: goals.length,
          optimizations: result.optimizations.length
        });

        return result;
      }

      throw new Error(response.message || 'Failed to optimize goals');
    } catch (error) {
      console.error('Error optimizing goals:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get AI-powered budget recommendations
   */
  async getBudgetRecommendations(currentBudget, spendingHistory, goals = []) {
    try {
      // Anonymize budget and spending data
      const anonymizedBudget = this.anonymizeBudgetData(currentBudget);
      const anonymizedSpending = this.anonymizeSpendingHistory(spendingHistory);
      const anonymizedGoals = this.anonymizeGoalData(goals);

      const response = await apiRequest(`${this.baseUrl}/budget-recommendations`, {
        method: 'POST',
        body: {
          currentBudget: anonymizedBudget,
          spendingHistory: anonymizedSpending,
          goals: anonymizedGoals
        },
        requiresAuth: true
      });

      if (response.success) {
        await logUserAction('ai_budget_recommendations_generated', {
          recommendations: response.data.recommendations.length,
          potentialSavings: response.data.projectedSavings
        });

        return {
          recommendations: response.data.recommendations,
          categoryAdjustments: response.data.categoryAdjustments,
          projectedSavings: response.data.projectedSavings,
          riskAssessment: response.data.riskAssessment,
          alternativeStrategies: response.data.alternativeStrategies
        };
      }

      throw new Error(response.message || 'Failed to get budget recommendations');
    } catch (error) {
      console.error('Error getting budget recommendations:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get AI-powered transaction categorization
   */
  async categorizeTransaction(transactionDescription, amount, merchant = '') {
    try {
      const response = await apiRequest(`${this.baseUrl}/categorize-transaction`, {
        method: 'POST',
        body: {
          description: sanitizeInput(transactionDescription),
          amount: Math.round(amount / 100) * 100, // Round to nearest $100 for privacy
          merchant: sanitizeInput(merchant)
        },
        requiresAuth: true
      });

      if (response.success) {
        return {
          category: response.data.category,
          confidence: response.data.confidence,
          alternatives: response.data.alternatives,
          reasoning: response.data.reasoning
        };
      }

      throw new Error(response.message || 'Failed to categorize transaction');
    } catch (error) {
      console.error('Error categorizing transaction:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get AI-powered financial forecasts
   */
  async getFinancialForecasts(historicalData, scenarios = {}) {
    try {
      const cacheKey = `forecasts_${this.hashHistoricalData(historicalData)}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout * 3) { // Longer cache
        return cached.data;
      }

      // Anonymize historical data
      const anonymizedData = this.anonymizeHistoricalData(historicalData);

      const response = await apiRequest(`${this.baseUrl}/forecasts`, {
        method: 'POST',
        body: {
          historicalData: anonymizedData,
          scenarios: scenarios,
          timeHorizon: scenarios.timeHorizon || '12_months'
        },
        requiresAuth: true
      });

      if (response.success) {
        const result = {
          cashFlowForecast: response.data.cashFlowForecast,
          expenseForecast: response.data.expenseForecast,
          incomeForecast: response.data.incomeForecast,
          scenarioAnalysis: response.data.scenarioAnalysis,
          riskFactors: response.data.riskFactors,
          confidence: response.data.confidence
        };

        // Cache the result
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });

        await logUserAction('ai_forecasts_generated', {
          timeHorizon: scenarios.timeHorizon,
          scenarios: Object.keys(scenarios).length
        });

        return result;
      }

      throw new Error(response.message || 'Failed to generate forecasts');
    } catch (error) {
      console.error('Error getting financial forecasts:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get AI-powered investment advice
   */
  async getInvestmentAdvice(portfolioData, riskProfile, goals = []) {
    try {
      // Anonymize portfolio and goal data
      const anonymizedPortfolio = this.anonymizePortfolioData(portfolioData);
      const anonymizedGoals = this.anonymizeGoalData(goals);

      const response = await apiRequest(`${this.baseUrl}/investment-advice`, {
        method: 'POST',
        body: {
          portfolio: anonymizedPortfolio,
          riskProfile: riskProfile,
          goals: anonymizedGoals,
          country: riskProfile.country || 'US'
        },
        requiresAuth: true
      });

      if (response.success) {
        await logUserAction('ai_investment_advice_generated', {
          riskProfile: riskProfile.level,
          goals: goals.length,
          recommendations: response.data.recommendations.length
        });

        return {
          recommendations: response.data.recommendations,
          portfolioOptimization: response.data.portfolioOptimization,
          assetAllocation: response.data.assetAllocation,
          riskAnalysis: response.data.riskAnalysis,
          taxOptimization: response.data.taxOptimization
        };
      }

      throw new Error(response.message || 'Failed to get investment advice');
    } catch (error) {
      console.error('Error getting investment advice:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Anonymize financial data for AI processing
   */
  anonymizeFinancialData(data) {
    return {
      monthlyIncome: Math.round((data.monthlyIncome || 0) / 1000) * 1000,
      monthlyExpenses: Math.round((data.monthlyExpenses || 0) / 1000) * 1000,
      savings: Math.round((data.savings || 0) / 10000) * 10000,
      debt: Math.round((data.debt || 0) / 5000) * 5000,
      age: data.age || null,
      dependents: data.dependents || 0,
      employmentStatus: data.employmentStatus || 'employed',
      country: data.country || 'US'
    };
  }

  /**
   * Anonymize transaction data
   */
  anonymizeTransactionData(transactions) {
    return transactions.map(transaction => ({
      amount: Math.round(transaction.amount / 10) * 10, // Round to nearest $10
      category: transaction.category,
      date: transaction.date?.slice(0, 7), // Month/year only
      merchantHash: this.hashString(transaction.merchant || transaction.description || ''),
      isRecurring: transaction.isRecurring || false
    }));
  }

  /**
   * Anonymize goal data
   */
  anonymizeGoalData(goals) {
    return goals.map(goal => ({
      targetAmount: Math.round(goal.targetAmount / 1000) * 1000,
      currentAmount: Math.round((goal.currentAmount || 0)