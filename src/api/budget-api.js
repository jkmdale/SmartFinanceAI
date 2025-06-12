/**
 * SmartFinanceAI - Budget Management API
 * Advanced budgeting with AI optimization and real-time tracking
 * File: src/api/budget-api.js
 */

import { apiRequest, handleApiError } from './endpoints.js';
import { encrypt, decrypt } from '../data/encryption-service.js';
import { validateBudget, sanitizeInput } from '../utils/validation-utils.js';
import { formatCurrency, calculateVariance } from '../utils/formatting-utils.js';
import { logUserAction } from '../platform/audit-logger.js';

class BudgetAPI {
  constructor() {
    this.baseUrl = '/api/v1/budgets';
    this.cache = new Map();
    this.cacheTimeout = 3 * 60 * 1000; // 3 minutes for real-time budget tracking
    this.budgetTypes = ['monthly', 'weekly', 'annual', 'project'];
    this.budgetMethods = ['zero_based', 'envelope', 'percentage', '50_30_20'];
    this.defaultCategories = [
      'housing', 'transportation', 'food', 'utilities', 'healthcare',
      'entertainment', 'shopping', 'savings', 'debt', 'miscellaneous'
    ];
  }

  /**
   * Get current budget with real-time spending data
   */
  async getCurrentBudget(period = 'current') {
    try {
      const cacheKey = `current_budget_${period}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      const response = await apiRequest(`${this.baseUrl}/current`, {
        method: 'GET',
        body: { period },
        requiresAuth: true
      });

      if (response.success) {
        const decryptedBudget = await this.decryptBudget(response.data.budget);
        const budgetWithProgress = await this.calculateBudgetProgress(decryptedBudget, response.data.spending);

        const result = {
          budget: budgetWithProgress,
          spending: response.data.spending,
          variance: response.data.variance,
          alerts: response.data.alerts,
          recommendations: response.data.recommendations
        };

        // Cache the result
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });

        return result;
      }

      throw new Error(response.message || 'Failed to fetch current budget');
    } catch (error) {
      console.error('Error fetching current budget:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Create new budget with AI optimization
   */
  async createBudget(budgetData) {
    try {
      // Validate budget data
      const validationResult = validateBudget(budgetData);
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Sanitize input data
      const sanitizedData = sanitizeInput(budgetData);

      // Process budget structure
      const processedBudget = {
        name: sanitizedData.name,
        description: sanitizedData.description || '',
        type: sanitizedData.type || 'monthly',
        method: sanitizedData.method || 'zero_based',
        
        // Period settings
        startDate: new Date(sanitizedData.startDate).toISOString(),
        endDate: sanitizedData.endDate ? new Date(sanitizedData.endDate).toISOString() : null,
        
        // Income and categories
        income: this.processIncomeData(sanitizedData.income),
        categories: this.processCategoryData(sanitizedData.categories),
        
        // Settings
        autoAdjust: sanitizedData.autoAdjust || false,
        rolloverUnspent: sanitizedData.rolloverUnspent || false,
        alertThresholds: sanitizedData.alertThresholds || {
          warning: 80, // 80% of budget
          critical: 100 // 100% of budget
        },
        
        // Metadata
        createdDate: new Date().toISOString(),
        currency: sanitizedData.currency || 'USD',
        tags: sanitizedData.tags || []
      };

      // Validate budget totals
      this.validateBudgetTotals(processedBudget);

      // Encrypt sensitive data
      const encryptedBudget = await this.encryptBudget(processedBudget);

      const response = await apiRequest(this.baseUrl, {
        method: 'POST',
        body: encryptedBudget,
        requiresAuth: true
      });

      if (response.success) {
        // Clear budget caches
        this.clearBudgetCaches();
        
        await logUserAction('budget_created', {
          budgetId: response.data.id,
          type: processedBudget.type,
          method: processedBudget.method,
          totalIncome: processedBudget.income.total,
          categoryCount: processedBudget.categories.length
        });

        const decryptedBudget = await this.decryptBudget(response.data);
        return decryptedBudget;
      }

      throw new Error(response.message || 'Failed to create budget');
    } catch (error) {
      console.error('Error creating budget:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Update existing budget
   */
  async updateBudget(budgetId, updateData) {
    try {
      // Validate update data
      const validationResult = validateBudget(updateData, true); // partial validation
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Sanitize input data
      const sanitizedData = sanitizeInput(updateData);

      // Process specific fields that need special handling
      if (sanitizedData.income) {
        sanitizedData.income = this.processIncomeData(sanitizedData.income);
      }
      if (sanitizedData.categories) {
        sanitizedData.categories = this.processCategoryData(sanitizedData.categories);
      }
      if (sanitizedData.startDate) {
        sanitizedData.startDate = new Date(sanitizedData.startDate).toISOString();
      }
      if (sanitizedData.endDate) {
        sanitizedData.endDate = new Date(sanitizedData.endDate).toISOString();
      }

      // Update metadata
      sanitizedData.lastUpdated = new Date().toISOString();

      // Encrypt sensitive data
      const encryptedData = await this.encryptBudget(sanitizedData);

      const response = await apiRequest(`${this.baseUrl}/${budgetId}`, {
        method: 'PUT',
        body: encryptedData,
        requiresAuth: true
      });

      if (response.success) {
        // Clear budget caches
        this.clearBudgetCaches();
        
        await logUserAction('budget_updated', {
          budgetId: budgetId,
          updatedFields: Object.keys(updateData)
        });

        const decryptedBudget = await this.decryptBudget(response.data);
        return decryptedBudget;
      }

      throw new Error(response.message || 'Failed to update budget');
    } catch (error) {
      console.error('Error updating budget:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get budget templates for quick setup
   */
  async getBudgetTemplates(options = {}) {
    try {
      const cacheKey = `budget_templates_${options.country || 'US'}_${options.income || 0}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout * 10) { // Longer cache
        return cached.data;
      }

      const queryParams = new URLSearchParams({
        country: options.country || 'US',
        income: options.income || 0,
        method: options.method || '',
        household: options.household || 'single'
      });

      const response = await apiRequest(`${this.baseUrl}/templates?${queryParams}`, {
        method: 'GET',
        requiresAuth: true
      });

      if (response.success) {
        const result = {
          templates: response.data.templates,
          recommendations: response.data.recommendations,
          benchmarks: response.data.benchmarks
        };

        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });

