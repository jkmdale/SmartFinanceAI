/**
 * SmartFinanceAI - Universal CSV Processor
 * 
 * Processes bank statements from 50+ global banks with automatic
 * format detection, field mapping, and transaction standardization.
 * 
 * Features:
 * - Automatic bank format detection
 * - Universal CSV parsing with error recovery
 * - Field mapping and validation
 * - Transaction deduplication
 * - Multi-currency support
 * - Progress tracking for large files
 */

class CSVProcessor {
  constructor() {
    this.bankFormats = new Map();
    this.parsedData = null;
    this.processingProgress = null;
    this.listeners = new Set();
    
    // Processing configuration
    this.config = {
      maxFileSize: 50 * 1024 * 1024, // 50MB
      chunkSize: 1000, // Process 1000 rows at a time
      errorThreshold: 0.1, // 10% error threshold
      dateFormats: [
        'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD',
        'DD-MM-YYYY', 'MM-DD-YYYY', 'DD.MM.YYYY',
        'YYYY/MM/DD', 'DD MMM YYYY', 'MMM DD, YYYY'
      ],
      delimiterGuess: [',', ';', '\t', '|'],
      encodings: ['UTF-8', 'ISO-8859-1', 'Windows-1252']
    };

    this.initialize();
  }

  async initialize() {
    try {
      console.log('Initializing CSV Processor...');
      
      // Load bank format definitions
      await this.loadBankFormats();
      
      // Initialize Papa Parse
      await this.initializePapaparse();
      
      console.log('CSV Processor initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize CSV Processor:', error);
      throw error;
    }
  }

  /**
   * Load bank format definitions
   * @private
   */
  async loadBankFormats() {
    // Import bank formats from separate configuration
    const { bankFormats } = await import('./bank-formats.js');
    
    // Store formats in map for quick lookup
    bankFormats.forEach(format => {
      this.bankFormats.set(format.id, format);
    });

    console.log(`Loaded ${this.bankFormats.size} bank formats`);
  }

  /**
   * Initialize Papa Parse library
   * @private
   */
  async initializePapaparse() {
    if (typeof Papa === 'undefined') {
      // Dynamically import Papa Parse if not available
      const Papa = await import('papaparse');
      window.Papa = Papa.default || Papa;
    }
  }

  /**
   * Process CSV file with automatic format detection
   * @param {File|string} csvData - CSV file or string data
   * @param {object} options - Processing options
   * @returns {Promise<object>} Processing result
   */
  async processCSV(csvData, options = {}) {
    try {
      console.log('Starting CSV processing...');
      
      // Initialize progress tracking
      this.initializeProgress();
      
      // Validate input
      await this.validateInput(csvData);
      
      // Convert File to string if needed
      const csvString = await this.readCSVData(csvData);
      
      // Detect file encoding
      const encoding = await this.detectEncoding(csvString);
      this.updateProgress('Detected file encoding', 10);
      
      // Detect CSV format and delimiter
      const formatInfo = await this.detectCSVFormat(csvString);
      this.updateProgress('Detected CSV format', 20);
      
      // Parse CSV data
      const parsedData = await this.parseCSVData(csvString, formatInfo);
      this.updateProgress('Parsed CSV data', 40);
      
      // Detect bank format
      const bankFormat = options.bankFormat || await this.detectBankFormat(parsedData);
      this.updateProgress('Detected bank format', 50);
      
      // Map fields to standard format
      const mappedData = await this.mapFields(parsedData, bankFormat);
      this.updateProgress('Mapped fields', 70);
      
      // Validate and clean data
      const cleanedData = await this.validateAndCleanData(mappedData, bankFormat);
      this.updateProgress('Validated data', 85);
      
      // Generate processing summary
      const summary = this.generateProcessingSummary(cleanedData, bankFormat);
      this.updateProgress('Processing complete', 100);
      
      const result = {
        success: true,
        data: cleanedData,
        summary: summary,
        bankFormat: bankFormat,
        encoding: encoding,
        formatInfo: formatInfo
      };

      // Store processed data
      this.parsedData = result;
      
      // Notify listeners
      this.notifyListeners('PROCESSING_COMPLETE', result);
      
      // Log processing success
      if (window.auditLogger) {
        await window.auditLogger.logUserAction('CSV_PROCESSING_SUCCESS', {
          recordCount: cleanedData.length,
          bankFormat: bankFormat.id,
          fileSize: csvString.length
        });
      }

      return result;

    } catch (error) {
      console.error('CSV processing failed:', error);
      
      const errorResult = {
        success: false,
        error: error.message,
        stage: this.processingProgress?.stage || 'unknown'
      };

      // Log processing failure
      if (window.auditLogger) {
        await window.auditLogger.logUserAction('CSV_PROCESSING_FAILED', {
          error: error.message,
          stage: errorResult.stage
        });
      }

      throw errorResult;
    }
  }

