/**
 * SmartFinanceAI - Goal Management API
 * SMART goal tracking with AI optimization and progress analytics
 * File: src/api/goal-api.js
 */

import { apiRequest, handleApiError } from './endpoints.js';
import { encrypt, decrypt } from '../data/encryption-service.js';
import { validateGoal, sanitizeInput } from '../utils/validation-utils.js';
import { formatCurrency, calculateProgress } from '../utils/formatting-utils.js';
import { calculateCompoundInterest, calculateTimeToGoal } from '../utils/financial-utils.js';
import { logUserAction } from '../platform/audit-logger.js';

class GoalAPI {
  constructor() {
    this.baseUrl = '/api/v1/goals';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.goalTypes = [
      'emergency_fund', 'house_deposit', 'car_purchase', 'vacation',
      'debt_payoff', 'retirement', 'education', 'investment',
      'business', 'wedding', 'other'
    ];
    this.priorities = ['critical', 'high', 'medium', 'low'];
  }

  /**
   * Get all user goals with progress calculations
   */
  async getGoals(options = {}) {
    try {
      const cacheKey = this.generateCacheKey('goals', options);
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      const queryParams = new URLSearchParams({
        status: options.status || '', // 'active', 'completed', 'paused', 'archived'
        category: options.category || '',
        priority: options.priority || '',
        sortBy: options.sortBy || 'priority',
        sortOrder: options.sortOrder || 'desc'
      });

      const response = await apiRequest(`${this.baseUrl}?${queryParams}`, {
        method: 'GET',
        requiresAuth: true
      });

      if (response.success) {
        // Decrypt and calculate progress for each goal
        const processedGoals = await Promise.all(
          response.data.goals.map(async (goal) => {
            const decryptedGoal = await this.decryptGoal(goal);
            const progress = await this.calculateGoalProgress(decryptedGoal);
            return { ...decryptedGoal, ...progress };
          })
        );

        const result = {
          goals: processedGoals,
          summary: response.data.summary,
          totalValue: response.data.totalValue,
          completedCount: response.data.completedCount,
          activeCount: response.data.activeCount
        };

        // Cache the result
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });

        return result;
      }

