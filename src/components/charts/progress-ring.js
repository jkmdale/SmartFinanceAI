/**
 * ⭕ SmartFinanceAI - Progress Ring Component
 * File: src/components/charts/progress-ring.js
 * 
 * Interactive progress ring component for displaying goal progress and completion rates.
 * Perfect for savings goals, budget usage, debt payoff progress, and target achievements.
 * 
 * Features:
 * - Smooth animations with progress fill effects
 * - Interactive hover with glow and pulse effects
 * - Multiple progress rings for comparison
 * - Customizable colors, sizes, and stroke widths
 * - Center content with value and label display
 * - Multi-currency support with proper formatting
 * - Responsive design for all screen sizes
 * - Touch-friendly for mobile devices
 * - Glassmorphism styling matching app design
 * - Real-time progress updates with smooth transitions
 * - Accessibility features with keyboard navigation
 * - Milestone markers and target indicators
 * 
 * Usage:
 * const progressRing = new ProgressRing(container, data, options);
 * progressRing.render();
 * 
 * @author SmartFinanceAI Team
 * @version 1.0.0
 */

class ProgressRing {
  constructor(container, data, options = {}) {
    this.container = container;
    this.data = data;
    this.options = {
      width: 200,
      height: 200,
      margin: 20,
      animate: true,
      responsive: true,
      showTooltip: true,
      showPercentage: true,
      showLabel: true,
      showValue: true,
      showTarget: true,
      strokeWidth: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      colors: ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
      currency: 'USD',
      locale: 'en-US',
      startAngle: -Math.PI / 2, // Start from top
      ...options
    };
    
    this.canvas = null;
    this.ctx = null;
    this.tooltip = null;
    this.isDestroyed = false;
    
    // Animation state
    this.animationId = null;
    this.animationProgress = 0;
    this.isAnimating = false;
    
    // Interaction state
    this.isHovered = false;
    this.isFocused = false;
    
    // Progress calculation
    this.currentProgress = 0;
    this.targetProgress = 0;
    
    // Initialize the chart
    this.initialize();
  }

  /**
   * Initialize chart canvas and context
   */
  initialize() {
    // Create canvas element
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'progress-ring-canvas';
    this.canvas.setAttribute('role', 'progressbar');
    this.canvas.setAttribute('aria-label', 'Financial goal progress indicator');
    
    // Set up canvas sizing
    this.updateCanvasSize();
    
    // Get 2D context
    this.ctx = this.canvas.getContext('2d');
    
    // Enable high DPI displays
    this.setupHighDPI();
    
    // Create tooltip
    this.createTooltip();
    
    // Add event listeners
    this.addEventListeners();
    
    // Calculate initial progress
    this.calculateProgress();
    
    // Clear container and add canvas
    this.container.innerHTML = '';
    this.container.appendChild(this.canvas);
    
    // Set container styles
    this.container.style.position = 'relative';
    this.container.style.display = 'flex';
    this.container.style.alignItems = 'center';
    this.container.style.justifyContent = 'center';
  }

  /**
   * Update canvas size based on container and options
   */
  updateCanvasSize() {
    if (this.options.responsive) {
      const rect = this.container.getBoundingClientRect();
      const size = Math.min(rect.width || this.options.width, rect.height || this.options.height);
      this.options.width = size;
      this.options.height = size;
    }
    
    this.canvas.width = this.options.width;
    this.canvas.height = this.options.height;
    this.canvas.style.width = this.options.width + 'px';
    this.canvas.style.height = this.options.height + 'px';
  }

