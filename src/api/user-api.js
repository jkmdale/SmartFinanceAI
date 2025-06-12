/**
 * SmartFinanceAI - User Management API
 * Enterprise-grade user lifecycle management with multi-tenant support
 * File: src/api/user-api.js
 */

import { apiRequest, handleApiError } from './endpoints.js';
import { encrypt, decrypt } from '../data/encryption-service.js';
import { validateUserData, sanitizeInput } from '../utils/validation-utils.js';
import { logUserAction } from '../platform/audit-logger.js';

class UserAPI {
  constructor() {
    this.baseUrl = '/api/v1/users';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get current user profile with enhanced security
   */
  async getCurrentUser() {
    try {
      const cacheKey = 'current_user';
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      const response = await apiRequest(`${this.baseUrl}/me`, {
        method: 'GET',
        requiresAuth: true
      });

      if (response.success) {
        // Decrypt sensitive data client-side
        const userData = await this.decryptUserData(response.data);
        
        // Cache the result
        this.cache.set(cacheKey, {
          data: userData,
          timestamp: Date.now()
        });

        await logUserAction('profile_accessed', { userId: userData.id });
        return userData;
      }

      throw new Error(response.message || 'Failed to fetch user profile');
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Update user profile with validation and encryption
   */
  async updateProfile(profileData) {
    try {
      // Validate input data
      const validationResult = validateUserData(profileData);
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Sanitize input
      const sanitizedData = sanitizeInput(profileData);
      
      // Encrypt sensitive fields
      const encryptedData = await this.encryptUserData(sanitizedData);

      const response = await apiRequest(`${this.baseUrl}/profile`, {
        method: 'PUT',
        body: encryptedData,
        requiresAuth: true
      });

      if (response.success) {
        // Clear cache to force refresh
        this.cache.delete('current_user');
        
        await logUserAction('profile_updated', { 
          userId: response.data.id,
          fields: Object.keys(profileData)
        });

        return await this.decryptUserData(response.data);
      }

      throw new Error(response.message || 'Failed to update profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Update user preferences with country-specific settings
   */
  async updatePreferences(preferences) {
    try {
      const response = await apiRequest(`${this.baseUrl}/preferences`, {
        method: 'PUT',
        body: {
          currency: preferences.currency,
          dateFormat: preferences.dateFormat,
          numberFormat: preferences.numberFormat,
          timezone: preferences.timezone,
          language: preferences.language,
          country: preferences.country,
          theme: preferences.theme,
          privacyMode: preferences.privacyMode,
          notifications: preferences.notifications,
          twoFactorEnabled: preferences.twoFactorEnabled
        },
        requiresAuth: true
      });

      if (response.success) {
        // Update local preferences
        await this.updateLocalPreferences(preferences);
        
        await logUserAction('preferences_updated', { 
          userId: response.data.userId,
          changes: Object.keys(preferences)
        });

        return response.data;
      }

      throw new Error(response.message || 'Failed to update preferences');
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Manage subscription and billing
   */
  async updateSubscription(subscriptionData) {
    try {
      const response = await apiRequest(`${this.baseUrl}/subscription`, {
        method: 'PUT',
        body: {
          tier: subscriptionData.tier, // 'free', 'premium', 'professional'
          billingCycle: subscriptionData.billingCycle, // 'monthly', 'yearly'
          paymentMethod: subscriptionData.paymentMethod,
          couponCode: subscriptionData.couponCode
        },
        requiresAuth: true
      });

      if (response.success) {
        await logUserAction('subscription_updated', { 
          userId: response.data.userId,
          newTier: subscriptionData.tier,
          billingCycle: subscriptionData.billingCycle
        });

        return response.data;
      }

      throw new Error(response.message || 'Failed to update subscription');
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Family/Couples account management
   */
  async invitePartner(inviteData) {
    try {
      const response = await apiRequest(`${this.baseUrl}/invite`, {
        method: 'POST',
        body: {
          email: inviteData.email,
          role: inviteData.role, // 'partner', 'child', 'guardian'
          permissions: inviteData.permissions,
          message: inviteData.message
        },
        requiresAuth: true
      });

      if (response.success) {
        await logUserAction('partner_invited', { 
          inviterUserId: response.data.inviterUserId,
          inviteeEmail: inviteData.email,
          role: inviteData.role
        });

        return response.data;
      }

      throw new Error(response.message || 'Failed to send invitation');
    } catch (error) {
      console.error('Error inviting partner:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Accept partner invitation
   */
  async acceptInvitation(invitationToken) {
    try {
      const response = await apiRequest(`${this.baseUrl}/invite/accept`, {
        method: 'POST',
        body: { token: invitationToken },
        requiresAuth: true
      });

      if (response.success) {
        await logUserAction('invitation_accepted', { 
          userId: response.data.userId,
          familyId: response.data.familyId
        });

        return response.data;
      }

      throw new Error(response.message || 'Failed to accept invitation');
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Manage family member permissions
   */
  async updateMemberPermissions(memberId, permissions) {
    try {
      const response = await apiRequest(`${this.baseUrl}/family/members/${memberId}/permissions`, {
        method: 'PUT',
        body: {
          canViewAccounts: permissions.canViewAccounts,
          canViewTransactions: permissions.canViewTransactions,
          canManageBudgets: permissions.canManageBudgets,
          canSetGoals: permissions.canSetGoals,
          canInviteMembers: permissions.canInviteMembers,
          spendingLimit: permissions.spendingLimit
        },
        requiresAuth: true
      });

      if (response.success) {
        await logUserAction('member_permissions_updated', { 
          updatedBy: response.data.updatedBy,
          memberId: memberId,
          newPermissions: permissions
        });

        return response.data;
      }

      throw new Error(response.message || 'Failed to update member permissions');
    } catch (error) {
      console.error('Error updating member permissions:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get family members and their permissions
   */
  async getFamilyMembers() {
    try {
      const response = await apiRequest(`${this.baseUrl}/family/members`, {
        method: 'GET',
        requiresAuth: true
      });

      if (response.success) {
        return response.data.members.map(member => ({
          id: member.id,
          email: member.email,
          name: member.name,
          role: member.role,
          permissions: member.permissions,
          status: member.status, // 'active', 'invited', 'suspended'
          joinedAt: member.joinedAt,
          lastActive: member.lastActive
        }));
      }

      throw new Error(response.message || 'Failed to fetch family members');
    } catch (error) {
      console.error('Error fetching family members:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Delete user account with data cleanup
   */
  async deleteAccount(confirmationData) {
    try {
      const response = await apiRequest(`${this.baseUrl}/delete`, {
        method: 'DELETE',
        body: {
          password: confirmationData.password,
          confirmationText: confirmationData.confirmationText,
          reason: confirmationData.reason,
          exportData: confirmationData.exportData
        },
        requiresAuth: true
      });

      if (response.success) {
        await logUserAction('account_deleted', { 
          userId: response.data.userId,
          reason: confirmationData.reason,
          dataExported: confirmationData.exportData
        });

        // Clear all local data
        await this.clearAllUserData();

        return response.data;
      }

      throw new Error(response.message || 'Failed to delete account');
    } catch (error) {
      console.error('Error deleting account:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Export user data for GDPR compliance
   */
  async exportUserData(format = 'json') {
    try {
      const response = await apiRequest(`${this.baseUrl}/export`, {
        method: 'POST',
        body: { format }, // 'json', 'csv', 'pdf'
        requiresAuth: true
      });

      if (response.success) {
        await logUserAction('data_exported', { 
          userId: response.data.userId,
          format: format,
          fileSize: response.data.fileSize
        });

        return response.data; // Contains download URL or data
      }

      throw new Error(response.message || 'Failed to export user data');
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get user activity logs
   */
  async getActivityLogs(options = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: options.page || 1,
        limit: options.limit || 50,
        startDate: options.startDate || '',
        endDate: options.endDate || '',
        actionType: options.actionType || ''
      });

      const response = await apiRequest(`${this.baseUrl}/activity?${queryParams}`, {
        method: 'GET',
        requiresAuth: true
      });

      if (response.success) {
        return {
          logs: response.data.logs,
          totalCount: response.data.totalCount,
          currentPage: response.data.currentPage,
          totalPages: response.data.totalPages
        };
      }

      throw new Error(response.message || 'Failed to fetch activity logs');
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Encrypt sensitive user data before transmission
   */
  async encryptUserData(userData) {
    const sensitiveFields = ['ssn', 'bankAccount', 'phoneNumber', 'address'];
    const encryptedData = { ...userData };

    for (const field of sensitiveFields) {
      if (userData[field]) {
        encryptedData[field] = await encrypt(userData[field]);
      }
    }

    return encryptedData;
  }

  /**
   * Decrypt sensitive user data after receipt
   */
  async decryptUserData(encryptedData) {
    const sensitiveFields = ['ssn', 'bankAccount', 'phoneNumber', 'address'];
    const decryptedData = { ...encryptedData };

    for (const field of sensitiveFields) {
      if (encryptedData[field] && typeof encryptedData[field] === 'object') {
        try {
          decryptedData[field] = await decrypt(encryptedData[field]);
        } catch (error) {
          console.warn(`Failed to decrypt field ${field}:`, error);
          decryptedData[field] = '[Encrypted]';
        }
      }
    }

    return decryptedData;
  }

  /**
   * Update local preferences in storage
   */
  async updateLocalPreferences(preferences) {
    try {
      const existingPrefs = JSON.parse(localStorage.getItem('userPreferences') || '{}');
      const updatedPrefs = { ...existingPrefs, ...preferences };
      localStorage.setItem('userPreferences', JSON.stringify(updatedPrefs));
      
      // Dispatch event for other components to react
      window.dispatchEvent(new CustomEvent('preferencesUpdated', {
        detail: updatedPrefs
      }));
    } catch (error) {
      console.error('Error updating local preferences:', error);
    }
  }

  /**
   * Clear all user data from local storage
   */
  async clearAllUserData() {
    try {
      // Clear localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('smartfinance_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Clear IndexedDB
      const databases = ['transactions', 'accounts', 'goals', 'budgets'];
      for (const dbName of databases) {
        try {
          const deleteRequest = indexedDB.deleteDatabase(`smartfinance_${dbName}`);
          await new Promise((resolve, reject) => {
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
          });
        } catch (error) {
          console.warn(`Failed to delete database ${dbName}:`, error);
        }
      }

      // Clear memory cache
      this.cache.clear();

    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }

  /**
   * Check user permissions for specific actions
   */
  hasPermission(action, userRole = 'user') {
    const permissions = {
      'free': [
        'view_accounts', 'basic_transactions', 'basic_goals', 'basic_budgets'
      ],
      'premium': [
        'view_accounts', 'all_transactions', 'all_goals', 'all_budgets',
        'advanced_reports', 'investment_tracking', 'family_sharing'
      ],
      'professional': [
        'view_accounts', 'all_transactions', 'all_goals', 'all_budgets',
        'advanced_reports', 'investment_tracking', 'family_sharing',
        'business_features', 'api_access', 'white_label'
      ]
    };

    return permissions[userRole]?.includes(action) || false;
  }

  /**
   * Get user subscription status and limits
   */
  async getSubscriptionStatus() {
    try {
      const response = await apiRequest(`${this.baseUrl}/subscription/status`, {
        method: 'GET',
        requiresAuth: true
      });

      if (response.success) {
        return {
          tier: response.data.tier,
          status: response.data.status, // 'active', 'trial', 'expired', 'cancelled'
          expiresAt: response.data.expiresAt,
          trialEndsAt: response.data.trialEndsAt,
          limits: response.data.limits,
          usage: response.data.usage,
          features: response.data.features
        };
      }

      throw new Error(response.message || 'Failed to fetch subscription status');
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      throw handleApiError(error);
    }
  }
}

// Export singleton instance
export const userAPI = new UserAPI();
export default userAPI;