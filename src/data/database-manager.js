// src/data/database-manager.js - Real IndexedDB Database Manager
export class DatabaseManager {
    constructor() {
        this.dbName = 'SmartFinanceAI';
        this.dbVersion = 1;
        this.db = null;
        this.isInitialized = false;
        
        // Database stores
        this.stores = {
            users: 'users',
            accounts: 'accounts',
            transactions: 'transactions',
            budgets: 'budgets',
            goals: 'goals',
            categories: 'categories',
            settings: 'settings'
        };
    }
    
    async initialize() {
        if (this.isInitialized) return this.db;
        
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('❌ Database failed to open:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                this.isInitialized = true;
                console.log('✅ Database opened successfully');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                this.db = event.target.result;
                console.log('🔄 Database upgrade needed');
                this.createStores();
            };
        });
    }
    
    createStores() {
        // Users store
        if (!this.db.objectStoreNames.contains(this.stores.users)) {
            const userStore = this.db.createObjectStore(this.stores.users, {
                keyPath: 'id',
                autoIncrement: true
            });
            userStore.createIndex('email', 'email', { unique: true });
            userStore.createIndex('sessionId', 'sessionId', { unique: false });
        }
        
        // Accounts store
        if (!this.db.objectStoreNames.contains(this.stores.accounts)) {
            const accountStore = this.db.createObjectStore(this.stores.accounts, {
                keyPath: 'id',
                autoIncrement: true
            });
            accountStore.createIndex('userId', 'userId', { unique: false });
            accountStore.createIndex('accountType', 'accountType', { unique: false });
            accountStore.createIndex('isActive', 'isActive', { unique: false });
        }
        
        // Transactions store
        if (!this.db.objectStoreNames.contains(this.stores.transactions)) {
            const transactionStore = this.db.createObjectStore(this.stores.transactions, {
                keyPath: 'id',
                autoIncrement: true
            });
            transactionStore.createIndex('userId', 'userId', { unique: false });
            transactionStore.createIndex('accountId', 'accountId', { unique: false });
            transactionStore.createIndex('date', 'date', { unique: false });
            transactionStore.createIndex('category', 'category', { unique: false });
            transactionStore.createIndex('amount', 'amount', { unique: false });
        }
        
        // Budgets store
        if (!this.db.objectStoreNames.contains(this.stores.budgets)) {
            const budgetStore = this.db.createObjectStore(this.stores.budgets, {
                keyPath: 'id',
                autoIncrement: true
            });
            budgetStore.createIndex('userId', 'userId', { unique: false });
            budgetStore.createIndex('category', 'category', { unique: false });
            budgetStore.createIndex('period', 'period', { unique: false });
        }
        
        // Goals store
        if (!this.db.objectStoreNames.contains(this.stores.goals)) {
            const goalStore = this.db.createObjectStore(this.stores.goals, {
                keyPath: 'id',
                autoIncrement: true
            });
            goalStore.createIndex('userId', 'userId', { unique: false });
            goalStore.createIndex('goalType', 'goalType', { unique: false });
            goalStore.createIndex('isActive', 'isActive', { unique: false });
            goalStore.createIndex('targetDate', 'targetDate', { unique: false });
        }
        
        // Categories store
        if (!this.db.objectStoreNames.contains(this.stores.categories)) {
            const categoryStore = this.db.createObjectStore(this.stores.categories, {
                keyPath: 'id',
                autoIncrement: true
            });
            categoryStore.createIndex('userId', 'userId', { unique: false });
            categoryStore.createIndex('name', 'name', { unique: false });
            categoryStore.createIndex('type', 'type', { unique: false });
        }
        
        // Settings store
        if (!this.db.objectStoreNames.contains(this.stores.settings)) {
            const settingsStore = this.db.createObjectStore(this.stores.settings, {
                keyPath: 'userId'
            });
        }
        
        console.log('✅ Database stores created');
    }
    
    // Generic CRUD operations
    async create(storeName, data) {
        if (!this.isInitialized) await this.initialize();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            // Add timestamps
            data.createdAt = new Date().toISOString();
            data.updatedAt = new Date().toISOString();
            
            const request = store.add(data);
            
            request.onsuccess = () => {
                data.id = request.result;
                resolve(data);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }
    
    async read(storeName, id) {
        if (!this.isInitialized) await this.initialize();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }
    
    async update(storeName, data) {
        if (!this.isInitialized) await this.initialize();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            // Update timestamp
            data.updatedAt = new Date().toISOString();
            
            const request = store.put(data);
            
            request.onsuccess = () => {
                resolve(data);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }
    
    async delete(storeName, id) {
        if (!this.isInitialized) await this.initialize();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => {
                resolve(true);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }
    
    async getAll(storeName, indexName = null, indexValue = null) {
        if (!this.isInitialized) await this.initialize();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            
            let request;
            if (indexName && indexValue !== null) {
                const index = store.index(indexName);
                request = index.getAll(indexValue);
            } else {
                request = store.getAll();
            }
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }
    
    // Specialized methods for financial data
    
    // User operations
    async createUser(userData) {
        try {
            const user = await this.create(this.stores.users, userData);
            
            // Create default categories for new user
            await this.createDefaultCategories(user.id);
            
            // Create default settings
            await this.createDefaultSettings(user.id);
            
            console.log('✅ User created:', user.email);
            return user;
        } catch (error) {
            console.error('❌ Error creating user:', error);
            throw error;
        }
    }
    
    async getUserByEmail(email) {
        const users = await this.getAll(this.stores.users, 'email', email);
        return users.length > 0 ? users[0] : null;
    }
    
    // Account operations
    async createAccount(accountData) {
        try {
            const account = await this.create(this.stores.accounts, {
                ...accountData,
                balance: accountData.balance || 0,
                isActive: true
            });
            
            console.log('✅ Account created:', account.name);
            return account;
        } catch (error) {
            console.error('❌ Error creating account:', error);
            throw error;
        }
    }
    
    async getUserAccounts(userId) {
        return await this.getAll(this.stores.accounts, 'userId', userId);
    }
    
    async updateAccountBalance(accountId, newBalance) {
        try {
            const account = await this.read(this.stores.accounts, accountId);
            if (account) {
                account.balance = newBalance;
                account.lastUpdated = new Date().toISOString();
                return await this.update(this.stores.accounts, account);
            }
            throw new Error('Account not found');
        } catch (error) {
            console.error('❌ Error updating account balance:', error);
            throw error;
        }
    }
    
    // Transaction operations
    async createTransaction(transactionData) {
        try {
            const transaction = await this.create(this.stores.transactions, {
                ...transactionData,
                date: transactionData.date || new Date().toISOString()
            });
            
            // Update account balance
            if (transactionData.accountId) {
                const account = await this.read(this.stores.accounts, transactionData.accountId);
                if (account) {
                    const newBalance = account.balance + (transactionData.amount || 0);
                    await this.updateAccountBalance(transactionData.accountId, newBalance);
                }
            }
            
            console.log('✅ Transaction created:', transaction.description);
            return transaction;
        } catch (error) {
            console.error('❌ Error creating transaction:', error);
            throw error;
        }
    }
    
    async getUserTransactions(userId, limit = null, startDate = null, endDate = null) {
        try {
            let transactions = await this.getAll(this.stores.transactions, 'userId', userId);
            
            // Filter by date range if provided
            if (startDate || endDate) {
                transactions = transactions.filter(t => {
                    const transactionDate = new Date(t.date);
                    if (startDate && transactionDate < new Date(startDate)) return false;
                    if (endDate && transactionDate > new Date(endDate)) return false;
                    return true;
                });
            }
            
            // Sort by date (newest first)
            transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Apply limit if specified
            if (limit) {
                transactions = transactions.slice(0, limit);
            }
            
            return transactions;
        } catch (error) {
            console.error('❌ Error getting user transactions:', error);
            throw error;
        }
    }
    
    async getAccountTransactions(accountId, limit = null) {
        try {
            let transactions = await this.getAll(this.stores.transactions, 'accountId', accountId);
            
            // Sort by date (newest first)
            transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            if (limit) {
                transactions = transactions.slice(0, limit);
            }
            
            return transactions;
        } catch (error) {
            console.error('❌ Error getting account transactions:', error);
            throw error;
        }
    }
    
    // Budget operations
    async createBudget(budgetData) {
        try {
            const budget = await this.create(this.stores.budgets, {
                ...budgetData,
                spent: 0,
                isActive: true
            });
            
            console.log('✅ Budget created:', budget.category);
            return budget;
        } catch (error) {
            console.error('❌ Error creating budget:', error);
            throw error;
        }
    }
    
    async getUserBudgets(userId, period = null) {
        try {
            let budgets = await this.getAll(this.stores.budgets, 'userId', userId);
            
            if (period) {
                budgets = budgets.filter(b => b.period === period);
            }
            
            return budgets;
        } catch (error) {
            console.error('❌ Error getting user budgets:', error);
            throw error;
        }
    }
    
    async updateBudgetSpent(budgetId, spentAmount) {
        try {
            const budget = await this.read(this.stores.budgets, budgetId);
            if (budget) {
                budget.spent = spentAmount;
                budget.percentUsed = (spentAmount / budget.amount) * 100;
                return await this.update(this.stores.budgets, budget);
            }
            throw new Error('Budget not found');
        } catch (error) {
            console.error('❌ Error updating budget:', error);
            throw error;
        }
    }
    
    // Goal operations
    async createGoal(goalData) {
        try {
            const goal = await this.create(this.stores.goals, {
                ...goalData,
                currentAmount: goalData.currentAmount || 0,
                isActive: true,
                progress: 0
            });
            
            console.log('✅ Goal created:', goal.name);
            return goal;
        } catch (error) {
            console.error('❌ Error creating goal:', error);
            throw error;
        }
    }
    
    async getUserGoals(userId, activeOnly = true) {
        try {
            let goals = await this.getAll(this.stores.goals, 'userId', userId);
            
            if (activeOnly) {
                goals = goals.filter(g => g.isActive);
            }
            
            // Calculate progress for each goal
            goals = goals.map(goal => ({
                ...goal,
                progress: Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
            }));
            
            return goals;
        } catch (error) {
            console.error('❌ Error getting user goals:', error);
            throw error;
        }
    }
    
    async updateGoalProgress(goalId, newAmount) {
        try {
            const goal = await this.read(this.stores.goals, goalId);
            if (goal) {
                goal.currentAmount = newAmount;
                goal.progress = Math.min((newAmount / goal.targetAmount) * 100, 100);
                goal.lastUpdated = new Date().toISOString();
                
                // Check if goal is completed
                if (goal.progress >= 100 && !goal.completedAt) {
                    goal.completedAt = new Date().toISOString();
                    goal.isActive = false;
                }
                
                return await this.update(this.stores.goals, goal);
            }
            throw new Error('Goal not found');
        } catch (error) {
            console.error('❌ Error updating goal progress:', error);
            throw error;
        }
    }
    
    // Category operations
    async createDefaultCategories(userId) {
        const defaultCategories = [
            // Income categories
            { name: 'Salary', type: 'income', icon: '💼', color: '#10b981' },
            { name: 'Freelance', type: 'income', icon: '💻', color: '#059669' },
            { name: 'Investment Returns', type: 'income', icon: '📈', color: '#047857' },
            { name: 'Other Income', type: 'income', icon: '💰', color: '#065f46' },
            
            // Expense categories
            { name: 'Groceries', type: 'expense', icon: '🛒', color: '#ef4444' },
            { name: 'Dining Out', type: 'expense', icon: '🍽️', color: '#dc2626' },
            { name: 'Transportation', type: 'expense', icon: '🚗', color: '#b91c1c' },
            { name: 'Housing', type: 'expense', icon: '🏠', color: '#991b1b' },
            { name: 'Utilities', type: 'expense', icon: '⚡', color: '#7f1d1d' },
            { name: 'Entertainment', type: 'expense', icon: '🎬', color: '#f59e0b' },
            { name: 'Shopping', type: 'expense', icon: '🛍️', color: '#d97706' },
            { name: 'Healthcare', type: 'expense', icon: '🏥', color: '#b45309' },
            { name: 'Education', type: 'expense', icon: '📚', color: '#92400e' },
            { name: 'Insurance', type: 'expense', icon: '🛡️', color: '#78350f' },
            { name: 'Other Expenses', type: 'expense', icon: '📝', color: '#451a03' }
        ];
        
        try {
            for (const category of defaultCategories) {
                await this.create(this.stores.categories, {
                    ...category,
                    userId: userId,
                    isDefault: true
                });
            }
            console.log('✅ Default categories created for user');
        } catch (error) {
            console.error('❌ Error creating default categories:', error);
        }
    }
    
    async getUserCategories(userId, type = null) {
        try {
            let categories = await this.getAll(this.stores.categories, 'userId', userId);
            
            if (type) {
                categories = categories.filter(c => c.type === type);
            }
            
            return categories;
        } catch (error) {
            console.error('❌ Error getting user categories:', error);
            throw error;
        }
    }
    
    // Settings operations
    async createDefaultSettings(userId) {
        const defaultSettings = {
            userId: userId,
            currency: 'USD',
            dateFormat: 'MM/DD/YYYY',
            theme: 'dark',
            notifications: {
                budgetAlerts: true,
                goalReminders: true,
                lowBalance: true,
                weeklyReports: true
            },
            privacy: {
                hideAmounts: false,
                shareAnalytics: true
            },
            preferences: {
                defaultAccount: null,
                emergencyFundMonths: 6,
                autoCategorizeFYI 
            }
        };
        
        try {
            await this.create(this.stores.settings, defaultSettings);
            console.log('✅ Default settings created for user');
        } catch (error) {
            console.error('❌ Error creating default settings:', error);
        }
    }
    
    async getUserSettings(userId) {
        try {
            return await this.read(this.stores.settings, userId);
        } catch (error) {
            console.error('❌ Error getting user settings:', error);
            throw error;
        }
    }
    
    async updateUserSettings(userId, settingsUpdate) {
        try {
            const settings = await this.getUserSettings(userId);
            if (settings) {
                const updatedSettings = { ...settings, ...settingsUpdate };
                return await this.update(this.stores.settings, updatedSettings);
            }
            throw new Error('Settings not found');
        } catch (error) {
            console.error('❌ Error updating user settings:', error);
            throw error;
        }
    }
    
    // Analytics and reporting methods
    async getUserFinancialSummary(userId, startDate = null, endDate = null) {
        try {
            const [accounts, transactions, budgets, goals] = await Promise.all([
                this.getUserAccounts(userId),
                this.getUserTransactions(userId, null, startDate, endDate),
                this.getUserBudgets(userId),
                this.getUserGoals(userId)
            ]);
            
            // Calculate totals
            const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
            const totalIncome = transactions
                .filter(t => t.amount > 0)
                .reduce((sum, t) => sum + t.amount, 0);
            const totalExpenses = transactions
                .filter(t => t.amount < 0)
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            
            // Budget analysis
            const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
            const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
            const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
            
            // Goal analysis
            const activeGoals = goals.filter(g => g.isActive);
            const completedGoals = goals.filter(g => !g.isActive && g.completedAt);
            const averageGoalProgress = activeGoals.length > 0 
                ? activeGoals.reduce((sum, g) => sum + g.progress, 0) / activeGoals.length 
                : 0;
            
            return {
                balance: {
                    total: totalBalance,
                    accounts: accounts.length
                },
                cashFlow: {
                    income: totalIncome,
                    expenses: totalExpenses,
                    net: totalIncome - totalExpenses
                },
                budget: {
                    total: totalBudget,
                    spent: totalSpent,
                    remaining: totalBudget - totalSpent,
                    utilization: budgetUtilization
                },
                goals: {
                    active: activeGoals.length,
                    completed: completedGoals.length,
                    averageProgress: averageGoalProgress
                },
                transactions: {
                    total: transactions.length,
                    thisMonth: transactions.filter(t => {
                        const transDate = new Date(t.date);
                        const now = new Date();
                        return transDate.getMonth() === now.getMonth() && 
                               transDate.getFullYear() === now.getFullYear();
                    }).length
                }
            };
        } catch (error) {
            console.error('❌ Error getting financial summary:', error);
            throw error;
        }
    }
    
    // Data export/import
    async exportUserData(userId) {
        try {
            const [user, accounts, transactions, budgets, goals, categories, settings] = await Promise.all([
                this.read(this.stores.users, userId),
                this.getUserAccounts(userId),
                this.getUserTransactions(userId),
                this.getUserBudgets(userId),
                this.getUserGoals(userId, false),
                this.getUserCategories(userId),
                this.getUserSettings(userId)
            ]);
            
            return {
                user,
                accounts,
                transactions,
                budgets,
                goals,
                categories,
                settings,
                exportDate: new Date().toISOString(),
                version: this.dbVersion
            };
        } catch (error) {
            console.error('❌ Error exporting user data:', error);
            throw error;
        }
    }
    
    // Cleanup methods
    async clearUserData(userId) {
        try {
            // Delete in reverse dependency order
            const stores = [
                this.stores.transactions,
                this.stores.budgets,
                this.stores.goals,
                this.stores.categories,
                this.stores.accounts,
                this.stores.settings,
                this.stores.users
            ];
            
            for (const storeName of stores) {
                const items = await this.getAll(storeName, 'userId', userId);
                for (const item of items) {
                    await this.delete(storeName, item.id);
                }
            }
            
            console.log('✅ User data cleared');
        } catch (error) {
            console.error('❌ Error clearing user data:', error);
            throw error;
        }
    }
    
    // Database maintenance
    async clearDatabase() {
        if (!this.isInitialized) return;
        
        try {
            const storeNames = Object.values(this.stores);
            
            for (const storeName of storeNames) {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                await new Promise((resolve, reject) => {
                    const request = store.clear();
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            }
            
            console.log('✅ Database cleared');
        } catch (error) {
            console.error('❌ Error clearing database:', error);
            throw error;
        }
    }
    
    // Connection management
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.isInitialized = false;
            console.log('📴 Database connection closed');
        }
    }
}

// Export singleton instance
const dbManager = new DatabaseManager();
export default dbManager;

// Also export class for direct instantiation
export { DatabaseManager };