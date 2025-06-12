/**
 * FinanceOS - Financial Health Score System
 * Advanced scoring algorithm with personalized action plans
 * Based on your real financial situation: -$3,607 deficit, $0.17 emergency fund
 */

class FinancialHealthScorer {
    constructor() {
        this.version = '1.0.0';
        this.maxScore = 100;
        this.lastCalculated = null;
        this.scoreHistory = [];
        
        // Weight distributions for scoring components
        this.weights = {
            emergencyFund: 25,      // 25 points - Critical foundation
            cashFlow: 20,           // 20 points - Monthly sustainability  
            debtManagement: 20,     // 20 points - Debt health
            savingsRate: 15,        // 15 points - Future building
            budgetDiscipline: 10,   // 10 points - Spending control
            goalProgress: 10        // 10 points - Achievement tracking
        };
    }

    /**
     * Calculate comprehensive financial health score
     * @param {Object} financialData - Complete financial snapshot
     * @returns {Object} Health score with detailed breakdown
     */
    calculateHealthScore(financialData) {
        const components = this.calculateAllComponents(financialData);
        const totalScore = this.calculateTotalScore(components);
        const assessment = this.generateAssessment(totalScore, components);
        const actionPlan = this.generateActionPlan(components, financialData);
        
        const result = {
            score: Math.round(totalScore),
            grade: this.getGrade(totalScore),
            status: this.getStatus(totalScore),
            components: components,
            assessment: assessment,
            actionPlan: actionPlan,
            calculatedAt: new Date().toISOString(),
            improvementPotential: this.calculateImprovementPotential(components)
        };
        
        this.saveToHistory(result);
        this.lastCalculated = result;
        
        return result;
    }

    /**
     * Calculate all scoring components
     */
    calculateAllComponents(data) {
        return {
            emergencyFund: this.scoreEmergencyFund(data),
            cashFlow: this.scoreCashFlow(data),
            debtManagement: this.scoreDebtManagement(data),
            savingsRate: this.scoreSavingsRate(data),
            budgetDiscipline: this.scoreBudgetDiscipline(data),
            goalProgress: this.scoreGoalProgress(data)
        };
    }

    /**
     * Emergency Fund Scoring (25 points max)
     * Critical for financial stability
     */
    scoreEmergencyFund(data) {
        const { emergencyFund = 0.17, monthlyExpenses = 9911 } = data;
        const monthsCovered = emergencyFund / monthlyExpenses;
        const targetMonths = 3; // NZ standard recommendation
        
        // Progressive scoring: 0 months = 0 points, 3+ months = 25 points
        const rawScore = Math.min(monthsCovered / targetMonths, 1) * this.weights.emergencyFund;
        
        return {
            score: Math.round(rawScore),
            maxScore: this.weights.emergencyFund,
            monthsCovered: monthsCovered,
            targetMonths: targetMonths,
            shortfall: Math.max(0, targetMonths * monthlyExpenses - emergencyFund),
            status: this.getComponentStatus(rawScore, this.weights.emergencyFund),
            recommendations: this.getEmergencyFundRecommendations(monthsCovered, data)
        };
    }

    /**
     * Cash Flow Scoring (20 points max)  
     * Monthly income vs expenses sustainability
     */
    scoreCashFlow(data) {
        const { monthlyIncome = 6304, monthlyExpenses = 9911 } = data;
        const netFlow = monthlyIncome - monthlyExpenses;
        const deficitRatio = Math.abs(netFlow) / monthlyIncome;
        
        let score;
        if (netFlow >= 0) {
            // Positive cash flow: full points
            score = this.weights.cashFlow;
        } else {
            // Negative cash flow: reduce points based on deficit severity
            score = Math.max(0, this.weights.cashFlow * (1 - Math.min(deficitRatio, 1)));
        }
        
        return {
            score: Math.round(score),
            maxScore: this.weights.cashFlow,
            netFlow: netFlow,
            deficitRatio: deficitRatio,
            sustainabilityMonths: this.calculateSustainabilityMonths(data),
            status: this.getComponentStatus(score, this.weights.cashFlow),
            recommendations: this.getCashFlowRecommendations(netFlow, data)
        };
    }

