/**
 * SmartFinanceAI - Mobile Navigation Component
 * Global SaaS Platform File: src/components/navigation/mobile-nav.js
 * 
 * Mobile-optimized navigation with gestures, accessibility, and PWA features
 * Features: Swipe gestures, quick actions, offline indicators, biometric shortcuts
 */

class MobileNavigation {
  constructor() {
    this.isOpen = false;
    this.startY = 0;
    this.currentY = 0;
    this.isDragging = false;
    this.quickActions = [];
    this.recentPages = [];
    this.shortcuts = [];
    
    this.init();
  }

  /**
   * Initialize mobile navigation system
   */
  async init() {
    await this.loadMobilePreferences();
    this.setupGestureHandlers();
    this.setupQuickActions();
    this.setupKeyboardShortcuts();
    this.render();
  }

  /**
   * Load mobile-specific preferences and shortcuts
   */
  async loadMobilePreferences() {
    try {
      const preferences = await window.userManager?.getPreferences();
      if (preferences) {
        this.quickActions = preferences.mobileQuickActions || this.getDefaultQuickActions();
        this.shortcuts = preferences.mobileShortcuts || [];
        this.recentPages = preferences.recentPages || [];
      } else {
        this.quickActions = this.getDefaultQuickActions();
      }
    } catch (error) {
      console.error('Failed to load mobile preferences:', error);
      this.quickActions = this.getDefaultQuickActions();
    }
  }

