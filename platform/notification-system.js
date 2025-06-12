/**
 * SmartFinanceAI - Advanced Notification System
 * Comprehensive notification management with multi-channel delivery
 * Supports in-app, email, push, SMS with intelligent delivery optimization
 */

// Notification Types and Templates
export const NotificationTypes = {
  // Financial Alerts
  BUDGET_EXCEEDED: {
    id: 'budget_exceeded',
    name: 'Budget Exceeded',
    category: 'financial_alert',
    priority: 'high',
    channels: ['in_app', 'push', 'email'],
    template: {
      title: 'Budget Alert 🚨',
      message: 'You\'ve exceeded your {category} budget by {amount}',
      action: 'View Budget',
      icon: '💸'
    }
  },

  LOW_BALANCE: {
    id: 'low_balance',
    name: 'Low Account Balance',
    category: 'financial_alert',
    priority: 'critical',
    channels: ['in_app', 'push', 'email', 'sms'],
    template: {
      title: 'Low Balance Warning ⚠️',
      message: 'Your {account} balance is low: {balance}',
      action: 'View Account',
      icon: '🏦'
    }
  },

  GOAL_MILESTONE: {
    id: 'goal_milestone',
    name: 'Goal Milestone Reached',
    category: 'achievement',
    priority: 'medium',
    channels: ['in_app', 'push'],
    template: {
      title: 'Goal Milestone! 🎉',
      message: 'You\'ve reached {percentage}% of your {goal} goal!',
      action: 'View Goal',
      icon: '🎯'
    }
  },

  UNUSUAL_SPENDING: {
    id: 'unusual_spending',
    name: 'Unusual Spending Detected',
    category: 'security_alert',
    priority: 'high',
    channels: ['in_app', 'push', 'email'],
    template: {
      title: 'Unusual Activity 🔍',
      message: 'We detected unusual spending: {amount} at {merchant}',
      action: 'Review Transaction',
      icon: '🔒'
    }
  },

  // Goal and Progress
  GOAL_COMPLETED: {
    id: 'goal_completed',
    name: 'Goal Completed',
    category: 'achievement',
    priority: 'high',
    channels: ['in_app', 'push', 'email'],
    template: {
      title: 'Goal Achieved! 🏆',
      message: 'Congratulations! You\'ve completed your {goal} goal!',
      action: 'Celebrate',
      icon: '🎊'
    }
  },

  GOAL_OFF_TRACK: {
    id: 'goal_off_track',
    name: 'Goal Off Track',
    category: 'financial_alert',
    priority: 'medium',
    channels: ['in_app', 'push'],
    template: {
      title: 'Goal Update 📊',
      message: 'Your {goal} goal is {status}. Consider adjusting your strategy.',
      action: 'View Suggestions',
      icon: '📈'
    }
  },

  // AI Insights
  AI_INSIGHT: {
    id: 'ai_insight',
    name: 'AI Financial Insight',
    category: 'insight',
    priority: 'low',
    channels: ['in_app'],
    template: {
      title: 'Smart Insight 🤖',
      message: '{insight}',
      action: 'Learn More',
      icon: '💡'
    }
  },

  SAVING_OPPORTUNITY: {
    id: 'saving_opportunity',
    name: 'Saving Opportunity',
    category: 'optimization',
    priority: 'medium',
    channels: ['in_app', 'push'],
    template: {
      title: 'Save Money 💰',
      message: 'You could save {amount} by {suggestion}',
      action: 'See Details',
      icon: '💡'
    }
  },

  // Subscription and Billing
  TRIAL_ENDING: {
    id: 'trial_ending',
    name: 'Trial Ending Soon',
    category: 'subscription',
    priority: 'high',
    channels: ['in_app', 'email'],
    template: {
      title: 'Trial Ending Soon ⏰',
      message: 'Your {tier} trial ends in {days} days',
      action: 'Upgrade Now',
      icon: '⭐'
    }
  },

  PAYMENT_FAILED: {
    id: 'payment_failed',
    name: 'Payment Failed',
    category: 'billing',
    priority: 'critical',
    channels: ['in_app', 'email'],
    template: {
      title: 'Payment Issue 💳',
      message: 'We couldn\'t process your payment. Please update your payment method.',
      action: 'Update Payment',
      icon: '⚠️'
    }
  },

  // Security
  LOGIN_NEW_DEVICE: {
    id: 'login_new_device',
    name: 'New Device Login',
    category: 'security',
    priority: 'medium',
    channels: ['email', 'sms'],
    template: {
      title: 'New Device Login 🔐',
      message: 'Someone signed in to your account from {device} in {location}',
      action: 'Review Activity',
      icon: '🔒'
    }
  },

  // System Updates
  FEATURE_UPDATE: {
    id: 'feature_update',
    name: 'New Feature Available',
    category: 'update',
    priority: 'low',
    channels: ['in_app'],
    template: {
      title: 'New Feature! ✨',
      message: '{feature} is now available! {description}',
      action: 'Try It Now',
      icon: '🚀'
    }
  }
};