    /**
     * Debt Management Scoring (20 points max)
     * Debt-to-income ratio and payment efficiency
     */
    scoreDebtManagement(data) {
        const { 
            monthlyIncome = 6304,
            creditCardDebt = 3251.30,
            mortgageDebt = 271600.02,
            monthlyDebtPayments = 2070 // Mortgage payments
        } = data;
        
        const totalDebt = creditCardDebt + mortgageDebt;
        const annualIncome = monthlyIncome * 12;
        const debtToIncomeRatio = totalDebt / annualIncome;
        const paymentToIncomeRatio = monthlyDebtPayments / monthlyIncome;
        
        // Score based on debt ratios (lower is better)
        // Mortgage debt is considered "good debt" so weighted less heavily
        const creditCardRatio = creditCardDebt / annualIncome;
        let score = this.weights.debtManagement;
        
        // Penalize high credit card debt more heavily
        if (creditCardRatio > 0.1) {
            score *= (1 - Math.min(creditCardRatio - 0.1, 0.5));
        }
        
        // Penalize if debt payments are too high percentage of income
        if (paymentToIncomeRatio > 0.4) {
            score *= (1 - Math.min(paymentToIncomeRatio - 0.4, 0.3));
        }
        
        return {
            score: Math.round(score),
            maxScore: this.weights.debtManagement,
            totalDebt: totalDebt,
            debtToIncomeRatio: debtToIncomeRatio,
            creditCardDebt: creditCardDebt,
            paymentToIncomeRatio: paymentToIncomeRatio,
            status: this.getComponentStatus(score, this.weights.debtManagement),
            recommendations: this.getDebtRecommendations(data)
        };
    }

    /**
     * Savings Rate Scoring (15 points max)
     * Percentage of income being saved/invested
     */
    scoreSavingsRate(data) {
        const { 
            monthlyIncome = 6304,
            monthlySavings = 271, // Sharesies investment
            monthlyGoalContributions = 300 // Education savings
        } = data;
        
        const totalSavings = monthlySavings + monthlyGoalContributions;
        const savingsRate = totalSavings / monthlyIncome;
        const targetRate = 0.20; // 20% savings rate target
        
        const score = Math.min(savingsRate / targetRate, 1) * this.weights.savingsRate;
        
        return {
            score: Math.round(score),
            maxScore: this.weights.savingsRate,
            savingsRate: savingsRate,
            targetRate: targetRate,
            monthlySavings: totalSavings,
            annualSavings: totalSavings * 12,
            status: this.getComponentStatus(score, this.weights.savingsRate),
            recommendations: this.getSavingsRecommendations(savingsRate, data)
        };
    }

    /**
     * Budget Discipline Scoring (10 points max)
     * How well actual spending matches budgeted amounts
     */
    scoreBudgetDiscipline(data) {
        const { budgetCategories = {} } = data;
        
        let totalBudgeted = 0;
        let totalActual = 0;
        let categoriesOverBudget = 0;
        let totalCategories = 0;
        
        // Analyze budget vs actual for each category
        Object.entries(budgetCategories).forEach(([category, amounts]) => {
            if (amounts.budgeted && amounts.actual) {
                totalBudgeted += amounts.budgeted;
                totalActual += amounts.actual;
                totalCategories++;
                
                if (amounts.actual > amounts.budgeted) {
                    categoriesOverBudget++;
                }
            }
        });
        
        const overbudgetRatio = totalCategories > 0 ? categoriesOverBudget / totalCategories : 1;
        const spendingRatio = totalBudgeted > 0 ? totalActual / totalBudgeted : 1;
        
        // Score higher for staying within budget
        let score = this.weights.budgetDiscipline;
        if (spendingRatio > 1) {
            score *= Math.max(0, 2 - spendingRatio); // Penalize overspending
        }
        score *= (1 - overbudgetRatio * 0.5); // Penalize multiple categories over budget
        
        return {
            score: Math.round(score),
            maxScore: this.weights.budgetDiscipline,
            spendingRatio: spendingRatio,
            categoriesOverBudget: categoriesOverBudget,
            totalCategories: totalCategories,
            adherenceRate: 1 - overbudgetRatio,
            status: this.getComponentStatus(score, this.weights.budgetDiscipline),
            recommendations: this.getBudgetRecommendations(spendingRatio, overbudgetRatio)
        };
    }

