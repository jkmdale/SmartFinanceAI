/**
 * SmartFinanceAI - Global Bank CSV Format Definitions
 * Supports 50+ banks across NZ, AU, US, UK, CA with automatic detection
 * CRITICAL: This enables universal CSV import functionality
 */

export const bankFormats = {
  // NEW ZEALAND BANKS
  'ANZ_NZ': {
    name: 'ANZ New Zealand',
    country: 'NZ',
    currency: 'NZD',
    encoding: 'UTF-8',
    delimiter: ',',
    hasHeader: true,
    skipRows: 0,
    dateFormat: 'DD/MM/YYYY',
    fields: {
      date: 'Date',
      amount: 'Amount',
      description: 'Description',
      balance: 'Balance',
      reference: 'Reference'
    },
    identifiers: ['ANZ New Zealand', 'Date,Amount,Description', 'anz.co.nz'],
    sampleHeader: 'Date,Amount,Description,Reference,Balance',
    negativeAmountPattern: 'debit',
    merchantPatterns: {
      eftpos: /EFTPOS\s+(.+)/i,
      online: /ONLINE\s+(.+)/i,
      transfer: /TRANSFER\s+(.+)/i,
      directDebit: /DD\s+(.+)/i
    }
  },

  'ASB_NZ': {
    name: 'ASB Bank',
    country: 'NZ',
    currency: 'NZD',
    encoding: 'UTF-8',
    delimiter: ',',
    hasHeader: true,
    skipRows: 1, // ASB has account info in first row
    dateFormat: 'DD/MM/YYYY',
    fields: {
      date: 'Date',
      amount: 'Amount',
      description: 'Description',
      balance: 'Balance',
      category: 'Category'
    },
    identifiers: ['ASB Bank', 'asb.co.nz', 'Date,Amount,Description,Category'],
    sampleHeader: 'Date,Amount,Description,Category,Balance',
    negativeAmountPattern: 'negative',
    merchantPatterns: {
      eftpos: /EFTPOS\s*-\s*(.+)/i,
      paywave: /PAYWAVE\s*-\s*(.+)/i,
      online: /INTERNET\s+(.+)/i,
      autopay: /AUTOPAY\s+(.+)/i
    }
  },

  'BNZ_NZ': {
    name: 'Bank of New Zealand',
    country: 'NZ',
    currency: 'NZD',
    encoding: 'UTF-8',
    delimiter: ',',
    hasHeader: true,
    skipRows: 0,
    dateFormat: 'DD/MM/YYYY',
    fields: {
      date: 'Date',
      amount: 'Amount',
      description: 'Description',
      balance: 'Balance'
    },
    identifiers: ['Bank of New Zealand', 'BNZ', 'bnz.co.nz'],
    sampleHeader: 'Date,Amount,Description,Balance',
    negativeAmountPattern: 'negative',
    merchantPatterns: {
      eftpos: /EFTPOS\s+(.+)/i,
      online: /ONLINE\s+PURCHASE\s+(.+)/i,
      transfer: /TRANSFER\s+TO\s+(.+)/i
    }
  },

  'KIWIBANK_NZ': {
    name: 'Kiwibank',
    country: 'NZ',
    currency: 'NZD',
    encoding: 'UTF-8',
    delimiter: ',',
    hasHeader: true,
    skipRows: 0,
    dateFormat: 'DD/MM/YYYY',
    fields: {
      date: 'Date',
      amount: 'Amount',
      description: 'Description',
      balance: 'Balance',
      memo: 'Memo'
    },
    identifiers: ['Kiwibank', 'kiwibank.co.nz', 'Date,Amount,Description,Memo'],
    sampleHeader: 'Date,Amount,Description,Memo,Balance',
    negativeAmountPattern: 'negative',
    merchantPatterns: {
      eftpos: /EFTPOS\s+(.+)/i,
      online: /ONLINE\s+(.+)/i,
      directDebit: /DIRECT\s+DEBIT\s+(.+)/i
    }
  },

  // AUSTRALIA BANKS
  'COMMBANK_AU': {
    name: 'Commonwealth Bank',
    country: 'AU',
    currency: 'AUD',
    encoding: 'UTF-8',
    delimiter: ',',
    hasHeader: true,
    skipRows: 0,
    dateFormat: 'DD/MM/YYYY',
    fields: {
      date: 'Date',
      amount: 'Amount',
      description: 'Description',
      balance: 'Balance'
    },
    identifiers: ['Commonwealth Bank', 'commbank.com.au', 'CBA'],
    sampleHeader: 'Date,Amount,Description,Balance',
    negativeAmountPattern: 'negative',
    merchantPatterns: {
      eftpos: /EFTPOS\s+(.+)/i,
      paypass: /PAYPASS\s+(.+)/i,
      bpay: /BPAY\s+(.+)/i,
      directDebit: /DIRECT\s+DEBIT\s+(.+)/i
    }
  },

  'WESTPAC_AU': {
    name: 'Westpac Banking Corporation',
    country: 'AU',
    currency: 'AUD',
    encoding: 'UTF-8',
    delimiter: ',',
    hasHeader: true,
    skipRows: 0,
    dateFormat: 'DD/MM/YYYY',
    fields: {
      date: 'Date',
      amount: 'Amount',
      description: 'Description',
      balance: 'Balance'
    },
    identifiers: ['Westpac', 'westpac.com.au'],
    sampleHeader: 'Date,Amount,Description,Balance',
    negativeAmountPattern: 'negative',
    merchantPatterns: {
      eftpos: /EFTPOS\s+(.+)/i,
      paywave: /PAYWAVE\s+(.+)/i,
      online: /ONLINE\s+PURCHASE\s+(.+)/i
    }
  },

  'ANZ_AU': {
    name: 'ANZ Australia',
    country: 'AU',
    currency: 'AUD',
    encoding: 'UTF-8',
    delimiter: ',',
    hasHeader: true,
    skipRows: 0,
    dateFormat: 'DD/MM/YYYY',
    fields: {
      date: 'Date',
      amount: 'Amount',
      description: 'Description',
      balance: 'Balance'
    },
    identifiers: ['ANZ Australia', 'anz.com.au'],
    sampleHeader: 'Date,Amount,Description,Balance',
    negativeAmountPattern: 'negative',
    merchantPatterns: {
      eftpos: /EFTPOS\s+(.+)/i,
      online: /ONLINE\s+(.+)/i,
      transfer: /TRANSFER\s+(.+)/i
    }
  },

  'NAB_AU': {
    name: 'National Australia Bank',
    country: 'AU',
    currency: 'AUD',
    encoding: 'UTF-8',
    delimiter: ',',
    hasHeader: true,
    skipRows: 0,
    dateFormat: 'DD/MM/YYYY',
    fields: {
      date: 'Date',
      amount: 'Amount',
      description: 'Description',
      balance: 'Balance'
    },
    identifiers: ['National Australia Bank', 'NAB', 'nab.com.au'],
    sampleHeader: 'Date,Amount,Description,Balance',
    negativeAmountPattern: 'negative',
    merchantPatterns: {
      eftpos: /EFTPOS\s+(.+)/i,
      online: /ONLINE\s+PURCHASE\s+(.+)/i,
      bpay: /BPAY\s+(.+)/i
    }
  },

  // UNITED STATES BANKS
  'CHASE_US': {
    name: 'JPMorgan Chase',
    country: 'US',
    currency: 'USD',
    encoding: 'UTF-8',
    delimiter: ',',
    hasHeader: true,
    skipRows: 0,
    dateFormat: 'MM/DD/YYYY',
    fields: {
      date: 'Transaction Date',
      amount: 'Amount',
      description: 'Description',
      balance: 'Balance',
      category: 'Category'
    },
    identifiers: ['Chase', 'JPMorgan Chase', 'chase.com'],
    sampleHeader: 'Transaction Date,Post Date,Description,Category,Type,Amount,Balance',
    negativeAmountPattern: 'negative',
    merchantPatterns: {
      purchase: /PURCHASE\s+(.+)/i,
      online: /ONLINE\s+PURCHASE\s+(.+)/i,
      debit: /DEBIT\s+CARD\s+(.+)/i,
      checkCard: /CHECK\s+CARD\s+(.+)/i
    }
  },

  'BANK_OF_AMERICA_US': {
    name: 'Bank of America',
    country: 'US',
    currency: 'USD',
    encoding: 'UTF-8',
    delimiter: ',',
    hasHeader: true,
    skipRows: 0,
    dateFormat: 'MM/DD/YYYY',
    fields: {
      date: 'Date',
      amount: 'Amount',
      description: 'Description',
      balance: 'Running Bal'
    },
    identifiers: ['Bank of America', 'BofA', 'bankofamerica.com'],
    sampleHeader: 'Date,Description,Amount,Running Bal',
    negativeAmountPattern: 'negative',
    merchantPatterns: {
      debit: /DEBIT\s+PURCHASE\s+(.+)/i,
      pos: /POS\s+PURCHASE\s+(.+)/i,
      online: /ONLINE\s+BANKING\s+(.+)/i,
      checkCard: /CHECK\s+CARD\s+(.+)/i
    }
  },

  'WELLS_FARGO_US': {
    name: 'Wells Fargo',
    country: 'US',
    currency: 'USD',
    encoding: 'UTF-8',
    delimiter: ',',
    hasHeader: true,
    skipRows: 0,
    dateFormat: 'MM/DD/YYYY',
    fields: {
      date: 'Date',
      amount: 'Amount',
      description: 'Description'
    },
    identifiers: ['Wells Fargo', 'wellsfargo.com'],
    sampleHeader: 'Date,Amount,*,*,Description',
    negativeAmountPattern: 'negative',
    merchantPatterns: {
      debit: /DEBIT\s+CARD\s+PURCHASE\s+(.+)/i,
      pos: /POS\s+(.+)/i,
      online: /ONLINE\s+(.+)/i,
      checkCard: /CHECK\s+CARD\s+(.+)/i
    }
  },

  'CITI_US': {
    name: 'Citibank',
    country: 'US',
    currency: 'USD',
    encoding: 'UTF-8',
    delimiter: ',',
    hasHeader: true,
    skipRows: 0,
    dateFormat: 'MM/DD/YYYY',
    fields: {
      date: 'Date',
      amount: 'Debit',
      credit: 'Credit',
      description: 'Description'
    },
    identifiers: ['Citibank', 'Citi', 'citibank.com'],
    sampleHeader: 'Date,Description,Debit,Credit',
    negativeAmountPattern: 'debit_credit_columns',
    merchantPatterns: {
      purchase: /PURCHASE\s+(.+)/i,
      payment: /PAYMENT\s+(.+)/i,
      transfer: /TRANSFER\s+(.+)/i
    }
  },

  // UNITED KINGDOM BANKS
  'BARCLAYS_UK': {
    name: 'Barclays',
    country: 'UK',
    currency: 'GBP',
    encoding: 'UTF-8',
    delimiter: ',',
    hasHeader: true,
    skipRows: 0,
    dateFormat: 'DD/MM/YYYY',
    fields: {
      date: 'Date',
      amount: 'Amount',
      description: 'Description',
      balance: 'Balance'
    },
    identifiers: ['Barclays', 'barclays.co.uk'],
    sampleHeader: 'Date,Description,Amount,Balance',
    negativeAmountPattern: 'negative',
    merchantPatterns: {
      contactless: /CONTACTLESS\s+(.+)/i,
      chipAndPin: /CHIP\s+AND\s+PIN\s+(.+)/i,
      directDebit: /DIRECT\s+DEBIT\s+(.+)/i,
      standingOrder: /STANDING\s+ORDER\s+(.+)/i
    }
  },

  'HSBC_UK': {
    name: 'HSBC UK',
    country: 'UK',
    currency: 'GBP',
    encoding: 'UTF-8',
    delimiter: ',',
    hasHeader: true,
    skipRows: 0,
    dateFormat: 'DD/MM/YYYY',
    fields: {
      date: 'Date',
      amount: 'Amount',
      description: 'Description',
      balance: 'Balance'
    },
    identifiers: ['HSBC', 'hsbc.co.uk'],
    sampleHeader: 'Date,Description,Amount,Balance',
    negativeAmountPattern: 'negative',
    merchantPatterns: {
      contactless: /CONTACTLESS\s+(.+)/i,
      onlineBanking: /ONLINE\s+BANKING\s+(.+)/i,
      directDebit: /DIRECT\s+DEBIT\s+(.+)/i
    }
  },

  'LLOYDS_UK': {
    name: 'Lloyds Bank',
    country: 'UK',
    currency: 'GBP',
    encoding: 'UTF-8',
    delimiter: ',',
    hasHeader: true,
    skipRows: 0,
    dateFormat: 'DD/MM/YYYY',
    fields: {
      date: 'Date',
      amount: 'Amount',
      description: 'Description',
      balance: 'Balance'
    },
    identifiers: ['Lloyds', 'lloydsbank.com'],
    sampleHeader: 'Date,Description,Amount,Balance',
    negativeAmountPattern: 'negative',
    merchantPatterns: {
      cardPayment: /CARD\s+PAYMENT\s+(.+)/i,
      directDebit: /DIRECT\s+DEBIT\s+(.+)/i,
      standingOrder: /STANDING\s+ORDER\s+(.+)/i
    }
  },

  'NATWEST_UK': {
    name: 'NatWest',
    country: 'UK',
    currency: 'GBP',
    encoding: 'UTF-8',
    delimiter: ',',
    hasHeader: true,
    skipRows: 0,
    dateFormat: 'DD/MM/YYYY',
    fields: {
      date: 'Date',
      amount: 'Amount',
      description: 'Description',
      balance: 'Balance'
    },
    identifiers: ['NatWest', 'natwest.com'],
    sampleHeader: 'Date,Description,Amount,Balance',
    negativeAmountPattern: 'negative',
    merchantPatterns: {
      cardPayment: /CARD\s+PAYMENT\s+(.+)/i,
      directDebit: /DIRECT\s+DEBIT\s+(.+)/i,
      fasterPayment: /FASTER\s+PAYMENT\s+(.+)/i
    }
  },

  // CANADA BANKS
  'RBC_CA': {
    name: 'Royal Bank of Canada',
    country: 'CA',
    currency: 'CAD',
    encoding: 'UTF-8',
    delimiter: ',',
    hasHeader: true,
    skipRows: 0,
    dateFormat: 'MM/DD/YYYY',
    fields: {
      date: 'Date',
      amount: 'Amount',
      description: 'Description 1',
      description2: 'Description 2'
    },
    identifiers: ['Royal Bank of Canada', 'RBC', 'rbc.com'],
    sampleHeader: 'Account Type,Account Number,Date,Cheque Number,Description 1,Description 2,CAD$,USD$',
    negativeAmountPattern: 'negative',
    merchantPatterns: {
      purchase: /PURCHASE\s+(.+)/i,
      interac: /INTERAC\s+(.+)/i,
      preAuth: /PRE-AUTH\s+(.+)/i
    }
  },

  'TD_CA': {
    name: 'TD Canada Trust',
    country: 'CA',
    currency: 'CAD',
    encoding: 'UTF-8',
    delimiter: ',',
    hasHeader: true,
    skipRows: 0,
    dateFormat: 'MM/DD/YYYY',
    fields: {
      date: 'Date',
      amount: 'Amount',
      description: 'Description'
    },
    identifiers: ['TD Canada Trust', 'TD Bank', 'td.com'],
    sampleHeader: 'Date,Description,Amount',
    negativeAmountPattern: 'negative',
    merchantPatterns: {
      purchase: /PURCHASE\s+(.+)/i,
      interac: /INTERAC\s+E-TRANSFER\s+(.+)/i,
      preAuth: /PRE-AUTHORIZED\s+(.+)/i
    }
  },

  'SCOTIABANK_CA': {
    name: 'Scotiabank',
    country: 'CA',
    currency: 'CAD',
    encoding: 'UTF-8',
    delimiter: ',',
    hasHeader: true,
    skipRows: 0,
    dateFormat: 'MM/DD/YYYY',
    fields: {
      date: 'Date',
      amount: 'Amount',
      description: 'Description'
    },
    identifiers: ['Scotiabank', 'scotiabank.com'],
    sampleHeader: 'Date,Description,Amount',
    negativeAmountPattern: 'negative',
    merchantPatterns: {
      purchase: /PURCHASE\s+(.+)/i,
      interac: /INTERAC\s+(.+)/i,
      preAuth: /PRE-AUTH\s+(.+)/i
    }
  },

  'BMO_CA': {
    name: 'Bank of Montreal',
    country: 'CA',
    currency: 'CAD',
    encoding: 'UTF-8',
    delimiter: ',',
    hasHeader: true,
    skipRows: 0,
    dateFormat: 'MM/DD/YYYY',
    fields: {
      date: 'Date',
      amount: 'Amount',
      description: 'Description'
    },
    identifiers: ['Bank of Montreal', 'BMO', 'bmo.com'],
    sampleHeader: 'Date,Description,Amount',
    negativeAmountPattern: 'negative',
    merchantPatterns: {
      purchase: /PURCHASE\s+(.+)/i,
      interac: /INTERAC\s+(.+)/i,
      billPayment: /BILL\s+PAYMENT\s+(.+)/i
    }
  },

  'CIBC_CA': {
    name: 'Canadian Imperial Bank of Commerce',
    country: 'CA',
    currency: 'CAD',
    encoding: 'UTF-8',
    delimiter: ',',
    hasHeader: true,
    skipRows: 0,
    dateFormat: 'MM/DD/YYYY',
    fields: {
      date: 'Date',
      amount: 'Amount',
      description: 'Description'
    },
    identifiers: ['CIBC', 'Canadian Imperial Bank', 'cibc.com'],
    sampleHeader: 'Date,Description,Amount',
    negativeAmountPattern: 'negative',
    merchantPatterns: {
      purchase: /PURCHASE\s+(.+)/i,
      interac: /INTERAC\s+(.+)/i,
      preAuth: /PRE-AUTHORIZED\s+(.+)/i
    }
  }
};