        return result;
      }

      throw new Error(response.message || 'Failed to fetch budget templates');
    } catch (error) {
      console.error('Error fetching budget templates:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Create budget from template
   */
  async createFromTemplate(templateId, customization = {}) {
    try {
      const response = await apiRequest(`${this.baseUrl}/templates/${templateId}/create`, {
        method: 'POST',
        body: {
          income: customization.income,
          adjustments: customization.adjustments || {},
          startDate: customization.startDate || new Date().toISOString()
        },
        requiresAuth: true
      });

      if (response.success) {
        // Clear budget caches
        this.clearBudgetCaches();
        
        await logUserAction('budget_created_from_template', {
          templateId: templateId,
          budgetId: response.data.id,
          customizations: Object.keys(customization)
        });

        const decryptedBudget = await this.decryptBudget(response.data);
        return decryptedBudget;
      }

      throw new Error(response.message || 'Failed to create budget from template');
    } catch (error) {
      console.error('Error creating budget from template:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get budget analysis and insights
   */
  async getBudgetAnalysis(budgetId, options = {}) {
    try {
      const queryParams = new URLSearchParams({
        period: options.period || 'current',
        includeForecasts: options.includeForecasts || true,
        includeRecommendations: options.includeRecommendations || true
      });

      const response = await apiRequest(`${this.baseUrl}/${budgetId}/analysis?${queryParams}`, {
        method: 'GET',
        requiresAuth: true
      });

      if (response.success) {
        return {
          performance: response.data.performance,
          trends: response.data.trends,
          categoryAnalysis: response.data.categoryAnalysis,
          forecasts: response.data.forecasts,
          recommendations: response.data.recommendations,
          benchmarks: response.data.benchmarks,
          insights: response.data.insights
        };
      }

      throw new Error(response.message || 'Failed to fetch budget analysis');
    } catch (error) {
      console.error('Error fetching budget analysis:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Adjust budget category allocation
   */
  async adjustCategoryBudget(budgetId, categoryId, newAmount, reason = '') {
    try {
      const response = await apiRequest(`${this.baseUrl}/${budgetId}/categories/${categoryId}/adjust`, {
        method: 'PUT',
        body: {
          newAmount: parseFloat(newAmount),
          reason: reason,
          adjustmentDate: new Date().toISOString()
        },
        requiresAuth: true
      });

      if (response.success) {
        // Clear budget caches
        this.clearBudgetCaches();
        
        await logUserAction('budget_category_adjusted', {
          budgetId: budgetId,
          categoryId: categoryId,
          oldAmount: response.data.oldAmount,
          newAmount: newAmount,
          reason: reason
        });

        return {
          updatedCategory: response.data.category,
          budgetBalance: response.data.budgetBalance,
          recommendations: response.data.recommendations
        };
      }

      throw new Error(response.message || 'Failed to adjust category budget');
    } catch (error) {
      console.error('Error adjusting category budget:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get budget vs actual comparison
   */
  async getBudgetComparison(budgetId, period = 'current') {
    try {
      const cacheKey = `budget_comparison_${budgetId}_${period}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      const response = await apiRequest(`${this.baseUrl}/${budgetId}/comparison`, {
        method: 'GET',
        body: { period },
        requiresAuth: true
      });

      if (response.success) {
        const result = {
          summary: response.data.summary,
          categoryComparisons: response.data.categoryComparisons,
          trends: response.data.trends,
          variances: response.data.variances,
          alerts: response.data.alerts
        };

        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });

        return result;
      }

      throw new Error(response.message || 'Failed to fetch budget comparison');
    } catch (error) {
      console.error('Error fetching budget comparison:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Create automatic budget rules
   */
  async createBudgetRule(budgetId, ruleData) {
    try {
      const processedRule = {
        name: ruleData.name,
        description: ruleData.description || '',
        trigger: ruleData.trigger, // 'overspend', 'underspend', 'monthly_rollover'
        conditions: ruleData.conditions,
        actions: ruleData.actions,
        enabled: ruleData.enabled !== false
      };

      const response = await apiRequest(`${this.baseUrl}/${budgetId}/rules`, {
        method: 'POST',
        body: processedRule,
        requiresAuth: true
      });

      if (response.success) {
        await logUserAction('budget_rule_created', {
          budgetId: budgetId,
          ruleId: response.data.id,
          trigger: processedRule.trigger
        });

        return response.data;
      }

      throw new Error(response.message || 'Failed to create budget rule');
    } catch (error) {
      console.error('Error creating budget rule:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get budget alerts and notifications
   */
  async getBudgetAlerts(budgetId) {
    try {
      const response = await apiRequest(`${this.baseUrl}/${budgetId}/alerts`, {
        method: 'GET',
        requiresAuth: true
      });

      if (response.success) {
        return {
          active: response.data.active,
          recent: response.data.recent,
          settings: response.data.settings
        };
      }

      throw new Error(response.message || 'Failed to fetch budget alerts');
    } catch (error) {
      console.error('Error fetching budget alerts:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Optimize budget allocation using AI
   */
  async optimizeBudget(budgetId, optimizationGoals = {}) {
    try {
      const response = await apiRequest(`${this.baseUrl}/${budgetId}/optimize`, {
        method: 'POST',
        body: {
          goals: optimizationGoals, // 'maximize_savings', 'reduce