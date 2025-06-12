/**
 * SmartFinanceAI - Confirmation Dialog Component
 * Flexible confirmation dialogs with customizable actions and styling
 * File: src/components/modals/confirm-dialog.js
 */

class ConfirmDialog {
  constructor(options = {}) {
    this.options = {
      title: options.title || 'Confirm Action',
      message: options.message || 'Are you sure you want to proceed?',
      type: options.type || 'default', // 'default', 'danger', 'warning', 'success', 'info'
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      showCancel: options.showCancel !== false,
      confirmButton: options.confirmButton || 'primary',
      cancelButton: options.cancelButton || 'secondary',
      persistent: options.persistent || false, // Can't close by clicking outside
      focusCancel: options.focusCancel || false, // Focus cancel button by default
      requireConfirmation: options.requireConfirmation || false, // Require typing confirmation
      confirmationText: options.confirmationText || 'DELETE',
      width: options.width || '400px',
      maxWidth: options.maxWidth || '90vw',
      icon: options.icon || null,
      details: options.details || null, // Additional details text
      onConfirm: options.onConfirm || (() => {}),
      onCancel: options.onCancel || (() => {}),
      onClose: options.onClose || (() => {})
    };

    this.isOpen = false;
    this.overlay = null;
    this.dialog = null;
    this.confirmInput = null;
    
    // Bind methods
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleOverlayClick = this.handleOverlayClick.bind(this);
  }

  /**
   * Show the confirmation dialog
   */
  show() {
    if (this.isOpen) return;
    
    this.create();
    this.mount();
    this.setupEventListeners();
    this.setInitialFocus();
    
    this.isOpen = true;
    
    // Add to document body
    document.body.appendChild(this.overlay);
    document.body.style.overflow = 'hidden'; // Prevent background scroll
    
    // Trigger animation
    requestAnimationFrame(() => {
      this.overlay.classList.add('active');
    });
  }

  /**
   * Hide the confirmation dialog
   */
  hide() {
    if (!this.isOpen) return;
    
    this.overlay.classList.remove('active');
    
    // Wait for animation to complete
    setTimeout(() => {
      this.cleanup();
    }, 200);
  }

  /**
   * Create the dialog HTML structure
   */
  create() {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'confirm-dialog-overlay';
    this.overlay.innerHTML = `
      <div class="confirm-dialog ${this.options.type}" 
           style="max-width: ${this.options.maxWidth}; width: ${this.options.width};"
           role="dialog" 
           aria-modal="true" 
           aria-labelledby="dialog-title" 
           aria-describedby="dialog-message">
        
        <div class="dialog-header">
          ${this.options.icon ? `<div class="dialog-icon ${this.options.type}">${this.options.icon}</div>` : ''}
          <h3 class="dialog-title" id="dialog-title">${this.options.title}</h3>
        </div>
        
        <div class="dialog-body">
          <p class="dialog-message" id="dialog-message">${this.options.message}</p>
          
          ${this.options.details ? `
            <div class="dialog-details">
              ${this.options.details}
            </div>
          ` : ''}
          
          ${this.options.requireConfirmation ? `
            <div class="confirmation-input-container">
              <label for="confirmation-input" class="confirmation-label">
                Type <strong>${this.options.confirmationText}</strong> to confirm:
              </label>
              <input 
                type="text" 
                id="confirmation-input" 
                class="confirmation-input" 
                placeholder="${this.options.confirmationText}"
                autocomplete="off"
                spellcheck="false"
              />
            </div>
          ` : ''}
        </div>
        
        <div class="dialog-footer">
          ${this.options.showCancel ? `
            <button type="button" class="dialog-button ${this.options.cancelButton}" data-action="cancel">
              ${this.options.cancelText}
            </button>
          ` : ''}
          <button type="button" class="dialog-button ${this.options.confirmButton}" data-action="confirm" ${this.options.requireConfirmation ? 'disabled' : ''}>
            ${this.options.confirmText}
          </button>
        </div>
      </div>
    `;
    
    this.dialog = this.overlay.querySelector('.confirm-dialog');
    if (this.options.requireConfirmation) {
      this.confirmInput = this.overlay.querySelector('.confirmation-input');
    }
  }

