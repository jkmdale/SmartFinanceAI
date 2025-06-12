// 🌍 SmartFinanceAI - Global Localization Manager
// Multi-country support with currencies, banking, regulations, and cultural adaptations

class LocalizationManager {
  constructor() {
    this.currentCountry = 'US'; // Default country
    this.currentCurrency = 'USD';
    this.currentLocale = 'en-US';
    this.exchangeRates = new Map();
    this.lastRateUpdate = null;
    this.rateUpdateInterval = 60 * 60 * 1000; // 1 hour
    
    // Country configurations
    this.countries = this.initializeCountryConfigs();
    
    // Exchange rate sources
    this.exchangeRateAPIs = [
      'https://api.exchangerate-api.com/v4/latest/USD', // Primary
      'https://api.fixer.io/latest?access_key=YOUR_KEY', // Backup
      'https://openexchangerates.org/api/latest.json?app_id=YOUR_KEY' // Backup
    ];
    
    console.log('🌍 LocalizationManager initialized');
    this.initializeFromStorage();
  }
  
  // === COUNTRY CONFIGURATIONS === //
  
  initializeCountryConfigs() {
    return {
      // === NEW ZEALAND === //
      'NZ': {
        name: 'New Zealand',
        currency: 'NZD',
        currencySymbol: '$',
        locale: 'en-NZ',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        numberFormat: {
          decimal: '.',
          thousands: ',',
          pattern: '1,234.56'
        },
        
        // Financial year and taxation
        financialYear: {
          start: { month: 4, day: 1 }, // April 1
          end: { month: 3, day: 31 }   // March 31
        },
        taxYear: 'april-march',
        
        // Emergency fund recommendations
        emergencyFundMonths: 3,
        
        // Banking institutions
        banks: [
          {
            name: 'ANZ New Zealand',
            code: 'ANZ_NZ',
            csvFormat: 'ANZ_NZ',
            logo: '/images/banks/anz-nz.png',
            website: 'https://www.anz.co.nz',
            fields: {
              date: 'Date',
              amount: 'Amount',
              description: 'Details',
              balance: 'Balance',
              reference: 'Reference'
            }
          },
          {
            name: 'ASB Bank',
            code: 'ASB',
            csvFormat: 'ASB_NZ',
            logo: '/images/banks/asb.png',
            website: 'https://www.asb.co.nz',
            fields: {
              date: 'Date',
              amount: 'Amount',
              description: 'Description',
              balance: 'Balance'
            }
          },
          {
            name: 'Bank of New Zealand',
            code: 'BNZ',
            csvFormat: 'BNZ_NZ',
            logo: '/images/banks/bnz.png',
            website: 'https://www.bnz.co.nz',
            fields: {
              date: 'Date',
              amount: 'Amount',
              description: 'Memo/Description',
              balance: 'Balance'
            }
          },
          {
            name: 'Kiwibank',
            code: 'KIWIBANK',
            csvFormat: 'KIWIBANK_NZ',
            logo: '/images/banks/kiwibank.png',
            website: 'https://www.kiwibank.co.nz',
            fields: {
              date: 'Date',
              amount: 'Amount',
              description: 'Description',
              balance: 'Balance'
            }
          },
          {
            name: 'Westpac New Zealand',
            code: 'WESTPAC_NZ',
            csvFormat: 'WESTPAC_NZ',
            logo: '/images/banks/westpac-nz.png',
            website: 'https://www.westpac.co.nz',
            fields: {
              date: 'Date',
              amount: 'Amount',
              description: 'Description',
              balance: 'Balance'
            }
          }
        ],
        
        // Retirement accounts
        retirementAccounts: [
          {
            name: 'KiwiSaver',
            type: 'mandatory',
            contributionRate: 0.03, // 3% minimum
            employerMatch: 0.03,    // 3% employer contribution
            governmentContribution: 521.43, // Annual max government contribution
            withdrawalAge: 65
          }
        ],
        
        // Regulations and limits
        regulations: {
          maxCashTransaction: 10000, // AML reporting threshold
          reportingCurrency: 'NZD',
          gstRate: 0.15, // 15% GST
          personalTaxRates: [
            { min: 0, max: 14000, rate: 0.105 },
            { min: 14001, max: 48000, rate: 0.175 },
            { min: 48001, max: 70000, rate: 0.30 },
            { min: 70001, max: 180000, rate: 0.33 },
            { min: 180001, max: Infinity, rate: 0.39 }
          ]
        },
        
        // Cultural and linguistic adaptations
        culture: {
          weekStart: 'monday',
          businessDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          holidays: [
            { name: 'New Year\'s Day', date: '01-01' },
            { name: 'Waitangi Day', date: '02-06' },
            { name: 'ANZAC Day', date: '04-25' },
            { name: 'Christmas Day', date: '12-25' },
            { name: 'Boxing Day', date: '12-26' }
          ],
          paymentMethods: ['EFTPOS', 'Paywave', 'Bank Transfer', 'Cash']
        }
      },
      
      // === AUSTRALIA === //
      'AU': {
        name: 'Australia',
        currency: 'AUD',
        currencySymbol: '$',
        locale: 'en-AU',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        numberFormat: {
          decimal: '.',
          thousands: ',',
          pattern: '1,234.56'
        },
        
        financialYear: {
          start: { month: 7, day: 1 }, // July 1
          end: { month: 6, day: 30 }   // June 30
        },
        taxYear: 'july-june',
        emergencyFundMonths: 3,
        
        banks: [
          {
            name: 'Commonwealth Bank',
            code: 'CBA',
            csvFormat: 'CBA_AU',
            logo: '/images/banks/cba.png',
            website: 'https://www.commbank.com.au',
            fields: {
              date: 'Date',
              amount: 'Amount',
              description: 'Description',
              balance: 'Balance'
            }
          },
          {
            name: 'Westpac Banking Corporation',
            code: 'WESTPAC_AU',
            csvFormat: 'WESTPAC_AU',
            logo: '/images/banks/westpac-au.png',
            website: 'https://www.westpac.com.au',
            fields: {
              date: 'Date',
              amount: 'Amount',
              description: 'Description',
              balance: 'Balance'
            }
          },
          {
            name: 'ANZ Australia',
            code: 'ANZ_AU',
            csvFormat: 'ANZ_AU',
            logo: '/images/banks/anz-au.png',
            website: 'https://www.anz.com.au',
            fields: {
              date: 'Date',
              amount: 'Amount',
              description: 'Description',
              balance: 'Balance'
            }
          },
          {
            name: 'National Australia Bank',
            code: 'NAB',
            csvFormat: 'NAB_AU',
            logo: '/images/banks/nab.png',
            website: 'https://www.nab.com.au',
            fields: {
              date: 'Date',
              amount: 'Amount',
              description: 'Description',
              balance: 'Balance'
            }
          }
        ],
        
        retirementAccounts: [
          {
            name: 'Superannuation',
            type: 'mandatory',
            contributionRate: 0.11, // 11% from July 2023
            employerMatch: 0.11,
            withdrawalAge: 67
          }
        ],
        
        regulations: {
          maxCashTransaction: 10000,
          reportingCurrency: 'AUD',
          gstRate: 0.10, // 10% GST
          personalTaxRates: [
            { min: 0, max: 18200, rate: 0 },
            { min: 18201, max: 45000, rate: 0.19 },
            { min: 45001, max: 120000, rate: 0.325 },
            { min: 120001, max: 180000, rate: 0.37 },
            { min: 180001, max: Infinity, rate: 0.45 }
          ]
        },
        
        culture: {
          weekStart: 'monday',
          businessDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          holidays: [
            { name: 'New Year\'s Day', date: '01-01' },
            { name: 'Australia Day', date: '01-26' },
            { name: 'ANZAC Day', date: '04-25' },
            { name: 'Christmas Day', date: '12-25' },
            { name: 'Boxing Day', date: '12-26' }
          ],
          paymentMethods: ['EFTPOS', 'Tap and Go', 'Bank Transfer', 'BPAY']
        }
      },
      
      // === UNITED KINGDOM === //
      'UK': {
        name: 'United Kingdom',
        currency: 'GBP',
        currencySymbol: '£',
        locale: 'en-GB',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        numberFormat: {
          decimal: '.',
          thousands: ',',
          pattern: '1,234.56'
        },
        
        financialYear: {
          start: { month: 4, day: 6 }, // April 6
          end: { month: 4, day: 5 }   // April 5 (next year)
        },
        taxYear: 'april-april',
        emergencyFundMonths: 6,
        
        banks: [
          {
            name: 'Barclays',
            code: 'BARCLAYS',
            csvFormat: 'BARCLAYS_UK',
            logo: '/images/banks/barclays.png',
            website: 'https://www.barclays.co.uk',
            fields: {
              date: 'Date',
              amount: 'Amount',
              description: 'Description',
              balance: 'Balance'
            }
          },
          {
            name: 'HSBC UK',
            code: 'HSBC_UK',
            csvFormat: 'HSBC_UK',
            logo: '/images/banks/hsbc-uk.png',
            website: 'https://www.hsbc.co.uk',
            fields: {
              date: 'Date',
              amount: 'Amount',
              description: 'Description',
              balance: 'Balance'
            }
          },
          {
            name: 'Lloyds Bank',
            code: 'LLOYDS',
            csvFormat: 'LLOYDS_UK',
            logo: '/images/banks/lloyds.png',
            website: 'https://www.lloydsbank.com',
            fields: {
              date: 'Date',
              amount: 'Amount',
              description: 'Description',
              balance: 'Balance'
            }
          },
          {
            name: 'NatWest',
            code: 'NATWEST',
            csvFormat: 'NATWEST_UK',
            logo: '/images/banks/natwest.png',
            website: 'https://www.natwest.com',
            fields: {
              date: 'Date',
              amount: 'Amount',
              description: 'Description',
              balance: 'Balance'
            }
          }
        ],
        
        retirementAccounts: [
          {
            name: 'Workplace Pension',
            type: 'auto-enrollment',
            contributionRate: 0.05, // 5% minimum employee
            employerMatch: 0.03,    // 3% minimum employer
            withdrawalAge: 67
          },
          {
            name: 'ISA (Individual Savings Account)',
            type: 'voluntary',
            annualLimit: 20000, // £20,000 annual ISA allowance
            taxAdvantage: 'tax-free'
          }
        ],
        
        regulations: {
          maxCashTransaction: 10000,
          reportingCurrency: 'GBP',
          vatRate: 0.20, // 20% VAT
          personalTaxRates: [
            { min: 0, max: 12570, rate: 0 },      // Personal allowance
            { min: 12571, max: 50270, rate: 0.20 }, // Basic rate
            { min: 50271, max: 125140, rate: 0.40 }, // Higher rate
            { min: 125141, max: Infinity, rate: 0.45 } // Additional rate
          ]
        },
        
        culture: {
          weekStart: 'monday',
          businessDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          holidays: [
            { name: 'New Year\'s Day', date: '01-01' },
            { name: 'Easter Monday', date: 'variable' },
            { name: 'May Day', date: '05-01' },
            { name: 'Christmas Day', date: '12-25' },
            { name: 'Boxing Day', date: '12-26' }
          ],
          paymentMethods: ['Contactless', 'Chip & PIN', 'Bank Transfer', 'Direct Debit']
        }
      },
      
      // === UNITED STATES === //
      'US': {
        name: 'United States',
        currency: 'USD',
        currencySymbol: '$',
        locale: 'en-US',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        numberFormat: {
          decimal: '.',
          thousands: ',',
          pattern: '1,234.56'
        },
        
        financialYear: {
          start: { month: 1, day: 1 }, // January 1
          end: { month: 12, day: 31 }  // December 31
        },
        taxYear: 'calendar',
        emergencyFundMonths: 6,
        
        banks: [
          {
            name: 'JPMorgan Chase',
            code: 'CHASE',
            csvFormat: 'CHASE_US',
            logo: '/images/banks/chase.png',
            website: 'https://www.chase.com',
            fields: {
              date: 'Posting Date',
              amount: 'Amount',
              description: 'Description',
              balance: 'Balance'
            }
          },
          {
            name: 'Bank of America',
            code: 'BOA',
            csvFormat: 'BOA_US',
            logo: '/images/banks/boa.png',
            website: 'https://www.bankofamerica.com',
            fields: {
              date: 'Date',
              amount: 'Amount',
              description: 'Description',
              balance: 'Running Bal.'
            }
          },
          {
            name: 'Wells Fargo',
            code: 'WELLS_FARGO',
            csvFormat: 'WELLS_FARGO_US',
            logo: '/images/banks/wells-fargo.png',
            website: 'https://www.wellsfargo.com',
            fields: {
              date: 'Date',
              amount: 'Amount',
              description: 'Description',
              balance: 'Balance'
            }
          },
          {
            name: 'Citibank',
            code: 'CITI',
            csvFormat: 'CITI_US',
            logo: '/images/banks/citi.png',
            website: 'https://www.citibank.com',
            fields: {
              date: 'Date',
              amount: 'Debit',
              credit: 'Credit',
              description: 'Description',
              balance: 'Balance'
            }
          }
        ],
        
        retirementAccounts: [
          {
            name: '401(k)',
            type: 'employer-sponsored',
            contributionLimit: 23000, // 2024 limit
            employerMatchCommon: 0.06, // 6% common match
            withdrawalAge: 59.5
          },
          {
            name: 'Traditional IRA',
            type: 'individual',
            contributionLimit: 7000, // 2024 limit
            taxAdvantage: 'tax-deferred'
          },
          {
            name: 'Roth IRA',
            type: 'individual',
            contributionLimit: 7000, // 2024 limit
            taxAdvantage: 'tax-free'
          }
        ],
        
        regulations: {
          maxCashTransaction: 10000,
          reportingCurrency: 'USD',
          salesTaxVaries: true, // State-dependent
          personalTaxRates: [ // Federal rates
            { min: 0, max: 11000, rate: 0.10 },
            { min: 11001, max: 44725, rate: 0.12 },
            { min: 44726, max: 95375, rate: 0.22 },
            { min: 95376, max: 182050, rate: 0.24 },
            { min: 182051, max: 231250, rate: 0.32 },
            { min: 231251, max: 578125, rate: 0.35 },
            { min: 578126, max: Infinity, rate: 0.37 }
          ]
        },
        
        culture: {
          weekStart: 'sunday',
          businessDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          holidays: [
            { name: 'New Year\'s Day', date: '01-01' },
            { name: 'Independence Day', date: '07-04' },
            { name: 'Thanksgiving', date: 'variable' },
            { name: 'Christmas Day', date: '12-25' }
          ],
          paymentMethods: ['Credit Card', 'Debit Card', 'ACH Transfer', 'Check', 'Zelle', 'Venmo']
        }
      },
      
      // === CANADA === //
      'CA': {
        name: 'Canada',
        currency: 'CAD',
        currencySymbol: '$',
        locale: 'en-CA',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        numberFormat: {
          decimal: '.',
          thousands: ',',
          pattern: '1,234.56'
        },
        
        financialYear: {
          start: { month: 1, day: 1 }, // January 1
          end: { month: 12, day: 31 }  // December 31
        },
        taxYear: 'calendar',
        emergencyFundMonths: 6,
        
        banks: [
          {
            name: 'Royal Bank of Canada',
            code: 'RBC',
            csvFormat: 'RBC_CA',
            logo: '/images/banks/rbc.png',
            website: 'https://www.rbc.com',
            fields: {
              date: 'Date',
              amount: 'Amount',
              description: 'Description',
              balance: 'Balance'
            }
          },
          {
            name: 'Toronto-Dominion Bank',
            code: 'TD',
            csvFormat: 'TD_CA',
            logo: '/images/banks/td.png',
            website: 'https://www.td.com',
            fields: {
              date: 'Date',
              amount: 'Amount',
              description: 'Description',
              balance: 'Balance'
            }
          },
          {
            name: 'Bank of Nova Scotia',
            code: 'SCOTIABANK',
            csvFormat: 'SCOTIABANK_CA',
            logo: '/images/banks/scotiabank.png',
            website: 'https://www.scotiabank.com',
            fields: {
              date: 'Date',
              amount: 'Amount',
              description: 'Description',
              balance: 'Balance'
            }
          },
          {
            name: 'Bank of Montreal',
            code: 'BMO',
            csvFormat: 'BMO_CA',
            logo: '/images/banks/bmo.png',
            website: 'https://www.bmo.com',
            fields: {
              date: 'Date',
              amount: 'Amount',
              description: 'Description',
              balance: 'Balance'
            }
          }
        ],
        
        retirementAccounts: [
          {
            name: 'RRSP (Registered Retirement Savings Plan)',
            type: 'individual',
            contributionLimit: 0.18, // 18% of income or dollar limit
            taxAdvantage: 'tax-deferred',
            withdrawalAge: 65
          },
          {
            name: 'TFSA (Tax-Free Savings Account)',
            type: 'individual',
            annualLimit: 7000, // 2024 limit
            taxAdvantage: 'tax-free'
          }
        ],
        
        regulations: {
          maxCashTransaction: 10000,
          reportingCurrency: 'CAD',
          gstRate: 0.05, // 5% GST (federal)
          pstVaries: true, // Provincial sales tax varies
          personalTaxRates: [ // Federal rates
            { min: 0, max: 55867, rate: 0.15 },
            { min: 55868, max: 111733, rate: 0.205 },
            { min: 111734, max: 173205, rate: 0.26 },
            { min: 173206, max: 246752, rate: 0.29 },
            { min: 246753, max: Infinity, rate: 0.33 }
          ]
        },
        
        culture: {
          weekStart: 'sunday',
          businessDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          holidays: [
            { name: 'New Year\'s Day', date: '01-01' },
            { name: 'Canada Day', date: '07-01' },
            { name: 'Thanksgiving', date: 'variable' },
            { name: 'Christmas Day', date: '12-25' },
            { name: 'Boxing Day', date: '12-26' }
          ],
          paymentMethods: ['Interac', 'Credit Card', 'E-Transfer', 'Tap']
        }
      }
    };
  }
  
