/**
 * SmartFinanceAI Tutorial System
 * Advanced interactive tutorial engine with context-aware guidance
 */

class TutorialManager {
    constructor(options = {}) {
        this.options = {
            autoStart: true,
            trackAnalytics: true,
            persistProgress: true,
            adaptiveContent: true,
            mobileOptimized: true,
            ...options
        };
        
        this.state = {
            isActive: false,
            currentTour: null,
            currentStep: 0,
            totalSteps: 0,
            startTime: null,
            completedTours: new Set(),
            userPreferences: this.loadUserPreferences(),
            contextData: {}
        };
        
        this.tours = new Map();
        this.observers = new Map();
        this.eventListeners = [];
        
        this.initialize();
    }
    
    initialize() {
        this.loadTours();
        this.setupEventListeners();
        this.createOverlayElements();
        this.detectUserContext();
        
        if (this.options.autoStart) {
            this.checkForAutoStart();
        }
    }
    
    loadTours() {
        // Onboarding Tour - New User Experience
        this.registerTour('onboarding', {
            name: 'Getting Started',
            description: 'Learn the basics of SmartFinanceAI',
            priority: 1,
            triggers: ['first_visit', 'manual'],
            steps: [
                {
                    id: 'welcome',
                    target: '[data-tutorial="welcome"]',
                    title: 'Welcome to SmartFinanceAI! 👋',
                    content: 'Your intelligent financial operating system is ready. Let\'s take a quick tour to get you started.',
                    position: 'center',
                    actions: {
                        primary: { text: 'Start Tour', action: 'next' },
                        secondary: { text: 'Skip Tour', action: 'skip' }
                    },
                    prerequisites: [],
                    analytics: { category: 'onboarding', action: 'welcome_shown' }
                },
                {
                    id: 'country_selection',
                    target: '[data-tutorial="country-select"]',
                    title: 'Choose Your Country 🌍',
                    content: 'Select your country to enable local banking support, currency formatting, and region-specific financial advice.',
                    position: 'bottom',
                    waitFor: '[data-tutorial="country-select"]',
                    validation: () => document.querySelector('[data-tutorial="country-select"]')?.value,
                    actions: {
                        primary: { text: 'Continue', action: 'next', disabled: true }
                    }
                },
                {
                    id: 'profile_setup',
                    target: '[data-tutorial="profile-form"]',
                    title: 'Set Up Your Profile 👤',
                    content: 'Tell us about yourself so we can provide personalized financial guidance and goal recommendations.',
                    position: 'right',
                    checklist: [
                        { id: 'name', text: 'Enter your name', required: true },
                        { id: 'age', text: 'Enter your age', required: true },
                        { id: 'income', text: 'Add your income (optional)', required: false }
                    ]
                },
                {
                    id: 'security_setup',
                    target: '[data-tutorial="biometric-setup"]',
                    title: 'Secure Your Account 🔐',
                    content: 'Enable biometric authentication for secure, convenient access to your financial data.',
                    position: 'left',
                    conditional: () => this.supportsBiometrics(),
                    actions: {
                        primary: { text: 'Enable Biometrics', action: 'trigger', target: 'setup-biometrics' },
                        secondary: { text: 'Skip for Now', action: 'next' }
                    }
                },
                {
                    id: 'dashboard_overview',
                    target: '[data-tutorial="dashboard"]',
                    title: 'Your Financial Command Center 📊',
                    content: 'This is your main dashboard where you\'ll see your financial health score, account balances, and AI insights.',
                    position: 'bottom',
                    highlights: [
                        { selector: '[data-tutorial="health-score"]', label: 'Financial Health Score' },
                        { selector: '[data-tutorial="quick-stats"]', label: 'Quick Statistics' },
                        { selector: '[data-tutorial="ai-insights"]', label: 'AI Insights Panel' }
                    ]
                }
            ]
        });
        
        // Account Management Tour
        this.registerTour('account_management', {
            name: 'Managing Your Accounts',
            description: 'Learn how to add and manage bank accounts',
            priority: 2,
            triggers: ['accounts_page', 'manual'],
            prerequisites: ['onboarding'],
            steps: [
                {
                    id: 'add_account_intro',
                    target: '[data-tutorial="add-account-btn"]',
                    title: 'Add Your First Account 🏦',
                    content: 'Connect your bank accounts to start tracking your finances. We support 50+ banks worldwide.',
                    position: 'bottom',
                    pulse: true
                },
                {
                    id: 'csv_import',
                    target: '[data-tutorial="csv-import"]',
                    title: 'Import Bank Statements 📄',
                    content: 'Upload CSV files from your bank. Our AI automatically detects the format and categorizes transactions.',
                    position: 'right',
                    demo: {
                        type: 'file_upload',
                        sampleFile: 'sample-bank-statement.csv'
                    }
                },
                {
                    id: 'transaction_categories',
                    target: '[data-tutorial="categories"]',
                    title: 'Smart Categorization 🏷️',
                    content: 'Transactions are automatically categorized with 95% accuracy. You can review and adjust as needed.',
                    position: 'left',
                    interactive: true
                }
            ]
        });
        
        // Goals and Budgeting Tour
        this.registerTour('goals_budgeting', {
            name: 'Goals & Budgeting',
            description: 'Set financial goals and create intelligent budgets',
            priority: 3,
            triggers: ['goals_page', 'budget_page', 'manual'],
            steps: [
                {
                    id: 'goal_templates',
                    target: '[data-tutorial="goal-templates"]',
                    title: 'Choose Goal Templates 🎯',
                    content: 'Start with proven goal templates customized for your country and situation.',
                    position: 'bottom',
                    carousel: [
                        { title: 'Emergency Fund', description: 'Build 3-6 months of expenses' },
                        { title: 'House Deposit', description: 'Save for your dream home' },
                        { title: 'Retirement', description: 'Secure your future' }
                    ]
                },
                {
                    id: 'smart_goals',
                    target: '[data-tutorial="goal-form"]',
                    title: 'Create SMART Goals 📈',
                    content: 'Our AI helps you create Specific, Measurable, Achievable, Relevant, and Time-bound goals.',
                    position: 'right',
                    form_validation: true
                },
                {
                    id: 'budget_creation',
                    target: '[data-tutorial="budget-wizard"]',
                    title: 'AI Budget Wizard 🧙‍♂️',
                    content: 'Let AI analyze your spending patterns and create an optimized budget automatically.',
                    position: 'center',
                    wizard: true
                }
            ]
        });
        
        // AI Coach Tour
        this.registerTour('ai_coach', {
            name: 'Meet Your AI Coach',
            description: 'Discover your personal financial AI assistant',
            priority: 4,
            triggers: ['ai_page', 'manual'],
            steps: [
                {
                    id: 'ai_introduction',
                    target: '[data-tutorial="ai-coach-panel"]',
                    title: 'Your Personal Financial AI 🤖',
                    content: 'Ask questions, get insights, and receive personalized advice in plain English.',
                    position: 'left',
                    animation: 'typing'
                },
                {
                    id: 'natural_language',
                    target: '[data-tutorial="ai-chat"]',
                    title: 'Natural Language Queries 💬',
                    content: 'Try asking: "How much did I spend on dining last month?" or "When will I reach my savings goal?"',
                    position: 'bottom',
                    examples: [
                        "How much did I spend on dining last month?",
                        "When will I reach my savings goal?",
                        "What can I do to improve my financial health?"
                    ]
                },
                {
                    id: 'financial_insights',
                    target: '[data-tutorial="insights-panel"]',
                    title: 'Proactive Insights 💡',
                    content: 'Receive weekly insights about your spending patterns, optimization opportunities, and goal progress.',
                    position: 'right',
                    preview: true
                }
            ]
        });
        
        // Advanced Features Tour
        this.registerTour('advanced_features', {
            name: 'Advanced Features',
            description: 'Unlock the full power of SmartFinanceAI',
            priority: 5,
            triggers: ['manual', 'feature_discovery'],
            prerequisites: ['onboarding', 'account_management'],
            steps: [
                {
                    id: 'financial_health_score',
                    target: '[data-tutorial="health-score-detail"]',
                    title: 'Financial Health Score 💯',
                    content: 'Your comprehensive financial health score with 10 components and actionable recommendations.',
                    position: 'bottom',
                    expandable: true
                },
                {
                    id: 'predictive_analytics',
                    target: '[data-tutorial="predictions"]',
                    title: 'Predictive Analytics 🔮',
                    content: 'See 12-month cash flow forecasts and goal achievement probability with confidence intervals.',
                    position: 'left',
                    chart_demo: true
                },
                {
                    id: 'couples_features',
                    target: '[data-tutorial="couples-mode"]',
                    title: 'Couples Financial Management 💑',
                    content: 'Share accounts, set joint goals, and manage finances together with privacy controls.',
                    position: 'right',
                    conditional: () => this.state.userPreferences.accountType === 'couple'
                },
                {
                    id: 'privacy_controls',
                    target: '[data-tutorial="privacy-mode"]',
                    title: 'Privacy Mode 🕶️',
                    content: 'One-click privacy mode to blur all financial amounts when others are around.',
                    position: 'top',
                    demo: {
                        type: 'privacy_toggle',
                        duration: 3000
                    }
                }
            ]
        });
    }
    
