/**
 * 🥧 SmartFinanceAI - Pie Chart Component
 * File: src/components/charts/pie-chart.js
 * 
 * Interactive pie chart component for displaying financial category breakdowns.
 * Perfect for expense categories, budget allocations, and portfolio distributions.
 * 
 * Features:
 * - Smooth animations with slice expansion effects
 * - Interactive hover with slice highlighting
 * - Customizable donut mode (inner radius)
 * - Multi-currency support with proper formatting
 * - Responsive design for all screen sizes
 * - Touch-friendly for mobile devices
 * - Glassmorphism styling matching app design
 * - Real-time data updates with smooth transitions
 * - Accessibility features with keyboard navigation
 * - Label positioning with connection lines
 * - Percentage and value display options
 * 
 * Usage:
 * const pieChart = new PieChart(container, data, options);
 * pieChart.render();
 * 
 * @author SmartFinanceAI Team
 * @version 1.0.0
 */

class PieChart {
  constructor(container, data, options = {}) {
    this.container = container;
    this.data = data;
    this.options = {
      width: 400,
      height: 400,
      margin: { top: 20, right: 80, bottom: 20, left: 80 },
      animate: true,
      responsive: true,
      showTooltip: true,
      showLabels: true,
      showPercentages: true,
      showValues: true,
      labelDistance: 1.3,
      innerRadius: 0, // Set to > 0 for donut chart
      startAngle: -Math.PI / 2, // Start from top
      colors: ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'],
      currency: 'USD',
      locale: 'en-US',
      minSliceAngle: 0.05, // Minimum angle for tiny slices (radians)
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
    this.hoveredSlice = null;
    this.selectedSlice = null;
    this.slices = [];
    this.currentSliceIndex = 0; // For keyboard navigation
    
    // Initialize the chart
    this.initialize();
  }

  /**
   * Initialize chart canvas and context
   */
  initialize() {
    // Create canvas element
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'pie-chart-canvas';
    this.canvas.setAttribute('role', 'img');
    this.canvas.setAttribute('aria-label', 'Financial category breakdown pie chart');
    
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
    
    // Clear container and add canvas
    this.container.innerHTML = '';
    this.container.appendChild(this.canvas);
    
    // Set container styles
    this.container.style.position = 'relative';
    this.container.style.display = 'block';
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
    this.tooltip.className = 'pie-chart-tooltip glass';
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
      max-width: 220px;
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
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    
    // Touch events for mobile
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    
    // Keyboard events for accessibility
    this.canvas.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Make canvas focusable
    this.canvas.tabIndex = 0;
    
    // Window resize for responsive behavior
    window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 250));
  }

  /**
   * Handle mouse move events
   */
  handleMouseMove(event) {
    if (this.isDestroyed) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    this.detectSliceHover(x, y, event);
  }

  /**
   * Handle mouse leave events
   */
  handleMouseLeave(event) {
    if (this.isDestroyed) return;
    this.clearHover();
  }

  /**
   * Handle click events
   */
  handleClick(event) {
    if (this.isDestroyed) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    this.handleSliceSelection(x, y, event);
  }

  /**
   * Handle touch events
   */
  handleTouchStart(event) {
    event.preventDefault();
    if (this.isDestroyed) return;
    
    const touch = event.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    this.detectSliceHover(x, y, event);
  }

  handleTouchMove(event) {
    event.preventDefault();
    if (this.isDestroyed) return;
    
    const touch = event.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    this.detectSliceHover(x, y, event);
  }

  handleTouchEnd(event) {
    event.preventDefault();
    if (this.isDestroyed) return;
    
    setTimeout(() => this.clearHover(), 1000); // Clear hover after 1 second on mobile
  }

  /**
   * Handle keyboard events for accessibility
   */
  handleKeyDown(event) {
    if (this.isDestroyed || this.slices.length === 0) return;
    
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        this.currentSliceIndex = Math.max(0, this.currentSliceIndex - 1);
        this.highlightSlice(this.currentSliceIndex);
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        this.currentSliceIndex = Math.min(this.slices.length - 1, this.currentSliceIndex + 1);
        this.highlightSlice(this.currentSliceIndex);
        break;
      case 'Home':
        event.preventDefault();
        this.currentSliceIndex = 0;
        this.highlightSlice(this.currentSliceIndex);
        break;
      case 'End':
        event.preventDefault();
        this.currentSliceIndex = this.slices.length - 1;
        this.highlightSlice(this.currentSliceIndex);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.selectSlice(this.currentSliceIndex);
        break;
      case 'Escape':
        event.preventDefault();
        this.clearHover();
        this.canvas.blur();
        break;
    }
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
   * Calculate slice data and positions
   */
  calculateSlices() {
    const centerX = this.options.width / 2;
    const centerY = this.options.height / 2;
    const outerRadius = Math.min(this.options.width, this.options.height) / 2 - 
                       Math.max(this.options.margin.left, this.options.margin.right);
    const innerRadius = outerRadius * this.options.innerRadius;
    
    const data = this.data.data || [];
    const labels = this.data.labels || [];
    const total = data.reduce((sum, value) => sum + Math.abs(value), 0);
    
    if (total === 0) {
      this.slices = [];
      return;
    }
    
    let currentAngle = this.options.startAngle;
    this.slices = [];
    
    data.forEach((value, index) => {
      const absoluteValue = Math.abs(value);
      const percentage = absoluteValue / total;
      let sliceAngle = percentage * 2 * Math.PI;
      
      // Ensure minimum slice angle for visibility
      if (sliceAngle < this.options.minSliceAngle && percentage > 0) {
        sliceAngle = this.options.minSliceAngle;
      }
      
      const color = this.options.colors[index % this.options.colors.length];
      const midAngle = currentAngle + sliceAngle / 2;
      
      this.slices.push({
        value: absoluteValue,
        originalValue: value,
        percentage: percentage,
        startAngle: currentAngle,
        endAngle: currentAngle + sliceAngle,
        midAngle: midAngle,
        centerX: centerX,
        centerY: centerY,
        outerRadius: outerRadius,
        innerRadius: innerRadius,
        color: color,
        label: labels[index] || `Category ${index + 1}`,
        index: index
      });
      
      currentAngle += sliceAngle;
    });
  }

  /**
   * Detect hover over pie slices
   */
  detectSliceHover(x, y, event) {
    const centerX = this.options.width / 2;
    const centerY = this.options.height / 2;
    
    // Calculate distance from center and angle
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    let angle = Math.atan2(dy, dx);
    
    // Normalize angle to match our start angle
    angle = angle - this.options.startAngle;
    if (angle < 0) angle += 2 * Math.PI;
    if (angle >= 2 * Math.PI) angle -= 2 * Math.PI;
    
    let hoveredSlice = null;
    
    // Check if within pie bounds
    if (this.slices.length > 0 && 
        distance >= this.slices[0].innerRadius && 
        distance <= this.slices[0].outerRadius + 15) { // Allow some tolerance
      
      // Find which slice the mouse is over
      for (const slice of this.slices) {
        let sliceStartAngle = slice.startAngle - this.options.startAngle;
        let sliceEndAngle = slice.endAngle - this.options.startAngle;
        
        // Normalize slice angles
        if (sliceStartAngle < 0) sliceStartAngle += 2 * Math.PI;
        if (sliceEndAngle < 0) sliceEndAngle += 2 * Math.PI;
        if (sliceStartAngle >= 2 * Math.PI) sliceStartAngle -= 2 * Math.PI;
        if (sliceEndAngle >= 2 * Math.PI) sliceEndAngle -= 2 * Math.PI;
        
        // Handle wrap-around case
        if (sliceEndAngle < sliceStartAngle) {
          if (angle >= sliceStartAngle || angle <= sliceEndAngle) {
            hoveredSlice = slice;
            break;
          }
        } else {
          if (angle >= sliceStartAngle && angle <= sliceEndAngle) {
            hoveredSlice = slice;
            break;
          }
        }
      }
    }
    
    if (hoveredSlice !== this.hoveredSlice) {
      this.hoveredSlice = hoveredSlice;
      this.currentSliceIndex = hoveredSlice ? hoveredSlice.index : 0;
      this.render();
      
      if (hoveredSlice) {
        this.showSliceTooltip(hoveredSlice, event);
      } else {
        this.hideTooltip();
      }
    }
  }

  /**
   * Clear hover state
   */
  clearHover() {
    if (this.hoveredSlice) {
      this.hoveredSlice = null;
      this.hideTooltip();
      this.render();
    }
  }

  /**
   * Highlight slice for keyboard navigation
   */
  highlightSlice(sliceIndex) {
    if (sliceIndex < 0 || sliceIndex >= this.slices.length) return;
    
    this.hoveredSlice = this.slices[sliceIndex];
    this.render();
    this.showSliceTooltip(this.hoveredSlice);
    
    // Announce to screen readers
    const slice = this.slices[sliceIndex];
    const percentage = (slice.percentage * 100).toFixed(1);
    const value = this.formatCurrency(slice.value);
    this.announceToScreenReader(`${slice.label}: ${percentage}%, ${value}`);
  }

  /**
   * Select slice
   */
  selectSlice(sliceIndex) {
    if (sliceIndex < 0 || sliceIndex >= this.slices.length) return;
    
    this.selectedSlice = this.slices[sliceIndex];
    this.render();
    
    // Dispatch custom event
    const event = new CustomEvent('pieChartSliceSelected', {
      detail: {
        sliceIndex,
        value: this.selectedSlice.value,
        label: this.selectedSlice.label,
        percentage: this.selectedSlice.percentage
      }
    });
    this.container.dispatchEvent(event);
  }

  /**
   * Handle slice selection from click
   */
  handleSliceSelection(x, y, event) {
    if (this.hoveredSlice) {
      this.selectSlice(this.hoveredSlice.index);
    }
  }

  /**
   * Show tooltip for slice
   */
  showSliceTooltip(slice, event = null) {
    if (!this.tooltip || !this.options.showTooltip) return;
    
    const percentage = (slice.percentage * 100).toFixed(1);
    const value = this.formatCurrency(slice.value);
    
    const tooltipContent = `
      <div class="tooltip-title">${slice.label}</div>
      <div class="tooltip-percentage">${percentage}%</div>
      <div class="tooltip-value">${value}</div>
    `;
    
    let tooltipX, tooltipY;
    
    if (event) {
      // Use mouse/touch position
      const rect = this.canvas.getBoundingClientRect();
      tooltipX = rect.left + slice.centerX + Math.cos(slice.midAngle) * (slice.outerRadius * 0.8);
      tooltipY = rect.top + slice.centerY + Math.sin(slice.midAngle) * (slice.outerRadius * 0.8);
    } else {
      // Use slice center position (for keyboard navigation)
      const containerRect = this.container.getBoundingClientRect();
      tooltipX = containerRect.left + slice.centerX + Math.cos(slice.midAngle) * (slice.outerRadius * 0.8);
      tooltipY = containerRect.top + slice.centerY + Math.sin(slice.midAngle) * (slice.outerRadius * 0.8);
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
    const viewportHeight = window.innerHeight;
    
    // Adjust horizontal position
    let finalX = x + 10;
    if (finalX + tooltipRect.width > viewportWidth) {
      finalX = x - tooltipRect.width - 10;
    }
    
    // Adjust vertical position
    let finalY = y - 10;
    if (finalY < 0) {
      finalY = y + 20;
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
  animate(duration = this.options.animate ? 1000 : 0) {
    if (!this.options.animate || duration === 0) {
      this.animationProgress = 1;
      this.renderChart();
      return;
    }
    
    this.isAnimating = true;
    this.animationProgress = 0;
    
    const startTime = Date.now();
    
    const animateFrame = () => {
      if (this.isDestroyed) return;
      
      const elapsed = Date.now() - startTime;
      this.animationProgress = Math.min(elapsed / duration, 1);
      
      // Apply easing function
      const easedProgress = this.easeOutBack(this.animationProgress);
      
      // Clear canvas and render with animation progress
      this.ctx.clearRect(0, 0, this.options.width, this.options.height);
      this.renderChart(easedProgress);
      
      if (this.animationProgress < 1) {
        this.animationId = requestAnimationFrame(animateFrame);
      } else {
        this.isAnimating = false;
        this.animationId = null;
      }
    };
    
    this.animationId = requestAnimationFrame(animateFrame);
  }

  /**
   * Easing function for smooth animations with slight bounce
   */
  easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  /**
   * Render chart content
   */
  renderChart(animationProgress = 1) {
    // Calculate slices
    this.calculateSlices();
    
    if (this.slices.length === 0) {
      this.renderEmptyState();
      return;
    }
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.options.width, this.options.height);
    
    // Draw slices
    this.drawSlices(animationProgress);
    
    // Draw labels
    if (this.options.showLabels) {
      this.drawLabels(animationProgress);
    }
    
    // Draw center content for donut charts
    if (this.options.innerRadius > 0) {
      this.drawCenterContent();
    }
  }

  /**
   * Render empty state
   */
  renderEmptyState() {
    this.ctx.clearRect(0, 0, this.options.width, this.options.height);
    
    // Draw empty circle
    const centerX = this.options.width / 2;
    const centerY = this.options.height / 2;
    const radius = Math.min(this.options.width, this.options.height) / 4;
    
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
    
    // Draw empty text
    this.ctx.fillStyle = 'var(--text-tertiary)';
    this.ctx.font = '14px var(--font-primary)';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('No data available', centerX, centerY);
  }

  /**
   * Draw pie slices
   */
  drawSlices(animationProgress) {
    this.slices.forEach((slice, index) => {
      // Calculate animated angles
      const animatedStartAngle = slice.startAngle;
      const animatedEndAngle = slice.startAngle + 
        (slice.endAngle - 