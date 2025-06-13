/**
 * SmartFinanceAI - CSV Import Processor
 * Handles CSV import from global banks with automatic format detection
 * File: src/csv-import/csv-processor.js (REPLACEMENT)
 */

class CSVProcessor {
  constructor() {
    this.db = new DatabaseManager();
    this.accountManager = new AccountManager();
    
    // Global bank format configurations
    this.bankFormats = {
      // New Zealand Banks
      'ANZ_NZ': {
        name: 'ANZ Bank New Zealand',
        country: 'NZ',
        currency: 'NZD',
        dateFormat: 'DD/MM/YYYY',
        fields: {
          date: 'Date',
          amount: 'Amount',
          description: 'Description',
          balance: 'Balance',
          type: 'Type'
        },
        headerPatterns: ['Date', 'Amount', 'Description', 'Balance'],
        amountFormat: 'negative_expenses',
        encoding: 'utf-8'
      },
      
      'ASB_NZ': {
        name: 'ASB Bank',
        country: 'NZ',
        currency: 'NZD',
        dateFormat: 'DD/MM/YYYY',
        fields: {
          date: 'Date',
          amount: 'Amount',
          description: 'Description',
          balance: 'Balance'
        },
        headerPatterns: ['Date', 'Amount', 'Description'],
        amountFormat: 'negative_expenses'
      },
      
      // Australia Banks
      'CBA_AU': {
        name: 'Commonwealth Bank',
        country: 'AU',
        currency: 'AUD',
        dateFormat: 'DD/MM/YYYY',
        fields: {
          date: 'Date',
          amount: 'Amount',
          description: 'Description',
          balance: 'Balance'
        },
        headerPatterns: ['Date', 'Amount', 'Description', 'Balance']
      },
      
      'WESTPAC_AU': {
        name: 'Westpac',
        country: 'AU',
        currency: 'AUD',
        dateFormat: 'DD/MM/YYYY',
        fields: {
          date: 'Date',
          amount: 'Amount',
          description: 'Description',
          balance: 'Balance'
        },
        headerPatterns: ['Date', 'Amount', 'Description']
      },