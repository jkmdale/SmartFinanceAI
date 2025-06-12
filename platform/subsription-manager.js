/**
 * SmartFinanceAI - Subscription Management System
 * Billing and subscription management for production launch
 * 
 * Features:
 * - Multi-tier subscription management (Free, Premium, Professional)
 * - Payment processing integration (Stripe ready)
 * - Usage tracking and billing cycles
 * - Upgrade/downgrade flows
 * - Invoice generation and management
 * - Trial period management
 * - Family/team account billing
 */

import { SecurityUtils } from '../utils/security-utils.js';
import ExternalAPIs from '../api/external-apis.js';
import PlatformAnalytics from './analytics.js';

class SubscriptionManager {
  constructor() {
    this.subscriptionTiers = {
      free: {
        name: 'SmartFinance Essentials',
        price: 0,
        currency: 'USD',
        interval: 'month',
        features: {
          accounts: 3,
          goals: 3,
          budgetCategories: 10,
          csvImports: 'manual',
          aiInsights: 'basic',
          reports: 'basic',
          support: 'community',
          familyAccounts: 0,
          dataRetention: '1 year'
        },
        limits: {
          monthlyTransactions: 500,
          apiCalls: 100,
          fileUploads: 5,
          exportReports: 2
        }
      },
      premium: {
        name: 'SmartFinance Pro',
        price: 9.99,
        currency: 'USD',
        interval: 'month',
        features: {
          accounts: 'unlimited',
          goals: 'unlimited',
          budgetCategories: 'unlimited',
          csvImports: 'automated',
          aiInsights: 'advanced',
          reports: 'comprehensive',
          support: 'email',
          familyAccounts: 2,
          dataRetention: 'unlimited',
          prioritySupport: true,
          advancedBudgeting: true,
          investmentTracking: true,
          multiCurrency: true
        },
        limits: {
          monthlyTransactions: 'unlimited',
          apiCalls: 10000,
          fileUploads: 100,
          exportReports: 'unlimited'
        }
      },
      professional: {
        name: 'SmartFinance Business',
        price: 19.99,
        currency: 'USD',
        interval: 'month',
        features: {
          accounts: 'unlimited',
          goals: 'unlimited',
          budgetCategories: 'unlimited',
          csvImports: 'automated',
          aiInsights: 'premium',
          reports: 'enterprise',
          support: 'priority',
          familyAccounts: 10,
          dataRetention: 'unlimited',
          businessFeatures: true,
          taxOptimization: true,
          apiAccess: true,
          whiteLabel: true,
          accountManager: true
        },
        limits: {
          monthlyTransactions: 'unlimited',
          apiCalls: 'unlimited',
          fileUploads: 'unlimited',
          exportReports: 'unlimited'
        }
      }
    };

    this.currentSubscription = null;
    this.usageTracking = new Map();
    this.billingHistory = [];
    
    this.loadSubscriptionData();
  }