    /**
     * Goal Progress Scoring (10 points max)
     * Progress toward financial goals
     */
    scoreGoalProgress(data) {
        const { goals = [] } = data;
        
        if (goals.length === 0) {
            return {
                score: 0,
                maxScore: this.weights.goalProgress,
                averageProgress: 0,
                goalsOnTrack: 0,
                totalGoals: 0,
                status: 'poor',
                recommendations: ['Set up at least 3 financial goals', 'Start with emergency fund goal']
            };
        }
        
        let totalProgress = 0;
        let goalsOnTrack = 0;
        
        goals.forEach(goal => {
            const progress = Math.min(goal.current / goal.target, 1);
            totalProgress += progress;
            
            // Check if goal is on track (simplified timeline check)
            const targetDate = new Date(goal.targetDate);
            const today = new Date();
            const timeProgress = (today - new Date(goal.createdDate)) / (targetDate - new Date(goal.createdDate));
            
            if (progress >= timeProgress * 0.8) { // 80% of expected progress
                goalsOnTrack++;
            }
        });
        
        const averageProgress = totalProgress / goals.length;
        const score = averageProgress * this.weights.goalProgress;
        
        return {
            score: Math.round(score),
            maxScore: this.weights.goalProgress,
            averageProgress: averageProgress,
            goalsOnTrack: goalsOnTrack,
            totalGoals: goals.length,
            status: this.getComponentStatus(score, this.weights.goalProgress),
            recommendations: this.getGoalRecommendations(averageProgress, goalsOnTrack, goals.length)
        };
    }

    /**
     * Generate overall assessment
     */
    generateAssessment(totalScore, components) {
        const criticalIssues = [];
        const strengths = [];
        const opportunities = [];
        
        // Identify critical issues (score < 20% of max)
        Object.entries(components).forEach(([key, component]) => {
            const percentage = (component.score / component.maxScore) * 100;
            
            if (percentage < 20) {
                criticalIssues.push({
                    component: key,
                    severity: 'critical',
                    score: component.score,
                    maxScore: component.maxScore,
                    impact: 'high'
                });
            } else if (percentage > 80) {
                strengths.push({
                    component: key,
                    score: component.score,
                    maxScore: component.maxScore
                });
            } else if (percentage < 60) {
                opportunities.push({
                    component: key,
                    score: component.score,
                    maxScore: component.maxScore,
                    improvementPotential: component.maxScore - component.score
                });
            }
        });
        
        return {
            overallScore: totalScore,
            grade: this.getGrade(totalScore),
            criticalIssues: criticalIssues,
            strengths: strengths,
            opportunities: opportunities,
            summary: this.generateAssessmentSummary(totalScore, criticalIssues, strengths)
        };
    }

