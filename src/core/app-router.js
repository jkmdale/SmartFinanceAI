// src/core/app-router.js - Main Application Router
class SmartFinanceRouter {
    constructor() {
        this.routes = {
            // Authentication routes
            '/': 'src/auth/login.html',
            '/auth/login': 'src/auth/login.html', 
            '/auth/register': 'src/auth/register.html',
            '/auth/forgot-password': 'src/auth/forgot-password.html',
            '/auth/biometric-setup': 'src/auth/biometric-setup.html',
            
            // Onboarding routes  
            '/onboarding/welcome': 'src/onboarding/welcome.html',
            '/onboarding/country-selection': 'src/onboarding/country-selection.html',
            '/onboarding/profile-setup': 'src/onboarding/profile-setup.html',
            '/onboarding/account-wizard': 'src/onboarding/account-wizard.html',
            '/onboarding/goal-templates': 'src/onboarding/goal-templates.html',
            
            // Core application routes
            '/dashboard': 'src/core/dashboard.html',
            '/accounts': 'src/core/accounts.html', 
            '/transactions': 'src/core/transactions.html',
            '/budget': 'src/core/budget.html',
            '/goals': 'src/core/goals.html',
            '/reports': 'src/core/reports.html',
            '/settings': 'src/core/settings.html',
            
            // CSV Import routes
            '/import': 'src/csv-import/upload.html',
            '/import/preview': 'src/csv-import/preview.html',
            '/import/mapping': 'src/csv-import/mapping.html',
            
            // AI routes
            '/ai/coach': 'src/ai/coach-panel.html',
            '/ai/insights': 'src/ai/insights.html'
        };
        
        this.currentRoute = null;
        this.isAuthenticated = false;
        this.init();
    }
    
