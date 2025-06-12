/**
 * SmartFinanceAI - Global Regulatory Compliance System
 * Comprehensive compliance framework for financial regulations across global markets
 * GDPR, CCPA, PCI DSS, SOX, and country-specific financial regulations
 */

// Global Compliance Configuration
export const ComplianceConfig = {
  // ===== PRIVACY REGULATIONS =====
  privacy: {
    'GDPR': {
      name: 'General Data Protection Regulation',
      scope: ['EU', 'UK'],
      keyRequirements: {
        consent: {
          required: true,
          explicit: true,
          withdrawable: true,
          granular: true
        },
        dataMinimization: {
          collectOnlyNecessary: true,
          retentionLimits: true,
          purposeLimitation: true
        },
        individualRights: {
          access: true,
          rectification: true,
          erasure: true, // Right to be forgotten
          portability: true,
          objection: true,
          restrictProcessing: true
        },
        security: {
          encryptionRequired: true,
          pseudonymization: true,
          dataProtectionByDesign: true,
          breachNotification: '72 hours'
        },
        penalties: {
          maximum: '4% of annual global turnover or €20 million'
        }
      }
    },

    'CCPA': {
      name: 'California Consumer Privacy Act',
      scope: ['US-CA'],
      keyRequirements: {
        consent: {
          required: true,
          optOut: true,
          saleOptOut: true
        },
        disclosure: {
          categoriesCollected: true,
          purposesOfUse: true,
          categoriesShared: true,
          retentionPeriod: true
        },
        individualRights: {
          know: true,
          delete: true,
          optOut: true,
          nonDiscrimination: true
        },
        penalties: {
          maximum: '$7,500 per violation'
        }
      }
    },

    'PIPEDA': {
      name: 'Personal Information Protection and Electronic Documents Act',
      scope: ['CA'],
      keyRequirements: {
        consent: {
          meaningful: true,
          informed: true,
          withdrawable: true
        },
        accountability: {
          designatedOfficer: true,
          policies: true,
          training: true
        },
        dataHandling: {
          limitCollection: true,
          limitUse: true,
          accuracy: true,
          safeguards: true
        }
      }
    },

    'PRIVACY_ACT': {
      name: 'Privacy Act 2020',
      scope: ['NZ'],
      keyRequirements: {
        informationPrivacyPrinciples: 13,
        consent: {
          informed: true,
          voluntary: true,
          specific: true
        },
        individualRights: {
          access: true,
          correction: true,
          complaint: true
        },
        notifiableBreach: {
          required: true,
          timeframe: 'as soon as practicable'
        }
      }
    },

    'PRIVACY_ACT_AU': {
      name: 'Privacy Act 1988',
      scope: ['AU'],
      keyRequirements: {
        australianPrivacyPrinciples: 13,
        consent: {
          informed: true,
          voluntary: true,
          current: true
        },
        individualRights: {
          access: true,
          correction: true,
          complaint: true
        },
        notifiableDataBreach: {
          required: true,
          timeframe: '30 days',
          threshold: 'likely to result in serious harm'
        }
      }
    }
  },

  // ===== FINANCIAL REGULATIONS =====
  financial: {
    'SOX': {
      name: 'Sarbanes-Oxley Act',
      scope: ['US'],
      keyRequirements: {
        corporateGovernance: true,
        internalControls: true,
        financialReporting: true,
        auditTrails: true,
        executiveCertification: true,
        whistleblowerProtection: true
      }
    },

    'PCI_DSS': {
      name: 'Payment Card Industry Data Security Standard',
      scope: 'global',
      keyRequirements: {
        requirements: [
          'Install and maintain a firewall configuration',
          'Do not use vendor-supplied defaults for system passwords',
          'Protect stored cardholder data',
          'Encrypt transmission of cardholder data across open networks',
          'Protect all systems against malware',
          'Develop and maintain secure systems and applications',
          'Restrict access to cardholder data by business need to know',
          'Identify and authenticate access to system components',
          'Restrict physical access to cardholder data',
          'Track and monitor all access to network resources',
          'Regularly test security systems and processes',
          'Maintain a policy that addresses information security'
        ],
        levels: {
          1: 'Over 6 million transactions annually',
          2: '1-6 million transactions annually',
          3: '20,000-1 million e-commerce transactions annually',
          4: 'Fewer than 20,000 e-commerce transactions annually'
        }
      }
    },

    'FINTRAC': {
      name: 'Financial Transactions and Reports Analysis Centre',
      scope: ['CA'],
      keyRequirements: {
        recordKeeping: true,
        customerIdentification: true,
        reportingSuspicious: true,
        reportingLarge: 'CAD $10,000+',
        complianceProgram: true
      }
    },

    'AUSTRAC': {
      name: 'Australian Transaction Reports and Analysis Centre',
      scope: ['AU'],
      keyRequirements: {
        amlCtfProgram: true,
        customerDueDiligence: true,
        reportingObligations: true,
        recordKeeping: true,
        thresholdTransactions: 'AUD $10,000+'
      }
    },

    'FMA_NZ': {
      name: 'Financial Markets Authority',
      scope: ['NZ'],
      keyRequirements: {
        fairDealing: true,
        disclosure: true,
        marketConduct: true,
        financialAdvice: true,
        reporting: true
      }
    },

    'FCA_UK': {
      name: 'Financial Conduct Authority',
      scope: ['UK'],
      keyRequirements: {
        consumerProtection: true,
        marketIntegrity: true,
        competition: true,
        treatCustomersFairly: true,
        strongCustomerAuthentication: true
      }
    }
  },

  // ===== COUNTRY-SPECIFIC FINANCIAL COMPLIANCE =====
  countrySpecific: {
    'NZ': {
      taxYear: { start: 'April', end: 'March' },
      gst: { rate: 0.15, threshold: 60000 },
      kiwiSaver: {
        minimumContribution: 0.03,
        employerContribution: 0.03,
        governmentContribution: 521.43,
        memberTaxCredit: 521.43
      },
      privacyOfficer: 'required',
      financialDisputes: 'Financial Disputes Resolution Service',
      amlCft: 'Anti-Money Laundering and Countering Financing of Terrorism Act'
    },

    'AU': {
      taxYear: { start: 'July', end: 'June' },
      gst: { rate: 0.10, threshold: 75000 },
      superannuation: {
        guaranteeRate: 0.105, // 10.5% as of 2022
        concessionalCap: 27500,
        nonConcessionalCap: 110000
      },
      privacyOfficer: 'required for entities with turnover > $3M',
      financialDisputes: 'Australian Financial Complaints Authority',
      amlCtf: 'Anti-Money Laundering and Counter-Terrorism Financing Act'
    },

    'US': {
      taxYear: { start: 'January', end: 'December' },
      retirement: {
        '401k': { contributionLimit: 22500, catchUpLimit: 7500 },
        'IRA': { contributionLimit: 6500, catchUpLimit: 1000 },
        'RothIRA': { contributionLimit: 6500, incomeLimit: 138000 }
      },
      fdic: { insuranceLimit: 250000 },
      creditReporting: ['Equifax', 'Experian', 'TransUnion'],
      consumerProtection: 'Consumer Financial Protection Bureau'
    },

    'UK': {
      taxYear: { start: 'April', end: 'April' },
      vat: { standardRate: 0.20, threshold: 85000 },
      isa: {
        annualLimit: 20000,
        stocksAndSharesLimit: 20000,
        cashLimit: 20000
      },
      pension: {
        annualAllowance: 40000,
        lifetimeAllowance: 1073100
      },
      fscs: { protectionLimit: 85000 },
      dataProtection: 'Information Commissioner\'s Office'
    },

    'CA': {
      taxYear: { start: 'January', end: 'December' },
      gst: { rate: 0.05 }, // Federal GST
      hst: { // Harmonized Sales Tax by province
        'ON': 0.13, 'NB': 0.15, 'NL': 0.15, 'NS': 0.15, 'PE': 0.15
      },
      retirement: {
        'RRSP': { contributionLimit: 30780, carryForward: true },
        'TFSA': { contributionLimit: 6500, lifetimeLimit: 88000 }
      },
      cdic: { insuranceLimit: 100000 },
      privacyCommissioner: 'Office of the Privacy Commissioner'
    }
  }
};