    /**
     * Generate personalized action plan
     */
    generateActionPlan(components, financialData) {
        const actions = {
            immediate: [], // Next 7 days
            shortTerm: [], // Next 30 days  
            mediumTerm: [], // Next 90 days
            longTerm: []   // Next 12 months
        };
        
        // Emergency Fund Actions (Critical Priority)
        if (components.emergencyFund.score < 5) {
            actions.immediate.push({
                priority: 'critical',
                action: 'Transfer Emergency Fund',
                description: 'Move $15,000 from House Kitty to establish emergency fund',
                impact: '+20 health score points',
                timeRequired: '1 hour',
                difficulty: 'easy',
                category: 'emergencyFund'
            });
        }
        
        // Cash Flow Actions (High Priority)
        if (components.cashFlow.score < 10) {
            actions.shortTerm.push({
                priority: 'high',
                action: 'Subscription Audit',
                description: 'Cancel Sky Network ($163/month) and switch to streaming alternatives',
                impact: '+5 health score points, $1,956 annual savings',
                timeRequired: '2 hours',
                difficulty: 'easy',
                category: 'cashFlow'
            });
            
            actions.shortTerm.push({
                priority: 'high', 
                action: 'Dining Budget Optimization',
                description: 'Reduce dining out from $280 to $200 per month',
                impact: '+3 health score points, $960 annual savings',
                timeRequired: 'Ongoing',
                difficulty: 'medium',
                category: 'cashFlow'
            });
        }
        
        // Debt Management Actions
        if (components.debtManagement.score < 15) {
            actions.mediumTerm.push({
                priority: 'medium',
                action: 'Credit Card Payoff Strategy',
                description: 'Create accelerated payoff plan for $3,251 Visa debt',
                impact: '+5 health score points, $500+ interest savings',
                timeRequired: '6 months',
                difficulty: 'medium',
                category: 'debtManagement'
            });
        }
        
        // Budget Discipline Actions
        if (components.budgetDiscipline.score < 8) {
            actions.mediumTerm.push({
                priority: 'medium',
                action: 'Automated Budget Tracking',
                description: 'Set up automated spending alerts and weekly budget reviews',
                impact: '+3 health score points',
                timeRequired: '1 week setup',
                difficulty: 'easy',
                category: 'budgetDiscipline'
            });
        }
        
        // Goal Progress Actions
        if (components.goalProgress.score < 8) {
            actions.longTerm.push({
                priority: 'low',
                action: 'Goal Optimization',
                description: 'Review and optimize all financial goals with AI assistance',
                impact: '+2 health score points',
                timeRequired: '2 hours',
                difficulty: 'easy',
                category: 'goalProgress'
            });
        }
        
        return {
            actions: actions,
            priorityScore: this.calculateActionPriority(actions),
            estimatedImpact: this.calculateEstimatedImpact(actions),
            timeline: this.generateTimeline(actions)
        };
    }

    /**
     * Helper methods for scoring and assessment
     */
    calculateTotalScore(components) {
        return Object.values(components).reduce((total, component) => total + component.score, 0);
    }

    getGrade(score) {
        if (score >= 90) return 'A+';
        if (score >= 80) return 'A';
        if (score >= 70) return 'B';
        if (score >= 60) return 'C';
        if (score >= 50) return 'D';
        return 'F';
    }

    getStatus(score) {
        if (score >= 80) return 'excellent';
        if (score >= 60) return 'good';
        if (score >= 40) return 'fair';
        if (score >= 20) return 'poor';
        return 'critical';
    }

    getComponentStatus(score, maxScore) {
        const percentage = (score / maxScore) * 100;
        if (percentage >= 80) return 'excellent';
        if (percentage >= 60) return 'good';
        if (percentage >= 40) return 'fair';
        if (percentage >= 20) return 'poor';
        return 'critical';
    }

    /**
     * Specific recommendation generators
     */
    getEmergencyFundRecommendations(monthsCovered, data) {
        if (monthsCovered < 0.1) {
            return [
                'URGENT: Use House Kitty to establish emergency fund immediately',
                'Transfer $15,000 from House Kitty ($65,357 available)',
                'This single action improves your financial security dramatically'
            ];
        } else if (monthsCovered < 1) {
            return [
                'Build emergency fund to 1 month of expenses',
                'Set up automatic transfers of $500/month',
                'Consider using part of House Kitty as temporary emergency fund'
            ];
        } else if (monthsCovered < 3) {
            return [
                'Continue building to 3 months of expenses',
                'Increase monthly contributions to emergency fund',
                'You\'re on the right track, keep going!'
            ];
        }
        return ['Emergency fund is well-funded', 'Consider increasing to 6 months for extra security'];
    }

    getCashFlowRecommendations(netFlow, data) {
        if (netFlow < -3000) {
            return [
                'CRITICAL: Implement immediate cost-cutting measures',
                'Cancel non-essential subscriptions (Sky Network: $163/month)',
                'Reduce dining out and discretionary spending',
                'Consider additional income sources',
                'Your current deficit of $3,607/month is unsustainable'
            ];
        } else if (netFlow < 0) {
            return [
                'Work toward positive cash flow',
                'Review and optimize all spending categories',
                'Look for additional income opportunities'
            ];
        } else if (netFlow < 500) {
            return [
                'Build larger monthly surplus for financial security',
                'Optimize spending to increase surplus',
                'Consider investing additional surplus'
            ];
        }
        return ['Excellent cash flow management', 'Consider increasing investment contributions'];
    }

