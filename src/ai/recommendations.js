/**
 * SmartFinanceAI - AI Recommendation Engine
 * Provides personalized financial recommendations based on user data, goals, and spending patterns
 */

class AIRecommendationEngine {
    constructor() {
        this.userProfile = null;
        this.financialData = null;
        this.goals = [];
        this.recommendations = [];
        this.lastAnalysis = null;
        
        // Recommendation categories
        this.categories = {
            GOAL_OPTIMIZATION: 'goal_optimization',
            BUDGET_ADJUSTMENT: 'budget_adjustment',
            SAVINGS_OPPORTUNITY: 'savings_opportunity',
            DEBT_MANAGEMENT: 'debt_management',
            INVESTMENT_ADVICE: 'investment_advice',
            SPENDING_ALERT: 'spending_alert',
            EMERGENCY_FUND: 'emergency_fund',
            TAX_OPTIMIZATION: 'tax_optimization'
        };
        
        // Confidence levels for recommendations
        this.confidenceLevels = {
            HIGH: 0.8,
            MEDIUM: 0.6,
            LOW: 0.4
        };
    }

    /**
     * Initialize the recommendation engine with user data
     */
    async initialize(userProfile, financialData, goals) {
        try {
            this.userProfile = userProfile;
            this.financialData = financialData;
            this.goals = goals || [];
            
            console.log('AI Recommendation Engine initialized');
            return true;
        } catch (error) {
            console.error('Error initializing AI Recommendation Engine:', error);
            return false;
        }
    }

    /**
     * Generate comprehensive financial recommendations
     */
    async generateRecommendations() {
        try {
            this.recommendations = [];
            this.lastAnalysis = new Date().toISOString();
            
            // Run all recommendation analyses
            await Promise.all([
                this.analyzeGoalOptimization(),
                this.analyzeBudgetOptimization(),
                this.identifySavingsOpportunities(),
                this.analyzeDebtManagement(),
                this.analyzeSpendingPatterns(),
                this.analyzeEmergencyFund(),
                this.analyzeTaxOptimization(),
                this.analyzeInvestmentOpportunities()
            ]);
            
            // Sort recommendations by priority and confidence
            this.recommendations.sort((a, b) => {
                const priorityWeight = b.priority - a.priority;
                const confidenceWeight = b.confidence - a.confidence;
                return priorityWeight || confidenceWeight;
            });
            
            console.log(`Generated ${this.recommendations.length} recommendations`);
            return this.recommendations;
            
        } catch (error) {
            console.error('Error generating recommendations:', error);
            return [];
        }
    }