// Compliance Manager Class
export class ComplianceManager {
  constructor() {
    this.auditLog = [];
    this.complianceChecks = new Map();
    this.userConsents = new Map();
  }

  // Initialize compliance for user's country
  initializeCompliance(userCountry, userRegion = null) {
    const applicableRegulations = this.getApplicableRegulations(userCountry, userRegion);
    
    return {
      privacy: applicableRegulations.privacy,
      financial: applicableRegulations.financial,
      countrySpecific: ComplianceConfig.countrySpecific[userCountry],
      requiredConsents: this.getRequiredConsents(applicableRegulations),
      mandatoryDisclosures: this.getMandatoryDisclosures(applicableRegulations)
    };
  }

  // Get applicable regulations based on user location
  getApplicableRegulations(country, region = null) {
    const applicable = { privacy: [], financial: [] };

    // Check privacy regulations
    Object.entries(ComplianceConfig.privacy).forEach(([key, regulation]) => {
      if (this.isRegulationApplicable(regulation.scope, country, region)) {
        applicable.privacy.push({ key, ...regulation });
      }
    });

    // Check financial regulations
    Object.entries(ComplianceConfig.financial).forEach(([key, regulation]) => {
      if (regulation.scope === 'global' || 
          this.isRegulationApplicable(regulation.scope, country, region)) {
        applicable.financial.push({ key, ...regulation });
      }
    });

    return applicable;
  }

