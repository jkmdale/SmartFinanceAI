/**
 * SmartFinanceAI Merchant Matching Engine
 * Advanced merchant name standardization and category detection
 */

class MerchantMatcher {
    constructor() {
        this.merchantDatabase = new Map();
        this.categoryRules = new Map();
        this.cache = new Map();
        this.learningMode = true;
        
        this.initializeMerchantDatabase();
        this.initializeCategoryRules();
    }
    
    /**
     * Initialize comprehensive merchant database
     */
    initializeMerchantDatabase() {
        // Global retail chains
        this.addMerchantGroup('McDonald\'s', [
            'MCD', 'MCDONALDS', 'MC DONALDS', 'MCDONALD\'S',
            'MCDONALDS RESTAURANT', 'MCDONALDS #'
        ], 'dining', 'fast_food');
        
        this.addMerchantGroup('Starbucks', [
            'STARBUCKS', 'SBUX', 'STARBUCKS COFFEE',
            'STARBUCKS STORE', 'STARBUCKS #'
        ], 'dining', 'coffee');
        
        this.addMerchantGroup('Walmart', [
            'WALMART', 'WAL-MART', 'WM SUPERCENTER',
            'WALMART SUPERCENTER', 'WALMART STORE'
        ], 'shopping', 'groceries');
        
        this.addMerchantGroup('Amazon', [
            'AMAZON', 'AMAZON.COM', 'AMZ*', 'AMAZON MARKETPLACE',
            'AMAZON PRIME', 'AMAZON WEB SERVICES'
        ], 'shopping', 'online');
        
        this.addMerchantGroup('Target', [
            'TARGET', 'TGT', 'TARGET STORE', 'TARGET T-'
        ], 'shopping', 'retail');
        
        this.addMerchantGroup('Uber', [
            'UBER', 'UBER TRIP', 'UBER *TRIP', 'UBER BV'
        ], 'transportation', 'rideshare');
        
        this.addMerchantGroup('Netflix', [
            'NETFLIX', 'NETFLIX.COM', 'NETFLIX MONTHLY'
        ], 'entertainment', 'streaming');
        
        this.addMerchantGroup('Spotify', [
            'SPOTIFY', 'SPOTIFY P', 'SPOTIFY PREMIUM'
        ], 'entertainment', 'music');
        
        // Banking and financial
        this.addMerchantGroup('ATM Withdrawal', [
            'ATM WITHDRAWAL', 'ATM CASH', 'CASH WITHDRAWAL',
            'ATM FEE', 'WITHDRAWAL'
        ], 'banking', 'atm');
        
        this.addMerchantGroup('Bank Transfer', [
            'BANK TRANSFER', 'WIRE TRANSFER', 'ACH TRANSFER',
            'ONLINE TRANSFER', 'MOBILE TRANSFER'
        ], 'banking', 'transfer');
        
        // Utilities
        this.addMerchantGroup('Electric Company', [
            'ELECTRIC', 'ELECTRICITY', 'POWER COMPANY',
            'ENERGY BILL', 'ELECTRIC BILL'
        ], 'utilities', 'electricity');
        
        this.addMerchantGroup('Gas Company', [
            'GAS COMPANY', 'NATURAL GAS', 'GAS BILL',
            'GAS UTILITY'
        ], 'utilities', 'gas');
        
        this.addMerchantGroup('Water Company', [
            'WATER', 'WATER BILL', 'WATER UTILITY',
            'WATER SERVICES'
        ], 'utilities', 'water');
        
        // Country-specific merchants
        this.initializeCountrySpecificMerchants();
    }
    
