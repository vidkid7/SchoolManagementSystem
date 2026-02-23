/**
 * React Hook for Number and Currency Formatting
 * 
 * Provides formatting functions that automatically use the current language
 * from i18n context.
 * 
 * Requirements: 30.6, 30.8
 */

import { useTranslation } from 'react-i18next';
import {
  formatNumber as formatNumberUtil,
  formatCurrency as formatCurrencyUtil,
  formatPercentage as formatPercentageUtil,
  formatCompactNumber as formatCompactNumberUtil,
  parseFormattedNumber,
  parseCurrency,
} from './formatters';

/**
 * Hook that provides formatting functions with automatic language detection
 * 
 * @returns Object with formatting functions
 * 
 * @example
 * const { formatCurrency, formatNumber } = useFormatters();
 * 
 * // Automatically uses current language from i18n
 * formatCurrency(1234567.89) // 'Rs. 12,34,567.89' (en) or 'रू 12,34,567.89' (ne)
 * formatNumber(1234567.89) // '12,34,567.89'
 */
export function useFormatters() {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language as 'ne' | 'en';

  /**
   * Format number with current language settings
   * 
   * @param value - Number to format
   * @param decimals - Number of decimal places (default: 2)
   * @param useNepaliNumerals - Whether to use Nepali numerals (default: false)
   * @returns Formatted number string
   */
  const formatNumber = (
    value: number | string,
    decimals: number = 2,
    useNepaliNumerals: boolean = false
  ): string => {
    return formatNumberUtil(value, decimals, useNepaliNumerals);
  };

  /**
   * Format currency with current language settings
   * 
   * @param amount - Amount to format
   * @param decimals - Number of decimal places (default: 2)
   * @param useNepaliNumerals - Whether to use Nepali numerals (default: false)
   * @returns Formatted currency string
   */
  const formatCurrency = (
    amount: number | string,
    decimals: number = 2,
    useNepaliNumerals: boolean = false
  ): string => {
    return formatCurrencyUtil(amount, currentLanguage, decimals, useNepaliNumerals);
  };

  /**
   * Format percentage with current language settings
   * 
   * @param value - Percentage value (0-100)
   * @param decimals - Number of decimal places (default: 2)
   * @param useNepaliNumerals - Whether to use Nepali numerals (default: false)
   * @returns Formatted percentage string
   */
  const formatPercentage = (
    value: number,
    decimals: number = 2,
    useNepaliNumerals: boolean = false
  ): string => {
    return formatPercentageUtil(value, decimals, useNepaliNumerals);
  };

  /**
   * Format compact number with current language settings
   * 
   * @param value - Number to format
   * @param decimals - Number of decimal places (default: 1)
   * @param useNepaliNumerals - Whether to use Nepali numerals (default: false)
   * @returns Compact formatted string
   */
  const formatCompactNumber = (
    value: number,
    decimals: number = 1,
    useNepaliNumerals: boolean = false
  ): string => {
    return formatCompactNumberUtil(value, decimals, useNepaliNumerals);
  };

  return {
    formatNumber,
    formatCurrency,
    formatPercentage,
    formatCompactNumber,
    parseFormattedNumber,
    parseCurrency,
    currentLanguage,
  };
}