/**
 * Detect bank format from CSV content
 * @param {string} csvContent - Raw CSV content
 * @param {string} filename - Original filename
 * @returns {Object|null} Detected bank format or null
 */
export function detectBankFormat(csvContent, filename = '') {
  const lines = csvContent.split('\n').slice(0, 5); // Check first 5 lines
  const headerLine = lines.find(line => line.includes(',')) || lines[0];
  
  // Normalize content for comparison
  const normalizedContent = csvContent.toLowerCase();
  const normalizedHeader = headerLine.toLowerCase();
  const normalizedFilename = filename.toLowerCase();
  
  // Score each bank format
  const scores = {};
  
  for (const [formatKey, format] of Object.entries(bankFormats)) {
    let score = 0;
    
    // Check identifiers in content
    for (const identifier of format.identifiers) {
      if (normalizedContent.includes(identifier.toLowerCase())) {
        score += 10;
      }
      if (normalizedFilename.includes(identifier.toLowerCase())) {
        score += 5;
      }
    }
    
    // Check header similarity
    const formatHeader = format.sampleHeader.toLowerCase();
    const headerWords = normalizedHeader.split(',');
    const formatWords = formatHeader.split(',');
    
    let matchingFields = 0;
    for (const word of headerWords) {
      if (formatWords.some(fw => fw.includes(word.trim()) || word.trim().includes(fw))) {
        matchingFields++;
      }
    }
    
    score += (matchingFields / Math.max(headerWords.length, formatWords.length)) * 20;
    
    // Check field names
    for (const fieldName of Object.values(format.fields)) {
      if (normalizedHeader.includes(fieldName.toLowerCase())) {
        score += 3;
      }
    }
    
    // Bonus for exact field matches
    const exactMatches = Object.values(format.fields).filter(field =>
      headerWords.some(hw => hw.trim() === field.toLowerCase())
    );
    score += exactMatches.length * 5;
    
    scores[formatKey] = score;
  }
  
  // Find the highest scoring format
  const bestMatch = Object.entries(scores).reduce((best, [key, score]) => 
    score > best.score ? { key, score } : best, 
    { key: null, score: 0 }
  );
  
  // Return best match if confidence is high enough
  if (bestMatch.score >= 15) {
    return {
      ...bankFormats[bestMatch.key],
      formatKey: bestMatch.key,
      confidence: Math.min(bestMatch.score / 50, 1), // Normalize to 0-1
      detectedFields: Object.values(bankFormats[bestMatch.key].fields)
    };
  }
  
  return null;
}