    /**
     * Analyze goal optimization opportunities
     */
    async analyzeGoalOptimization() {
        if (!this.goals || this.goals.length === 0) return;
        
        for (const goal of this.goals) {
            try {
                const analysis = this.analyzeGoalProgress(goal);
                
                // Goal behind schedule
                if (analysis.status === 'behind') {
                    this.recommendations.push({
                        id: this.generateId(),
                        category: this.categories.GOAL_OPTIMIZATION,
                        type: 'goal_acceleration',
                        title: `Accelerate "${goal.name}" Progress`,
                        description: `Your ${goal.name} goal is ${analysis.monthsBehind} months behind schedule. Consider increasing your monthly contribution by $${analysis.suggestedIncrease}.`,
                        impact: analysis.suggestedIncrease,
                        confidence: this.confidenceLevels.HIGH,
                        priority: goal.priority === 'high' ? 9 : 7,
                        actionable: true,
                        actions: [
                            {
                                type: 'increase_contribution',
                                label: 'Increase Monthly Savings',
                                data: { goalId: goal.id, newAmount: goal.monthlyContribution + analysis.suggestedIncrease }
                            },
                            {
                                type: 'adjust_timeline',
                                label: 'Extend Target Date',
                                data: { goalId: goal.id, newDate: analysis.realisticDate }
                            }
                        ],
                        tags: ['goals', 'optimization', 'timeline'],
                        createdAt: new Date().toISOString()
                    });
                }
                
                // Goal ahead of schedule
                if (analysis.status === 'ahead') {
                    this.recommendations.push({
                        id: this.generateId(),
                        category: this.categories.GOAL_OPTIMIZATION,
                        type: 'goal_reallocation',
                        title: `Optimize "${goal.name}" Surplus`,
                        description: `You're ahead of schedule! You could reduce contributions by $${analysis.possibleReduction} and allocate to other goals.`,
                        impact: analysis.possibleReduction,
                        confidence: this.confidenceLevels.MEDIUM,
                        priority: 6,
                        actionable: true,
                        actions: [
                            {
                                type: 'reduce_contribution',
                                label: 'Reduce Monthly Savings',
                                data: { goalId: goal.id, newAmount: goal.monthlyContribution - analysis.possibleReduction }
                            },
                            {
                                type: 'create_new_goal',
                                label: 'Create New Goal',
                                data: { suggestedAmount: analysis.possibleReduction }
                            }
                        ],
                        tags: ['goals', 'optimization', 'reallocation'],
                        createdAt: new Date().toISOString()
                    });
                }
                
                // Goal completion approaching
                if (analysis.completionProgress > 0.8) {
                    this.recommendations.push({
                        id: this.generateId(),
                        category: this.categories.GOAL_OPTIMIZATION,
                        type: 'goal_completion',
                        title: `"${goal.name}" Almost Complete!`,
                        description: `You're ${Math.round(analysis.completionProgress * 100)}% complete. Plan your next financial goal to maintain momentum.`,
                        impact: 0,
                        confidence: this.confidenceLevels.HIGH,
                        priority: 8,
                        actionable: true,
                        actions: [
                            {
                                type: 'plan_next_goal',
                                label: 'Plan Next Goal',
                                data: { completingGoalId: goal.id }
                            }
                        ],
                        tags: ['goals', 'completion', 'planning'],
                        createdAt: new Date().toISOString()
                    });
                }
                
            } catch (error) {
                console.error(`Error analyzing goal ${goal.id}:`, error);
            }
        }
    }

    /**
     * Analyze budget optimization opportunities
     */
    async analyzeBudgetOptimization() {
        if (!this.financialData?.budget || !this.financialData?.transactions) return;
        
        const budget = this.financialData.budget;
        const recentTransactions = this.getRecentTransactions(30); // Last 30 days
        const spendingByCategory = this.categorizeSpending(recentTransactions);
        
        for (const [category, budgetAmount] of Object.entries(budget)) {
            const actualSpending = spendingByCategory[category] || 0;
            const variance = actualSpending - budgetAmount;
            const variancePercentage = budgetAmount > 0 ? (variance / budgetAmount) * 100 : 0;
            
            // Significant overspending
            if (variancePercentage > 20) {
                this.recommendations.push({
                    id: this.generateId(),
                    category: this.categories.BUDGET_ADJUSTMENT,
                    type: 'budget_overspend',
                    title: `${this.formatCategoryName(category)} Budget Exceeded`,
                    description: `You've spent $${variance.toFixed(2)} (${variancePercentage.toFixed(1)}%) over budget this month in ${this.formatCategoryName(category)}.`,
                    impact: variance,
                    confidence: this.confidenceLevels.HIGH,
                    priority: 8,
                    actionable: true,
                    actions: [
                        {
                            type: 'increase_budget',
                            label: 'Increase Budget',
                            data: { category, newAmount: actualSpending * 1.1 }
                        },
                        {
                            type: 'reduce_spending',
                            label: 'Create Spending Plan',
                            data: { category, targetReduction: variance }
                        }
                    ],
                    tags: ['budget', 'overspending', category],
                    createdAt: new Date().toISOString()
                });
            }
            
            // Significant underspending
            if (variancePercentage < -30 && budgetAmount > 100) {
                this.recommendations.push({
                    id: this.generateId(),
                    category: this.categories.BUDGET_ADJUSTMENT,
                    type: 'budget_surplus',
                    title: `${this.formatCategoryName(category)} Budget Surplus`,
                    description: `You have $${Math.abs(variance).toFixed(2)} unused budget in ${this.formatCategoryName(category)}. Consider reallocating to savings.`,
                    impact: Math.abs(variance),
                    confidence: this.confidenceLevels.MEDIUM,
                    priority: 5,
                    actionable: true,
                    actions: [
                        {
                            type: 'reduce_budget',
                            label: 'Reduce Budget',
                            data: { category, newAmount: actualSpending * 1.2 }
                        },
                        {
                            type: 'allocate_to_savings',
                            label: 'Move to Savings',
                            data: { amount: Math.abs(variance) * 0.8 }
                        }
                    ],
                    tags: ['budget', 'surplus', category],
                    createdAt: new Date().toISOString()
                });
            }
        }
    }