  // === INITIALIZATION === //
  
  initializeFromStorage() {
    try {
      const storedCountry = localStorage.getItem('smartfinance_country');
      const storedCurrency = localStorage.getItem('smartfinance_currency');
      const storedLocale = localStorage.getItem('smartfinance_locale');
      
      if (storedCountry && this.countries[storedCountry]) {
        this.setCountry(storedCountry);
      }
      
      if (storedCurrency) {
        this.currentCurrency = storedCurrency;
      }
      
      if (storedLocale) {
        this.currentLocale = storedLocale;
      }
      
      // Load cached exchange rates
      const cachedRates = localStorage.getItem('smartfinance_exchange_rates');
      const lastUpdate = localStorage.getItem('smartfinance_rates_update');
      
      if (cachedRates && lastUpdate) {
        this.exchangeRates = new Map(JSON.parse(cachedRates));
        this.lastRateUpdate = parseInt(lastUpdate);
        
        // Update rates if cache is stale
        if (Date.now() - this.lastRateUpdate > this.rateUpdateInterval) {
          this.updateExchangeRates();
        }
      } else {
        this.updateExchangeRates();
      }
      
      console.log(`🌍 Localization initialized for ${this.currentCountry} (${this.currentCurrency})`);
      
    } catch (error) {
      console.error('❌ Failed to initialize localization from storage:', error);
    }
  }
  