  /**
   * Setup gesture handlers for mobile interactions
   */
  setupGestureHandlers() {
    const mobileNav = document.getElementById('mobile-navigation');
    if (!mobileNav) return;

    let startX = 0;
    let startY = 0;
    let isSwiping = false;

    // Touch events for gesture recognition
    mobileNav.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isSwiping = true;
    }, { passive: true });

    mobileNav.addEventListener('touchmove', (e) => {
      if (!isSwiping) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = startX - currentX;
      const diffY = startY - currentY;

      // Detect swipe direction
      if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if (Math.abs(diffX) > 50) {
          if (diffX > 0) {
            // Swipe left - close menu
            this.close();
          } else {
            // Swipe right - open menu (if closed)
            if (!this.isOpen) {
              this.open();
            }
          }
          isSwiping = false;
        }
      } else {
        // Vertical swipe
        if (Math.abs(diffY) > 100) {
          if (diffY > 0) {
            // Swipe up - quick actions
            this.showQuickActions();
          } else {
            // Swipe down - recent pages
            this.showRecentPages();
          }
          isSwiping = false;
        }
      }
    }, { passive: true });

    mobileNav.addEventListener('touchend', () => {
      isSwiping = false;
    }, { passive: true });

    // Edge swipe to open navigation
    document.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      if (touch.clientX < 20 && !this.isOpen) {
        // Edge swipe from left
        this.edgeSwipeStart = true;
      }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (this.edgeSwipeStart && !this.isOpen) {
        const touch = e.touches[0];
        if (touch.clientX > 50) {
          this.open();
          this.edgeSwipeStart = false;
        }
      }
    }, { passive: true });

    document.addEventListener('touchend', () => {
      this.edgeSwipeStart = false;
    }, { passive: true });
  }

  /**
   * Setup quick actions for mobile users
   */
  setupQuickActions() {
    // Listen for quick action triggers
    document.addEventListener('click', (e) => {
      const quickAction = e.target.closest('[data-quick-action]');
      if (quickAction) {
        e.preventDefault();
        this.executeQuickAction(quickAction.dataset.quickAction);
      }
    });

    // Listen for long press on navigation items
    let longPressTimer = null;
    document.addEventListener('touchstart', (e) => {
      const navItem = e.target.closest('.mobile-nav-link');
      if (navItem) {
        longPressTimer = setTimeout(() => {
          this.showNavItemOptions(navItem);
          navigator.vibrate?.(50); // Haptic feedback
        }, 500);
      }
    });

    document.addEventListener('touchend', () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    });

    document.addEventListener('touchmove', () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    });
  }

  /**
   * Setup keyboard shortcuts for mobile keyboards
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Only handle shortcuts when mobile nav is open
      if (!this.isOpen) return;

      switch (e.key) {
        case 'Escape':
          this.close();
          break;
        case 'ArrowUp':
          this.navigateUp();
          e.preventDefault();
          break;
        case 'ArrowDown':
          this.navigateDown();
          e.preventDefault();
          break;
        case 'Enter':
          this.activateSelected();
          e.preventDefault();
          break;
      }
    });
  }

  /**
   * Render mobile navigation overlay
   */
  render() {
    const container = document.getElementById('mobile-navigation');
    if (!container) return;

    container.innerHTML = this.generateMobileNavHTML();
    this.setupEventListeners();
  }

  /**
   * Generate mobile navigation HTML
   */
  generateMobileNavHTML() {
    return `
      <div class="mobile-nav-overlay" aria-hidden="true">
        <!-- Navigation Header -->
        <div class="mobile-nav-header glass-intense">
          ${this.renderMobileHeader()}
          ${this.renderSwipeIndicator()}
        </div>

        <!-- Quick Actions Strip -->
        <div class="mobile-quick-actions">
          ${this.renderQuickActions()}
        </div>

        <!-- Main Navigation Content -->
        <div class="mobile-nav-content">
          ${this.renderNavigationSections()}
        </div>

        <!-- Recent Pages -->
        <div class="mobile-recent-section">
          ${this.renderRecentPages()}
        </div>

        <!-- Mobile Footer -->
        <div class="mobile-nav-footer">
          ${this.renderMobileFooter()}
        </div>
      </div>
    `;
  }

  /**
   * Render mobile navigation header
   */
  renderMobileHeader() {
    const user = window.mainNavigation?.currentUser;
    const syncStatus = window.mainNavigation?.syncStatus || 'offline';
    
    return `
      <div class="mobile-header-content">
        <div class="mobile-user-section">
          ${user ? `
            <div class="mobile-user-info">
              <div class="mobile-user-avatar">
                ${user.avatar ? 
                  `<img src="${user.avatar}" alt="${user.name}" />` :
                  `<span class="avatar-initials">${this.getUserInitials(user)}</span>`
                }
              </div>
              <div class="mobile-user-details">
                <div class="mobile-user-name">${user.name || user.email}</div>
                <div class="mobile-user-status">
                  <span class="sync-indicator ${syncStatus}">
                    ${this.getSyncIcon(syncStatus)}
                  </span>
                  <span class="status-text">${this.getSyncText(syncStatus)}</span>
                </div>
              </div>
            </div>
          ` : `
            <div class="mobile-auth-prompt">
              <span class="auth-icon">👤</span>
              <span class="auth-text">Sign in for full access</span>
            </div>
          `}
        </div>

        <button class="mobile-close-btn" 
                data-mobile-close
                aria-label="Close navigation">
          <span class="close-icon">✕</span>
        </button>
      </div>
    `;
  }

  /**
   * Render swipe gesture indicator
   */
  renderSwipeIndicator() {
    return `
      <div class="swipe-indicator">
        <div class="swipe-hint">
          <span class="swipe-icon">↕️</span>
          <span class="swipe-text">Swipe for quick actions</span>
        </div>
      </div>
    `;
  }

  /**
   * Render quick actions strip
   */
  renderQuickActions() {
    return `
      <div class="quick-actions-strip">
        <div class="quick-actions-label">Quick Actions</div>
        <div class="quick-actions-grid">
          ${this.quickActions.map(action => `
            <button class="quick-action-btn ${action.type || ''}" 
                    data-quick-action="${action.id}"
                    aria-label="${action.label}">
              <span class="quick-action-icon">${action.icon}</span>
              <span class="quick-action-label">${action.label}</span>
              ${action.badge ? `<span class="quick-action-badge">${action.badge}</span>` : ''}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render navigation sections
   */
  renderNavigationSections() {
    const navItems = this.getNavigationSections();
    
    return navItems.map(section => `
      <div class="mobile-nav-section">
        <h3 class="mobile-section-title">
          <span class="section-icon">${section.icon}</span>
          <span class="section-text">${section.title}</span>
          ${section.badge ? `<span class="section-badge">${section.badge}</span>` : ''}
        </h3>
        
        <div class="mobile-section-items">
          ${section.items.map(item => this.renderMobileNavItem(item)).join('')}
        </div>
      </div>
    `).join('');
  }

  /**
   * Render individual mobile navigation item
   */
  renderMobileNavItem(item) {
    const isActive = window.mainNavigation?.isActiveRoute(item.path);
    const hasAccess = !item.tier || window.mainNavigation?.hasAccess(item.tier);
    
    return `
      <a href="${item.path}" 
         class="mobile-nav-item ${isActive ? 'active' : ''} ${!hasAccess ? 'disabled' : ''}"
         data-nav-link="${item.path}"
         data-nav-section="${item.section}"
         ${!hasAccess ? 'aria-disabled="true"' : ''}>
        
        <div class="mobile-item-icon">
          <span class="item-icon">${item.icon}</span>
          ${isActive ? '<span class="active-indicator">●</span>' : ''}
        </div>
        
        <div class="mobile-item-content">
          <div class="mobile-item-title">
            ${item.label}
            ${item.tier && !hasAccess ? `
              <span class="tier-lock">🔒</span>
            ` : ''}
          </div>
          <div class="mobile-item-description">${item.description}</div>
          ${item.lastUsed ? `
            <div class="mobile-item-meta">Last used: ${this.formatRelativeTime(item.lastUsed)}</div>
          ` : ''}
        </div>
        
        <div class="mobile-item-actions">
          ${item.badge ? `<span class="item-badge">${item.badge}</span>` : ''}
          <button class="item-options-btn" 
                  data-item-options="${item.path}"
                  aria-label="Options for ${item.label}">
            <span class="options-icon">⋮</span>
          </button>
        </div>
      </a>
    `;
  }

  /**
   * Render recent pages section
   */
  renderRecentPages() {
    if (this.recentPages.length === 0) {
      return `
        <div class="mobile-recent-empty">
          <span class="empty-icon">📱</span>
          <span class="empty-text">No recent pages</span>
        </div>
      `;
    }

    return `
      <div class="mobile-recent-header">
        <h3 class="recent-title">
          <span class="recent-icon">🕒</span>
          Recent Pages
        </h3>
        <button class="clear-recent-btn" data-clear-recent>Clear</button>
      </div>
      
      <div class="mobile-recent-items">
        ${this.recentPages.slice(0, 5).map(page => `
          <a href="${page.path}" 
             class="mobile-recent-item"
             data-nav-link="${page.path}">
            <span class="recent-item-icon">${page.icon}</span>
            <div class="recent-item-content">
              <div class="recent-item-title">${page.title}</div>
              <div class="recent-item-time">${this.formatRelativeTime(page.timestamp)}</div>
            </div>
          </a>
        `).join('')}
      </div>
    `;
  }

  /**
   * Render mobile footer with shortcuts
   */
  renderMobileFooter() {
    return `
      <div class="mobile-footer-content">
        <div class="mobile-shortcuts">
          <button class="shortcut-btn" data-quick-action="add-transaction">
            <span class="shortcut-icon">💳</span>
            <span class="shortcut-text">Add Transaction</span>
          </button>
          
          <button class="shortcut-btn" data-quick-action="quick-balance">
            <span class="shortcut-icon">💰</span>
            <span class="shortcut-text">Quick Balance</span>
          </button>
          
          <button class="shortcut-btn" data-quick-action="camera-scan">
            <span class="shortcut-icon">📷</span>
            <span class="shortcut-text">Scan Receipt</span>
          </button>
        </div>
        
        <div class="mobile-footer-info">
          <span class="app-version">SmartFinanceAI v2.0</span>
          <span class="offline-indicator ${navigator.onLine ? 'online' : 'offline'}">
            ${navigator.onLine ? '🟢 Online' : '🔴 Offline'}
          </span>
        </div>
      </div>
    `;
  }

  /**
   * Get navigation sections for mobile
   */
  getNavigationSections() {
    const allItems = window.mainNavigation?.getNavigationItems() || [];
    
    return [
      {
        title: 'Financial Overview',
        icon: '📊',
        items: allItems.filter(item => item.section === 'core')
      },
      {
        title: 'Tools & Import',
        icon: '🛠️',
        items: allItems.filter(item => item.section === 'tools')
      },
      {
        title: 'AI & Analytics',
        icon: '🤖',
        badge: 'PRO',
        items: allItems.filter(item => ['ai', 'analytics'].includes(item.section))
      },
      {
        title: 'Advanced Features',
        icon: '⚡',
        badge: 'BIZ',
        items: allItems.filter(item => item.section === 'advanced')
      }
    ].filter(section => section.items.length > 0);
  }

  /**
   * Get default quick actions
   */
  getDefaultQuickActions() {
    return [
      {
        id: 'add-transaction',
        icon: '💳',
        label: 'Add Transaction',
        type: 'primary'
      },
      {
        id: 'view-balance',
        icon: '💰',
        label: 'Balance',
        type: 'secondary'
      },
      {
        id: 'scan-receipt',
        icon: '📷',
        label: 'Scan',
        type: 'secondary'
      },
      {
        id: 'ai-insights',
        icon: '🤖',
        label: 'AI Insights',
        type: 'premium'
      },
      {
        id: 'quick-budget',
        icon: '📋',
        label: 'Budget',
        type: 'secondary'
      },
      {
        id: 'emergency-mode',
        icon: '🚨',
        label: 'Emergency',
        type: 'danger'
      }
    ];
  }

  /**
   * Setup event listeners for mobile interactions
   */
  setupEventListeners() {
    // Close button
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-mobile-close]')) {
        this.close();
      }
    });

    // Clear recent pages
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-clear-recent]')) {
        this.clearRecentPages();
      }
    });

    // Item options
    document.addEventListener('click', (e) => {
      const optionsBtn = e.target.closest('[data-item-options]');
      if (optionsBtn) {
        e.preventDefault();
        e.stopPropagation();
        this.showItemOptions(optionsBtn.dataset.itemOptions);
      }
    });

    // Navigation item clicks
    document.addEventListener('click', (e) => {
      const navItem = e.target.closest('.mobile-nav-item');
      if (navItem && !navItem.classList.contains('disabled')) {
        this.addToRecentPages(navItem);
        this.close();
      }
    });
  }

  /**
   * Open mobile navigation
   */
  open() {
    this.isOpen = true;
    const overlay = document.querySelector('.mobile-nav-overlay');
    const toggle = document.querySelector('[data-mobile-toggle]');
    
    if (overlay) {
      overlay.classList.add('active');
      overlay.setAttribute('aria-hidden', 'false');
    }
    
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'true');
      toggle.classList.add('active');
    }
    
    document.body.classList.add('mobile-nav-open');
    
    // Focus first focusable element
    setTimeout(() => {
      const firstFocusable = overlay?.querySelector('button, a, [tabindex]');
      firstFocusable?.focus();
    }, 100);
  }

  /**
   * Close mobile navigation
   */
  close() {
    this.isOpen = false;
    const overlay = document.querySelector('.mobile-nav-overlay');
    const toggle = document.querySelector('[data-mobile-toggle]');
    
    if (overlay) {
      overlay.classList.remove('active');
      overlay.setAttribute('aria-hidden', 'true');
    }
    
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.classList.remove('active');
    }
    
    document.body.classList.remove('mobile-nav-open');
  }

  /**
   * Execute quick action
   */
  async executeQuickAction(actionId) {
    switch (actionId) {
      case 'add-transaction':
        this.showAddTransactionModal();
        break;
      case 'view-balance':
        this.showQuickBalance();
        break;
      case 'scan-receipt':
        this.startReceiptScan();
        break;
      case 'ai-insights':
        this.showAIInsights();
        break;
      case 'quick-budget':
        this.showBudgetSummary();
        break;
      case 'emergency-mode':
        this.activateEmergencyMode();
        break;
      default:
        console.warn('Unknown quick action:', actionId);
    }
    
    this.close();
  }

  /**
   * Show quick balance overlay
   */
  showQuickBalance() {
    const balanceData = window.accountManager?.getQuickBalance();
    if (!balanceData) return;

    const modal = document.createElement('div');
    modal.className = 'quick-balance-modal glass-intense';
    modal.innerHTML = `
      <div class="quick-balance-content">
        <h3>Quick Balance</h3>
        <div class="balance-summary">
          <div class="balance-item">
            <span class="balance-label">Total</span>
            <span class="balance-amount financial-amount">${balanceData.total}</span>
          </div>
          <div class="balance-item">
            <span class="balance-label">Available</span>
            <span class="balance-amount financial-amount">${balanceData.available}</span>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="this.parentElement.parentElement.remove()">
          Close
        </button>
      </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.remove(), 5000);
  }

  /**
   * Start receipt scanning
   */
  async startReceiptScan() {
    if (!navigator.mediaDevices) {
      alert('Camera not available on this device');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Implement receipt scanning logic
      window.dispatchEvent(new CustomEvent('startReceiptScan', { detail: { stream } }));
    } catch (error) {
      console.error('Camera access failed:', error);
      alert('Unable to access camera');
    }
  }

  /**
   * Show navigation item options
   */
  showNavItemOptions(item) {
    const path = item.dataset.navLink;
    const options = [
      { label: 'Open', action: () => window.location.href = path },
      { label: 'Open in New Tab', action: () => window.open(path, '_blank') },
      { label: 'Add to Shortcuts', action: () => this.addToShortcuts(path) },
      { label: 'Pin to Quick Actions', action: () => this.pinToQuickActions(path) }
    ];

    this.showContextMenu(options);
  }

  /**
   * Show context menu
   */
  showContextMenu(options) {
    const existing = document.querySelector('.mobile-context-menu');
    if (existing) existing.remove();

    const menu = document.createElement('div');
    menu.className = 'mobile-context-menu glass-intense';
    menu.innerHTML = `
      <div class="context-menu-content">
        ${options.map(option => `
          <button class="context-menu-item" data-action="${option.label}">
            ${option.label}
          </button>
        `).join('')}
      </div>
    `;

    document.body.appendChild(menu);
    
    // Handle option selection
    menu.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      const option = options.find(opt => opt.label === action);
      if (option) {
        option.action();
      }
      menu.remove();
    });

    // Auto-close after 3 seconds
    setTimeout(() => menu.remove(), 3000);
  }

  /**
   * Add page to recent pages
   */
  addToRecentPages(navItem) {
    const path = navItem.dataset.navLink;
    const title = navItem.querySelector('.mobile-item-title')?.textContent || 'Unknown Page';
    const icon = navItem.querySelector('.item-icon')?.textContent || '📄';

    this.recentPages = this.recentPages.filter(page => page.path !== path);
    this.recentPages.unshift({
      path,
      title,
      icon,
      timestamp: Date.now()
    });

    // Keep only last 10 pages
    this.recentPages = this.recentPages.slice(0, 10);
    this.saveRecentPages();
  }

  /**
   * Clear recent pages
   */
  clearRecentPages() {
    this.recentPages = [];
    this.saveRecentPages();
    this.render();
  }

  /**
   * Save recent pages to storage
   */
  async saveRecentPages() {
    try {
      if (window.userManager) {
        await window.userManager.updatePreference('recentPages', this.recentPages);
      }
    } catch (error) {
      console.error('Failed to save recent pages:', error);
    }
  }

  /**
   * Get user initials for avatar
   */
  getUserInitials(user) {
    if (!user) return 'U';
    
    const name = user.name || user.email;
    return name.split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  /**
   * Get sync status icon
   */
  getSyncIcon(status) {
    const icons = {
      synced: '✅',
      syncing: '🔄',
      offline: '📱',
      error: '⚠️'
    };
    return icons[status] || icons.offline;
  }

  /**
   * Get sync status text
   */
  getSyncText(status) {
    const texts = {
      synced: 'All synced',
      syncing: 'Syncing...',
      offline: 'Offline mode',
      error: 'Sync error'
    };
    return texts[status] || texts.offline;
  }

  /**
   * Format relative time
   */
  formatRelativeTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  }

  /**
   * Keyboard navigation
   */
  navigateUp() {
    const items = document.querySelectorAll('.mobile-nav-item:not(.disabled)');
    const current = document.activeElement;
    const currentIndex = Array.from(items).indexOf(current);
    
    if (currentIndex > 0) {
      items[currentIndex - 1].focus();
    }
  }

  navigateDown() {
    const items = document.querySelectorAll('.mobile-nav-item:not(.disabled)');
    const current = document.activeElement;
    const currentIndex = Array.from(items).indexOf(current);
    
    if (currentIndex < items.length - 1) {
      items[currentIndex + 1].focus();
    }
  }

  activateSelected() {
    const focused = document.activeElement;
    if (focused && focused.classList.contains('mobile-nav-item')) {
      focused.click();
    }
  }
}

// Initialize mobile navigation
document.addEventListener('DOMContentLoaded', () => {
  if (window.innerWidth <= 768) {
    window.mobileNavigation = new MobileNavigation();
  }
});

// Re-initialize on window resize
window.addEventListener('resize', () => {
  if (window.innerWidth <= 768 && !window.mobileNavigation) {
    window.mobileNavigation = new MobileNavigation();
  }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileNavigation;
}