/**
 * 📈 SmartFinanceAI - Line Chart Component
 * File: src/components/charts/line-chart.js
 * 
 * Interactive line chart component for displaying financial trends over time.
 * Perfect for spending trends, income tracking, and goal progress visualization.
 * 
 * Features:
 * - Smooth animations with easing functions
 * - Interactive hover effects and tooltips
 * - Multi-dataset support with different colors
 * - Responsive design for all screen sizes
 * - Touch-friendly for mobile devices
 * - Glassmorphism styling matching app design
 * - Real-time data updates
 * - Multi-currency formatting
 * - Accessibility features with keyboard navigation
 * - Customizable grid, axes, and styling options
 * 
 * Usage:
 * const lineChart = new LineChart(container, data, options);
 * lineChart.render();
 * 
 * @author SmartFinanceAI Team
 * @version 1.0.0
 */

class LineChart {
  constructor(container, data, options = {}) {
    this.container = container;
    this.data = data;
    this.options = {
      width: 600,
      height: 400,
      margin: { top: 20, right: 30, bottom: 60, left: 80 },
      animate: true,
      responsive: true,
      showTooltip: true,
      showLegend: true,
      showGrid: true,
      showPoints: true,
      smooth: true,
      fillArea: false,
      lineWidth: 3,
      pointRadius: 5,
      colors: ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'],
      currency: 'USD',
      locale: 'en-US',
      ...options
    };
    
    // Canvas and context
    this.canvas = null;
    this.ctx = null;
    this.tooltip = null;
    this.isDestroyed = false;
    
    // Animation state
    this.animationId = null;
    this.animationProgress = 0;
    this.isAnimating = false;
    
    // Interaction state
    this.hoveredPoint = null;
    this.selectedPoint = null;
    this.currentDataIndex = 0;
    
    // Scales
    this.xScale = null;
    this.yScale = null;
    
    this.initialize();
  }

  /**
   * Initialize the chart
   */
  initialize() {
    this.createCanvas();
    this.createTooltip();
    this.addEventListeners();
    this.updateCanvasSize();
    this.setupHighDPI();
    
    // Clear container and add canvas
    this.container.innerHTML = '';
    this.container.appendChild(this.canvas);
    this.container.style.position = 'relative';
  }

