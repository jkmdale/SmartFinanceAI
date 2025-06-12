/**
 * SmartFinanceAI - Account Selector Component
 * Multi-account selection with filtering and search capabilities
 * File: src/components/forms/account-selector.js
 */

class AccountSelector {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.options = {
      multiple: options.multiple || false,
      placeholder: options.placeholder || 'Select account...',
      searchable: options.searchable !== false,
      groupByBank: options.groupByBank || false,
      showBalance: options.showBalance !== false,
      filterTypes: options.filterTypes || [], // ['checking', 'savings', 'credit', 'investment']
      onSelect: options.onSelect || (() => {}),
      onDeselect: options.onDeselect || (() => {}),
      accounts: options.accounts || [],
      selectedIds: options.selectedIds || [],
      currency: options.currency || 'USD',
      privacyMode: options.privacyMode || false
    };
    
    this.selectedAccounts = new Set(this.options.selectedIds);
    this.filteredAccounts = [...this.options.accounts];
    this.isOpen = false;
    
    this.init();
  }

  /**
   * Initialize the account selector
   */
  init() {
    this.render();
    this.attachEventListeners();
    this.updateSelection();
  }

  /**
   * Render the account selector HTML
   */
  render() {
    this.container.innerHTML = `
      <div class="account-selector ${this.options.multiple ? 'multiple' : 'single'}">
        <div class="selector-header" role="button" tabindex="0" aria-haspopup="listbox" aria-expanded="false">
          <div class="selected-display">
            <span class="placeholder">${this.options.placeholder}</span>
            <div class="selected-accounts" style="display: none;"></div>
          </div>
          <div class="selector-icons">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6,9 12,15 18,9"></polyline>
            </svg>
          </div>
        </div>
        
        <div class="selector-dropdown" style="display: none;" role="listbox" aria-multiselectable="${this.options.multiple}">
          ${this.options.searchable ? `
            <div class="search-container">
              <input 
                type="text" 
                class="search-input" 
                placeholder="Search accounts..."
                aria-label="Search accounts"
              />
            </div>
          ` : ''}
          
          ${this.options.filterTypes.length > 0 ? `
            <div class="filter-container">
              <div class="filter-buttons">
                <button class="filter-btn active" data-type="all">All</button>
                ${this.options.filterTypes.map(type => `
                  <button class="filter-btn" data-type="${type}">${this.capitalizeFirst(type)}</button>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          <div class="accounts-list">
            ${this.renderAccountsList()}
          </div>
          
          <div class="no-results" style="display: none;">
            <div class="no-results-icon">🔍</div>
            <div class="no-results-text">No accounts found</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render the accounts list
   */
  renderAccountsList() {
    if (this.filteredAccounts.length === 0) {
      return '<div class="empty-state">No accounts available</div>';
    }

    if (this.options.groupByBank) {
      return this.renderGroupedAccounts();
    } else {
      return this.renderFlatAccounts();
    }
  }

  /**
   * Render accounts grouped by bank
   */
  renderGroupedAccounts() {
    const groupedAccounts = this.groupAccountsByBank(this.filteredAccounts);
    
    return Object.entries(groupedAccounts).map(([bankName, accounts]) => `
      <div class="account-group">
        <div class="group-header">
          <img src="/banks/${bankName.toLowerCase().replace(/\s+/g, '-')}.png" 
               alt="${bankName}" 
               class="bank-logo"
               onerror="this.style.display='none'">
          <span class="bank-name">${bankName}</span>
          <span class="account-count">(${accounts.length})</span>
        </div>
        <div class="group-accounts">
          ${accounts.map(account => this.renderAccountItem(account)).join('')}
        </div>
      </div>
    `).join('');
  }

  /**
   * Render accounts in flat list
   */
  renderFlatAccounts() {
    return this.filteredAccounts.map(account => this.renderAccountItem(account)).join('');
  }

  /**
   * Render individual account item
   */
  renderAccountItem(account) {
    const isSelected = this.selectedAccounts.has(account.id);
    const balance = this.options.privacyMode ? '••••••' : this.formatCurrency(account.balance);
    const accountType = this.getAccountTypeInfo(account.type);
    
    return `
      <div class="account-item ${isSelected ? 'selected' : ''}" 
           data-account-id="${account.id}"
           role="option"
           aria-selected="${isSelected}"
           tabindex="0">
        <div class="account-content">
          <div class="account-main">
            <div class="account-icon ${accountType.class}">
              ${accountType.icon}
            </div>
            <div class="account-info">
              <div class="account-name">${account.name}</div>
              <div class="account-details">
                <span class="account-type">${account.type}</span>
                ${account.bankName ? `<span class="account-bank">• ${account.bankName}</span>` : ''}
                ${account.accountNumber ? `<span class="account-number">•••${account.accountNumber.slice(-4)}</span>` : ''}
              </div>
            </div>
          </div>
          
          ${this.options.showBalance ? `
            <div class="account-balance">
              <span class="balance-amount ${account.balance < 0 ? 'negative' : ''}">${balance}</span>
              <span class="balance-currency">${account.currency || this.options.currency}</span>
            </div>
          ` : ''}
          
          <div class="selection-indicator">
            ${this.options.multiple ? `
              <div class="checkbox ${isSelected ? 'checked' : ''}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
              </div>
            ` : `
              <div class="radio ${isSelected ? 'selected' : ''}">
                <div class="radio-dot"></div>
              </div>
            `}
          </div>
        </div>
        
        ${account.status && account.status !== 'active' ? `
          <div class="account-status ${account.status}">
            ${this.getStatusLabel(account.status)}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    const header = this.container.querySelector('.selector-header');
    const dropdown = this.container.querySelector('.selector-dropdown');
    const searchInput = this.container.querySelector('.search-input');
    const filterButtons = this.container.querySelectorAll('.filter-btn');

    // Header click to toggle dropdown
    header.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown();
    });

    // Header keyboard navigation
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggleDropdown();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.openDropdown();
        this.focusFirstAccount();
      }
    });

    // Search input
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.handleSearch(e.target.value);
      });

      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.focusFirstAccount();
        } else if (e.key === 'Escape') {
          this.closeDropdown();
        }
      });
    }

    // Filter buttons
    filterButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleFilter(e.target.dataset.type);
      });
    });

    // Account selection
    dropdown.addEventListener('click', (e) => {
      const accountItem = e.target.closest('.account-item');
      if (accountItem) {
        e.stopPropagation();
        this.selectAccount(accountItem.dataset.accountId);
      }
    });

    // Account keyboard navigation
    dropdown.addEventListener('keydown', (e) => {
      this.handleKeyboardNavigation(e);
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.closeDropdown();
      }
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeDropdown();
      }
    });
  }

  /**
   * Toggle dropdown visibility
   */
  toggleDropdown() {
    if (this.isOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  /**
   * Open dropdown
   */
  openDropdown() {
    const header = this.container.querySelector('.selector-header');
    const dropdown = this.container.querySelector('.selector-dropdown');
    
    dropdown.style.display = 'block';
    header.setAttribute('aria-expanded', 'true');
    this.isOpen = true;

    // Focus search input if available
    const searchInput = this.container.querySelector('.search-input');
    if (searchInput) {
      setTimeout(() => searchInput.focus(), 100);
    }
  }

  /**
   * Close dropdown
   */
  closeDropdown() {
    const header = this.container.querySelector('.selector-header');
    const dropdown = this.container.querySelector('.selector-dropdown');
    
    dropdown.style.display = 'none';
    header.setAttribute('aria-expanded', 'false');
    this.isOpen = false;

    // Clear search
    const searchInput = this.container.querySelector('.search-input');
    if (searchInput) {
      searchInput.value = '';
      this.handleSearch('');
    }
  }

  /**
   * Handle search functionality
   */
  handleSearch(query) {
    const normalizedQuery = query.toLowerCase().trim();
    
    if (!normalizedQuery) {
      this.filteredAccounts = [...this.options.accounts];
    } else {
      this.filteredAccounts = this.options.accounts.filter(account => 
        account.name.toLowerCase().includes(normalizedQuery) ||
        account.bankName?.toLowerCase().includes(normalizedQuery) ||
        account.type.toLowerCase().includes(normalizedQuery) ||
        account.accountNumber?.includes(normalizedQuery)
      );
    }

    this.updateAccountsList();
  }

  /**
   * Handle filter functionality
   */
  handleFilter(type) {
    // Update filter button states
    const filterButtons = this.container.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.type === type);
    });

    // Filter accounts
    if (type === 'all') {
      this.filteredAccounts = [...this.options.accounts];
    } else {
      this.filteredAccounts = this.options.accounts.filter(account => 
        account.type.toLowerCase() === type.toLowerCase()
      );
    }

    this.updateAccountsList();
  }

  /**
   * Update accounts list display
   */
  updateAccountsList() {
    const accountsList = this.container.querySelector('.accounts-list');
    const noResults = this.container.querySelector('.no-results');
    
    if (this.filteredAccounts.length === 0) {
      accountsList.style.display = 'none';
      noResults.style.display = 'block';
    } else {
      accountsList.style.display = 'block';
      noResults.style.display = 'none';
      accountsList.innerHTML = this.renderAccountsList();
    }
  }

  /**
   * Select/deselect account
   */
  selectAccount(accountId) {
    const account = this.options.accounts.find(acc => acc.id === accountId);
    if (!account) return;

    if (this.options.multiple) {
      if (this.selectedAccounts.has(accountId)) {
        this.selectedAccounts.delete(accountId);
        this.options.onDeselect(account);
      } else {
        this.selectedAccounts.add(accountId);
        this.options.onSelect(account);
      }
    } else {
      // Single selection
      if (this.selectedAccounts.has(accountId)) {
        this.selectedAccounts.clear();
        this.options.onDeselect(account);
      } else {
        this.selectedAccounts.clear();
        this.selectedAccounts.add(accountId);
        this.options.onSelect(account);
        this.closeDropdown();
      }
    }

    this.updateSelection();
    this.updateAccountsList(); // Refresh to show selection state
  }

  /**
   * Update selection display
   */
  updateSelection() {
    const placeholder = this.container.querySelector('.placeholder');
    const selectedDisplay = this.container.querySelector('.selected-accounts');
    
    if (this.selectedAccounts.size === 0) {
      placeholder.style.display = 'block';
      selectedDisplay.style.display = 'none';
    } else {
      placeholder.style.display = 'none';
      selectedDisplay.style.display = 'block';
      
      const selectedAccountsData = Array.from(this.selectedAccounts).map(id => 
        this.options.accounts.find(acc => acc.id === id)
      ).filter(Boolean);
      
      selectedDisplay.innerHTML = this.renderSelectedAccounts(selectedAccountsData);
    }
  }

  /**
   * Render selected accounts display
   */
  renderSelectedAccounts(accounts) {
    if (this.options.multiple) {
      if (accounts.length === 1) {
        return `<span class="selected-single">${accounts[0].name}</span>`;
      } else {
        return `<span class="selected-multiple">${accounts.length} accounts selected</span>`;
      }
    } else {
      return accounts.length > 0 ? `<span class="selected-single">${accounts[0].name}</span>` : '';
    }
  }

  /**
   * Handle keyboard navigation
   */
  handleKeyboardNavigation(e) {
    const focusableItems = this.container.querySelectorAll('.account-item');
    const currentFocus = this.container.querySelector('.account-item:focus');
    let currentIndex = Array.from(focusableItems).indexOf(currentFocus);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        currentIndex = Math.min(currentIndex + 1, focusableItems.length - 1);
        focusableItems[currentIndex]?.focus();
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        currentIndex = Math.max(currentIndex - 1, 0);
        focusableItems[currentIndex]?.focus();
        break;
        
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (currentFocus) {
          this.selectAccount(currentFocus.dataset.accountId);
        }
        break;
        
      case 'Escape':
        this.closeDropdown();
        break;
    }
  }

  /**
   * Focus first account in list
   */
  focusFirstAccount() {
    const firstAccount = this.container.querySelector('.account-item');
    if (firstAccount) {
      firstAccount.focus();
    }
  }

  /**
   * Group accounts by bank
   */
  groupAccountsByBank(accounts) {
    return accounts.reduce((groups, account) => {
      const bankName = account.bankName || 'Other';
      if (!groups[bankName]) {
        groups[bankName] = [];
      }
      groups[bankName].push(account);
      return groups;
    }, {});
  }

  /**
   * Get account type information
   */
  getAccountTypeInfo(type) {
    const types = {
      checking: { icon: '💳', class: 'checking' },
      savings: { icon: '💰', class: 'savings' },
      credit: { icon: '💳', class: 'credit' },
      investment: { icon: '📈', class: 'investment' },
      loan: { icon: '🏠', class: 'loan' },
      other: { icon: '📋', class: 'other' }
    };
    
    return types[type.toLowerCase()] || types.other;
  }

  /**
   * Get status label
   */
  getStatusLabel(status) {
    const labels = {
      inactive: 'Inactive',
      frozen: 'Frozen',
      closed: 'Closed',
      pending: 'Pending'
    };
    
    return labels[status] || status;
  }

  /**
   * Format currency
   */
  formatCurrency(amount, currency = this.options.currency) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Capitalize first letter
   */
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Get selected accounts
   */
  getSelectedAccounts() {
    return Array.from(this.selectedAccounts).map(id => 
      this.options.accounts.find(acc => acc.id === id)
    ).filter(Boolean);
  }

  /**
   * Set selected accounts programmatically
   */
  setSelectedAccounts(accountIds) {
    this.selectedAccounts = new Set(accountIds);
    this.updateSelection();
    this.updateAccountsList();
  }

  /**
   * Update accounts data
   */
  updateAccounts(accounts) {
    this.options.accounts = accounts;
    this.filteredAccounts = [...accounts];
    this.updateAccountsList();
    this.updateSelection();
  }

  /**
   * Destroy the component
   */
  destroy() {
    // Remove event listeners and clear container
    this.container.innerHTML = '';
  }
}

// Export the AccountSelector class
export default AccountSelector;