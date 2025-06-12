/**
 * SmartFinanceAI Predictive Analytics System
 * Advanced cash flow forecasting, expense prediction, and financial planning AI
 */

class FinancialPredictions {
    constructor() {
        this.version = '1.0.0';
        this.predictionHistory = [];
        this.forecastCache = new Map();
        this.seasonalPatterns = {};
        this.userBehaviorModel = {};
        
        // Initialize prediction models
        this.initializePredictionModels();
    }

    // === CORE PREDICTION ENGINE ===

    async generateComprehensiveForecast(financialData, timeframe = 12) {
        try {
            const {
                accounts = [],
                transactions = [],
                budget = {},
                goals = [],
                userProfile = {}
            } = financialData;

            // Build prediction models
            await this.buildPredictionModels(transactions, budget, userProfile);

            // Generate all prediction types
            const forecast = {
                cashFlow: await this.predictCashFlow(transactions, timeframe),
                expenses: await this.predictExpenses(transactions, budget, timeframe),
                income: await this.predictIncome(transactions, timeframe),
                balances: await this.predictAccountBalances(accounts, transactions, timeframe),
                goals: await this.predictGoalAchievement(goals, transactions, timeframe),
                emergencies: await this.predictFinancialRisks(transactions, accounts, timeframe),
                opportunities: await this.identifyFinancialOpportunities(financialData, timeframe),
                scenarios: await this.generateScenarios(financialData, timeframe),
                recommendations: await this.generatePredictiveRecommendations(financialData, timeframe),
                confidence: this.calculatePredictionConfidence(transactions),
                lastUpdated: new Date().toISOString(),
                timeframe,
                methodology: this.getMethodologyExplanation()
            };

            // Cache and store forecast
            this.cacheForecast(forecast);
            this.updatePredictionHistory(forecast);

            return forecast;

        } catch (error) {
            console.error('[Predictions] Forecast generation failed:', error);
            throw error;
        }
    }

    // === CASH FLOW PREDICTION ===

    async predictCashFlow(transactions, months) {
        const monthlyData = this.analyzeHistoricalCashFlow(transactions);
        const trends = this.identifyTrends(monthlyData);
        const seasonality = this.detectSeasonality(monthlyData);
        
        const predictions = [];
        const currentDate = new Date();

        for (let month = 1; month <= months; month++) {
            const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + month, 1);
            const seasonalFactor = this.getSeasonalFactor(targetDate, seasonality);
            
            const baseIncome = this.predictMonthlyIncome(monthlyData, trends, month);
            const baseExpenses = this.predictMonthlyExpenses(monthlyData, trends, month);
            
            const adjustedIncome = baseIncome * seasonalFactor.income;
            const adjustedExpenses = baseExpenses * seasonalFactor.expenses;
            const netCashFlow = adjustedIncome - adjustedExpenses;
            
            predictions.push({
                month: targetDate.toISOString().substring(0, 7),
                date: targetDate.toISOString(),
                income: {
                    predicted: adjustedIncome,
                    confidence: this.calculateIncomeConfidence(monthlyData, month),
                    range: {
                        low: adjustedIncome * 0.85,
                        high: adjustedIncome * 1.15
                    }
                },
                expenses: {
                    predicted: adjustedExpenses,
                    confidence: this.calculateExpenseConfidence(monthlyData, month),
                    range: {
                        low: adjustedExpenses * 0.9,
                        high: adjustedExpenses * 1.1
                    }
                },
                netCashFlow: {
                    predicted: netCashFlow,
                    confidence: Math.min(
                        this.calculateIncomeConfidence(monthlyData, month),
                        this.calculateExpenseConfidence(monthlyData, month)
                    ),
                    status: netCashFlow > 0 ? 'positive' : 'negative'
                },
                cumulativeCashFlow: this.calculateCumulativeCashFlow(predictions, netCashFlow),
                alerts: this.generateCashFlowAlerts(netCashFlow, adjustedExpenses, month)
            });
        }

