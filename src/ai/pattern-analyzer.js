/**
 * AI Pattern Analyzer - Advanced Spending Pattern Analysis
 * Identifies trends, anomalies, and behavioral patterns in financial data
 * Part of SmartFinanceAI Global SaaS Platform
 */

class PatternAnalyzer {
    constructor() {
        this.patterns = new Map();
        this.anomalies = [];
        this.trends = new Map();
        this.insights = [];
        this.confidence_threshold = 0.7;
        this.min_data_points = 5;
        
        // Pattern types we can detect
        this.pattern_types = {
            RECURRING: 'recurring',
            SEASONAL: 'seasonal',
            TRENDING: 'trending',
            ANOMALY: 'anomaly',
            BEHAVIORAL: 'behavioral',
            CATEGORY_SHIFT: 'category_shift'
        };
        
        // Initialize pattern detection algorithms
        this.init();
    }

    init() {
        console.log('🔍 PatternAnalyzer initialized - Ready to analyze spending patterns');
        this.loadStoredPatterns();
    }

    /**
     * Main analysis entry point
     * Analyzes all patterns in user's financial data
     */
    async analyzeAllPatterns(transactions, timeframe = 'last_6_months') {
        if (!transactions || transactions.length === 0) {
            return this.createEmptyAnalysis();
        }

        console.log(`🔍 Starting comprehensive pattern analysis for ${transactions.length} transactions`);
        
        const analysis = {
            summary: {},
            patterns: {},
            anomalies: [],
            insights: [],
            recommendations: [],
            confidence_score: 0,
            analyzed_at: new Date().toISOString()
        };

        try {
            // Filter transactions for timeframe
            const filteredTransactions = this.filterByTimeframe(transactions, timeframe);
            
            if (filteredTransactions.length < this.min_data_points) {
                return this.createInsufficientDataAnalysis(filteredTransactions.length);
            }

            // Run all pattern detection algorithms
            analysis.patterns.recurring = await this.detectRecurringPayments(filteredTransactions);
            analysis.patterns.seasonal = await this.detectSeasonalPatterns(filteredTransactions);
            analysis.patterns.spending_trends = await this.analyzeSpendingTrends(filteredTransactions);
            analysis.patterns.category_behaviors = await this.analyzeCategoryBehaviors(filteredTransactions);
            analysis.patterns.time_patterns = await this.analyzeTimePatterns(filteredTransactions);
            analysis.patterns.merchant_patterns = await this.analyzeMerchantPatterns(filteredTransactions);
            
            // Detect anomalies and outliers
            analysis.anomalies = await this.detectAnomalies(filteredTransactions);
            
            // Generate behavioral insights
            analysis.insights = await this.generateInsights(filteredTransactions, analysis.patterns);
            
            // Create actionable recommendations
            analysis.recommendations = await this.generateRecommendations(analysis);
            
            // Calculate overall confidence score
            analysis.confidence_score = this.calculateConfidenceScore(analysis);
            
            // Generate summary
            analysis.summary = this.generateAnalysisSummary(analysis, filteredTransactions);
            
            // Store patterns for future use
            this.storePatterns(analysis.patterns);
            
            console.log(`✅ Pattern analysis complete - Confidence: ${Math.round(analysis.confidence_score * 100)}%`);
            return analysis;
            
        } catch (error) {
            console.error('❌ Error in pattern analysis:', error);
            return this.createErrorAnalysis(error);
        }
    }

