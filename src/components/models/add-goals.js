<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Add Goal Modal - SmartFinanceAI</title>
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
            --glass-strong: rgba(255, 255, 255, 0.15);
            --glass-border-light: rgba(255, 255, 255, 0.15);
            --glass-border-medium: rgba(255, 255, 255, 0.2);
            
            --text-primary: rgba(255, 255, 255, 0.95);
            --text-secondary: rgba(255, 255, 255, 0.8);
            --text-tertiary: rgba(255, 255, 255, 0.65);
            --text-quaternary: rgba(255, 255, 255, 0.5);
            
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
            max-width: 600px;
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
            background: linear-gradient(135deg, var(--brand-accent), var(--brand-primary));
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
        
        /* Step Indicator */
        .step-indicator {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .step {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: var(--glass-light);
            border: 1px solid var(--glass-border-light);
            border-radius: 0.75rem;
            font-size: 0.875rem;
            opacity: 0.5;
            transition: all 0.3s ease;
        }
        
        .step.active {
            opacity: 1;
            background: rgba(139, 92, 246, 0.2);
            border-color: var(--brand-primary);
            color: var(--brand-primary);
        }
        
        .step.completed {
            opacity: 1;
            background: rgba(16, 185, 129, 0.2);
            border-color: var(--brand-accent);
            color: var(--brand-accent);
        }
        
        .step-number {
            width: 1.5rem;
            height: 1.5rem;
            background: var(--glass-medium);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            font-weight: 600;
        }
        
        .step.active .step-number {
            background: var(--brand-primary);
            color: white;
        }
        
        .step.completed .step-number {
            background: var(--brand-accent);
            color: white;
        }
        
        /* Form Steps */
        .form-step {
            display: none;
            animation: slideIn 0.3s ease forwards;
        }
        
        .form-step.active {
            display: block;
        }
        
        /* Goal Templates */
        .goal-templates {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .goal-template {
            background: var(--glass-light);
            border: 1px solid var(--glass-border-light);
            border-radius: 1rem;
            padding: 1.5rem;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
        }
        
        .goal-template:hover {
            background: var(--glass-medium);
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }
        
        .goal-template.selected {
            background: rgba(139, 92, 246, 0.15);
            border-color: var(--brand-primary);
            box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);
        }
        
        .template-icon {
            font-size: 2rem;
            margin-bottom: 0.75rem;
            display: block;
        }
        
        .template-title {
            font-size: 1.125rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: var(--text-primary);
        }
        
        .template-description {
            font-size: 0.875rem;
            color: var(--text-secondary);
            line-height: 1.4;
            margin-bottom: 1rem;
        }
        
        .template-features {
            list-style: none;
            font-size: 0.75rem;
            color: var(--text-tertiary);
        }
        
        .template-features li {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            margin-bottom: 0.25rem;
        }
        
        .template-features li::before {
            content: '✓';
            color: var(--brand-accent);
            font-weight: 600;
        }
        
        /* Form Styles */
        .form-group {
            margin-bottom: 1.5rem;
        }
        
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
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
        
        /* Priority Selector */
        .priority-selector {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.75rem;
        }
        
        .priority-option {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            padding: 1rem 0.75rem;
            background: var(--glass-light);
            border: 1px solid var(--glass-border-light);
            border-radius: 0.75rem;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 0.875rem;
            text-align: center;
        }
        
        .priority-option:hover {
            background: var(--glass-medium);
        }
        
        .priority-option.selected {
            background: rgba(139, 92, 246, 0.2);
            border-color: var(--brand-primary);
            color: var(--brand-primary);
        }
        
        .priority-icon {
            font-size: 1.5rem;
        }
        
        /* Progress Visualization */
        .goal-preview {
            background: var(--glass-light);
            border: 1px solid var(--glass-border-light);
            border-radius: 1rem;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
        }
        
        .preview-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1rem;
        }
        
        .preview-title {
            font-size: 1.125rem;
            font-weight: 600;
            color: var(--text-primary);
        }
        
        .preview-amount {
            font-family: var(--font-mono);
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--brand-accent);
        }
        
        .progress-bar {
            width: 100%;
            height: 0.5rem;
            background: var(--glass-border-light);
            border-radius: 0.25rem;
            overflow: hidden;
            margin-bottom: 1rem;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--brand-accent), var(--brand-primary));
            border-radius: 0.25rem;
            transition: width 0.3s ease;
        }
        
        .timeline-info {
            display: flex;
            justify-content: space-between;
            font-size: 0.875rem;
            color: var(--text-secondary);
        }
        
        /* AI Insights */
        .ai-insights {
            background: rgba(139, 92, 246, 0.1);
            border: 1px solid rgba(139, 92, 246, 0.2);
            border-radius: 1rem;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
        }
        
        .ai-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1rem;
        }
        
        .ai-icon {
            width: 2rem;
            height: 2rem;
            background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
            border-radius: 0.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
        }
        
        .ai-title {
            font-size: 1rem;
            font-weight: 600;
            color: var(--brand-primary);
        }
        
        .ai-insights-list {
            list-style: none;
            font-size: 0.875rem;
            color: var(--text-secondary);
        }
        
        .ai-insights-list li {
            display: flex;
            align-items: flex-start;
            gap: 0.5rem;
            margin-bottom: 0.75rem;
            line-height: 1.4;
        }
        
        .ai-insights-list li::before {
            content: '🎯';
            flex-shrink: 0;
        }
        
        /* Modal Footer */
        .modal-footer {
            padding: 1rem 2rem 2rem 2rem;
            display: flex;
            gap: 1rem;
            justify-content: space-between;
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
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .form-group {
            animation: slideIn 0.3s ease forwards;
        }
        
        .form-group:nth-child(2) { animation-delay: 0.1s; }
        .form-group:nth-child(3) { animation-delay: 0.2s; }
        .form-group:nth-child(4) { animation-delay: 0.3s; }
        
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
            
            .goal-templates {
                grid-template-columns: 1fr;
            }
            
            .form-row {
                grid-template-columns: 1fr;
            }
            
            .priority-selector {
                grid-template-columns: 1fr;
            }
            
            .step-indicator {
                gap: 0.5rem;
            }
            
            .step {
                padding: 0.25rem 0.5rem;
                font-size: 0.75rem;
            }
        }
    </style>