    registerTour(id, tourConfig) {
        this.tours.set(id, {
            id,
            ...tourConfig,
            steps: tourConfig.steps.map((step, index) => ({
                ...step,
                index,
                tourId: id
            }))
        });
    }
    
    setupEventListeners() {
        // Page load events
        document.addEventListener('DOMContentLoaded', () => {
            this.onPageLoad();
        });
        
        // URL change events (for SPA)
        window.addEventListener('popstate', () => {
            this.onPageChange();
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.state.isActive) return;
            
            switch(e.key) {
                case 'Escape':
                    this.skipTour();
                    break;
                case 'ArrowLeft':
                    this.previousStep();
                    break;
                case 'ArrowRight':
                case 'Enter':
                    this.nextStep();
                    break;
            }
        });
        
        // Resize handler
        window.addEventListener('resize', () => {
            if (this.state.isActive) {
                this.repositionElements();
            }
        });
        
        // Focus management
        document.addEventListener('focusin', (e) => {
            if (this.state.isActive && !this.isElementInTutorial(e.target)) {
                e.preventDefault();
                this.focusTutorialElement();
            }
        });
    }
    
    createOverlayElements() {
        // Create overlay container
        this.overlay = document.createElement('div');
        this.overlay.className = 'tutorial-overlay';
        this.overlay.innerHTML = `
            <div class="tutorial-backdrop"></div>
            <div class="tutorial-spotlight"></div>
            <div class="tutorial-tooltip">
                <div class="tutorial-content">
                    <div class="tutorial-header">
                        <div class="tutorial-icon"></div>
                        <div class="tutorial-meta">
                            <div class="tutorial-title"></div>
                            <div class="tutorial-step-counter"></div>
                        </div>
                        <button class="tutorial-close" aria-label="Close tutorial">×</button>
                    </div>
                    <div class="tutorial-body">
                        <div class="tutorial-description"></div>
                        <div class="tutorial-checklist"></div>
                        <div class="tutorial-highlights"></div>
                        <div class="tutorial-demo"></div>
                    </div>
                    <div class="tutorial-footer">
                        <div class="tutorial-actions-secondary">
                            <button class="tutorial-skip">Skip Tour</button>
                        </div>
                        <div class="tutorial-progress">
                            <div class="tutorial-progress-bar"></div>
                        </div>
                        <div class="tutorial-actions-primary">
                            <button class="tutorial-prev">Previous</button>
                            <button class="tutorial-next">Next</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.overlay);
        this.bindOverlayEvents();
    }
    
    bindOverlayEvents() {
        const elements = {
            close: this.overlay.querySelector('.tutorial-close'),
            skip: this.overlay.querySelector('.tutorial-skip'),
            prev: this.overlay.querySelector('.tutorial-prev'),
            next: this.overlay.querySelector('.tutorial-next')
        };
        
        elements.close.addEventListener('click', () => this.skipTour());
        elements.skip.addEventListener('click', () => this.skipTour());
        elements.prev.addEventListener('click', () => this.previousStep());
        elements.next.addEventListener('click', () => this.nextStep());
        
        // Prevent clicks outside tutorial from closing
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay.querySelector('.tutorial-backdrop')) {
                this.pulse();
            }
        });
    }
    
    async startTour(tourId, options = {}) {
        const tour = this.tours.get(tourId);
        if (!tour) {
            console.warn(`Tutorial tour "${tourId}" not found`);
            return false;
        }
        
        // Check prerequisites
        if (tour.prerequisites && !this.checkPrerequisites(tour.prerequisites)) {
            console.warn(`Prerequisites not met for tour "${tourId}"`);
            return false;
        }
        
        // Check if already completed (unless forced)
        if (!options.force && this.state.completedTours.has(tourId)) {
            console.log(`Tour "${tourId}" already completed`);
            return false;
        }
        
        this.state.isActive = true;
        this.state.currentTour = tour;
        this.state.currentStep = 0;
        this.state.totalSteps = tour.steps.length;
        this.state.startTime = Date.now();
        
        // Show overlay
        this.overlay.classList.add('active');
        document.body.classList.add('tutorial-active');
        
        // Start with first step
        await this.showStep(0);
        
        this.trackEvent('tour_started', {
            tourId,
            totalSteps: this.state.totalSteps
        });
        
        return true;
    }
    
    async showStep(stepIndex) {
        const tour = this.state.currentTour;
        const step = tour.steps[stepIndex];
        
        if (!step) return;
        
        this.state.currentStep = stepIndex;
        
        // Wait for target element if specified
        if (step.waitFor) {
            await this.waitForElement(step.waitFor);
        }
        
        // Check conditional display
        if (step.conditional && !step.conditional()) {
            return this.nextStep();
        }
        
        // Update UI elements
        this.updateStepContent(step);
        this.updateProgress();
        this.updateNavigation();
        
        // Position elements
        await this.positionElements(step);
        
        // Execute step actions
        if (step.actions) {
            this.setupStepActions(step.actions);
        }
        
        // Start step-specific features
        this.initializeStepFeatures(step);
        
        this.trackEvent('step_viewed', {
            tourId: tour.id,
            stepId: step.id,
            stepIndex
        });
    }
    
    updateStepContent(step) {
        const elements = {
            icon: this.overlay.querySelector('.tutorial-icon'),
            title: this.overlay.querySelector('.tutorial-title'),
            description: this.overlay.querySelector('.tutorial-description'),
            stepCounter: this.overlay.querySelector('.tutorial-step-counter')
        };
        
        elements.icon.textContent = step.icon || '📍';
        elements.title.textContent = step.title;
        elements.description.textContent = step.content;
        elements.stepCounter.textContent = `${this.state.currentStep + 1} of ${this.state.totalSteps}`;
        
        // Handle checklist
        if (step.checklist) {
            this.renderChecklist(step.checklist);
        }
        
        // Handle highlights
        if (step.highlights) {
            this.renderHighlights(step.highlights);
        }
        
        // Handle demos
        if (step.demo) {
            this.renderDemo(step.demo);
        }
    }
    
    async positionElements(step) {
        const target = await this.getTargetElement(step.target);
        
        if (!target && step.position !== 'center') {
            console.warn(`Target element not found: ${step.target}`);
            return;
        }
        
        if (step.position === 'center') {
            this.positionCentered();
        } else {
            this.positionRelativeToTarget(target, step.position);
        }
        
        // Add spotlight effect
        if (target && step.position !== 'center') {
            this.addSpotlight(target, step.pulse);
        }
        
        // Scroll target into view
        if (target) {
            target.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }
    }
    
    addSpotlight(target, shouldPulse = false) {
        const spotlight = this.overlay.querySelector('.tutorial-spotlight');
        const rect = target.getBoundingClientRect();
        const padding = 8;
        
        spotlight.style.left = `${rect.left - padding}px`;
        spotlight.style.top = `${rect.top - padding}px`;
        spotlight.style.width = `${rect.width + (padding * 2)}px`;
        spotlight.style.height = `${rect.height + (padding * 2)}px`;
        spotlight.classList.toggle('pulse', shouldPulse);
        spotlight.classList.add('visible');
    }
    
    async nextStep() {
        const currentStep = this.state.currentTour.steps[this.state.currentStep];
        
        // Validate step completion if required
        if (currentStep.validation && !currentStep.validation()) {
            this.showValidationError();
            return;
        }
        
        if (this.state.currentStep < this.state.totalSteps - 1) {
            await this.showStep(this.state.currentStep + 1);
        } else {
            this.completeTour();
        }
    }
    
    async previousStep() {
        if (this.state.currentStep > 0) {
            await this.showStep(this.state.currentStep - 1);
        }
    }
    
    skipTour() {
        this.trackEvent('tour_skipped', {
            tourId: this.state.currentTour.id,
            stepIndex: this.state.currentStep
        });
        
        this.hideTutorial();
    }
    
    completeTour() {
        const tour = this.state.currentTour;
        const timeSpent = Date.now() - this.state.startTime;
        
        this.state.completedTours.add(tour.id);
        this.saveProgress();
        
        this.trackEvent('tour_completed', {
            tourId: tour.id,
            timeSpent,
            stepsCompleted: this.state.totalSteps
        });
        
        this.showCompletionMessage(tour, timeSpent);
    }
    
    showCompletionMessage(tour, timeSpent) {
        // Update overlay with completion message
        const content = this.overlay.querySelector('.tutorial-content');
        content.innerHTML = `
            <div class="tutorial-completion">
                <div class="tutorial-completion-icon">🎉</div>
                <h2>Tutorial Complete!</h2>
                <p>You've successfully completed the "${tour.name}" tour.</p>
                <div class="tutorial-stats">
                    <div class="stat">
                        <span class="value">${this.formatTime(timeSpent)}</span>
                        <span class="label">Time Spent</span>
                    </div>
                    <div class="stat">
                        <span class="value">${this.state.totalSteps}</span>
                        <span class="label">Steps Completed</span>
                    </div>
                </div>
                <button class="btn btn-primary tutorial-finish">Continue</button>
            </div>
        `;
        
        const finishBtn = content.querySelector('.tutorial-finish');
        finishBtn.addEventListener('click', () => this.hideTutorial());
        
        // Auto-hide after 5 seconds
        setTimeout(() => this.hideTutorial(), 5000);
    }
    
    hideTutorial() {
        this.overlay.classList.remove('active');
        document.body.classList.remove('tutorial-active');
        
        // Clean up
        this.removeHighlights();
        this.state.isActive = false;
        this.state.currentTour = null;
        this.state.currentStep = 0;
        
        // Re-enable page interactions
        this.enablePageInteractions();
    }
    
    // Utility Methods
    async getTargetElement(selector) {
        if (!selector) return null;
        
        let element = document.querySelector(selector);
        if (element) return element;
        
        // Wait for element to appear (up to 5 seconds)
        return new Promise((resolve) => {
            const observer = new MutationObserver((mutations) => {
                element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            setTimeout(() => {
                observer.disconnect();
                resolve(null);
            }, 5000);
        });
    }
    
    async waitForElement(selector, timeout = 5000) {
        return new Promise((resolve) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }
            
            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            setTimeout(() => {
                observer.disconnect();
                resolve(null);
            }, timeout);
        });
    }
    
    detectUserContext() {
        this.state.contextData = {
            isNewUser: !localStorage.getItem('smartfinance_user_id'),
            hasAccounts: this.checkHasAccounts(),
            hasGoals: this.checkHasGoals(),
            currentPage: this.getCurrentPage(),
            userAgent: navigator.userAgent,
            screenSize: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
    }
    
    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('onboarding')) return 'onboarding';
        if (path.includes('dashboard')) return 'dashboard';
        if (path.includes('accounts')) return 'accounts';
        if (path.includes('goals')) return 'goals';
        if (path.includes('budget')) return 'budget';
        if (path.includes('ai')) return 'ai';
        return 'unknown';
    }
    
    checkForAutoStart() {
        const urlParams = new URLSearchParams(window.location.search);
        const forceTutorial = urlParams.get('tutorial');
        
        if (forceTutorial) {
            this.startTour(forceTutorial, { force: true });
            return;
        }
        
        // Auto-start based on context
        if (this.state.contextData.isNewUser) {
            setTimeout(() => this.startTour('onboarding'), 1000);
        } else if (this.state.contextData.currentPage === 'accounts' && !this.state.contextData.hasAccounts) {
            setTimeout(() => this.startTour('account_management'), 500);
        }
    }
    
    trackEvent(eventName, properties = {}) {
        if (!this.options.trackAnalytics) return;
        
        const eventData = {
            category: 'tutorial',
            ...properties,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Send to analytics service
        if (window.gtag) {
            window.gtag('event', eventName, eventData);
        }
        
        if (window.analytics) {
            window.analytics.track(eventName, eventData);
        }
        
        console.log('Tutorial Analytics:', eventName, eventData);
    }
    
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        }
        return `${seconds}s`;
    }
    
    saveProgress() {
        if (!this.options.persistProgress) return;
        
        const progressData = {
            completedTours: Array.from(this.state.completedTours),
            userPreferences: this.state.userPreferences,
            lastActivity: Date.now()
        };
        
        localStorage.setItem('smartfinance_tutorial_progress', JSON.stringify(progressData));
    }
    
    loadUserPreferences() {
        try {
            const saved = localStorage.getItem('smartfinance_tutorial_progress');
            if (saved) {
                const data = JSON.parse(saved);
                this.state.completedTours = new Set(data.completedTours || []);
                return data.userPreferences || {};
            }
        } catch (error) {
            console.warn('Failed to load tutorial progress:', error);
        }
        return {};
    }
    
    // Public API
    start(tourId) {
        return this.startTour(tourId, { force: true });
    }
    
    restart(tourId) {
        this.state.completedTours.delete(tourId);
        return this.startTour(tourId, { force: true });
    }
    
    skip() {
        return this.skipTour();
    }
    
    isActive() {
        return this.state.isActive;
    }
    
    getCompletedTours() {
        return Array.from(this.state.completedTours);
    }
    
    reset() {
        this.state.completedTours.clear();
        this.saveProgress();
    }
}

// Initialize global tutorial manager
window.TutorialManager = TutorialManager;

// Auto-initialize if not in module environment
if (typeof module === 'undefined') {
    window.tutorialManager = new TutorialManager();
}