    /**
     * Detect recurring payments and subscriptions
     */
    async detectRecurringPayments(transactions) {
        console.log('🔄 Detecting recurring payments...');
        
        const recurring_patterns = new Map();
        const merchant_frequency = new Map();
        
        // Group transactions by merchant and amount
        transactions.forEach(tx => {
            const key = this.createMerchantKey(tx.merchant, tx.amount);
            if (!merchant_frequency.has(key)) {
                merchant_frequency.set(key, []);
            }
            merchant_frequency.get(key).push(tx);
        });
        
        // Analyze each merchant group for recurring patterns
        for (const [key, txs] of merchant_frequency) {
            if (txs.length >= 3) { // Need at least 3 occurrences
                const pattern = this.analyzeRecurrencePattern(txs);
                if (pattern.confidence > this.confidence_threshold) {
                    recurring_patterns.set(key, pattern);
                }
            }
        }
        
        return {
            detected_patterns: Array.from(recurring_patterns.values()),
            total_recurring_amount: this.calculateTotalRecurringAmount(recurring_patterns),
            confidence: this.calculateAverageConfidence(recurring_patterns),
            recommendations: this.generateRecurringRecommendations(recurring_patterns)
        };
    }

    /**
     * Detect seasonal spending patterns
     */
    async detectSeasonalPatterns(transactions) {
        console.log('🌱 Detecting seasonal patterns...');
        
        const monthly_spending = this.groupByMonth(transactions);
        const category_seasonality = this.analyzeCategorySeasonality(transactions);
        
        const seasonal_patterns = {
            monthly_trends: this.identifyMonthlyTrends(monthly_spending),
            category_seasonality: category_seasonality,
            holiday_impact: this.analyzeHolidayImpact(transactions),
            confidence: 0
        };
        
        seasonal_patterns.confidence = this.calculateSeasonalConfidence(seasonal_patterns);
        
        return seasonal_patterns;
    }

    /**
     * Analyze overall spending trends
     */
    async analyzeSpendingTrends(transactions) {
        console.log('📈 Analyzing spending trends...');
        
        // Group by time periods
        const weekly_data = this.groupByWeek(transactions);
        const monthly_data = this.groupByMonth(transactions);
        const daily_data = this.groupByDay(transactions);
        
        return {
            overall_trend: this.calculateTrendDirection(monthly_data),
            volatility: this.calculateSpendingVolatility(daily_data),
            growth_rate: this.calculateGrowthRate(monthly_data),
            trend_strength: this.calculateTrendStrength(monthly_data),
            weekly_patterns: this.analyzeWeeklyPatterns(weekly_data),
            predictions: this.generateSpendingPredictions(monthly_data)
        };
    }

    /**
     * Analyze spending behavior by category
     */
    async analyzeCategoryBehaviors(transactions) {
        console.log('🏷️ Analyzing category behaviors...');
        
        const category_data = this.groupByCategory(transactions);
        const behaviors = new Map();
        
        for (const [category, txs] of category_data) {
            behaviors.set(category, {
                frequency: txs.length,
                total_amount: txs.reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
                average_amount: txs.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) / txs.length,
                trend: this.calculateCategoryTrend(txs),
                regularity: this.calculateCategoryRegularity(txs),
                growth_rate: this.calculateCategoryGrowthRate(txs),
                outliers: this.findCategoryOutliers(txs)
            });
        }
        