// Notification Channels Configuration
export const NotificationChannels = {
  IN_APP: {
    id: 'in_app',
    name: 'In-App Notifications',
    description: 'Notifications shown within the application',
    realTime: true,
    persistent: true,
    supportsBatching: false
  },

  PUSH: {
    id: 'push',
    name: 'Push Notifications',
    description: 'Browser/mobile push notifications',
    realTime: true,
    persistent: false,
    supportsBatching: true,
    requiresPermission: true
  },

  EMAIL: {
    id: 'email',
    name: 'Email Notifications',
    description: 'Email notifications to user\'s registered email',
    realTime: false,
    persistent: true,
    supportsBatching: true,
    deliveryDelay: 300000 // 5 minutes
  },

  SMS: {
    id: 'sms',
    name: 'SMS Notifications',
    description: 'Text messages for critical alerts',
    realTime: true,
    persistent: false,
    supportsBatching: false,
    requiresPhoneNumber: true,
    costPerMessage: 0.05
  }
};

// User Notification Preferences
export const DefaultNotificationPreferences = {
  channels: {
    in_app: { enabled: true, quietHours: null },
    push: { enabled: true, quietHours: { start: '22:00', end: '07:00' } },
    email: { enabled: true, frequency: 'immediate', quietHours: null },
    sms: { enabled: false, criticalOnly: true, quietHours: { start: '22:00', end: '07:00' } }
  },
  categories: {
    financial_alert: { enabled: true, priority: 'high' },
    achievement: { enabled: true, priority: 'medium' },
    security_alert: { enabled: true, priority: 'critical' },
    insight: { enabled: true, priority: 'low' },
    optimization: { enabled: true, priority: 'medium' },
    subscription: { enabled: true, priority: 'high' },
    billing: { enabled: true, priority: 'critical' },
    security: { enabled: true, priority: 'high' },
    update: { enabled: false, priority: 'low' }
  },
  digest: {
    enabled: true,
    frequency: 'weekly', // daily, weekly, monthly
    day: 'monday',
    time: '09:00'
  }
};

// Notification Manager Class
export class NotificationManager {
  constructor() {
    this.notifications = new Map(); // userId -> notifications[]
    this.preferences = new Map(); // userId -> preferences
    this.deliveryQueue = [];
    this.deliveryHistory = new Map();
    this.subscriptions = new Map(); // Push notification subscriptions
    this.templates = new Map();
    
    this.initializeTemplates();
    this.startDeliveryProcessor();
  }

  // Initialize notification templates
  initializeTemplates() {
    Object.entries(NotificationTypes).forEach(([key, notificationType]) => {
      this.templates.set(notificationType.id, notificationType);
    });
  }

  // Create and queue notification
  async createNotification(userId, typeId, data = {}, options = {}) {
    const notificationType = this.templates.get(typeId);
    if (!notificationType) {
      throw new Error(`Unknown notification type: ${typeId}`);
    }

    const notification = {
      id: this.generateNotificationId(),
      userId,
      type: typeId,
      typeConfig: notificationType,
      data,
      status: 'pending',
      createdAt: new Date().toISOString(),
      scheduledFor: options.scheduledFor || new Date().toISOString(),
      priority: options.priority || notificationType.priority,
      channels: options.channels || notificationType.channels,
      metadata: {
        source: options.source || 'system',
        campaign: options.campaign,
        tags: options.tags || []
      }
    };

    // Add to user's notifications
    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }
    this.notifications.get(userId).push(notification);