    /**
     * Initialize country-specific merchant patterns
     */
    initializeCountrySpecificMerchants() {
        // New Zealand
        this.addMerchantGroup('Countdown NZ', [
            'COUNTDOWN', 'COUNTDOWN SUPERMARKET'
        ], 'shopping', 'groceries', 'NZ');
        
        this.addMerchantGroup('Pak\'nSave', [
            'PAKNSAVE', 'PAK N SAVE', 'PAK\'NSAVE'
        ], 'shopping', 'groceries', 'NZ');
        
        this.addMerchantGroup('New World', [
            'NEW WORLD', 'NEWWORLD'
        ], 'shopping', 'groceries', 'NZ');
        
        this.addMerchantGroup('Z Energy', [
            'Z ENERGY', 'Z STATION', 'Z'
        ], 'transportation', 'fuel', 'NZ');
        
        // Australia
        this.addMerchantGroup('Woolworths AU', [
            'WOOLWORTHS', 'WOOLIES', 'WOW'
        ], 'shopping', 'groceries', 'AU');
        
        this.addMerchantGroup('Coles', [
            'COLES', 'COLES SUPERMARKET'
        ], 'shopping', 'groceries', 'AU');
        
        this.addMerchantGroup('IGA Australia', [
            'IGA', 'IGA SUPERMARKET'
        ], 'shopping', 'groceries', 'AU');
        
        // United Kingdom
        this.addMerchantGroup('Tesco', [
            'TESCO', 'TESCO STORES', 'TESCO EXPRESS'
        ], 'shopping', 'groceries', 'GB');
        
        this.addMerchantGroup('Sainsbury\'s', [
            'SAINSBURYS', 'SAINSBURY\'S', 'J SAINSBURY'
        ], 'shopping', 'groceries', 'GB');
        
        this.addMerchantGroup('ASDA', [
            'ASDA', 'ASDA STORES'
        ], 'shopping', 'groceries', 'GB');
        
        // United States
        this.addMerchantGroup('Whole Foods', [
            'WHOLE FOODS', 'WFM', 'WHOLE FOODS MARKET'
        ], 'shopping', 'groceries', 'US');
        
        this.addMerchantGroup('Kroger', [
            'KROGER', 'KROGER STORES'
        ], 'shopping', 'groceries', 'US');
        
        // Canada
        this.addMerchantGroup('Loblaws', [
            'LOBLAWS', 'LOBLAW', 'LOBLAWS SUPERMARKET'
        ], 'shopping', 'groceries', 'CA');
        
        this.addMerchantGroup('Metro Canada', [
            'METRO', 'METRO STORE'
        ], 'shopping', 'groceries', 'CA');
    }
    
    /**
     * Initialize category detection rules
     */
    initializeCategoryRules() {
        // Keyword-based category rules
        this.categoryRules.set('dining', {
            keywords: [
                'restaurant', 'cafe', 'coffee', 'pizza', 'burger',
                'food', 'dining', 'bar', 'pub', 'grill', 'kitchen',
                'bakery', 'deli', 'bistro', 'brewery', 'winery'
            ],
            patterns: [
                /\b(restaurant|cafe|coffee|pizza|burger)\b/i,
                /\b(food|dining|bar|pub|grill)\b/i
            ]
        });
        
        this.categoryRules.set('shopping', {
            keywords: [
                'store', 'shop', 'market', 'mall', 'retail',
                'supermarket', 'grocery', 'department', 'outlet'
            ],
            patterns: [
                /\b(store|shop|market|mall)\b/i,
                /\b(supermarket|grocery|retail)\b/i
            ]
        });
        
        this.categoryRules.set('transportation', {
            keywords: [
                'gas', 'fuel', 'petrol', 'station', 'uber', 'lyft',
                'taxi', 'metro', 'transit', 'parking', 'toll'
            ],
            patterns: [
                /\b(gas|fuel|petrol|station)\b/i,
                /\b(uber|lyft|taxi|metro)\b/i
            ]
        });
        
        this.categoryRules.set('utilities', {
            keywords: [
                'electric', 'gas', 'water', 'internet', 'phone',
                'cable', 'utility', 'power', 'energy'
            ],
            patterns: [
                /\b(electric|gas|water|utility)\b/i,
                /\b(internet|phone|cable|power)\b/i
            ]
        });
        
        this.categoryRules.set('healthcare', {
            keywords: [
                'medical', 'doctor', 'hospital', 'pharmacy',
                'dental', 'clinic', 'health', 'medicine'
            ],
            patterns: [
                /\b(medical|doctor|hospital|pharmacy)\b/i,
                /\b(dental|clinic|health|medicine)\b/i
            ]
        });
        
        this.categoryRules.set('entertainment', {
            keywords: [
                'movie', 'cinema', 'theater', 'netflix', 'spotify',
                'game', 'entertainment', 'music', 'streaming'
            ],
            patterns: [
                /\b(movie|cinema|theater|netflix)\b/i,
                /\b(spotify|game|entertainment|music)\b/i
            ]
        });
        
        this.categoryRules.set('banking', {
            keywords: [
                'bank', 'atm', 'transfer', 'fee', 'interest',
                'withdrawal', 'deposit', 'payment'
            ],
            patterns: [
                /\b(bank|atm|transfer|fee)\b/i,
                /\b(withdrawal|deposit|payment)\b/i
            ]
        });
    }
    