      throw new Error(response.message || 'Failed to fetch goals');
    } catch (error) {
      console.error('Error fetching goals:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Create new goal with SMART criteria validation
   */
  async createGoal(goalData) {
    try {
      // Validate goal data
      const validationResult = validateGoal(goalData);
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Sanitize input data
      const sanitizedData = sanitizeInput(goalData);
      
      // Process goal data with SMART criteria
      const processedGoal = {
        name: sanitizedData.name,
        description: sanitizedData.description,
        category: sanitizedData.category,
        priority: sanitizedData.priority || 'medium',
        
        // SMART criteria
        targetAmount: parseFloat(sanitizedData.targetAmount),
        currentAmount: parseFloat(sanitizedData.currentAmount) || 0,
        targetDate: new Date(sanitizedData.targetDate).toISOString(),
        monthlyContribution: parseFloat(sanitizedData.monthlyContribution) || 0,
        
        // Additional settings
        autoContribute: sanitizedData.autoContribute || false,
        sourceAccountId: sanitizedData.sourceAccountId || null,
        reminderFrequency: sanitizedData.reminderFrequency || 'monthly',
        
        // Metadata
        createdDate: new Date().toISOString(),
        tags: sanitizedData.tags || [],
        notes: sanitizedData.notes || ''
      };

      // Calculate initial projections
      const projections = await this.calculateGoalProjections(processedGoal);
      processedGoal.projections = projections;

      // Encrypt sensitive data
      const encryptedGoal = await this.encryptGoal(processedGoal);

      const response = await apiRequest(this.baseUrl, {
        method: 'POST',
        body: encryptedGoal,
        requiresAuth: true
      });

      if (response.success) {
        // Clear goal caches
        this.clearGoalCaches();
        
        await logUserAction('goal_created', {
          goalId: response.data.id,
          category: processedGoal.category,
          targetAmount: processedGoal.targetAmount,
          targetDate: processedGoal.targetDate
        });

        const decryptedGoal = await this.decryptGoal(response.data);
        const progress = await this.calculateGoalProgress(decryptedGoal);
        
        return { ...decryptedGoal, ...progress };
      }

      throw new Error(response.message || 'Failed to create goal');
    } catch (error) {
      console.error('Error creating goal:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Update existing goal
   */
  async updateGoal(goalId, updateData) {
    try {
      // Validate update data
      const validationResult = validateGoal(updateData, true); // partial validation
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Sanitize input data
      const sanitizedData = sanitizeInput(updateData);
      
      // Process numeric fields
      if (sanitizedData.targetAmount) {
        sanitizedData.targetAmount = parseFloat(sanitizedData.targetAmount);
      }
      if (sanitizedData.currentAmount !== undefined) {
        sanitizedData.currentAmount = parseFloat(sanitizedData.currentAmount);
      }
      if (sanitizedData.monthlyContribution !== undefined) {
        sanitizedData.monthlyContribution = parseFloat(sanitizedData.monthlyContribution);
      }
      if (sanitizedData.targetDate) {
        sanitizedData.targetDate = new Date(sanitizedData.targetDate).toISOString();
      }

      // Update metadata
      sanitizedData.lastUpdated = new Date().toISOString();

      // Encrypt sensitive data
      const encryptedData = await this.encryptGoal(sanitizedData);

      const response = await apiRequest(`${this.baseUrl}/${goalId}`, {
        method: 'PUT',
        body: encryptedData,
        requiresAuth: true
      });

      if (response.success) {
        // Clear goal caches
        this.clearGoalCaches();
        
        await logUserAction('goal_updated', {
          goalId: goalId,
          updatedFields: Object.keys(updateData)
        });

        const decryptedGoal = await this.decryptGoal(response.data);
        const progress = await this.calculateGoalProgress(decryptedGoal);
        
        return { ...decryptedGoal, ...progress };
      }

      throw new Error(response.message || 'Failed to update goal');
    } catch (error) {
      console.error('Error updating goal:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Add contribution to goal
   */
  async addContribution(goalId, contributionData) {
    try {
      const processedContribution = {
        amount: parseFloat(contributionData.amount),
        date: contributionData.date ? new Date(contributionData.date).toISOString() : new Date().toISOString(),
        source: contributionData.source || 'manual', // 'manual', 'automatic', 'transfer'
        sourceAccountId: contributionData.sourceAccountId || null,
        notes: contributionData.notes || ''
      };

      const response = await apiRequest(`${this.baseUrl}/${goalId}/contributions`, {
        method: 'POST',
        body: processedContribution,
        requiresAuth: true
      });

      if (response.success) {
        // Clear goal caches
        this.clearGoalCaches();
        
        await logUserAction('goal_contribution_added', {
          goalId: goalId,
          amount: processedContribution.amount,
          source: processedContribution.source
        });

        return {
          contribution: response.data.contribution,
          updatedGoal: await this.decryptGoal(response.data.goal),
          newProgress: response.data.progress
        };
      }

      throw new Error(response.message || 'Failed to add contribution');
    } catch (error) {
      console.error('Error adding contribution:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get goal contributions history
   */
  async getContributions(goalId, options = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: options.page || 1,
        limit: options.limit || 50,
        startDate: options.startDate || '',
        endDate: options.endDate || ''
      });

      const response = await apiRequest(`${this.baseUrl}/${goalId}/contributions?${queryParams}`, {
        method: 'GET',
        requiresAuth: true
      });

      if (response.success) {
        return {
          contributions: response.data.contributions,
          totalAmount: response.data.totalAmount,
          totalCount: response.data.totalCount,
          averageContribution: response.data.averageContribution,
          monthlyAverage: response.data.monthlyAverage
        };
      }

      throw new Error(response.message || 'Failed to fetch contributions');
    } catch (error) {
      console.error('Error fetching contributions:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Delete goal
   */
  async deleteGoal(goalId) {
    try {
      const response = await apiRequest(`${this.baseUrl}/${goalId}`, {
        method: 'DELETE',
        requiresAuth: true
      });

      if (response.success) {
        // Clear goal caches
        this.clearGoalCaches();
        
        await logUserAction('goal_deleted', {
          goalId: goalId
        });

        return response.data;
      }

      throw new Error(response.message || 'Failed to delete goal');
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get goal templates for quick setup
   */
  async getGoalTemplates(country = 'US') {
    try {
      const cacheKey = `goal_templates_${country}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout * 10) { // Longer cache
        return cached.data;
      }

      const response = await apiRequest(`${this.baseUrl}/templates`, {
        method: 'GET',
        body: { country },
        requiresAuth: true
      });

      if (response.success) {
        const result = {
          templates: response.data.templates,
          categories: response.data.categories,
          recommendations: response.data.recommendations
        };

        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });

        return result;
      }

      throw new Error(response.message || 'Failed to fetch goal templates');
    } catch (error) {
      console.error('Error fetching goal templates:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Create goal from template
   */
  async createFromTemplate(templateId, customization = {}) {
    try {
      const response = await apiRequest(`${this.baseUrl}/templates/${templateId}/create`, {
        method: 'POST',
        body: customization,
        requiresAuth: true
      });

      if (response.success) {
        // Clear goal caches
        this.clearGoalCaches();
        
        await logUserAction('goal_created_from_template', {
          templateId: templateId,
          goalId: response.data.id
        });

        const decryptedGoal = await this.decryptGoal(response.data);
        const progress = await this.calculateGoalProgress(decryptedGoal);
        
        return { ...decryptedGoal, ...progress };
      }

      throw new Error(response.message || 'Failed to create goal from template');
    } catch (error) {
      console.error('Error creating goal from template:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get AI-powered goal optimization suggestions
   */
  async getOptimizationSuggestions(goalId) {
    try {
      const response = await apiRequest(`${this.baseUrl}/${goalId}/optimize`, {
        method: 'GET',
        requiresAuth: true
      });

      if (response.success) {
        return {
          suggestions: response.data.suggestions,
          scenarios: response.data.scenarios,
          recommendations: response.data.recommendations,
          potentialSavings: response.data.potentialSavings
        };
      }

      throw new Error(response.message || 'Failed to get optimization suggestions');
    } catch (error) {
      console.error('Error getting optimization suggestions:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Set up automatic contributions
   */
  async setupAutoContribution(goalId, autoSettings) {
    try {
      const processedSettings = {
        enabled: autoSettings.enabled,
        amount: parseFloat(autoSettings.amount),
        frequency: autoSettings.frequency, // 'weekly', 'biweekly', 'monthly'
        sourceAccountId: autoSettings.sourceAccountId,
        startDate: new Date(autoSettings.startDate).toISOString(),
        endDate: autoSettings.endDate ? new Date(autoSettings.endDate).toISOString() : null
      };

      const response = await apiRequest(`${this.baseUrl}/${goalId}/auto-contribution`, {
        method: 'PUT',
        body: processedSettings,
        requiresAuth: true
      });

      if (response.success) {
        await logUserAction('auto_contribution_setup', {
          goalId: goalId,
          amount: processedSettings.amount,
          frequency: processedSettings.frequency
        });

        return response.data;
      }

      throw new Error(response.message || 'Failed to setup auto contribution');
    } catch (error) {
      console.error('Error setting up auto contribution:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Calculate detailed goal progress and projections
   */
  async calculateGoalProgress(goal) {
    try {
      const now = new Date();
      const targetDate = new Date(goal.targetDate);
      const createdDate = new Date(goal.createdDate);
      
      // Basic progress calculation
      const progressPercentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
      const remainingAmount = Math.max(goal.targetAmount - goal.currentAmount, 0);
      
      // Time calculations
      const totalTimeMs = targetDate.getTime() - createdDate.getTime();
      const elapsedTimeMs = now.getTime() - createdDate.getTime();
      const remainingTimeMs = Math.max(targetDate.getTime() - now.getTime(), 0);
      
      const timeProgressPercentage = Math.min((elapsedTimeMs / totalTimeMs) * 100, 100);
      const remainingDays = Math.ceil(remainingTimeMs / (1000 * 60 * 60 * 24));
      const remainingMonths = remainingDays / 30.44; // Average days per month
      
      // Calculate required monthly contribution to meet goal
      const requiredMonthlyContribution = remainingMonths > 0 ? remainingAmount / remainingMonths : 0;
      
      // Project completion date based on current contribution rate
      let projectedCompletionDate = null;
      if (goal.monthlyContribution > 0 && remainingAmount > 0) {
        const monthsToComplete = remainingAmount / goal.monthlyContribution;
        projectedCompletionDate = new Date(now.getTime() + (monthsToComplete * 30.44 * 24 * 60 * 60 * 1000));
      }
      
      // Determine if goal is on track
      const onTrack = progressPercentage >= timeProgressPercentage * 0.9; // 10% tolerance
      
      // Calculate compound growth if applicable (investment goals)
      let projectedFinalAmount = goal.currentAmount;
      if (goal.category === 'investment' || goal.category === 'retirement') {
        const annualReturnRate = 0.07; // Assumed 7% annual return
        const monthsRemaining = Math.max(remainingMonths, 0);
        projectedFinalAmount = calculateCompoundInterest(
          goal.currentAmount,
          annualReturnRate,
          12, // Monthly compounding
          monthsRemaining / 12
        );
        
        if (goal.monthlyContribution > 0) {
          // Add future contributions with compound growth
          for (let i = 1; i <= monthsRemaining; i++) {
            const contribution = goal.monthlyContribution;
            const monthsToGrow = monthsRemaining - i;
            const contributionGrowth = calculateCompoundInterest(
              contribution,
              annualReturnRate,
              12,
              monthsToGrow / 12
            );
            projectedFinalAmount += contributionGrowth;
          }
        }
      } else if (goal.monthlyContribution > 0) {
        // Simple addition for non-investment goals
        projectedFinalAmount = goal.currentAmount + (goal.month