  /**
   * Create canvas element
   */
  createCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'line-chart-canvas';
    this.canvas.setAttribute('role', 'img');
    this.canvas.setAttribute('aria-label', 'Financial trend line chart');
    this.canvas.tabIndex = 0; // Make focusable
    this.ctx = this.canvas.getContext('2d');
  }

  /**
   * Create tooltip element
   */
  createTooltip() {
    if (!this.options.showTooltip) return;
    
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'line-chart-tooltip glass';
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
      max-width: 200px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    `;
    
    document.body.appendChild(this.tooltip);
  }

  /**
   * Add event listeners
   */
  addEventListeners() {
    // Mouse events
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    
    // Touch events
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    
    // Keyboard events
    this.canvas.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Resize
    window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 250));
  }

  /**
   * Update canvas size
   */
  updateCanvasSize() {
    if (this.options.responsive) {
      const rect = this.container.getBoundingClientRect();
      this.options.width = rect.width || this.options.width;
      this.options.height = rect.height || this.options.height;
    }
    
    this.canvas.width = this.options.width;
    this.canvas.height = this.options.height;
    this.canvas.style.width = this.options.width + 'px';
    this.canvas.style.height = this.options.height + 'px';
  }

  /**
   * Setup high DPI displays
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
   * Calculate scales
   */
  calculateScales() {
    const { width, height, margin } = this.options;
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    // X Scale (usually time/categories)
    const dataLength = this.getDataLength();
    this.xScale = {
      domain: [0, dataLength - 1],
      range: [margin.left, margin.left + chartWidth],
      scale: (value) => {
        if (dataLength <= 1) return margin.left + chartWidth / 2;
        return margin.left + (value / (dataLength - 1)) * chartWidth;
      }
    };
    
    // Y Scale (values)
    const { min, max } = this.getDataDomain();
    const padding = (max - min) * 0.1 || 10;
    
    this.yScale = {
      domain: [min - padding, max + padding],
      range: [margin.top + chartHeight, margin.top],
      scale: (value) => {
        const ratio = (value - (min - padding)) / ((max + padding) - (min - padding));
        return margin.top + chartHeight - (ratio * chartHeight);
      }
    };
  }

  /**
   * Get data length
   */
  getDataLength() {
    if (this.data.datasets && this.data.datasets.length > 0) {
      return this.data.datasets[0].data.length;
    }
    return this.data.data ? this.data.data.length : 0;
  }

  /**
   * Get data domain (min/max values)
   */
  getDataDomain() {
    let allValues = [];
    
    if (this.data.datasets) {
      this.data.datasets.forEach(dataset => {
        allValues = allValues.concat(dataset.data || []);
      });
    } else if (this.data.data) {
      allValues = this.data.data;
    }
    
    if (allValues.length === 0) {
      return { min: 0, max: 100 };
    }
    
    return {
      min: Math.min(0, Math.min(...allValues)),
      max: Math.max(...allValues)
    };
  }

  /**
   * Handle mouse move
   */
  handleMouseMove(event) {
    if (this.isDestroyed) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    this.detectHover(x, y, event);
  }

  /**
   * Handle mouse leave
   */
  handleMouseLeave() {
    if (this.isDestroyed) return;
    this.clearHover();
  }

  /**
   * Handle click
   */
  handleClick(event) {
    if (this.isDestroyed) return;
    
    if (this.hoveredPoint) {
      this.selectedPoint = { ...this.hoveredPoint };
      this.render();
      
      // Dispatch custom event
      this.container.dispatchEvent(new CustomEvent('lineChartPointSelected', {
        detail: this.selectedPoint
      }));
    }
  }

  /**
   * Handle touch start
   */
  handleTouchStart(event) {
    event.preventDefault();
    if (this.isDestroyed) return;
    
    const touch = event.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    this.detectHover(x, y, event);
  }

  /**
   * Handle touch move
   */
  handleTouchMove(event) {
    event.preventDefault();
    if (this.isDestroyed) return;
    
    const touch = event.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    this.detectHover(x, y, event);
  }

  /**
   * Handle touch end
   */
  handleTouchEnd(event) {
    event.preventDefault();
    setTimeout(() => this.clearHover(), 1000);
  }

  /**
   * Handle keyboard navigation
   */
  handleKeyDown(event) {
    if (this.isDestroyed) return;
    
    const dataLength = this.getDataLength();
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.currentDataIndex = Math.max(0, this.currentDataIndex - 1);
        this.highlightDataPoint();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.currentDataIndex = Math.min(dataLength - 1, this.currentDataIndex + 1);
        this.highlightDataPoint();
        break;
      case 'Home':
        event.preventDefault();
        this.currentDataIndex = 0;
        this.highlightDataPoint();
        break;
      case 'End':
        event.preventDefault();
        this.currentDataIndex = dataLength - 1;
        this.highlightDataPoint();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.hoveredPoint) {
          this.handleClick();
        }
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
   * Detect hover over data points
   */
  detectHover(x, y, event) {
    const datasets = this.data.datasets || [{ data: this.data.data || [], label: 'Data' }];
    
    let closestPoint = null;
    let minDistance = Infinity;
    
    datasets.forEach((dataset, datasetIndex) => {
      dataset.data.forEach((value, pointIndex) => {
        const px = this.xScale.scale(pointIndex);
        const py = this.yScale.scale(value);
        const distance = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
        
        if (distance < 25 && distance < minDistance) {
          minDistance = distance;
          closestPoint = {
            datasetIndex,
            pointIndex,
            value,
            x: px,
            y: py,
            label: this.data.labels ? this.data.labels[pointIndex] : `Point ${pointIndex + 1}`,
            datasetLabel: dataset.label || `Dataset ${datasetIndex + 1}`
          };
        }
      });
    });
    
    if (closestPoint !== this.hoveredPoint) {
      this.hoveredPoint = closestPoint;
      this.currentDataIndex = closestPoint ? closestPoint.pointIndex : 0;
      this.render();
      
      if (closestPoint) {
        this.showTooltip(closestPoint, event);
      } else {
        this.hideTooltip();
      }
    }
  }

  /**
   * Clear hover state
   */
  clearHover() {
    if (this.hoveredPoint) {
      this.hoveredPoint = null;
      this.hideTooltip();
      this.render();
    }
  }

  /**
   * Highlight data point for keyboard navigation
   */
  highlightDataPoint() {
    const datasets = this.data.datasets || [{ data: this.data.data || [] }];
    if (datasets.length === 0 || this.currentDataIndex >= datasets[0].data.length) return;
    
    const value = datasets[0].data[this.currentDataIndex];
    const x = this.xScale.scale(this.currentDataIndex);
    const y = this.yScale.scale(value);
    
    this.hoveredPoint = {
      datasetIndex: 0,
      pointIndex: this.currentDataIndex,
      value,
      x,
      y,
      label: this.data.labels ? this.data.labels[this.currentDataIndex] : `Point ${this.currentDataIndex + 1}`,
      datasetLabel: datasets[0].label || 'Data'
    };
    
    this.render();
    this.showTooltip(this.hoveredPoint);
    
    // Announce to screen reader
    const formattedValue = this.formatValue(value);
    this.announceToScreenReader(`${this.hoveredPoint.label}: ${formattedValue}`);
  }

  /**
   * Show tooltip
   */
  showTooltip(point, event = null) {
    if (!this.tooltip || !this.options.showTooltip) return;
    
    const value = this.formatValue(point.value);
    
    const tooltipContent = `
      <div class="tooltip-title">${point.label}</div>
      ${point.datasetLabel && this.data.datasets && this.data.datasets.length > 1 ? 
        `<div class="tooltip-series">${point.datasetLabel}</div>` : ''}
      <div class="tooltip-value">${value}</div>
    `;
    
    let tooltipX, tooltipY;
    
    if (event) {
      const rect = this.canvas.getBoundingClientRect();
      tooltipX = rect.left + point.x;
      tooltipY = rect.top + point.y;
    } else {
      const containerRect = this.container.getBoundingClientRect();
      tooltipX = containerRect.left + point.x;
      tooltipY = containerRect.top + point.y;
    }
    
    this.positionTooltip(tooltipX, tooltipY, tooltipContent);
  }

  /**
   * Position tooltip
   */
  positionTooltip(x, y, content) {
    if (!this.tooltip) return;
    
    this.tooltip.innerHTML = content;
    
    // Get tooltip dimensions
    this.tooltip.style.opacity = '0';
    this.tooltip.style.visibility = 'visible';
    const rect = this.tooltip.getBoundingClientRect();
    
    // Adjust position to stay in viewport
    let finalX = x + 10;
    let finalY = y - 10;
    
    if (finalX + rect.width > window.innerWidth) {
      finalX = x - rect.width - 10;
    }
    
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
   * Announce to screen reader
   */
  announceToScreenReader(text) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    announcement.textContent = text;
    
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  }

  /**
   * Format value for display
   */
  formatValue(value) {
    if (this.options.currency && this.options.currency !== 'none') {
      return new Intl.NumberFormat(this.options.locale, {
        style: 'currency',
        currency: this.options.currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: value < 1000 ? 2 : 0
      }).format(Math.abs(value));
    }
    
    return new Intl.NumberFormat(this.options.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  }

  /**
   * Main render function
   */
  render() {
    if (this.options.animate && !this.isAnimating) {
      this.animate();
    } else {
      this.renderChart();
    }
  }

  /**
   * Animate chart
   */
  animate(duration = 800) {
    this.isAnimating = true;
    this.animationProgress = 0;
    
    const startTime = Date.now();
    
    const animateFrame = () => {
      if (this.isDestroyed) return;
      
      const elapsed = Date.now() - startTime;
      this.animationProgress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easedProgress = 1 - Math.pow(1 - this.animationProgress, 3);
      
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
   * Render chart content
   */
  renderChart(animationProgress = 1) {
    // Calculate scales
    this.calculateScales();
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.options.width, this.options.height);
    
    // Draw grid
    if (this.options.showGrid) {
      this.drawGrid();
    }
    
    // Draw axes
    this.drawAxes();
    
    // Draw datasets
    this.drawDatasets(animationProgress);
    
    // Draw legend
    if (this.options.showLegend) {
      this.drawLegend();
    }
  }

  /**
   * Draw grid
   */
  drawGrid() {
    const { width, height, margin } = this.options;
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([2, 2]);
    
    // Horizontal grid lines
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const y = margin.top + (i / ySteps) * chartHeight;
      this.ctx.beginPath();
      this.ctx.moveTo(margin.left, y);
      this.ctx.lineTo(margin.left + chartWidth, y);
      this.ctx.stroke();
    }
    
    // Vertical grid lines
    const dataLength = this.getDataLength();
    const xSteps = Math.min(dataLength - 1, 8);
    for (let i = 0; i <= xSteps; i++) {
      const x = margin.left + (i / xSteps) * chartWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(x, margin.top);
      this.ctx.lineTo(x, margin.top + chartHeight);
      this.ctx.stroke();
    }
    
    this.ctx.setLineDash([]);
  }

  /**
   * Draw axes
   */
  drawAxes() {
    const { width, height, margin } = this.options;
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.font = '12px var(--font-primary)';
    this.ctx.fillStyle = 'var(--text-tertiary)';
    
    // X-axis
    this.ctx.beginPath();
    this.ctx.moveTo(margin.left, margin.top + chartHeight);
    this.ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
    this.ctx.stroke();
    
    // X-axis labels
    if (this.data.labels) {
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'top';
      
      const labelStep = Math.max(1, Math.floor(this.data.labels.length / 8));
      this.data.labels.forEach((label, index) => {
        if (index % labelStep === 0) {
          const x = this.xScale.scale(index);
          const displayLabel = this.formatXLabel(label);
          this.ctx.fillText(displayLabel, x, margin.top + chartHeight + 8);
        }
      });
    }
    
    // Y-axis
    this.ctx.beginPath();
    this.ctx.moveTo(margin.left, margin.top);
    this.ctx.lineTo(margin.left, margin.top + chartHeight);
    this.ctx.stroke();
    
    // Y-axis labels
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';
    
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const value = this.yScale.domain[0] + (this.yScale.domain[1] - this.yScale.domain[0]) * i / ySteps;
      const y = this.yScale.scale(value);
      const displayValue = this.formatValue(value);
      this.ctx.fillText(displayValue, margin.left - 8, y);
    }
  }

  /**
   * Draw datasets
   */
  drawDatasets(animationProgress) {
    const datasets = this.data.datasets || [{ data: this.data.data || [], label: 'Data' }];
    
    datasets.forEach((dataset, datasetIndex) => {
      const color = dataset.color || this.options.colors[datasetIndex % this.options.colors.length];
      const data = dataset.data || [];
      
      if (data.length === 0) return;
      
      // Draw fill area first (if enabled)
      if (this.options.fillArea) {
        this.drawFillArea(data, color, animationProgress);
      }
      
      // Draw line
      this.drawLine(data, color, animationProgress);
      
      // Draw points
      if (this.options.showPoints) {
        this.drawPoints(data, color, datasetIndex, animationProgress);
      }
    });
  }

  /**
   * Draw fill area
   */
  drawFillArea(data, color, animationProgress) {
    const animatedLength = Math.floor(data.length * animationProgress);
    if (animatedLength < 2) return;
    
    const gradient = this.ctx.createLinearGradient(0, this.yScale.range[1], 0, this.yScale.range[0]);
    gradient.addColorStop(0, this.addAlpha(color, 0.3));
    gradient.addColorStop(1, this.addAlpha(color, 0.05));
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    
    // Start at bottom left
    this.ctx.moveTo(this.xScale.scale(0), this.yScale.range[0]);
    
    // Draw line to first point
    this.ctx.lineTo(this.xScale.scale(0), this.yScale.scale(data[0]));
    
    // Draw the curve
    for (let i = 1; i < animatedLength; i++) {
      const x = this.xScale.scale(i);
      const y = this.yScale.scale(data[i]);
      
      if (this.options.smooth && i > 1) {
        const prevX = this.xScale.scale(i - 1);
        const prevY = this.yScale.scale(data[i - 1]);
        const cpX = (prevX + x) / 2;
        this.ctx.quadraticCurveTo(cpX, prevY, x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    
    // Close the path at bottom
    this.ctx.lineTo(this.xScale.scale(animatedLength - 1), this.yScale.range[0]);
    this.ctx.closePath();
    this.ctx.fill();
  }

  /**
   * Draw line
   */
  drawLine(data, color, animationProgress) {
    const animatedLength = Math.floor(data.length * animationProgress);
    if (animatedLength < 2) return;
    
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = this.options.lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    this.ctx.beginPath();
    
    for (let i = 0; i < animatedLength; i++) {
      const x = this.xScale.scale(i);
      const y = this.yScale.scale(data[i]);
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else if (this.options.smooth && i > 1) {
        const prevX = this.xScale.scale(i - 1);
        const prevY = this.yScale.scale(data[i - 1]);
        const cpX = (prevX + x) / 2;
        this.ctx.quadraticCurveTo(cpX, prevY, x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    
    this.ctx.stroke();
  }

  /**
   * Draw points
   */
  drawPoints(data, color, datasetIndex, animationProgress) {
    const animatedLength = Math.floor(data.length * animationProgress);
    
    data.forEach((value, index) => {
      if (index >= animatedLength) return;
      
      const x = this.xScale.scale(index);
      const y = this.yScale.scale(value);
      
      let radius = this.options.pointRadius;
      let fillColor = color;
      let strokeColor = '#ffffff';
      let shadowBlur = 0;
      
      // Highlight hovered point
      if (this.hoveredPoint && 
          this.hoveredPoint.datasetIndex === datasetIndex && 
          this.hoveredPoint.pointIndex === index) {
        radius *= 1.5;
        shadowBlur = 10;
        
        // Pulse effect for keyboard navigation
        if (!this.isAnimating) {
          const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 1;
          radius *= pulse;
        }
      }
      
      // Highlight selected point
      if (this.selectedPoint && 
          this.selectedPoint.datasetIndex === datasetIndex && 
          this.selectedPoint.pointIndex === index) {
        strokeColor = color;
        this.ctx.lineWidth = 3;
      }
      
      // Draw point
      this.ctx.fillStyle = fillColor;
      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = 2;
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = shadowBlur;
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
      this.ctx.fill();
      this.ctx.stroke();
      
      this.ctx.shadowBlur = 0;
    });
  }

  /**
   * Draw legend
   */
  drawLegend() {
    const datasets = this.data.datasets;
    if (!datasets || datasets.length <= 1) return;
    
    const legendY = this.options.height - 15;
    let legendX = this.options.margin.left;
    
    this.ctx.font = '12px var(--font-primary)';
    this.ctx.textBaseline = 'middle';
    
    datasets.forEach((dataset, index) => {
      const color = dataset.color || this.options.colors[index % this.options.colors.length];
      const label = dataset.label || `Series ${index + 1}`;
      
      // Draw line
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 3