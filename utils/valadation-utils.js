/**
 * ✅ SmartFinanceAI - Validation Utilities
 * 
 * Comprehensive validation system for financial data integrity
 * 
 * Features:
 * - Financial data validation (amounts, dates, accounts)
 * - User input sanitization and validation
 * - Multi-country format validation (dates, phone, postal codes)
 * - Real-time form validation with feedback
 * - Security-focused validation to prevent XSS/injection
 * - Banking data format validation
 */

import { SUPPORTED_CURRENCIES } from './currency-utils.js';

/**
 * Validation error class for detailed error reporting
 */
export class ValidationError extends Error {
    constructor(message, field = null, code = null) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
        this.code = code;
        this.timestamp = new Date().toISOString();
    }
}

/**
 * Validation result class
 */
export class ValidationResult {
    constructor(isValid = true, errors = [], warnings = []) {
        this.isValid = isValid;
        this.errors = errors;
        this.warnings = warnings;
        this.timestamp = new Date().toISOString();
    }

    addError(message, field = null, code = null) {
        this.errors.push({
            message,
            field,
            code,
            severity: 'error'
        });
        this.isValid = false;
    }

    addWarning(message, field = null, code = null) {
        this.warnings.push({
            message,
            field,
            code,
            severity: 'warning'
        });
    }

    hasErrors() {
        return this.errors.length > 0;
    }

    hasWarnings() {
        return this.warnings.length > 0;
    }

    getErrorMessages() {
        return this.errors.map(error => error.message);
    }

    getWarningMessages() {
        return this.warnings.map(warning => warning.message);
    }
}

/**
 * Main Validation Utilities Class
 */