    /**
     * Identify savings opportunities
     */
    async identifySavingsOpportunities() {
        if (!this.financialData?.transactions) return;
        
        const transactions = this.getRecentTransactions(90); // Last 3 months
        const opportunities = [];
        
        // Analyze subscription spending
        const subscriptions = this.identifySubscriptions(transactions);
        if (subscriptions.total > 0) {
            opportunities.push({
                type: 'subscription_audit',
                title: 'Review Subscription Services',
                description: `You're spending $${subscriptions.total.toFixed(2)}/month on ${subscriptions.count} subscriptions. Consider auditing for unused services.`,
                potentialSavings: potentialSavings,
                methods: transportSpend.methods
            });
        }
        
        // Create recommendations for each opportunity
        opportunities.forEach(opportunity => {
            this.recommendations.push({
                id: this.generateId(),
                category: this.categories.SAVINGS_OPPORTUNITY,
                type: opportunity.type,
                title: opportunity.title,
                description: opportunity.description,
                impact: opportunity.potentialSavings,
                confidence: this.confidenceLevels.MEDIUM,
                priority: 6,
                actionable: true,
                actions: [
                    {
                        type: 'create_savings_plan',
                        label: 'Create Savings Plan',
                        data: { 
                            category: opportunity.type,
                            targetSavings: opportunity.potentialSavings 
                        }
                    }
                ],
                tags: ['savings', 'optimization', opportunity.type],
                createdAt: new Date().toISOString()
            });
        });
    }

    /**
     * Analyze debt management opportunities
     */
    async analyzeDebtManagement() {
        if (!this.financialData?.accounts) return;
        
        const debtAccounts = this.financialData.accounts.filter(acc => 
            acc.type === 'credit' && acc.balance > 0
        );
        
        if (debtAccounts.length === 0) return;
        
        // Calculate total debt and interest
        const totalDebt = debtAccounts.reduce((sum, acc) => sum + acc.balance, 0);
        const weightedInterestRate = this.calculateWeightedInterestRate(debtAccounts);
        
        // High-interest debt alert
        const highInterestDebts = debtAccounts.filter(acc => acc.interestRate > 15);
        if (highInterestDebts.length > 0) {
            const totalHighInterest = highInterestDebts.reduce((sum, acc) => sum + acc.balance, 0);
            
            this.recommendations.push({
                id: this.generateId(),
                category: this.categories.DEBT_MANAGEMENT,
                type: 'high_interest_debt',
                title: 'Prioritize High-Interest Debt',
                description: `You have $${totalHighInterest.toFixed(2)} in high-interest debt (>15% APR). Focus extra payments here first.`,
                impact: totalHighInterest * 0.15 / 12, // Monthly interest cost
                confidence: this.confidenceLevels.HIGH,
                priority: 9,
                actionable: true,
                actions: [
                    {
                        type: 'debt_avalanche',
                        label: 'Use Debt Avalanche Method',
                        data: { debts: highInterestDebts }
                    },
                    {
                        type: 'consider_consolidation',
                        label: 'Consider Debt Consolidation',
                        data: { totalAmount: totalHighInterest }
                    }
                ],
                tags: ['debt', 'high-interest', 'urgent'],
                createdAt: new Date().toISOString()
            });
        }
        
        // Debt consolidation opportunity
        if (debtAccounts.length > 2 && weightedInterestRate > 12) {
            this.recommendations.push({
                id: this.generateId(),
                category: this.categories.DEBT_MANAGEMENT,
                type: 'debt_consolidation',
                title: 'Consider Debt Consolidation',
                description: `With ${debtAccounts.length} debts at ${weightedInterestRate.toFixed(1)}% average rate, consolidation could reduce interest costs.`,
                impact: totalDebt * (weightedInterestRate - 8) / 100 / 12, // Estimated monthly savings
                confidence: this.confidenceLevels.MEDIUM,
                priority: 7,
                actionable: true,
                actions: [
                    {
                        type: 'research_consolidation',
                        label: 'Research Options',
                        data: { totalDebt, currentRate: weightedInterestRate }
                    }
                ],
                tags: ['debt', 'consolidation', 'optimization'],
                createdAt: new Date().toISOString()
            });
        }
    }