  // === COUNTRY MANAGEMENT === //
  
  setCountry(countryCode) {
    if (!this.countries[countryCode]) {
      throw new Error(`Unsupported country: ${countryCode}`);
    }
    
    const country = this.countries[countryCode];
    
    this.currentCountry = countryCode;
    this.currentCurrency = country.currency;
    this.currentLocale = country.locale;
    
    // Store preferences
    localStorage.setItem('smartfinance_country', countryCode);
    localStorage.setItem('smartfinance_currency', country.currency);
    localStorage.setItem('smartfinance_locale', country.locale);
    
    console.log(`🌍 Country set to: ${country.name} (${country.currency})`);
    
    return country;
  }
  
  getCurrentCountry() {
    return this.countries[this.currentCountry];
  }
  
  getSupportedCountries() {
    return Object.entries(this.countries).map(([code, config]) => ({
      code: code,
      name: config.name,
      currency: config.currency,
      currencySymbol: config.currencySymbol,
      flag: `/images/flags/${code.toLowerCase()}.png`
    }));
  }
  
  // === CURRENCY MANAGEMENT === //
  
  async updateExchangeRates() {
    try {
      console.log('💱 Updating exchange rates...');
      
      // Try each API endpoint until one succeeds
      for (const apiUrl of this.exchangeRateAPIs) {
        try {
          const response = await fetch(apiUrl);
          if (!response.ok) continue;
          
          const data = await response.json();
          
          if (data.rates) {
            // Store rates with USD as base
            this.exchangeRates.clear();
            for (const [currency, rate] of Object.entries(data.rates)) {
              this.exchangeRates.set(currency, rate);
            }
            
            // Ensure USD rate is 1
            this.exchangeRates.set('USD', 1);
            
            this.lastRateUpdate = Date.now();
            
            // Cache rates
            localStorage.setItem('smartfinance_exchange_rates', 
              JSON.stringify([...this.exchangeRates]));
            localStorage.setItem('smartfinance_rates_update', 
              this.lastRateUpdate.toString());
            
            console.log('✅ Exchange rates updated successfully');
            return true;
          }
          
        } catch (apiError) {
          console.warn(`⚠️ Failed to fetch from ${apiUrl}:`, apiError);
          continue;
        }
      }
      
      throw new Error('All exchange rate APIs failed');
      
    } catch (error) {
      console.error('❌ Failed to update exchange rates:', error);
      
      // Use fallback rates if no cached rates exist
      if (this.exchangeRates.size === 0) {
        this.setFallbackRates();
      }
      
      return false;
    }
  }
  
