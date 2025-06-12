/**
 * SmartFinanceAI - Advanced Budget System
 * Intelligent budgeting engine with AI-powered insights, templates, and dynamic optimization
 */

class BudgetSystem {
    constructor() {
        this.budgets = new Map();
        this.budgetTemplates = new Map();
        this.budgetHistory = [];
        this.currentPeriod = null;
        this.userProfile = null;
        this.transactions = [];
        this.aiEngine = null;
        
        // Budget     categorizeTransactions(transactions) {
        const spending = {};
        
        transactions.forEach(transaction => {
            if (transaction.amount < 0) { // Expense
                const category = transaction.category || 'miscellaneous';
                spending[category] = (spending[category] || 0) + Math.abs(transaction.amount);
            }
        });
        
        return spending;
    }

    updateSubcategoryProgress(subcategories, transactions, parentCategory) {
        // Reset subcategory spending
        Object.keys(subcategories).forEach(subcat => {
            subcategories[subcat].spent = 0;
        });
        
        // Calculate spending for each subcategory
        transactions.forEach(transaction => {
            if (transaction.amount < 0 && transaction.category === parentCategory) {
                const subcategory = transaction.subcategory || this.inferSubcategory(transaction, parentCategory);
                if (subcategories[subcategory]) {
                    subcategories[subcategory].spent += Math.abs(transaction.amount);
                    subcategories[subcategory].remaining = Math.max(0, 
                        subcategories[subcategory].budgeted - subcategories[subcategory].spent);
                }
            }
        });
    }

    inferSubcategory(transaction, parentCategory) {
        const description = (transaction.description || '').toLowerCase();
        const categoryInfo = this.budgetCategories[parentCategory];
        
        if (!categoryInfo || !categoryInfo.subcategories) return 'other';
        
        // Simple keyword matching for subcategory inference
        const subcategoryKeywords = {
            // Food subcategories
            groceries: ['grocery', 'supermarket', 'walmart', 'kroger', 'safeway', 'foodland'],
            dining_out: ['restaurant', 'cafe', 'mcdonald', 'subway', 'pizza', 'takeaway'],
            coffee: ['starbucks', 'coffee', 'cafe', 'espresso'],
            
            // Transportation subcategories
            gas: ['gas', 'fuel', 'petrol', 'bp', 'shell', 'mobil'],
            car_payment: ['car payment', 'auto loan', 'vehicle'],
            public_transport: ['bus', 'train', 'metro', 'uber', 'lyft', 'taxi'],
            
            // Entertainment subcategories
            streaming: ['netflix', 'spotify', 'apple music', 'disney+', 'hulu'],
            movies: ['cinema', 'movie', 'theater', 'amc'],
            games: ['steam', 'playstation', 'xbox', 'nintendo'],
            
            // Shopping subcategories
            clothing: ['clothing', 'fashion', 'shoes', 'apparel', 'h&m', 'zara'],
            electronics: ['apple', 'amazon', 'bestbuy', 'electronics'],
            
            // Healthcare subcategories
            medical: ['doctor', 'hospital', 'clinic', 'medical'],
            dental: ['dentist', 'dental'],
            pharmacy: ['pharmacy', 'cvs', 'walgreens', 'prescriptions']
        };
        
        for (const [subcategory, keywords] of Object.entries(subcategoryKeywords)) {
            if (categoryInfo.subcategories.includes(subcategory)) {
                if (keywords.some(keyword => description.includes(keyword))) {
                    return subcategory;
                }
            }
        }
        
        return categoryInfo.subcategories[0] || 'other';
    }

    calculateEstimatedIncome() {
        if (this.userProfile?.monthlyIncome) {
            return this.userProfile.monthlyIncome;
        }
        
        // Estimate from transaction history
        const recentTransactions = this.getTransactionsFromLastMonths(3);
        const incomeTransactions = recentTransactions.filter(t => t.amount > 0);
        
        if (incomeTransactions.length === 0) return 5000; // Default fallback
        
        const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
        return Math.round(totalIncome / 3); // Average monthly income
    }

    getTransactionsFromLastMonths(months) {
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - months);
        