  /**
   * Validate CSV input
   * @private
   */
  async validateInput(csvData) {
    if (!csvData) {
      throw new Error('No CSV data provided');
    }

    if (csvData instanceof File) {
      // Validate file size
      if (csvData.size > this.config.maxFileSize) {
        throw new Error(`File too large. Maximum size: ${this.config.maxFileSize / 1024 / 1024}MB`);
      }

      // Validate file type
      const validTypes = ['text/csv', 'application/csv', 'text/plain'];
      if (!validTypes.includes(csvData.type) && !csvData.name.toLowerCase().endsWith('.csv')) {
        throw new Error('Invalid file type. Please upload a CSV file.');
      }
    } else if (typeof csvData === 'string') {
      // Validate string length
      if (csvData.length > this.config.maxFileSize) {
        throw new Error('CSV data too large');
      }
    } else {
      throw new Error('Invalid CSV data format');
    }
  }

  /**
   * Read CSV data from File or string
   * @private
   */
  async readCSVData(csvData) {
    if (typeof csvData === 'string') {
      return csvData;
    }

    if (csvData instanceof File) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
          resolve(event.target.result);
        };
        
        reader.onerror = () => {
          reject(new Error('Failed to read file'));
        };
        
        reader.readAsText(csvData);
      });
    }

    throw new Error('Unsupported CSV data type');
  }

  /**
   * Detect file encoding
   * @private
   */
  async detectEncoding(csvString) {
    // Simple encoding detection based on character patterns
    try {
      // Check for BOM
      if (csvString.charCodeAt(0) === 0xFEFF) {
        return 'UTF-8-BOM';
      }

      // Check for non-ASCII characters
      if (/[\u0080-\uFFFF]/.test(csvString)) {
        return 'UTF-8';
      }

      // Default to UTF-8
      return 'UTF-8';

    } catch (error) {
      console.warn('Encoding detection failed, using UTF-8');
      return 'UTF-8';
    }
  }

  /**
   * Detect CSV format and delimiter
   * @private
   */
  async detectCSVFormat(csvString) {
    const lines = csvString.split('\n').slice(0, 10); // Analyze first 10 lines
    let bestDelimiter = ',';
    let maxFields = 0;

    // Test each potential delimiter
    for (const delimiter of this.config.delimiterGuess) {
      let fieldCount = 0;
      let consistentFields = true;
      let firstLineFields = 0;

      for (let i = 0; i < lines.length; i++) {
        const fields = lines[i].split(delimiter).length;
        
        if (i === 0) {
          firstLineFields = fields;
        } else if (fields !== firstLineFields && fields > 1) {
          consistentFields = false;
          break;
        }
        
        fieldCount += fields;
      }

      if (consistentFields && firstLineFields > maxFields) {
        maxFields = firstLineFields;
        bestDelimiter = delimiter;
      }
    }

    return {
      delimiter: bestDelimiter,
      hasHeader: this.detectHeader(csvString, bestDelimiter),
      lineCount: csvString.split('\n').length,
      fieldCount: maxFields
    };
  }

  /**
   * Detect if CSV has header row
   * @private
   */
  detectHeader(csvString, delimiter) {
    const lines = csvString.split('\n');
    if (lines.length < 2) return false;

    const firstRow = lines[0].split(delimiter);
    const secondRow = lines[1].split(delimiter);

    // Check if first row contains text while second contains numbers/dates
    let textInFirst = 0;
    let numbersInSecond = 0;

    for (let i = 0; i < Math.min(firstRow.length, secondRow.length); i++) {
      // Clean the field values
      const firstField = firstRow[i].replace(/['"]/g, '').trim();
      const secondField = secondRow[i].replace(/['"]/g, '').trim();

      // Check first row for text
      if (isNaN(Date.parse(firstField)) && isNaN(parseFloat(firstField)) && firstField.length > 0) {
        textInFirst++;
      }

      // Check second row for numbers or dates
      if (!isNaN(parseFloat(secondField)) || !isNaN(Date.parse(secondField))) {
        numbersInSecond++;
      }
    }

    // If first row is mostly text and second row has numbers/dates, likely has header
    return textInFirst > firstRow.length / 2 && numbersInSecond > 0;
  }

  /**
   * Parse CSV data using Papa Parse
   * @private
   */
  async parseCSVData(csvString, formatInfo) {
    return new Promise((resolve, reject) => {
      Papa.parse(csvString, {
        delimiter: formatInfo.delimiter,
        header: formatInfo.hasHeader,
        skipEmptyLines: 'greedy',
        dynamicTyping: false, // Keep as strings for better control
        transformHeader: (header) => {
          // Clean header names
          return header.trim().toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '_');
        },
        transform: (value, field) => {
          // Clean field values
          return typeof value === 'string' ? value.trim() : value;
        },
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors);
          }
          resolve(results.data);
        },
        error: (error) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        }
      });
    });
  }

  /**
   * Detect bank format from parsed data
   * @private
   */
  async detectBankFormat(parsedData) {
    if (!parsedData || parsedData.length === 0) {
      throw new Error('No data to analyze for bank format detection');
    }

    const sampleRow = parsedData[0];
    const headers = Object.keys(sampleRow);
    let bestMatch = null;
    let bestScore = 0;

    // Test each bank format
    for (const [formatId, format] of this.bankFormats) {
      const score = this.calculateFormatScore(headers, sampleRow, format);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = format;
      }
    }

    if (bestScore < 0.5) {
      // No good match found, return generic format
      return this.getGenericFormat(headers);
    }

    console.log(`Detected bank format: ${bestMatch.name} (confidence: ${(bestScore * 100).toFixed(1)}%)`);
    return bestMatch;
  }

  /**
   * Calculate format matching score
   * @private
   */
  calculateFormatScore(headers, sampleRow, format) {
    let score = 0;
    let totalChecks = 0;

    // Check field mappings
    for (const [standardField, bankField] of Object.entries(format.fieldMappings)) {
      totalChecks++;
      
      // Check for exact header match
      if (headers.includes(bankField.toLowerCase())) {
        score += 0.3;
      }
      
      // Check for partial header match
      const partialMatch = headers.find(h => 
        h.includes(bankField.toLowerCase()) || bankField.toLowerCase().includes(h)
      );
      if (partialMatch) {
        score += 0.2;
      }
      
      // Check for alternative field names
      if (format.alternativeFields && format.alternativeFields[standardField]) {
        const alternatives = format.alternativeFields[standardField];
        const altMatch = headers.find(h => 
          alternatives.some(alt => h.includes(alt.toLowerCase()))
        );
        if (altMatch) {
          score += 0.15;
        }
      }
    }

    // Check date format
    if (sampleRow && format.dateFormat) {
      const dateField = this.findDateField(headers, sampleRow);
      if (dateField && this.validateDateFormat(sampleRow[dateField], format.dateFormat)) {
        score += 0.2;
        totalChecks++;
      }
    }

    // Check institution indicators
    if (format.institutionIndicators) {
      const csvString = headers.join(' ') + ' ' + Object.values(sampleRow).join(' ');
      const hasIndicator = format.institutionIndicators.some(indicator =>
        csvString.toLowerCase().includes(indicator.toLowerCase())
      );
      if (hasIndicator) {
        score += 0.3;
        totalChecks++;
      }
    }

    return totalChecks > 0 ? score / totalChecks : 0;
  }

  /**
   * Find date field in headers
   * @private
   */
  findDateField(headers, sampleRow) {
    const dateKeywords = ['date', 'transaction_date', 'posting_date',