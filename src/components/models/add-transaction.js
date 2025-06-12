<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Add Transaction Modal - SmartFinanceAI</title>
    <style>
        /* Import the main design system variables */
        :root {
            --brand-primary: #8b5cf6;
            --brand-secondary: #3b82f6;
            --brand-accent: #10b981;
            --brand-warning: #f59e0b;
            --brand-danger: #ef4444;
            
            --glass-light: rgba(255, 255, 255, 0.08);
            --glass-medium: rgba(255, 255, 255, 0.12);
            --glass-border-light: rgba(255, 255, 255, 0.15);
            --glass-border-medium: rgba(255, 255, 255, 0.2);
            
            --text-primary: rgba(255, 255, 255, 0.95);
            --text-secondary: rgba(255, 255, 255, 0.8);
            --text-tertiary: rgba(255, 255, 255, 0.65);
            
            --bg-primary: linear-gradient(135deg, #0f172a 0%, #1e1b4b 25%, #312e81 50%, #1e1b4b 75%, #0f172a 100%);
            
            --font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            --font-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: var(--font-primary);
            background: var(--bg-primary);
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
        }
        
        /* Modal Overlay */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .modal-overlay.active {
            opacity: 1;
            visibility: visible;
        }
        
        /* Modal Container */
        .modal {
            background: var(--glass-medium);
            backdrop-filter: blur(24px);
            border: 1px solid var(--glass-border-medium);
            border-radius: 1.5rem;
            width: 100%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
            transform: scale(0.9) translateY(20px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        }
        
        .modal-overlay.active .modal {
            transform: scale(1) translateY(0);
        }
        
        /* Modal Header */
        .modal-header {
            padding: 2rem 2rem 1rem 2rem;
            border-bottom: 1px solid var(--glass-border-light);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .modal-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--text-primary);
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        
        .modal-icon {
            width: 2rem;
            height: 2rem;
            background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
            border-radius: 0.75rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
        }
        
        .close-btn {
            background: none;
            border: none;
            color: var(--text-secondary);
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 0.5rem;
            transition: all 0.2s ease;
        }
        
        .close-btn:hover {
            background: var(--glass-light);
            color: var(--text-primary);
        }
        
        /* Modal Body */
        .modal-body {
            padding: 1.5rem 2rem;
        }
        
        /* Form Styles */
        .form-group {
            margin-bottom: 1.5rem;
        }
        
        .form-label {
            display: block;
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--text-secondary);
            margin-bottom: 0.5rem;
        }
        
        .form-input {
            width: 100%;
            padding: 0.75rem 1rem;
            background: var(--glass-light);
            border: 1px solid var(--glass-border-light);
            border-radius: 0.75rem;
            color: var(--text-primary);
            font-family: var(--font-primary);
            font-size: 0.875rem;
            transition: all 0.2s ease;
        }
        
        .form-input:focus {
            outline: none;
            border-color: var(--brand-primary);
            background: var(--glass-medium);
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
        }
        
        .form-input::placeholder {
            color: var(--text-tertiary);
        }
        
        /* Currency Input */
        .currency-input-wrapper {
            position: relative;
        }
        
        .currency-input {
            font-family: var(--font-mono);
            text-align: right;
            padding-right: 3.5rem;
        }
        
        .currency-symbol {
            position: absolute;
            right: 1rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-tertiary);
            font-weight: 500;
            pointer-events: none;
        }
        
        /* Select Styles */
        .form-select {
            appearance: none;
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23fff' stroke-opacity='0.5' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
            background-position: right 0.75rem center;
            background-repeat: no-repeat;
            background-size: 1rem;
            padding-right: 3rem;
        }
        
        /* Transaction Type Selector */
        .transaction-type-selector {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.75rem;
            margin-bottom: 1.5rem;
        }
        
        .type-option {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.75rem 1rem;
            background: var(--glass-light);
            border: 1px solid var(--glass-border-light);
            border-radius: 0.75rem;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 0.875rem;
            font-weight: 500;
        }
        
        .type-option:hover {
            background: var(--glass-medium);
        }
        
        .type-option.active {
            background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
            border-color: var(--brand-primary);
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }
        
        .type-option input[type="radio"] {
            display: none;
        }
        
        /* Category Grid */
        .category-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
            gap: 0.5rem;
            margin-top: 0.75rem;
        }
        
        .category-option {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.25rem;
            padding: 0.75rem 0.5rem;
            background: var(--glass-light);
            border: 1px solid var(--glass-border-light);
            border-radius: 0.75rem;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 0.75rem;
            text-align: center;
        }
        
        .category-option:hover {
            background: var(--glass-medium);
            transform: translateY(-1px);
        }
        
        .category-option.selected {
            background: rgba(139, 92, 246, 0.2);
            border-color: var(--brand-primary);
            color: var(--brand-primary);
        }
        
        .category-icon {
            font-size: 1.25rem;
        }
        
        /* Modal Footer */
        .modal-footer {
            padding: 1rem 2rem 2rem 2rem;
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
        }
        
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 0.75rem;
            font-family: var(--font-primary);
            font-weight: 600;
            font-size: 0.875rem;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .btn-secondary {
            background: var(--glass-light);
            border: 1px solid var(--glass-border-light);
            color: var(--text-secondary);
        }
        
        .btn-secondary:hover {
            background: var(--glass-medium);
            color: var(--text-primary);
        }
        
        .btn-primary {
            background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
            color: white;
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(139, 92, 246, 0.5);
        }
        
        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none !important;
        }
        
        /* Animations */
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .form-group {
            animation: slideIn 0.3s ease forwards;
        }
        
        .form-group:nth-child(2) { animation-delay: 0.1s; }
        .form-group:nth-child(3) { animation-delay: 0.2s; }
        .form-group:nth-child(4) { animation-delay: 0.3s; }
        .form-group:nth-child(5) { animation-delay: 0.4s; }
        
        /* Responsive */
        @media (max-width: 768px) {
            .modal {
                margin: 1rem;
                border-radius: 1rem;
            }
            
            .modal-header,
            .modal-body,
            .modal-footer {
                padding-left: 1.5rem;
                padding-right: 1.5rem;
            }
            
            .transaction-type-selector {
                grid-template-columns: 1fr;
            }
            
            .category-grid {
                grid-template-columns: repeat(3, 1fr);
            }
        }
    </style>