  setFallbackRates() {
    // Static fallback rates (should be updated periodically)
    const fallbackRates = {
      'USD': 1.00,
      'EUR': 0.85,
      'GBP': 0.73,
      'JPY': 110.00,
      'AUD': 1.35,
      'CAD': 1.25,
      'NZD': 1.45,
      'CHF': 0.92,
      'CNY': 6.45,
      'SGD': 1.35
    };
    
    this.exchangeRates.clear();
    for (const [currency, rate] of Object.entries(fallbackRates)) {
      this.exchangeRates.set(currency, rate);
    }
    
    console.log('⚠️ Using fallback exchange rates');
  }
  
  convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
      return amount;
    }
    
    const fromRate = this.exchangeRates.get(fromCurrency);
    const toRate = this.exchangeRates.get(toCurrency);
    
    if (!fromRate || !toRate) {
      console.warn(`⚠️ Exchange rate not available for ${fromCurrency} or ${toCurrency}`);
      return amount; // Return original amount if conversion not possible
    }
    
    // Convert through USD
    const usdAmount = amount / fromRate;
    const convertedAmount = usdAmount * toRate;
    
    return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
  }
  
  getExchangeRate(fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
      return 1;
    }
    
    const fromRate = this.exchangeRates.get(fromCurrency);
    const toRate = this.exchangeRates.get(toCurrency);
    
    if (!fromRate || !toRate) {
      return null;
    }
    
    return toRate / fromRate;
  }
  
  // === FORMATTING === //
  
  formatCurrency(amount, currency = null, options = {}) {
    const targetCurrency = currency || this.currentCurrency;
    const country = this.getCurrentCountry();
    
    const formatOptions = {
      style: 'currency',
      currency: targetCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options
    };
    
    try {
      return new Intl.NumberFormat(this.currentLocale, formatOptions).format(amount);
    } catch (error) {
      console.error('❌ Currency formatting failed:', error);
      // Fallback formatting
      return `${country.currencySymbol}${this.formatNumber(amount)}`;
    }
  }
  
  formatNumber(number, options = {}) {
    const country = this.getCurrentCountry();
    
    const formatOptions = {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
      ...options
    };
    
    try {
      return new Intl.NumberFormat(this.currentLocale, formatOptions).format(number);
    } catch (error) {
      console.error('❌ Number formatting failed:', error);
      // Fallback formatting
      return number.toLocaleString('en-US', formatOptions);
    }
  }
  
  formatDate(date, format = null) {
    const country = this.getCurrentCountry();
    const targetFormat = format || country.dateFormat;
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    
    try {
      // Use Intl.DateTimeFormat for proper localization
      const options = this.getDateFormatOptions(targetFormat);
      return new Intl.DateTimeFormat(this.currentLocale, options).format(dateObj);
    } catch (error) {
      console.error('❌ Date formatting failed:', error);
      // Fallback to ISO format
      return dateObj.toISOString().split('T')[0];
    }
  }
  
  getDateFormatOptions(format) {
    const formatMap = {
      'DD/MM/YYYY': { day: '2-digit', month: '2-digit', year: 'numeric' },
      'MM/DD/YYYY': { month: '2-digit', day: '2-digit', year: 'numeric' },
      'YYYY-MM-DD': { year: 'numeric', month: '2-digit', day: '2-digit' },
      'DD-MM-YYYY': { day: '2-digit', month: '2-digit', year: 'numeric' }
    };
    
    return formatMap[format] || formatMap['DD/MM/YYYY'];
  }
  
  formatTime(date, format = null) {
    const country = this.getCurrentCountry();
    const use24Hour = format === '24h' || (format === null && country.timeFormat === '24h');
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Time';
    }
    
    try {
      const options = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: !use24Hour
      };
      
      return new Intl.DateTimeFormat(this.currentLocale, options).format(dateObj);
    } catch (error) {
      console.error('❌ Time formatting failed:', error);
      return dateObj.toTimeString().slice(0, 5);
    }
  }
  
  // === BANKING INTEGRATION === //
  
  getBankByCode(bankCode) {
    const country = this.getCurrentCountry();
    return country.banks.find(bank => bank.code === bankCode);
  }
  
  getAllBanks() {
    const country = this.getCurrentCountry();
    return country.banks;
  }
  
  detectBankFromCSV(csvHeaders) {
    const country = this.getCurrentCountry();
    
    for (const bank of country.banks) {
      const fieldMatches = Object.values(bank.fields).filter(field => 
        csvHeaders.some(header => 
          header.toLowerCase().includes(field.toLowerCase()) ||
          field.toLowerCase().includes(header.toLowerCase())
        )
      );
      
      // If more than half the fields match, it's likely this bank
      if (fieldMatches.length >= Object.keys(bank.fields).length * 0.6) {
        return bank;
      }
    }
    
    return null;
  }
  
  getBankCSVMapping(bankCode) {
    const bank = this.getBankByCode(bankCode);
    if (!bank) {
      throw new Error(`Bank not found: ${bankCode}`);
    }
    
    return {
      bankName: bank.name,
      bankCode: bank.code,
      fields: bank.fields,
      csvFormat: bank.csvFormat
    };
  }
  
  // === FINANCIAL REGULATIONS === //
  
  getEmergencyFundTarget(monthlyExpenses) {
    const country = this.getCurrentCountry();
    return monthlyExpenses * country.emergencyFundMonths;
  }
  
  getTaxRate(income) {
    const country = this.getCurrentCountry();
    const taxRates = country.regulations.personalTaxRates;
    
    let totalTax = 0;
    let remainingIncome = income;
    
    for (const bracket of taxRates) {
      if (remainingIncome <= 0) break;
      
      const taxableInBracket = Math.min(
        remainingIncome, 
        bracket.max - bracket.min + 1
      );
      
      totalTax += taxableInBracket * bracket.rate;
      remainingIncome -= taxableInBracket;
    }
    
    return {
      totalTax: totalTax,
      effectiveRate: totalTax / income,
      afterTaxIncome: income - totalTax
    };
  }
  
  getRetirementAccountInfo() {
    const country = this.getCurrentCountry();
    return country.retirementAccounts;
  }
  
  getSalesTaxRate() {
    const country = this.getCurrentCountry();
    const regulations = country.regulations;
    
    if (regulations.gstRate !== undefined) {
      return regulations.gstRate;
    } else if (regulations.vatRate !== undefined) {
      return regulations.vatRate;
    } else if (regulations.salesTaxVaries) {
      return null; // Varies by state/province
    }
    
    return 0;
  }
  
  // === CULTURAL ADAPTATIONS === //
  
  getBusinessDays() {
    const country = this.getCurrentCountry();
    return country.culture.businessDays;
  }
  
  getWeekStart() {
    const country = this.getCurrentCountry();
    return country.culture.weekStart;
  }
  
  getHolidays() {
    const country = this.getCurrentCountry();
    return country.culture.holidays;
  }
  
  getPaymentMethods() {
    const country = this.getCurrentCountry();
    return country.culture.paymentMethods;
  }
  
  isBusinessDay(date) {
    const dateObj = date instanceof Date ? date : new Date(date);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dateObj.getDay()];
    
    const businessDays = this.getBusinessDays();
    return businessDays.includes(dayName);
  }
  
  isHoliday(date) {
    const dateObj = date instanceof Date ? date : new Date(date);
    const monthDay = String(dateObj.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(dateObj.getDate()).padStart(2, '0');
    
    const holidays = this.getHolidays();
    return holidays.some(holiday => holiday.date === monthDay);
  }
  
  // === FINANCIAL YEAR CALCULATIONS === //
  
  getCurrentFinancialYear() {
    const country = this.getCurrentCountry();
    const now = new Date();
    const fyStart = country.financialYear.start;
    const fyEnd = country.financialYear.end;
    
    // Create financial year start date for current year
    const currentFYStart = new Date(now.getFullYear(), fyStart.month - 1, fyStart.day);
    
    // If we're before the FY start, we're in the previous financial year
    if (now < currentFYStart) {
      return {
        startYear: now.getFullYear() - 1,
        endYear: fyEnd.month < fyStart.month ? now.getFullYear() : now.getFullYear() - 1,
        startDate: new Date(now.getFullYear() - 1, fyStart.month - 1, fyStart.day),
        endDate: new Date(
          fyEnd.month < fyStart.month ? now.getFullYear() : now.getFullYear() - 1, 
          fyEnd.month - 1, 
          fyEnd.day
        )
      };
    } else {
      return {
        startYear: now.getFullYear(),
        endYear: fyEnd.month < fyStart.month ? now.getFullYear() + 1 : now.getFullYear(),
        startDate: currentFYStart,
        endDate: new Date(
          fyEnd.month < fyStart.month ? now.getFullYear() + 1 : now.getFullYear(), 
          fyEnd.month - 1, 
          fyEnd.day
        )
      };
    }
  }
  
  getFinancialYearDates(year) {
    const country = this.getCurrentCountry();
    const fyStart = country.financialYear.start;
    const fyEnd = country.financialYear.end;
    
    const startDate = new Date(year, fyStart.month - 1, fyStart.day);
    const endDate = new Date(
      fyEnd.month < fyStart.month ? year + 1 : year, 
      fyEnd.month - 1, 
      fyEnd.day
    );
    
    return { startDate, endDate };
  }
  
  // === TRANSACTION CATEGORIZATION === //
  
  suggestCategoryFromMerchant(merchantName, amount) {
    const merchant = merchantName.toLowerCase();
    
    // Common merchant patterns for categorization
    const categoryPatterns = {
      'food_groceries': ['supermarket', 'grocery', 'woolworths', 'coles', 'countdown', 'pak n save', 'fresh choice'],
      'food_dining': ['restaurant', 'cafe', 'mcdonald', 'kfc', 'subway', 'pizza', 'takeaway'],
      'transport_fuel': ['bp', 'shell', 'mobil', 'caltex', 'z energy', 'gull'],
      'transport_public': ['metro', 'bus', 'train', 'uber', 'lyft', 'taxi'],
      'shopping_clothing': ['clothing', 'fashion', 'nike', 'adidas', 'h&m', 'zara'],
      'entertainment_movies': ['cinema', 'movie', 'netflix', 'spotify', 'disney'],
      'health_medical': ['pharmacy', 'doctor', 'medical', 'dental', 'hospital'],
      'utilities': ['power', 'electricity', 'gas', 'water', 'internet', 'phone'],
      'insurance': ['insurance', 'assurance'],
      'banking': ['bank', 'atm', 'interest', 'fee']
    };
    
    for (const [category, patterns] of Object.entries(categoryPatterns)) {
      if (patterns.some(pattern => merchant.includes(pattern))) {
        return category;
      }
    }
    
    // Default categorization based on amount
    if (Math.abs(amount) < 10) {
      return 'miscellaneous_small';
    } else if (Math.abs(amount) > 1000) {
      return 'large_expense';
    }
    
    return 'uncategorized';
  }
  
  // === VALIDATION === //
  
  validateCurrency(currencyCode) {
    return this.exchangeRates.has(currencyCode) || 
           Object.values(this.countries).some(country => country.currency === currencyCode);
  }
  
  validateCountryCode(countryCode) {
    return this.countries.hasOwnProperty(countryCode);
  }
  
  validateAmount(amount, currency = null) {
    const targetCurrency = currency || this.currentCurrency;
    
    if (typeof amount !== 'number' || isNaN(amount)) {
      return { valid: false, error: 'Amount must be a valid number' };
    }
    
    if (amount < 0) {
      return { valid: false, error: 'Amount cannot be negative' };
    }
    
    // Check for reasonable limits (prevent data entry errors)
    const maxAmount = 1000000000; // 1 billion
    if (amount > maxAmount) {
      return { valid: false, error: 'Amount exceeds maximum limit' };
    }
    
    return { valid: true };
  }
  
  // === LOCALIZATION DATA EXPORT === //
  
  getLocalizationData() {
    const country = this.getCurrentCountry();
    
    return {
      country: {
        code: this.currentCountry,
        name: country.name,
        currency: country.currency,
        currencySymbol: country.currencySymbol,
        locale: country.locale
      },
      formatting: {
        dateFormat: country.dateFormat,
        timeFormat: country.timeFormat,
        numberFormat: country.numberFormat
      },
      financial: {
        emergencyFundMonths: country.emergencyFundMonths,
        financialYear: country.financialYear,
        taxYear: country.taxYear
      },
      culture: country.culture,
      exchangeRates: Object.fromEntries(this.exchangeRates),
      lastRateUpdate: this.lastRateUpdate
    };
  }
  
  // === SEARCH AND FILTERING === //
  
  searchBanks(query) {
    const country = this.getCurrentCountry();
    const lowerQuery = query.toLowerCase();
    
    return country.banks.filter(bank => 
      bank.name.toLowerCase().includes(lowerQuery) ||
      bank.code.toLowerCase().includes(lowerQuery)
    );
  }
  
  filterBanksByType(type) {
    const country = this.getCurrentCountry();
    // This could be extended to support bank types in the future
    return country.banks;
  }
  
  // === SETTINGS MANAGEMENT === //
  
  updateSettings(settings) {
    try {
      if (settings.country && this.validateCountryCode(settings.country)) {
        this.setCountry(settings.country);
      }
      
      if (settings.currency && this.validateCurrency(settings.currency)) {
        this.currentCurrency = settings.currency;
        localStorage.setItem('smartfinance_currency', settings.currency);
      }
      
      if (settings.locale) {
        this.currentLocale = settings.locale;
        localStorage.setItem('smartfinance_locale', settings.locale);
      }
      
      console.log('✅ Localization settings updated');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Failed to update localization settings:', error);
      throw error;
    }
  }
  
  getSettings() {
    return {
      country: this.currentCountry,
      currency: this.currentCurrency,
      locale: this.currentLocale,
      supportedCountries: this.getSupportedCountries(),
      supportedCurrencies: [...this.exchangeRates.keys()].sort()
    };
  }
  
  // === ANALYTICS AND INSIGHTS === //
  
  getFinancialInsights(transactions, goals, income) {
    const country = this.getCurrentCountry();
    const insights = [];
    
    // Emergency fund analysis
    const monthlyExpenses = this.calculateMonthlyExpenses(transactions);
    const emergencyTarget = this.getEmergencyFundTarget(monthlyExpenses);
    const currentSavings = this.calculateCurrentSavings(goals);
    
    if (currentSavings < emergencyTarget) {
      insights.push({
        type: 'emergency_fund',
        priority: 'high',
        message: `Your emergency fund should be ${this.formatCurrency(emergencyTarget)} (${country.emergencyFundMonths} months of expenses). You currently have ${this.formatCurrency(currentSavings)}.`,
        actionable: true,
        action: 'increase_emergency_savings'
      });
    }
    
    // Tax optimization insights
    if (income) {
      const taxInfo = this.getTaxRate(income);
      const retirementAccounts = this.getRetirementAccountInfo();
      
      for (const account of retirementAccounts) {
        if (account.taxAdvantage === 'tax-deferred') {
          insights.push({
            type: 'tax_optimization',
            priority: 'medium',
            message: `Consider maximizing your ${account.name} contributions to reduce taxable income. Your current tax rate is ${(taxInfo.effectiveRate * 100).toFixed(1)}%.`,
            actionable: true,
            action: 'optimize_retirement_contributions'
          });
        }
      }
    }
    
    // Currency diversification
    const currencies = this.getTransactionCurrencies(transactions);
    if (currencies.length === 1 && currencies[0] === this.currentCurrency) {
      insights.push({
        type: 'currency_diversification',
        priority: 'low',
        message: 'Consider diversifying your investments across different currencies to reduce currency risk.',
        actionable: false
      });
    }
    
    return insights;
  }
  
  calculateMonthlyExpenses(transactions) {
    // Calculate average monthly expenses from last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const recentExpenses = transactions
      .filter(t => new Date(t.date) >= threeMonthsAgo && t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    return recentExpenses / 3; // Average per month
  }
  
  calculateCurrentSavings(goals) {
    return goals
      .filter(g => g.category === 'emergency' || g.category === 'savings')
      .reduce((sum, g) => sum + (g.currentAmount || 0), 0);
  }
  
  getTransactionCurrencies(transactions) {
    const currencies = new Set();
    transactions.forEach(t => {
      if (t.currency) {
        currencies.add(t.currency);
      }
    });
    return [...currencies];
  }
  
  // === PERFORMANCE MONITORING === //
  
  getPerformanceMetrics() {
    return {
      exchangeRateAge: this.lastRateUpdate ? Date.now() - this.lastRateUpdate : null,
      cachedRatesCount: this.exchangeRates.size,
      supportedCountries: Object.keys(this.countries).length,
      currentLocale: this.currentLocale,
      memoryUsage: {
        countries: JSON.stringify(this.countries).length,
        exchangeRates: JSON.stringify([...this.exchangeRates]).length
      }
    };
  }
  
  // === CLEANUP === //
  
  destroy() {
    // Clear any timers or intervals that might be running
    // In this implementation, we don't have persistent timers,
    // but this method provides a cleanup hook for future enhancements
    
    console.log('🧹 LocalizationManager destroyed');
  }
}

// === UTILITY FUNCTIONS === //

// Helper function to get timezone-aware date
function getLocalizedDate(date, timezone) {
  return new Date(date.toLocaleString("en-US", { timeZone: timezone }));
}

// Helper function to parse different date formats
function parseFlexibleDate(dateString, country) {
  const formats = [
    country.dateFormat,
    'YYYY-MM-DD',
    'MM/DD/YYYY',
    'DD/MM/YYYY',
    'DD-MM-YYYY'
  ];
  
  for (const format of formats) {
    try {
      // Simple date parsing logic - in production, use a proper date library
      const parts = dateString.split(/[\/\-]/);
      if (parts.length === 3) {
        let day, month, year;
        
        if (format.includes('DD/MM')) {
          [day, month, year] = parts;
        } else if (format.includes('MM/DD')) {
          [month, day, year] = parts;
        } else if (format.includes('YYYY-MM-DD')) {
          [year, month, day] = parts;
        }
        
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    } catch (error) {
      continue;
    }
  }
  
  // Fallback to native Date parsing
  return new Date(dateString);
}

// === EXPORT === //
export default LocalizationManager;