    getDebtRecommendations(data) {
        const recommendations = [];
        
        if (data.creditCardDebt > 3000) {
            recommendations.push('Focus on paying off high-interest credit card debt');
            recommendations.push('Consider debt avalanche method (highest interest first)');
            recommendations.push('Avoid adding new credit card debt');
        }
        
        if (data.creditCardDebt > 0) {
            recommendations.push('Pay more than minimum on credit cards');
            recommendations.push('Consider using part of House Kitty for immediate payoff');
        }
        
        return recommendations.length ? recommendations : ['Debt management is on track'];
    }

    getSavingsRecommendations(savingsRate, data) {
        if (savingsRate < 0.1) {
            return [
                'Start with a 10% savings rate goal',
                'Automate savings to make it easier',
                'Pay yourself first before other expenses'
            ];
        } else if (savingsRate < 0.15) {
            return [
                'Increase savings rate to 15%',
                'Look for areas to reduce expenses',
                'Consider increasing investment contributions'
            ];
        } else if (savingsRate < 0.2) {
            return [
                'Work toward 20% savings rate',
                'You\'re doing well, keep increasing gradually',
                'Consider diversifying investment options'
            ];
        }
        return ['Excellent savings rate', 'Consider advanced investment strategies'];
    }

    getBudgetRecommendations(spendingRatio, overbudgetRatio) {
        if (spendingRatio > 1.2) {
            return [
                'Significantly overspending budget',
                'Review and adjust budget categories',
                'Implement weekly spending check-ins',
                'Consider envelope budgeting method'
            ];
        } else if (spendingRatio > 1.05) {
            return [
                'Slightly over budget - tighten spending',
                'Focus on biggest overspend categories',
                'Set up spending alerts'
            ];
        } else if (overbudgetRatio > 0.5) {
            return [
                'Too many categories over budget',
                'Review budget realism',
                'Focus on 1-2 categories at a time'
            ];
        }
        return ['Budget discipline is good', 'Keep monitoring regularly'];
    }

    getGoalRecommendations(averageProgress, goalsOnTrack, totalGoals) {
        if (totalGoals < 3) {
            return [
                'Set up at least 3 financial goals',
                'Include emergency fund, debt payoff, and savings goals',
                'Use SMART goal framework'
            ];
        } else if (averageProgress < 0.3) {
            return [
                'Increase progress on existing goals',
                'Review goal timelines and adjust if needed',
                'Consider smaller, more achievable milestones'
            ];
        } else if (goalsOnTrack < totalGoals * 0.5) {
            return [
                'Focus on getting more goals on track',
                'Review goal priorities and timelines',
                'Consider adjusting unrealistic goals'
            ];
        }
        return ['Goal progress is good', 'Keep up the momentum'];
    }

    /**
     * Utility methods
     */
    calculateSustainabilityMonths(data) {
        const { houseKitty = 65357, monthlyDeficit = 3607 } = data;
        if (monthlyDeficit <= 0) return Infinity;
        return Math.floor(houseKitty / monthlyDeficit);
    }

    calculateImprovementPotential(components) {
        const potential = {};
        let maxImpactAction = null;
        let maxImpact = 0;
        
        Object.entries(components).forEach(([key, component]) => {
            const improvementPotential = component.maxScore - component.score;
            potential[key] = {
                points: improvementPotential,
                percentage: (improvementPotential / component.maxScore) * 100
            };
            
            if (improvementPotential > maxImpact) {
                maxImpact = improvementPotential;
                maxImpactAction = key;
            }
        });
        
        return {
            byComponent: potential,
            maxImpactComponent: maxImpactAction,
            maxImpactPoints: maxImpact,
            totalPotential: Object.values(potential).reduce((sum, p) => sum + p.points, 0)
        };
    }

    generateAssessmentSummary(totalScore, criticalIssues, strengths) {
        let summary = `Your financial health score is ${Math.round(totalScore)}/100 (${this.getGrade(totalScore)}).`;
        
        if (criticalIssues.length > 0) {
            summary += ` You have ${criticalIssues.length} critical area(s) needing immediate attention.`;
        }
        
        if (strengths.length > 0) {
            summary += ` Your strength(s) include ${strengths.map(s => s.component).join(', ')}.`;
        }
        
        return summary;
    }

