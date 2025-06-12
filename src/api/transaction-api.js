/**
 * SmartFinanceAI - Transaction Management API
 * Advanced transaction processing with AI categorization and duplicate detection
 * File: src/api/transaction-api.js
 */

import { apiRequest, handleApiError } from './endpoints.js';
import { encrypt, decrypt } from '../data/encryption-service.js';
import { validateTransaction, sanitizeInput } from '../utils/validation-utils.js';
import { formatCurrency, normalizeMerchant } from '../utils/formatting-utils.js';
import { logUserAction } from '../platform/audit-logger.js';

class TransactionAPI {
  constructor() {
    this.baseUrl = '/api/v1/transactions';
    this.cache = new Map();
    this.cacheTimeout = 2 * 60 * 1000; // 2 minutes for real-time data
    this.categories = [
      'groceries', 'dining', 'entertainment', 'transport', 'utilities',
      'healthcare', 'shopping', 'travel', 'education', 'insurance',
      'investments', 'income', 'transfers', 'fees', 'other'
    ];
  }

  /**
   * Get transactions with advanced filtering and pagination
   */
  async getTransactions(options = {}) {
    try {
      const cacheKey = this.generateCacheKey('transactions', options);
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      const queryParams = new URLSearchParams({
        page: options.page || 1,
        limit: options.limit || 50,
        accountId: options.accountId || '',
        category: options.category || '',
        startDate: options.startDate || '',
        endDate: options.endDate || '',
        minAmount: options.minAmount || '',
        maxAmount: options.maxAmount || '',
        search: options.search || '',
        sortBy: options.sortBy || 'date',
        sortOrder: options.sortOrder || 'desc'
      });

      const response = await apiRequest(`${this.baseUrl}?${queryParams}`, {
        method: 'GET',
        requiresAuth: true
      });

      if (response.success) {
        // Decrypt transaction data
        const decryptedTransactions = await Promise.all(
          response.data.transactions.map(t => this.decryptTransaction(t))
        );

        const result = {
          transactions: decryptedTransactions,
          totalCount: response.data.totalCount,
          currentPage: response.data.currentPage,
          totalPages: response.data.totalPages,
          summary: response.data.summary
        };

        // Cache the result
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });

        return result;
      }

