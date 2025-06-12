/**
 * SmartFinanceAI - Quick Actions Floating Component
 * Global SaaS Platform - Navigation Enhancement
 * 
 * Floating action buttons for rapid financial operations
 * Supports multi-currency, accessibility, and mobile-first design
 */

class QuickActions {
  constructor() {
    this.isVisible = true;
    this.isExpanded = false;
    this.currentUser = null;
    this.permissions = new Set();
    this.actions = new Map();
    this.analytics = window.SmartFinanceAI?.analytics;
    
    this.init();
    this.setupEventListeners();
    this.loadUserPermissions();
  }

  /**
   * Initialize Quick Actions Component
   */
  init() {
    this.createQuickActionsContainer();
    this.loadActions();
    this.applyTheme();
    this.setupAccessibility();
  }

  /**
   * Create the floating quick actions container
   */
  createQuickActionsContainer() {
    const container = document.createElement('div');
    container.id = 'quick-actions-container';
    container.className = 'quick-actions-container';
    container.setAttribute('role', 'navigation');
    container.setAttribute('aria-label', 'Quick financial actions');
    
    container.innerHTML = `
      <div class="quick-actions-backdrop" aria-hidden="true"></div>
      <div class="quick-actions-fab-container">
        <button class="quick-actions-main-fab" 
                id="quick-actions-toggle"
                aria-expanded="false"
                aria-label="Quick actions menu"
                title="Quick Actions">
          <span class="fab-icon">⚡</span>
          <span class="fab-label">Quick Actions</span>
        </button>
        <div class="quick-actions-menu" id="quick-actions-menu" role="menu">
          <!-- Actions will be dynamically inserted here -->
        </div>
      </div>
    `;

    document.body.appendChild(container);
    this.container = container;
    this.mainFab = container.querySelector('#quick-actions-toggle');
    this.menu = container.querySelector('#quick-actions-menu');
    this.backdrop = container.querySelector('.quick-actions-backdrop');
  }

  /**
   * Load and configure available quick actions
   */
  loadActions() {
    // Core financial actions available to all users
    const coreActions = [
      {
        id: 'add-transaction',
        icon: '💳',
        label: 'Add Transaction',
        shortcut: 'Ctrl+T',
        permission: 'transactions.create',
        handler: () => this.openAddTransaction(),
        color: 'var(--brand-primary)',
        priority: 1
      },
      {
        id: 'add-goal',
        icon: '🎯',
        label: 'New Goal',
        shortcut: 'Ctrl+G',
        permission: 'goals.create',
        handler: () => this.openAddGoal(),
        color: 'var(--brand-accent)',
        priority: 2
      },
      {
        id: 'upload-csv',
        icon: '📊',
        label: 'Import CSV',
        shortcut: 'Ctrl+U',
        permission: 'transactions.import',
        handler: () => this.openCSVUpload(),
        color: 'var(--brand-info)',
        priority: 3
      }
    ];

    // Premium actions for upgraded users
    const premiumActions = [
      {
        id: 'ai-insights',
        icon: '🤖',
        label: 'AI Insights',
        shortcut: 'Ctrl+I',
        permission: 'ai.insights',
        handler: () => this.openAIInsights(),
        color: 'var(--gradient-primary)',
        priority: 4,
        premium: true
      },
      {
        id: 'budget-optimizer',
        icon: '📈',
        label: 'Optimize Budget',
        shortcut: 'Ctrl+O',
        permission: 'budget.optimize',
        handler: () => this.openBudgetOptimizer(),
        color: 'var(--brand-warning)',
        priority: 5,
        premium: true
      }
    ];

    // Business tier actions
    const businessActions = [
      {
        id: 'generate-report',
        icon: '📋',
        label: 'Generate Report',
        shortcut: 'Ctrl+R',
        permission: 'reports.generate',
        handler: () => this.openReportGenerator(),
        color: 'var(--brand-secondary)',
        priority: 6,
        business: true
      }
    ];

    // Combine and filter actions based on user permissions
    const allActions = [...coreActions, ...premiumActions, ...businessActions];
    allActions.forEach(action => {
      if (this.hasPermission(action.permission)) {
        this.actions.set(action.id, action);
      }
    });

    this.renderActions();
  }