export class ValidationUtils {
    constructor() {
        // Validation patterns for different data types
        this.patterns = {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            phone: {
                US: /^(\+1|1)?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/,
                NZ: /^(\+64|64|0)?[-.\s]?[2-9][0-9]{7,8}$/,
                AU: /^(\+61|61|0)?[-.\s]?[2-9][0-9]{8}$/,
                GB: /^(\+44|44|0)?[-.\s]?[1-9][0-9]{8,9}$/,
                CA: /^(\+1|1)?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/
            },
            postalCode: {
                US: /^[0-9]{5}(-[0-9]{4})?$/,
                NZ: /^[0-9]{4}$/,
                AU: /^[0-9]{4}$/,
                GB: /^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i,
                CA: /^[A-Z][0-9][A-Z]\s?[0-9][A-Z][0-9]$/i
            },
            accountNumber: {
                US: /^[0-9]{8,17}$/,
                NZ: /^[0-9]{15,16}$/,
                AU: /^[0-9]{6,10}$/,
                GB: /^[0-9]{8}$/,
                CA: /^[0-9]{7,12}$/
            },
            routingNumber: {
                US: /^[0-9]{9}$/,
                CA: /^[0-9]{9}$/
            },
            bsb: /^[0-9]{6}$/, // Australia
            sortCode: /^[0-9]{6}$/, // UK
            iban: /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/
        };

        // Security patterns to prevent XSS and injection
        this.securityPatterns = {
            xss: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            sqlInjection: /('|('')|;|(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE)?|INSERT|MERGE|SELECT|UNION|UPDATE)\b))/gi,
            htmlTags: /<[^>]*>/g,
            javascript: /javascript:/gi
        };

        // Country-specific validation rules
        this.countryRules = {
            US: {
                dateFormat: 'MM/DD/YYYY',
                currency: 'USD',
                taxIdPattern: /^[0-9]{3}-[0-9]{2}-[0-9]{4}$/, // SSN
                phoneFormat: '+1 (XXX) XXX-XXXX'
            },
            NZ: {
                dateFormat: 'DD/MM/YYYY',
                currency: 'NZD',
                taxIdPattern: /^[0-9]{8,9}$/, // IRD number
                phoneFormat: '+64 X XXX XXXX'
            },
            AU: {
                dateFormat: 'DD/MM/YYYY',
                currency: 'AUD',
                taxIdPattern: /^[0-9]{9}$/, // TFN
                phoneFormat: '+61 X XXXX XXXX'
            },
            GB: {
                dateFormat: 'DD/MM/YYYY',
                currency: 'GBP',
                taxIdPattern: /^[A-Z]{2}[0-9]{6}[A-Z]$/, // NINO
                phoneFormat: '+44 XXXX XXX XXX'
            },
            CA: {
                dateFormat: 'DD/MM/YYYY',
                currency: 'CAD',
                taxIdPattern: /^[0-9]{3}-[0-9]{3}-[0-9]{3}$/, // SIN
                phoneFormat: '+1 (XXX) XXX-XXXX'
            }
        };
    }

    /**
     * Validate financial amount
     * @param {any} amount - Amount to validate
     * @param {Object} options - Validation options
     */
    validateAmount(amount, options = {}) {
        const result = new ValidationResult();
        const {
            currency = 'USD',
            minValue = 0,
            maxValue = Number.MAX_SAFE_INTEGER,
            allowNegative = false,
            allowZero = true,
            requireCurrency = false
        } = options;

        try {
            // Check if amount exists
            if (amount === null || amount === undefined || amount === '') {
                result.addError('Amount is required', 'amount', 'REQUIRED');
                return result;
            }

            // Convert to number if string
            let numericAmount;
            if (typeof amount === 'string') {
                // Remove currency symbols and formatting
                const cleanAmount = amount.replace(/[^\d.,-]/g, '').replace(/,/g, '');
                numericAmount = parseFloat(cleanAmount);
            } else {
                numericAmount = Number(amount);
            }

            // Check if valid number
            if (isNaN(numericAmount) || !isFinite(numericAmount)) {
                result.addError('Amount must be a valid number', 'amount', 'INVALID_NUMBER');
                return result;
            }

            // Check negative values
            if (!allowNegative && numericAmount < 0) {
                result.addError('Amount cannot be negative', 'amount', 'NEGATIVE_NOT_ALLOWED');
            }

            // Check zero values
            if (!allowZero && numericAmount === 0) {
                result.addError('Amount cannot be zero', 'amount', 'ZERO_NOT_ALLOWED');
            }

            // Check minimum value
            if (numericAmount < minValue) {
                result.addError(`Amount must be at least ${minValue}`, 'amount', 'BELOW_MINIMUM');
            }

            // Check maximum value
            if (numericAmount > maxValue) {
                result.addError(`Amount cannot exceed ${maxValue}`, 'amount', 'ABOVE_MAXIMUM');
            }

            // Validate currency precision
            if (currency && SUPPORTED_CURRENCIES[currency]) {
                const decimals = SUPPORTED_CURRENCIES[currency].decimals;
                const decimalPlaces = (numericAmount.toString().split('.')[1] || '').length;
                
                if (decimalPlaces > decimals) {
                    result.addWarning(
                        `Amount has more decimal places than supported by ${currency}`,
                        'amount',
                        'EXCESS_DECIMALS'
                    );
                }
            }

            // Check for very large amounts (potential data entry errors)
            if (numericAmount > 1000000) {
                result.addWarning(
                    'Amount is very large, please verify',
                    'amount',
                    'LARGE_AMOUNT'
                );
            }

        } catch (error) {
            result.addError(`Amount validation failed: ${error.message}`, 'amount', 'VALIDATION_ERROR');
        }

        return result;
    }

    /**
     * Validate date
     * @param {any} date - Date to validate
     * @param {Object} options - Validation options
     */
    validateDate(date, options = {}) {
        const result = new ValidationResult();
        const {
            minDate = null,
            maxDate = null,
            allowFuture = true,
            allowPast = true,
            format = null,
            country = 'US'
        } = options;

        try {
            // Check if date exists
            if (!date) {
                result.addError('Date is required', 'date', 'REQUIRED');
                return result;
            }

            // Parse date
            let parsedDate;
            if (date instanceof Date) {
                parsedDate = date;
            } else if (typeof date === 'string') {
                // Try to parse with expected format
                if (format) {
                    parsedDate = this.parseDate(date, format);
                } else {
                    parsedDate = new Date(date);
                }
            } else {
                result.addError('Date must be a Date object or string', 'date', 'INVALID_TYPE');
                return result;
            }

            // Check if valid date
            if (isNaN(parsedDate.getTime())) {
                result.addError('Invalid date format', 'date', 'INVALID_FORMAT');
                return result;
            }

            const now = new Date();

            // Check future dates
            if (!allowFuture && parsedDate > now) {
                result.addError('Future dates are not allowed', 'date', 'FUTURE_NOT_ALLOWED');
            }

            // Check past dates
            if (!allowPast && parsedDate < now) {
                result.addError('Past dates are not allowed', 'date', 'PAST_NOT_ALLOWED');
            }

            // Check minimum date
            if (minDate) {
                const minDateObj = minDate instanceof Date ? minDate : new Date(minDate);
                if (parsedDate < minDateObj) {
                    result.addError(
                        `Date must be after ${minDateObj.toLocaleDateString()}`,
                        'date',
                        'BEFORE_MINIMUM'
                    );
                }
            }

            // Check maximum date
            if (maxDate) {
                const maxDateObj = maxDate instanceof Date ? maxDate : new Date(maxDate);
                if (parsedDate > maxDateObj) {
                    result.addError(
                        `Date must be before ${maxDateObj.toLocaleDateString()}`,
                        'date',
                        'AFTER_MAXIMUM'
                    );
                }
            }

            // Check for unrealistic dates (e.g., transactions from 1900)
            const minRealisticDate = new Date('1950-01-01');
            if (parsedDate < minRealisticDate) {
                result.addWarning(
                    'Date seems unusually old, please verify',
                    'date',
                    'UNREALISTIC_DATE'
                );
            }

        } catch (error) {
            result.addError(`Date validation failed: ${error.message}`, 'date', 'VALIDATION_ERROR');
        }

        return result;
    }

    /**
     * Validate email address
     * @param {string} email - Email to validate
     * @param {Object} options - Validation options
     */
    validateEmail(email, options = {}) {
        const result = new ValidationResult();
        const { allowInternational = true, maxLength = 254 } = options;

        try {
            // Check if email exists
            if (!email) {
                result.addError('Email is required', 'email', 'REQUIRED');
                return result;
            }

            // Basic type check
            if (typeof email !== 'string') {
                result.addError('Email must be a string', 'email', 'INVALID_TYPE');
                return result;
            }

            // Length check
            if (email.length > maxLength) {
                result.addError(`Email cannot exceed ${maxLength} characters`, 'email', 'TOO_LONG');
            }

            // Basic format check
            if (!this.patterns.email.test(email)) {
                result.addError('Invalid email format', 'email', 'INVALID_FORMAT');
                return result;
            }

            // Additional security checks
            if (this.containsSecurityRisk(email)) {
                result.addError('Email contains invalid characters', 'email', 'SECURITY_RISK');
            }

            // Check for common typos in domains
            const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
            const domain = email.split('@')[1];
            const suggestions = this.getSimilarDomains(domain, commonDomains);
            
            if (suggestions.length > 0) {
                result.addWarning(
                    `Did you mean: ${suggestions[0]}?`,
                    'email',
                    'POSSIBLE_TYPO'
                );
            }

        } catch (error) {
            result.addError(`Email validation failed: ${error.message}`, 'email', 'VALIDATION_ERROR');
        }

        return result;
    }

    /**
     * Validate phone number
     * @param {string} phone - Phone number to validate
     * @param {Object} options - Validation options
     */
    validatePhone(phone, options = {}) {
        const result = new ValidationResult();
        const { country = 'US', requireCountryCode = false } = options;

        try {
            if (!phone) {
                result.addError('Phone number is required', 'phone', 'REQUIRED');
                return result;
            }

            if (typeof phone !== 'string') {
                result.addError('Phone must be a string', 'phone', 'INVALID_TYPE');
                return result;
            }

            // Clean phone number
            const cleanPhone = phone.replace(/\s+/g, ' ').trim();

            // Check pattern for country
            const pattern = this.patterns.phone[country];
            if (pattern && !pattern.test(cleanPhone)) {
                result.addError(
                    `Invalid phone format for ${country}. Expected: ${this.countryRules[country]?.phoneFormat}`,
                    'phone',
                    'INVALID_FORMAT'
                );
            }

            // Security check
            if (this.containsSecurityRisk(cleanPhone)) {
                result.addError('Phone contains invalid characters', 'phone', 'SECURITY_RISK');
            }

        } catch (error) {
            result.addError(`Phone validation failed: ${error.message}`, 'phone', 'VALIDATION_ERROR');
        }

        return result;
    }

    /**
     * Validate account number
     * @param {string} accountNumber - Account number to validate
     * @param {Object} options - Validation options
     */
    validateAccountNumber(accountNumber, options = {}) {
        const result = new ValidationResult();
        const { country = 'US', bankType = 'standard' } = options;

        try {
            if (!accountNumber) {
                result.addError('Account number is required', 'accountNumber', 'REQUIRED');
                return result;
            }

            if (typeof accountNumber !== 'string') {
                result.addError('Account number must be a string', 'accountNumber', 'INVALID_TYPE');
                return result;
            }

            // Clean account number
            const cleanAccount = accountNumber.replace(/\s+/g, '').trim();

            // Check pattern for country
            const pattern = this.patterns.accountNumber[country];
            if (pattern && !pattern.test(cleanAccount)) {
                result.addError(
                    `Invalid account number format for ${country}`,
                    'accountNumber',
                    'INVALID_FORMAT'
                );
            }

            // Security check
            if (this.containsSecurityRisk(cleanAccount)) {
                result.addError('Account number contains invalid characters', 'accountNumber', 'SECURITY_RISK');
            }

            // Check for obviously fake numbers
            if (this.isFakeAccountNumber(cleanAccount)) {
                result.addWarning(
                    'Account number appears to be a test or placeholder value',
                    'accountNumber',
                    'SUSPICIOUS_FORMAT'
                );
            }

        } catch (error) {
            result.addError(`Account validation failed: ${error.message}`, 'accountNumber', 'VALIDATION_ERROR');
        }

        return result;
    }

    /**
     * Validate transaction data
     * @param {Object} transaction - Transaction object to validate
     * @param {Object} options - Validation options
     */
    validateTransaction(transaction, options = {}) {
        const result = new ValidationResult();
        const { country = 'US', strict = false } = options;

        try {
            if (!transaction || typeof transaction !== 'object') {
                result.addError('Transaction must be an object', 'transaction', 'INVALID_TYPE');
                return result;
            }

            // Validate required fields
            const requiredFields = ['amount', 'date', 'description'];
            for (const field of requiredFields) {
                if (!transaction[field]) {
                    result.addError(`${field} is required`, field, 'REQUIRED');
                }
            }

            // Validate amount
            if (transaction.amount !== undefined) {
                const amountResult = this.validateAmount(transaction.amount, {
                    allowNegative: true,
                    currency: options.currency
                });
                this.mergeResults(result, amountResult);
            }

            // Validate date
            if (transaction.date) {
                const dateResult = this.validateDate(transaction.date, {
                    allowFuture: false,
                    country
                });
                this.mergeResults(result, dateResult);
            }

            // Validate description
            if (transaction.description) {
                const descResult = this.validateDescription(transaction.description);
                this.mergeResults(result, descResult);
            }

            // Validate category if provided
            if (transaction.category) {
                const categoryResult = this.validateCategory(transaction.category);
                this.mergeResults(result, categoryResult);
            }

            // Validate merchant if provided
            if (transaction.merchant) {
                const merchantResult = this.validateMerchant(transaction.merchant);
                this.mergeResults(result, merchantResult);
            }

            // Additional strict validation
            if (strict) {
                // Check for duplicate transaction markers
                if (transaction.id && !this.validateTransactionId(transaction.id)) {
                    result.addError('Invalid transaction ID format', 'id', 'INVALID_FORMAT');
                }

                // Validate account reference
                if (transaction.accountId && !this.validateAccountReference(transaction.accountId)) {
                    result.addError('Invalid account reference', 'accountId', 'INVALID_REFERENCE');
                }
            }

        } catch (error) {
            result.addError(`Transaction validation failed: ${error.message}`, 'transaction', 'VALIDATION_ERROR');
        }

        return result;
    }

    /**
     * Validate financial goal data
     * @param {Object} goal - Goal object to validate
     * @param {Object} options - Validation options
     */
    validateGoal(goal, options = {}) {
        const result = new ValidationResult();
        const { currency = 'USD', strict = false } = options;

        try {
            if (!goal || typeof goal !== 'object') {
                result.addError('Goal must be an object', 'goal', 'INVALID_TYPE');
                return result;
            }

            // Validate required fields
            const requiredFields = ['name', 'targetAmount', 'targetDate'];
            for (const field of requiredFields) {
                if (!goal[field]) {
                    result.addError(`${field} is required`, field, 'REQUIRED');
                }
            }

            // Validate name
            if (goal.name) {
                if (typeof goal.name !== 'string' || goal.name.trim().length === 0) {
                    result.addError('Goal name must be a non-empty string', 'name', 'INVALID_FORMAT');
                } else if (goal.name.length > 100) {
                    result.addError('Goal name cannot exceed 100 characters', 'name', 'TOO_LONG');
                }

                if (this.containsSecurityRisk(goal.name)) {
                    result.addError('Goal name contains invalid characters', 'name', 'SECURITY_RISK');
                }
            }

            // Validate target amount
            if (goal.targetAmount !== undefined) {
                const amountResult = this.validateAmount(goal.targetAmount, {
                    minValue: 1,
                    currency,
                    allowNegative: false,
                    allowZero: false
                });
                this.mergeResults(result, amountResult);
            }

            // Validate current amount
            if (goal.currentAmount !== undefined) {
                const currentAmountResult = this.validateAmount(goal.currentAmount, {
                    minValue: 0,
                    currency,
                    allowNegative: false
                });
                this.mergeResults(result, currentAmountResult);

                // Check logical consistency
                if (goal.targetAmount && goal.currentAmount > goal.targetAmount) {
                    result.addWarning(
                        'Current amount exceeds target amount',
                        'currentAmount',
                        'EXCEEDS_TARGET'
                    );
                }
            }

            // Validate target date
            if (goal.targetDate) {
                const dateResult = this.validateDate(goal.targetDate, {
                    allowPast: false,
                    minDate: new Date()
                });
                this.mergeResults(result, dateResult);
            }

            // Validate priority
            if (goal.priority && !['critical', 'high', 'medium', 'low'].includes(goal.priority)) {
                result.addError(
                    'Priority must be one of: critical, high, medium, low',
                    'priority',
                    'INVALID_VALUE'
                );
            }

            // Validate category
            if (goal.category) {
                const validCategories = ['emergency', 'savings', 'debt', 'investment', 'purchase', 'retirement'];
                if (!validCategories.includes(goal.category)) {
                    result.addError(
                        `Category must be one of: ${validCategories.join(', ')}`,
                        'category',
                        'INVALID_VALUE'
                    );
                }
            }

        } catch (error) {
            result.addError(`Goal validation failed: ${error.message}`, 'goal', 'VALIDATION_ERROR');
        }

        return result;
    }

    /**
     * Validate user input for security risks
     * @param {string} input - Input to validate
     */
    containsSecurityRisk(input) {
        if (typeof input !== 'string') return false;

        // Check for XSS
        if (this.securityPatterns.xss.test(input)) return true;

        // Check for SQL injection
        if (this.securityPatterns.sqlInjection.test(input)) return true;

        // Check for JavaScript protocol
        if (this.securityPatterns.javascript.test(input)) return true;

        return false;
    }

    /**
     * Sanitize user input
     * @param {string} input - Input to sanitize
     * @param {Object} options - Sanitization options
     */
    sanitizeInput(input, options = {}) {
        if (typeof input !== 'string') return input;

        const { allowHtml = false, maxLength = 1000 } = options;

        let sanitized = input.trim();

        // Remove HTML tags unless allowed
        if (!allowHtml) {
            sanitized = sanitized.replace(this.securityPatterns.htmlTags, '');
        }

        // Remove JavaScript protocols
        sanitized = sanitized.replace(this.securityPatterns.javascript, '');

        // Truncate if too long
        if (sanitized.length > maxLength) {
            sanitized = sanitized.substring(0, maxLength);
        }

        return sanitized;
    }

    /**
     * Parse date with specific format
     * @param {string} dateString - Date string to parse
     * @param {string} format - Expected format
     */
    parseDate(dateString, format) {
        // Simple date parsing - in production, use a library like date-fns
        if (format === 'DD/MM/YYYY') {
            const parts = dateString.split('/');
            return new Date(parts[2], parts[1] - 1, parts[0]);
        } else if (format === 'MM/DD/YYYY') {
            const parts = dateString.split('/');
            return new Date(parts[2], parts[0] - 1, parts[1]);
        }
        
        return new Date(dateString);
    }

    /**
     * Check if account number appears fake or test data
     * @param {string} accountNumber - Account number to check
     */
    isFakeAccountNumber(accountNumber) {
        const fakePatterns = [
            /^1{8,}$/, // All ones
            /^0{8,}$/, // All zeros
            /^123456789?$/, // Sequential
            /^9{8,}$/, // All nines
            /^(12345|00000|99999)/  // Common test patterns
        ];

        return fakePatterns.some(pattern => pattern.test(accountNumber));
    }

    /**
     * Get similar domains for typo detection
     * @param {string} domain - Domain to check
     * @param {Array} validDomains - List of valid domains
     */
    getSimilarDomains(domain, validDomains) {
        const suggestions = [];
        const maxDistance = 2;

        for (const validDomain of validDomains) {
            const distance = this.calculateLevenshteinDistance(domain, validDomain);
            if (distance <= maxDistance && distance > 0) {
                suggestions.push(validDomain);
            }
        }

        return suggestions.sort();
    }

    /**
     * Calculate Levenshtein distance between two strings
     * @param {string} str1 - First string
     * @param {string} str2 - Second string
     */
    calculateLevenshteinDistance(str1, str2) {
        const matrix = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }

    /**
     * Validate description field
     * @param {string} description - Description to validate
     */
    validateDescription(description) {
        const result = new ValidationResult();

        if (!description) {
            result.addError('Description is required', 'description', 'REQUIRED');
            return result;
        }

        if (typeof description !== 'string') {
            result.addError('Description must be a string', 'description', 'INVALID_TYPE');
            return result;
        }

        if (description.trim().length === 0) {
            result.addError('Description cannot be empty', 'description', 'EMPTY');
            return result;
        }

        if (description.length > 500) {
            result.addError('Description cannot exceed 500 characters', 'description', 'TOO_LONG');
        }

        if (this.containsSecurityRisk(description)) {
            result.addError('Description contains invalid characters', 'description', 'SECURITY_RISK');
        }

        return result;
    }

    /**
     * Validate category field
     * @param {string} category - Category to validate
     */
    validateCategory(category) {
        const result = new ValidationResult();

        const validCategories = [
            'food_dining', 'transport', 'shopping', 'entertainment', 'bills_utilities',
            'groceries', 'health_medical', 'education', 'travel', 'business',
            'gifts_donations', 'investments', 'insurance', 'taxes', 'other'
        ];

        if (category && !validCategories.includes(category)) {
            result.addWarning(
                `Unusual category: ${category}`,
                'category',
                'UNUSUAL_CATEGORY'
            );
        }

        return result;
    }

    /**
     * Validate merchant field
     * @param {string} merchant - Merchant to validate
     */
    validateMerchant(merchant) {
        const result = new ValidationResult();

        if (merchant && typeof merchant === 'string') {
            if (merchant.length > 100) {
                result.addError('Merchant name cannot exceed 100 characters', 'merchant', 'TOO_LONG');
            }

            if (this.containsSecurityRisk(merchant)) {
                result.addError('Merchant name contains invalid characters', 'merchant', 'SECURITY_RISK');
            }
        }

        return result;
    }

    /**
     * Validate transaction ID
     * @param {string} transactionId - Transaction ID to validate
     */
    validateTransactionId(transactionId) {
        if (!transactionId || typeof transactionId !== 'string') return false;
        
        // Transaction ID should be alphanumeric with possible hyphens/underscores
        const pattern = /^[a-zA-Z0-9_-]+$/;
        return pattern.test(transactionId) && transactionId.length >= 8 && transactionId.length <= 50;
    }

    /**
     * Validate account reference
     * @param {string} accountRef - Account reference to validate
     */
    validateAccountReference(accountRef) {
        if (!accountRef || typeof accountRef !== 'string') return false;
        
        // Account reference should be alphanumeric
        const pattern = /^[a-zA-Z0-9_-]+$/;
        return pattern.test(accountRef) && accountRef.length >= 3 && accountRef.length <= 30;
    }

    /**
     * Merge validation results
     * @param {ValidationResult} target - Target result to merge into
     * @param {ValidationResult} source - Source result to merge from
     */
    mergeResults(target, source) {
        if (!source.isValid) {
            target.isValid = false;
        }

        target.errors.push(...source.errors);
        target.warnings.push(...source.warnings);
    }

    /**
     * Validate entire form data
     * @param {Object} formData - Form data to validate
     * @param {Object} schema - Validation schema
     */
    validateForm(formData, schema) {
        const result = new ValidationResult();

        try {
            for (const [field, rules] of Object.entries(schema)) {
                const value = formData[field];
                const fieldResult = this.validateField(value, rules, field);
                this.mergeResults(result, fieldResult);
            }
        } catch (error) {
            result.addError(`Form validation failed: ${error.message}`, 'form', 'VALIDATION_ERROR');
        }

        return result;
    }

    /**
     * Validate individual field based on rules
     * @param {any} value - Field value
     * @param {Object} rules - Validation rules
     * @param {string} fieldName - Field name
     */
    validateField(value, rules, fieldName) {
        const result = new ValidationResult();

        try {
            // Required validation
            if (rules.required && (value === null || value === undefined || value === '')) {
                result.addError(`${fieldName} is required`, fieldName, 'REQUIRED');
                return result;
            }

            // Skip other validations if field is empty and not required
            if (!rules.required && (value === null || value === undefined || value === '')) {
                return result;
            }

            // Type validation
            if (rules.type) {
                switch (rules.type) {
                    case 'email':
                        const emailResult = this.validateEmail(value, rules.options || {});
                        this.mergeResults(result, emailResult);
                        break;
                    case 'phone':
                        const phoneResult = this.validatePhone(value, rules.options || {});
                        this.mergeResults(result, phoneResult);
                        break;
                    case 'amount':
                        const amountResult = this.validateAmount(value, rules.options || {});
                        this.mergeResults(result, amountResult);
                        break;
                    case 'date':
                        const dateResult = this.validateDate(value, rules.options || {});
                        this.mergeResults(result, dateResult);
                        break;
                    case 'string':
                        if (typeof value !== 'string') {
                            result.addError(`${fieldName} must be a string`, fieldName, 'INVALID_TYPE');
                        }
                        break;
                    case 'number':
                        if (typeof value !== 'number' || isNaN(value)) {
                            result.addError(`${fieldName} must be a number`, fieldName, 'INVALID_TYPE');
                        }
                        break;
                }
            }

            // Length validation
            if (rules.minLength && value.length < rules.minLength) {
                result.addError(
                    `${fieldName} must be at least ${rules.minLength} characters`,
                    fieldName,
                    'TOO_SHORT'
                );
            }

            if (rules.maxLength && value.length > rules.maxLength) {
                result.addError(
                    `${fieldName} cannot exceed ${rules.maxLength} characters`,
                    fieldName,
                    'TOO_LONG'
                );
            }

            // Pattern validation
            if (rules.pattern && !rules.pattern.test(value)) {
                result.addError(
                    `${fieldName} format is invalid`,
                    fieldName,
                    'INVALID_FORMAT'
                );
            }

            // Custom validation function
            if (rules.custom && typeof rules.custom === 'function') {
                const customResult = rules.custom(value, fieldName);
                if (customResult && !customResult.isValid) {
                    this.mergeResults(result, customResult);
                }
            }

            // Security validation
            if (rules.checkSecurity !== false && this.containsSecurityRisk(value)) {
                result.addError(
                    `${fieldName} contains invalid characters`,
                    fieldName,
                    'SECURITY_RISK'
                );
            }

        } catch (error) {
            result.addError(
                `Field validation failed: ${error.message}`,
                fieldName,
                'VALIDATION_ERROR'
            );
        }

        return result;
    }

    /**
     * Create validation schema for common forms
     */
    static createSchema(formType, options = {}) {
        const { country = 'US' } = options;

        const schemas = {
            registration: {
                email: {
                    required: true,
                    type: 'email',
                    maxLength: 254
                },
                password: {
                    required: true,
                    type: 'string',
                    minLength: 8,
                    maxLength: 128,
                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
                },
                firstName: {
                    required: true,
                    type: 'string',
                    minLength: 1,
                    maxLength: 50
                },
                lastName: {
                    required: true,
                    type: 'string',
                    minLength: 1,
                    maxLength: 50
                },
                phone: {
                    required: false,
                    type: 'phone',
                    options: { country }
                }
            },
            account: {
                accountName: {
                    required: true,
                    type: 'string',
                    minLength: 1,
                    maxLength: 100
                },
                accountType: {
                    required: true,
                    type: 'string',
                    pattern: /^(checking|savings|credit|investment|loan)$/
                },
                bankName: {
                    required: true,
                    type: 'string',
                    minLength: 1,
                    maxLength: 100
                },
                accountNumber: {
                    required: false,
                    type: 'string',
                    custom: (value) => {
                        const utils = new ValidationUtils();
                        return utils.validateAccountNumber(value, { country });
                    }
                },
                initialBalance: {
                    required: false,
                    type: 'amount',
                    options: { allowNegative: true }
                }
            },
            transaction: {
                amount: {
                    required: true,
                    type: 'amount',
                    options: { allowNegative: true }
                },
                date: {
                    required: true,
                    type: 'date',
                    options: { allowFuture: false }
                },
                description: {
                    required: true,
                    type: 'string',
                    minLength: 1,
                    maxLength: 500
                },
                category: {
                    required: false,
                    type: 'string',
                    maxLength: 50
                },
                merchant: {
                    required: false,
                    type: 'string',
                    maxLength: 100
                }
            },
            goal: {
                name: {
                    required: true,
                    type: 'string',
                    minLength: 1,
                    maxLength: 100
                },
                targetAmount: {
                    required: true,
                    type: 'amount',
                    options: { minValue: 1, allowNegative: false, allowZero: false }
                },
                targetDate: {
                    required: true,
                    type: 'date',
                    options: { allowPast: false }
                },
                currentAmount: {
                    required: false,
                    type: 'amount',
                    options: { minValue: 0, allowNegative: false }
                },
                category: {
                    required: false,
                    type: 'string',
                    pattern: /^(emergency|savings|debt|investment|purchase|retirement)$/
                },
                priority: {
                    required: false,
                    type: 'string',
                    pattern: /^(critical|high|medium|low)$/
                }
            }
        };

        return schemas[formType] || {};
    }

    /**
     * Real-time field validation for forms
     * @param {HTMLElement} field - Form field element
     * @param {Object} rules - Validation rules
     */
    validateFieldRealTime(field, rules) {
        const result = this.validateField(field.value, rules, field.name);
        
        // Update field UI
        this.updateFieldUI(field, result);
        
        return result;
    }

    /**
     * Update field UI based on validation result
     * @param {HTMLElement} field - Form field element
     * @param {ValidationResult} result - Validation result
     */
    updateFieldUI(field, result) {
        // Remove existing validation classes
        field.classList.remove('valid', 'invalid', 'warning');
        
        // Find or create error message container
        let errorContainer = field.parentNode.querySelector('.field-errors');
        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.className = 'field-errors';
            field.parentNode.appendChild(errorContainer);
        }

        if (result.hasErrors()) {
            field.classList.add('invalid');
            errorContainer.innerHTML = result.getErrorMessages()
                .map(msg => `<span class="error">${msg}</span>`)
                .join('');
        } else if (result.hasWarnings()) {
            field.classList.add('warning');
            errorContainer.innerHTML = result.getWarningMessages()
                .map(msg => `<span class="warning">${msg}</span>`)
                .join('');
        } else {
            field.classList.add('valid');
            errorContainer.innerHTML = '';
        }
    }

