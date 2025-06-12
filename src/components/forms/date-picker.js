/**
 * SmartFinanceAI - Date Picker Component
 * Global SaaS Platform File: src/components/forms/date-picker.js
 * 
 * Multi-country date picker with financial calendar features
 * Features: Timezone support, fiscal years, recurring dates, accessibility
 */

class DatePicker {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      format: 'YYYY-MM-DD',
      locale: 'en-US',
      country: 'US',
      minDate: null,
      maxDate: null,
      defaultDate: null,
      allowFuture: true,
      allowPast: true,
      fiscalYearStart: 1, // January = 1
      weekStart: 0, // Sunday = 0
      showFiscalYear: false,
      showWeekNumbers: false,
      highlightToday: true,
      shortcuts: true,
      recurring: false,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...options
    };

    this.currentDate = new Date();
    this.selectedDate = null;
    this.viewDate = new Date();
    this.isOpen = false;
    this.shortcuts = [];

    this.init();
  }

  /**
   * Initialize the date picker
   */
  async init() {
    await this.loadCountrySettings();
    this.createDatePicker();
    this.setupEventListeners();
    this.setupShortcuts();
    
    if (this.options.defaultDate) {
      this.setDate(this.options.defaultDate);
    }
  }

  /**
   * Load country-specific date settings
   */
  async loadCountrySettings() {
    try {
      const countryConfig = await window.localization?.getCountryConfig(this.options.country);
      if (countryConfig) {
        this.options.format = countryConfig.dateFormat || this.options.format;
        this.options.locale = countryConfig.locale || this.options.locale;
        this.options.fiscalYearStart = countryConfig.fiscalYearStart || 1;
        this.options.weekStart = countryConfig.weekStart || 0;
      }
    } catch (error) {
      console.error('Failed to load country settings:', error);
    }
  }

  /**
   * Create the date picker HTML structure
   */
  createDatePicker() {
    // Wrap the input element
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'date-picker-wrapper';
    this.element.parentNode.insertBefore(this.wrapper, this.element);
    this.wrapper.appendChild(this.element);

    // Add date picker classes to input
    this.element.classList.add('date-picker-input', 'input');
    this.element.setAttribute('readonly', 'true');
    this.element.setAttribute('placeholder', this.getLocalizedPlaceholder());

    // Create calendar icon
    const iconContainer = document.createElement('div');
    iconContainer.className = 'date-picker-icon';
    iconContainer.innerHTML = '<span class="calendar-icon">📅</span>';
    this.wrapper.appendChild(iconContainer);

    // Create calendar popup
    this.calendar = document.createElement('div');
    this.calendar.className = 'date-picker-calendar glass-intense';
    this.calendar.setAttribute('aria-hidden', 'true');
    this.calendar.setAttribute('role', 'dialog');
    this.calendar.setAttribute('aria-label', 'Date picker');
    
    document.body.appendChild(this.calendar);
    this.renderCalendar();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Input click to open calendar
    this.element.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggle();
    });

    // Icon click to open calendar
    this.wrapper.querySelector('.date-picker-icon').addEventListener('click', (e) => {
      e.preventDefault();
      this.toggle();
    });

    // Keyboard navigation
    this.element.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          this.toggle();
          break;
        case 'Escape':
          this.close();
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.open();
          break;
      }
    });

    // Calendar keyboard navigation
    this.calendar.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          this.close();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.navigateDay(-1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.navigateDay(1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.navigateDay(-7);
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.navigateDay(7);
          break;
        case 'Home':
          e.preventDefault();
          this.navigateToWeekStart();
          break;
        case 'End':
          e.preventDefault();
          this.navigateToWeekEnd();
          break;
        case 'PageUp':
          e.preventDefault();
          this.navigateMonth(e.shiftKey ? -12 : -1);
          break;
        case 'PageDown':
          e.preventDefault();
          this.navigateMonth(e.shiftKey ? 12 : 1);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          this.selectFocusedDate();
          break;
      }
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
      if (!this.wrapper.contains(e.target) && !this.calendar.contains(e.target)) {
        this.close();
      }
    });

    // Calendar interactions
    this.calendar.addEventListener('click', (e) => {
      e.stopPropagation();
      
      const dayCell = e.target.closest('[data-date]');
      if (dayCell && !dayCell.classList.contains('disabled')) {
        const dateStr = dayCell.dataset.date;
        this.selectDate(new Date(dateStr));
        return;
      }

      const navBtn = e.target.closest('[data-nav]');
      if (navBtn) {
        this.handleNavigation(navBtn.dataset.nav);
        return;
      }

      const shortcut = e.target.closest('[data-shortcut]');
      if (shortcut) {
        this.handleShortcut(shortcut.dataset.shortcut);
        return;
      }
    });

    // Window resize
    window.addEventListener('resize', () => {
      if (this.isOpen) {
        this.positionCalendar();
      }
    });
  }

  /**
   * Setup date shortcuts
   */
  setupShortcuts() {
    this.shortcuts = [
      { key: 'today', label: 'Today', date: () => new Date() },
      { key: 'yesterday', label: 'Yesterday', date: () => this.addDays(new Date(), -1) },
      { key: 'week_start', label: 'Week Start', date: () => this.getWeekStart(new Date()) },
      { key: 'month_start', label: 'Month Start', date: () => new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      { key: 'quarter_start', label: 'Quarter Start', date: () => this.getQuarterStart(new Date()) },
      { key: 'year_start', label: 'Year Start', date: () => new Date(new Date().getFullYear(), 0, 1) },
      { key: 'fiscal_start', label: 'Fiscal Year Start', date: () => this.getFiscalYearStart(new Date()) }
    ];

    // Add country-specific shortcuts
    if (this.options.country === 'NZ' || this.options.country === 'AU') {
      this.shortcuts.push(
        { key: 'fin_year_start', label: 'Financial Year Start', date: () => this.getFinancialYearStart(new Date()) }
      );
    }
  }

  /**
   * Render the complete calendar
   */
  renderCalendar() {
    this.calendar.innerHTML = `
      <div class="date-picker-header">
        ${this.renderHeader()}
      </div>
      
      ${this.options.shortcuts ? `
        <div class="date-picker-shortcuts">
          ${this.renderShortcuts()}
        </div>
      ` : ''}
      
      <div class="date-picker-body">
        ${this.renderMonthNavigation()}
        ${this.renderWeekDays()}
        ${this.renderDays()}
      </div>
      
      <div class="date-picker-footer">
        ${this.renderFooter()}
      </div>
    `;
  }

  /**
   * Render calendar header
   */
  renderHeader() {
    const monthYear = this.formatMonthYear(this.viewDate);
    
    return `
      <div class="calendar-header">
        <div class="calendar-title">
          <h3 class="month-year">${monthYear}</h3>
          ${this.options.showFiscalYear ? `
            <div class="fiscal-year">FY ${this.getFiscalYear(this.viewDate)}</div>
          ` : ''}
        </div>
        
        <div class="calendar-nav">
          <button class="nav-btn" data-nav="prev-year" aria-label="Previous year">
            <span class="nav-icon">⏪</span>
          </button>
          <button class="nav-btn" data-nav="prev-month" aria-label="Previous month">
            <span class="nav-icon">◀</span>
          </button>
          <button class="nav-btn today-btn" data-nav="today" aria-label="Go to today">
            <span class="nav-text">Today</span>
          </button>
          <button class="nav-btn" data-nav="next-month" aria-label="Next month">
            <span class="nav-icon">▶</span>
          </button>
          <button class="nav-btn" data-nav="next-year" aria-label="Next year">
            <span class="nav-icon">⏩</span>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render date shortcuts
   */
  renderShortcuts() {
    return `
      <div class="shortcuts-container">
        <div class="shortcuts-label">Quick Select</div>
        <div class="shortcuts-grid">
          ${this.shortcuts.map(shortcut => `
            <button class="shortcut-btn" 
                    data-shortcut="${shortcut.key}"
                    title="${shortcut.label}">
              ${shortcut.label}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render month navigation
   */
  renderMonthNavigation() {
    return `
      <div class="month-navigation">
        <select class="month-select" data-nav="month-select" aria-label="Select month">
          ${Array.from({ length: 12 }, (_, i) => {
            const monthDate = new Date(this.viewDate.getFullYear(), i, 1);
            const monthName = this.formatMonth(monthDate);
            return `
              <option value="${i}" ${i === this.viewDate.getMonth() ? 'selected' : ''}>
                ${monthName}
              </option>
            `;
          }).join('')}
        </select>
        
        <select class="year-select" data-nav="year-select" aria-label="Select year">
          ${Array.from({ length: 21 }, (_, i) => {
            const year = this.viewDate.getFullYear() - 10 + i;
            return `
              <option value="${year}" ${year === this.viewDate.getFullYear() ? 'selected' : ''}>
                ${year}
              </option>
            `;
          }).join('')}
        </select>
      </div>
    `;
  }

  /**
   * Render week day headers
   */
  renderWeekDays() {
    const weekDays = this.getWeekDays();
    
    return `
      <div class="week-days">
        ${this.options.showWeekNumbers ? '<div class="week-number-header">Wk</div>' : ''}
        ${weekDays.map(day => `
          <div class="week-day" title="${day.full}">
            <span class="week-day-short">${day.short}</span>
            <span class="week-day-narrow">${day.narrow}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Render calendar days
   */
  renderDays() {
    const startOfMonth = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth(), 1);
    const endOfMonth = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 0);
    
    // Calculate start of calendar grid
    const startOfCalendar = new Date(startOfMonth);
    const dayOffset = (startOfMonth.getDay() - this.options.weekStart + 7) % 7;
    startOfCalendar.setDate(startOfCalendar.getDate() - dayOffset);
    
    // Generate 6 weeks (42 days)
    const weeks = [];
    let currentDate = new Date(startOfCalendar);
    
    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      const weekNumber = this.getWeekNumber(currentDate);
      
      for (let day = 0; day < 7; day++) {
        const dateInfo = this.getDateInfo(new Date(currentDate));
        weekDays.push(dateInfo);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      weeks.push({ number: weekNumber, days: weekDays });
    }
    
    return `
      <div class="calendar-days">
        ${weeks.map(week => `
          <div class="calendar-week">
            ${this.options.showWeekNumbers ? `
              <div class="week-number" title="Week ${week.number}">
                ${week.number}
              </div>
            ` : ''}
            ${week.days.map(day => this.renderDay(day)).join('')}
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Render individual day cell
   */
  renderDay(dayInfo) {
    const classes = [
      'calendar-day',
      dayInfo.isOtherMonth ? 'other-month' : '',
      dayInfo.isToday ? 'today' : '',
      dayInfo.isSelected ? 'selected' : '',
      dayInfo.isDisabled ? 'disabled' : '',
      dayInfo.isWeekend ? 'weekend' : '',
      dayInfo.isFiscalYearStart ? 'fiscal-start' : '',
      dayInfo.isQuarterStart ? 'quarter-start' : ''
    ].filter(Boolean).join(' ');

    return `
      <div class="${classes}" 
           data-date="${dayInfo.isoString}"
           tabindex="${dayInfo.isDisabled ? '-1' : '0'}"
           aria-label="${dayInfo.ariaLabel}"
           ${dayInfo.isSelected ? 'aria-selected="true"' : ''}>
        <span class="day-number">${dayInfo.day}</span>
        ${dayInfo.indicators.length > 0 ? `
          <div class="day-indicators">
            ${dayInfo.indicators.map(indicator => `
              <span class="day-indicator ${indicator.type}" title="${indicator.title}">
                ${indicator.icon}
              </span>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Render calendar footer
   */
  renderFooter() {
    return `
      <div class="calendar-footer">
        <div class="selected-date">
          ${this.selectedDate ? `
            <span class="selected-label">Selected:</span>
            <span class="selected-value">${this.formatSelectedDate()}</span>
          ` : `
            <span class="no-selection">No date selected</span>
          `}
        </div>
        
        <div class="footer-actions">
          <button class="btn btn-ghost btn-sm" data-action="clear">Clear</button>
          <button class="btn btn-primary btn-sm" data-action="close">Done</button>
        </div>
      </div>
    `;
  }

  /**
   * Get date information for rendering
   */
  getDateInfo(date) {
    const today = new Date();
    const isOtherMonth = date.getMonth() !== this.viewDate.getMonth();
    const isToday = this.isSameDay(date, today);
    const isSelected = this.selectedDate && this.isSameDay(date, this.selectedDate);
    const isDisabled = this.isDateDisabled(date);
    const isWeekend = this.isWeekend(date);
    const isFiscalYearStart = this.isFiscalYearStart(date);
    const isQuarterStart = this.isQuarterStart(date);

    const indicators = [];
    if (isToday && this.options.highlightToday) {
      indicators.push({ type: 'today', icon: '●', title: 'Today' });
    }
    if (isFiscalYearStart && this.options.showFiscalYear) {
      indicators.push({ type: 'fiscal', icon: '📊', title: 'Fiscal Year Start' });
    }
    if (isQuarterStart) {
      indicators.push({ type: 'quarter', icon: '📅', title: 'Quarter Start' });
    }

    return {
      date,
      day: date.getDate(),
      isoString: date.toISOString().split('T')[0],
      isOtherMonth,
      isToday,
      isSelected,
      isDisabled,
      isWeekend,
      isFiscalYearStart,
      isQuarterStart,
      indicators,
      ariaLabel: this.getDateAriaLabel(date, isSelected, isToday)
    };
  }

  /**
   * Handle navigation actions
   */
  handleNavigation(action) {
    switch (action) {
      case 'prev-year':
        this.viewDate.setFullYear(this.viewDate.getFullYear() - 1);
        break;
      case 'prev-month':
        this.viewDate.setMonth(this.viewDate.getMonth() - 1);
        break;
      case 'next-month':
        this.viewDate.setMonth(this.viewDate.getMonth() + 1);
        break;
      case 'next-year':
        this.viewDate.setFullYear(this.viewDate.getFullYear() + 1);
        break;
      case 'today':
        this.viewDate = new Date();
        break;
      case 'month-select':
        const monthSelect = this.calendar.querySelector('.month-select');
        this.viewDate.setMonth(parseInt(monthSelect.value));
        break;
      case 'year-select':
        const yearSelect = this.calendar.querySelector('.year-select');
        this.viewDate.setFullYear(parseInt(yearSelect.value));
        break;
    }
    
    this.renderCalendar();
  }

  /**
   * Handle shortcut selection
   */
  handleShortcut(shortcutKey) {
    const shortcut = this.shortcuts.find(s => s.key === shortcutKey);
    if (shortcut) {
      const date = shortcut.date();
      this.selectDate(date);
    }
  }

  /**
   * Open calendar
   */
  open() {
    if (this.isOpen) return;
    
    this.isOpen = true;
    this.calendar.classList.add('active');
    this.calendar.setAttribute('aria-hidden', 'false');
    this.element.setAttribute('aria-expanded', 'true');
    
    this.positionCalendar();
    this.renderCalendar();
    
    // Focus the selected date or today
    setTimeout(() => {
      const focusTarget = this.calendar.querySelector('.selected') || 
                         this.calendar.querySelector('.today') ||
                         this.calendar.querySelector('.calendar-day:not(.disabled)');
      focusTarget?.focus();
    }, 100);
  }

  /**
   * Close calendar
   */
  close() {
    if (!this.isOpen) return;
    
    this.isOpen = false;
    this.calendar.classList.remove('active');
    this.calendar.setAttribute('aria-hidden', 'true');
    this.element.setAttribute('aria-expanded', 'false');
    this.element.focus();
  }

  /**
   * Toggle calendar visibility
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Select a date
   */
  selectDate(date) {
    if (this.isDateDisabled(date)) return;
    
    this.selectedDate = new Date(date);
    this.viewDate = new Date(date);
    this.element.value = this.formatDate(date);
    
    // Trigger change event
    this.element.dispatchEvent(new Event('change', { bubbles: true }));
    this.element.dispatchEvent(new CustomEvent('dateSelected', {
      detail: { date: new Date(date), formattedDate: this.formatDate(date) }
    }));
    
    this.close();
  }

  /**
   * Set date programmatically
   */
  setDate(date) {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    if (!this.isValidDate(date)) return;
    
    this.selectedDate = new Date(date);
    this.viewDate = new Date(date);
    this.element.value = this.formatDate(date);
    
    if (this.isOpen) {
      this.renderCalendar();
    }
  }

  /**
   * Get selected date
   */
  getDate() {
    return this.selectedDate ? new Date(this.selectedDate) : null;
  }

  /**
   * Clear selected date
   */
  clear() {
    this.selectedDate = null;
    this.element.value = '';
    
    this.element.dispatchEvent(new Event('change', { bubbles: true }));
    this.element.dispatchEvent(new CustomEvent('dateCleared'));
    
    if (this.isOpen) {
      this.renderCalendar();
    }
  }

  /**
   * Position calendar relative to input
   */
  positionCalendar() {
    const rect = this.wrapper.getBoundingClientRect();
    const calendarRect = this.calendar.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    let top = rect.bottom + window.scrollY + 5;
    let left = rect.left + window.scrollX;

    // Adjust if calendar would overflow viewport
    if (left + calendarRect.width > viewport.width) {
      left = rect.right + window.scrollX - calendarRect.width;
    }

    if (top + calendarRect.height > viewport.height + window.scrollY) {
      top = rect.top + window.scrollY - calendarRect.height - 5;
    }

    this.calendar.style.top = `${Math.max(10, top)}px`;
    this.calendar.style.left = `${Math.max(10, left)}px`;
  }

  /**
   * Check if date is disabled
   */
  isDateDisabled(date) {
    if (!this.isValidDate(date)) return true;
    
    if (this.options.minDate && date < this.options.minDate) return true;
    if (this.options.maxDate && date > this.options.maxDate) return true;
    
    if (!this.options.allowPast && date < new Date().setHours(0, 0, 0, 0)) return true;
    if (!this.options.allowFuture && date > new Date().setHours(23, 59, 59, 999)) return true;
    
    return false;
  }

  /**
   * Format date according to locale and options
   */
  formatDate(date) {
    if (!this.isValidDate(date)) return '';
    
    try {
      return new Intl.DateTimeFormat(this.options.locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: this.options.timezone
      }).format(date);
    } catch (error) {
      return date.toISOString().split('T')[0];
    }
  }

  /**
   * Format month/year header
   */
  formatMonthYear(date) {
    try {
      return new Intl.DateTimeFormat(this.options.locale, {
        month: 'long',
        year: 'numeric',
        timeZone: this.options.timezone
      }).format(date);
    } catch (error) {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
  }

  /**
   * Get localized week days
   */
  getWeekDays() {
    const days = [];
    const baseDate = new Date(2023, 0, 1); // Sunday
    
    for (let i = 0; i < 7; i++) {
      const dayIndex = (this.options.weekStart + i) % 7;
      const date = new Date(baseDate);
      date.setDate(date.getDate() + dayIndex);
      
      try {
        const formatter = new Intl.DateTimeFormat(this.options.locale, { weekday: 'long' });
        const full = formatter.format(date);
        const short = new Intl.DateTimeFormat(this.options.locale, { weekday: 'short' }).format(date);
        const narrow = new Intl.DateTimeFormat(this.options.locale, { weekday: 'narrow' }).format(date);
        
        days.push({ full, short, narrow });
      } catch (error) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const full = dayNames[dayIndex];
        days.push({
          full,
          short: full.substring(0, 3),
          narrow: full.substring(0, 1)
        });
      }
    }
    
    return days;
  }

  /**
   * Utility methods
   */
  isValidDate(date) {
    return date instanceof Date && !isNaN(date.getTime());
  }

  isSameDay(date1, date2) {
    return date1.toDateString() === date2.toDateString();
  }

  isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }

  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  getWeekStart(date) {
    const result = new Date(date);
    const day = result.getDay();
    const diff = (day - this.options.weekStart + 7) % 7;
    result.setDate(result.getDate() - diff);
    return result;
  }

  getQuarterStart(date) {
    const quarter = Math.floor(date.getMonth() / 3);
    return new Date(date.getFullYear(), quarter * 3, 1);
  }

  getFiscalYearStart(date) {
    const year = date.getMonth() >= this.options.fiscalYearStart - 1 ? 
                 date.getFullYear() : 
                 date.getFullYear() - 1;
    return new Date(year, this.options.fiscalYearStart - 1, 1);
  }

  getFinancialYearStart(date) {
    // For countries like NZ/AU where financial year starts in April
    const year = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
    return new Date(year, 3, 1); // April 1st
  }

  getFiscalYear(date) {
    const fiscalStart = this.getFiscalYearStart(date);
    return fiscalStart.getFullYear();
  }

  isFiscalYearStart(date) {
    const fiscalStart = this.getFiscalYearStart(date);
    return this.isSameDay(date, fiscalStart);
  }

  isQuarterStart(date) {
    return date.getDate() === 1 && date.getMonth() % 3 === 0;
  }

  getWeekNumber(date) {
    const yearStart = new Date(date.getFullYear(), 0, 1);
    const weekStart = this.getWeekStart(yearStart);
    const diff = date.getTime() - weekStart.getTime();
    return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
  }

  getLocalizedPlaceholder() {
    const placeholders = {
      'en-US': 'MM/DD/YYYY',
      'en-GB': 'DD/MM/YYYY',
      'en-AU': 'DD/MM/YYYY',
      'en-NZ': 'DD/MM/YYYY',
      'en-CA': 'DD/MM/YYYY'
    };
    return placeholders[this.options.locale] || 'Select date';
  }

  formatSelectedDate() {
    if (!this.selectedDate) return '';
    
    try {
      return new Intl.DateTimeFormat(this.options.locale, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(this.selectedDate);
    } catch (error) {
      return this.formatDate(this.selectedDate);
    }
  }

  getDateAriaLabel(date, isSelected, isToday) {
    let label = this.formatDate(date);
    
    if (isToday) label += ', today';
    if (isSelected) label += ', selected';
    if (this.isWeekend(date)) label += ', weekend';
    
    return label;
  }

  // Keyboard navigation methods
  navigateDay(offset) {
    const focused = this.calendar.querySelector('.calendar-day:focus');
    if (!focused) return;
    
    const currentDate = new Date(focused.dataset.date);
    const newDate = this.addDays(currentDate, offset);
    
    // Navigate to different month if necessary
    if (newDate.getMonth() !== this.viewDate.getMonth()) {
      this.viewDate = new Date(newDate);
      this.renderCalendar();
      
      setTimeout(() => {
        const newFocused = this.calendar.querySelector(`[data-date="${newDate.toISOString().split('T')[0]}"]`);
        newFocused?.focus();
      }, 50);
    } else {
      const newFocused = this.calendar.querySelector(`[data-date="${newDate.toISOString().split('T')[0]}"]`);
      newFocused?.focus();
    }
  }

  navigateMonth(offset) {
    this.viewDate.setMonth(this.viewDate.getMonth() + offset);
    this.renderCalendar();
  }

  navigateToWeekStart() {
    const focused = this.calendar.querySelector('.calendar-day:focus');
    if (!focused) return;
    
    const currentDate = new Date(focused.dataset.date);
    const weekStart = this.getWeekStart(currentDate);
    const weekStartEl = this.calendar.querySelector(`[data-date="${weekStart.toISOString().split('T')[0]}"]`);
    weekStartEl?.focus();
  }

  navigateToWeekEnd() {
    const focused = this.calendar.querySelector('.calendar-day:focus');
    if (!focused) return;
    
    const currentDate = new Date(focused.dataset.date);
    const weekEnd = this.addDays(this.getWeekStart(currentDate), 6);
    const weekEndEl = this.calendar.querySelector(`[data-date="${weekEnd.toISOString().split('T')[0]}"]`);
    weekEndEl?.focus();
  }

  selectFocusedDate() {
    const focused = this.calendar.querySelector('.calendar-day:focus');
    if (focused && !focused.classList.contains('disabled')) {
      const date = new Date(focused.dataset.date);
      this.selectDate(date);
    }
  }

  /**
   * Destroy the date picker
   */
  destroy() {
    this.close();
    this.calendar.remove();
    this.element.classList.remove('date-picker-input');
    this.element.removeAttribute('readonly');
    this.wrapper.parentNode.insertBefore(this.element, this.wrapper);
    this.wrapper.remove();
  }
}

// Auto-initialize date pickers
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-date-picker]').forEach(element => {
    const options = element.dataset.datePickerOptions ? 
                   JSON.parse(element.dataset.datePickerOptions) : {};
    new DatePicker(element, options);
  });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DatePicker;
}