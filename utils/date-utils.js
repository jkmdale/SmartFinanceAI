/**
 * SmartFinanceAI - Date Utilities
 * Global SaaS Platform File: src/utils/date-utils.js
 * 
 * Advanced date manipulation utilities for financial applications
 * Features: Multi-country support, fiscal years, timezone handling, financial periods
 */

class DateUtils {
  constructor() {
    this.countryConfigs = {
      'NZ': { 
        fiscalYearStart: 4, // April
        weekStart: 1, // Monday
        dateFormat: 'DD/MM/YYYY',
        timezone: 'Pacific/Auckland'
      },
      'AU': { 
        fiscalYearStart: 7, // July  
        weekStart: 1, // Monday
        dateFormat: 'DD/MM/YYYY',
        timezone: 'Australia/Sydney'
      },
      'UK': { 
        fiscalYearStart: 4, // April
        weekStart: 1, // Monday
        dateFormat: 'DD/MM/YYYY',
        timezone: 'Europe/London'
      },
      'US': { 
        fiscalYearStart: 1, // January
        weekStart: 0, // Sunday
        dateFormat: 'MM/DD/YYYY',
        timezone: 'America/New_York'
      },
      'CA': { 
        fiscalYearStart: 1, // January
        weekStart: 0, // Sunday
        dateFormat: 'MM/DD/YYYY',
        timezone: 'America/Toronto'
      }
    };
  }

  /**
   * Get current date in specified timezone
   */
  now(timezone = null) {
    const date = new Date();
    if (timezone) {
      return new Date(date.toLocaleString("en-US", { timeZone: timezone }));
    }
    return date;
  }

  /**
   * Parse date string in various formats
   */
  parseDate(dateString, format = null, country = 'US') {
    if (!dateString) return null;
    
    // Handle various input types
    if (dateString instanceof Date) return dateString;
    if (typeof dateString === 'number') return new Date(dateString);
    
    // Try ISO format first
    if (dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
      return new Date(dateString);
    }
    
    // Try country-specific formats
    const countryFormat = format || this.countryConfigs[country]?.dateFormat || 'MM/DD/YYYY';
    
    const parts = dateString.split(/[\/\-\.]/);
    if (parts.length >= 3) {
      let day, month, year;
      
      if (countryFormat.startsWith('DD')) {
        day = parseInt(parts[0]);
        month = parseInt(parts[1]) - 1; // JS months are 0-based
        year = parseInt(parts[2]);
      } else if (countryFormat.startsWith('MM')) {
        month = parseInt(parts[0]) - 1;
        day = parseInt(parts[1]);
        year = parseInt(parts[2]);
      } else if (countryFormat.startsWith('YYYY')) {
        year = parseInt(parts[0]);
        month = parseInt(parts[1]) - 1;
        day = parseInt(parts[2]);
      }
      
      // Handle 2-digit years
      if (year < 50) year += 2000;
      else if (year < 100) year += 1900;
      
      return new Date(year, month, day);
    }
    
    // Fallback to native parsing
    const parsed = new Date(dateString);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  /**
   * Format date according to country conventions
   */
  formatDate(date, country = 'US', includeTime = false) {
    if (!this.isValidDate(date)) return '';
    
    const config = this.countryConfigs[country] || this.countryConfigs['US'];
    const options = {
      timeZone: config.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };
    
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.hour12 = country === 'US';
    }
    
    try {
      const locale = this.getLocaleForCountry(country);
      return new Intl.DateTimeFormat(locale, options).format(date);
    } catch (error) {
      // Fallback formatting
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      if (config.dateFormat.startsWith('DD')) {
        return `${day}/${month}/${year}`;
      } else if (config.dateFormat.startsWith('MM')) {
        return `${month}/${day}/${year}`;
      } else {
        return `${year}-${month}-${day}`;
      }
    }
  }

  /**
   * Get relative time description
   */
  getRelativeTime(date, baseDate = new Date(), country = 'US') {
    if (!this.isValidDate(date)) return '';
    
    const diffMs = baseDate.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
    if (Math.abs(diffSeconds) < 60) return 'Just now';
    if (Math.abs(diffMinutes) < 60) return `${Math.abs(diffMinutes)}m ${diffMinutes > 0 ? 'ago' : 'from now'}`;
    if (Math.abs(diffHours) < 24) return `${Math.abs(diffHours)}h ${diffHours > 0 ? 'ago' : 'from now'}`;
    if (Math.abs(diffDays) < 7) return `${Math.abs(diffDays)}d ${diffDays > 0 ? 'ago' : 'from now'}`;
    if (Math.abs(diffWeeks) < 4) return `${Math.abs(diffWeeks)}w ${diffWeeks > 0 ? 'ago' : 'from now'}`;
    if (Math.abs(diffMonths) < 12) return `${Math.abs(diffMonths)}mo ${diffMonths > 0 ? 'ago' : 'from now'}`;
    return `${Math.abs(diffYears)}y ${diffYears > 0 ? 'ago' : 'from now'}`;
  }