        return {
            categories: Object.fromEntries(behaviors),
            dominant_categories: this.identifyDominantCategories(behaviors),
            emerging_categories: this.identifyEmergingCategories(behaviors),
            declining_categories: this.identifyDecliningCategories(behaviors)
        };
    }

    /**
     * Analyze time-based spending patterns
     */
    async analyzeTimePatterns(transactions) {
        console.log('🕐 Analyzing time patterns...');
        
        const hour_patterns = this.analyzeHourlyPatterns(transactions);
        const day_patterns = this.analyzeDayOfWeekPatterns(transactions);
        const date_patterns = this.analyzeDayOfMonthPatterns(transactions);
        
        return {
            hourly_patterns: hour_patterns,
            day_of_week_patterns: day_patterns,
            day_of_month_patterns: date_patterns,
            peak_spending_times: this.identifyPeakSpendingTimes(hour_patterns, day_patterns),
            time_based_recommendations: this.generateTimeBasedRecommendations(hour_patterns, day_patterns)
        };
    }

    /**
     * Analyze merchant-specific patterns
     */
    async analyzeMerchantPatterns(transactions) {
        console.log('🏪 Analyzing merchant patterns...');
        
        const merchant_data = this.groupByMerchant(transactions);
        const patterns = new Map();
        
        for (const [merchant, txs] of merchant_data) {
            if (txs.length >= 2) { // Need at least 2 transactions
                patterns.set(merchant, {
                    frequency: txs.length,
                    total_spent: txs.reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
                    average_amount: txs.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) / txs.length,
                    amount_variance: this.calculateAmountVariance(txs),
                    frequency_pattern: this.analyzeMerchantFrequency(txs),
                    loyalty_score: this.calculateMerchantLoyalty(txs, transactions.length)
                });
            }
        }
        
        return {
            merchants: Object.fromEntries(patterns),
            top_merchants: this.identifyTopMerchants(patterns),
            loyalty_merchants: this.identifyLoyaltyMerchants(patterns),
            occasional_merchants: this.identifyOccasionalMerchants(patterns)
        };
    }

    /**
     * Detect anomalies and unusual transactions
     */
    async detectAnomalies(transactions) {
        console.log('🚨 Detecting anomalies...');
        
        const anomalies = [];
        
        // Amount-based anomalies
        const amount_outliers = this.detectAmountOutliers(transactions);
        anomalies.push(...amount_outliers);
        
        // Frequency-based anomalies
        const frequency_anomalies = this.detectFrequencyAnomalies(transactions);
        anomalies.push(...frequency_anomalies);
        
        // Time-based anomalies
        const time_anomalies = this.detectTimeAnomalies(transactions);
        anomalies.push(...time_anomalies);
        
        // Category-based anomalies
        const category_anomalies = this.detectCategoryAnomalies(transactions);
        anomalies.push(...category_anomalies);
        
        // Merchant-based anomalies
        const merchant_anomalies = this.detectMerchantAnomalies(transactions);
        anomalies.push(...merchant_anomalies);
        
        return anomalies.sort((a, b) => b.severity - a.severity);
    }

    /**
     * Generate behavioral insights from patterns
     */
    async generateInsights(transactions, patterns) {
        console.log('💡 Generating behavioral insights...');
        
        const insights = [];
        
        // Spending behavior insights
        insights.push(...this.generateSpendingBehaviorInsights(transactions, patterns));
        
        // Budget adherence insights
        insights.push(...this.generateBudgetInsights(transactions, patterns));
        
        // Goal progress insights
        insights.push(...this.generateGoalProgressInsights(transactions, patterns));
        
        // Financial health insights
        insights.push(...this.generateFinancialHealthInsights(transactions, patterns));
        
        // Optimization opportunities
        insights.push(...this.generateOptimizationInsights(transactions, patterns));
        
        return insights.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Generate actionable recommendations
     */
    async generateRecommendations(analysis) {
        console.log('📋 Generating recommendations...');
        
        const recommendations = [];
        
        // Budget optimization recommendations
        recommendations.push(...this.generateBudgetRecommendations(analysis));
        
        // Savings opportunities
        recommendations.push(...this.generateSavingsRecommendations(analysis));
        
        // Subscription management
        recommendations.push(...this.generateSubscriptionRecommendations(analysis));
        
        // Spending control recommendations
        recommendations.push(...this.generateSpendingControlRecommendations(analysis));
        
        // Goal achievement recommendations
        recommendations.push(...this.generateGoalRecommendations(analysis));
        
        return recommendations.sort((a, b) => b.impact - a.impact);
    }

    // ============ UTILITY METHODS ============

    /**
     * Create merchant key for grouping
     */
    createMerchantKey(merchant, amount) {
        const normalizedMerchant = this.normalizeMerchantName(merchant);
        const roundedAmount = Math.round(amount * 100); // Cents precision
        return `${normalizedMerchant}_${roundedAmount}`;
    }

    /**
     * Normalize merchant names for pattern matching
     */
    normalizeMerchantName(merchant) {
        if (!merchant) return 'unknown';
        
        return merchant
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '') // Remove special characters
            .replace(/\s+/g, '_') // Replace spaces with underscores
            .trim();
    }

    /**
     * Analyze recurrence pattern for a group of transactions
     */
    analyzeRecurrencePattern(transactions) {
        if (transactions.length < 3) {
            return { confidence: 0 };
        }
        
        // Sort by date
        const sorted_txs = transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Calculate intervals between transactions
        const intervals = [];
        for (let i = 1; i < sorted_txs.length; i++) {
            const days = this.daysBetween(sorted_txs[i-1].date, sorted_txs[i].date);
            intervals.push(days);
        }
        
        // Analyze interval consistency
        const avg_interval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        const interval_variance = this.calculateVariance(intervals);
        const consistency = 1 / (1 + interval_variance / avg_interval);
        
        // Determine pattern type
        let pattern_type = 'irregular';
        if (Math.abs(avg_interval - 30) < 5) pattern_type = 'monthly';
        else if (Math.abs(avg_interval - 7) < 2) pattern_type = 'weekly';
        else if (Math.abs(avg_interval - 14) < 3) pattern_type = 'bi-weekly';
        else if (Math.abs(avg_interval - 365/12) < 5) pattern_type = 'monthly';
        
        return {
            merchant: sorted_txs[0].merchant,
            amount: sorted_txs[0].amount,
            frequency: sorted_txs.length,
            pattern_type: pattern_type,
            average_interval_days: Math.round(avg_interval),
            consistency: consistency,
            confidence: Math.min(consistency * (sorted_txs.length / 5), 1),
            next_expected_date: this.calculateNextExpectedDate(sorted_txs[sorted_txs.length - 1].date, avg_interval),
            total_annual_cost: Math.abs(sorted_txs[0].amount) * (365 / avg_interval)
        };
    }

    /**
     * Calculate days between two dates
     */
    daysBetween(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return Math.abs((d2 - d1) / (1000 * 60 * 60 * 24));
    }

    /**
     * Calculate statistical variance
     */
    calculateVariance(numbers) {
        if (numbers.length < 2) return 0;
        
        const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
        const squared_diffs = numbers.map(num => Math.pow(num - mean, 2));
        return squared_diffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
    }

    /**
     * Calculate next expected date for recurring payment
     */
    calculateNextExpectedDate(lastDate, intervalDays) {
        const last = new Date(lastDate);
        const next = new Date(last.getTime() + (intervalDays * 24 * 60 * 60 * 1000));
        return next.toISOString().split('T')[0];
    }

    /**
     * Group transactions by time periods
     */
    groupByMonth(transactions) {
        const groups = new Map();
        
        transactions.forEach(tx => {
            const date = new Date(tx.date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(tx);
        });
        
        return groups;
    }

    groupByWeek(transactions) {
        const groups = new Map();
        
        transactions.forEach(tx => {
            const date = new Date(tx.date);
            const weekStart = this.getWeekStart(date);
            const key = weekStart.toISOString().split('T')[0];
            
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(tx);
        });
        
        return groups;
    }

    groupByDay(transactions) {
        const groups = new Map();
        
        transactions.forEach(tx => {
            const key = tx.date.split('T')[0]; // Get date part only
            
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(tx);
        });
        
        return groups;
    }

    groupByCategory(transactions) {
        const groups = new Map();
        
        transactions.forEach(tx => {
            const category = tx.category || 'uncategorized';
            
            if (!groups.has(category)) {
                groups.set(category, []);
            }
            groups.get(category).push(tx);
        });
        
        return groups;
    }

    groupByMerchant(transactions) {
        const groups = new Map();
        
        transactions.forEach(tx => {
            const merchant = this.normalizeMerchantName(tx.merchant);
            
            if (!groups.has(merchant)) {
                groups.set(merchant, []);
            }
            groups.get(merchant).push(tx);
        });
        
        return groups;
    }

    /**
     * Get start of week for a date
     */
    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }

    /**
     * Filter transactions by timeframe
     */
    filterByTimeframe(transactions, timeframe) {
        const now = new Date();
        let startDate;
        
        switch (timeframe) {
            case 'last_month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                break;
            case 'last_3_months':
                startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                break;
            case 'last_6_months':
                startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
                break;
            case 'last_year':
                startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        }
        
        return transactions.filter(tx => new Date(tx.date) >= startDate);
    }

    /**
     * Detect amount-based outliers using statistical methods
     */
    detectAmountOutliers(transactions) {
        const amounts = transactions.map(tx => Math.abs(tx.amount));
        const { mean, std } = this.calculateMeanAndStd(amounts);
        const threshold = 2.5; // Standard deviations
        
        const outliers = [];
        
        transactions.forEach(tx => {
            const amount = Math.abs(tx.amount);
            const z_score = Math.abs(amount - mean) / std;
            
            if (z_score > threshold) {
                outliers.push({
                    type: 'amount_outlier',
                    transaction: tx,
                    severity: Math.min(z_score / threshold, 3), // Cap at 3
                    description: `Unusually ${amount > mean ? 'high' : 'low'} amount: ${this.formatCurrency(amount)}`,
                    confidence: Math.min(z_score / threshold, 1)
                });
            }
        });
        
        return outliers;
    }

    /**
     * Calculate mean and standard deviation
     */
    calculateMeanAndStd(numbers) {
        const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
        const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
        const std = Math.sqrt(variance);
        
        return { mean, std };
    }

    /**
     * Generate spending behavior insights
     */
    generateSpendingBehaviorInsights(transactions, patterns) {
        const insights = [];
        
        // Analyze spending velocity
        const recentSpending = this.calculateRecentSpendingVelocity(transactions);
        if (recentSpending.acceleration > 0.2) {
            insights.push({
                type: 'spending_acceleration',
                title: 'Spending is Accelerating',
                description: `Your spending has increased by ${Math.round(recentSpending.acceleration * 100)}% recently`,
                priority: 8,
                actionable: true,
                category: 'spending_behavior'
            });
        }
        
        // Analyze category concentration
        const categoryConcentration = this.analyzeCategoryConcentration(transactions);
        if (categoryConcentration.concentration > 0.6) {
            insights.push({
                type: 'category_concentration',
                title: 'Spending Highly Concentrated',
                description: `${Math.round(categoryConcentration.concentration * 100)}% of spending is in ${categoryConcentration.dominant_category}`,
                priority: 6,
                actionable: true,
                category: 'spending_behavior'
            });
        }
        
        return insights;
    }

    /**
     * Calculate recent spending velocity and acceleration
     */
    calculateRecentSpendingVelocity(transactions) {
        const now = new Date();
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
        
        const recentSpending = transactions
            .filter(tx => new Date(tx.date) >= oneMonthAgo)
            .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
            
        const previousSpending = transactions
            .filter(tx => new Date(tx.date) >= twoMonthsAgo && new Date(tx.date) < oneMonthAgo)
            .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        
        const acceleration = previousSpending > 0 ? (recentSpending - previousSpending) / previousSpending : 0;
        
        return {
            recent_amount: recentSpending,
            previous_amount: previousSpending,
            acceleration: acceleration
        };
    }

    /**
     * Analyze category concentration
     */
    analyzeCategoryConcentration(transactions) {
        const categoryTotals = new Map();
        let totalSpending = 0;
        
        transactions.forEach(tx => {
            const category = tx.category || 'uncategorized';
            const amount = Math.abs(tx.amount);
            
            categoryTotals.set(category, (categoryTotals.get(category) || 0) + amount);
            totalSpending += amount;
        });
        
        // Find dominant category
        let maxAmount = 0;
        let dominantCategory = '';
        
        for (const [category, amount] of categoryTotals) {
            if (amount > maxAmount) {
                maxAmount = amount;
                dominantCategory = category;
            }
        }
        
        return {
            concentration: maxAmount / totalSpending,
            dominant_category: dominantCategory,
            dominant_amount: maxAmount,
            total_spending: totalSpending
        };
    }

    /**
     * Format currency for display
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    /**
     * Store patterns for future reference
     */
    storePatterns(patterns) {
        try {
            const patternData = {
                patterns: patterns,
                stored_at: new Date().toISOString(),
                version: '1.0'
            };
            
            localStorage.setItem('spending_patterns', JSON.stringify(patternData));
            console.log('✅ Patterns stored successfully');
        } catch (error) {
            console.error('❌ Error storing patterns:', error);
        }
    }

    /**
     * Load previously stored patterns
     */
    loadStoredPatterns() {
        try {
            const stored = localStorage.getItem('spending_patterns');
            if (stored) {
                const data = JSON.parse(stored);
                this.patterns = new Map(Object.entries(data.patterns || {}));
                console.log('✅ Stored patterns loaded');
            }
        } catch (error) {
            console.error('❌ Error loading stored patterns:', error);
        }
    }

    /**
     * Calculate overall confidence score for analysis
     */
    calculateConfidenceScore(analysis) {
        let totalConfidence = 0;
        let confidenceCount = 0;
        
        // Factor in pattern confidences
        Object.values(analysis.patterns).forEach(pattern => {
            if (pattern.confidence !== undefined) {
                totalConfidence += pattern.confidence;
                confidenceCount++;
            }
        });
        
        // Factor in anomaly detection confidence
        if (analysis.anomalies.length > 0) {
            const avgAnomalyConfidence = analysis.anomalies.reduce((sum, anomaly) => 
                sum + (anomaly.confidence || 0.5), 0) / analysis.anomalies.length;
            totalConfidence += avgAnomalyConfidence;
            confidenceCount++;
        }
        
        return confidenceCount > 0 ? totalConfidence / confidenceCount : 0.5;
    }

    /**
     * Generate analysis summary
     */
    generateAnalysisSummary(analysis, transactions) {
        const totalTransactions = transactions.length;
        const totalAmount = transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        const avgTransaction = totalAmount / totalTransactions;
        
        return {
            total_transactions: totalTransactions,
            total_amount: totalAmount,
            average_transaction: avgTransaction,
            analysis_period: this.getAnalysisPeriod(transactions),
            patterns_detected: Object.keys(analysis.patterns).length,
            anomalies_detected: analysis.anomalies.length,
            insights_generated: analysis.insights.length,
            recommendations_count: analysis.recommendations.length,
            confidence_level: this.getConfidenceLevel(analysis.confidence_score)
        };
    }

    /**
     * Get confidence level description
     */
    getConfidenceLevel(score) {
        if (score >= 0.8) return 'high';
        if (score >= 0.6) return 'medium';
        if (score >= 0.4) return 'low';
        return 'very_low';
    }

    /**
     * Get analysis period from transactions
     */
    getAnalysisPeriod(transactions) {
        if (transactions.length === 0) return null;
        
        const dates = transactions.map(tx => new Date(tx.date)).sort((a, b) => a - b);
        const start = dates[0];
        const end = dates[dates.length - 1];
        
        return {
            start_date: start.toISOString().split('T')[0],
            end_date: end.toISOString().split('T')[0],
            days: Math.ceil((end - start) / (1000 * 60 * 60 * 24))
        };
    }

    /**
     * Create empty analysis result
     */
    createEmptyAnalysis() {
        return {
            summary: { total_transactions: 0 },
            patterns: {},
            anomalies: [],
            insights: [],
            recommendations: [],
            confidence_score: 0,
            analyzed_at: new Date().toISOString(),
            status: 'no_data'
        };
    }

    /**
     * Create insufficient data analysis result
     */
    createInsufficientDataAnalysis(transactionCount) {
        return {
            summary: { 
                total_transactions: transactionCount,
                message: `