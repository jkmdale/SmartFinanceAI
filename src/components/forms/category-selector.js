/**
 * SmartFinanceAI - Category Selector Component
 * Global SaaS Platform File: src/components/forms/category-selector.js
 * 
 * AI-powered transaction category selector with learning capabilities
 * Features: Smart suggestions, custom categories, recent usage, country-specific categories
 */

class CategorySelector {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      country: 'US',
      allowCustom: true