    /**
     * Analyze spending patterns for alerts and insights
     */
    async analyzeSpendingPatterns() {
        if (!this.financialData?.transactions) return;
        
        const recentTransactions = this.getRecentTransactions(30);
        const previousTransactions = this.getTransactionRange(60, 30); // 30-60 days ago
        
        // Compare spending patterns
        const currentSpending = this.categorizeSpending(recentTransactions);
        const previousSpending = this.categorizeSpending(previousTransactions);
        
        for (const [category, currentAmount] of Object.entries(currentSpending)) {
            const previousAmount = previousSpending[category] || 0;
            const change = currentAmount - previousAmount;
            const changePercentage = previousAmount > 0 ? (change / previousAmount) * 100 : 0;
            
            // Significant spending increase
            if (changePercentage > 50 && change > 200) {
                this.recommendations.push({
                    id: this.generateId(),
                    category: this.categories.SPENDING_ALERT,
                    type: 'spending_increase',
                    title: `${this.formatCategoryName(category)} Spending Spike`,
                    description: `Your ${this.formatCategoryName(category)} spending increased by ${changePercentage.toFixed(1)}% ($${change.toFixed(2)}) this month.`,
                    impact: change,
                    confidence: this.confidenceLevels.HIGH,
                    priority: 7,
                    actionable: true,
                    actions: [
                        {
                            type: 'review_category',
                            label: 'Review Transactions',
                            data: { category, period: 'last_30_days' }
                        },
                        {
                            type: 'set_spending_limit',
                            label: 'Set Spending Alert',
                            data: { category, limit: previousAmount * 1.2 }
                        }
                    ],
                    tags: ['spending', 'alert', category],
                    createdAt: new Date().toISOString()
                });
            }
        }
        
        // Unusual large transactions
        const largeTransactions = recentTransactions.filter(t => 
            Math.abs(t.amount) > this.calculateUnusualThreshold(category)
        );
        
        if (largeTransactions.length > 0) {
            const totalUnusual = largeTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
            
            this.recommendations.push({
                id: this.generateId(),
                category: this.categories.SPENDING_ALERT,
                type: 'unusual_transactions',
                title: 'Unusual Large Transactions Detected',
                description: `${largeTransactions.length} unusually large transactions totaling $${totalUnusual.toFixed(2)} detected this month.`,
                impact: totalUnusual,
                confidence: this.confidenceLevels.MEDIUM,
                priority: 6,
                actionable: true,
                actions: [
                    {
                        type: 'review_transactions',
                        label: 'Review Transactions',
                        data: { transactions: largeTransactions.map(t => t.id) }
                    }
                ],
                tags: ['spending', 'unusual', 'review'],
                createdAt: new Date().toISOString()
            });
        }
    }

    /**
     * Analyze emergency fund status
     */
    async analyzeEmergencyFund() {
        if (!this.financialData?.accounts) return;
        
        const savingsAccounts = this.financialData.accounts.filter(acc => 
            acc.type === 'savings' || acc.subtype === 'emergency'
        );
        
        const totalSavings = savingsAccounts.reduce((sum, acc) => sum + acc.balance, 0);
        const monthlyExpenses = this.calculateMonthlyExpenses();
        const recommendedEmergencyFund = monthlyExpenses * (this.userProfile?.country === 'US' ? 6 : 3);
        
        if (totalSavings < recommendedEmergencyFund) {
            const shortage = recommendedEmergencyFund - totalSavings;
            const monthsToTarget = Math.ceil(shortage / (monthlyExpenses * 0.1)); // Assuming 10% of expenses can be saved
            
            this.recommendations.push({
                id: this.generateId(),
                category: this.categories.EMERGENCY_FUND,
                type: 'emergency_fund_shortage',
                title: 'Build Your Emergency Fund',
                description: `Your emergency fund is $${shortage.toFixed(2)} short of the recommended ${recommendedEmergencyFund / monthlyExpenses} months of expenses.`,
                impact: shortage,
                confidence: this.confidenceLevels.HIGH,
                priority: 8,
                actionable: true,
                actions: [
                    {
                        type: 'create_emergency_goal',
                        label: 'Create Emergency Fund Goal',
                        data: { 
                            targetAmount: recommendedEmergencyFund,
                            currentAmount: totalSavings,
                            timelineMonths: monthsToTarget
                        }
                    },
                    {
                        type: 'automate_savings',
                        label: 'Automate Emergency Savings',
                        data: { suggestedAmount: shortage / monthsToTarget }
                    }
                ],
                tags: ['emergency', 'savings', 'security'],
                createdAt: new Date().toISOString()
            });
        }
    }

