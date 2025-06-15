// SmartFinanceAI Supabase API Client
// File: src/api/supabase-client.js

/**
 * Supabase Database Functions for SmartFinanceAI
 * This file contains all database operations
 */

// Import config (make sure this path is correct)
// import { supabase } from '../core/config.js'

// User Profile Functions
export const UserProfileAPI = {
    // Get current user profile
    async getCurrentProfile() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No authenticated user')

            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error fetching user profile:', error)
            throw error
        }
    },

    // Update user profile
    async updateProfile(updates) {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No authenticated user')

            const { data, error } = await supabase
                .from('user_profiles')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', user.id)
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error updating user profile:', error)
            throw error
        }
    },

    // Complete onboarding
    async completeOnboarding() {
        return this.updateProfile({ onboarding_completed: true })
    }
}

// Bank Account Functions
export const BankAccountAPI = {
    // Get all user's bank accounts
    async getAccounts() {
        try {
            const { data, error } = await supabase
                .from('bank_accounts')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })

            if (error) throw error
            return data || []
        } catch (error) {
            console.error('Error fetching bank accounts:', error)
            throw error
        }
    },

    // Add new bank account
    async addAccount(accountData) {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No authenticated user')

            const { data, error } = await supabase
                .from('bank_accounts')
                .insert({
                    user_id: user.id,
                    ...accountData
                })
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error adding bank account:', error)
            throw error
        }
    },

    // Update account balance
    async updateBalance(accountId, newBalance) {
        try {
            const { data, error } = await supabase
                .from('bank_accounts')
                .update({ balance: newBalance, updated_at: new Date().toISOString() })
                .eq('id', accountId)
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error updating account balance:', error)
            throw error
        }
    }
}

// Transaction Functions
export const TransactionAPI = {
    // Get transactions with optional filters
    async getTransactions(filters = {}) {
        try {
            let query = supabase
                .from('transactions')
                .select(`
                    *,
                    bank_accounts(account_name, bank_name),
                    categories(name, color, icon)
                `)
                .order('transaction_date', { ascending: false })

            // Apply filters
            if (filters.accountId) {
                query = query.eq('account_id', filters.accountId)
            }
            if (filters.categoryId) {
                query = query.eq('category_id', filters.categoryId)
            }
            if (filters.startDate) {
                query = query.gte('transaction_date', filters.startDate)
            }
            if (filters.endDate) {
                query = query.lte('transaction_date', filters.endDate)
            }
            if (filters.limit) {
                query = query.limit(filters.limit)
            }

            const { data, error } = await query

            if (error) throw error
            return data || []
        } catch (error) {
            console.error('Error fetching transactions:', error)
            throw error
        }
    },

    // Add new transaction
    async addTransaction(transactionData) {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No authenticated user')

            const { data, error } = await supabase
                .from('transactions')
                .insert({
                    user_id: user.id,
                    ...transactionData
                })
                .select(`
                    *,
                    bank_accounts(account_name, bank_name),
                    categories(name, color, icon)
                `)
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error adding transaction:', error)
            throw error
        }
    },

    // Update transaction
    async updateTransaction(transactionId, updates) {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', transactionId)
                .select(`
                    *,
                    bank_accounts(account_name, bank_name),
                    categories(name, color, icon)
                `)
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error updating transaction:', error)
            throw error
        }
    },

    // Delete transaction
    async deleteTransaction(transactionId) {
        try {
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', transactionId)

            if (error) throw error
            return true
        } catch (error) {
            console.error('Error deleting transaction:', error)
            throw error
        }
    },

    // Get spending by category for a date range
    async getSpendingByCategory(startDate, endDate) {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select(`
                    amount,
                    categories(name, color, icon)
                `)
                .eq('is_income', false)
                .gte('transaction_date', startDate)
                .lte('transaction_date', endDate)

            if (error) throw error

            // Group by category
            const categorySpending = {}
            data.forEach(transaction => {
                const categoryName = transaction.categories?.name || 'Uncategorized'
                if (!categorySpending[categoryName]) {
                    categorySpending[categoryName] = {
                        total: 0,
                        category: transaction.categories
                    }
                }
                categorySpending[categoryName].total += Math.abs(transaction.amount)
            })

            return Object.entries(categorySpending).map(([name, data]) => ({
                category: name,
                amount: data.total,
                color: data.category?.color || '#718096',
                icon: data.category?.icon || '📦'
            }))
        } catch (error) {
            console.error('Error fetching spending by category:', error)
            throw error
        }
    }
}