</head>
<body>
    <!-- Demo Button to Open Modal -->
    <button id="openModal" class="btn btn-primary">
        <span>🎯</span>
        Add Financial Goal
    </button>
    
    <!-- Modal Overlay -->
    <div class="modal-overlay" id="modalOverlay">
        <div class="modal">
            <!-- Modal Header -->
            <div class="modal-header">
                <h2 class="modal-title">
                    <div class="modal-icon">🎯</div>
                    Create Your Financial Goal
                </h2>
                <button class="close-btn" id="closeModal">✕</button>
            </div>
            
            <!-- Modal Body -->
            <div class="modal-body">
                <!-- Step Indicator -->
                <div class="step-indicator">
                    <div class="step active" data-step="1">
                        <div class="step-number">1</div>
                        <span>Template</span>
                    </div>
                    <div class="step" data-step="2">
                        <div class="step-number">2</div>
                        <span>Details</span>
                    </div>
                    <div class="step" data-step="3">
                        <div class="step-number">3</div>
                        <span>Review</span>
                    </div>
                </div>
                
                <form id="goalForm">
                    <!-- Step 1: Choose Template -->
                    <div class="form-step active" data-step="1">
                        <div class="goal-templates">
                            <div class="goal-template" data-template="emergency">
                                <span class="template-icon">🚨</span>
                                <div class="template-title">Emergency Fund</div>
                                <div class="template-description">
                                    Build a financial safety net to cover unexpected expenses and provide peace of mind.
                                </div>
                                <ul class="template-features">
                                    <li>3-6 months of expenses</li>
                                    <li>High-yield savings account</li>
                                    <li>Quick access when needed</li>
                                </ul>
                            </div>
                            
                            <div class="goal-template" data-template="house">
                                <span class="template-icon">🏠</span>
                                <div class="template-title">House Deposit</div>
                                <div class="template-description">
                                    Save for your dream home with a strategic down payment plan.
                                </div>
                                <ul class="template-features">
                                    <li>20% down payment target</li>
                                    <li>First-home buyer programs</li>
                                    <li>Additional closing costs</li>
                                </ul>
                            </div>
                            
                            <div class="goal-template" data-template="retirement">
                                <span class="template-icon">🏖️</span>
                                <div class="template-title">Retirement Savings</div>
                                <div class="template-description">
                                    Secure your future with smart retirement planning and compound growth.
                                </div>
                                <ul class="template-features">
                                    <li>KiwiSaver optimization</li>
                                    <li>Employer matching</li>
                                    <li>Long-term growth strategy</li>
                                </ul>
                            </div>
                            
                            <div class="goal-template" data-template="vacation">
                                <span class="template-icon">✈️</span>
                                <div class="template-title">Dream Vacation</div>
                                <div class="template-description">
                                    Plan and save for your perfect getaway with detailed budget tracking.
                                </div>
                                <ul class="template-features">
                                    <li>Travel budget breakdown</li>
                                    <li>Seasonal price tracking</li>
                                    <li>Currency considerations</li>
                                </ul>
                            </div>
                            
                            <div class="goal-template" data-template="debt">
                                <span class="template-icon">💳</span>
                                <div class="template-title">Debt Payoff</div>
                                <div class="template-description">
                                    Eliminate debt faster with strategic payoff methods and progress tracking.
                                </div>
                                <ul class="template-features">
                                    <li>Avalanche vs. snowball methods</li>
                                    <li>Interest savings calculator</li>
                                    <li>Payment optimization</li>
                                </ul>
                            </div>
                            
                            <div class="goal-template" data-template="custom">
                                <span class="template-icon">📝</span>
                                <div class="template-title">Custom Goal</div>
                                <div class="template-description">
                                    Create a personalized savings goal for any financial objective.
                                </div>
                                <ul class="template-features">
                                    <li>Flexible parameters</li>
                                    <li>Custom timeline</li>
                                    <li>Personalized tracking</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Step 2: Goal Details -->
                    <div class="form-step" data-step="2">
                        <div class="form-group">
                            <label class="form-label" for="goalName">Goal Name</label>
                            <input 
                                type="text" 
                                id="goalName" 
                                class="form-input" 
                                placeholder="Enter your goal name..."
                                required
                            >
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label" for="targetAmount">Target Amount</label>
                                <div class="currency-input-wrapper">
                                    <input 
                                        type="number" 
                                        id="targetAmount" 
                                        class="form-input currency-input" 
                                        placeholder="0.00" 
                                        step="0.01"
                                        min="1"
                                        required
                                    >
                                    <span class="currency-symbol">$</span>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label" for="currentAmount">Current Amount</label>
                                <div class="currency-input-wrapper">
                                    <input 
                                        type="number" 
                                        id="currentAmount" 
                                        class="form-input currency-input" 
                                        placeholder="0.00" 
                                        step="0.01"
                                        min="0"
                                        value="0"
                                    >
                                    <span class="currency-symbol">$</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label" for="targetDate">Target Date</label>
                                <input 
                                    type="date" 
                                    id="targetDate" 
                                    class="form-input" 
                                    required
                                >
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label" for="monthlyContribution">Monthly Contribution</label>
                                <div class="currency-input-wrapper">
                                    <input 
                                        type="number" 
                                        id="monthlyContribution" 
                                        class="form-input currency-input" 
                                        placeholder="0.00" 
                                        step="0.01"
                                        min="0"
                                    >
                                    <span class="currency-symbol">$</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Priority Level</label>
                            <div class="priority-selector">
                                <div class="priority-option" data-priority="low">
                                    <div class="priority-icon">🟢</div>
                                    <div>Low Priority</div>
                                    <small>Nice to have</small>
                                </div>
                                <div class="priority-option selected" data-priority="medium">
                                    <div class="priority-icon">🟡</div>
                                    <div>Medium Priority</div>
                                    <small>Important goal</small>
                                </div>
                                <div class="priority-option" data-priority="high">
                                    <div class="priority-icon">🔴</div>
                                    <div>High Priority</div>
                                    <small>Critical target</small>
                                </div>
                            </div>
                            <input type="hidden" id="priority" name="priority" value="medium">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="description">Description (Optional)</label>
                            <textarea 
                                id="description" 
                                class="form-input" 
                                placeholder="Add details about your goal..."
                                rows="3"
                                style="resize: vertical;"
                            ></textarea>
                        </div>
                    </div>
                    
                    <!-- Step 3: Review and AI Insights -->
                    <div class="form-step" data-step="3">
                        <div class="goal-preview">
                            <div class="preview-header">
                                <div class="preview-title" id="previewTitle">Emergency Fund</div>
                                <div class="preview-amount" id="previewAmount">$5,000</div>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" id="progressFill" style="width: 0%"></div>
                            </div>
                            <div class="timeline-info">
                                <span id="timelineStart">Starting: Today</span>
                                <span id="timelineEnd">Target: Dec 2025</span>
                            </div>
                        </div>
                        
                        <div class="ai-insights">
                            <div class="ai-header">
                                <div class="ai-icon">🤖</div>
                                <div class="ai-title">AI Financial Coach Insights</div>
                            </div>
                            <ul class="ai-insights-list" id="aiInsightsList">
                                <!-- AI insights will be populated here -->
                            </ul>
                        </div>
                    </div>
                </form>
            </div>
            
            <!-- Modal Footer -->
            <div class="modal-footer">
                <div>
                    <button type="button" class="btn btn-secondary" id="prevBtn" style="display: none;">
                        ← Previous
                    </button>
                </div>
                <div style="display: flex; gap: 1rem;">
                    <button type="button" class="btn btn-secondary" id="cancelBtn">
                        Cancel
                    </button>
                    <button type="button" class="btn btn-primary" id="nextBtn">
                        Next →
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Goal Templates Configuration
        const GOAL_TEMPLATES = {
            emergency: {
                name: 'Emergency Fund',
                description: 'Build a financial safety net',
                icon: '🚨',
                defaultAmount: 5000,
                defaultMonths: 12,
                priority: 'high',
                category: 'savings',
                tips: [
                    'Start with $1,000 as initial buffer',
                    'Aim for 3-6 months of expenses',
                    'Keep in high-yield savings account'
                ]
            },
            house: {
                name: 'House Deposit',
                description: 'Save for your dream home',
                icon: '🏠',
                defaultAmount: 50000,
                defaultMonths: 36,
                priority: 'high',
                category: 'savings',
                tips: [
                    'Consider first-home buyer programs',
                    'Factor in additional closing costs',
                    'Monitor property market trends'
                ]
            },
            retirement: {
                name: 'Retirement Savings',
                description: 'Secure your financial future',
                icon: '🏖️',
                defaultAmount: 100000,
                defaultMonths: 120,
                priority: 'medium',
                category: 'investment',
                tips: [
                    'Maximize employer contributions',
                    'Take advantage of compound growth',
                    'Review allocation annually'
                ]
            },
            vacation: {
                name: 'Dream Vacation',
                description: 'Plan your perfect getaway',
                icon: '✈️',
                defaultAmount: 3000,
                defaultMonths: 12,
                priority: 'low',
                category: 'lifestyle',
                tips: [
                    'Book in advance for better rates',
                    'Consider travel insurance',
                    'Budget for activities and meals'
                ]
            },
            debt: {
                name: 'Debt Payoff',
                description: 'Eliminate debt strategically',
                icon: '💳',
                defaultAmount: 10000,
                defaultMonths: 24,
                priority: 'high',
                category: 'debt',
                tips: [
                    'Focus on high-interest debt first',
                    'Consider debt consolidation',
                    'Avoid taking on new debt'
                ]
            },
            custom: {
                name: 'Custom Goal',
                description: 'Your personalized financial target',
                icon: '📝',
                defaultAmount: 1000,
                defaultMonths: 6,
                priority: 'medium',
                category: 'custom',
                tips: [
                    'Set specific and measurable targets',
                    'Break down into smaller milestones',
                    'Track progress regularly'
                ]
            }
        };

        class AddGoalModal {
            constructor() {
                this.modal = document.getElementById('modalOverlay');
                this.form = document.getElementById('goalForm');
                this.currentStep = 1;
                this.maxSteps = 3;
                this.selectedTemplate = null;
                this.goalData = {};
                
                this.initializeEventListeners();
                this.initializeForm();
            }

            initializeEventListeners() {
                // Modal controls
                document.getElementById('openModal').addEventListener('click', () => this.openModal());
                document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
                document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
                
                // Step navigation
                document.getElementById('nextBtn').addEventListener('click', () => this.nextStep());
                document.getElementById('prevBtn').addEventListener('click', () => this.prevStep());
                
                // Template selection
                document.querySelectorAll('.goal-template').forEach(template => {
                    template.addEventListener('click', (e) => {
                        const templateType = e.currentTarget.dataset.template;
                        this.selectTemplate(templateType);
                    });
                });
                
                // Priority selection
                document.querySelectorAll('.priority-option').forEach(option => {
                    option.addEventListener('click', (e) => {
                        const priority = e.currentTarget.dataset.priority;
                        this.selectPriority(priority);
                    });
                });
                
                // Form input listeners for real-time updates
                document.getElementById('goalName').addEventListener('input', () => this.updatePreview());
                document.getElementById('targetAmount').addEventListener('input', () => this.updatePreview());
                document.getElementById('currentAmount').addEventListener('input', () => this.updatePreview());
                document.getElementById('targetDate').addEventListener('input', () => this.updatePreview());
                document.getElementById('monthlyContribution').addEventListener('input', () => this.updatePreview());
                
                // Close on overlay click
                this.modal.addEventListener('click', (e) => {
                    if (e.target === this.modal) this.closeModal();
                });
                
                // Escape key to close
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                        this.closeModal();
                    }
                });
            }

            initializeForm() {
                // Set default target date (1 year from now)
                const defaultDate = new Date();
                defaultDate.setFullYear(defaultDate.getFullYear() + 1);
                document.getElementById('targetDate').value = defaultDate.toISOString().split('T')[0];
            }

            openModal() {
                this.modal.classList.add('active');
                document.body.style.overflow = 'hidden';
                this.goToStep(1);
            }

            closeModal() {
                this.modal.classList.remove('active');
                document.body.style.overflow = '';
                this.resetForm();
            }

            resetForm() {
                this.form.reset();
                this.currentStep = 1;
                this.selectedTemplate = null;
                this.goalData = {};
                
                // Reset template selection
                document.querySelectorAll('.goal-template').forEach(template => {
                    template.classList.remove('selected');
                });
                
                // Reset priority selection
                document.querySelectorAll('.priority-option').forEach(option => {
                    option.classList.remove('selected');
                });
                document.querySelector('[data-priority="medium"]').classList.add('selected');
                document.getElementById('priority').value = 'medium';
                
                // Reset steps
                this.updateStepIndicator();
                this.updateNavigationButtons();
                
                // Reset default date
                const defaultDate = new Date();
                defaultDate.setFullYear(defaultDate.getFullYear() + 1);
                document.getElementById('targetDate').value = defaultDate.toISOString().split('T')[0];
            }

            selectTemplate(templateType) {
                this.selectedTemplate = templateType;
                const template = GOAL_TEMPLATES[templateType];
                
                // Update UI
                document.querySelectorAll('.goal-template').forEach(t => t.classList.remove('selected'));
                document.querySelector(`[data-template="${templateType}"]`).classList.add('selected');
                
                // Pre-fill form with template defaults
                if (template) {
                    document.getElementById('goalName').value = template.name;
                    document.getElementById('targetAmount').value = template.defaultAmount;
                    document.getElementById('description').value = template.description;
                    
                    // Set priority
                    this.selectPriority(template.priority);
                    
                    // Calculate default monthly contribution
                    const monthlyContribution = Math.ceil(template.defaultAmount / template.defaultMonths);
                    document.getElementById('monthlyContribution').value = monthlyContribution;
                    
                    // Set target date based on default months
                    const targetDate = new Date();
                    targetDate.setMonth(targetDate.getMonth() + template.defaultMonths);
                    document.getElementById('targetDate').value = targetDate.toISOString().split('T')[0];
                }
                
                // Store template data
                this.goalData.template = templateType;
                this.goalData.templateData = template;
            }

            selectPriority(priority) {
                document.querySelectorAll('.priority-option').forEach(option => {
                    option.classList.remove('selected');
                });
                
                document.querySelector(`[data-priority="${priority}"]`).classList.add('selected');
                document.getElementById('priority').value = priority;
                this.goalData.priority = priority;
            }

            nextStep() {
                if (this.validateCurrentStep()) {
                    if (this.currentStep < this.maxSteps) {
                        this.currentStep++;
                        this.goToStep(this.currentStep);
                        
                        // Generate AI insights on final step
                        if (this.currentStep === 3) {
                            this.generateAIInsights();
                        }
                    } else {
                        this.submitGoal();
                    }
                }
            }

            prevStep() {
                if (this.currentStep > 1) {
                    this.currentStep--;
                    this.goToStep(this.currentStep);
                }
            }

            goToStep(step) {
                this.currentStep = step;
                
                // Update step visibility
                document.querySelectorAll('.form-step').forEach(stepEl => {
                    stepEl.classList.remove('active');
                });
                document.querySelector(`[data-step="${step}"]`).classList.add('active');
                
                // Update step indicator
                this.updateStepIndicator();
                
                // Update navigation buttons
                this.updateNavigationButtons();
                
                // Update preview if on review step
                if (step === 3) {
                    this.updatePreview();
                }
            }

            updateStepIndicator() {
                document.querySelectorAll('.step').forEach((step, index) => {
                    const stepNumber = index + 1;
                    step.classList.remove('active', 'completed');
                    
                    if (stepNumber < this.currentStep) {
                        step.classList.add('completed');
                    } else if (stepNumber === this.currentStep) {
                        step.classList.add('active');
                    }
                });
            }

            updateNavigationButtons() {
                const prevBtn = document.getElementById('prevBtn');
                const nextBtn = document.getElementById('nextBtn');
                
                // Previous button
                if (this.currentStep > 1) {
                    prevBtn.style.display = 'inline-flex';
                } else {
                    prevBtn.style.display = 'none';
                }
                
                // Next/Submit button
                if (this.currentStep === this.maxSteps) {
                    nextBtn.innerHTML = '<span>💾</span> Create Goal';
                } else {
                    nextBtn.innerHTML = 'Next →';
                }
            }

            validateCurrentStep() {
                if (this.currentStep === 1) {
                    if (!this.selectedTemplate) {
                        alert('Please select a goal template to continue.');
                        return false;
                    }
                } else if (this.currentStep === 2) {
                    const goalName = document.getElementById('goalName').value.trim();
                    const targetAmount = parseFloat(document.getElementById('targetAmount').value);
                    const targetDate = document.getElementById('targetDate').value;
                    
                    if (!goalName) {
                        alert('Please enter a goal name.');
                        document.getElementById('goalName').focus();
                        return false;
                    }
                    
                    if (!targetAmount || targetAmount <= 0) {
                        alert('Please enter a valid target amount.');
                        document.getElementById('targetAmount').focus();
                        return false;
                    }
                    
                    if (!targetDate) {
                        alert('Please select a target date.');
                        document.getElementById('targetDate').focus();
                        return false;
                    }
                    
                    // Check if target date is in the future
                    const today = new Date();
                    const target = new Date(targetDate);
                    if (target <= today) {
                        alert('Target date must be in the future.');
                        document.getElementById('targetDate').focus();
                        return false;
                    }
                }
                
                return true;
            }

            updatePreview() {
                const goalName = document.getElementById('goalName').value.trim() || 'New Goal';
                const targetAmount = parseFloat(document.getElementById('targetAmount').value) || 0;
                const currentAmount = parseFloat(document.getElementById('currentAmount').value) || 0;
                const targetDate = document.getElementById('targetDate').value;
                
                // Update preview elements
                document.getElementById('previewTitle').textContent = goalName;
                document.getElementById('previewAmount').textContent = `$${targetAmount.toLocaleString()}`;
                
                // Update progress bar
                const progressPercentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
                document.getElementById('progressFill').style.width = `${Math.min(progressPercentage, 100)}%`;
                
                // Update timeline
                const today = new Date();
                document.getElementById('timelineStart').textContent = `Starting: ${today.toLocaleDateString()}`;
                
                if (targetDate) {
                    const target = new Date(targetDate);
                    document.getElementById('timelineEnd').textContent = `Target: ${target.toLocaleDateString()}`;
                } else {
                    document.getElementById('timelineEnd').textContent = 'Target: Not set';
                }
            }

            generateAIInsights() {
                const targetAmount = parseFloat(document.getElementById('targetAmount').value) || 0;
                const currentAmount = parseFloat(document.getElementById('currentAmount').value) || 0;
                const monthlyContribution = parseFloat(document.getElementById('monthlyContribution').value) || 0;
                const targetDate = new Date(document.getElementById('targetDate').value);
                const today = new Date();
                const monthsToTarget = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24 * 30));
                
                const insights = [];
                
                // Calculate required monthly savings
                const remainingAmount = targetAmount - currentAmount;
                const requiredMonthly = monthsToTarget > 0 ? remainingAmount / monthsToTarget : 0;
                
                if (monthlyContribution > 0) {
                    if (monthlyContribution >= requiredMonthly) {
                        insights.push(`Great! Your monthly contribution of $${monthlyContribution} is sufficient to reach your goal.`);
                        
                        const actualMonths = Math.ceil(remainingAmount / monthlyContribution);
                        if (actualMonths < monthsToTarget) {
                            insights.push(`You'll actually reach your goal ${monthsToTarget - actualMonths} months early with this contribution rate.`);
                        }
                    } else {
                        const shortfall = requiredMonthly - monthlyContribution;
                        insights.push(`You need to save $${shortfall.toFixed(2)} more per month to reach your goal on time.`);
                    }
                } else {
                    insights.push(`To reach your goal, you need to save approximately $${requiredMonthly.toFixed(2)} per month.`);
                }
                
                // Template-specific insights
                if (this.selectedTemplate && GOAL_TEMPLATES[this.selectedTemplate]) {
                    const template = GOAL_TEMPLATES[this.selectedTemplate];
                    template.tips.forEach(tip => {
                        insights.push(tip);
                    });
                }
                
                // Priority-based insights
                const priority = document.getElementById('priority').value;
                if (priority === 'high') {
                    insights.push('As a high-priority goal, consider automating your savings to ensure consistent progress.');
                } else if (priority === 'low') {
                    insights.push('For lower priority goals, consider saving extra money when you have surplus income.');
                }
                
                // Display insights
                const insightsList = document.getElementById('aiInsightsList');
                insightsList.innerHTML = '';
                
                insights.forEach(insight => {
                    const li = document.createElement('li');
                    li.textContent = insight;
                    insightsList.appendChild(li);
                });
            }

            async submitGoal() {
                try {
                    // Show loading state
                    const nextBtn = document.getElementById('nextBtn');
                    const originalText = nextBtn.innerHTML;
                    nextBtn.innerHTML = '<span>⏳</span> Creating Goal...';
                    nextBtn.disabled = true;
                    
                    // Collect all form data
                    const formData = new FormData(this.form);
                    const goalData = {
                        id: this.generateGoalId(),
                        template: this.selectedTemplate,
                        name: formData.get('goalName') || document.getElementById('goalName').value,
                        description: formData.get('description') || document.getElementById('description').value,
                        targetAmount: parseFloat(document.getElementById('targetAmount').value) || 0,
                        currentAmount: parseFloat(document.getElementById('currentAmount').value) || 0,
                        monthlyContribution: parseFloat(document.getElementById('monthlyContribution').value) || 0,
                        targetDate: document.getElementById('targetDate').value,
                        priority: document.getElementById('priority').value,
                        category: this.goalData.templateData?.category || 'custom',
                        createdDate: new Date().toISOString(),
                        lastUpdated: new Date().toISOString(),
                        isActive: true
                    };
                    
                    // Validate final data
                    if (!goalData.name || !goalData.targetAmount || !goalData.targetDate) {
                        throw new Error('Missing required goal information');
                    }
                    
                    // Simulate API call
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    
                    // In real app, this would be an API call:
                    // const response = await fetch('/api/goals', {
                    //     method: 'POST',
                    //     headers: { 'Content-Type': 'application/json' },
                    //     body: JSON.stringify(goalData)
                    // });
                    
                    console.log('Goal created:', goalData);
                    
                    // Show success feedback
                    nextBtn.innerHTML = '<span>✅</span> Goal Created!';
                    nextBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                    
                    // Close modal after brief delay
                    setTimeout(() => {
                        this.closeModal();
                        // Reset button state
                        nextBtn.innerHTML = originalText;
                        nextBtn.disabled = false;
                        nextBtn.style.background = '';
                        
                        // Show success notification
                        this.showSuccessNotification(goalData);
                    }, 1500);
                    
                } catch (error) {
                    console.error('Error creating goal:', error);
                    alert('Error creating goal. Please try again.');
                    
                    // Reset button state
                    const nextBtn = document.getElementById('nextBtn');
                    nextBtn.innerHTML = '<span>💾</span> Create Goal';
                    nextBtn.disabled = false;
                }
            }

            generateGoalId() {
                return 'goal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            }

            showSuccessNotification(goalData) {
                // Create success notification
                const notification = document.createElement('div');
                notification.style.cssText = `
                    position: fixed;
                    top: 2rem;
                    right: 2rem;
                    background: linear-gradient(135deg, #10b981, #059669);
                    color: white;
                    padding: 1.5rem 2rem;
                    border-radius: 1rem;
                    box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
                    z-index: 10000;
                    font-weight: 500;
                    max-width: 300px;
                    animation: slideIn 0.3s ease;
                `;
                
                const template = GOAL_TEMPLATES[goalData.template];
                notification.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                        <span style="font-size: 1.5rem;">${template?.icon || '🎯'}</span>
                        <strong>Goal Created Successfully!</strong>
                    </div>
                    <div style="opacity: 0.9; font-size: 0.875rem;">
                        ${goalData.name}<br>
                        Target: $${goalData.targetAmount.toLocaleString()}<br>
                        Due: ${new Date(goalData.targetDate).toLocaleDateString()}
                    </div>
                `;
                
                document.body.appendChild(notification);
                
                // Remove notification after 4 seconds
                setTimeout(() => {
                    notification.remove();
                }, 4000);
            }
        }

        // Initialize the modal when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            new AddGoalModal();
        });
    </script>
</body>
</html>