    /**
     * Analyze tax optimization opportunities
     */
    async analyzeTaxOptimization() {
        if (!this.userProfile?.country || !this.financialData?.accounts) return;
        
        const country = this.userProfile.country;
        const annualIncome = this.userProfile.annualIncome || 0;
        
        // KiwiSaver optimization (New Zealand)
        if (country === 'NZ') {
            const kiwiSaverAccounts = this.financialData.accounts.filter(acc => 
                acc.subtype === 'kiwisaver'
            );
            
            if (kiwiSaverAccounts.length > 0) {
                const totalKiwiSaver = kiwiSaverAccounts.reduce((sum, acc) => sum + acc.balance, 0);
                const maxEmployerMatch = Math.min(annualIncome * 0.03, 1042.86); // 2023 rates
                
                this.recommendations.push({
                    id: this.generateId(),
                    category: this.categories.TAX_OPTIMIZATION,
                    type: 'kiwisaver_optimization',
                    title: 'Maximize KiwiSaver Benefits',
                    description: `Ensure you're contributing enough to get the full employer match of $${maxEmployerMatch.toFixed(2)}/year.`,
                    impact: maxEmployerMatch,
                    confidence: this.confidenceLevels.HIGH,
                    priority: 7,
                    actionable: true,
                    actions: [
                        {
                            type: 'review_kiwisaver',
                            label: 'Review KiwiSaver Settings',
                            data: { maxMatch: maxEmployerMatch }
                        }
                    ],
                    tags: ['tax', 'kiwisaver', 'optimization'],
                    createdAt: new Date().toISOString()
                });
            }
        }
        
        // 401(k) optimization (United States)
        if (country === 'US') {
            const retirementAccounts = this.financialData.accounts.filter(acc => 
                acc.subtype === '401k' || acc.subtype === 'ira'
            );
            
            if (retirementAccounts.length > 0) {
                const currentContributions = this.calculateAnnualContributions(retirementAccounts);
                const maxContribution = 22500; // 2023 401(k) limit
                
                if (currentContributions < maxContribution && annualIncome > 75000) {
                    const additionalSpace = maxContribution - currentContributions;
                    
                    this.recommendations.push({
                        id: this.generateId(),
                        category: this.categories.TAX_OPTIMIZATION,
                        type: '401k_optimization',
                        title: 'Maximize 401(k) Contributions',
                        description: `You can contribute $${additionalSpace.toFixed(2)} more to your 401(k) for tax benefits.`,
                        impact: additionalSpace * 0.22, // Estimated tax savings
                        confidence: this.confidenceLevels.HIGH,
                        priority: 6,
                        actionable: true,
                        actions: [
                            {
                                type: 'increase_401k',
                                label: 'Increase 401(k) Contribution',
                                data: { additionalAmount: additionalSpace }
                            }
                        ],
                        tags: ['tax', '401k', 'optimization'],
                        createdAt: new Date().toISOString()
                    });
                }
            }
        }
    }