// Categories Functions
export const CategoryAPI = {
    // Get all categories
    async getCategories() {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name')

            if (error) throw error
            return data || []
        } catch (error) {
            console.error('Error fetching categories:', error)
            throw error
        }
    },

    // Add new category
    async addCategory(categoryData) {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No authenticated user')

            const { data, error } = await supabase
                .from('categories')
                .insert({
                    user_id: user.id,
                    ...categoryData
                })
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error adding category:', error)
            throw error
        }
    }
}

// Financial Goals Functions
export const GoalAPI = {
    // Get all goals
    async getGoals() {
        try {
            const { data, error } = await supabase
                .from('financial_goals')
                .select('*')
                .eq('is_active', true)
                .order('priority', { ascending: true })

            if (error) throw error
            return data || []
        } catch (error) {
            console.error('Error fetching goals:', error)
            throw error
        }
    },

    // Add new goal
    async addGoal(goalData) {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No authenticated user')

            const { data, error } = await supabase
                .from('financial_goals')
                .insert({
                    user_id: user.id,
                    ...goalData
                })
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error adding goal:', error)
            throw error
        }
    },

    // Update goal progress
    async updateGoalProgress(goalId, newAmount) {
        try {
            const { data, error } = await supabase
                .from('financial_goals')
                .update({ 
                    current_amount: newAmount,
                    updated_at: new Date().toISOString()
                })
                .eq('id', goalId)
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error updating goal progress:', error)
            throw error
        }
    }
}

// Dashboard Functions
export const DashboardAPI = {
    // Get dashboard summary data
    async getDashboardData() {
        try {
            const currentMonth = new Date().toISOString().slice(0, 7) + '-01'
            const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().slice(0, 10)

            const [
                profile,
                accounts,
                recentTransactions,
                monthlySpending,
                goals
            ] = await Promise.all([
                UserProfileAPI.getCurrentProfile(),
                BankAccountAPI.getAccounts(),
                TransactionAPI.getTransactions({ limit: 10 }),
                TransactionAPI.getSpendingByCategory(currentMonth, nextMonth),
                GoalAPI.getGoals()
            ])

            // Calculate total balance
            const totalBalance = accounts.reduce((sum, account) => sum + parseFloat(account.balance || 0), 0)

            // Calculate monthly income and expenses
            const monthlyTransactions = await TransactionAPI.getTransactions({
                startDate: currentMonth,
                endDate: nextMonth
            })

            const monthlyIncome = monthlyTransactions
                .filter(t => t.is_income)
                .reduce((sum, t) => sum + parseFloat(t.amount), 0)

            const monthlyExpenses = monthlyTransactions
                .filter(t => !t.is_income)
                .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0)

            return {
                profile,
                accounts,
                recentTransactions,
                monthlySpending,
                goals,
                summary: {
                    totalBalance,
                    monthlyIncome,
                    monthlyExpenses,
                    monthlySavings: monthlyIncome - monthlyExpenses
                }
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
            throw error
        }
    }
}

// Real-time subscriptions
export const RealtimeAPI = {
    // Subscribe to transaction changes
    subscribeToTransactions(callback) {
        return supabase
            .channel('transactions')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'transactions' }, 
                callback
            )
            .subscribe()
    },

    // Subscribe to goal changes
    subscribeToGoals(callback) {
        return supabase
            .channel('goals')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'financial_goals' }, 
                callback
            )
            .subscribe()
    }
}

// Utility functions
export const UtilsAPI = {
    // Format currency
    formatCurrency(amount, currency = 'NZD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount)
    },

    // Calculate goal progress percentage
    calculateGoalProgress(current, target) {
        if (!target || target <= 0) return 0
        return Math.min((current / target) * 100, 100)
    },

    // Get months between dates
    getMonthsBetween(startDate, endDate) {
        const start = new Date(startDate)
        const end = new Date(endDate)
        return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
    }
}