  /**
   * Add/subtract time periods
   */
  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  addWeeks(date, weeks) {
    return this.addDays(date, weeks * 7);
  }

  addMonths(date, months) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  addYears(date, years) {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() + years);
    return result;
  }

  /**
   * Get start of time periods
   */
  startOfDay(date) {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  startOfWeek(date, country = 'US') {
    const result = new Date(date);
    const day = result.getDay();
    const weekStart = this.countryConfigs[country]?.weekStart || 0;
    const diff = (day - weekStart + 7) % 7;
    result.setDate(result.getDate() - diff);
    return this.startOfDay(result);
  }

  startOfMonth(date) {
    const result = new Date(date);
    result.setDate(1);
    return this.startOfDay(result);
  }

  startOfYear(date) {
    const result = new Date(date);
    result.setMonth(0, 1);
    return this.startOfDay(result);
  }

  /**
   * Get end of time periods
   */
  endOfDay(date) {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  endOfWeek(date, country = 'US') {
    const startOfWeek = this.startOfWeek(date, country);
    return this.endOfDay(this.addDays(startOfWeek, 6));
  }

  endOfMonth(date) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + 1, 0);
    return this.endOfDay(result);
  }

  endOfYear(date) {
    const result = new Date(date);
    result.setMonth(11, 31);
    return this.endOfDay(result);
  }

  /**
   * Fiscal year calculations
   */
  getFiscalYearStart(date, country = 'US') {
    const config = this.countryConfigs[country] || this.countryConfigs['US'];
    const fiscalMonth = config.fiscalYearStart - 1; // 0-based month
    
    const year = date.getMonth() >= fiscalMonth ? 
                 date.getFullYear() : 
                 date.getFullYear() - 1;
    
    return new Date(year, fiscalMonth, 1);
  }

  getFiscalYearEnd(date, country = 'US') {
    const fiscalStart = this.getFiscalYearStart(date, country);
    const fiscalEnd = this.addYears(fiscalStart, 1);
    return this.addDays(fiscalEnd, -1);
  }

  getFiscalYear(date, country = 'US') {
    return this.getFiscalYearStart(date, country).getFullYear();
  }

  getFiscalQuarter(date, country = 'US') {
    const fiscalStart = this.getFiscalYearStart(date, country);
    const monthsSinceFiscalStart = (date.getFullYear() - fiscalStart.getFullYear()) * 12 + 
                                  (date.getMonth() - fiscalStart.getMonth());
    return Math.floor(monthsSinceFiscalStart / 3) + 1;
  }

  getFiscalQuarterStart(date, country = 'US') {
    const fiscalStart = this.getFiscalYearStart(date, country);
    const quarter = this.getFiscalQuarter(date, country);
    return this.addMonths(fiscalStart, (quarter - 1) * 3);
  }

  /**
   * Business day calculations
   */
  isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }

  isBusinessDay(date, holidays = []) {
    if (this.isWeekend(date)) return false;
    
    // Check against holiday list
    const dateStr = this.formatDate(date, 'US', false);
    return !holidays.some(holiday => {
      const holidayStr = this.formatDate(holiday, 'US', false);
      return dateStr === holidayStr;
    });
  }

  getNextBusinessDay(date, holidays = []) {
    let nextDay = this.addDays(date, 1);
    while (!this.isBusinessDay(nextDay, holidays)) {
      nextDay = this.addDays(nextDay, 1);
    }
    return nextDay;
  }

  getPreviousBusinessDay(date, holidays = []) {
    let prevDay = this.addDays(date, -1);
    while (!this.isBusinessDay(prevDay, holidays)) {
      prevDay = this.addDays(prevDay, -1);
    }
    return prevDay;
  }

  getBusinessDaysBetween(startDate, endDate, holidays = []) {
    const businessDays = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      if (this.isBusinessDay(currentDate, holidays)) {
        businessDays.push(new Date(currentDate));
      }
      currentDate = this.addDays(currentDate, 1);
    }
    
    return businessDays;
  }

  /**
   * Financial period helpers
   */
  getCurrentFinancialPeriod(country = 'US') {
    const now = new Date();
    const fiscalStart = this.getFiscalYearStart(now, country);
    const fiscalEnd = this.getFiscalYearEnd(now, country);
    const quarter = this.getFiscalQuarter(now, country);
    const quarterStart = this.getFiscalQuarterStart(now, country);
    
    return {
      fiscalYear: this.getFiscalYear(now, country),
      fiscalYearStart: fiscalStart,
      fiscalYearEnd: fiscalEnd,
      quarter,
      quarterStart,
      quarterEnd: this.endOfMonth(this.addMonths(quarterStart, 2)),
      monthStart: this.startOfMonth(now),
      monthEnd: this.endOfMonth(now),
      weekStart: this.startOfWeek(now, country),
      weekEnd: this.endOfWeek(now, country)
    };
  }

  getFinancialPeriods(date, country = 'US') {
    const periods = [];
    const fiscalStart = this.getFiscalYearStart(date, country);
    
    // Generate all quarters in fiscal year
    for (let q = 1; q <= 4; q++) {
      const quarterStart = this.addMonths(fiscalStart, (q - 1) * 3);
      const quarterEnd = this.endOfMonth(this.addMonths(quarterStart, 2));
      
      periods.push({
        type: 'quarter',
        number: q,
        name: `Q${q} FY${this.getFiscalYear(date, country)}`,
        start: quarterStart,
        end: quarterEnd
      });
      
      // Generate months in quarter
      for (let m = 0; m < 3; m++) {
        const monthStart = this.addMonths(quarterStart, m);
        const monthEnd = this.endOfMonth(monthStart);
        
        periods.push({
          type: 'month',
          number: monthStart.getMonth() + 1,
          name: monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          start: monthStart,
          end: monthEnd,
          quarter: q
        });
      }
    }
    
    return periods;
  }

  /**
   * Date range generators
   */
  generateDateRange(startDate, endDate, interval = 'day') {
    const dates = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      
      switch (interval) {
        case 'day':
          currentDate = this.addDays(currentDate, 1);
          break;
        case 'week':
          currentDate = this.addWeeks(currentDate, 1);
          break;
        case 'month':
          currentDate = this.addMonths(currentDate, 1);
          break;
        case 'year':
          currentDate = this.addYears(currentDate, 1);
          break;
        default:
          currentDate = this.addDays(currentDate, 1);
      }
    }
    
    return dates;
  }

  getLastNDays(n, fromDate = new Date()) {
    const dates = [];
    for (let i = n - 1; i >= 0; i--) {
      dates.push(this.addDays(fromDate, -i));
    }
    return dates;
  }

  getLastNMonths(n, fromDate = new Date()) {
    const dates = [];
    for (let i = n - 1; i >= 0; i--) {
      const date = this.addMonths(fromDate, -i);
      dates.push(this.startOfMonth(date));
    }
    return dates;
  }

  /**
   * Timezone utilities
   */
  convertTimezone(date, fromTimezone, toTimezone) {
    try {
      // Create date in source timezone
      const sourceDate = new Date(date.toLocaleString("en-US", { timeZone: fromTimezone }));
      
      // Convert to target timezone
      return new Date(sourceDate.toLocaleString("en-US", { timeZone: toTimezone }));
    } catch (error) {
      console.warn('Timezone conversion failed:', error);
      return date;
    }
  }

  getTimezoneOffset(date, timezone) {
    try {
      const utcDate = new Date(date.toISOString());
      const tzDate = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
      return (utcDate.getTime() - tzDate.getTime()) / (1000 * 60); // Minutes
    } catch (error) {
      return date.getTimezoneOffset();
    }
  }

  /**
   * Validation utilities
   */
  isValidDate(date) {
    return date instanceof Date && !isNaN(date.getTime());
  }

  isSameDay(date1, date2) {
    if (!this.isValidDate(date1) || !this.isValidDate(date2)) return false;
    return date1.toDateString() === date2.toDateString();
  }

  isSameWeek(date1, date2, country = 'US') {
    if (!this.isValidDate(date1) || !this.isValidDate(date2)) return false;
    const week1Start = this.startOfWeek(date1, country);
    const week2Start = this.startOfWeek(date2, country);
    return this.isSameDay(week1Start, week2Start);
  }

  isSameMonth(date1, date2) {
    if (!this.isValidDate(date1) || !this.isValidDate(date2)) return false;
    return date1.getFullYear() === date2.getFullYear() && 
           date1.getMonth() === date2.getMonth();
  }

  isSameYear(date1, date2) {
    if (!this.isValidDate(date1) || !this.isValidDate(date2)) return false;
    return date1.getFullYear() === date2.getFullYear();
  }

  isDateInRange(date, startDate, endDate) {
    if (!this.isValidDate(date)) return false;
    return date >= startDate && date <= endDate;
  }

  /**
   * Common financial date calculations
   */
  getPayPeriods(startDate, frequency = 'biweekly', count = 26) {
    const periods = [];
    let currentDate = new Date(startDate);
    
    for (let i = 0; i < count; i++) {
      const periodStart = new Date(currentDate);
      let periodEnd;
      
      switch (frequency) {
        case 'weekly':
          periodEnd = this.addDays(currentDate, 6);
          currentDate = this.addDays(currentDate, 7);
          break;
        case 'biweekly':
          periodEnd = this.addDays(currentDate, 13);
          currentDate = this.addDays(currentDate, 14);
          break;
        case 'monthly':
          periodEnd = this.endOfMonth(currentDate);
          currentDate = this.addMonths(this.startOfMonth(currentDate), 1);
          break;
        case 'semimonthly':
          if (currentDate.getDate() === 1) {
            periodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 15);
            currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 16);
          } else {
            periodEnd = this.endOfMonth(currentDate);
            currentDate = this.addMonths(this.startOfMonth(currentDate), 1);
          }
          break;
      }
      
      periods.push({
        start: periodStart,
        end: periodEnd,
        period: i + 1
      });
    }
    
    return periods;
  }

  /**
   * Holiday calculations (basic implementation)
   */
  getCommonHolidays(year, country = 'US') {
    const holidays = [];
    
    // New Year's Day
    holidays.push(new Date(year, 0, 1));
    
    if (country === 'US') {
      // Martin Luther King Jr. Day (3rd Monday in January)
      holidays.push(this.getNthWeekdayOfMonth(year, 0, 1, 3));
      
      // Presidents Day (3rd Monday in February)
      holidays.push(this.getNthWeekdayOfMonth(year, 1, 1, 3));
      
      // Memorial Day (last Monday in May)
      holidays.push(this.getLastWeekdayOfMonth(year, 4, 1));
      
      // Independence Day
      holidays.push(new Date(year, 6, 4));
      
      // Labor Day (1st Monday in September)
      holidays.push(this.getNthWeekdayOfMonth(year, 8, 1, 1));
      
      // Columbus Day (2nd Monday in October)
      holidays.push(this.getNthWeekdayOfMonth(year, 9, 1, 2));
      
      // Veterans Day
      holidays.push(new Date(year, 10, 11));
      
      // Thanksgiving (4th Thursday in November)
      holidays.push(this.getNthWeekdayOfMonth(year, 10, 4, 4));
      
      // Christmas Day
      holidays.push(new Date(year, 11, 25));
    }
    
    return holidays;
  }

  getNthWeekdayOfMonth(year, month, weekday, nth) {
    const firstDay = new Date(year, month, 1);
    const firstWeekday = firstDay.getDay();
    const offset = (weekday - firstWeekday + 7) % 7;
    const date = 1 + offset + (nth - 1) * 7;
    return new Date(year, month, date);
  }

  getLastWeekdayOfMonth(year, month, weekday) {
    const lastDay = new Date(year, month + 1, 0);
    const lastWeekday = lastDay.getDay();
    const offset = (lastWeekday - weekday + 7) % 7;
    const date = lastDay.getDate() - offset;
    return new Date(year, month, date);
  }

  /**
   * Helper methods
   */
  getLocaleForCountry(country) {
    const locales = {
      'NZ': 'en-NZ',
      'AU': 'en-AU', 
      'UK': 'en-GB',
      'US': 'en-US',
      'CA': 'en-CA'
    };
    return locales[country] || 'en-US';
  }

  /**
   * Week number calculation (ISO 8601)
   */
  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  /**
   * Date comparison utilities
   */
  getDaysBetween(startDate, endDate) {
    const start = this.startOfDay(startDate);
    const end = this.startOfDay(endDate);
    return Math.floor((end - start) / (1000 * 60 * 60 * 24));
  }

  getMonthsBetween(startDate, endDate) {
    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
    return months + endDate.getMonth() - startDate.getMonth();
  }

  getYearsBetween(startDate, endDate) {
    return endDate.getFullYear() - startDate.getFullYear();
  }
}

// Create global instance
const dateUtils = new DateUtils();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = dateUtils;
}

// Make available globally
if (typeof window !== 'undefined') {
  window.dateUtils = dateUtils;
}