    /**
     * Analyze investment opportunities
     */
    async analyzeInvestmentOpportunities() {
        if (!this.financialData?.accounts) return;
        
        const liquidSavings = this.calculateLiquidSavings();
        const monthlyExpenses = this.calculateMonthlyExpenses();
        const emergencyFundTarget = monthlyExpenses * (this.userProfile?.country === 'US' ? 6 : 3);
        
        // Excess cash opportunity
        if (liquidSavings > emergencyFundTarget + 5000) {
            const excessCash = liquidSavings - emergencyFundTarget;
            
            this.recommendations.push({
                id: this.generateId(),
                category: this.categories.INVESTMENT_ADVICE,
                type: 'excess_cash_investment',
                title: 'Consider Investing Excess Cash',
                description: `You have $${excessCash.toFixed(2)} above your emergency fund. Consider investing for long-term growth.`,
                impact: excessCash * 0.07 / 12, // Estimated monthly returns at 7% annually
                confidence: this.confidenceLevels.MEDIUM,
                priority: 5,
                actionable: true,
                actions: [
                    {
                        type: 'explore_investments',
                        label: 'Explore Investment Options',
                        data: { availableAmount: excessCash }
                    },
                    {
                        type: 'risk_assessment',
                        label: 'Take Risk Assessment',
                        data: { investmentAmount: excessCash }
                    }
                ],
                tags: ['investment', 'cash', 'growth'],
                createdAt: new Date().toISOString()
            });
        }
        
        // Portfolio rebalancing (if investment accounts exist)
        const investmentAccounts = this.financialData.accounts.filter(acc => 
            acc.type === 'investment'
        );
        
        if (investmentAccounts.length > 0) {
            const portfolioValue = investmentAccounts.reduce((sum, acc) => sum + acc.balance, 0);
            
            // Simple age-based allocation check
            const userAge = this.calculateAge(this.userProfile?.birthDate);
            const recommendedBondPercentage = userAge;
            const recommendedStockPercentage = 100 - userAge;
            
            this.recommendations.push({
                id: this.generateId(),
                category: this.categories.INVESTMENT_ADVICE,
                type: 'portfolio_review',
                title: 'Review Portfolio Allocation',
                description: `Consider reviewing your investment allocation. A general rule suggests ${recommendedStockPercentage}% stocks, ${recommendedBondPercentage}% bonds for your age.`,
                impact: 0,
                confidence: this.confidenceLevels.LOW,
                priority: 4,
                actionable: true,
                actions: [
                    {
                        type: 'portfolio_analysis',
                        label: 'Analyze Portfolio',
                        data: { 
                            recommendedStocks: recommendedStockPercentage,
                            recommendedBonds: recommendedBondPercentage
                        }
                    }
                ],
                tags: ['investment', 'allocation', 'review'],
                createdAt: new Date().toISOString()
            });
        }
    }

    /**
     * Get personalized recommendations by category
     */
    getRecommendationsByCategory(category) {
        return this.recommendations.filter(rec => rec.category === category);
    }

    /**
     * Get high-priority recommendations
     */
    getHighPriorityRecommendations() {
        return this.recommendations.filter(rec => rec.priority >= 7);
    }

    /**
     * Get actionable recommendations
     */
    getActionableRecommendations() {
        return this.recommendations.filter(rec => rec.actionable === true);
    }

    /**
     * Execute a recommendation action
     */
    async executeRecommendationAction(recommendationId, actionType, actionData) {
        try {
            const recommendation = this.recommendations.find(rec => rec.id === recommendationId);
            if (!recommendation) {
                throw new Error('Recommendation not found');
            }
            
            const action = recommendation.actions.find(act => act.type === actionType);
            if (!action) {
                throw new Error('Action not found');
            }
            
            // In a real implementation, this would call appropriate services
            console.log(`Executing action ${actionType} for recommendation ${recommendationId}`, actionData);
            
            // Mark recommendation as acted upon
            recommendation.actedUpon = true;
            recommendation.actionTaken = {
                type: actionType,
                data: actionData,
                timestamp: new Date().toISOString()
            };
            
            return true;
        } catch (error) {
            console.error('Error executing recommendation action:', error);
            return false;
        }
    }