</head>
<body>
    <!-- Demo Button to Open Modal -->
    <button id="openModal" class="btn btn-primary">
        <span>➕</span>
        Add Transaction
    </button>
    
    <!-- Modal Overlay -->
    <div class="modal-overlay" id="modalOverlay">
        <div class="modal">
            <!-- Modal Header -->
            <div class="modal-header">
                <h2 class="modal-title">
                    <div class="modal-icon">💰</div>
                    Add Transaction
                </h2>
                <button class="close-btn" id="closeModal">✕</button>
            </div>
            
            <!-- Modal Body -->
            <div class="modal-body">
                <form id="transactionForm">
                    <!-- Transaction Type -->
                    <div class="transaction-type-selector">
                        <label class="type-option">
                            <input type="radio" name="transactionType" value="expense" checked>
                            <span>💸</span>
                            <span>Expense</span>
                        </label>
                        <label class="type-option">
                            <input type="radio" name="transactionType" value="income">
                            <span>💰</span>
                            <span>Income</span>
                        </label>
                    </div>
                    
                    <!-- Amount -->
                    <div class="form-group">
                        <label class="form-label" for="amount">Amount</label>
                        <div class="currency-input-wrapper">
                            <input 
                                type="number" 
                                id="amount" 
                                class="form-input currency-input" 
                                placeholder="0.00" 
                                step="0.01"
                                min="0"
                                required
                            >
                            <span class="currency-symbol" id="currencySymbol">$</span>
                        </div>
                    </div>
                    
                    <!-- Description -->
                    <div class="form-group">
                        <label class="form-label" for="description">Description</label>
                        <input 
                            type="text" 
                            id="description" 
                            class="form-input" 
                            placeholder="Enter transaction description..."
                            required
                        >
                    </div>
                    
                    <!-- Category -->
                    <div class="form-group">
                        <label class="form-label">Category</label>
                        <div class="category-grid" id="categoryGrid">
                            <!-- Categories will be populated by JavaScript -->
                        </div>
                        <input type="hidden" id="selectedCategory" name="category" required>
                    </div>
                    
                    <!-- Account -->
                    <div class="form-group">
                        <label class="form-label" for="account">Account</label>
                        <select id="account" class="form-input form-select" required>
                            <option value="">Select an account...</option>
                            <option value="checking">Checking Account - $2,547.83</option>
                            <option value="savings">Savings Account - $8,291.47</option>
                            <option value="credit">Credit Card - $847.29</option>
                        </select>
                    </div>
                    
                    <!-- Date -->
                    <div class="form-group">
                        <label class="form-label" for="date">Date</label>
                        <input 
                            type="date" 
                            id="date" 
                            class="form-input" 
                            required
                        >
                    </div>
                    
                    <!-- Notes (Optional) -->
                    <div class="form-group">
                        <label class="form-label" for="notes">Notes (Optional)</label>
                        <textarea 
                            id="notes" 
                            class="form-input" 
                            placeholder="Add any additional notes..."
                            rows="3"
                            style="resize: vertical;"
                        ></textarea>
                    </div>
                </form>
            </div>
            
            <!-- Modal Footer -->
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" id="cancelBtn">
                    Cancel
                </button>
                <button type="submit" class="btn btn-primary" id="saveBtn" form="transactionForm">
                    <span>💾</span>
                    Save Transaction
                </button>
            </div>
        </div>
    </div>

    <script>
        // Transaction Categories by Type
        const CATEGORIES = {
            expense: [
                { id: 'food', icon: '🍔', name: 'Food & Dining' },
                { id: 'transport', icon: '🚗', name: 'Transport' },
                { id: 'shopping', icon: '🛍️', name: 'Shopping' },
                { id: 'bills', icon: '💡', name: 'Bills & Utilities' },
                { id: 'entertainment', icon: '🎬', name: 'Entertainment' },
                { id: 'healthcare', icon: '🏥', name: 'Healthcare' },
                { id: 'education', icon: '📚', name: 'Education' },
                { id: 'travel', icon: '✈️', name: 'Travel' },
                { id: 'subscriptions', icon: '📱', name: 'Subscriptions' },
                { id: 'other_expense', icon: '📝', name: 'Other' }
            ],
            income: [
                { id: 'salary', icon: '💼', name: 'Salary' },
                { id: 'freelance', icon: '💻', name: 'Freelance' },
                { id: 'investment', icon: '📈', name: 'Investment' },
                { id: 'rental', icon: '🏠', name: 'Rental Income' },
                { id: 'business', icon: '🏢', name: 'Business' },
                { id: 'gift', icon: '🎁', name: 'Gift/Bonus' },
                { id: 'refund', icon: '↩️', name: 'Refund' },
                { id: 'other_income', icon: '💰', name: 'Other' }
            ]
        };

        class AddTransactionModal {
            constructor() {
                this.modal = document.getElementById('modalOverlay');
                this.form = document.getElementById('transactionForm');
                this.categoryGrid = document.getElementById('categoryGrid');
                this.selectedCategoryInput = document.getElementById('selectedCategory');
                this.currentType = 'expense';
                
                this.initializeEventListeners();
                this.initializeForm();
                this.renderCategories();
            }

            initializeEventListeners() {
                // Modal controls
                document.getElementById('openModal').addEventListener('click', () => this.openModal());
                document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
                document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
                
                // Close on overlay click
                this.modal.addEventListener('click', (e) => {
                    if (e.target === this.modal) this.closeModal();
                });
                
                // Transaction type change
                document.querySelectorAll('input[name="transactionType"]').forEach(radio => {
                    radio.addEventListener('change', (e) => {
                        this.currentType = e.target.value;
                        this.updateTypeUI();
                        this.renderCategories();
                    });
                });
                
                // Form submission
                this.form.addEventListener('submit', (e) => this.handleSubmit(e));
                
                // Escape key to close
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                        this.closeModal();
                    }
                });
            }

            initializeForm() {
                // Set today's date as default
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('date').value = today;
                
                // Update currency symbol based on user settings (demo: USD)
                this.updateCurrencySymbol('USD');
            }

            updateCurrencySymbol(currency) {
                const symbols = {
                    'USD': '$',
                    'EUR': '€',
                    'GBP': '£',
                    'NZD': '$',
                    'AUD': '$',
                    'CAD': '$'
                };
                document.getElementById('currencySymbol').textContent = symbols[currency] || '$';
            }

            updateTypeUI() {
                // Update active state for transaction type
                document.querySelectorAll('.type-option').forEach(option => {
                    const radio = option.querySelector('input[type="radio"]');
                    if (radio.checked) {
                        option.classList.add('active');
                    } else {
                        option.classList.remove('active');
                    }
                });
            }

            renderCategories() {
                const categories = CATEGORIES[this.currentType];
                this.categoryGrid.innerHTML = '';
                
                categories.forEach(category => {
                    const categoryElement = document.createElement('div');
                    categoryElement.className = 'category-option';
                    categoryElement.dataset.categoryId = category.id;
                    categoryElement.innerHTML = `
                        <div class="category-icon">${category.icon}</div>
                        <div>${category.name}</div>
                    `;
                    
                    categoryElement.addEventListener('click', () => this.selectCategory(category.id));
                    this.categoryGrid.appendChild(categoryElement);
                });
            }

            selectCategory(categoryId) {
                // Clear previous selections
                this.categoryGrid.querySelectorAll('.category-option').forEach(option => {
                    option.classList.remove('selected');
                });
                
                // Select new category
                const selectedElement = this.categoryGrid.querySelector(`[data-category-id="${categoryId}"]`);
                if (selectedElement) {
                    selectedElement.classList.add('selected');
                    this.selectedCategoryInput.value = categoryId;
                }
            }

            openModal() {
                this.modal.classList.add('active');
                document.body.style.overflow = 'hidden';
                
                // Focus on amount input
                setTimeout(() => {
                    document.getElementById('amount').focus();
                }, 300);
            }

            closeModal() {
                this.modal.classList.remove('active');
                document.body.style.overflow = '';
                this.resetForm();
            }

            resetForm() {
                this.form.reset();
                
                // Reset to expense type
                this.currentType = 'expense';
                document.querySelector('input[value="expense"]').checked = true;
                this.updateTypeUI();
                this.renderCategories();
                
                // Reset date to today
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('date').value = today;
                
                // Clear category selection
                this.selectedCategoryInput.value = '';
            }

            handleSubmit(e) {
                e.preventDefault();
                
                // Validate category selection
                if (!this.selectedCategoryInput.value) {
                    alert('Please select a category for this transaction.');
                    return;
                }
                
                // Collect form data
                const formData = new FormData(this.form);
                const transactionData = {
                    type: this.currentType,
                    amount: parseFloat(formData.get('amount') || 0),
                    description: formData.get('description') || '',
                    category: this.selectedCategoryInput.value,
                    account: formData.get('account') || '',
                    date: formData.get('date') || '',
                    notes: formData.get('notes') || '',
                    timestamp: new Date().toISOString()
                };
                
                // Validate required fields
                if (!transactionData.amount || !transactionData.description || !transactionData.account) {
                    alert('Please fill in all required fields.');
                    return;
                }
                
                // Process transaction (in real app, this would call API)
                this.saveTransaction(transactionData);
            }

            async saveTransaction(transactionData) {
                try {
                    // Show loading state
                    const saveBtn = document.getElementById('saveBtn');
                    const originalText = saveBtn.innerHTML;
                    saveBtn.innerHTML = '<span>⏳</span> Saving...';
                    saveBtn.disabled = true;
                    
                    // Simulate API call
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // In real app, this would be an API call:
                    // const response = await fetch('/api/transactions', {
                    //     method: 'POST',
                    //     headers: { 'Content-Type': 'application/json' },
                    //     body: JSON.stringify(transactionData)
                    // });
                    
                    console.log('Transaction saved:', transactionData);
                    
                    // Show success feedback
                    saveBtn.innerHTML = '<span>✅</span> Saved!';
                    saveBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                    
                    // Close modal after brief delay
                    setTimeout(() => {
                        this.closeModal();
                        // Reset button state
                        saveBtn.innerHTML = originalText;
                        saveBtn.disabled = false;
                        saveBtn.style.background = '';
                        
                        // Show success notification (in real app)
                        this.showSuccessNotification(transactionData);
                    }, 1000);
                    
                } catch (error) {
                    console.error('Error saving transaction:', error);
                    alert('Error saving transaction. Please try again.');
                    
                    // Reset button state
                    const saveBtn = document.getElementById('saveBtn');
                    saveBtn.innerHTML = '<span>💾</span> Save Transaction';
                    saveBtn.disabled = false;
                }
            }

            showSuccessNotification(transactionData) {
                // Create success notification
                const notification = document.createElement('div');
                notification.style.cssText = `
                    position: fixed;
                    top: 2rem;
                    right: 2rem;
                    background: linear-gradient(135deg, #10b981, #059669);
                    color: white;
                    padding: 1rem 1.5rem;
                    border-radius: 0.75rem;
                    box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
                    z-index: 10000;
                    font-weight: 500;
                    animation: slideIn 0.3s ease;
                `;
                
                const typeIcon = transactionData.type === 'expense' ? '💸' : '💰';
                notification.innerHTML = `
                    ${typeIcon} Transaction added successfully!<br>
                    <small style="opacity: 0.9;">${transactionData.description} - $${transactionData.amount.toFixed(2)}</small>
                `;
                
                document.body.appendChild(notification);
                
                // Remove notification after 3 seconds
                setTimeout(() => {
                    notification.remove();
                }, 3000);
            }
        }

        // Initialize the modal when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            new AddTransactionModal();
        });
    </script>
</body>
</html>