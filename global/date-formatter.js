/**
 * SmartFinanceAI - Global Date Formatting System
 * Comprehensive date/time formatting for international financial applications
 * Supports country-specific formats, financial years, and timezone handling
 */

// Country-specific date configurations
export const DateConfig = {
  'NZ': {
    dateFormat: 'DD/MM/YYYY',
    shortDateFormat: 'DD/MM/YY',
    longDateFormat: 'DD MMMM YYYY',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'DD/MM/YYYY HH:mm',
    firstDayOfWeek: 1, // Monday
    financialYear: { startMonth: 3, startDay: 1 }, // April 1st
    timezone: 'Pacific/Auckland',
    locale: 'en-NZ',
    currency: 'NZD'
  },
  
  'AU': {
    dateFormat: 'DD/MM/YYYY',
    shortDateFormat: 'DD/MM/YY',
    longDateFormat: 'DD MMMM YYYY',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'DD/MM/YYYY HH:mm',
    firstDayOfWeek: 1, // Monday
    financialYear: { startMonth: 6, startDay: 1 }, // July 1st
    timezone: 'Australia/Sydney',
    locale: 'en-AU',
    currency: 'AUD'
  },
  
  'US': {
    dateFormat: 'MM/DD/YYYY',
    shortDateFormat: 'MM/DD/YY',
    longDateFormat: 'MMMM DD, YYYY',
    timeFormat: 'h:mm A',
    dateTimeFormat: 'MM/DD/YYYY h:mm A',
    firstDayOfWeek: 0, // Sunday
    financialYear: { startMonth: 0, startDay: 1 }, // January 1st
    timezone: 'America/New_York',
    locale: 'en-US',
    currency: 'USD'
  },
  
  'UK': {
    dateFormat: 'DD/MM/YYYY',
    shortDateFormat: 'DD/MM/YY',
    longDateFormat: 'DD MMMM YYYY',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'DD/MM/YYYY HH:mm',
    firstDayOfWeek: 1, // Monday
    financialYear: { startMonth: 3, startDay: 6 }, // April 6th
    timezone: 'Europe/London',
    locale: 'en-GB',
    currency: 'GBP'
  },
  
  'CA': {
    dateFormat: 'DD/MM/YYYY',
    shortDateFormat: 'DD/MM/YY',
    longDateFormat: 'MMMM DD, YYYY',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'DD/MM/YYYY HH:mm',
    firstDayOfWeek: 0, // Sunday
    financialYear: { startMonth: 0, startDay: 1 }, // January 1st
    timezone: 'America/Toronto',
    locale: 'en-CA',
    currency: 'CAD'
  }
};

// Global Date Formatter Class
export class DateFormatter {
  constructor(country = 'US') {
    this.country = country;
    this.config = DateConfig[country] || DateConfig['US'];
    this.monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    this.dayNames = [
      'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
    ];
  }

  // Format date according to country standards
  formatDate(date, format = null) {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    
    const formatString = format || this.config.dateFormat;
    return this.applyFormat(d, formatString);
  }

  // Format time according to country standards
  formatTime(date, format = null) {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Time';
    
    const formatString = format || this.config.timeFormat;
    return this.applyFormat(d, formatString);
  }

  // Format datetime according to country standards
  formatDateTime(date, format = null) {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid DateTime';
    
    const formatString = format || this.config.dateTimeFormat;
    return this.applyFormat(d, formatString);
  }