      throw new Error(response.message || 'Failed to fetch transactions');
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Add new transaction with AI categorization
   */
  async addTransaction(transactionData) {
    try {
      // Validate transaction data
      const validationResult = validateTransaction(transactionData);
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Sanitize and normalize data
      const sanitizedData = sanitizeInput(transactionData);
      const normalizedTransaction = {
        ...sanitizedData,
        merchant: normalizeMerchant(sanitizedData.description || sanitizedData.merchant),
        amount: parseFloat(sanitizedData.amount),
        date: new Date(sanitizedData.date).toISOString(),
        accountId: sanitizedData.accountId
      };

      // Encrypt sensitive data
      const encryptedTransaction = await this.encryptTransaction(normalizedTransaction);

      const response = await apiRequest(this.baseUrl, {
        method: 'POST',
        body: encryptedTransaction,
        requiresAuth: true
      });

      if (response.success) {
        // Clear relevant caches
        this.clearTransactionCaches();
        
        await logUserAction('transaction_added', {
          transactionId: response.data.id,
          amount: normalizedTransaction.amount,
          category: response.data.category
        });

        return await this.decryptTransaction(response.data);
      }

      throw new Error(response.message || 'Failed to add transaction');
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Update existing transaction
   */
  async updateTransaction(transactionId, updateData) {
    try {
      // Validate update data
      const validationResult = validateTransaction(updateData, true); // partial validation
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Sanitize and normalize data
      const sanitizedData = sanitizeInput(updateData);
      if (sanitizedData.description || sanitizedData.merchant) {
        sanitizedData.merchant = normalizeMerchant(
          sanitizedData.description || sanitizedData.merchant
        );
      }

      // Encrypt sensitive data
      const encryptedData = await this.encryptTransaction(sanitizedData);

      const response = await apiRequest(`${this.baseUrl}/${transactionId}`, {
        method: 'PUT',
        body: encryptedData,
        requiresAuth: true
      });

      if (response.success) {
        // Clear relevant caches
        this.clearTransactionCaches();
        
        await logUserAction('transaction_updated', {
          transactionId: transactionId,
          updatedFields: Object.keys(updateData)
        });

        return await this.decryptTransaction(response.data);
      }

      throw new Error(response.message || 'Failed to update transaction');
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Delete transaction
   */
  async deleteTransaction(transactionId) {
    try {
      const response = await apiRequest(`${this.baseUrl}/${transactionId}`, {
        method: 'DELETE',
        requiresAuth: true
      });

      if (response.success) {
        // Clear relevant caches
        this.clearTransactionCaches();
        
        await logUserAction('transaction_deleted', {
          transactionId: transactionId
        });

        return response.data;
      }

      throw new Error(response.message || 'Failed to delete transaction');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Bulk import transactions from CSV
   */
  async importTransactions(csvData, bankFormat, options = {}) {
    try {
      const response = await apiRequest(`${this.baseUrl}/import`, {
        method: 'POST',
        body: {
          csvData: csvData,
          bankFormat: bankFormat,
          accountId: options.accountId,
          skipDuplicates: options.skipDuplicates || true,
          autoCategory: options.autoCategory || true
        },
        requiresAuth: true
      });

      if (response.success) {
        // Clear all transaction caches
        this.clearTransactionCaches();
        
        await logUserAction('transactions_imported', {
          count: response.data.imported,
          duplicates: response.data.duplicates,
          errors: response.data.errors,
          bankFormat: bankFormat
        });

        return {
          imported: response.data.imported,
          duplicates: response.data.duplicates,
          errors: response.data.errors,
          transactions: await Promise.all(
            response.data.transactions.map(t => this.decryptTransaction(t))
          )
        };
      }

      throw new Error(response.message || 'Failed to import transactions');
    } catch (error) {
      console.error('Error importing transactions:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get transaction categories with usage statistics
   */
  async getCategories() {
    try {
      const cacheKey = 'transaction_categories';
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout * 10) { // Longer cache
        return cached.data;
      }

      const response = await apiRequest(`${this.baseUrl}/categories`, {
        method: 'GET',
        requiresAuth: true
      });

      if (response.success) {
        const result = {
          categories: response.data.categories,
          usage: response.data.usage,
          suggestions: response.data.suggestions
        };

        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });

        return result;
      }

      throw new Error(response.message || 'Failed to fetch categories');
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Auto-categorize transaction using AI
   */
  async categorizeTransaction(transactionId, description, amount) {
    try {
      const response = await apiRequest(`${this.baseUrl}/${transactionId}/categorize`, {
        method: 'POST',
        body: {
          description: description,
          amount: amount
        },
        requiresAuth: true
      });

      if (response.success) {
        await logUserAction('transaction_categorized', {
          transactionId: transactionId,
          category: response.data.category,
          confidence: response.data.confidence
        });

        return {
          category: response.data.category,
          confidence: response.data.confidence,
          suggestions: response.data.suggestions
        };
      }

      throw new Error(response.message || 'Failed to categorize transaction');
    } catch (error) {
      console.error('Error categorizing transaction:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Detect duplicate transactions
   */
  async findDuplicates(accountId, timeRange = 30) {
    try {
      const response = await apiRequest(`${this.baseUrl}/duplicates`, {
        method: 'GET',
        body: {
          accountId: accountId,
          timeRange: timeRange // days
        },
        requiresAuth: true
      });

      if (response.success) {
        return {
          duplicates: response.data.duplicates.map(group => ({
            transactions: group.transactions.map(t => this.decryptTransaction(t)),
            similarity: group.similarity,
            recommendation: group.recommendation
          })),
          totalFound: response.data.totalFound
        };
      }

      throw new Error(response.message || 'Failed to find duplicates');
    } catch (error) {
      console.error('Error finding duplicates:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Merge duplicate transactions
   */
  async mergeDuplicates(primaryTransactionId, duplicateIds) {
    try {
      const response = await apiRequest(`${this.baseUrl}/merge`, {
        method: 'POST',
        body: {
          primaryId: primaryTransactionId,
          duplicateIds: duplicateIds
        },
        requiresAuth: true
      });

      if (response.success) {
        // Clear relevant caches
        this.clearTransactionCaches();
        
        await logUserAction('transactions_merged', {
          primaryId: primaryTransactionId,
          mergedCount: duplicateIds.length
        });

        return await this.decryptTransaction(response.data);
      }

      throw new Error(response.message || 'Failed to merge duplicates');
    } catch (error) {
      console.error('Error merging duplicates:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get transaction analytics and insights
   */
  async getAnalytics(options = {}) {
    try {
      const queryParams = new URLSearchParams({
        period: options.period || 'month', // 'week', 'month', 'quarter', 'year'
        startDate: options.startDate || '',
        endDate: options.endDate || '',
        accountIds: options.accountIds?.join(',') || '',
        categories: options.categories?.join(',') || ''
      });

      const response = await apiRequest(`${this.baseUrl}/analytics?${queryParams}`, {
        method: 'GET',
        requiresAuth: true
      });

      if (response.success) {
        return {
          summary: response.data.summary,
          categoryBreakdown: response.data.categoryBreakdown,
          trends: response.data.trends,
          insights: response.data.insights,
          comparisons: response.data.comparisons
        };
      }

      throw new Error(response.message || 'Failed to fetch analytics');
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Search transactions with advanced filters
   */
  async searchTransactions(searchQuery, filters = {}) {
    try {
      const response = await apiRequest(`${this.baseUrl}/search`, {
        method: 'POST',
        body: {
          query: searchQuery,
          filters: {
            dateRange: filters.dateRange,
            amountRange: filters.amountRange,
            categories: filters.categories,
            accounts: filters.accounts,
            merchants: filters.merchants
          },
          limit: filters.limit || 100
        },
        requiresAuth: true
      });

      if (response.success) {