  /**
   * Subscription Lifecycle Management
   */
  async createSubscription(userId, tier, paymentMethod, billingInfo) {
    try {
      // Validate tier
      if (!this.subscriptionTiers[tier]) {
        throw new Error(`Invalid subscription tier: ${tier}`);
      }

      const subscription = {
        id: SecurityUtils.generateRandomId(24),
        userId: SecurityUtils.hashUserId(userId),
        tier: tier,
        status: 'active',
        createdAt: Date.now(),
        currentPeriodStart: Date.now(),
        currentPeriodEnd: this.calculatePeriodEnd(Date.now(), tier),
        paymentMethod: this.sanitizePaymentMethod(paymentMethod),
        billingInfo: this.sanitizeBillingInfo(billingInfo),
        trialEndsAt: tier !== 'free' ? Date.now() + (14 * 24 * 60 * 60 * 1000) : null, // 14-day trial
        cancelAtPeriodEnd: false,
        metadata: {
          createdBy: 'web_app',
          version: '1.0.0',
          country: billingInfo.country || 'US'
        }
      };

      // Create payment intent for paid tiers
      if (tier !== 'free') {
        const paymentIntent = await this.createPaymentIntent(subscription);
        subscription.paymentIntentId = paymentIntent.id;
      }

      // Store subscription
      this.currentSubscription = subscription;
      this.saveSubscriptionData();

      // Initialize usage tracking
      this.initializeUsageTracking(subscription);

      // Track analytics
      PlatformAnalytics.trackEvent('subscription_created', {
        tier: tier,
        trialPeriod: subscription.trialEndsAt ? true : false,
        country: billingInfo.country
      });

      // Send welcome email
      await this.sendWelcomeEmail(subscription);

      return subscription;
    } catch (error) {
      console.error('Subscription creation failed:', error);
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  async upgradeSubscription(newTier, immediate = false) {
    if (!this.currentSubscription) {
      throw new Error('No active subscription found');
    }

    const currentTier = this.currentSubscription.tier;
    const tierHierarchy = ['free', 'premium', 'professional'];
    
    if (tierHierarchy.indexOf(newTier) <= tierHierarchy.indexOf(currentTier)) {
      throw new Error('Cannot upgrade to a lower or same tier');
    }

    try {
      const oldSubscription = { ...this.currentSubscription };
      
      // Calculate prorated amount
      const proratedAmount = this.calculateProratedAmount(currentTier, newTier, immediate);
      
      // Create payment intent for upgrade
      if (newTier !== 'free' && proratedAmount > 0) {
        const paymentIntent = await this.createUpgradePaymentIntent(proratedAmount, newTier);
        this.currentSubscription.paymentIntentId = paymentIntent.id;
      }

      // Update subscription
      this.currentSubscription.tier = newTier;
      this.currentSubscription.updatedAt = Date.now();
      
      if (immediate) {
        this.currentSubscription.currentPeriodStart = Date.now();
        this.currentSubscription.currentPeriodEnd = this.calculatePeriodEnd(Date.now(), newTier);
      }

      // Update usage limits
      this.updateUsageLimits(newTier);
      
      // Save changes
      this.saveSubscriptionData();

      // Track upgrade
      PlatformAnalytics.trackEvent('subscription_upgraded', {
        fromTier: currentTier,
        toTier: newTier,
        immediate: immediate,
        proratedAmount: proratedAmount
      });

      // Send upgrade confirmation
      await this.sendUpgradeConfirmation(oldSubscription, this.currentSubscription);

      return this.currentSubscription;
    } catch (error) {
      console.error('Subscription upgrade failed:', error);
      throw new Error(`Failed to upgrade subscription: ${error.message}`);
    }
  }

  async downgradeSubscription(newTier, atPeriodEnd = true) {
    if (!this.currentSubscription) {
      throw new Error('No active subscription found');
    }

    const currentTier = this.currentSubscription.tier;
    
    try {
      if (atPeriodEnd) {
        // Schedule downgrade at period end
        this.currentSubscription.scheduledTierChange = {
          newTier: newTier,
          effectiveDate: this.currentSubscription.currentPeriodEnd,
          reason: 'user_requested'
        };
      } else {
        // Immediate downgrade
        this.currentSubscription.tier = newTier;
        this.currentSubscription.currentPeriodStart = Date.now();
        this.currentSubscription.currentPeriodEnd = this.calculatePeriodEnd(Date.now(), newTier);
        this.updateUsageLimits(newTier);
      }

      this.currentSubscription.updatedAt = Date.now();
      this.saveSubscriptionData();

      // Track downgrade
      PlatformAnalytics.trackEvent('subscription_downgraded', {
        fromTier: currentTier,
        toTier: newTier,
        immediate: !atPeriodEnd
      });

      return this.currentSubscription;
    } catch (error) {
      console.error('Subscription downgrade failed:', error);
      throw new Error(`Failed to downgrade subscription: ${error.message}`);
    }
  }

  async cancelSubscription(reason = 'user_requested', immediate = false) {
    if (!this.currentSubscription) {
      throw new Error('No active subscription found');
    }

    try {
      const subscription = this.currentSubscription;
      
      if (immediate || subscription.tier === 'free') {
        // Immediate cancellation
        subscription.status = 'cancelled';
        subscription.cancelledAt = Date.now();
        subscription.tier = 'free';
        this.updateUsageLimits('free');
      } else {
        // Cancel at period end
        subscription.cancelAtPeriodEnd = true;
        subscription.cancellationReason = reason;
        subscription.willCancelAt = subscription.currentPeriodEnd;
      }

      subscription.updatedAt = Date.now();
      this.saveSubscriptionData();

      // Track cancellation
      PlatformAnalytics.trackEvent('subscription_cancelled', {
        tier: subscription.tier,
        reason: reason,
        immediate: immediate,
        daysSubscribed: Math.floor((Date.now() - subscription.createdAt) / (1000 * 60 * 60 * 24))
      });

      // Send cancellation confirmation
      await this.sendCancellationConfirmation(subscription, reason);

      return subscription;
    } catch (error) {
      console.error('Subscription cancellation failed:', error);
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  /**
   * Usage Tracking and Limits
   */
  initializeUsageTracking(subscription) {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    
    this.usageTracking.set(subscription.userId, {
      month: currentMonth,
      transactions: 0,
      apiCalls: 0,
      fileUploads: 0,
      exportReports: 0,
      lastReset: Date.now()
    });
  }

  trackUsage(userId, usageType, amount = 1) {
    const hashedUserId = SecurityUtils.hashUserId(userId);
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    let usage = this.usageTracking.get(hashedUserId);
    
    // Reset usage if it's a new month
    if (!usage || usage.month !== currentMonth) {
      usage = {
        month: currentMonth,
        transactions: 0,
        apiCalls: 0,
        fileUploads: 0,
        exportReports: 0,
        lastReset: Date.now()
      };
    }

    // Update usage
    usage[usageType] = (usage[usageType] || 0) + amount;
    usage.lastUpdated = Date.now();
    
    this.usageTracking.set(hashedUserId, usage);
    this.saveUsageData();

    // Check if limit exceeded
    this.checkUsageLimits(hashedUserId, usageType, usage[usageType]);
  }

  checkUsageLimits(userId, usageType, currentUsage) {
    if (!this.currentSubscription) return true;

    const limits = this.subscriptionTiers[this.currentSubscription.tier].limits;
    const limit = limits[usageType];

    if (limit === 'unlimited') return true;
    if (typeof limit === 'number' && currentUsage > limit) {
      // Send usage limit notification
      this.sendUsageLimitNotification(userId, usageType, currentUsage, limit);
      return false;
    }

    // Send warning at 80% usage
    if (typeof limit === 'number' && currentUsage >= limit * 0.8) {
      this.sendUsageWarningNotification(userId, usageType, currentUsage, limit);
    }

    return true;
  }

  getRemainingUsage(userId, usageType) {
    if (!this.currentSubscription) return 0;

    const limits = this.subscriptionTiers[this.currentSubscription.tier].limits;
    const limit = limits[usageType];

    if (limit === 'unlimited') return Infinity;

    const hashedUserId = SecurityUtils.hashUserId(userId);
    const usage = this.usageTracking.get(hashedUserId);
    const currentUsage = usage ? usage[usageType] || 0 : 0;

    return Math.max(0, limit - currentUsage);
  }

  /**
   * Payment Processing
   */
  async createPaymentIntent(subscription) {
    const tierInfo = this.subscriptionTiers[subscription.tier];
    
    return await ExternalAPIs.createPaymentIntent(
      tierInfo.price,
      tierInfo.currency,
      {
        subscriptionId: subscription.id,
        userId: subscription.userId,
        tier: subscription.tier
      }
    );
  }

  async createUpgradePaymentIntent(amount, newTier) {
    return await ExternalAPIs.createPaymentIntent(
      amount,
      this.subscriptionTiers[newTier].currency,
      {
        type: 'upgrade',
        newTier: newTier,
        subscriptionId: this.currentSubscription.id
      }
    );
  }

  calculateProratedAmount(currentTier, newTier, immediate) {
    if (!immediate) return this.subscriptionTiers[newTier].price;

    const currentPrice = this.subscriptionTiers[currentTier].price;
    const newPrice = this.subscriptionTiers[newTier].price;
    
    const remainingDays = Math.ceil(
      (this.currentSubscription.currentPeriodEnd - Date.now()) / (1000 * 60 * 60 * 24)
    );
    const totalDays = 30; // Assuming monthly billing
    
    const refund = (currentPrice * remainingDays) / totalDays;
    const newCharge = newPrice;
    
    return Math.max(0, newCharge - refund);
  }

  /**
   * Billing and Invoicing
   */
  generateInvoice(subscription, charges = []) {
    const invoice = {
      id: SecurityUtils.generateRandomId(16),
      subscriptionId: subscription.id,
      userId: subscription.userId,
      number: this.generateInvoiceNumber(),
      status: 'draft',
      createdAt: Date.now(),
      dueAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
      currency: this.subscriptionTiers[subscription.tier].currency,
      items: [
        {
          description: `${this.subscriptionTiers[subscription.tier].name} - Monthly Subscription`,
          amount: this.subscriptionTiers[subscription.tier].price,
          quantity: 1,
          periodStart: subscription.currentPeriodStart,
          periodEnd: subscription.currentPeriodEnd
        },
        ...charges
      ],
      subtotal: 0,
      tax: 0,
      total: 0,
      paidAt: null
    };

    // Calculate totals
    invoice.subtotal = invoice.items.reduce((sum, item) => sum + (item.amount * item.quantity), 0);
    invoice.tax = this.calculateTax(invoice.subtotal, subscription.billingInfo);
    invoice.total = invoice.subtotal + invoice.tax;

    this.billingHistory.push(invoice);
    this.saveSubscriptionData();

    return invoice;
  }

  async processPayment(invoiceId, paymentMethod) {
    const invoice = this.billingHistory.find(inv => inv.id === invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    try {
      // Process payment through payment processor
      const paymentResult = await this.processInvoicePayment(invoice, paymentMethod);
      
      if (paymentResult.success) {
        invoice.status = 'paid';
        invoice.paidAt = Date.now();
        invoice.paymentId = paymentResult.paymentId;

        // Extend subscription period
        if (this.currentSubscription) {
          this.extendSubscriptionPeriod();
        }

        // Track successful payment
        PlatformAnalytics.trackEvent('payment_processed', {
          invoiceId: invoiceId,
          amount: invoice.total,
          tier: this.currentSubscription?.tier
        });

        await this.sendPaymentConfirmation(invoice);
      } else {
        invoice.status = 'payment_failed';
        await this.sendPaymentFailureNotification(invoice, paymentResult.error);
      }

      this.saveSubscriptionData();
      return paymentResult;
    } catch (error) {
      console.error('Payment processing failed:', error);
      throw new Error(`Payment failed: ${error.message}`);
    }
  }

  /**
   * Trial Management
   */
  startTrial(userId, tier, trialDays = 14) {
    if (this.currentSubscription && this.currentSubscription.trialEndsAt) {
      throw new Error('User has already used their trial period');
    }

    const trialSubscription = {
      id: SecurityUtils.generateRandomId(24),
      userId: SecurityUtils.hashUserId(userId),
      tier: tier,
      status: 'trialing',
      createdAt: Date.now(),
      trialStartedAt: Date.now(),
      trialEndsAt: Date.now() + (trialDays * 24 * 60 * 60 * 1000),
      currentPeriodStart: Date.now(),
      currentPeriodEnd: Date.now() + (trialDays * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      metadata: {
        trialDays: trialDays,
        createdBy: 'trial_signup'
      }
    };

    this.currentSubscription = trialSubscription;
    this.initializeUsageTracking(trialSubscription);
    this.saveSubscriptionData();

    // Track trial start
    PlatformAnalytics.trackEvent('trial_started', {
      tier: tier,
      trialDays: trialDays,
      userId: SecurityUtils.hashUserId(userId)
    });

    // Schedule trial end reminder
    this.scheduleTrialReminders(trialSubscription);

    return trialSubscription;
  }

  checkTrialStatus() {
    if (!this.currentSubscription || this.currentSubscription.status !== 'trialing') {
      return null;
    }

    const now = Date.now();
    const trialEndsAt = this.currentSubscription.trialEndsAt;
    const daysRemaining = Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24));

    if (now >= trialEndsAt) {
      // Trial has ended
      this.endTrial();
      return { status: 'expired', daysRemaining: 0 };
    }

    return {
      status: 'active',
      daysRemaining: daysRemaining,
      trialEndsAt: trialEndsAt
    };
  }

  endTrial() {
    if (!this.currentSubscription || this.currentSubscription.status !== 'trialing') {
      return;
    }

    // Downgrade to free tier
    this.currentSubscription.tier = 'free';
    this.currentSubscription.status = 'active';
    this.currentSubscription.trialEndedAt = Date.now();
    this.updateUsageLimits('free');

    // Track trial end
    PlatformAnalytics.trackEvent('trial_ended', {
      converted: false,
      trialDuration: Date.now() - this.currentSubscription.trialStartedAt
    });

    this.saveSubscriptionData();
  }

  async convertTrialToSubscription(paymentMethod, billingInfo) {
    if (!this.currentSubscription || this.currentSubscription.status !== 'trialing') {
      throw new Error('No active trial found');
    }

    try {
      const tier = this.currentSubscription.tier;
      
      // Create payment intent
      const paymentIntent = await this.createPaymentIntent(this.currentSubscription);
      
      // Update subscription
      this.currentSubscription.status = 'active';
      this.currentSubscription.paymentMethod = this.sanitizePaymentMethod(paymentMethod);
      this.currentSubscription.billingInfo = this.sanitizeBillingInfo(billingInfo);
      this.currentSubscription.paymentIntentId = paymentIntent.id;
      this.currentSubscription.convertedAt = Date.now();
      this.currentSubscription.currentPeriodEnd = this.calculatePeriodEnd(Date.now(), tier);

      this.saveSubscriptionData();

      // Track conversion
      PlatformAnalytics.trackEvent('trial_converted', {
        tier: tier,
        trialDuration: Date.now() - this.currentSubscription.trialStartedAt,
        conversionValue: this.subscriptionTiers[tier].price
      });

      await this.sendTrialConversionConfirmation(this.currentSubscription);

      return this.currentSubscription;
    } catch (error) {
      console.error('Trial conversion failed:', error);
      throw new Error(`Failed to convert trial: ${error.message}`);
    }
  }

  /**
   * Family and Team Management
   */
  addFamilyMember(memberEmail, role = 'member') {
    if (!this.currentSubscription) {
      throw new Error('No active subscription found');
    }

    const tierInfo = this.subscriptionTiers[this.currentSubscription.tier];
    const maxFamilyAccounts = tierInfo.features.familyAccounts;

    if (maxFamilyAccounts === 0) {
      throw new Error('Family accounts not available on current tier');
    }

    const currentMembers = this.currentSubscription.familyMembers || [];
    if (currentMembers.length >= maxFamilyAccounts) {
      throw new Error(`Maximum ${maxFamilyAccounts} family members allowed`);
    }

    const familyMember = {
      id: SecurityUtils.generateRandomId(16),
      email: memberEmail,
      role: role, // 'admin', 'member', 'child'
      invitedAt: Date.now(),
      status: 'invited',
      permissions: this.getFamilyMemberPermissions(role)
    };

    this.currentSubscription.familyMembers = [...currentMembers, familyMember];
    this.saveSubscriptionData();

    // Send invitation email
    this.sendFamilyInvitation(familyMember);

    // Track family member addition
    PlatformAnalytics.trackEvent('family_member_added', {
      role: role,
      totalMembers: this.currentSubscription.familyMembers.length
    });

    return familyMember;
  }

  acceptFamilyInvitation(invitationId, userId) {
    if (!this.currentSubscription || !this.currentSubscription.familyMembers) {
      throw new Error('No family invitation found');
    }

    const member = this.currentSubscription.familyMembers.find(m => m.id === invitationId);
    if (!member) {
      throw new Error('Invalid invitation');
    }

    member.status = 'active';
    member.userId = SecurityUtils.hashUserId(userId);
    member.acceptedAt = Date.now();

    this.saveSubscriptionData();

    // Track invitation acceptance
    PlatformAnalytics.trackEvent('family_invitation_accepted', {
      role: member.role,
      invitationAge: Date.now() - member.invitedAt
    });

    return member;
  }

  /**
   * Feature Access Control
   */
  hasFeatureAccess(feature) {
    if (!this.currentSubscription) {
      return this.subscriptionTiers.free.features[feature] || false;
    }

    const tierFeatures = this.subscriptionTiers[this.currentSubscription.tier].features;
    return tierFeatures[feature] || false;
  }

  checkUsageLimit(userId, usageType) {
    const remaining = this.getRemainingUsage(userId, usageType);
    
    if (remaining === Infinity) {
      return { allowed: true, unlimited: true };
    }

    if (remaining <= 0) {
      return {
        allowed: false,
        unlimited: false,
        remaining: 0,
        upgradeRequired: true,
        suggestedTier: this.getSuggestedUpgradeTier()
      };
    }

    return {
      allowed: true,
      unlimited: false,
      remaining: remaining,
      warningThreshold: remaining <= 10
    };
  }

  getSuggestedUpgradeTier() {
    if (!this.currentSubscription) return 'premium';
    
    const currentTier = this.currentSubscription.tier;
    const tierOrder = ['free', 'premium', 'professional'];
    const currentIndex = tierOrder.indexOf(currentTier);
    
    return tierOrder[currentIndex + 1] || 'professional';
  }

  /**
   * Billing Cycle Management
   */
  processRecurringBilling() {
    if (!this.currentSubscription || this.currentSubscription.status !== 'active') {
      return;
    }

    const now = Date.now();
    const periodEnd = this.currentSubscription.currentPeriodEnd;

    if (now >= periodEnd) {
      this.createRecurringInvoice();
    }

    // Check for scheduled tier changes
    if (this.currentSubscription.scheduledTierChange) {
      const change = this.currentSubscription.scheduledTierChange;
      if (now >= change.effectiveDate) {
        this.applyScheduledTierChange(change);
      }
    }
  }

  createRecurringInvoice() {
    const invoice = this.generateInvoice(this.currentSubscription);
    
    // Attempt auto-payment if payment method exists
    if (this.currentSubscription.paymentMethod) {
      this.processPayment(invoice.id, this.currentSubscription.paymentMethod)
        .catch(error => {
          console.error('Auto-payment failed:', error);
          this.sendPaymentFailureNotification(invoice, error.message);
        });
    }

    return invoice;
  }

  extendSubscriptionPeriod() {
    if (!this.currentSubscription) return;

    const tierInfo = this.subscriptionTiers[this.currentSubscription.tier];
    const interval = tierInfo.interval;
    
    let extensionMs;
    switch (interval) {
      case 'month':
        extensionMs = 30 * 24 * 60 * 60 * 1000;
        break;
      case 'year':
        extensionMs = 365 * 24 * 60 * 60 * 1000;
        break;
      default:
        extensionMs = 30 * 24 * 60 * 60 * 1000;
    }

    this.currentSubscription.currentPeriodStart = this.currentSubscription.currentPeriodEnd;
    this.currentSubscription.currentPeriodEnd += extensionMs;
    this.currentSubscription.updatedAt = Date.now();

    this.saveSubscriptionData();
  }

  /**
   * Notifications and Communications
   */
  async sendWelcomeEmail(subscription) {
    const emailData = {
      to: subscription.billingInfo?.email,
      template: 'subscription_welcome',
      data: {
        tier: subscription.tier,
        tierName: this.subscriptionTiers[subscription.tier].name,
        features: this.subscriptionTiers[subscription.tier].features,
        trialEndsAt: subscription.trialEndsAt
      }
    };

    await ExternalAPIs.sendEmail(emailData);
  }

  async sendUpgradeConfirmation(oldSubscription, newSubscription) {
    // Implementation for upgrade confirmation email
    console.log('Sending upgrade confirmation email');
  }

  async sendCancellationConfirmation(subscription, reason) {
    // Implementation for cancellation confirmation email
    console.log('Sending cancellation confirmation email');
  }

  async sendUsageLimitNotification(userId, usageType, currentUsage, limit) {
    PlatformAnalytics.trackEvent('usage_limit_exceeded', {
      usageType: usageType,
      currentUsage: currentUsage,
      limit: limit,
      tier: this.currentSubscription?.tier
    });
  }

  async sendUsageWarningNotification(userId, usageType, currentUsage, limit) {
    PlatformAnalytics.trackEvent('usage_warning', {
      usageType: usageType,
      currentUsage: currentUsage,
      limit: limit,
      percentageUsed: (currentUsage / limit) * 100
    });
  }

  scheduleTrialReminders(subscription) {
    const trialEnd = subscription.trialEndsAt;
    const reminderTimes = [
      trialEnd - (7 * 24 * 60 * 60 * 1000), // 7 days before
      trialEnd - (3 * 24 * 60 * 60 * 1000), // 3 days before
      trialEnd - (1 * 24 * 60 * 60 * 1000), // 1 day before
    ];

    reminderTimes.forEach((reminderTime, index) => {
      const delay = reminderTime - Date.now();
      if (delay > 0) {
        setTimeout(() => {
          this.sendTrialReminder(subscription, index);
        }, delay);
      }
    });
  }

  sendTrialReminder(subscription, reminderIndex) {
    const daysRemaining = [7, 3, 1][reminderIndex];
    
    PlatformAnalytics.trackEvent('trial_reminder_sent', {
      daysRemaining: daysRemaining,
      tier: subscription.tier
    });
  }

  /**
   * Utility Methods
   */
  calculatePeriodEnd(startTime, tier) {
    const interval = this.subscriptionTiers[tier].interval;
    
    switch (interval) {
      case 'month':
        return startTime + (30 * 24 * 60 * 60 * 1000);
      case 'year':
        return startTime + (365 * 24 * 60 * 60 * 1000);
      default:
        return startTime + (30 * 24 * 60 * 60 * 1000);
    }
  }

  calculateTax(subtotal, billingInfo) {
    // Simplified tax calculation - would need proper tax service in production
    const taxRates = {
      'US': 0.08, // Average US sales tax
      'CA': 0.13, // Average Canadian tax
      'GB': 0.20, // UK VAT
      'AU': 0.10, // Australian GST
      'NZ': 0.15  // New Zealand GST
    };

    const taxRate = taxRates[billingInfo?.country] || 0;
    return subtotal * taxRate;
  }

  generateInvoiceNumber() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `INV-${timestamp.slice(-8)}-${random}`;
  }

  sanitizePaymentMethod(paymentMethod) {
    return {
      type: paymentMethod.type,
      last4: paymentMethod.last4,
      brand: paymentMethod.brand,
      expiryMonth: paymentMethod.expiryMonth,
      expiryYear: paymentMethod.expiryYear
    };
  }

  sanitizeBillingInfo(billingInfo) {
    return {
      name: billingInfo.name,
      email: billingInfo.email,
      address: billingInfo.address,
      city: billingInfo.city,
      state: billingInfo.state,
      postalCode: billingInfo.postalCode,
      country: billingInfo.country
    };
  }

  updateUsageLimits(tier) {
    // Reset usage tracking to new tier limits
    const limits = this.subscriptionTiers[tier].limits;
    
    // Clear any cached limits
    this.usageTracking.forEach((usage, userId) => {
      usage.limits = limits;
      usage.lastLimitUpdate = Date.now();
    });
  }

  getFamilyMemberPermissions(role) {
    const permissions = {
      admin: ['view_all', 'edit_all', 'manage_members', 'billing'],
      member: ['view_own', 'edit_own', 'view_shared'],
      child: ['view_own', 'limited_edit']
    };

    return permissions[role] || permissions.member;
  }

  applyScheduledTierChange(change) {
    this.currentSubscription.tier = change.newTier;
    this.currentSubscription.tierChangedAt = Date.now();
    delete this.currentSubscription.scheduledTierChange;
    
    this.updateUsageLimits(change.newTier);
    this.saveSubscriptionData();

    PlatformAnalytics.trackEvent('scheduled_tier_change_applied', {
      newTier: change.newTier,
      reason: change.reason
    });
  }

  async processInvoicePayment(invoice, paymentMethod) {
    // Mock payment processing - integrate with actual payment processor
    return {
      success: true,
      paymentId: SecurityUtils.generateRandomId(16),
      transactionId: SecurityUtils.generateRandomId(24),
      processedAt: Date.now()
    };
  }

  async sendPaymentConfirmation(invoice) {
    PlatformAnalytics.trackEvent('payment_confirmation_sent', {
      invoiceId: invoice.id,
      amount: invoice.total
    });
  }

  async sendPaymentFailureNotification(invoice, error) {
    PlatformAnalytics.trackEvent('payment_failure_notification_sent', {
      invoiceId: invoice.id,
      amount: invoice.total,
      error: error
    });
  }

  async sendTrialConversionConfirmation(subscription) {
    PlatformAnalytics.trackEvent('trial_conversion_confirmation_sent', {
      tier: subscription.tier,
      userId: subscription.userId
    });
  }

  sendFamilyInvitation(familyMember) {
    PlatformAnalytics.trackEvent('family_invitation_sent', {
      role: familyMember.role,
      invitationId: familyMember.id
    });
  }

  /**
   * Data Persistence
   */
  saveSubscriptionData() {
    const data = {
      subscription: this.currentSubscription,
      billingHistory: this.billingHistory,
      lastUpdated: Date.now()
    };

    localStorage.setItem('subscription_data', JSON.stringify(data));
  }

  saveUsageData() {
    const usageData = Array.from(this.usageTracking.entries());
    localStorage.setItem('usage_tracking', JSON.stringify(usageData));
  }

  loadSubscriptionData() {
    try {
      const subscriptionData = localStorage.getItem('subscription_data');
      if (subscriptionData) {
        const data = JSON.parse(subscriptionData);
        this.currentSubscription = data.subscription;
        this.billingHistory = data.billingHistory || [];
      }

      const usageData = localStorage.getItem('usage_tracking');
      if (usageData) {
        const data = JSON.parse(usageData);
        this.usageTracking = new Map(data);
      }
    } catch (error) {
      console.warn('Failed to load subscription data:', error);
    }
  }

  /**
   * Public API Methods
   */
  getCurrentSubscription() {
    return this.currentSubscription;
  }

  getSubscriptionTiers() {
    return this.subscriptionTiers;
  }

  getBillingHistory() {
    return this.billingHistory;
  }

  getUsageStats(userId) {
    const hashedUserId = SecurityUtils.hashUserId(userId);
    return this.usageTracking.get(hashedUserId) || {};
  }

  isFeatureAvailable(feature) {
    return this.hasFeatureAccess(feature);
  }

  getSubscriptionStatus() {
    if (!this.currentSubscription) {
      return { status: 'none', tier: 'free' };
    }

    return {
      status: this.currentSubscription.status,
      tier: this.currentSubscription.tier,
      trialStatus: this.checkTrialStatus(),
      billingPeriod: {
        start: this.currentSubscription.currentPeriodStart,
        end: this.currentSubscription.currentPeriodEnd
      },
      cancelAtPeriodEnd: this.currentSubscription.cancelAtPeriodEnd,
      familyMembers: this.currentSubscription.familyMembers?.length || 0
    };
  }
}

// Singleton instance
const subscriptionManager = new SubscriptionManager();

export default subscriptionManager;