  /**
   * Mount event listeners
   */
  mount() {
    // Button clicks
    this.overlay.addEventListener('click', this.handleButtonClick.bind(this));
    
    // Overlay click (if not persistent)
    if (!this.options.persistent) {
      this.overlay.addEventListener('click', this.handleOverlayClick);
    }
    
    // Keyboard events
    document.addEventListener('keydown', this.handleKeyDown);
    
    // Confirmation input validation
    if (this.confirmInput) {
      this.confirmInput.addEventListener('input', this.handleConfirmationInput.bind(this));
      this.confirmInput.addEventListener('keydown', this.handleConfirmationKeyDown.bind(this));
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Focus trap
    this.dialog.addEventListener('keydown', this.handleFocusTrap.bind(this));
  }

  /**
   * Set initial focus
   */
  setInitialFocus() {
    if (this.options.requireConfirmation) {
      // Focus confirmation input
      this.confirmInput.focus();
    } else if (this.options.focusCancel && this.options.showCancel) {
      // Focus cancel button
      const cancelButton = this.overlay.querySelector('[data-action="cancel"]');
      cancelButton.focus();
    } else {
      // Focus confirm button
      const confirmButton = this.overlay.querySelector('[data-action="confirm"]');
      confirmButton.focus();
    }
  }

  /**
   * Handle button clicks
   */
  handleButtonClick(e) {
    const button = e.target.closest('.dialog-button');
    if (!button) return;
    
    const action = button.dataset.action;
    
    if (action === 'confirm') {
      this.handleConfirm();
    } else if (action === 'cancel') {
      this.handleCancel();
    }
  }

  /**
   * Handle confirm action
   */
  async handleConfirm() {
    // Validate confirmation input if required
    if (this.options.requireConfirmation) {
      const inputValue = this.confirmInput.value.trim();
      if (inputValue !== this.options.confirmationText) {
        this.showInputError('Confirmation text does not match');
        return;
      }
    }
    
    try {
      // Disable buttons while processing
      this.setButtonsDisabled(true);
      
      // Call confirm callback
      const result = await this.options.onConfirm();
      
      // Close dialog if callback didn't return false
      if (result !== false) {
        this.hide();
      }
    } catch (error) {
      console.error('Error in confirm callback:', error);
      this.showError('An error occurred. Please try again.');
    } finally {
      this.setButtonsDisabled(false);
    }
  }

  /**
   * Handle cancel action
   */
  handleCancel() {
    this.options.onCancel();
    this.hide();
  }

  /**
   * Handle overlay click (close dialog if not persistent)
   */
  handleOverlayClick(e) {
    if (e.target === this.overlay) {
      this.handleCancel();
    }
  }

  /**
   * Handle keyboard events
   */
  handleKeyDown(e) {
    if (!this.isOpen) return;
    
    switch (e.key) {
      case 'Escape':
        if (!this.options.persistent) {
          e.preventDefault();
          this.handleCancel();
        }
        break;
        
      case 'Enter':
        if (e.target.classList.contains('confirmation-input')) {
          // Let confirmation input handle its own Enter key
          return;
        }
        if (!this.options.requireConfirmation || this.isConfirmationValid()) {
          e.preventDefault();
          this.handleConfirm();
        }
        break;
    }
  }

  /**
   * Handle confirmation input changes
   */
  handleConfirmationInput(e) {
    const inputValue = e.target.value.trim();
    const confirmButton = this.overlay.querySelector('[data-action="confirm"]');
    const isValid = inputValue === this.options.confirmationText;
    
    confirmButton.disabled = !isValid;
    confirmButton.classList.toggle('disabled', !isValid);
    
    // Clear any previous errors
    this.clearInputError();
  }

  /**
   * Handle confirmation input keyboard events
   */
  handleConfirmationKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (this.isConfirmationValid()) {
        this.handleConfirm();
      } else {
        this.showInputError('Please type the exact confirmation text');
      }
    }
  }

  /**
   * Handle focus trap within dialog
   */
  handleFocusTrap(e) {
    if (e.key !== 'Tab') return;
    
    const focusableElements = this.dialog.querySelectorAll(
      'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey) {
      // Shift + Tab (backward)
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab (forward)
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }

  /**
   * Check if confirmation input is valid
   */
  isConfirmationValid() {
    if (!this.options.requireConfirmation) return true;
    return this.confirmInput.value.trim() === this.options.confirmationText;
  }

  /**
   * Show input error
   */
  showInputError(message) {
    this.clearInputError();
    
    const errorElement = document.createElement('div');
    errorElement.className = 'confirmation-error';
    errorElement.textContent = message;
    
    const container = this.confirmInput.parentElement;
    container.appendChild(errorElement);
    
    this.confirmInput.classList.add('error');
    this.confirmInput.focus();
  }

  /**
   * Clear input error
   */
  clearInputError() {
    const existingError = this.overlay.querySelector('.confirmation-error');
    if (existingError) {
      existingError.remove();
    }
    
    if (this.confirmInput) {
      this.confirmInput.classList.remove('error');
    }
  }

  /**
   * Show general error message
   */
  showError(message) {
    // Remove existing error
    const existingError = this.overlay.querySelector('.dialog-error');
    if (existingError) {
      existingError.remove();
    }
    
    const errorElement = document.createElement('div');
    errorElement.className = 'dialog-error';
    errorElement.innerHTML = `
      <div class="error-icon">⚠️</div>
      <div class="error-message">${message}</div>
    `;
    
    const dialogBody = this.overlay.querySelector('.dialog-body');
    dialogBody.appendChild(errorElement);
  }

  /**
   * Set buttons disabled state
   */
  setButtonsDisabled(disabled) {
    const buttons = this.overlay.querySelectorAll('.dialog-button');
    buttons.forEach(button => {
      button.disabled = disabled;
      button.classList.toggle('loading', disabled);
    });
  }

  /**
   * Cleanup and remove dialog
   */
  cleanup() {
    if (this.overlay && this.overlay.parentElement) {
      this.overlay.parentElement.removeChild(this.overlay);
    }
    
    document.body.style.overflow = ''; // Restore scroll
    document.removeEventListener('keydown', this.handleKeyDown);
    
    this.isOpen = false;
    this.options.onClose();
  }

  /**
   * Update dialog content
   */
  updateContent(updates) {
    if (!this.isOpen) return;
    
    if (updates.title) {
      const titleElement = this.overlay.querySelector('.dialog-title');
      titleElement.textContent = updates.title;
    }
    
    if (updates.message) {
      const messageElement = this.overlay.querySelector('.dialog-message');
      messageElement.textContent = updates.message;
    }
    
    if (updates.confirmText) {
      const confirmButton = this.overlay.querySelector('[data-action="confirm"]');
      confirmButton.textContent = updates.confirmText;
    }
    
    if (updates.cancelText) {
      const cancelButton = this.overlay.querySelector('[data-action="cancel"]');
      if (cancelButton) {
        cancelButton.textContent = updates.cancelText;
      }
    }
  }

  /**
   * Static method to create and show a simple confirmation dialog
   */
  static confirm(message, options = {}) {
    return new Promise((resolve) => {
      const dialog = new ConfirmDialog({
        message: message,
        ...options,
        onConfirm: () => {
          resolve(true);
        },
        onCancel: () => {
          resolve(false);
        }
      });
      
      dialog.show();
    });
  }

  /**
   * Static method for danger confirmations (delete, etc.)
   */
  static danger(message, options = {}) {
    return ConfirmDialog.confirm(message, {
      type: 'danger',
      confirmText: 'Delete',
      confirmButton: 'danger',
      icon: '⚠️',
      focusCancel: true,
      ...options
    });
  }

  /**
   * Static method for warning confirmations
   */
  static warning(message, options = {}) {
    return ConfirmDialog.confirm(message, {
      type: 'warning',
      confirmText: 'Proceed',
      icon: '⚠️',
      ...options
    });
  }

  /**
   * Static method for success confirmations
   */
  static success(message, options = {}) {
    return ConfirmDialog.confirm(message, {
      type: 'success',
      confirmText: 'Continue',
      icon: '✅',
      showCancel: false,
      ...options
    });
  }

  /**
   * Static method for info confirmations
   */
  static info(message, options = {}) {
    return ConfirmDialog.confirm(message, {
      type: 'info',
      confirmText: 'OK',
      icon: 'ℹ️',
      showCancel: false,
      ...options
    });
  }

  /**
   * Static method for destructive actions requiring typed confirmation
   */
  static destructive(message, options = {}) {
    return ConfirmDialog.confirm(message, {
      type: 'danger',
      confirmText: 'Delete Permanently',
      confirmButton: 'danger',
      icon: '🗑️',
      requireConfirmation: true,
      confirmationText: 'DELETE',
      focusCancel: true,
      persistent: true,
      details: 'This action cannot be undone.',
      ...options
    });
  }
}