  /**
   * Render quick action buttons in the menu
   */
  renderActions() {
    const sortedActions = Array.from(this.actions.values())
      .sort((a, b) => a.priority - b.priority);

    this.menu.innerHTML = sortedActions.map(action => `
      <button class="quick-action-item" 
              data-action="${action.id}"
              style="--action-color: ${action.color}"
              role="menuitem"
              aria-label="${action.label}${action.shortcut ? ` (${action.shortcut})` : ''}"
              title="${action.label}${action.shortcut ? ` - ${action.shortcut}` : ''}">
        <span class="action-icon">${action.icon}</span>
        <span class="action-label">${action.label}</span>
        ${action.shortcut ? `<span class="action-shortcut">${action.shortcut}</span>` : ''}
        ${action.premium ? '<span class="premium-badge">✨</span>' : ''}
        ${action.business ? '<span class="business-badge">💼</span>' : ''}
      </button>
    `).join('');

    // Add event listeners to action buttons
    this.menu.querySelectorAll('.quick-action-item').forEach(button => {
      button.addEventListener('click', (e) => {
        const actionId = e.currentTarget.dataset.action;
        const action = this.actions.get(actionId);
        if (action) {
          this.executeAction(action);
        }
      });
    });
  }

  /**
   * Execute a quick action
   */
  executeAction(action) {
    try {
      // Track action usage
      this.trackActionUsage(action.id);
      
      // Close menu
      this.hideMenu();
      
      // Execute action handler
      action.handler();
      
      // Show feedback
      this.showActionFeedback(action.label);
      
    } catch (error) {
      console.error('Quick Action Error:', error);
      this.showError(`Failed to execute ${action.label}`);
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Main FAB toggle
    this.mainFab.addEventListener('click', () => this.toggleMenu());
    
    // Backdrop click to close
    this.backdrop.addEventListener('click', () => this.hideMenu());
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    
    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isExpanded) {
        this.hideMenu();
      }
    });

    // Window resize handling
    window.addEventListener('resize', () => this.handleResize());
    
    // Scroll handling for mobile
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      this.container.style.opacity = '0.7';
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.container.style.opacity = '1';
      }, 150);
    });

    // User permission changes
    document.addEventListener('user-permissions-updated', () => {
      this.loadUserPermissions();
      this.loadActions();
    });
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyboardShortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
      const shortcuts = {
        't': 'add-transaction',
        'g': 'add-goal', 
        'u': 'upload-csv',
        'i': 'ai-insights',
        'o': 'budget-optimizer',
        'r': 'generate-report'
      };

      const actionId = shortcuts[e.key.toLowerCase()];
      if (actionId && this.actions.has(actionId)) {
        e.preventDefault();
        this.executeAction(this.actions.get(actionId));
      }
    }
  }

  /**
   * Toggle menu visibility
   */
  toggleMenu() {
    if (this.isExpanded) {
      this.hideMenu();
    } else {
      this.showMenu();
    }
  }

  /**
   * Show quick actions menu
   */
  showMenu() {
    this.isExpanded = true;
    this.container.classList.add('expanded');
    this.mainFab.setAttribute('aria-expanded', 'true');
    this.mainFab.classList.add('active');
    
    // Animate menu items
    const items = this.menu.querySelectorAll('.quick-action-item');
    items.forEach((item, index) => {
      item.style.transform = 'translateY(20px) scale(0.8)';
      item.style.opacity = '0';
      
      setTimeout(() => {
        item.style.transform = 'translateY(0) scale(1)';
        item.style.opacity = '1';
      }, index * 50 + 100);
    });

    // Focus first menu item for accessibility
    setTimeout(() => {
      const firstItem = this.menu.querySelector('.quick-action-item');
      if (firstItem) firstItem.focus();
    }, 200);

    this.trackEvent('quick_actions_opened');
  }

  /**
   * Hide quick actions menu
   */
  hideMenu() {
    this.isExpanded = false;
    this.container.classList.remove('expanded');
    this.mainFab.setAttribute('aria-expanded', 'false');
    this.mainFab.classList.remove('active');
    
    // Return focus to main FAB
    this.mainFab.focus();

    this.trackEvent('quick_actions_closed');
  }

  /**
   * Action handlers for each quick action
   */
  openAddTransaction() {
    // Open add transaction modal
    const modal = document.querySelector('#add-transaction-modal');
    if (modal) {
      modal.classList.add('active');
    } else {
      // Create and show modal if it doesn't exist
      window.SmartFinanceAI?.modals?.showAddTransaction();
    }
  }

  openAddGoal() {
    // Open add goal modal
    const modal = document.querySelector('#add-goal-modal');
    if (modal) {
      modal.classList.add('active');
    } else {
      window.SmartFinanceAI?.modals?.showAddGoal();
    }
  }

  openCSVUpload() {
    // Navigate to CSV upload page
    if (window.SmartFinanceAI?.router) {
      window.SmartFinanceAI.router.navigate('/csv-import/upload');
    } else {
      window.location.href = '/csv-import/upload.html';
    }
  }

  openAIInsights() {
    // Open AI insights panel
    window.SmartFinanceAI?.ai?.showInsightsPanel();
  }

  openBudgetOptimizer() {
    // Open budget optimization tool
    window.SmartFinanceAI?.budget?.showOptimizer();
  }

  openReportGenerator() {
    // Open report generation interface
    window.SmartFinanceAI?.reports?.showGenerator();
  }

  /**
   * User permission management
   */
  loadUserPermissions() {
    this.currentUser = window.SmartFinanceAI?.auth?.getCurrentUser();
    if (this.currentUser) {
      this.permissions = new Set(this.currentUser.permissions || []);
    }
  }

  hasPermission(permission) {
    return this.permissions.has(permission) || this.currentUser?.tier === 'professional';
  }

  /**
   * Responsive handling
   */
  handleResize() {
    const isMobile = window.innerWidth < 768;
    
    if (isMobile && this.isExpanded) {
      // On mobile, ensure menu doesn't overflow
      this.menu.style.maxHeight = `${window.innerHeight - 200}px`;
    }
  }

  /**
   * Theme and styling
   */
  applyTheme() {
    const isDarkMode = document.documentElement.classList.contains('dark-theme');
    this.container.classList.toggle('dark-theme', isDarkMode);
  }

  /**
   * Accessibility enhancements
   */
  setupAccessibility() {
    // Add ARIA live region for announcements
    const liveRegion = document.createElement('div');
    liveRegion.id = 'quick-actions-announcements';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(liveRegion);
    this.liveRegion = liveRegion;
  }

  /**
   * Show action feedback
   */
  showActionFeedback(actionLabel) {
    if (this.liveRegion) {
      this.liveRegion.textContent = `${actionLabel} activated`;
    }

    // Visual feedback on FAB
    this.mainFab.classList.add('action-executed');
    setTimeout(() => {
      this.mainFab.classList.remove('action-executed');
    }, 300);
  }

  /**
   * Show error message
   */
  showError(message) {
    if (this.liveRegion) {
      this.liveRegion.textContent = `Error: ${message}`;
    }
    console.error('Quick Actions Error:', message);
  }

  /**
   * Analytics tracking
   */
  trackActionUsage(actionId) {
    if (this.analytics) {
      this.analytics.track('quick_action_used', {
        action_id: actionId,
        user_tier: this.currentUser?.tier,
        timestamp: new Date().toISOString()
      });
    }
  }

  trackEvent(eventName, data = {}) {
    if (this.analytics) {
      this.analytics.track(eventName, {
        component: 'quick_actions',
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Public API methods
   */
  show() {
    this.isVisible = true;
    this.container.style.display = 'block';
  }

  hide() {
    this.isVisible = false;
    this.container.style.display = 'none';
    if (this.isExpanded) {
      this.hideMenu();
    }
  }

  addCustomAction(action) {
    if (this.hasPermission(action.permission)) {
      this.actions.set(action.id, action);
      this.renderActions();
    }
  }

  removeAction(actionId) {
    this.actions.delete(actionId);
    this.renderActions();
  }

  updatePermissions() {
    this.loadUserPermissions();
    this.loadActions();
  }

  destroy() {
    if (this.container) {
      this.container.remove();
    }
    if (this.liveRegion) {
      this.liveRegion.remove();
    }
    
    // Remove global event listeners
    document.removeEventListener('keydown', this.handleKeyboardShortcuts);
    window.removeEventListener('resize', this.handleResize);
  }
}

/**
 * CSS Styles for Quick Actions Component
 */
const quickActionsStyles = `
.quick-actions-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  pointer-events: none;
}

.quick-actions-container * {
  pointer-events: auto;
}

.quick-actions-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: -1;
}

.quick-actions-container.expanded .quick-actions-backdrop {
  opacity: 1;
  visibility: visible;
}

.quick-actions-fab-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.quick-actions-main-fab {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--gradient-primary);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.quick-actions-main-fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(139, 92, 246, 0.5);
}

.quick-actions-main-fab:focus {
  outline: none;
  box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.3);
}

.quick-actions-main-fab.active {
  transform: rotate(45deg);
}

.quick-actions-main-fab.action-executed {
  animation: fab-pulse 0.3s ease-out;
}

@keyframes fab-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.fab-icon {
  transition: transform 0.3s ease;
}

.quick-actions-main-fab.active .fab-icon {
  transform: rotate(-45deg);
}

.fab-label {
  position: absolute;
  right: 100%;
  margin-right: 16px;
  background: var(--glass-intense);
  backdrop-filter: blur(20px);
  color: var(--text-primary);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  opacity: 0;
  transform: translateX(10px);
  transition: all 0.3s ease;
  pointer-events: none;
}

.quick-actions-main-fab:hover .fab-label {
  opacity: 1;
  transform: translateX(0);
}

.quick-actions-menu {
  position: absolute;
  bottom: 80px;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  opacity: 0;
  visibility: hidden;
  transform: translateY(20px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.quick-actions-container.expanded .quick-actions-menu {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.quick-action-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--glass-light);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border-light);
  border-radius: 12px;
  color: var(--text-primary);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 200px;
  position: relative;
  overflow: hidden;
}

.quick-action-item:hover {
  background: var(--glass-medium);
  transform: translateX(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.quick-action-item:focus {
  outline: none;
  border-color: var(--action-color, var(--brand-primary));
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.3);
}

.action-icon {
  font-size: 20px;
  width: 24px;
  text-align: center;
}

.action-label {
  flex: 1;
  font-weight: 500;
  font-size: 14px;
}

.action-shortcut {
  font-size: 12px;
  color: var(--text-tertiary);
  background: var(--glass-subtle);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: var(--font-mono);
}

.premium-badge, .business-badge {
  font-size: 12px;
  margin-left: 4px;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .quick-actions-container {
    bottom: 16px;
    right: 16px;
  }
  
  .quick-actions-main-fab {
    width: 56px;
    height: 56px;
    font-size: 20px;
  }
  
  .quick-action-item {
    min-width: 180px;
    padding: 10px 14px;
  }
  
  .fab-label {
    display: none;
  }
}

/* Dark theme adjustments */
.quick-actions-container.dark-theme .quick-actions-main-fab {
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.6);
}

.quick-actions-container.dark-theme .quick-action-item {
  border-color: var(--glass-border-medium);
}
`;

// Initialize Quick Actions when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeQuickActions);
} else {
  initializeQuickActions();
}

function initializeQuickActions() {
  // Inject styles
  const styleSheet = document.createElement('style');
  styleSheet.textContent = quickActionsStyles;
  document.head.appendChild(styleSheet);

  // Initialize component
  window.SmartFinanceAI = window.SmartFinanceAI || {};
  window.SmartFinanceAI.quickActions = new QuickActions();
}

export default QuickActions;