  /**
   * Setup high DPI display support
   */
  setupHighDPI() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    
    this.ctx.scale(dpr, dpr);
  }

  /**
   * Create tooltip element
   */
  createTooltip() {
    if (!this.options.showTooltip) return;
    
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'progress-ring-tooltip glass';
    this.tooltip.style.cssText = `
      position: absolute;
      background: var(--glass-medium);
      backdrop-filter: blur(20px);
      border: 1px solid var(--glass-border-light);
      border-radius: 0.5rem;
      padding: 0.75rem;
      font-size: 0.875rem;
      color: var(--text-primary);
      pointer-events: none;
      opacity: 0;
      transform: translateY(8px);
      transition: all 0.2s ease;
      z-index: 1000;
      max-width: 250px;
      word-wrap: break-word;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    `;
    
    document.body.appendChild(this.tooltip);
  }

  /**
   * Add event listeners for interactivity
   */
  addEventListeners() {
    // Mouse events
    this.canvas.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    
    // Touch events for mobile
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    
    // Keyboard events for accessibility
    this.canvas.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.canvas.addEventListener('focus', this.handleFocus.bind(this));
    this.canvas.addEventListener('blur', this.handleBlur.bind(this));
    
    // Make canvas focusable
    this.canvas.tabIndex = 0;
    
    // Window resize for responsive behavior
    window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 250));
  }

  /**
   * Handle mouse enter events
   */
  handleMouseEnter(event) {
    if (this.isDestroyed) return;
    
    this.isHovered = true;
    this.render();
    this.showProgressTooltip(event);
  }

  /**
   * Handle mouse leave events
   */
  handleMouseLeave(event) {
    if (this.isDestroyed) return;
    
    this.isHovered = false;
    this.hideTooltip();
    this.render();
  }

  /**
   * Handle mouse move events
   */
  handleMouseMove(event) {
    if (this.isDestroyed || !this.isHovered) return;
    
    this.showProgressTooltip(event);
  }

  /**
   * Handle click events
   */
  handleClick(event) {
    if (this.isDestroyed) return;
    
    // Dispatch custom event
    const event_detail = new CustomEvent('progressRingClicked', {
      detail: {
        progress: this.currentProgress,
        value: this.data.current || 0,
        target: this.data.target || 100,
        label: this.data.label || 'Progress'
      }
    });
    this.container.dispatchEvent(event_detail);
  }

  /**
   * Handle touch events
   */
  handleTouchStart(event) {
    event.preventDefault();
    if (this.isDestroyed) return;
    
    this.isHovered = true;
    this.render();
    this.showProgressTooltip(event.touches[0]);
  }

  handleTouchEnd(event) {
    event.preventDefault();
    if (this.isDestroyed) return;
    
    setTimeout(() => {
      this.isHovered = false;
      this.hideTooltip();
      this.render();
    }, 1500); // Keep tooltip visible longer on mobile
  }

  /**
   * Handle keyboard events for accessibility
   */
  handleKeyDown(event) {
    if (this.isDestroyed) return;
    
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.handleClick();
        break;
      case 'Escape':
        event.preventDefault();
        this.canvas.blur();
        break;
    }
  }

  /**
   * Handle focus events
   */
  handleFocus(event) {
    if (this.isDestroyed) return;
    
    this.isFocused = true;
    this.render();
    this.showProgressTooltip();
    
    // Announce to screen readers
    const percentage = Math.round(this.currentProgress * 100);
    const current = this.formatValue(this.data.current || 0);
    const target = this.formatValue(this.data.target || 100);
    const label = this.data.label || 'Progress';
    
    this.announceToScreenReader(`${label}: ${percentage}% complete. ${current} of ${target}`);
  }

  /**
   * Handle blur events
   */
  handleBlur(event) {
    if (this.isDestroyed) return;
    
    this.isFocused = false;
    this.hideTooltip();
    this.render();
  }

  /**
   * Handle window resize
   */
  handleResize() {
    if (this.isDestroyed) return;
    
    this.updateCanvasSize();
    this.setupHighDPI();
    this.render();
  }

  /**
   * Calculate progress from data
   */
  calculateProgress() {
    const current = this.data.current || 0;
    const target = this.data.target || 100;
    
    this.targetProgress = Math.min(Math.max(current / target, 0), 1);
    
    // Update ARIA attributes
    this.canvas.setAttribute('aria-valuenow', Math.round(this.targetProgress * 100));
    this.canvas.setAttribute('aria-valuemin', '0');
    this.canvas.setAttribute('aria-valuemax', '100');
    this.canvas.setAttribute('aria-valuetext', `${Math.round(this.targetProgress * 100)}% complete`);
  }

  /**
   * Show tooltip with progress information
   */
  showProgressTooltip(event = null) {
    if (!this.tooltip || !this.options.showTooltip) return;
    
    const percentage = Math.round(this.currentProgress * 100);
    const current = this.formatValue(this.data.current || 0);
    const target = this.formatValue(this.data.target || 100);
    const remaining = this.formatValue(Math.max(0, (this.data.target || 100) - (this.data.current || 0)));
    const label = this.data.label || 'Progress';
    
    const tooltipContent = `
      <div class="tooltip-title">${label}</div>
      <div class="tooltip-progress">${percentage}% Complete</div>
      <div class="tooltip-current">Current: ${current}</div>
      <div class="tooltip-target">Target: ${target}</div>
      <div class="tooltip-remaining">Remaining: ${remaining}</div>
    `;
    
    let tooltipX, tooltipY;
    
    if (event) {
      // Use mouse/touch position
      const rect = this.canvas.getBoundingClientRect();
      tooltipX = rect.left + rect.width / 2;
      tooltipY = rect.top - 10;
    } else {
      // Use ring center position (for keyboard navigation)
      const containerRect = this.container.getBoundingClientRect();
      tooltipX = containerRect.left + containerRect.width / 2;
      tooltipY = containerRect.top - 10;
    }
    
    this.showTooltip(tooltipX, tooltipY, tooltipContent);
  }

  /**
   * Show tooltip at position
   */
  showTooltip(x, y, content) {
    if (!this.tooltip) return;
    
    this.tooltip.innerHTML = content;
    
    // Position tooltip
    const tooltipRect = this.tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    
    // Center horizontally above the ring
    let finalX = x - tooltipRect.width / 2;
    if (finalX < 10) finalX = 10;
    if (finalX + tooltipRect.width > viewportWidth - 10) {
      finalX = viewportWidth - tooltipRect.width - 10;
    }
    
    let finalY = y - tooltipRect.height - 10;
    if (finalY < 10) {
      finalY = y + 50; // Show below if no room above
    }
    
    this.tooltip.style.left = finalX + 'px';
    this.tooltip.style.top = finalY + 'px';
    this.tooltip.style.opacity = '1';
    this.tooltip.style.transform = 'translateY(0)';
  }

  /**
   * Hide tooltip
   */
  hideTooltip() {
    if (!this.tooltip) return;
    
    this.tooltip.style.opacity = '0';
    this.tooltip.style.transform = 'translateY(8px)';
  }

  /**
   * Announce text to screen readers
   */
  announceToScreenReader(text) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    announcement.textContent = text;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  /**
   * Main render function
   */
  render() {
    this.animate();
  }

  /**
   * Animate chart rendering
   */
  animate(duration = this.options.animate ? 1500 : 0) {
    if (!this.options.animate || duration === 0) {
      this.animationProgress = 1;
      this.currentProgress = this.targetProgress;
      this.renderChart();
      return;
    }
    
    this.isAnimating = true;
    this.animationProgress = 0;
    
    const startTime = Date.now();
    const startProgress = this.currentProgress;
    const progressDiff = this.targetProgress - startProgress;
    
    const animateFrame = () => {
      if (this.isDestroyed) return;
      
      const elapsed = Date.now() - startTime;
      this.animationProgress = Math.min(elapsed / duration, 1);
      
      // Apply easing function
      const easedProgress = this.easeOutCubic(this.animationProgress);
      
      // Update current progress
      this.currentProgress = startProgress + (progressDiff * easedProgress);
      
      // Clear canvas and render with animation progress
      this.ctx.clearRect(0, 0, this.options.width, this.options.height);
      this.renderChart(easedProgress);
      
      if (this.animationProgress < 1) {
        this.animationId = requestAnimationFrame(animateFrame);
      } else {
        this.isAnimating = false;
        this.animationId = null;
        this.currentProgress = this.targetProgress;
      }
    };
    
    this.animationId = requestAnimationFrame(animateFrame);
  }

  /**
   * Easing function for smooth animations
   */
  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Render chart content
   */
  renderChart(animationProgress = 1) {
    const centerX = this.options.width / 2;
    const centerY = this.options.height / 2;
    const radius = Math.min(this.options.width, this.options.height) / 2 - 
                   this.options.margin - this.options.strokeWidth / 2;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.options.width, this.options.height);
    
    // Draw background ring
    this.drawBackgroundRing(centerX, centerY, radius);
    
    // Draw progress ring
    this.drawProgressRing(centerX, centerY, radius);
    
    // Draw milestones if specified
    if (this.data.milestones) {
      this.drawMilestones(centerX, centerY, radius);
    }
    
    // Draw center content
    this.drawCenterContent(centerX, centerY, radius);
    
    // Draw glow effect if hovered or focused
    if (this.isHovered || this.isFocused) {
      this.drawGlowEffect(centerX, centerY, radius);
    }
  }

  /**
   * Draw background ring
   */
  drawBackgroundRing(centerX, centerY, radius) {
    this.ctx.strokeStyle = this.options.backgroundColor;
    this.ctx.lineWidth = this.options.strokeWidth;
    this.ctx.lineCap = 'round';
    
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    this.ctx.stroke();
  }

  /**
   * Draw progress ring
   */
  drawProgressRing(centerX, centerY, radius) {
    if (this.currentProgress <= 0) return;
    
    const startAngle = this.options.startAngle;
    const endAngle = startAngle + (2 * Math.PI * this.currentProgress);
    
    // Get color based on progress or data
    const color = this.getProgressColor();
    
    // Create gradient for the progress ring
    const gradient = this.ctx.createLinearGradient(
      centerX - radius, centerY - radius,
      centerX + radius, centerY + radius
    );
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, this.lightenColor(color, 20));
    gradient.addColorStop(1, color);
    
    // Set style
    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = this.options.strokeWidth;
    this.ctx.lineCap = 'round';
    
    // Add subtle shadow for depth
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = this.isHovered || this.isFocused ? 15 : 8;
    
    // Draw progress arc
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    this.ctx.stroke();
    
    // Reset shadow
    this.ctx.shadowBlur = 0;
    
    // Add end cap circle for polished look
    if (this.currentProgress > 0.01) {
      const endX = centerX + Math.cos(endAngle) * radius;
      const endY = centerY + Math.sin(endAngle) * radius;
      
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(endX, endY, this.options.strokeWidth / 2, 0, 2 * Math.PI);
      this.ctx.fill();
    }
  }

  /**
   * Draw milestone markers
   */
  drawMilestones(centerX, centerY, radius) {
    if (!this.data.milestones || !Array.isArray(this.data.milestones)) return;
    
    this.data.milestones.forEach(milestone => {
      const progress = milestone.progress || 0;
      const angle = this.options.startAngle + (2 * Math.PI * progress);
      
      // Calculate marker position
      const innerRadius = radius - this.options.strokeWidth / 2 - 3;
      const outerRadius = radius + this.options.strokeWidth / 2 + 3;
      
      const innerX = centerX + Math.cos(angle) * innerRadius;
      const innerY = centerY + Math.sin(angle) * innerRadius;
      const outerX = centerX + Math.cos(angle) * outerRadius;
      const outerY = centerY + Math.sin(angle) * outerRadius;
      
      // Draw milestone marker
      this.ctx.strokeStyle = milestone.color || '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(innerX, innerY);
      this.ctx.lineTo(outerX, outerY);
      this.ctx.stroke();
      
      // Draw milestone label if specified
      if (milestone.label) {
        const labelRadius = radius + this.options.strokeWidth / 2 + 15;
        const labelX = centerX + Math.cos(angle) * labelRadius;
        const labelY = centerY + Math.sin(angle) * labelRadius;
        
        this.ctx.fillStyle = 'var(--text-tertiary)';
        this.ctx.font = '10px var(--font-primary)';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(milestone.label, labelX, labelY);
      }
    });
  }

  /**
   * Draw center content
   */
  drawCenterContent(centerX, centerY, radius) {
    // Draw percentage
    if (this.options.showPercentage) {
      const percentage = Math.round(this.currentProgress * 100);
      
      this.ctx.font = this.getPercentageFontSize(radius);
      this.ctx.fillStyle = 'var(--text-primary)';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      
      // Add pulsing effect when hovered
      if (this.isHovered && !this.isAnimating) {
        const pulse = Math.sin(Date.now() * 0.005) * 0.1 + 1;
        this.ctx.save();
        this.ctx.scale(pulse, pulse);
        this.ctx.fillText(`${percentage}%`, centerX / pulse, centerY / pulse);
        this.ctx.restore();
      } else {
        this.ctx.fillText(`${percentage}%`, centerX, centerY);
      }
    }
    
    // Draw label
    if (this.options.showLabel && this.data.label) {
      this.ctx.font = '14px var(--font-primary)';
      this.ctx.fillStyle = 'var(--text-secondary)';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      
      const labelY = centerY + (this.options.showPercentage ? 25 : 0);
      this.ctx.fillText(this.data.label, centerX, labelY);
    }
    
    // Draw current/target values
    if (this.options.showValue || this.options.showTarget) {
      this.ctx.font = '12px var(--font-primary)';
      this.ctx.fillStyle = 'var(--text-tertiary)';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      
      let valueText = '';
      if (this.options.showValue && this.options.showTarget) {
        const current = this.formatValue(this.data.current || 0);
        const target = this.formatValue(this.data.target || 100);
        valueText = `${current} / ${target}`;
      } else if (this.options.showValue) {
        valueText = this.formatValue(this.data.current || 0);
      } else if (this.options.showTarget) {
        valueText = `Target: ${this.formatValue(this.data.target || 100)}`;
      }
      
      const valueY = centerY + (this.options.showLabel ? 45 : 20);
      this.ctx.fillText(valueText, centerX, valueY);
    }
  }

  /**
   * Draw glow effect for hover/focus states
   */
  drawGlowEffect(centerX, centerY, radius) {
    if (this.currentProgress <= 0) return;
    
    const startAngle = this.options.startAngle;
    const endAngle = startAngle + (2 * Math.PI * this.currentProgress);
    const color = this.getProgressColor();
    
    // Create glow effect
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = this.options.strokeWidth + 4;
    this.ctx.lineCap = 'round';
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 20;
    this.ctx.globalAlpha = 0.3;
    
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    this.ctx.stroke();
    
    // Reset effects
    this.ctx.globalAlpha = 1;
    this.ctx.shadowBlur = 0;
  }

  /**
   * Get progress color based on completion percentage
   */
  getProgressColor() {
    if (this.data.color) {
      return this.data.color;
    }
    
    // Color based on progress percentage
    const percentage = this.currentProgress;
    
    if (percentage >= 1.0) return '#10b981'; // Green - Complete
    if (percentage >= 0.8) return '#3b82f6'; // Blue - Nearly there
    if (percentage >= 0.6) return '#8b5cf6'; // Purple - Good progress
    if (percentage >= 0.4) return '#f59e0b'; // Orange - Getting there
    return '#ef4444'; // Red - Just started
  }

  /**
   * Get appropriate font size for percentage based on ring size
   */
  getPercentageFontSize(radius) {
    const baseFontSize = Math.max(16, Math.min(32, radius / 3));
    return `bold ${baseFontSize}px var(--font-primary)`;
  }

  /**
   * Format value for display
   */
  formatValue(value) {
    if (this.options.currency && this.options.currency !== 'none') {
      return this.formatCurrency(value);
    }
    return this.formatNumber(value);
  }

  /**
   * Format currency value
   */
  formatCurrency(value) {
    try {
      return new Intl.NumberFormat(this.options.locale, {
        style: 'currency',
        currency: this.options.currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: value < 1000 ? 2 : 0
      }).format(Math.abs(value));
    } catch (error) {
      return `$${Math.abs(value).toFixed(2)}`;
    }
  }

  /**
   * Format number with locale
   */
  formatNumber(value) {
    try {
      return new Intl.NumberFormat(this.options.locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(value);
    } catch (error) {
      return value.toFixed(2);
    }
  }

  /**
   * Lighten color for gradient effects
   */
  lightenColor(color, amount) {
    if (color.startsWith('#')) {
      const num = parseInt(color.slice(1), 16);
      const r = Math.min(255, (num >> 16) + amount);
      const g = Math.min(255, ((num >> 8) & 0x00FF) + amount);
      const b = Math.min(255, (num & 0x0000FF) + amount);
      return `rgb(${r}, ${g}, ${b})`;
    }
    return color;
  }

  /**
   * Update progress data
   */
  updateData(newData, animate = true) {
    this.data = { ...this.data, ...newData };
    this.calculateProgress();
    
    if (animate) {
      this.animate();
    } else {
      this.currentProgress = this.targetProgress;
      this.render();
    }
  }

  /**
   * Update chart options
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    this.updateCanvasSize();
    this.render();
  }

  /**
   * Set progress directly (0-1)
   */
  setProgress(progress, animate = true) {
    this.data.current = progress * (this.data.target || 100);
    this.updateData(this.data, animate);
  }

  /**
   * Increment progress by amount
   */
  incrementProgress(amount, animate = true) {
    const newCurrent = (this.data.current || 0) + amount;
    this.updateData({ current: newCurrent }, animate);
  }

  /**
   * Resize chart
   */
  resize(width, height) {
    const size = width && height ? Math.min(width, height) : (width || height);
    if (size) {
      this.options.width = size;
      this.options.height = size;
    }
    this.updateCanvasSize();
    this.setupHighDPI();
    this.render();
  }

  /**
   * Export chart as image
   */
  exportAsImage(filename = 'progress-ring.png') {
    const link = document.createElement('a');
    link.download = filename;
    link.href = this.canvas.toDataURL('image/png');
    link.click();
  }

  /**
   * Get progress statistics
   */
  getStatistics() {
    const current = this.data.current || 0;
    const target = this.data.target || 100