    // Queue for delivery
    await this.queueNotification(notification);

    return notification;
  }

  // Queue notification for delivery
  async queueNotification(notification) {
    const userPreferences = this.getUserPreferences(notification.userId);
    const deliveryPlan = this.createDeliveryPlan(notification, userPreferences);

    if (deliveryPlan.length === 0) {
      notification.status = 'filtered';
      return;
    }

    // Add to delivery queue
    deliveryPlan.forEach(delivery => {
      this.deliveryQueue.push({
        notificationId: notification.id,
        userId: notification.userId,
        channel: delivery.channel,
        scheduledFor: delivery.scheduledFor,
        priority: notification.priority,
        retries: 0,
        maxRetries: 3
      });
    });

    notification.status = 'queued';
  }

  // Create delivery plan based on user preferences
  createDeliveryPlan(notification, preferences) {
    const plan = [];
    const now = new Date();

    notification.channels.forEach(channel => {
      const channelPrefs = preferences.channels[channel];
      const categoryPrefs = preferences.categories[notification.typeConfig.category];

      // Check if channel is enabled
      if (!channelPrefs?.enabled || !categoryPrefs?.enabled) {
        return;
      }

      // Check quiet hours
      const scheduledTime = this.calculateDeliveryTime(channel, channelPrefs.quietHours, now);

      // Check priority filtering
      if (this.shouldFilterByPriority(notification.priority, categoryPrefs.priority)) {
        return;
      }

      plan.push({
        channel,
        scheduledFor: scheduledTime.toISOString(),
        immediate: scheduledTime <= now
      });
    });

    return plan;
  }

  // Calculate delivery time considering quiet hours
  calculateDeliveryTime(channel, quietHours, baseTime) {
    if (!quietHours) return baseTime;

    const channelConfig = NotificationChannels[channel.toUpperCase()];
    if (channelConfig?.deliveryDelay) {
      baseTime = new Date(baseTime.getTime() + channelConfig.deliveryDelay);
    }

    // Check if current time is in quiet hours
    const currentHour = baseTime.getHours();
    const currentMinute = baseTime.getMinutes();
    const currentTime = currentHour + (currentMinute / 60);

    const startTime = this.parseTime(quietHours.start);
    const endTime = this.parseTime(quietHours.end);

    let isQuietTime = false;
    if (startTime < endTime) {
      // Same day quiet hours (e.g., 22:00 - 07:00 next day)
      isQuietTime = currentTime >= startTime || currentTime < endTime;
    } else {
      // Cross-day quiet hours (e.g., 14:00 - 16:00)
      isQuietTime = currentTime >= startTime && currentTime < endTime;
    }

    if (isQuietTime) {
      // Schedule for end of quiet hours
      const deliveryDate = new Date(baseTime);
      deliveryDate.setHours(Math.floor(endTime), (endTime % 1) * 60, 0, 0);
      
      // If end time is the next day
      if (endTime < startTime && currentTime >= startTime) {
        deliveryDate.setDate(deliveryDate.getDate() + 1);
      }
      
      return deliveryDate;
    }

    return baseTime;
  }

  // Parse time string (HH:MM) to decimal hours
  parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours + (minutes / 60);
  }

  // Check if notification should be filtered by priority
  shouldFilterByPriority(notificationPriority, userMinPriority) {
    const priorityLevels = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
    return priorityLevels[notificationPriority] < priorityLevels[userMinPriority];
  }

  // Process delivery queue
  async processDeliveryQueue() {
    const now = new Date();
    const readyDeliveries = this.deliveryQueue.filter(delivery => 
      new Date(delivery.scheduledFor) <= now
    );

    for (const delivery of readyDeliveries) {
      try {
        await this.deliverNotification(delivery);
        this.removeFromQueue(delivery);
      } catch (error) {
        await this.handleDeliveryError(delivery, error);
      }
    }
  }

  // Deliver notification through specified channel
  async deliverNotification(delivery) {
    const notification = this.getNotificationById(delivery.userId, delivery.notificationId);
    if (!notification) return;

    const renderedContent = this.renderNotification(notification);

    switch