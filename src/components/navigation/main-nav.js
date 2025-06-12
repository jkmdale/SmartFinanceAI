/**
 * SmartFinanceAI - Main Navigation Component
 * Global SaaS Platform File: src/components/navigation/main-nav.js
 * 
 * Premium glassmorphism navigation with multi-country support
 * Features: Biometric auth, privacy mode, subscription tiers, real-time sync
 */

class MainNavigation {
  constructor() {
    this.currentUser = null;
    this.privacyMode = false;
    this.syncStatus = 'synced'; // synced, syncing, offline, error
    this.subscriptionTier = 'free'; // free, premium, professional
    this.unreadNotifications = 0;
    this.currentPath = window.location.pathname;
    
    this.init();
  }

  /**
   * Initialize navigation system
   */
  async init() {
    await this.loadUserSession();
    this.setupEventListeners();
    this.render();
    this.startSyncStatusMonitor();
  }

  /**
   * Load current user session and preferences
   */
  async loadUserSession() {
    try {
      const session = await window.authManager?.getCurrentSession();
      if (session) {
        this.currentUser = session.user;
        this.subscriptionTier = session.subscriptionTier || 'free';
        this.privacyMode = session.preferences?.privacyMode || false;
      }
    } catch (error) {
      console.error('Failed to load user session:', error);
    }
  }