    /**
     * Helper method to analyze individual goal progress
     */
    analyzeGoalProgress(goal) {
        const now = new Date();
        const targetDate = new Date(goal.targetDate);
        const createdDate = new Date(goal.createdDate);
        
        const totalTimespan = targetDate - createdDate;
        const timeElapsed = now - createdDate;
        const timeRemaining = targetDate - now;
        
        const expectedProgress = timeElapsed / totalTimespan;
        const actualProgress = goal.currentAmount / goal.targetAmount;
        const progressDifference = actualProgress - expectedProgress;
        
        const monthsRemaining = Math.max(0, Math.ceil(timeRemaining / (1000 * 60 * 60 * 24 * 30)));
        const amountRemaining = Math.max(0, goal.targetAmount - goal.currentAmount);
        const requiredMonthlyContribution = monthsRemaining > 0 ? amountRemaining / monthsRemaining : 0;
        
        let status = 'on_track';
        let monthsBehind = 0;
        let suggestedIncrease = 0;
        let possibleReduction = 0;
        let realisticDate = null;
        
        if (progressDifference < -0.1) { // More than 10% behind
            status = 'behind';
            monthsBehind = Math.ceil(-progressDifference * (totalTimespan / (1000 * 60 * 60 * 24 * 30)));
            suggestedIncrease = Math.max(0, requiredMonthlyContribution - goal.monthlyContribution);
            
            if (goal.monthlyContribution > 0) {
                const monthsAtCurrentRate = amountRemaining / goal.monthlyContribution;
                realisticDate = new Date(now.getTime() + monthsAtCurrentRate * 30 * 24 * 60 * 60 * 1000);
            }
        } else if (progressDifference > 0.1) { // More than 10% ahead
            status = 'ahead';
            possibleReduction = Math.min(goal.monthlyContribution * 0.3, goal.monthlyContribution - requiredMonthlyContribution);
        }
        
        return {
            status,
            expectedProgress,
            actualProgress,
            progressDifference,
            monthsRemaining,
            amountRemaining,
            requiredMonthlyContribution,
            monthsBehind,
            suggestedIncrease,
            possibleReduction,
            realisticDate,
            completionProgress: actualProgress
        };
    }

    /**
     * Helper methods for financial calculations
     */
    getRecentTransactions(days) {
        if (!this.financialData?.transactions) return [];
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return this.financialData.transactions.filter(t => 
            new Date(t.date) >= cutoffDate
        );
    }