    /**
     * Validate file upload
     * @param {File} file - File to validate
     * @param {Object} options - Validation options
     */
    validateFile(file, options = {}) {
        const result = new ValidationResult();
        const {
            allowedTypes = ['text/csv'],
            maxSize = 5 * 1024 * 1024, // 5MB
            allowedExtensions = ['.csv']
        } = options;

        if (!file) {
            result.addError('File is required', 'file', 'REQUIRED');
            return result;
        }

        // Check file type
        if (!allowedTypes.includes(file.type)) {
            result.addError(
                `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
                'file',
                'INVALID_TYPE'
            );
        }

        // Check file extension
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        if (!allowedExtensions.includes(extension)) {
            result.addError(
                `File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`,
                'file',
                'INVALID_EXTENSION'
            );
        }

        // Check file size
        if (file.size > maxSize) {
            result.addError(
                `File too large. Maximum size: ${this.formatFileSize(maxSize)}`,
                'file',
                'TOO_LARGE'
            );
        }

        // Check for suspicious file names
        if (this.containsSecurityRisk(file.name)) {
            result.addError('File name contains invalid characters', 'file', 'SECURITY_RISK');
        }

        return result;
    }

    /**
     * Format file size for display
     * @param {number} bytes - File size in bytes
     */
    formatFileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }

    /**
     * Get validation summary for multiple results
     * @param {Array} results - Array of validation results
     */
    getValidationSummary(results) {
        const summary = {
            isValid: true,
            totalErrors: 0,
            totalWarnings: 0,
            fields: {},
            timestamp: new Date().toISOString()
        };

        for (const result of results) {
            if (!result.isValid) {
                summary.isValid = false;
            }
            
            summary.totalErrors += result.errors.length;
            summary.totalWarnings += result.warnings.length;

            // Group errors and warnings by field
            for (const error of result.errors) {
                if (!summary.fields[error.field]) {
                    summary.fields[error.field] = { errors: [], warnings: [] };
                }
                summary.fields[error.field].errors.push(error);
            }

            for (const warning of result.warnings) {
                if (!summary.fields[warning.field]) {
                    summary.fields[warning.field] = { errors: [], warnings: [] };
                }
                summary.fields[warning.field].warnings.push(warning);
            }
        }

        return summary;
    }
}

// Export singleton instance
export const validationUtils = new ValidationUtils();

// Export commonly used validation functions
export const validateEmail = (email, options) => validationUtils.validateEmail(email, options);
export const validateAmount = (amount, options) => validationUtils.validateAmount(amount, options);
export const validateDate = (date, options) => validationUtils.validateDate(date, options);
export const validateTransaction = (transaction, options) => validationUtils.validateTransaction(transaction, options);
export const validateGoal = (goal, options) => validationUtils.validateGoal(goal, options);
export const sanitizeInput = (input, options) => validationUtils.sanitizeInput(input, options);

// Export validation schema creator
export const createValidationSchema = ValidationUtils.createSchema;