  // Check if regulation applies to user's location
  isRegulationApplicable(scope, country, region) {
    if (Array.isArray(scope)) {
      return scope.some(s => {
        if (s.includes('-')) {
          const [scopeCountry, scopeRegion] = s.split('-');
          return country === scopeCountry && region === scopeRegion;
        }
        return s === country;
      });
    }
    return scope === 'global' || scope === country;
  }

  // Get required consents for applicable regulations
  getRequiredConsents(regulations) {
    const consents = [];

    regulations.privacy.forEach(regulation => {
      if (regulation.keyRequirements.consent) {
        consents.push({
          regulation: regulation.key,
          type: 'privacy',
          requirements: regulation.keyRequirements.consent,
          mandatory: true
        });
      }
    });

    return consents;
  }

  // Get mandatory disclosures
  getMandatoryDisclosures(regulations) {
    const disclosures = [];

    regulations.privacy.forEach(regulation => {
      if (regulation.keyRequirements.disclosure) {
        disclosures.push({
          regulation: regulation.key,
          type: 'privacy_disclosure',
          requirements: regulation.keyRequirements.disclosure
        });
      }
    });

    return disclosures;
  }

  // Record user consent
  recordConsent(userId, consentType, granted, details = {}) {
    const consent = {
      userId,
      consentType,
      granted,
      timestamp: new Date().toISOString(),
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      version: details.version || '1.0'
    };

    if (!this.userConsents.has(userId)) {
      this.userConsents.set(userId, []);
    }
    this.userConsents.get(userId).push(consent);

    this.logAuditEvent('consent_recorded', { userId, consentType, granted });
    return consent;
  }

  // Withdraw consent
  withdrawConsent(userId, consentType, reason = null) {
    const withdrawal = {
      userId,
      consentType,
      granted: false,
      withdrawn: true,
      reason,
      timestamp: new Date().toISOString()
    };

    if (!this.userConsents.has(userId)) {
      this.userConsents.set(userId, []);
    }
    this.userConsents.get(userId).push(withdrawal);

    this.logAuditEvent('consent_withdrawn', { userId, consentType, reason });
    return withdrawal;
  }

  // Check if user has valid consent
  hasValidConsent(userId, consentType) {
    const userConsents = this.userConsents.get(userId) || [];
    const latestConsent = userConsents
      .filter(c => c.consentType === consentType)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

    return latestConsent && latestConsent.granted && !latestConsent.withdrawn;
  }

  // Data retention check
  checkDataRetention(userId, dataType, createdDate, country) {
    const countryConfig = ComplianceConfig.countrySpecific[country];
    const retentionPeriods = {
      'financial_data': 7, // years
      'transaction_data': 7,
      'user_profile': 7,
      'audit_logs': 10,
      'consent_records': 10
    };

    const retentionYears = retentionPeriods[dataType] || 7;
    const expiryDate = new Date(createdDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + retentionYears);

    const shouldDelete = new Date() > expiryDate;
    
    if (shouldDelete) {
      this.logAuditEvent('data_retention_expired', { 
        userId, dataType, createdDate, expiryDate 
      });
    }

    return {
      shouldDelete,
      expiryDate,
      retentionPeriod: `${retentionYears} years`
    };
  }

  // Breach notification requirements
  assessBreachNotification(breachDetails, country) {
    const requirements = [];

    // GDPR requirements
    if (['EU', 'UK'].includes(country)) {
      requirements.push({
        regulation: 'GDPR',
        authority: 'Data Protection Authority',
        timeframe: '72 hours',
        userNotification: breachDetails.severity === 'high',
        mandatory: true
      });
    }

    // CCPA requirements
    if (country === 'US' && breachDetails.state === 'CA') {
      requirements.push({
        regulation: 'CCPA',
        authority: 'California Attorney General',
        timeframe: 'without unreasonable delay',
        userNotification: true,
        mandatory: true
      });
    }

    // Country-specific requirements
    const countrySpecific = {
      'NZ': {
        regulation: 'Privacy Act 2020',
        authority: 'Privacy Commissioner',
        timeframe: 'as soon as practicable',
        threshold: 'likely to cause serious harm'
      },
      'AU': {
        regulation: 'Privacy Act 1988',
        authority: 'Office of the Australian Information Commissioner',
        timeframe: '30 days',
        threshold: 'likely to result in serious harm'
      },
      'CA': {
        regulation: 'PIPEDA',
        authority: 'Privacy Commissioner of Canada',
        timeframe: 'as soon as feasible',
        threshold: 'real risk of significant harm'
      }
    };

    if (countrySpecific[country]) {
      requirements.push(countrySpecific[country]);
    }

    return requirements;
  }

