/**
 * SmartFinanceAI - Duplicate Transaction Detection System
 * Prevents duplicate imports and identifies similar transactions
 * CRITICAL: Ensures data integrity in financial records
 */

class DuplicateDetector {
  constructor() {
    this.fingerprintCache = new Map();
    this.fuzzyMatchThreshold = 0.85;
    this.dateToleranceDays = 3; // Allow 3-day tolerance for date matching
    this.amountTolerancePercent = 0.01; // 1% tolerance for amount matching
    
    // Weights for different matching criteria
    this.matchWeights = {
      exactAmount: 0.4,
      exactDate: 0.3,
      exactDescription: 0.2,
      exactMerchant: 0.1
    };
    
    // Common description variations to normalize
    this.descriptionNormalizations = [
      { pattern: /\s+/g, replacement: ' ' }, // Multiple spaces to single
      { pattern: /[^\w\s]/g, replacement: '' }, // Remove special characters
      { pattern: /\b(purchase|payment|debit|credit)\b/gi, replacement: '' }, // Remove common words
      { pattern: /\b\d{4,}\b/g, replacement: '' }, // Remove long numbers (reference codes)
      { pattern: /\s{2,}/g, replacement: ' ' }, // Multiple spaces to single (again)
      { pattern: /^\s+|\s+$/g, replacement: '' } // Trim
    ];
    
    // Merchant name normalizations
    this.merchantNormalizations = [
      { pattern: /\bltd\b|\bllc\b|\binc\b|\bcorp\b/gi, replacement: '' },
      { pattern: /\b(store|shop|market|supermarket)\b/gi, replacement: '' },
      { pattern: /\b\d+\b/g, replacement: '' }, // Remove numbers
      { pattern: /[^\w\s]/g, replacement: '' }, // Remove special characters
      { pattern: /\s+/g, replacement: ' ' } // Normalize spaces
    ];
  }

  /**
   * Generate transaction fingerprint for exact duplicate detection
   * @param {Object} transaction - Transaction object
   * @returns {string} Unique fingerprint
   */
  generateFingerprint(transaction) {
    // Normalize the key fields
    const normalizedDate = this.normalizeDate(transaction.date);
    const normalizedAmount = Math.round(parseFloat(transaction.amount) * 100); // Convert to cents
    const normalizedDescription = this.normalizeDescription(transaction.description);
    
    // Create fingerprint from normalized data
    const fingerprintData = {
      date: normalizedDate,
      amount: normalizedAmount,
      description: normalizedDescription
    };
    
    // Generate hash-like fingerprint
    const fingerprintString = JSON.stringify(fingerprintData);
    return this.simpleHash(fingerprintString);
  }

  /**
   * Generate fuzzy fingerprint for similar transaction detection
   * @param {Object} transaction - Transaction object
   * @returns {string} Fuzzy fingerprint
   */
  generateFuzzyFingerprint(transaction) {
    // More aggressive normalization for fuzzy matching
    const fuzzyDate = this.normalizeDate(transaction.date).substring(0, 7); // Year-month only
    const fuzzyAmount = Math.round(parseFloat(transaction.amount) / 10) * 10; // Round to nearest $10
    const fuzzyDescription = this.normalizeMerchant(transaction.description);
    
    const fuzzyData = {
      date: fuzzyDate,
      amount: fuzzyAmount,
      description: fuzzyDescription.substring(0, 20