        return {
            predictions,
            summary: this.summarizeCashFlowForecast(predictions),
            insights: this.generateCashFlowInsights(predictions, monthlyData),
            recommendations: this.generateCashFlowRecommendations(predictions)
        };
    }

    analyzeHistoricalCashFlow(transactions, lookbackMonths = 12) {
        const monthlyData = {};
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - lookbackMonths);

        transactions
            .filter(t => new Date(t.date) >= cutoffDate)
            .forEach(transaction => {
                const monthKey = new Date(transaction.date).toISOString().substring(0, 7);
                
                if (!monthlyData[monthKey]) {
                    monthlyData[monthKey] = {
                        income: 0,
                        expenses: 0,
                        transactions: 0,
                        categories: {}
                    };
                }

                if (transaction.amount > 0 && this.isIncomeTransaction(transaction)) {
                    monthlyData[monthKey].income += transaction.amount;
                } else if (transaction.amount < 0 && this.isExpenseTransaction(transaction)) {
                    const category = transaction.category || 'Other';
                    monthlyData[monthKey].expenses += Math.abs(transaction.amount);
                    monthlyData[monthKey].categories[category] = 
                        (monthlyData[monthKey].categories[category] || 0) + Math.abs(transaction.amount);
                }
                
                monthlyData[monthKey].transactions++;
            });

        return Object.entries(monthlyData)
            .map(([month, data]) => ({
                month,
                ...data,
                netCashFlow: data.income - data.expenses
            }))
            .sort((a, b) => a.month.localeCompare(b.month));
    }

    identifyTrends(monthlyData) {
        if (monthlyData.length < 3) {
            return { income: 0, expenses: 0, confidence: 'low' };
        }

        const incomeValues = monthlyData.map(d => d.income);
        const expenseValues = monthlyData.map(d => d.expenses);
        
        return {
            income: this.calculateLinearTrend(incomeValues),
            expenses: this.calculateLinearTrend(expenseValues),
            confidence: monthlyData.length >= 6 ? 'high' : monthlyData.length >= 3 ? 'medium' : 'low'
        };
    }

    calculateLinearTrend(values) {
        const n = values.length;
        if (n < 2) return 0;

        const xSum = (n * (n + 1)) / 2;
        const xySum = values.reduce((sum, y, x) => sum + (x + 1) * y, 0);
        const ySum = values.reduce((sum, y) => sum + y, 0);
        const xxSum = (n * (n + 1) * (2 * n + 1)) / 6;

        return (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum);
    }

    detectSeasonality(monthlyData) {
        const seasonalPatterns = {
            income: { Q1: 1.0, Q2: 1.0, Q3: 1.0, Q4: 1.0 },
            expenses: { Q1: 1.0, Q2: 1.0, Q3: 1.0, Q4: 1.0 }
        };

        if (monthlyData.length < 12) {
            return seasonalPatterns;
        }

        // Calculate quarterly averages
        const quarterlyData = { Q1: [], Q2: [], Q3: [], Q4: [] };
        
        monthlyData.forEach(data => {
            const month = parseInt(data.month.split('-')[1]);
            const quarter = Math.ceil(month / 3);
            const quarterKey = `Q${quarter}`;
            
            quarterlyData[quarterKey].push({
                income: data.income,
                expenses: data.expenses
            });
        });

        // Calculate seasonal factors
        const averageIncome = monthlyData.reduce((sum, d) => sum + d.income, 0) / monthlyData.length;
        const averageExpenses = monthlyData.reduce((sum, d) => sum + d.expenses, 0) / monthlyData.length;

        Object.keys(quarterlyData).forEach(quarter => {
            const quarterData = quarterlyData[quarter];
            if (quarterData.length > 0) {
                const quarterIncome = quarterData.reduce((sum, d) => sum + d.income, 0) / quarterData.length;
                const quarterExpenses = quarterData.reduce((sum, d) => sum + d.expenses, 0) / quarterData.length;
                
                seasonalPatterns.income[quarter] = averageIncome > 0 ? quarterIncome / averageIncome : 1.0;
                seasonalPatterns.expenses[quarter] = averageExpenses > 0 ? quarterExpenses / averageExpenses : 1.0;
            }
        });

        return seasonalPatterns;
    }

    getSeasonalFactor(date, seasonality) {
        const quarter = Math.ceil((date.getMonth() + 1) / 3);
        const quarterKey = `Q${quarter}`;
        
        return {
            income: seasonality.income[quarterKey] || 1.0,
            expenses: seasonality.expenses[quarterKey] || 1.0
        };
    }

    predictMonthlyIncome(monthlyData, trends, monthsAhead) {
        if (monthlyData.length === 0) return 0;
        
        const recentIncome = monthlyData.slice(-3).reduce((sum, d) => sum + d.income, 0) / Math.min(3, monthlyData.length);
        return Math.max(0, recentIncome + (trends.income * monthsAhead));
    }

    predictMonthlyExpenses(monthlyData, trends, monthsAhead) {
        if (monthlyData.length === 0) return 0;
        
        const recentExpenses = monthlyData.slice(-3).reduce((sum, d) => sum + d.expenses, 0) / Math.min(3, monthlyData.length);
        return Math.max(0, recentExpenses + (trends.expenses * monthsAhead));
    }

    calculateCumulativeCashFlow(previousPredictions, currentNetFlow) {
        const previousCumulative = previousPredictions.length > 0 
            ? previousPredictions[previousPredictions.length - 1].cumulativeCashFlow.predicted
            : 0;
        return { predicted: previousCumulative + currentNetFlow };
    }

    // === EXPENSE PREDICTION ===

    async predictExpenses(transactions, budget, months) {
        const categoryAnalysis = this.analyzeCategorySpending(transactions);
        const budgetComparison = this.compareToBudget(categoryAnalysis, budget);
        const expensePredictions = [];

        for (let month = 1; month <= months; month++) {
            const monthPredictions = {};
            
            Object.keys(categoryAnalysis).forEach(category => {
                const historical = categoryAnalysis[category];
                const budgetAmount = budget[category] || historical.average;
                
                const predictedAmount = this.predictCategoryExpense(
                    historical, budgetAmount, month
                );
                
                monthPredictions[category] = {
                    predicted: predictedAmount,
                    budget: budgetAmount,
                    variance: predictedAmount - budgetAmount,
                    confidence: this.calculateCategoryConfidence(historical),
                    trend: historical.trend,
                    alerts: this.generateCategoryAlerts(predictedAmount, budgetAmount, category)
                };
            });

            expensePredictions.push({
                month: month,
                date: this.getMonthDate(month),
                categories: monthPredictions,
                total: Object.values(monthPredictions).reduce((sum, cat) => sum + cat.predicted, 0),
                budgetTotal: Object.values(monthPredictions).reduce((sum, cat) => sum + cat.budget, 0)
            });
        }

        return {
            predictions: expensePredictions,
            categoryInsights: this.generateCategoryInsights(categoryAnalysis, budgetComparison),
            spendingPatterns: this.identifySpendingPatterns(transactions),
            recommendations: this.generateExpenseRecommendations(expensePredictions, budget)
        };
    }

    analyzeCategorySpending(transactions, lookbackMonths = 6) {
        const categoryData = {};
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - lookbackMonths);

        transactions
            .filter(t => t.amount < 0 && new Date(t.date) >= cutoffDate)
            .forEach(transaction => {
                const category = transaction.category || 'Other';
                const amount = Math.abs(transaction.amount);
                
                if (!categoryData[category]) {
                    categoryData[category] = {
                        amounts: [],
                        frequency: 0,
                        total: 0,
                        merchants: new Set()
                    };
                }
                
                categoryData[category].amounts.push(amount);
                categoryData[category].frequency++;
                categoryData[category].total += amount;
                
                if (transaction.merchant) {
                    categoryData[category].merchants.add(transaction.merchant);
                }
            });

        // Calculate statistics for each category
        Object.keys(categoryData).forEach(category => {
            const data = categoryData[category];
            const monthsOfData = Math.min(lookbackMonths, 
                new Set(transactions.map(t => t.date.substring(0, 7))).size);
            
            data.average = monthsOfData > 0 ? data.total / monthsOfData : 0;
            data.median = this.calculateMedian(data.amounts);
            data.standardDeviation = this.calculateStandardDeviation(data.amounts);
            data.trend = this.calculateCategoryTrend(transactions, category, lookbackMonths);
            data.volatility = data.average > 0 ? data.standardDeviation / data.average : 0;
            data.merchantCount = data.merchants.size;
        });

        return categoryData;
    }

    predictCategoryExpense(historical, budgetAmount, monthsAhead) {
        // Use a weighted combination of historical average, trend, and budget
        const trendAdjustment = historical.trend * monthsAhead;
        const predictedFromHistory = historical.average + trendAdjustment;
        
        // Weight towards budget if variance is high
        const budgetWeight = historical.volatility > 0.3 ? 0.4 : 0.2;
        const historyWeight = 1 - budgetWeight;
        
        return (predictedFromHistory * historyWeight) + (budgetAmount * budgetWeight);
    }

    calculateCategoryTrend(transactions, category, months) {
        const monthlyAmounts = {};
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - months);

        transactions
            .filter(t => t.category === category && t.amount < 0 && new Date(t.date) >= cutoffDate)
            .forEach(transaction => {
                const monthKey = transaction.date.substring(0, 7);
                monthlyAmounts[monthKey] = (monthlyAmounts[monthKey] || 0) + Math.abs(transaction.amount);
            });

        const values = Object.values(monthlyAmounts);
        return values.length >= 3 ? this.calculateLinearTrend(values) : 0;
    }

    // === INCOME PREDICTION ===

    async predictIncome(transactions, months) {
        const incomeAnalysis = this.analyzeIncomePatterns(transactions);
        const predictions = [];

        for (let month = 1; month <= months; month++) {
            const baseIncome = incomeAnalysis.monthlyAverage;
            const trendAdjustment = incomeAnalysis.trend * month;
            const seasonalAdjustment = this.getIncomeSeasonalFactor(month);
            
            const predictedIncome = (baseIncome + trendAdjustment) * seasonalAdjustment;
            
            predictions.push({
                month: month,
                date: this.getMonthDate(month),
                predicted: predictedIncome,
                confidence: this.calculateIncomeConfidence(incomeAnalysis, month),
                sources: this.predictIncomeSources(incomeAnalysis, month),
                risks: this.identifyIncomeRisks(incomeAnalysis, month)
            });
        }

        return {
            predictions,
            patterns: incomeAnalysis,
            stability: this.assessIncomeStability(incomeAnalysis),
            recommendations: this.generateIncomeRecommendations(incomeAnalysis)
        };
    }

    analyzeIncomePatterns(transactions, lookbackMonths = 12) {
        const incomeData = {
            monthly: {},
            sources: {},
            total: 0,
            frequency: 0
        };

        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - lookbackMonths);

        transactions
            .filter(t => t.amount > 0 && this.isIncomeTransaction(t) && new Date(t.date) >= cutoffDate)
            .forEach(transaction => {
                const monthKey = transaction.date.substring(0, 7);
                const source = this.categorizeIncomeSource(transaction);
                
                incomeData.monthly[monthKey] = (incomeData.monthly[monthKey] || 0) + transaction.amount;
                incomeData.sources[source] = (incomeData.sources[source] || 0) + transaction.amount;
                incomeData.total += transaction.amount;
                incomeData.frequency++;
            });

        const monthlyValues = Object.values(incomeData.monthly);
        const monthsOfData = monthlyValues.length;

        return {
            monthlyAverage: monthsOfData > 0 ? incomeData.total / monthsOfData : 0,
            trend: monthlyValues.length >= 3 ? this.calculateLinearTrend(monthlyValues) : 0,
            volatility: this.calculateStandardDeviation(monthlyValues) / (incomeData.total / monthsOfData || 1),
            sources: incomeData.sources,
            monthsOfData,
            frequency: incomeData.frequency,
            regularity: this.calculateIncomeRegularity(incomeData.monthly)
        };
    }

    categorizeIncomeSource(transaction) {
        const description = (transaction.description || '').toLowerCase();
        
        if (description.includes('salary') || description.includes('wages') || description.includes('pay')) {
            return 'Salary';
        } else if (description.includes('dividend') || description.includes('investment')) {
            return 'Investment';
        } else if (description.includes('freelance') || description.includes('contract')) {
            return 'Freelance';
        } else if (description.includes('bonus')) {
            return 'Bonus';
        } else if (description.includes('refund')) {
            return 'Refund';
        } else {
            return 'Other';
        }
    }

    calculateIncomeRegularity(monthlyIncome) {
        const months = Object.keys(monthlyIncome).sort();
        if (months.length < 2) return 0;

        let consecutiveMonths = 0;
        let maxConsecutive = 0;

        for (let i = 1; i < months.length; i++) {
            const currentMonth = new Date(months[i] + '-01');
            const previousMonth = new Date(months[i-1] + '-01');
            
            const monthDiff = (currentMonth.getFullYear() - previousMonth.getFullYear()) * 12 
                + (currentMonth.getMonth() - previousMonth.getMonth());
            
            if (monthDiff === 1) {
                consecutiveMonths++;
                maxConsecutive = Math.max(maxConsecutive, consecutiveMonths);
            } else {
                consecutiveMonths = 0;
            }
        }

        return maxConsecutive / months.length;
    }

    // === ACCOUNT BALANCE PREDICTION ===

    async predictAccountBalances(accounts, transactions, months) {
        const balancePredictions = {};

        accounts.forEach(account => {
            const accountTransactions = transactions.filter(t => t.accountId === account.id);
            const cashFlowPattern = this.analyzeAccountCashFlow(accountTransactions);
            const predictions = [];

            let currentBalance = account.balance || 0;

            for (let month = 1; month <= months; month++) {
                const monthlyFlow = this.predictAccountMonthlyFlow(cashFlowPattern, month);
                currentBalance += monthlyFlow.net;

                predictions.push({
                    month: month,
                    date: this.getMonthDate(month),
                    balance: currentBalance,
                    flow: monthlyFlow,
                    alerts: this.generateBalanceAlerts(account, currentBalance, monthlyFlow)
                });
            }

            balancePredictions[account.id] = {
                account: account,
                predictions,
                insights: this.generateAccountInsights(account, predictions, cashFlowPattern)
            };
        });

        return balancePredictions;
    }

    analyzeAccountCashFlow(transactions, lookbackMonths = 6) {
        const monthlyFlow = {};
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - lookbackMonths);

        transactions
            .filter(t => new Date(t.date) >= cutoffDate)
            .forEach(transaction => {
                const monthKey = transaction.date.substring(0, 7);
                
                if (!monthlyFlow[monthKey]) {
                    monthlyFlow[monthKey] = { inflow: 0, outflow: 0, net: 0 };
                }
                
                if (transaction.amount > 0) {
                    monthlyFlow[monthKey].inflow += transaction.amount;
                } else {
                    monthlyFlow[monthKey].outflow += Math.abs(transaction.amount);
                }
                
                monthlyFlow[monthKey].net = monthlyFlow[monthKey].inflow - monthlyFlow[monthKey].outflow;
            });

        const flowValues = Object.values(monthlyFlow);
        const avgMonthlyFlow = flowValues.length > 0 
            ? flowValues.reduce((sum, flow) => sum + flow.net, 0) / flowValues.length
            : 0;

        return {
            monthlyFlow,
            averageNet: avgMonthlyFlow,
            averageInflow: flowValues.length > 0 
                ? flowValues.reduce((sum, flow) => sum + flow.inflow, 0) / flowValues.length
                : 0,
            averageOutflow: flowValues.length > 0 
                ? flowValues.reduce((sum, flow) => sum + flow.outflow, 0) / flowValues.length
                : 0,
            trend: flowValues.length >= 3 
                ? this.calculateLinearTrend(flowValues.map(f => f.net))
                : 0,
            volatility: this.calculateStandardDeviation(flowValues.map(f => f.net))
        };
    }

    predictAccountMonthlyFlow(cashFlowPattern, monthsAhead) {
        const trendAdjustment = cashFlowPattern.trend * monthsAhead;
        const netFlow = cashFlowPattern.averageNet + trendAdjustment;
        
        // Predict inflow and outflow proportionally
        const flowRatio = cashFlowPattern.averageInflow > 0 
            ? cashFlowPattern.averageOutflow / cashFlowPattern.averageInflow
            : 1;

        return {
            inflow: Math.max(0, cashFlowPattern.averageInflow + (trendAdjustment * 0.3)),
            outflow: Math.max(0, cashFlowPattern.averageOutflow + (trendAdjustment * 0.7)),
            net: netFlow
        };
    }

    // === GOAL ACHIEVEMENT PREDICTION ===

    async predictGoalAchievement(goals, transactions, months) {
        const goalPredictions = {};

        goals.forEach(goal => {
            const currentProgress = goal.current || 0;
            const target = goal.target || 0;
            const targetDate = new Date(goal.targetDate);
            const monthsToTarget = this.calculateMonthsToDate(targetDate);
            
            const savingsPattern = this.analyzeGoalSavingsPattern(goal, transactions);
            const predictions = [];

            let projectedAmount = currentProgress;

            for (let month = 1; month <= Math.min(months, monthsToTarget); month++) {
                const monthlyContribution = this.predictMonthlyGoalContribution(savingsPattern, month);
                projectedAmount += monthlyContribution;

                const progressPercentage = target > 0 ? (projectedAmount / target) * 100 : 0;
                const onTrack = this.isGoalOnTrack(projectedAmount, target, month, monthsToTarget);

                predictions.push({
                    month: month,
                    date: this.getMonthDate(month),
                    projected: projectedAmount,
                    contribution: monthlyContribution,
                    progressPercentage: Math.min(progressPercentage, 100),
                    onTrack,
                    shortfall: Math.max(0, target - projectedAmount),
                    recommendedContribution: this.calculateRecommendedContribution(
                        target, projectedAmount, monthsToTarget - month
                    )
                });
            }

            goalPredictions[goal.id] = {
                goal,
                predictions,
                likelihood: this.calculateGoalAchievementLikelihood(predictions, target, monthsToTarget),
                insights: this.generateGoalInsights(goal, predictions, savingsPattern),
                recommendations: this.generateGoalRecommendations(goal, predictions)
            };
        });

        return goalPredictions;
    }

    analyzeGoalSavingsPattern(goal, transactions, lookbackMonths = 6) {
        const goalKeywords = this.extractGoalKeywords(goal.name);
        const relatedTransactions = transactions.filter(t => 
            this.isGoalRelatedTransaction(t, goalKeywords)
        );

        const monthlyContributions = {};
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - lookbackMonths);

        relatedTransactions
            .filter(t => new Date(t.date) >= cutoffDate)
            .forEach(transaction => {
                const monthKey = transaction.date.substring(0, 7);
                monthlyContributions[monthKey] = (monthlyContributions[monthKey] || 0) + Math.abs(transaction.amount);
            });

        const contributionValues = Object.values(monthlyContributions);
        const averageContribution = contributionValues.length > 0 
            ? contributionValues.reduce((sum, val) => sum + val, 0) / contributionValues.length
            : 0;

        return {
            monthlyContributions,
            averageContribution,
            trend: contributionValues.length >= 3 ? this.calculateLinearTrend(contributionValues) : 0,
            consistency: this.calculateContributionConsistency(monthlyContributions),
            lastContribution: contributionValues.length > 0 ? contributionValues[contributionValues.length - 1] : 0
        };
    }

    // === RISK PREDICTION ===

    async predictFinancialRisks(transactions, accounts, months) {
        const riskAnalysis = {
            cashFlowRisks: this.analyzeCashFlowRisks(transactions, months),
            expenseSpikes: this.predictExpenseSpikes(transactions, months),
            incomeDisruption: this.assessIncomeDisruptionRisk(transactions),
            debtRisks: this.analyzeDebtRisks(accounts, transactions),
            liquidityRisks: this.assessLiquidityRisks(accounts, transactions, months),
            overallRisk: 'low' // Will be calculated
        };

        riskAnalysis.overallRisk = this.calculateOverallRiskLevel(riskAnalysis);
        riskAnalysis.mitigation = this.generateRiskMitigationStrategies(riskAnalysis);

        return riskAnalysis;
    }

    analyzeCashFlowRisks(transactions, months) {
        const monthlyNetFlow = this.getMonthlyNetCashFlow(transactions, 6);
        const negativeMonths = monthlyNetFlow.filter(flow => flow < 0).length;
        const volatility = this.calculateStandardDeviation(monthlyNetFlow);
        
        const riskLevel = negativeMonths > monthlyNetFlow.length * 0.4 ? 'high' : 
                         volatility > 1000 ? 'medium' : 'low';

        return {
            level: riskLevel,
            negativeMonthsRatio: negativeMonths / monthlyNetFlow.length,
            volatility,
            trend: this.calculateLinearTrend(monthlyNetFlow),
            predictions: this.predictCashFlowRiskEvents(monthlyNetFlow, months)
        };
    }

    predictExpenseSpikes(transactions, months) {
        const categoryVolatility = this.analyzeCategoryVolatility(transactions);
        const seasonalSpikes = this.identifySeasonalExpenseSpikes(transactions);
        
        const spikePredictions = [];
        
        for (let month = 1; month <= months; month++) {
            const monthDate = this.getMonthDate(month);
            const seasonalRisk = this.getSeasonalSpikeRisk(monthDate, seasonalSpikes);
            const volatilityRisk = this.getVolatilityBasedSpikeRisk(categoryVolatility);
            
            spikePredictions.push({
                month,
                date: monthDate,
                riskLevel: Math.max(seasonalRisk, volatilityRisk),
                categories: this.identifyHighRiskCategories(categoryVolatility),
                estimatedIncrease: this.estimateExpenseIncrease(seasonalRisk, volatilityRisk)
            });
        }

        return {
            predictions: spikePredictions,
            highRiskCategories: Object.keys(categoryVolatility)