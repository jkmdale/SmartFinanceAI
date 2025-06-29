/**
 * SmartFinanceAI - Goal Templates System
 * Intelligent goal template management with AI-powered calculations
 * Supports multi-country configurations and personalized recommendations
 */

// Main Goal Templates Module
const GoalTemplates = {
    // Current state
    currentCountry: 'NZ',
    currentCategory: 'all',
    selectedTemplate: null,
    userProfile: null,
    
    // Template data cache
    templates: new Map(),
    countryConfig: new Map(),
    
    // Initialize the goal templates system
    async initialize() {
        console.log('🎯 Initializing Goal Templates System...');
        
        try {
            // Load country configurations
            await this.loadCountryConfigurations();
            
            // Load template definitions
            await this.loadTemplateDefinitions();
            
            // Detect user country
            await this.detectUserCountry();
            
            // Load user profile if available
            await this.loadUserProfile();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Render initial templates
            this.renderTemplates();
            
            console.log('✅ Goal Templates System Ready!');
            this.showNotification('Goal templates loaded! Choose your financial objective. 🎯', 'success');
            
        } catch (error) {
            console.error('❌ Goal Templates initialization failed:', error);
            this.showNotification('Failed to load goal templates. Please refresh the page.', 'error');
        }
    },
    
    // Load country-specific configurations
    async loadCountryConfigurations() {
        this.countryConfig = new Map([
            ['NZ', {
                currency: 'NZD',
                currencySymbol: '$',
                locale: 'en-NZ',
                emergencyFundMonths: 3,
                averageIncome: 60000,
                averageHousePrice: 800000,
                retirementAge: 65,
                kiwisaver: true,
                governmentSchemes: ['KiwiSaver', 'First Home Grant', 'Welcome Home Loan'],
                taxYear: { start: 'April', end: 'March' },
                interestRates: {
                    savings: 0.035,
                    mortgage: 0.065,
                    term_deposit: 0.045
                }
            }],
            ['AU', {
                currency: 'AUD',
                currencySymbol: '$',
                locale: 'en-AU',
                emergencyFundMonths: 3,
                averageIncome: 75000,
                averageHousePrice: 900000,
                retirementAge: 67,
                superannuation: true,
                governmentSchemes: ['Superannuation', 'First Home Super Saver', 'First Home Owner Grant'],
                taxYear: { start: 'July', end: 'June' },
                interestRates: {
                    savings: 0.04,
                    mortgage: 0.07,
                    term_deposit: 0.05
                }
            }],
            ['UK', {
                currency: 'GBP',
                currencySymbol: '£',
                locale: 'en-GB',
                emergencyFundMonths: 6,
                averageIncome: 35000,
                averageHousePrice: 300000,
                retirementAge: 66,
                pension: true,
                governmentSchemes: ['ISA', 'Help to Buy', 'Lifetime ISA', 'Auto-Enrolment Pension'],
                taxYear: { start: 'April', end: 'March' },
                interestRates: {
                    savings: 0.025,
                    mortgage: 0.055,
                    term_deposit: 0.035
                }
            }],
            ['US', {
                currency: 'USD',
                currencySymbol: '$',
                locale: 'en-US',
                emergencyFundMonths: 6,
                averageIncome: 65000,
                averageHousePrice: 400000,
                retirementAge: 67,
                retirement401k: true,
                governmentSchemes: ['401(k)', 'IRA', 'Roth IRA', 'HSA'],
                taxYear: { start: 'January', end: 'December' },
                interestRates: {
                    savings: 0.045,
                    mortgage: 0.075,
                    term_deposit: 0.055
                }
            }],
            ['CA', {
                currency: 'CAD',
                currencySymbol: '$',
                locale: 'en-CA',
                emergencyFundMonths: 6,
                averageIncome: 55000,
                averageHousePrice: 650000,
                retirementAge: 65,
                rrsp: true,
                governmentSchemes: ['RRSP', 'TFSA', 'First-Time Home Buyer Plan'],
                taxYear: { start: 'January', end: 'December' },
                interestRates: {
                    savings: 0.03,
                    mortgage: 0.06,
                    term_deposit: 0.04
                }
            }]
        ]);
    },
    
    // Load template definitions
    async loadTemplateDefinitions() {
        // Emergency Fund Templates
        const emergencyTemplate = {
            id: 'emergency_fund',
            name: 'Emergency Fund',
            icon: '🚨',
            category: 'essential',
            priority: 'critical',
            difficulty: 'easy',
            description: 'Build a financial safety net for unexpected expenses like job loss, medical bills, or major repairs.',
            features: [
                'Country-specific recommendations (3-6 months expenses)',
                'Automatic calculation based on your spending',
                'High-yield savings account suggestions',
                'Progressive milestone rewards',
                'Emergency expense tracking'
            ],
            calculateGoal: (country, userProfile) => this.calculateEmergencyFund(country, userProfile),
            tips: [
                'Start with $1,000 as an initial emergency buffer',
                'Keep funds in a separate, easily accessible account',
                'Review and adjust target as income changes',
                'Only use for true emergencies'
            ]
        };
        
        // House Deposit Templates
        const houseTemplate = {
            id: 'house_deposit',
            name: 'House Deposit',
            icon: '🏠',
            category: 'savings',
            priority: 'high',
            difficulty: 'medium',
            description: 'Save for your first home deposit with smart strategies and government scheme optimization.',
            features: [
                'Country-specific deposit requirements (10-20%)',
                'Property market price tracking',
                'Government scheme eligibility checker',
                'First-time buyer benefits calculator',
                'Additional cost planning (legal, inspection)'
            ],
            calculateGoal: (country, userProfile) => this.calculateHouseDeposit(country, userProfile),
            tips: [
                'Research first-time buyer programs in your area',
                'Consider government assistance schemes',
                'Factor in additional costs (legal fees, inspections)',
                'Track property prices in your target area'
            ]
        };
        
        // Retirement Templates
        const retirementTemplate = {
            id: 'retirement_savings',
            name: 'Retirement Savings',
            icon: '🏖️',
            category: 'investment',
            priority: 'medium',
            difficulty: 'medium',
            description: 'Build wealth for retirement through tax-advantaged accounts and compound growth.',
            features: [
                'Country-specific retirement accounts (KiwiSaver, 401k, ISA)',
                'Employer matching optimization',
                'Tax benefit calculations',
                'Compound growth projections',
                'Retirement income planning'
            ],
            calculateGoal: (country, userProfile) => this.calculateRetirementSavings(country, userProfile),
            tips: [
                'Maximize employer matching contributions',
                'Increase contributions with salary raises',
                'Review investment allocation annually',
                'Start early to benefit from compound growth'
            ]
        };
        
        // Education Templates
        const educationTemplate = {
            id: 'education_fund',
            name: 'Education Fund',
            icon: '🎓',
            category: 'savings',
            priority: 'medium',
            difficulty: 'medium',
            description: 'Save for children\'s education or your own professional development.',
            features: [
                'Country-specific education costs',
                'Tax-advantaged education accounts',
                'Inflation-adjusted projections',
                'Flexible contribution scheduling',
                'Education loan comparison'
            ],
            calculateGoal: (country, userProfile) => this.calculateEducationFund(country, userProfile),
            tips: [
                'Start saving early to benefit from compound growth',
                'Research education-specific tax benefits',
                'Consider inflation when setting targets',
                'Explore scholarship and grant opportunities'
            ]
        };
        
        // Vacation Templates
        const vacationTemplate = {
            id: 'vacation_fund',
            name: 'Dream Vacation',
            icon: '✈️',
            category: 'lifestyle',
            priority: 'low',
            difficulty: 'easy',
            description: 'Save for your dream vacation with detailed cost planning and savings strategies.',
            features: [
                'Destination cost calculator',
                'Travel deal alerts and optimization',
                'Flexible date planning for savings',
                'Travel insurance budgeting',
                'Currency exchange planning'
            ],
            calculateGoal: (country, userProfile) => this.calculateVacationFund(country, userProfile),
            tips: [
                'Book flights and accommodation early for better prices',
                'Consider off-peak travel for savings',
                'Set up automatic transfers to vacation fund',
                'Track travel deals and promotions'
            ]
        };
        
        // Debt Payoff Templates
        const debtTemplate = {
            id: 'debt_payoff',
            name: 'Debt Freedom',
            icon: '💳',
            category: 'debt',
            priority: 'high',
            difficulty: 'hard',
            description: 'Eliminate high-interest debt with optimized payoff strategies.',
            features: [
                'Debt avalanche vs snowball strategy',
                'Interest savings calculator',
                'Payment optimization timeline',
                'Debt consolidation analysis',
                'Credit score impact tracking'
            ],
            calculateGoal: (country, userProfile) => this.calculateDebtPayoff(country, userProfile),
            tips: [
                'Pay minimums on all debts, extra on highest interest',
                'Consider debt consolidation for better rates',
                'Avoid taking on new debt during payoff',
                'Celebrate milestones to stay motivated'
            ]
        };
        
        // Investment Templates
        const investmentTemplate = {
            id: 'investment_portfolio',
            name: 'Investment Portfolio',
            icon: '📈',
            category: 'investment',
            priority: 'medium',
            difficulty: 'hard',
            description: 'Build a diversified investment portfolio for long-term wealth growth.',
            features: [
                'Risk tolerance assessment',
                'Asset allocation optimization',
                'Country-specific investment vehicles',
                'Tax-efficient investing strategies',
                'Portfolio rebalancing alerts'
            ],
            calculateGoal: (country, userProfile) => this.calculateInvestmentPortfolio(country, userProfile),
            tips: [
                'Diversify across asset classes and geographies',
                'Keep costs low with index funds',
                'Rebalance portfolio annually',
                'Stay focused on long-term goals'
            ]
        };
        
        // Business Templates
        const businessTemplate = {
            id: 'business_fund',
            name: 'Start a Business',
            icon: '🚀',
            category: 'investment',
            priority: 'medium',
            difficulty: 'hard',
            description: 'Build capital to start your own business or expand an existing one.',
            features: [
                'Business plan cost analysis',
                'Startup funding requirements',
                'Emergency business buffer',
                'Equipment and inventory planning',
                'Legal and regulatory cost planning'
            ],
            calculateGoal: (country, userProfile) => this.calculateBusinessFund(country, userProfile),
            tips: [
                'Create detailed business plan with cost breakdown',
                'Research funding options and grants',
                'Build personal emergency fund first',
                'Consider starting as side business'
            ]
        };
        
        // Store templates
        this.templates = new Map([
            ['emergency_fund', emergencyTemplate],
            ['house_deposit', houseTemplate],
            ['retirement_savings', retirementTemplate],
            ['education_fund', educationTemplate],
            ['vacation_fund', vacationTemplate],
            ['debt_payoff', debtTemplate],
            ['investment_portfolio', investmentTemplate],
            ['business_fund', businessTemplate]
        ]);
    },
    
    // Detect user's country
    async detectUserCountry() {
        try {
            // Try to get from localStorage first
            const savedCountry = localStorage.getItem('smartfinance_country');
            if (savedCountry && this.countryConfig.has(savedCountry)) {
                this.currentCountry = savedCountry;
                return;
            }
            
            // Detect from browser locale
            const locale = navigator.language || navigator.userLanguage;
            if (locale.includes('en-NZ')) this.currentCountry = 'NZ';
            else if (locale.includes('en-AU')) this.currentCountry = 'AU';
            else if (locale.includes('en-GB')) this.currentCountry = 'UK';
            else if (locale.includes('en-CA')) this.currentCountry = 'CA';
            else if (locale.includes('en-US')) this.currentCountry = 'US';
            
            // Could also use IP geolocation API here
            console.log(`Detected country: ${this.currentCountry}`);
            
            // Update UI
            this.updateCountrySelector();
            
        } catch (error) {
            console.warn('Country detection failed, using default (NZ):', error);
            this.currentCountry = 'NZ';
        }
    },
    
    // Load user profile
    async loadUserProfile() {
        try {
            // Try to load from localStorage (in production, would be from API)
            const savedProfile = localStorage.getItem('smartfinance_user_profile');
            if (savedProfile) {
                this.userProfile = JSON.parse(savedProfile);
            } else {
                // Create default profile
                this.userProfile = {
                    monthlyIncome: 0,
                    monthlyExpenses: 0,
                    currentSavings: 0,
                    age: 30,
                    dependents: 0,
                    riskTolerance: 'medium'
                };
            }
        } catch (error) {
            console.warn('Failed to load user profile:', error);
            this.userProfile = {
                monthlyIncome: 0,
                monthlyExpenses: 0,
                currentSavings: 0,
                age: 30,
                dependents: 0,
                riskTolerance: 'medium'
            };
        }
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Country selector
        const countryBtns = document.querySelectorAll('.country-btn');
        countryBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.selectCountry(e.target.dataset.country));
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.selectCountry(e.target.dataset.country);
                }
            });
        });
        
        // Category filters
        const categoryBtns = document.querySelectorAll('.category-filter');
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.selectCategory(e.target.dataset.category));
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.selectCategory(e.target.dataset.category);
                }
            });
        });
        
        // Custom goal section
        const customGoalSection = document.getElementById('customGoalSection');
        const customGoalBtn = document.getElementById('customGoalBtn');
        
        if (customGoalSection) {
            customGoalSection.addEventListener('click', () => this.createCustomGoal());
            customGoalSection.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.createCustomGoal();
                }
            });
        }
        
        if (customGoalBtn) {
            customGoalBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.createCustomGoal();
            });
        }
        
        // Modal close
        const modalClose = document.getElementById('modalClose');
        const modalOverlay = document.getElementById('goalModal');
        
        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeModal());
        }
        
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    this.closeModal();
                }
            });
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    },
    
    // Select country
    selectCountry(country) {
        if (!this.countryConfig.has(country)) return;
        
        this.currentCountry = country;
        localStorage.setItem('smartfinance_country', country);
        
        this.updateCountrySelector();
        this.renderTemplates();
        
        const countryNames = {
            'NZ': 'New Zealand',
            'AU': 'Australia',
            'UK': 'United Kingdom',
            'US': 'United States',
            'CA': 'Canada'
        };
        
        this.showNotification(`Switched to ${countryNames[country]} templates! 🌍`, 'success');
    },
    
    // Update country selector UI
    updateCountrySelector() {
        const countryBtns = document.querySelectorAll('.country-btn');
        countryBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.country === this.currentCountry);
        });
    },
    
    // Select category filter
    selectCategory(category) {
        this.currentCategory = category;
        
        // Update UI

// Claude AI Integration for SMART Goal Suggestions
async getClaudeSmartGoalAdvice(goalType) {
    try {
        const response = await fetch('https://<your-supabase-project>.functions.supabase.co/claude-ai-coach', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${your_supabase_anon_key}`
            },
            body: JSON.stringify({
                context: this.userProfile || {},
                goalType: goalType
            })
        });

        const data = await response.json();
        if (data.advice) {
            console.log("🎯 Claude AI SMART Goal Suggestion:", data.advice);
            return data.advice;
        }
    } catch (err) {
        console.error("❌ Claude goal suggestion failed", err);
        return null;
    }
}