    getTransactionRange(startDays, endDays) {
        if (!this.financialData?.transactions) return [];
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - startDays);
        
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - endDays);
        
        return this.financialData.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= endDate && transactionDate <= startDate;
        });
    }

    categorizeSpending(transactions) {
        const spending = {};
        
        transactions.forEach(transaction => {
            if (transaction.amount < 0) { // Expense
                const category = transaction.category || 'other';
                spending[category] = (spending[category] || 0) + Math.abs(transaction.amount);
            }
        });
        
        return spending;
    }

    calculateMonthlyExpenses() {
        const recentTransactions = this.getRecentTransactions(90);
        const expenses = recentTransactions
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        return expenses / 3; // Average over 3 months
    }

    calculateLiquidSavings() {
        if (!this.financialData?.accounts) return 0;
        
        return this.financialData.accounts
            .filter(acc => acc.type === 'checking' || acc.type === 'savings')
            .reduce((sum, acc) => sum + acc.balance, 0);
    }

    calculateWeightedInterestRate(debtAccounts) {
        const totalDebt = debtAccounts.reduce((sum, acc) => sum + acc.balance, 0);
        if (totalDebt === 0) return 0;
        
        const weightedSum = debtAccounts.reduce((sum, acc) => 
            sum + (acc.balance * (acc.interestRate || 0)), 0
        );
        
        return weightedSum / totalDebt;
    }

    calculateUnusualThreshold(category) {
        const recentTransactions = this.getRecentTransactions(90);
        const categoryTransactions = recentTransactions.filter(t => 
            t.category === category && t.amount < 0
        );
        
        if (categoryTransactions.length === 0) return 500; // Default threshold
        
        const amounts = categoryTransactions.map(t => Math.abs(t.amount));
        const mean = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
        const stdDev = Math.sqrt(
            amounts.reduce((sum, amt) => sum + Math.pow(amt - mean, 2), 0) / amounts.length
        );
        
        return mean + (2 * stdDev); // 2 standard deviations above mean
    }

    identifySubscriptions(transactions) {
        const subscriptionKeywords = [
            'netflix', 'spotify', 'apple music', 'amazon prime', 'disney+',
            'hulu', 'hbo', 'gym', 'membership', 'subscription', 'monthly',
            'adobe', 'microsoft', 'google', 'dropbox', 'icloud'
        ];
        
        const subscriptions = transactions.filter(t => {
            const description = (t.description || '').toLowerCase();
            return subscriptionKeywords.some(keyword => description.includes(keyword)) &&
                   Math.abs(t.amount) < 100; // Reasonable subscription amount
        });
        
        const monthlyTotal = subscriptions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        return {
            total: monthlyTotal,
            count: subscriptions.length,
            services: subscriptions.map(t => ({
                description: t.description,
                amount: Math.abs(t.amount)
            }))
        };
    }

    analyzeDiningSpending(transactions) {
        const diningTransactions = transactions.filter(t => 
            t.category === 'food' || t.category === 'dining' ||
            (t.description && /restaurant|cafe|food|dining|takeaway|delivery/i.test(t.description))
        );
        
        const monthlyTotal = diningTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / 3;
        
        return {
            monthly: monthlyTotal,
            frequency: diningTransactions.length,
            averageTransaction: diningTransactions.length > 0 ? 
                monthlyTotal / diningTransactions.length : 0
        };
    }

    analyzeTransportSpending(transactions) {
        const transportTransactions = transactions.filter(t => 
            t.category === 'transport' || t.category === 'transportation' ||
            (t.description && /gas|fuel|uber|lyft|taxi|bus|train|parking/i.test(t.description))
        );
        
        const monthlyTotal = transportTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / 3;
        
        const methods = {};
        transportTransactions.forEach(t => {
            if (t.description) {
                if (/gas|fuel/i.test(t.description)) methods.gas = (methods.gas || 0) + Math.abs(t.amount);
                if (/uber|lyft|taxi/i.test(t.description)) methods.rideshare = (methods.rideshare || 0) + Math.abs(t.amount);
                if (/bus|train/i.test(t.description)) methods.public = (methods.public || 0) + Math.abs(t.amount);
            }
        });
        
        return {
            monthly: monthlyTotal,
            methods: methods
        };
    }

    calculateAnnualContributions(retirementAccounts) {
        // This would need to analyze transaction history for contributions
        // For now, return an estimate based on account growth
        return retirementAccounts.reduce((sum, acc) => {
            // Estimate based on account balance and typical contribution rates
            return sum + (acc.balance * 0.1); // Rough estimate
        }, 0);
    }

    calculateAge(birthDate) {
        if (!birthDate) return 35; // Default age
        
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    }

    formatCategoryName(category) {
        return category
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    generateId() {
        return 'rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIRecommendationEngine;
} else if (typeof window !== 'undefined') {
    window.AIRecommendationEngine = AIRecommendationEngine;
}

/**
 * Usage Example:
 * 
 * const recommendationEngine = new AIRecommendationEngine();
 * 
 * await recommendationEngine.initialize(userProfile, financialData, goals);
 * const recommendations = await recommendationEngine.generateRecommendations();
 * 
 * // Get high priority recommendations
 * const urgent = recommendationEngine.getHighPriorityRecommendations();
 * 
 * // Get recommendations by category
 * const goalRecs = recommendationEngine.getRecommendationsByCategory('goal_optimization');
 * 
 * // Execute a recommendation action
 * await recommendationEngine.executeRecommendationAction(
 *     'rec_123456',
 *     'increase_contribution',
 *     { goalId: 'goal_456', newAmount: 500 }
 * );
 */: subscriptions.total * 0.3, // Assume 30% could be saved
                services: subscriptions.services
            });
        }
        
        // Analyze dining out patterns
        const diningSpend = this.analyzeDiningSpending(transactions);
        if (diningSpend.monthly > 500) {
            const potentialSavings = diningSpend.monthly * 0.4;
            opportunities.push({
                type: 'dining_optimization',
                title: 'Optimize Dining Expenses',
                description: `You spend $${diningSpend.monthly.toFixed(2)}/month dining out. Cooking more could save $${potentialSavings.toFixed(2)}/month.`,
                potentialSavings: potentialSavings,
                frequency: diningSpend.frequency
            });
        }
        
        // Analyze transportation costs
        const transportSpend = this.analyzeTransportSpending(transactions);
        if (transportSpend.monthly > 300) {
            const potentialSavings = transportSpend.monthly * 0.25;
            opportunities.push({
                type: 'transport_optimization',
                title: 'Transportation Cost Review',
                description: `Monthly transport costs are $${transportSpend.monthly.toFixed(2)}. Consider public transport or carpooling to save $${potentialSavings.toFixed(2)}/month.`,
                potentialSavings