    /**
     * Add merchant group to database
     */
    addMerchantGroup(standardName, variants, category, subcategory, country = null) {
        const merchantData = {
            standardName,
            category,
            subcategory,
            country,
            confidence: 1.0
        };
        
        // Add all variants
        variants.forEach(variant => {
            this.merchantDatabase.set(variant.toUpperCase(), merchantData);
        });
        
        // Add the standard name itself
        this.merchantDatabase.set(standardName.toUpperCase(), merchantData);
    }
    
    /**
     * Match merchant name and extract standardized information
     */
    matchMerchant(rawMerchantName, country = null) {
        if (!rawMerchantName) {
            return {
                standardName: 'Unknown',
                category: 'other',
                subcategory: 'unknown',
                confidence: 0,
                rawName: rawMerchantName
            };
        }
        
        const cacheKey = `${rawMerchantName}_${country}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        const normalized = this.normalizeMerchantName(rawMerchantName);
        let result = this.findExactMatch(normalized, country);
        
        if (!result) {
            result = this.findFuzzyMatch(normalized, country);
        }
        
        if (!result) {
            result = this.categorizeByRules(normalized);
        }
        
        // Fallback to unknown
        if (!result) {
            result = {
                standardName: this.extractMerchantName(rawMerchantName),
                category: 'other',
                subcategory: 'unknown',
                confidence: 0.1,
                rawName: rawMerchantName
            };
        }
        
        result.rawName = rawMerchantName;
        
        // Cache result
        this.cache.set(cacheKey, result);
        
        // Learn from user corrections if in learning mode
        if (this.learningMode) {
            this.learnFromMatch(rawMerchantName, result);
        }
        
        return result;
    }
    
    /**
     * Normalize merchant name for matching
     */
    normalizeMerchantName(merchantName) {
        let normalized = merchantName.toUpperCase().trim();
        
        // Remove common prefixes/suffixes
        const cleanupPatterns = [
            // Payment processors
            /^(PAYPAL\s*\*\s*|SQ\s*\*\s*|TST\s*\*\s*|STRIPE\s*)/,
            // Location/transaction codes
            /\s+[A-Z]{2,3}\s*\d+$/,
            /\s+\d{3,6}$/,
            // Dates and times
            /\s+\d{2}\/\d{2}\/\d{2,4}$/,
            /\s+\d{2}:\d{2}(:\d{2})?$/,
            // Reference numbers
            /\s+(REF|TXN)\s*#?\s*\w+$/i,
            // POS indicators
            /^(POS|EFTPOS)\s+/,
            /\s+(POS|EFTPOS)$/,
            // Web indicators
            /^WWW\./,
            /\.COM?$/
        ];
        
        cleanupPatterns.forEach(pattern => {
            normalized = normalized.replace(pattern, '');
        });
        
        // Remove extra whitespace
        normalized = normalized.replace(/\s+/g, ' ').trim();
        
        return normalized;
    }
    
    /**
     * Find exact match in merchant database
     */
    findExactMatch(normalizedName, country) {
        // Try exact match first
        let match = this.merchantDatabase.get(normalizedName);
        
        if (match && (!country || !match.country || match.country === country)) {
            return {
                standardName: match.standardName,
                category: match.category,
                subcategory: match.subcategory,
                confidence: 1.0
            };
        }
        
        // Try partial matches for longer merchant names
        for (const [key, merchantData] of this.merchantDatabase) {
            if (normalizedName.includes(key) && key.length > 3) {
                if (!country || !merchantData.country || merchantData.country === country) {
                    return {
                        standardName: merchantData.standardName,
                        category: merchantData.category,
                        subcategory: merchantData.subcategory,
                        confidence: 0.9
                    };
                }
            }
        }
        
        return null;
    }
    
    /**
     * Find fuzzy match using similarity algorithms
     */
    findFuzzyMatch(normalizedName, country) {
        let bestMatch = null;
        let bestSimilarity = 0;
        const threshold = 0.8;
        
        for (const [key, merchantData] of this.merchantDatabase) {
            if (country && merchantData.country && merchantData.country !== country) {
                continue;
            }
            
            const similarity = this.calculateSimilarity(normalizedName, key);
            
            if (similarity > threshold && similarity > bestSimilarity) {
                bestMatch = merchantData;
                bestSimilarity = similarity;
            }
        }
        
        if (bestMatch) {
            return {
                standardName: bestMatch.standardName,
                category: bestMatch.category,
                subcategory: bestMatch.subcategory,
                confidence: bestSimilarity
            };
        }
        
        return null;
    }
    
    /**
     * Categorize using keyword rules
     */
    categorizeByRules(normalizedName) {
        let bestCategory = null;
        let bestScore = 0;
        
        for (const [category, rules] of this.categoryRules) {
            let score = 0;
            
            // Check keywords
            rules.keywords.forEach(keyword => {
                if (normalizedName.includes(keyword.toUpperCase())) {
                    score += 1;
                }
            });
            
            // Check patterns
            rules.patterns.forEach(pattern => {
                if (pattern.test(normalizedName)) {
                    score += 2; // Patterns have higher weight
                }
            });
            
            if (score > bestScore) {
                bestCategory = category;
                bestScore = score;
            }
        }
        
        if (bestCategory && bestScore > 0) {
            return {
                standardName: this.extractMerchantName(normalizedName),
                category: bestCategory,
                subcategory: 'general',
                confidence: Math.min(bestScore / 3, 0.8) // Max 0.8 for rule-based
            };
        }
        
        return null;
    }
    
    /**
     * Extract clean merchant name from raw string
     */
    extractMerchantName(rawName) {
        let cleaned = rawName.trim();
        
        // Remove common noise
        cleaned = cleaned.replace(/^(POS|EFTPOS)\s+/i, '');
        cleaned = cleaned.replace(/\s+(POS|EFTPOS)$/i, '');
        cleaned = cleaned.replace(/^WWW\./i, '');
        cleaned = cleaned.replace(/\.COM?$/i, '');
        
        // Capitalize first letter of each word
        return cleaned.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }
    
    /**
     * Calculate string similarity
     */
    calculateSimilarity(str1, str2) {
        // Simple Jaro-Winkler implementation
        const jaro = this.jaroSimilarity(str1, str2);
        if (jaro < 0.7) return jaro;
        
        // Calculate common prefix (up to 4 chars)
        let prefix = 0;
        for (let i = 0; i < Math.min(str1.length, str2.length, 4); i++) {
            if (str1[i] === str2[i]) prefix++;
            else break;
        }
        
        return jaro + (0.1 * prefix * (1 - jaro));
    }
    
    /**
     * Jaro similarity calculation
     */
    jaroSimilarity(str1, str2) {
        if (str1.length === 0 && str2.length === 0) return 1;
        if (str1.length === 0 || str2.length === 0) return 0;
        
        const matchWindow = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
        if (matchWindow < 0) return 0;
        
        const str1Matches = new Array(str1.length).fill(false);
        const str2Matches = new Array(str2.length).fill(false);
        let matches = 0;
        
        // Find matches
        for (let i = 0; i < str1.length; i++) {
            const start = Math.max(0, i - matchWindow);
            const end = Math.min(i + matchWindow + 1, str2.length);
            
            for (let j = start; j < end; j++) {
                if (str2Matches[j] || str1[i] !== str2[j]) continue;
                str1Matches[i] = true;
                str2Matches[j] = true;
                matches++;
                break;
            }
        }
        
        if (matches === 0) return 0;
        
        // Count transpositions
        let transpositions = 0;
        let k = 0;
        for (let i = 0; i < str1.length; i++) {
            if (!str1Matches[i]) continue;
            while (!str2Matches[k]) k++;
            if (str1[i] !== str2[k]) transpositions++;
            k++;
        }
        
        return (matches / str1.length + matches / str2.length + 
                (matches - transpositions / 2) / matches) / 3;
    }
    
    /**
     * Learn from user corrections
     */
    learnFromMatch(rawName, result) {
        // Store learned patterns for future improvement
        const learningKey = `learned_${rawName.toUpperCase()}`;
        
        if (!this.merchantDatabase.has(learningKey)) {
            this.merchantDatabase.set(learningKey, {
                standardName: result.standardName,
                category: result.category,
                subcategory: result.subcategory,
                confidence: 0.8,
                learned: true,
                timestamp: Date.now()
            });
        }
    }
    
    /**
     * Batch process multiple merchant names
     */
    batchMatch(merchantNames, country = null) {
        return merchantNames.map(name => this.matchMerchant(name, country));
    }
    
    /**
     * Get category statistics
     */
    getCategoryStats(transactions) {
        const stats = {};
        
        transactions.forEach(transaction => {
            const match = this.matchMerchant(transaction.description || transaction.merchant);
            const category = match.category;
            
            if (!stats[category]) {
                stats[category] = {
                    count: 0,
                    totalAmount: 0,
                    avgAmount: 0,
                    subcategories: {}
                };
            }
            
            stats[category].count++;
            stats[category].totalAmount += Math.abs(transaction.amount || 0);
            
            const subcategory = match.subcategory;
            if (!stats[category].subcategories[subcategory]) {
                stats[category].subcategories[subcategory] = {
                    count: 0,
                    totalAmount: 0
                };
            }
            
            stats[category].subcategories[subcategory].count++;
            stats[category].subcategories[subcategory].totalAmount += Math.abs(transaction.amount || 0);
        });
        
        // Calculate averages
        Object.keys(stats).forEach(category => {
            stats[category].avgAmount = stats[category].totalAmount / stats[category].count;
            
            Object.keys(stats[category].subcategories).forEach(subcategory => {
                const subStats = stats[category].subcategories[subcategory];
                subStats.avgAmount = subStats.totalAmount / subStats.count;
            });
        });
        
        return stats;
    }
    
    /**
     * Add custom merchant mapping
     */
    addCustomMerchant(rawName, standardName, category, subcategory) {
        this.merchantDatabase.set(rawName.toUpperCase(), {
            standardName,
            category,
            subcategory,
            confidence: 1.0,
            custom: true
        });
        
        // Clear cache for this merchant
        for (const key of this.cache.keys()) {
            if (key.startsWith(rawName)) {
                this.cache.delete(key);
            }
        }
    }
    
    /**
     * Export learned merchants for backup
     */
    exportLearnedMerchants() {
        const learned = {};
        
        for (const [key, value] of this.merchantDatabase) {
            if (value.learned || value.custom) {
                learned[key] = value;
            }
        }
        
        return learned;
    }
    
    /**
     * Import learned merchants from backup
     */
    importLearnedMerchants(learnedData) {
        Object.entries(learnedData).forEach(([key, value]) => {
            this.merchantDatabase.set(key, value);
        });
        
        // Clear cache to refresh matches
        this.cache.clear();
    }
    
    /**
     * Get merchant suggestions for user review
     */
    getMerchantSuggestions(rawName, limit = 5) {
        const normalized = this.normalizeMerchantName(rawName);
        const suggestions = [];
        
        for (const [key, merchantData] of this.merchantDatabase) {
            if (suggestions.length >= limit) break;
            
            const similarity = this.calculateSimilarity(normalized, key);
            if (similarity > 0.3) {
                suggestions.push({
                    standardName: merchantData.standardName,
                    category: merchantData.category,
                    subcategory: merchantData.subcategory,
                    similarity,
                    key
                });
            }
        }
        
        return suggestions.sort((a, b) => b.similarity - a.similarity);
    }
    
    /**
     * Clear cache and reset learning
     */
    reset() {
        this.cache.clear();
        
        // Remove learned entries
        for (const [key, value] of this.merchantDatabase) {
            if (value.learned) {
                this.merchantDatabase.delete(key);
            }
        }
    }
    
    /**
     * Get cache statistics
     */
    getStats() {
        return {
            merchantDatabaseSize: this.merchantDatabase.size,
            cacheSize: this.cache.size,
            categoryRulesCount: this.categoryRules.size,
            learnedMerchantsCount: Array.from(this.merchantDatabase.values())
                .filter(m => m.learned).length
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MerchantMatcher;
}

// Global access
window.MerchantMatcher = MerchantMatcher;