// CSS styles (inject into document if not already present)
const injectStyles = () => {
  if (document.querySelector('#confirm-dialog-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'confirm-dialog-styles';
  style.textContent = `
    .confirm-dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.2s ease;
      padding: 1rem;
    }
    
    .confirm-dialog-overlay.active {
      opacity: 1;
    }
    
    .confirm-dialog {
      background: var(--glass-light, rgba(255, 255, 255, 0.08));
      backdrop-filter: blur(20px);
      border: 1px solid var(--glass-border-light, rgba(255, 255, 255, 0.15));
      border-radius: 1rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
      transform: translateY(20px) scale(0.95);
      transition: transform 0.2s ease;
      color: var(--text-primary, rgba(255, 255, 255, 0.95));
      min-width: 300px;
    }
    
    .confirm-dialog-overlay.active .confirm-dialog {
      transform: translateY(0) scale(1);
    }
    
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.5rem 1.5rem 1rem;
      border-bottom: 1px solid var(--glass-border-subtle, rgba(255, 255, 255, 0.1));
    }
    
    .dialog-icon {
      font-size: 1.5rem;
      width: 2rem;
      height: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.5rem;
    }
    
    .dialog-icon.danger {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }
    
    .dialog-icon.warning {
      background: rgba(245, 158, 11, 0.2);
      color: #f59e0b;
    }
    
    .dialog-icon.success {
      background: rgba(16, 185, 129, 0.2);
      color: #10b981;
    }
    
    .dialog-icon.info {
      background: rgba(59, 130, 246, 0.2);
      color: #3b82f6;
    }
    
    .dialog-title {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary, rgba(255, 255, 255, 0.95));
    }
    
    .dialog-body {
      padding: 1rem 1.5rem;
    }
    
    .dialog-message {
      margin: 0 0 1rem 0;
      color: var(--text-secondary, rgba(255, 255, 255, 0.8));
      line-height: 1.5;
    }
    
    .dialog-details {
      margin: 1rem 0;
      padding: 0.75rem;
      background: var(--glass-subtle, rgba(255, 255, 255, 0.05));
      border-radius: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-tertiary, rgba(255, 255, 255, 0.65));
    }
    
    .confirmation-input-container {
      margin: 1rem 0;
    }
    
    .confirmation-label {
      display: block;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary, rgba(255, 255, 255, 0.8));
    }
    
    .confirmation-input {
      width: 100%;
      padding: 0.75rem;
      background: var(--glass-subtle, rgba(255, 255, 255, 0.05));
      border: 1px solid var(--glass-border-light, rgba(255, 255, 255, 0.15));
      border-radius: 0.5rem;
      color: var(--text-primary, rgba(255, 255, 255, 0.95));
      font-family: monospace;
      font-size: 0.875rem;
    }
    
    .confirmation-input:focus {
      outline: none;
      border-color: var(--brand-primary, #8b5cf6);
      box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
    }
    
    .confirmation-input.error {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
    }
    
    .confirmation-error {
      margin-top: 0.5rem;
      padding: 0.5rem;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 0.25rem;
      color: #ef4444;
      font-size: 0.875rem;
    }
    
    .dialog-error {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 1rem 0;
      padding: 0.75rem;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 0.5rem;
      color: #ef4444;
      font-size: 0.875rem;
    }
    
    .dialog-footer {
      display: flex;
      gap: 0.75rem;
      padding: 1rem 1.5rem 1.5rem;
      justify-content: flex-end;
    }
    
    .dialog-button {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0.5rem;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      min-width: 80px;
    }
    
    .dialog-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .dialog-button.primary {
      background: var(--gradient-primary, linear-gradient(135deg, #8b5cf6, #a855f7));
      color: white;
    }
    
    .dialog-button.primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
    }
    
    .dialog-button.secondary {
      background: var(--glass-light, rgba(255, 255, 255, 0.08));
      border: 1px solid var(--glass-border-light, rgba(255, 255, 255, 0.15));
      color: var(--text-primary, rgba(255, 255, 255, 0.95));
    }
    
    .dialog-button.secondary:hover:not(:disabled) {
      background: var(--glass-medium, rgba(255, 255, 255, 0.12));
    }
    
    .dialog-button.danger {
      background: var(--gradient-danger, linear-gradient(135deg, #ef4444, #dc2626));
      color: white;
    }
    
    .dialog-button.danger:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
    }
    
    .dialog-button.loading::after {
      content: '';
      position: absolute;
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-left: 0.5rem;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    /* Responsive */
    @media (max-width: 480px) {
      .confirm-dialog {
        margin: 1rem;
        width: calc(100vw - 2rem);
      }
      
      .dialog-footer {
        flex-direction: column-reverse;
      }
      
      .dialog-button {
        width: 100%;
      }
    }
  `;
  
  document.head.appendChild(style);
};

// Inject styles when module loads
injectStyles();

// Export the ConfirmDialog class
export default ConfirmDialog;