  /**
   * Setup event listeners for navigation interactions
   */
  setupEventListeners() {
    // Navigation link clicks
    document.addEventListener('click', (e) => {
      const navLink = e.target.closest('[data-nav-link]');
      if (navLink) {
        e.preventDefault();
        this.handleNavigation(navLink.dataset.navLink, navLink.dataset.navSection);
      }
    });

    // Privacy mode toggle
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-privacy-toggle]')) {
        this.togglePrivacyMode();
      }
    });

    // User menu toggle
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-user-menu-toggle]')) {
        this.toggleUserMenu();
      }
    });

    // Mobile menu toggle
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-mobile-toggle]')) {
        this.toggleMobileMenu();
      }
    });

    // Close menus when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.user-menu') && !e.target.closest('[data-user-menu-toggle]')) {
        this.closeUserMenu();
      }
      if (!e.target.closest('.mobile-nav') && !e.target.closest('[data-mobile-toggle]')) {
        this.closeMobileMenu();
      }
    });

    // Listen for route changes
    window.addEventListener('popstate', () => {
      this.currentPath = window.location.pathname;
      this.updateActiveStates();
    });

    // Listen for sync status changes
    document.addEventListener('syncStatusChanged', (e) => {
      this.syncStatus = e.detail.status;
      this.updateSyncIndicator();
    });

    // Listen for notification updates
    document.addEventListener('notificationsUpdated', (e) => {
      this.unreadNotifications = e.detail.count;
      this.updateNotificationBadge();
    });
  }

  /**
   * Render the complete navigation system
   */
  render() {
    const navContainer = document.getElementById('main-navigation');
    if (!navContainer) return;

    navContainer.innerHTML = this.generateNavHTML();
    this.updateActiveStates();
    this.updateSyncIndicator();
    this.updateNotificationBadge();
  }

  /**
   * Generate complete navigation HTML
   */
  generateNavHTML() {
    return `
      <nav class="navbar glass" role="navigation" aria-label="Main navigation">
        <div class="navbar-container">
          <!-- Brand Logo -->
          <div class="navbar-brand">
            <a href="/dashboard" class="brand-link" data-nav-link="/dashboard" data-nav-section="core">
              <div class="navbar-logo" aria-label="SmartFinanceAI">
                <span class="logo-icon">💰</span>
              </div>
              <span class="brand-text">SmartFinanceAI</span>
              ${this.renderSubscriptionBadge()}
            </a>
          </div>

          <!-- Desktop Navigation Links -->
          <div class="navbar-nav desktop-nav" role="menubar">
            ${this.renderNavigationLinks()}
          </div>

          <!-- Right Side Controls -->
          <div class="navbar-controls">
            ${this.renderSyncIndicator()}
            ${this.renderPrivacyToggle()}
            ${this.renderNotifications()}
            ${this.renderUserMenu()}
            ${this.renderMobileToggle()}
          </div>
        </div>

        <!-- Mobile Navigation (Hidden by default) -->
        <div class="mobile-nav" id="mobile-navigation" role="menu" aria-hidden="true">
          <div class="mobile-nav-content glass-intense">
            ${this.renderMobileNavigationLinks()}
            ${this.renderMobileUserSection()}
          </div>
        </div>
      </nav>
    `;
  }

  /**
   * Render subscription tier badge
   */
  renderSubscriptionBadge() {
    if (this.subscriptionTier === 'free') return '';
    
    const badges = {
      premium: { text: 'PRO', class: 'badge-premium', gradient: 'var(--gradient-primary)' },
      professional: { text: 'BIZ', class: 'badge-professional', gradient: 'var(--gradient-success)' }
    };

    const badge = badges[this.subscriptionTier];
    if (!badge) return '';

    return `
      <span class="subscription-badge ${badge.class}" style="background: ${badge.gradient}">
        ${badge.text}
      </span>
    `;
  }

  /**
   * Render main navigation links
   */
  renderNavigationLinks() {
    const navItems = this.getNavigationItems();
    
    return navItems.map(item => {
      const isActive = this.isActiveRoute(item.path);
      const isDisabled = item.tier && !this.hasAccess(item.tier);
      
      return `
        <div class="nav-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}" role="menuitem">
          <a href="${item.path}" 
             class="nav-link ${isActive ? 'active' : ''}" 
             data-nav-link="${item.path}" 
             data-nav-section="${item.section}"
             aria-current="${isActive ? 'page' : 'false'}"
             ${isDisabled ? 'aria-disabled="true" tabindex="-1"' : ''}>
            <span class="nav-icon" aria-hidden="true">${item.icon}</span>
            <span class="nav-text">${item.label}</span>
            ${item.tier ? this.renderTierIndicator(item.tier) : ''}
            ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
          </a>
          ${isDisabled ? this.renderUpgradeTooltip(item.tier) : ''}
        </div>
      `;
    }).join('');
  }

  /**
   * Get navigation items based on user's access level
   */
  getNavigationItems() {
    return [
      {
        path: '/dashboard',
        section: 'core',
        icon: '📊',
        label: 'Dashboard',
        description: 'Financial overview and insights'
      },
      {
        path: '/accounts',
        section: 'core',
        icon: '🏦',
        label: 'Accounts',
        description: 'Manage bank accounts and balances'
      },
      {
        path: '/transactions',
        section: 'core',
        icon: '💳',
        label: 'Transactions',
        description: 'View and categorize transactions'
      },
      {
        path: '/budget',
        section: 'core',
        icon: '📋',
        label: 'Budget',
        description: 'Budget planning and tracking'
      },
      {
        path: '/goals',
        section: 'core',
        icon: '🎯',
        label: 'Goals',
        description: 'Financial goals and progress'
      },
      {
        path: '/csv-import',
        section: 'tools',
        icon: '📤',
        label: 'Import',
        description: 'Import bank statements',
        tier: 'premium'
      },
      {
        path: '/ai-coach',
        section: 'ai',
        icon: '🤖',
        label: 'AI Coach',
        description: 'Personalized financial advice',
        tier: 'premium'
      },
      {
        path: '/reports',
        section: 'analytics',
        icon: '📈',
        label: 'Reports',
        description: 'Advanced financial analytics',
        tier: 'professional'
      },
      {
        path: '/investments',
        section: 'advanced',
        icon: '💹',
        label: 'Investments',
        description: 'Portfolio tracking and analysis',
        tier: 'professional'
      }
    ].filter(item => !item.tier || this.hasAccess(item.tier));
  }

  /**
   * Render sync status indicator
   */
  renderSyncIndicator() {
    const syncStates = {
      synced: { icon: '✅', class: 'sync-success', text: 'Synced' },
      syncing: { icon: '🔄', class: 'sync-progress', text: 'Syncing...' },
      offline: { icon: '📱', class: 'sync-offline', text: 'Offline' },
      error: { icon: '⚠️', class: 'sync-error', text: 'Sync Error' }
    };

    const state = syncStates[this.syncStatus] || syncStates.offline;

    return `
      <div class="sync-indicator ${state.class}" 
           title="${state.text}" 
           aria-label="Sync status: ${state.text}">
        <span class="sync-icon ${this.syncStatus === 'syncing' ? 'spinning' : ''}">${state.icon}</span>
        <span class="sync-text sr-only">${state.text}</span>
      </div>
    `;
  }

  /**
   * Render privacy mode toggle
   */
  renderPrivacyToggle() {
    return `
      <button class="privacy-toggle ${this.privacyMode ? 'active' : ''}" 
              data-privacy-toggle
              title="${this.privacyMode ? 'Disable' : 'Enable'} privacy mode"
              aria-label="${this.privacyMode ? 'Disable' : 'Enable'} privacy mode"
              aria-pressed="${this.privacyMode}">
        <span class="privacy-icon">${this.privacyMode ? '🔒' : '👁️'}</span>
        <span class="privacy-text sr-only">
          ${this.privacyMode ? 'Privacy On' : 'Privacy Off'}
        </span>
      </button>
    `;
  }

  /**
   * Render notifications bell
   */
  renderNotifications() {
    return `
      <div class="notifications-container">
        <button class="notifications-toggle" 
                data-notifications-toggle
                title="View notifications"
                aria-label="Notifications${this.unreadNotifications ? ` (${this.unreadNotifications} unread)` : ''}"
                aria-expanded="false">
          <span class="notification-icon">🔔</span>
          ${this.unreadNotifications > 0 ? `
            <span class="notification-badge" aria-label="${this.unreadNotifications} unread notifications">
              ${this.unreadNotifications > 99 ? '99+' : this.unreadNotifications}
            </span>
          ` : ''}
        </button>
      </div>
    `;
  }

  /**
   * Render user menu dropdown
   */
  renderUserMenu() {
    if (!this.currentUser) {
      return `
        <div class="auth-buttons">
          <a href="/auth/login" class="btn btn-ghost btn-sm">Sign In</a>
          <a href="/auth/register" class="btn btn-primary btn-sm">Get Started</a>
        </div>
      `;
    }

    return `
      <div class="user-menu-container">
        <button class="user-menu-toggle" 
                data-user-menu-toggle
                aria-expanded="false"
                aria-haspopup="true"
                aria-label="User menu">
          <div class="user-avatar">
            ${this.currentUser.avatar ? 
              `<img src="${this.currentUser.avatar}" alt="${this.currentUser.name}" />` :
              `<span class="avatar-initials">${this.getUserInitials()}</span>`
            }
          </div>
          <span class="user-name">${this.currentUser.name || this.currentUser.email}</span>
          <span class="dropdown-arrow">▼</span>
        </button>

        <div class="user-menu glass-intense" role="menu" aria-hidden="true">
          ${this.renderUserMenuItems()}
        </div>
      </div>
    `;
  }

  /**
   * Render user menu items
   */
  renderUserMenuItems() {
    const menuItems = [
      { icon: '👤', label: 'Profile', action: 'profile' },
      { icon: '⚙️', label: 'Settings', action: 'settings' },
      { icon: '💳', label: 'Subscription', action: 'subscription' },
      { icon: '📊', label: 'Usage', action: 'usage' },
      { icon: '❓', label: 'Help & Support', action: 'help' },
      { type: 'divider' },
      { icon: '🚪', label: 'Sign Out', action: 'logout', class: 'danger' }
    ];

    return menuItems.map(item => {
      if (item.type === 'divider') {
        return '<div class="menu-divider"></div>';
      }

      return `
        <button class="menu-item ${item.class || ''}" 
                data-user-action="${item.action}"
                role="menuitem">
          <span class="menu-icon">${item.icon}</span>
          <span class="menu-label">${item.label}</span>
        </button>
      `;
    }).join('');
  }

  /**
   * Render mobile menu toggle
   */
  renderMobileToggle() {
    return `
      <button class="mobile-nav-toggle" 
              data-mobile-toggle
              aria-expanded="false"
              aria-controls="mobile-navigation"
              aria-label="Toggle mobile menu">
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>
    `;
  }

  /**
   * Render mobile navigation links
   */
  renderMobileNavigationLinks() {
    const navItems = this.getNavigationItems();
    
    return `
      <div class="mobile-nav-section">
        <h3 class="mobile-nav-title">Navigation</h3>
        <div class="mobile-nav-items">
          ${navItems.map(item => `
            <a href="${item.path}" 
               class="mobile-nav-link ${this.isActiveRoute(item.path) ? 'active' : ''}"
               data-nav-link="${item.path}"
               data-nav-section="${item.section}">
              <span class="mobile-nav-icon">${item.icon}</span>
              <div class="mobile-nav-content">
                <span class="mobile-nav-label">${item.label}</span>
                <span class="mobile-nav-description">${item.description}</span>
              </div>
              ${item.tier ? this.renderTierIndicator(item.tier) : ''}
            </a>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render mobile user section
   */
  renderMobileUserSection() {
    if (!this.currentUser) {
      return `
        <div class="mobile-auth-section">
          <a href="/auth/login" class="btn btn-ghost btn-lg mobile-auth-btn">Sign In</a>
          <a href="/auth/register" class="btn btn-primary btn-lg mobile-auth-btn">Get Started</a>
        </div>
      `;
    }

    return `
      <div class="mobile-user-section">
        <div class="mobile-user-info">
          <div class="mobile-user-avatar">
            ${this.currentUser.avatar ? 
              `<img src="${this.currentUser.avatar}" alt="${this.currentUser.name}" />` :
              `<span class="avatar-initials">${this.getUserInitials()}</span>`
            }
          </div>
          <div class="mobile-user-details">
            <div class="mobile-user-name">${this.currentUser.name || this.currentUser.email}</div>
            <div class="mobile-user-tier">${this.subscriptionTier.charAt(0).toUpperCase() + this.subscriptionTier.slice(1)} Plan</div>
          </div>
        </div>
        
        <div class="mobile-user-actions">
          <button class="mobile-action-btn" data-user-action="settings">
            <span>⚙️</span> Settings
          </button>
          <button class="mobile-action-btn" data-user-action="subscription">
            <span>💳</span> Subscription
          </button>
          <button class="mobile-action-btn danger" data-user-action="logout">
            <span>🚪</span> Sign Out
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Handle navigation between sections
   */
  async handleNavigation(path, section) {
    // Check if user has access to this section
    const navItem = this.getNavigationItems().find(item => item.path === path);
    if (navItem && navItem.tier && !this.hasAccess(navItem.tier)) {
      this.showUpgradeModal(navItem.tier);
      return;
    }

    // Close mobile menu if open
    this.closeMobileMenu();

    // Navigate to the route
    try {
      history.pushState({}, '', path);
      this.currentPath = path;
      this.updateActiveStates();
      
      // Trigger route change event
      window.dispatchEvent(new CustomEvent('routeChanged', {
        detail: { path, section }
      }));
    } catch (error) {
      console.error('Navigation failed:', error);
    }
  }

  /**
   * Toggle privacy mode
   */
  togglePrivacyMode() {
    this.privacyMode = !this.privacyMode;
    
    // Update UI
    const toggle = document.querySelector('[data-privacy-toggle]');
    if (toggle) {
      toggle.classList.toggle('active', this.privacyMode);
      toggle.setAttribute('aria-pressed', this.privacyMode);
      toggle.title = `${this.privacyMode ? 'Disable' : 'Enable'} privacy mode`;
    }

    // Save preference
    this.saveUserPreference('privacyMode', this.privacyMode);

    // Dispatch privacy mode change event
    window.dispatchEvent(new CustomEvent('privacyModeChanged', {
      detail: { enabled: this.privacyMode }
    }));
  }

  /**
   * Toggle user menu dropdown
   */
  toggleUserMenu() {
    const menu = document.querySelector('.user-menu');
    const toggle = document.querySelector('[data-user-menu-toggle]');
    
    if (menu && toggle) {
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
      
      toggle.setAttribute('aria-expanded', !isExpanded);
      menu.setAttribute('aria-hidden', isExpanded);
      menu.classList.toggle('active', !isExpanded);
    }
  }

  /**
   * Close user menu
   */
  closeUserMenu() {
    const menu = document.querySelector('.user-menu');
    const toggle = document.querySelector('[data-user-menu-toggle]');
    
    if (menu && toggle) {
      toggle.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
      menu.classList.remove('active');
    }
  }

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu() {
    const mobileNav = document.getElementById('mobile-navigation');
    const toggle = document.querySelector('[data-mobile-toggle]');
    
    if (mobileNav && toggle) {
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
      
      toggle.setAttribute('aria-expanded', !isExpanded);
      mobileNav.setAttribute('aria-hidden', isExpanded);
      mobileNav.classList.toggle('active', !isExpanded);
      
      // Prevent body scroll when menu is open
      document.body.classList.toggle('mobile-menu-open', !isExpanded);
    }
  }

  /**
   * Close mobile menu
   */
  closeMobileMenu() {
    const mobileNav = document.getElementById('mobile-navigation');
    const toggle = document.querySelector('[data-mobile-toggle]');
    
    if (mobileNav && toggle) {
      toggle.setAttribute('aria-expanded', 'false');
      mobileNav.setAttribute('aria-hidden', 'true');
      mobileNav.classList.remove('active');
      document.body.classList.remove('mobile-menu-open');
    }
  }

  /**
   * Check if current route is active
   */
  isActiveRoute(path) {
    return this.currentPath === path || 
           (path !== '/dashboard' && this.currentPath.startsWith(path));
  }

  /**
   * Update active states for navigation items
   */
  updateActiveStates() {
    const navLinks = document.querySelectorAll('[data-nav-link]');
    navLinks.forEach(link => {
      const isActive = this.isActiveRoute(link.dataset.navLink);
      link.classList.toggle('active', isActive);
      link.setAttribute('aria-current', isActive ? 'page' : 'false');
      
      const parentItem = link.closest('.nav-item');
      if (parentItem) {
        parentItem.classList.toggle('active', isActive);
      }
    });
  }

  /**
   * Update sync indicator
   */
  updateSyncIndicator() {
    const indicator = document.querySelector('.sync-indicator');
    if (!indicator) return;

    const syncStates = {
      synced: { icon: '✅', class: 'sync-success', text: 'Synced' },
      syncing: { icon: '🔄', class: 'sync-progress', text: 'Syncing...' },
      offline: { icon: '📱', class: 'sync-offline', text: 'Offline' },
      error: { icon: '⚠️', class: 'sync-error', text: 'Sync Error' }
    };

    const state = syncStates[this.syncStatus] || syncStates.offline;
    
    indicator.className = `sync-indicator ${state.class}`;
    indicator.title = state.text;
    indicator.setAttribute('aria-label', `Sync status: ${state.text}`);
    
    const icon = indicator.querySelector('.sync-icon');
    if (icon) {
      icon.textContent = state.icon;
      icon.classList.toggle('spinning', this.syncStatus === 'syncing');
    }
  }

  /**
   * Update notification badge
   */
  updateNotificationBadge() {
    const badge = document.querySelector('.notification-badge');
    const toggle = document.querySelector('[data-notifications-toggle]');
    
    if (this.unreadNotifications > 0) {
      if (badge) {
        badge.textContent = this.unreadNotifications > 99 ? '99+' : this.unreadNotifications;
      }
      if (toggle) {
        toggle.setAttribute('aria-label', `Notifications (${this.unreadNotifications} unread)`);
      }
    } else {
      if (badge) {
        badge.remove();
      }
      if (toggle) {
        toggle.setAttribute('aria-label', 'Notifications');
      }
    }
  }

  /**
   * Check if user has access to specific tier features
   */
  hasAccess(requiredTier) {
    const tierLevels = { free: 0, premium: 1, professional: 2 };
    const userLevel = tierLevels[this.subscriptionTier] || 0;
    const requiredLevel = tierLevels[requiredTier] || 0;
    
    return userLevel >= requiredLevel;
  }

  /**
   * Render tier indicator for premium features
   */
  renderTierIndicator(tier) {
    const indicators = {
      premium: { text: 'PRO', class: 'tier-premium' },
      professional: { text: 'BIZ', class: 'tier-professional' }
    };

    const indicator = indicators[tier];
    if (!indicator) return '';

    return `<span class="tier-indicator ${indicator.class}">${indicator.text}</span>`;
  }

  /**
   * Get user initials for avatar
   */
  getUserInitials() {
    if (!this.currentUser) return 'U';
    
    const name = this.currentUser.name || this.currentUser.email;
    return name.split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  /**
   * Save user preference
   */
  async saveUserPreference(key, value) {
    try {
      if (window.userManager) {
        await window.userManager.updatePreference(key, value);
      }
    } catch (error) {
      console.error('Failed to save user preference:', error);
    }
  }

  /**
   * Start monitoring sync status
   */
  startSyncStatusMonitor() {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.syncStatus = 'syncing';
      this.updateSyncIndicator();
      
      // Trigger sync
      if (window.syncManager) {
        window.syncManager.sync();
      }
    });

    window.addEventListener('offline', () => {
      this.syncStatus = 'offline';
      this.updateSyncIndicator();
    });
  }

  /**
   * Show upgrade modal for premium features
   */
  showUpgradeModal(requiredTier) {
    const event = new CustomEvent('showUpgradeModal', {
      detail: { requiredTier, currentTier: this.subscriptionTier }
    });
    window.dispatchEvent(event);
  }

  /**
   * Render upgrade tooltip for disabled features
   */
  renderUpgradeTooltip(tier) {
    return `
      <div class="upgrade-tooltip">
        <span class="tooltip-text">
          ${tier.charAt(0).toUpperCase() + tier.slice(1)} feature
        </span>
      </div>
    `;
  }
}

// Initialize navigation when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('main-navigation')) {
    window.mainNavigation = new MainNavigation();
  }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MainNavigation;
}