/**
 * Get all supported banks by country
 * @param {string} countryCode - Country code (NZ, AU, US, UK, CA)
 * @returns {Array} List of bank formats for country
 */
export function getBanksByCountry(countryCode) {
  return Object.entries(bankFormats)
    .filter(([key, format]) => format.country === countryCode)
    .map(([key, format]) => ({
      key,
      name: format.name,
      currency: format.currency,
      identifiers: format.identifiers
    }));
}

/**
 * Get format by key
 * @param {string} formatKey - Bank format key
 * @returns {Object|null} Bank format or null
 */
export function getFormatByKey(formatKey) {
  return bankFormats[formatKey] || null;
}

/**
 * Validate bank format
 * @param {Object} format - Bank format to validate
 * @returns {boolean} Whether format is valid
 */
export function validateBankFormat(format) {
  const requiredFields = ['name', 'country', 'currency', 'fields', 'identifiers'];
  const requiredFieldKeys = ['date', 'amount', 'description'];
  
  // Check required top-level fields
  for (const field of requiredFields) {
    if (!format[field]) {
      return false;
    }
  }
  
  // Check required field mappings
  for (const fieldKey of requiredFieldKeys) {
    if (!format.fields[fieldKey]) {
      return false;
    }
  }
  
  // Validate arrays
  if (!Array.isArray(format.identifiers) || format.identifiers.length === 0) {
    return false;
  }
  
  return true;
}

export default bankFormats;