    init() {
        // Check authentication status
        this.checkAuth();
        
        // Handle initial route
        this.handleRoute();
        
        // Listen for navigation events
        window.addEventListener('popstate', () => this.handleRoute());
        
        // Intercept all link clicks for SPA routing
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' && e.target.href.startsWith(window.location.origin)) {
                e.preventDefault();
                this.navigate(e.target.pathname);
            }
        });
        
        console.log('🚀 SmartFinanceAI Router initialized');
    }
    
    checkAuth() {
        const session = localStorage.getItem('smartfinance_session');
        const expiry = localStorage.getItem('smartfinance_session_expiry');
        
        if (session && expiry) {
            const now = new Date();
            const expiryDate = new Date(expiry);
            
            if (now < expiryDate) {
                this.isAuthenticated = true;
                console.log('✅ User authenticated');
            } else {
                // Session expired
                this.clearSession();
                console.log('⏰ Session expired');
            }
        }
    }
    
    clearSession() {
        localStorage.removeItem('smartfinance_session');
        localStorage.removeItem('smartfinance_session_expiry');
        this.isAuthenticated = false;
    }
    
    navigate(path, replace = false) {
        // Update browser history
        if (replace) {
            window.history.replaceState({}, '', path);
        } else {
            window.history.pushState({}, '', path);
        }
        
        this.handleRoute();
    }
    
    async handleRoute() {
        const path = window.location.pathname;
        this.currentRoute = path;
        
        // Check if route requires authentication
        if (this.requiresAuth(path) && !this.isAuthenticated) {
            this.navigate('/auth/login', true);
            return;
        }
        
        // Redirect authenticated users away from auth pages
        if (this.isAuthPage(path) && this.isAuthenticated) {
            this.navigate('/dashboard', true);
            return;
        }
        
        // Load the appropriate page
        await this.loadPage(path);
    }
    
    requiresAuth(path) {
        const publicPaths = [
            '/',
            '/auth/login',
            '/auth/register', 
            '/auth/forgot-password'
        ];
        return !publicPaths.includes(path);
    }
    
    isAuthPage(path) {
        return path.startsWith('/auth/');
    }
    
    async loadPage(path) {
        const route = this.routes[path] || this.routes['/'];
        
        try {
            // Show loading state
            this.showLoading();
            
            // Load page content
            const response = await fetch(route);
            if (!response.ok) throw new Error(`Failed to load ${route}`);
            
            const html = await response.text();
            
            // Extract and inject content
            this.injectPage(html);
            
            // Hide loading state
            this.hideLoading();
            
            // Initialize page-specific functionality
            this.initPageScripts(path);
            
            console.log(`📄 Loaded page: ${path}`);
            
        } catch (error) {
            console.error('❌ Route loading error:', error);
            this.show404();
        }
    }
    
    injectPage(html) {
        // Create temporary container to parse HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Extract body content
        const bodyContent = tempDiv.querySelector('body')?.innerHTML || html;
        
        // Update main content area
        const mainContent = document.getElementById('main-content') || document.body;
        mainContent.innerHTML = bodyContent;
        
        // Update page title
        const titleElement = tempDiv.querySelector('title');
        if (titleElement) {
            document.title = titleElement.textContent;
        }
    }
    
    initPageScripts(path) {
        // Initialize page-specific JavaScript based on route
        switch(path) {
            case '/':
            case '/auth/login':
                this.initLoginPage();
                break;
            case '/auth/register':
                this.initRegisterPage();
                break;
            case '/dashboard':
                this.initDashboard();
                break;
            case '/accounts':
                this.initAccountsPage();
                break;
            case '/transactions':
                this.initTransactionsPage();
                break;
            case '/budget':
                this.initBudgetPage();
                break;
            case '/goals':
                this.initGoalsPage();
                break;
            case '/import':
                this.initCSVImport();
                break;
            default:
                console.log(`No specific initialization for ${path}`);
        }
    }
    
    // Page initialization methods
    initLoginPage() {
        // Load login page functionality
        import('./src/auth/auth-manager.js').then(module => {
            new module.AuthManager();
        });
    }
    
    initRegisterPage() {
        // Load registration functionality
        import('./src/auth/auth-manager.js').then(module => {
            new module.RegistrationManager();
        });
    }
    
    initDashboard() {
        // Load dashboard functionality
        import('./src/core/dashboard-controller.js').then(module => {
            new module.DashboardController();
        });
    }
    
    initAccountsPage() {
        // Load accounts functionality
        import('./src/core/account-manager.js').then(module => {
            new module.AccountManager();
        });
    }
    
    initTransactionsPage() {
        // Load transactions functionality
        import('./src/core/transaction-engine.js').then(module => {
            new module.TransactionEngine();
        });
    }
    
    initBudgetPage() {
        // Load budget functionality
        import('./src/core/budget-system.js').then(module => {
            new module.BudgetSystem();
        });
    }
    
    initGoalsPage() {
        // Load goals functionality
        import('./src/core/goal-tracker.js').then(module => {
            new module.GoalTracker();
        });
    }
    
    initCSVImport() {
        // Load CSV import functionality
        import('./src/csv-import/csv-processor.js').then(module => {
            new module.CSVProcessor();
        });
    }
    
    showLoading() {
        const existingLoader = document.getElementById('app-loader');
        if (existingLoader) return;
        
        const loader = document.createElement('div');
        loader.id = 'app-loader';
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(15, 23, 42, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            backdrop-filter: blur(10px);
        `;
        
        loader.innerHTML = `
            <div style="text-align: center; color: white;">
                <div style="width: 50px; height: 50px; border: 3px solid rgba(139, 92, 246, 0.3); border-top: 3px solid #8b5cf6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                <div style="font-size: 1rem; opacity: 0.8;">Loading...</div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        
        document.body.appendChild(loader);
    }
    
    hideLoading() {
        const loader = document.getElementById('app-loader');
        if (loader) {
            loader.remove();
        }
    }
    
    show404() {
        const mainContent = document.getElementById('main-content') || document.body;
        mainContent.innerHTML = `
            <div style="text-align: center; padding: 4rem; color: white;">
                <h1 style="font-size: 3rem; margin-bottom: 1rem;">404</h1>
                <p style="font-size: 1.2rem; margin-bottom: 2rem; opacity: 0.8;">Page not found</p>
                <button onclick="app.router.navigate('/dashboard')" style="background: linear-gradient(135deg, #40e0d0 0%, #3b82f6 50%, #8b5cf6 100%); border: none; color: white; padding: 1rem 2rem; border-radius: 1rem; cursor: pointer; font-size: 1rem;">
                    Go to Dashboard
                </button>
            </div>
        `;
    }
    
    // Public API methods
    login(userData) {
        this.isAuthenticated = true;
        
        // Save session
        const session = {
            ...userData,
            loginTime: new Date().toISOString(),
            sessionId: this.generateSessionId()
        };
        
        localStorage.setItem('smartfinance_session', JSON.stringify(session));
        
        // Set expiry (24 hours)
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 24);
        localStorage.setItem('smartfinance_session_expiry', expiry.toISOString());
        
        // Redirect to dashboard
        this.navigate('/dashboard');
    }
    
    logout() {
        this.clearSession();
        this.navigate('/auth/login');
    }
    
    generateSessionId() {
        return 'sess_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
}

// Initialize global router
window.SmartFinanceRouter = SmartFinanceRouter;

// Export for module usage
export default SmartFinanceRouter;