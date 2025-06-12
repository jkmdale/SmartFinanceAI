/**
 * 🔐 SmartFinanceAI - Security Utilities
 * Bank-level security functions for data protection
 * Part of: src/utils/security-utils.js
 */

// Import Web Crypto API for secure encryption
const crypto = window.crypto || window.msCrypto;

class SecurityUtils {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
    this.ivLength = 12;
    this.saltLength = 16;
    this.iterations = 100000; // PBKDF2 iterations
  }

  /**
   * Generate a secure random salt
   * @param {number} length - Salt length in bytes
   * @returns {Uint8Array} Random salt
   */
  generateSalt(length = this.saltLength) {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  /**
   * Generate a secure random IV (Initialization Vector)
   * @param {number} length - IV length in bytes
   * @returns {Uint8Array} Random IV
   */
  generateIV(length = this.ivLength) {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  /**
   * Derive encryption key from password using PBKDF2
   * @param {string} password - User password
   * @param {Uint8Array} salt - Random salt
   * @returns {Promise<CryptoKey>} Derived encryption key
   */
  async deriveKey(password, salt) {
    try {
      const encoder = new TextEncoder();
      const passwordKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      return await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: this.iterations,
          hash: 'SHA-256'
        },
        passwordKey,
        {
          name: this.algorithm,
          length: this.keyLength
        },
        false,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      throw new Error(`Key derivation failed: ${error.message}`);
    }
  }

  /**
   * Encrypt data using AES-GCM
   * @param {string|Object} data - Data to encrypt
   * @param {string} password - Encryption password
   * @returns {Promise<string>} Base64 encoded encrypted data
   */
  async encryptData(data, password) {
    try {
      const salt = this.generateSalt();
      const iv = this.generateIV();
      const key = await this.deriveKey(password, salt);
      
      const encoder = new TextEncoder();
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      const encodedData = encoder.encode(dataString);

      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        encodedData
      );

      // Combine salt, iv, and encrypted data
      const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
      result.set(salt, 0);
      result.set(iv, salt.length);
      result.set(new Uint8Array(encrypted), salt.length + iv.length);

      // Return base64 encoded result
      return this.arrayBufferToBase64(result);
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data using AES-GCM
   * @param {string} encryptedData - Base64 encoded encrypted data
   * @param {string} password - Decryption password
   * @returns {Promise<string|Object>} Decrypted data
   */
  async decryptData(encryptedData, password) {
    try {
      const data = this.base64ToArrayBuffer(encryptedData);
      
      // Extract salt, iv, and encrypted data
      const salt = data.slice(0, this.saltLength);
      const iv = data.slice(this.saltLength, this.saltLength + this.ivLength);
      const encrypted = data.slice(this.saltLength + this.ivLength);

      const key = await this.deriveKey(password, salt);

      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      const decryptedString = decoder.decode(decrypted);
      
      // Try to parse as JSON, return string if parsing fails
      try {
        return JSON.parse(decryptedString);
      } catch {
        return decryptedString;
      }
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Generate a secure hash of data
   * @param {string} data - Data to hash
   * @returns {Promise<string>} Hex encoded hash
   */
  async hashData(data) {
    try {
      const encoder = new TextEncoder();
      const encodedData = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', encodedData);
      return this.arrayBufferToHex(hashBuffer);
    } catch (error) {
      throw new Error(`Hashing failed: ${error.message}`);
    }
  }

  /**
   * Generate a secure hash with salt
   * @param {string} data - Data to hash
   * @param {string} salt - Salt for hashing
   * @returns {Promise<string>} Hex encoded hash
   */
  async hashWithSalt(data, salt) {
    try {
      const combinedData = data + salt;
      return await this.hashData(combinedData);
    } catch (error) {
      throw new Error(`Salted hashing failed: ${error.message}`);
    }
  }

  /**
   * Generate a secure random token
   * @param {number} length - Token length in bytes
   * @returns {string} Base64 encoded token
   */
  generateSecureToken(length = 32) {
    const randomBytes = crypto.getRandomValues(new Uint8Array(length));
    return this.arrayBufferToBase64(randomBytes);
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} Validation result with score and feedback
   */
  validatePasswordStrength(password) {
    const result = {
      score: 0,
      feedback: [],
      isValid: false
    };

    if (!password) {
      result.feedback.push('Password is required');
      return result;
    }

    // Length check
    if (password.length >= 12) {
      result.score += 2;
    } else if (password.length >= 8) {
      result.score += 1;
    } else {
      result.feedback.push('Password should be at least 8 characters long');
    }

    // Character variety checks
    if (/[a-z]/.test(password)) result.score += 1;
    else result.feedback.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) result.score += 1;
    else result.feedback.push('Include uppercase letters');

    if (/[0-9]/.test(password)) result.score += 1;
    else result.feedback.push('Include numbers');

    if (/[^a-zA-Z0-9]/.test(password)) result.score += 2;
    else result.feedback.push('Include special characters');

    // Common password patterns
    if (this.isCommonPassword(password)) {
      result.score -= 2;
      result.feedback.push('Avoid common passwords');
    }

    if (this.hasRepeatedPatterns(password)) {
      result.score -= 1;
      result.feedback.push('Avoid repeated patterns');
    }

    result.isValid = result.score >= 5;
    return result;
  }

  /**
   * Check if password is in common passwords list
   * @param {string} password - Password to check
   * @returns {boolean} True if password is common
   */
  isCommonPassword(password) {
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey',
      'dragon', 'master', 'shadow', 'superman', 'michael'
    ];
    return commonPasswords.includes(password.toLowerCase());
  }

  /**
   * Check for repeated patterns in password
   * @param {string} password - Password to check
   * @returns {boolean} True if repeated patterns found
   */
  hasRepeatedPatterns(password) {
    // Check for repeated characters (3 or more)
    if (/(.)\1{2,}/.test(password)) return true;
    
    // Check for sequential characters
    if (/(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password)) return true;
    if (/(012|123|234|345|456|567|678|789)/.test(password)) return true;
    
    return false;
  }

  /**
   * Sanitize user input to prevent XSS
   * @param {string} input - User input to sanitize
   * @returns {string} Sanitized input
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .replace(/&/g, '&amp;');
  }

  /**
   * Validate and sanitize financial amount
   * @param {string|number} amount - Amount to validate
   * @returns {number|null} Validated amount or null if invalid
   */
  validateFinancialAmount(amount) {
    if (typeof amount === 'number') {
      return isFinite(amount) ? Math.round(amount * 100) / 100 : null;
    }
    
    if (typeof amount === 'string') {
      // Remove currency symbols and spaces
      const cleaned = amount.replace(/[\$£€¥₹,\s]/g, '');
      const parsed = parseFloat(cleaned);
      return isFinite(parsed) ? Math.round(parsed * 100) / 100 : null;
    }
    
    return null;
  }

  /**
   * Generate a fingerprint for transactions (for duplicate detection)
   * @param {Object} transaction - Transaction object
   * @returns {Promise<string>} Transaction fingerprint
   */
  async generateTransactionFingerprint(transaction) {
    const normalized = {
      date: transaction.date,
      amount: Math.round((transaction.amount || 0) * 100), // Cents precision
      merchant: this.normalizeMerchant(transaction.description || transaction.merchant || ''),
      account: transaction.account || ''
    };
    
    const fingerprint = JSON.stringify(normalized);
    return await this.hashData(fingerprint);
  }

  /**
   * Normalize merchant name for consistent matching
   * @param {string} merchant - Merchant name
   * @returns {string} Normalized merchant name
   */
  normalizeMerchant(merchant) {
    return merchant
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
      .substring(0, 50); // Limit length
  }

  /**
   * Securely clear sensitive data from memory
   * @param {string|Array|Object} data - Data to clear
   */
  secureClear(data) {
    if (typeof data === 'string') {
      // Overwrite string memory (limited effectiveness in JS)
      data = '0'.repeat(data.length);
    } else if (Array.isArray(data)) {
      data.fill(0);
    } else if (typeof data === 'object' && data !== null) {
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          data[key] = null;
        }
      }
    }
  }

  /**
   * Check if we're running in a secure context
   * @returns {boolean} True if secure context
   */
  isSecureContext() {
    return window.isSecureContext && location.protocol === 'https:';
  }

  /**
   * Convert ArrayBuffer to Base64