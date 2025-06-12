#!/usr/bin/env node

// SmartFinanceAI - Development Seed Data Generator
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, description) {
  log(`\n🌱 Step ${step}: ${description}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

class SeedDataGenerator {
  constructor() {
    this.outputPath = path.resolve(__dirname, '../src/data/seed-data.json');
    this.seed = 12345; // For reproducible random data
    this.random = this.seededRandom(this.seed);
    
    // Configuration
    this.userCount = 3;
    this.accountsPerUser = 3;
    this.transactionsPerAccount = 50;
    this.goalsPerUser = 3;
    this.monthsOfHistory = 6;
  }

  seededRandom(seed) {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % 2**32;
      return state / 2**32;
    };
  }

  randomChoice(array) {
    return array[Math.floor(this.random() * array.length)];
  }

  randomBetween(min, max) {
    return min + (this.random() * (max - min));
  }

  randomDate(daysBack) {
    const now = new Date();
    const pastDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    const randomTime = pastDate.getTime() + (this.random() * (now.getTime() - pastDate.getTime()));
    return new Date(randomTime);
  }

  generateId() {
    return crypto.randomBytes(16).toString('hex');
  }

  async run() {
    try {
      log('\n🌱 SmartFinanceAI Seed Data Generation Starting...', 'magenta');
      log('===================================================', 'cyan');
      log(`👥 Users: ${this.userCount}`, 'blue');
      log(`🏦 Accounts per user: ${this.accountsPerUser}`, 'blue');
      log(`💳 Transactions per account: ${this.transactionsPerAccount}`, 'blue');
      log(`🎯 Goals per user: ${this.goalsPerUser}`, 'blue');

      const seedData = await this.generateSeedData();
      await this.saveSeedData(seedData);
      await this.generateClientSeedLoader();
      
      this.showSummary(seedData);

    } catch (error) {
      logError(`Seed data generation failed: ${error.message}`);
      process.exit(1);
    }
  }

  async generateSeedData() {
    logStep(1, 'Generating Seed Data');

    const seedData = {
      metadata: {
        generated: new Date().toISOString(),
        version: '1.0.0',
        seed: this.seed,
        description: 'SmartFinanceAI development seed data'
      },
      users: [],
      accounts: [],
      transactions: [],
      goals: [],
      budgets: [],
      aiInsights: [],
      categories: this.getCategories(),
      merchants: this.getMerchants(),
      banks: this.getBanks()
    };

    // Generate users
    for (let i = 0; i < this.userCount; i++) {
      const user = this.generateUser(i);
      seedData.users.push(user);

      // Generate accounts for user
      const userAccounts = this.generateAccountsForUser(user);
      seedData.accounts.push(...userAccounts);

      // Generate transactions for each account
      for (const account of userAccounts) {
        const transactions = this.generateTransactionsForAccount(account, user);
        seedData.transactions.push(...transactions);
      }

      // Generate goals for user
      const goals = this.generateGoalsForUser(user);
      seedData.goals.push(...goals);

      // Generate budget for user
      const budget = this.generateBudgetForUser(user, seedData.transactions.filter(t => t.accountId && userAccounts.find(a => a.id === t.accountId)));
      seedData.budgets.push(budget);

      // Generate AI insights for user
      const insights = this.generateAIInsightsForUser(user);
      seedData.aiInsights.push(...insights);
    }

    logSuccess(`Generated complete seed data for ${this.userCount} users`);
    return seedData;
  }

  generateUser(index) {
    const users = [
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah@example.com',
        country: 'NZ',
        currency: 'NZD',
        subscription: 'premium'
      },
      {
        firstName: 'Michael',
        lastName: 'Chen',
        email: 'michael@example.com',
        country: 'AU',
        currency: 'AUD',
        subscription: 'free'
      },
      {
        firstName: 'Emma',
        lastName: 'Williams',
        email: 'emma@example.com',
        country: 'US',
        currency: 'USD',
        subscription: 'professional'
      }
    ];

    const userData = users[index] || users[0];

    return {
      id: this.generateId(),
      ...userData,
      createdAt: this.randomDate(365).toISOString(),
      lastLoginAt: this.randomDate(7).toISOString(),
      preferences: {
        theme: this.randomChoice(['light', 'dark']),
        currency: userData.currency,
        dateFormat: userData.country === 'US' ? 'MM/DD/YYYY' : 'DD/MM/YYYY',
        notifications: {
          email: true,
          push: this.random() > 0.5,
          budgetAlerts: true,
          goalReminders: true
        }
      },
      onboardingComplete: true,
      biometricEnabled: this.random() > 0.3
    };
  }

  generateAccountsForUser(user) {
    const accounts = [];
    const accountTypes = ['checking', 'savings', 'credit'];
    const banks = this.getBanksForCountry(user.country);

    for (let i = 0; i < this.accountsPerUser; i++) {
      const accountType = accountTypes[i] || this.randomChoice(accountTypes);
      const bank = this.randomChoice(banks);
      
      accounts.push({
        id: this.generateId(),
        userId: user.id,
        name: `${bank.name} ${accountType.charAt(0).toUpperCase() + accountType.slice(1)}`,
        type: accountType,
        bankName: bank.name,
        bankLogo: bank.logo,
        currency: user.currency,
        balance: this.generateBalanceForAccountType(accountType, user.currency),
        isActive: true,
        isJoint: this.random() > 0.8,
        createdAt: this.randomDate(730).toISOString(),
        lastSyncAt: this.randomDate(1).toISOString()
      });
    }

    return accounts;
  }

  generateBalanceForAccountType(type, currency) {
    const multiplier = currency === 'USD' ? 1 : (currency === 'NZD' ? 1.6 : currency === 'AUD' ? 1.5 : 0.8);
    
    switch (type) {
      case 'checking':
        return Math.round(this.randomBetween(500, 5000) * multiplier * 100) / 100;
      case 'savings':
        return Math.round(this.randomBetween(2000, 25000) * multiplier * 100) / 100;
      case 'credit':
        return -Math.round(this.randomBetween(0, 3000) * multiplier * 100) / 100;
      default:
        return Math.round(this.randomBetween(100, 10000) * multiplier * 100) / 100;
    }
  }

  generateTransactionsForAccount(account, user) {
    const transactions = [];
    const categories = this.getCategories();
    const merchants = this.getMerchants();

    for (let i = 0; i < this.transactionsPerAccount; i++) {
      const category = this.randomChoice(categories);
      const merchant = this.randomChoice(merchants.filter(m => m.category === category.id));
      const isIncome = this.random() < 0.1; // 10% chance of income
      const amount = this.generateTransactionAmount(category.id, isIncome, user.currency);

      transactions.push({
        id: this.generateId(),
        accountId: account.id,
        userId: user.id,
        amount: isIncome ? Math.abs(amount) : -Math.abs(amount),
        description: merchant ? merchant.name : `${category.name} Transaction`,
        merchant: merchant ? merchant.name : null,
        category: category.id,
        categoryName: category.name,
        date: this.randomDate(this.monthsOfHistory * 30).toISOString(),
        currency: account.currency,
        pending: this.random() < 0.05, // 5% pending
        verified: this.random() > 0.02, // 98% verified
        tags: this.generateTransactionTags(category.id),
        location: merchant ? merchant.location : null,
        notes: this.random() > 0.9 ? this.generateTransactionNote() : null,
        createdAt: new Date().toISOString()
      });
    }

    return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  generateTransactionAmount(category, isIncome, currency) {
    const multiplier = currency === 'USD' ? 1 : (currency === 'NZD' ? 1.6 : currency === 'AUD' ? 1.5 : 0.8);
    
    if (isIncome) {
      return Math.round(this.randomBetween(2000, 8000) * multiplier * 100) / 100; // Salary range
    }

    const amounts = {
      food: [15, 150],
      transportation: [5, 200],
      housing: [800, 2500],
      utilities: [50, 300],
      healthcare: [30, 500],
      entertainment: [10, 200],
      shopping: [20, 500],
      personal: [10, 100],
      education: [50, 1000],
      debt: [100, 1000],
      other: [5, 200]
    };

    const range = amounts[category] || amounts.other;
    return Math.round(this.randomBetween(range[0], range[1]) * multiplier * 100) / 100;
  }

  generateTransactionTags(category) {
    const tagOptions = {
      food: ['restaurant', 'groceries', 'takeout', 'coffee'],
      transportation: ['gas', 'public-transport', 'uber', 'parking'],
      entertainment: ['movies', 'concerts', 'games', 'books'],
      shopping: ['clothes', 'electronics', 'home', 'gifts'],
      healthcare: ['doctor', 'pharmacy', 'dental', 'insurance']
    };

    const categoryTags = tagOptions[category] || [];
    const numTags = Math.floor(this.random() * 3);
    const selectedTags = [];

    for (let i = 0; i < numTags; i++) {
      const tag = this.randomChoice(categoryTags);
      if (!selectedTags.includes(tag)) {
        selectedTags.push(tag);
      }
    }

    return selectedTags;
  }

  generateTransactionNote() {
    const notes = [
      'Business expense',
      'Split with roommate',
      'Birthday gift',
      'Emergency repair',
      'Monthly subscription',
      'One-time purchase',
      'Refund expected',
      'Holiday expense'
    ];
    return this.randomChoice(notes);
  }

  generateGoalsForUser(user) {
    const goalTemplates = [
      {
        name: 'Emergency Fund',
        description: 'Build emergency savings fund',
        category: 'emergency',
        targetAmount: 10000,
        priority: 'critical',
        icon: '🚨'
      },
      {
        name: 'House Deposit',
        description: 'Save for house down payment',
        category: 'savings',
        targetAmount: 50000,
        priority: 'high',
        icon: '🏠'
      },
      {
        name: 'Vacation Fund',
        description: 'European vacation savings',
        category: 'travel',
        targetAmount: 8000,
        priority: 'medium',
        icon: '✈️'
      },
      {
        name: 'Car Replacement',
        description: 'Save for new car',
        category: 'transportation',
        targetAmount: 25000,
        priority: 'medium',
        icon: '🚗'
      },
      {
        name: 'Retirement Boost',
        description: 'Extra retirement savings',
        category: 'retirement',
        targetAmount: 100000,
        priority: 'low',
        icon: '🏖️'
      }
    ];

    const goals = [];
    const selectedTemplates = goalTemplates.slice(0, this.goalsPerUser);

    for (const template of selectedTemplates) {
      const multiplier = user.currency === 'USD' ? 1 : (user.currency === 'NZD' ? 1.6 : user.currency === 'AUD' ? 1.5 : 0.8);
      const targetAmount = Math.round(template.targetAmount * multiplier);
      const currentAmount = Math.round(targetAmount * this.randomBetween(0, 0.7)); // 0-70% progress
      const monthlyContribution = Math.round(targetAmount * this.randomBetween(0.02, 0.1)); // 2-10% per month
      
      goals.push({
        id: this.generateId(),
        userId: user.id,
        name: template.name,
        description: template.description,
        category: template.category,
        targetAmount: targetAmount,
        currentAmount: currentAmount,
        monthlyContribution: monthlyContribution,
        targetDate: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)).toISOString(), // 1 year from now
        priority: template.priority,
        icon: template.icon,
        isActive: true,
        isShared: this.random() > 0.8, // 20% shared goals
        createdAt: this.randomDate(180).toISOString(),
        updatedAt: this.randomDate(30).toISOString()
      });
    }

    return goals;
  }

  generateBudgetForUser(user, transactions) {
    const categories = this.getCategories();
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    
    // Calculate actual spending from transactions
    const monthlySpending = {};
    const currentMonthTransactions = transactions.filter(t => 
      t.date.startsWith(currentMonth) && t.amount < 0
    );

    for (const category of categories) {
      const categoryTransactions = currentMonthTransactions.filter(t => t.category === category.id);
      const totalSpent = categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      monthlySpending[category.id] = totalSpent;
    }

    // Generate budget amounts (slightly higher than actual spending)
    const budgetCategories = {};
    for (const category of categories) {
      const actualSpent = monthlySpending[category.id] || 0;
      const budgetAmount = actualSpent > 0 ? 
        Math.round(actualSpent * this.randomBetween(1.1, 1.5)) : // 10-50% buffer
        Math.round(this.randomBetween(100, 1000)); // Default for unused categories
      
      budgetCategories[category.id] = {
        budgeted: budgetAmount,
        spent: actualSpent,
        remaining: budgetAmount - actualSpent
      };
    }

    return {
      id: this.generateId(),
      userId: user.id,
      month: currentMonth,
      categories: budgetCategories,
      totalBudgeted: Object.values(budgetCategories).reduce((sum, cat) => sum + cat.budgeted, 0),
      totalSpent: Object.values(budgetCategories).reduce((sum, cat) => sum + cat.spent, 0),
      createdAt: new Date(currentMonth + '-01').toISOString(),
      updatedAt: this.randomDate(5).toISOString()
    };
  }

  generateAIInsightsForUser(user) {
    const insights = [];
    const insightTypes = [
      'spending_pattern',
      'budget_analysis',
      'goal_progress',
      'savings_opportunity',
      'financial_health'
    ];

    for (let i = 0; i < 5; i++) {
      const type = this.randomChoice(insightTypes);
      
      insights.push({
        id: this.generateId(),
        userId: user.id,
        type: type,
        title: this.getInsightTitle(type),
        description: this.getInsightDescription(type),
        impact: this.randomChoice(['high', 'medium', 'low']),
        category: this.randomChoice(['positive', 'neutral', 'warning']),
        actionable: this.random() > 0.3,
        actions: this.getInsightActions(type),
        confidence: Math.round(this.randomBetween(70, 95)),
        timestamp: this.randomDate(30).toISOString(),
        viewed: this.random() > 0.3,
        dismissed: this.random() > 0.8
      });
    }

    return insights;
  }

  getInsightTitle(type) {
    const titles = {
      spending_pattern: 'Increased Dining Expenses Detected',
      budget_analysis: 'Transportation Budget Exceeded',
      goal_progress: 'Emergency Fund Goal On Track',
      savings_opportunity: 'Subscription Optimization Available',
      financial_health: 'Financial Health Score Improved'
    };
    return titles[type] || 'Financial Insight';
  }

  getInsightDescription(type) {
    const descriptions = {
      spending_pattern: 'Your dining expenses have increased by 25% compared to last month. Consider meal planning to reduce costs.',
      budget_analysis: 'You\'ve spent 110% of your transportation budget this month, primarily due to increased fuel costs.',
      goal_progress: 'Great job! You\'re ahead of schedule on your emergency fund goal and could reach it 2 months early.',
      savings_opportunity: 'You have 3 unused subscriptions costing $47/month. Canceling these could save $564 annually.',
      financial_health: 'Your financial health score increased to 78/100 due to improved savings rate and debt reduction.'
    };
    return descriptions[type] || 'AI-generated financial insight';
  }

  getInsightActions(type) {
    const actions = {
      spending_pattern: ['Set dining budget', 'Plan meals', 'Track restaurant visits'],
      budget_analysis: ['Adjust budget', 'Find cheaper options', 'Review necessity'],
      goal_progress: ['Increase contribution', 'Maintain pace', 'Set new goal'],
      savings_opportunity: ['Cancel subscriptions', 'Review services', 'Set reminders'],
      financial_health: ['Maintain habits', 'Set new goals', 'Optimize further']
    };
    return actions[type] || ['Review finances'];
  }

  getCategories() {
    return [
      { id: 'food', name: 'Food & Dining', icon: '🍽️', color: '#ef4444' },
      { id: 'transportation', name: 'Transportation', icon: '🚗', color: '#3b82f6' },
      { id: 'housing', name: 'Housing', icon: '🏠', color: '#8b5cf6' },
      { id: 'utilities', name: 'Utilities', icon: '⚡', color: '#f59e0b' },
      { id: 'healthcare', name: 'Healthcare', icon: '🏥', color: '#10b981' },
      { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#ec4899' },
      { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#06b6d4' },
      { id: 'personal', name: 'Personal Care', icon: '💄', color: '#84cc16' },
      { id: 'education', name: 'Education', icon: '📚', color: '#6366f1' },
      { id: 'debt', name: 'Debt Payments', icon: '💳', color: '#f97316' },
      { id: 'savings', name: 'Savings', icon: '💰', color: '#22c55e' },
      { id: 'other', name: 'Other', icon: '📝', color: '#6b7280' }
    ];
  }

  getMerchants() {
    return [
      // Food & Dining
      { name: 'McDonald\'s', category: 'food', location: 'Various' },
      { name: 'Starbucks', category: 'food', location: 'Various' },
      { name: 'Subway', category: 'food', location: 'Various' },
      { name: 'Local Grocery Store', category: 'food', location: 'Downtown' },
      { name: 'Pizza Palace', category: 'food', location: 'Main Street' },
      
      // Transportation
      { name: 'Shell Gas Station', category: 'transportation', location: 'Highway 1' },
      { name: 'Uber', category: 'transportation', location: 'Various' },
      { name: 'City Transit', category: 'transportation', location: 'Various' },
      { name: 'Airport Parking', category: 'transportation', location: 'Airport' },
      
      // Shopping
      { name: 'Amazon', category: 'shopping', location: 'Online' },
      { name: 'Target', category: 'shopping', location: 'Shopping Center' },
      { name: 'Best Buy', category: 'shopping', location: 'Electronics District' },
      { name: 'Local Bookstore', category: 'shopping', location: 'Downtown' },
      
      // Entertainment
      { name: 'Netflix', category: 'entertainment', location: 'Online' },
      { name: 'Spotify', category: 'entertainment', location: 'Online' },
      { name: 'Movie Theater', category: 'entertainment', location: 'Mall' },
      { name: 'Concert Hall', category: 'entertainment', location: 'Arts District' },
      
      // Utilities
      { name: 'Electric Company', category: 'utilities', location: 'City' },
      { name: 'Water Department', category: 'utilities', location: 'City' },
      { name: 'Internet Provider', category: 'utilities', location: 'City' },
      
      // Healthcare
      { name: 'City Hospital', category: 'healthcare', location: 'Medical District' },
      { name: 'Local Pharmacy', category: 'healthcare', location: 'Downtown' },
      { name: 'Dental Clinic', category: 'healthcare', location: 'Medical Center' }
    ];
  }

  getBanks() {
    return {
      'NZ': [
      