  // Right to be forgotten implementation
  processDataDeletionRequest(userId, country) {
    const deletionRequirements = {
      'EU': { regulation: 'GDPR', timeframe: '30 days', scope: 'all personal data' },
      'UK': { regulation: 'UK GDPR', timeframe: '30 days', scope: 'all personal data' },
      'US-CA': { regulation: 'CCPA', timeframe: '45 days', scope: 'personal information' },
      'AU': { regulation: 'Privacy Act', timeframe: '30 days', scope: 'personal information' },
      'NZ': { regulation: 'Privacy Act', timeframe: '20 working days', scope: 'personal information' },
      'CA': { regulation: 'PIPEDA', timeframe: '30 days', scope: 'personal information' }
    };

    const requirement = deletionRequirements[country] || deletionRequirements['EU'];

    this.logAuditEvent('data_deletion_requested', { userId, country, requirement });

    return {
      requestId: this.generateRequestId(),
      userId,
      requirement,
      status: 'pending',
      deadline: this.calculateDeadline(requirement.timeframe),
      scope: requirement.scope
    };
  }

  // Generate compliance report
  generateComplianceReport(country, startDate, endDate) {
    const report = {
      country,
      period: { startDate, endDate },
      applicableRegulations: this.getApplicableRegulations(country),
      metrics: {
        totalUsers: this.getTotalUsers(country),
        consentsGranted: this.getConsentMetrics(country, startDate, endDate),
        dataRequests: this.getDataRequestMetrics(country, startDate, endDate),
        breaches: this.getBreachMetrics(country, startDate, endDate),
        auditEvents: this.getAuditMetrics(country, startDate, endDate)
      },
      complianceStatus: this.assessComplianceStatus(country),
      recommendations: this.getComplianceRecommendations(country)
    };

    this.logAuditEvent('compliance_report_generated', { country, period: report.period });
    return report;
  }

  // Log audit events
  logAuditEvent(eventType, details) {
    const auditEvent = {
      id: this.generateRequestId(),
      timestamp: new Date().toISOString(),
      eventType,
      details,
      source: 'compliance_manager'
    };

    this.auditLog.push(auditEvent);
    
    // In production, this would be sent to secure audit log storage
    console.log('Audit Event:', auditEvent);
  }

  // Utility methods
  generateRequestId() {
    return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  calculateDeadline(timeframe) {
    const deadline = new Date();
    if (timeframe.includes('days')) {
      const days = parseInt(timeframe);
      deadline.setDate(deadline.getDate() + days);
    } else if (timeframe.includes('hours')) {
      const hours = parseInt(timeframe);
      deadline.setHours(deadline.getHours() + hours);
    } else if (timeframe.includes('working days')) {
      const days = parseInt(timeframe);
      // Add working days (excluding weekends)
      let addedDays = 0;
      while (addedDays < days) {
        deadline.setDate(deadline.getDate() + 1);
        if (deadline.getDay() !== 0 && deadline.getDay() !== 6) {
          addedDays++;
        }
      }
    }
    return deadline.toISOString();
  }

  // Placeholder methods for metrics (would connect to actual data sources)
  getTotalUsers(country) { return 0; }
  getConsentMetrics(country, start, end) { return {}; }
  getDataRequestMetrics(country, start, end) { return {}; }
  getBreachMetrics(country, start, end) { return {}; }
  getAuditMetrics(country, start, end) { return {}; }
  assessComplianceStatus(country) { return 'compliant'; }
  getComplianceRecommendations(country) { return []; }
}

// Export singleton instance
export const complianceManager = new ComplianceManager();

// Export helper functions
export const getCountryCompliance = (country) => {
  return ComplianceConfig.countrySpecific[country];
};

export const isGDPRApplicable = (country) => {
  return ['EU', 'UK'].includes(country);
};

export const isCCPAApplicable = (country, state) => {
  return country === 'US' && state === 'CA';
};

console.log('✅ Global Regulatory Compliance System loaded - GDPR, CCPA, PCI DSS ready');