  // Apply format string to date
  applyFormat(date, formatString) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    return formatString
      .replace(/YYYY/g, year.toString())
      .replace(/YY/g, year.toString().slice(-2))
      .replace(/MMMM/g, this.monthNames[month])
      .replace(/MMM/g, this.monthNames[month].slice(0, 3))
      .replace(/MM/g, (month + 1).toString().padStart(2, '0'))
      .replace(/M/g, (month + 1).toString())
      .replace(/DD/g, day.toString().padStart(2, '0'))
      .replace(/D/g, day.toString())
      .replace(/HH/g, hours.toString().padStart(2, '0'))
      .replace(/H/g, hours.toString())
      .replace(/hh/g, this.to12Hour(hours).toString().padStart(2, '0'))
      .replace(/h/g, this.to12Hour(hours).toString())
      .replace(/mm/g, minutes.toString().padStart(2, '0'))
      .replace(/m/g, minutes.toString())
      .replace(/ss/g, seconds.toString().padStart(2, '0'))
      .replace(/s/g, seconds.toString())
      .replace(/A/g, hours >= 12 ? 'PM' : 'AM')
      .replace(/a/g, hours >= 12 ? 'pm' : 'am');
  }

  // Convert 24-hour to 12-hour format
  to12Hour(hours) {
    return hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  }

  // Parse date string according to country format
  parseDate(dateString, format = null) {
    if (!dateString) return null;
    
    const formatString = format || this.config.dateFormat;
    
    // Handle common formats
    if (formatString === 'DD/MM/YYYY') {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    } else if (formatString === 'MM/DD/YYYY') {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
      }
    } else if (formatString === 'YYYY-MM-DD') {
      return new Date(dateString);
    }
    
    // Fallback to native parsing
    return new Date(dateString);
  }

  // Get financial year for a given date
  getFinancialYear(date = new Date()) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();
    
    const fyStart = this.config.financialYear;
    
    // Check if date is after financial year start
    if (month > fyStart.startMonth || 
        (month === fyStart.startMonth && day >= fyStart.startDay)) {
      return {
        startYear: year,
        endYear: year + 1,
        startDate: new Date(year, fyStart.startMonth, fyStart.startDay),
        endDate: new Date(year + 1, fyStart.startMonth, fyStart.startDay - 1)
      };
    } else {
      return {
        startYear: year - 1,
        endYear: year,
        startDate: new Date(year - 1, fyStart.startMonth, fyStart.startDay),
        endDate: new Date(year, fyStart.startMonth, fyStart.startDay - 1)
      };
    }
  }

  // Get financial year string
  getFinancialYearString(date = new Date()) {
    const fy = this.getFinancialYear(date);
    
    if (this.country === 'US' || this.country === 'CA') {
      return fy.startYear.toString();
    } else {
      return `${fy.startYear}-${fy.endYear.toString().slice(-2)}`;
    }
  }

  // Get relative date string (e.g., "2 days ago", "in 3 weeks")
  getRelativeDate(date) {
    const now = new Date();
    const d = new Date(date);
    const diffMs = d.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (Math.abs(diffMinutes) < 1) {
      return 'now';
    } else if (Math.abs(diffMinutes) < 60) {
      return diffMinutes > 0 ? `in ${diffMinutes} minutes` : `${Math.abs(diffMinutes)} minutes ago`;
    } else if (Math.abs(diffHours) < 24) {
      return diffHours > 0 ? `in ${diffHours} hours` : `${Math.abs(diffHours)} hours ago`;
    } else if (Math.abs(diffDays) === 1) {
      return diffDays > 0 ? 'tomorrow' : 'yesterday';
    } else if (Math.abs(diffDays) < 7) {
      return diffDays > 0 ? `in ${diffDays} days` : `${Math.abs(diffDays)} days ago`;
    } else if (Math.abs(diffDays) < 30) {
      const weeks = Math.floor(Math.abs(diffDays) / 7);
      return diffDays > 0 ? `in ${weeks} weeks` : `${weeks} weeks ago`;
    } else if (Math.abs(diffDays) < 365) {
      const months = Math.floor(Math.abs(diffDays) / 30);
      return diffDays > 0 ? `in ${months} months` : `${months} months ago`;
    } else {
      const years = Math.floor(Math.abs(diffDays) / 365);
      return diffDays > 0 ? `in ${years} years` : `${years} years ago`;
    }
  }

  // Format date range
  formatDateRange(startDate, endDate, separator = ' - ') {
    if (!startDate || !endDate) return '';
    
    const start = this.formatDate(startDate);
    const end = this.formatDate(endDate);
    
    return `${start}${separator}${end}`;
  }

  // Get month boundaries for a given date
  getMonthBoundaries(date = new Date()) {
    const d = new Date(date);
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    
    return {
      start: firstDay,
      end: lastDay,
      formatted: {
        start: this.formatDate(firstDay),
        end: this.formatDate(lastDay)
      }
    };
  }

  // Get week boundaries
  getWeekBoundaries(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + this.config.firstDayOfWeek;
    
    const weekStart = new Date(d.setDate(diff));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return {
      start: weekStart,
      end: weekEnd,
      formatted: {
        start: this.formatDate(weekStart),
        end: this.formatDate(weekEnd)
      }
    };
  }

  // Get quarter boundaries
  getQuarterBoundaries(date = new Date()) {
    const d = new Date(date);
    const quarter = Math.floor(d.getMonth() / 3);
    const quarterStart = new Date(d.getFullYear(), quarter * 3, 1);
    const quarterEnd = new Date(d.getFullYear(), quarter * 3 + 3, 0);
    
    return {
      quarter: quarter + 1,
      start: quarterStart,
      end: quarterEnd,
      formatted: {
        start: this.formatDate(quarterStart),
        end: this.formatDate(quarterEnd)
      }
    };
  }

  // Get year boundaries
  getYearBoundaries(date = new Date()) {
    const d = new Date(date);
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const yearEnd = new Date(d.getFullYear(), 11, 31);
    
    return {
      year: d.getFullYear(),
      start: yearStart,
      end: yearEnd,
      formatted: {
        start: this.formatDate(yearStart),
        end: this.formatDate(yearEnd)
      }
    };
  }

  // Convert between timezones
  convertTimezone(date, fromTimezone, toTimezone) {
    const d = new Date(date);
    
    // Create formatter for source timezone
    const sourceFormatter = new Intl.DateTimeFormat('en', {
      timeZone: fromTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    // Create formatter for target timezone
    const targetFormatter = new Intl.DateTimeFormat('en', {
      timeZone: toTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    return {
      source: {
        timezone: fromTimezone,
        formatted: sourceFormatter.format(d)
      },
      target: {
        timezone: toTimezone,
        formatted: targetFormatter.format(d)
      }
    };
  }

  // Get business days between two dates
  getBusinessDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let businessDays = 0;
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const day = d.getDay();
      if (day !== 0 && day !== 6) { // Not Sunday (0) or Saturday (6)
        businessDays++;
      }
    }
    
    return businessDays;
  }

  // Add business days to a date
  addBusinessDays(date, days) {
    const result = new Date(date);
    let addedDays = 0;
    
    while (addedDays < days) {
      result.setDate(result.getDate() + 1);
      const day = result.getDay();
      if (day !== 0 && day !== 6) { // Not weekend
        addedDays++;
      }
    }
    
    return result;
  }

  // Check if date is a business day
  isBusinessDay(date) {
    const d = new Date(date);
    const day = d.getDay();
    return day !== 0 && day !== 6; // Not Sunday or Saturday
  }

  // Get age from birth date
  calculateAge(birthDate, referenceDate = new Date()) {
    const birth = new Date(birthDate);
    const reference = new Date(referenceDate);
    
    let age = reference.getFullYear() - birth.getFullYear();
    const monthDiff = reference.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && reference.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  // Format duration in human readable form
  formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''}`;
    } else if (months > 0) {
      return `${months} month${months > 1 ? 's' : ''}`;
    } else if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      return `${seconds} second${seconds > 1 ? 's' : ''}`;
    }
  }

  // Get common date presets for financial reporting
  getDatePresets() {
    const now = new Date();
    const presets = {};

    // Today
    presets.today = {
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    };

    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    presets.yesterday = {
      start: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
      end: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59)
    };

    // This week
    const thisWeek = this.getWeekBoundaries(now);
    presets.thisWeek = thisWeek;

    // Last week
    const lastWeekStart = new Date(thisWeek.start);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    presets.lastWeek = this.getWeekBoundaries(lastWeekStart);

    // This month
    presets.thisMonth = this.getMonthBoundaries(now);

    // Last month
    const lastMonth = new Date(now);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    presets.lastMonth = this.getMonthBoundaries(lastMonth);

    // This quarter
    presets.thisQuarter = this.getQuarterBoundaries(now);

    // Last quarter
    const lastQuarter = new Date(now);
    lastQuarter.setMonth(lastQuarter.getMonth() - 3);
    presets.lastQuarter = this.getQuarterBoundaries(lastQuarter);

    // This year
    presets.thisYear = this.getYearBoundaries(now);

    // Last year
    const lastYear = new Date(now);
    lastYear.setFullYear(lastYear.getFullYear() - 1);
    presets.lastYear = this.getYearBoundaries(lastYear);

    // This financial year
    presets.thisFinancialYear = this.getFinancialYear(now);

    // Last financial year
    const lastFY = new Date(now);
    lastFY.setFullYear(lastFY.getFullYear() - 1);
    presets.lastFinancialYear = this.getFinancialYear(lastFY);

    // Last 30 days
    const last30Days = new Date(now);
    last30Days.setDate(last30Days.getDate() - 30);
    presets.last30Days = {
      start: last30Days,
      end: now
    };

    // Last 90 days
    const last90Days = new Date(now);
    last90Days.setDate(last90Days.getDate() - 90);
    presets.last90Days = {
      start: last90Days,
      end: now
    };

    // Last 12 months
    const last12Months = new Date(now);
    last12Months.setMonth(last12Months.getMonth() - 12);
    presets.last12Months = {
      start: last12Months,
      end: now
    };

    return presets;
  }

  // Validate date string
  isValidDate(dateString) {
    const date = this.parseDate(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  // Get timezone offset
  getTimezoneOffset(timezone = this.config.timezone) {
    const now = new Date();
    const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    const targetTime = new Date(utc.toLocaleString('en-US', { timeZone: timezone }));
    const offset = (targetTime.getTime() - utc.getTime()) / (1000 * 60 * 60);
    
    return {
      hours: Math.floor(offset),
      minutes: (offset % 1) * 60,
      string: `UTC${offset >= 0 ? '+' : ''}${offset}`
    };
  }

  // Format for specific contexts
  formatForContext(date, context) {
    const contexts = {
      'transaction': this.config.dateFormat,
      'report': this.config.longDateFormat,
      'export': 'YYYY-MM-DD',
      'api': 'YYYY-MM-DDTHH:mm:ssZ',
      'display': this.config.dateFormat,
      'input': 'YYYY-MM-DD'
    };

    const format = contexts[context] || this.config.dateFormat;
    
    if (context === 'api') {
      return new Date(date).toISOString();
    }
    
    return this.formatDate(date, format);
  }
}

// Utility functions for quick access
export const createDateFormatter = (country) => new DateFormatter(country);

export const formatDateForCountry = (date, country, format = null) => {
  const formatter = new DateFormatter(country);
  return formatter.formatDate(date, format);
};

export const getFinancialYearForCountry = (date, country) => {
  const formatter = new DateFormatter(country);
  return formatter.getFinancialYear(date);
};

export const parseDateForCountry = (dateString, country, format = null) => {
  const formatter = new DateFormatter(country);
  return formatter.parseDate(dateString, format);
};

// Export default formatter (US format)
export const defaultDateFormatter = new DateFormatter('US');

// Export country-specific formatters
export const dateFormatters = {
  NZ: new DateFormatter('NZ'),
  AU: new DateFormatter('AU'),
  US: new DateFormatter('US'),
  UK: new DateFormatter('UK'),
  CA: new DateFormatter('CA')
};

console.log('✅ Global Date Formatting System loaded - Multi-country date/time support ready');