        return this.transactions.filter(t => new Date(t.date) >= cutoffDate);
    }

    getCurrentPeriodTransactions(period = 'monthly') {
        const now = new Date();
        let startDate;
        
        switch (period) {
            case 'weekly':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - now.getDay()); // Start of week
                break;
            case 'monthly':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Start of month
                break;
            case 'yearly':
                startDate = new Date(now.getFullYear(), 0, 1); // Start of year
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        
        return this.transactions.filter(t => new Date(t.date) >= startDate);
    }

    getCurrentBudgetPeriod() {
        const now = new Date();
        return {
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        };
    }

    scaleBudgetToIncome(budget, maxIncome) {
        const totalBudgeted = Object.values(budget.categories).reduce((sum, cat) => sum + cat.budgeted, 0);
        const scaleFactor = maxIncome / totalBudgeted;
        
        for (const categoryData of Object.values(budget.categories)) {
            categoryData.budgeted = Math.round(categoryData.budgeted * scaleFactor);
            categoryData.remaining = categoryData.budgeted;
            
            if (categoryData.subcategories) {
                for (const subcatData of Object.values(categoryData.subcategories)) {
                    subcatData.budgeted = Math.round(subcatData.budgeted * scaleFactor);
                    subcatData.remaining = subcatData.budgeted;
                }
            }
        }
    }

    calculateSavingsPercentage(budget) {
        const savingsCategories = ['emergency_fund', 'retirement', 'investments', 'goals'];
        const totalSavings = savingsCategories.reduce((sum, catId) => {
            return sum + (budget.categories[catId]?.budgeted || 0);
        }, 0);
        
        return budget.totalIncome > 0 ? (totalSavings / budget.totalIncome) * 100 : 0;
    }

    calculateSpendingTrend(categoryId) {
        // Analyze spending trend for the category over recent months
        const recentMonths = 6;
        const monthlySpending = {};
        
        for (let i = 0; i < recentMonths; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = date.toISOString().slice(0, 7);
            monthlySpending[monthKey] = 0;
        }
        
        // Calculate actual spending per month
        this.transactions.forEach(transaction => {
            if (transaction.amount < 0 && transaction.category === categoryId) {
                const monthKey = transaction.date.slice(0, 7);
                if (monthlySpending.hasOwnProperty(monthKey)) {
                    monthlySpending[monthKey] += Math.abs(transaction.amount);
                }
            }
        });
        
        const amounts = Object.values(monthlySpending);
        if (amounts.length < 2) return 1.0; // No trend data
        
        // Simple linear trend calculation
        const firstHalf = amounts.slice(0, Math.floor(amounts.length / 2));
        const secondHalf = amounts.slice(Math.floor(amounts.length / 2));
        
        const firstAverage = firstHalf.reduce((sum, amt) => sum + amt, 0) / firstHalf.length;
        const secondAverage = secondHalf.reduce((sum, amt) => sum + amt, 0) / secondHalf.length;
        
        if (firstAverage === 0) return 1.0;
        
        const trendMultiplier = secondAverage / firstAverage;
        return Math.max(0.5, Math.min(2.0, trendMultiplier)); // Cap between 0.5x and 2.0x
    }

    getCategoriesWithTrend(trendType) {
        const categories = [];
        
        for (const categoryId of Object.keys(this.budgetCategories)) {
            const trendMultiplier = this.calculateSpendingTrend(categoryId);
            
            if (trendType === 'increasing' && trendMultiplier > 1.1) {
                categories.push({
                    id: categoryId,
                    name: this.budgetCategories[categoryId].name,
                    trend: trendMultiplier
                });
            } else if (trendType === 'decreasing' && trendMultiplier < 0.9) {
                categories.push({
                    id: categoryId,
                    name: this.budgetCategories[categoryId].name,
                    trend: trendMultiplier
                });
            }
        }
        
        return categories;
    }

    async generateBudgetInsights(budget) {
        if (!this.aiEngine) return [];
        
        const insights = [];
        
        // Analyze overspending patterns
        if (budget.overBudgetCategories && budget.overBudgetCategories.length > 0) {
            insights.push({
                type: 'overspending_alert',
                title: 'Budget Overspending Detected',
                description: `You've exceeded budget in ${budget.overBudgetCategories.length} categories this month.`,
                categories: budget.overBudgetCategories,
                severity: 'high'
            });
        }
        
        // Savings rate analysis
        const savingsRate = this.calculateSavingsPercentage(budget);
        if (savingsRate < 10) {
            insights.push({
                type: 'low_savings_rate',
                title: 'Low Savings Rate',
                description: `Your savings rate is ${savingsRate.toFixed(1)}%. Consider increasing to 15-20% for better financial security.`,
                currentRate: savingsRate,
                recommendedRate: 15,
                severity: 'medium'
            });
        }
        
        // Budget balance analysis
        const essentialPercentage = this.calculateEssentialSpendingPercentage(budget);
        if (essentialPercentage > 70) {
            insights.push({
                type: 'high_essential_spending',
                title: 'High Essential Spending',
                description: `${essentialPercentage.toFixed(1)}% of your budget goes to essentials. Look for ways to reduce fixed costs.`,
                percentage: essentialPercentage,
                severity: 'medium'
            });
        }
        
        return insights;
    }

    calculateEssentialSpendingPercentage(budget) {
        const essentialCategories = ['housing', 'transportation', 'food', 'healthcare', 'debt'];
        const essentialSpending = essentialCategories.reduce((sum, catId) => {
            return sum + (budget.categories[catId]?.budgeted || 0);
        }, 0);
        
        return budget.totalIncome > 0 ? (essentialSpending / budget.totalIncome) * 100 : 0;
    }

    convertBudgetToCSV(budget) {
        let csv = 'Category,Budgeted,Spent,Remaining,Percentage of Income\n';
        
        for (const [categoryId, categoryData] of Object.entries(budget.categories)) {
            const percentageOfIncome = budget.totalIncome > 0 ? 
                (categoryData.budgeted / budget.totalIncome) * 100 : 0;
            
            csv += `${categoryData.name},${categoryData.budgeted},${categoryData.spent},${categoryData.remaining},${percentageOfIncome.toFixed(2)}%\n`;
        }
        
        csv += `\nTotal,${budget.totalBudgeted || 0},${budget.totalSpent || 0},${budget.totalRemaining || 0},100%\n`;
        
        return csv;
    }

    generateBudgetSummary(budget) {
        const savingsRate = this.calculateSavingsPercentage(budget);
        const essentialRate = this.calculateEssentialSpendingPercentage(budget);
        
        return `
Budget Summary: ${budget.name}
Generated: ${new Date().toLocaleDateString()}

Income: $${budget.totalIncome?.toLocaleString() || 'N/A'}
Total Budgeted: $${budget.totalBudgeted?.toLocaleString() || 'N/A'}
Total Spent: $${budget.totalSpent?.toLocaleString() || 'N/A'}
Remaining: $${budget.totalRemaining?.toLocaleString() || 'N/A'}

Savings Rate: ${savingsRate.toFixed(1)}%
Essential Spending: ${essentialRate.toFixed(1)}%

Top Categories by Budget:
${Object.entries(budget.categories)
    .sort(([,a], [,b]) => b.budgeted - a.budgeted)
    .slice(0, 5)
    .map(([id, cat]) => `• ${cat.name}: $${cat.budgeted.toLocaleString()}`)
    .join('\n')}

${budget.overBudgetCategories && budget.overBudgetCategories.length > 0 ? 
    `\nOver Budget Categories:\n${budget.overBudgetCategories.map(cat => 
        `• ${cat.name}: $${cat.overage.toFixed(2)} over (${cat.percentageOver.toFixed(1)}%)`
    ).join('\n')}` : ''}
        `.trim();
    }

    getActiveBudget() {
        for (const budget of this.budgets.values()) {
            if (budget.isActive) return budget;
        }
        return null;
    }

    generateBudgetId() {
        return 'budget_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateBudgetName(method, period) {
        const methodNames = {
            '50_30_20': '50/30/20 Budget',
            'zero_based': 'Zero-Based Budget',
            'envelope': 'Envelope Budget',
            '60_solution': '60% Solution Budget'
        };
        
        const periodNames = {
            'weekly': 'Weekly',
            'monthly': 'Monthly',
            'yearly': 'Annual'
        };
        
        const methodName = methodNames[method] || 'Custom Budget';
        const periodName = periodNames[period] || 'Monthly';
        const date = new Date().toLocaleDateString();
        
        return `${methodName} - ${periodName} (${date})`;
    }

    // Storage methods (implement based on your storage solution)
    async loadBudgetsFromStorage() {
        try {
            // In a real app, this would load from IndexedDB, localStorage, or API
            const storedBudgets = localStorage.getItem('smartfinance_budgets');
            if (storedBudgets) {
                const budgetsArray = JSON.parse(storedBudgets);
                budgetsArray.forEach(budget => {
                    this.budgets.set(budget.id, budget);
                });
            }
        } catch (error) {
            console.error('Error loading budgets from storage:', error);
        }
    }

    async saveBudgetToStorage(budget) {
        try {
            // Update the budget in memory
            this.budgets.set(budget.id, budget);
            
            // Save all budgets to storage
            const budgetsArray = Array.from(this.budgets.values());
            localStorage.setItem('smartfinance_budgets', JSON.stringify(budgetsArray));
            
            console.log(`Budget ${budget.id} saved to storage`);
        } catch (error) {
            console.error('Error saving budget to storage:', error);
        }
    }

    async deleteBudget(budgetId) {
        try {
            if (this.budgets.has(budgetId)) {
                this.budgets.delete(budgetId);
                
                // Update storage
                const budgetsArray = Array.from(this.budgets.values());
                localStorage.setItem('smartfinance_budgets', JSON.stringify(budgetsArray));
                
                console.log(`Budget ${budgetId} deleted`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error deleting budget:', error);
            return false;
        }
    }

    // Public API methods
    getAllBudgets() {
        return Array.from(this.budgets.values());
    }

    getBudget(budgetId) {
        return this.budgets.get(budgetId);
    }

    getBudgetsByType(type) {
        return Array.from(this.budgets.values()).filter(budget => budget.type === type);
    }

    getBudgetCategories() {
        return this.budgetCategories;
    }

    getBudgetMethods() {
        return this.budgetMethods;
    }

    getBudgetTemplates() {
        return Array.from(this.budgetTemplates.entries()).map(([id, template]) => ({
            id,
            ...template
        }));
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BudgetSystem;
} else if (typeof window !== 'undefined') {
    window.BudgetSystem = BudgetSystem;
}

/**
 * Usage Example:
 * 
 * const budgetSystem = new BudgetSystem();
 * 
 * // Initialize with user data
 * await budgetSystem.initialize(userProfile, transactions, aiEngine);
 * 
 * // Create a new budget
 * const budget = await budgetSystem.createBudget({
 *     method: '50_30_20',
 *     income: 5000,
 *     period: 'monthly'
 * });
 * 
 * // Update with current spending
 * await budgetSystem.updateBudgetProgress(budget.id);
 * 
 * // Get recommendations
 * const recommendations = await budgetSystem.getBudgetRecommendations(budget.id);
 * 
 * // Generate forecast
 * const forecast = await budgetSystem.generateBudgetForecast(budget.id, 6);
 * 
 * // Export budget
 * const exportData = budgetSystem.exportBudget(budget.id, 'csv');
 */ies with icons and descriptions
        this.budgetCategories = {
            // Essential Categories
            housing: {
                name: 'Housing & Utilities',
                icon: '🏠',
                description: 'Rent, mortgage, utilities, maintenance',
                type: 'essential',
                recommended: { min: 0.25, max: 0.35 }, // % of income
                subcategories: ['rent', 'mortgage', 'utilities', 'maintenance', 'insurance']
            },
            transportation: {
                name: 'Transportation',
                icon: '🚗',
                description: 'Car payments, gas, public transport, maintenance',
                type: 'essential',
                recommended: { min: 0.10, max: 0.20 },
                subcategories: ['car_payment', 'gas', 'insurance', 'maintenance', 'public_transport']
            },
            food: {
                name: 'Food & Groceries',
                icon: '🛒',
                description: 'Groceries, dining out, meal planning',
                type: 'essential',
                recommended: { min: 0.10, max: 0.15 },
                subcategories: ['groceries', 'dining_