    calculateActionPriority(actions) {
        const priorities = { critical: 3, high: 2, medium: 1, low: 0 };
        let totalPriority = 0;
        let totalActions = 0;
        
        Object.values(actions).forEach(actionList => {
            actionList.forEach(action => {
                totalPriority += priorities[action.priority] || 0;
                totalActions++;
            });
        });
        
        return totalActions > 0 ? totalPriority / totalActions : 0;
    }

    calculateEstimatedImpact(actions) {
        let totalImpact = 0;
        
        Object.values(actions).forEach(actionList => {
            actionList.forEach(action => {
                // Extract numeric impact from description
                const impactMatch = action.impact.match(/\+(\d+)/);
                if (impactMatch) {
                    totalImpact += parseInt(impactMatch[1]);
                }
            });
        });
        
        return totalImpact;
    }

    generateTimeline(actions) {
        return {
            immediate: actions.immediate.length,
            shortTerm: actions.shortTerm.length,
            mediumTerm: actions.mediumTerm.length,
            longTerm: actions.longTerm.length,
            totalActions: Object.values(actions).reduce((sum, list) => sum + list.length, 0)
        };
    }

    /**
     * Save score to history for tracking improvement
     */
    saveToHistory(scoreResult) {
        this.scoreHistory.push({
            date: scoreResult.calculatedAt,
            score: scoreResult.score,
            grade: scoreResult.grade,
            components: Object.fromEntries(
                Object.entries(scoreResult.components).map(([key, comp]) => [key, comp.score])
            )
        });
        
        // Keep only last 12 scores
        if (this.scoreHistory.length > 12) {
            this.scoreHistory = this.scoreHistory.slice(-12);
        }
        
        // Save to localStorage
        localStorage.setItem('financeos_health_history', JSON.stringify(this.scoreHistory));
    }

    /**
     * Get score history from localStorage
     */
    loadHistory() {
        try {
            const saved = localStorage.getItem('financeos_health_history');
            if (saved) {
                this.scoreHistory = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Failed to load health score history:', error);
            this.scoreHistory = [];
        }
    }

    /**
     * Get improvement since last calculation
     */
    getImprovement() {
        if (this.scoreHistory.length < 2) return null;
        
        const current = this.scoreHistory[this.scoreHistory.length - 1];
        const previous = this.scoreHistory[this.scoreHistory.length - 2];
        
        return {
            scoreDelta: current.score - previous.score,
            gradeDelta: current.grade !== previous.grade ? `${previous.grade} → ${current.grade}` : null,
            timeframe: this.calculateTimeframe(previous.date, current.date)
        };
    }

    calculateTimeframe(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.floor((end - start) / (1000 * 60 * 60 * 24));
        
        if (days < 7) return `${days} day(s)`;
        if (days < 30) return `${Math.floor(days / 7)} week(s)`;
        return `${Math.floor(days / 30)} month(s)`;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FinancialHealthScorer;
} else if (typeof window !== 'undefined') {
    window.FinancialHealthScorer = FinancialHealthScorer;
}

/**
 * Usage Example:
 * 
 * const scorer = new FinancialHealthScorer();
 * scorer.loadHistory();
 * 
 * const yourFinancialData = {
 *   emergencyFund: 0.17,
 *   monthlyIncome: 6304,
 *   monthlyExpenses: 9911,
 *   creditCardDebt: 3251.30,
 *   mortgageDebt: 271600.02,
 *   monthlySavings: 271,
 *   monthlyGoalContributions: 300,
 *   houseKitty: 65357,
 *   goals: [
 *     { current: 0.17, target: 15000, targetDate: '2025-12-31', createdDate: '2024-12-01' },
 *     { current: 6748.70, target: 10000, targetDate: '2025-06-30', createdDate: '2024-12-01' }
 *   ],
 *   budgetCategories: {
 *     groceries: { budgeted: 550, actual: 620 },
 *     dining: { budgeted: 250, actual: 280 }
 *   }
 * };
 * 
 * const healthScore = scorer.calculateHealthScore(yourFinancialData);
 * console.log(`Your financial health score: ${healthScore.score}/100 (${healthScore.grade})`);
 * console.log('Immediate actions:', healthScore.actionPlan.actions.immediate);
 */