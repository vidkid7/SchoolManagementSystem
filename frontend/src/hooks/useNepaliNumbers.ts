import { useTranslation } from 'react-i18next';
import { toNepaliNumerals } from '../utils/formatters';

/**
 * Hook to format numbers based on current language
 * Automatically converts to Nepali numerals when language is 'ne'
 */
export const useNepaliNumbers = () => {
  const { i18n } = useTranslation();
  const isNepali = i18n.language === 'ne';

  /**
   * Format a number to string with optional Nepali numerals
   * Handles numbers, strings, and dates with dashes/slashes
   */
  const formatNumber = (value: number | string): string => {
    const strValue = String(value);
    return isNepali ? toNepaliNumerals(strValue) : strValue;
  };

  /**
   * Format a number with thousand separators
   */
  const formatWithSeparators = (value: number): string => {
    const formatted = value.toLocaleString('en-IN');
    return isNepali ? toNepaliNumerals(formatted) : formatted;
  };

  /**
   * Format percentage
   */
  const formatPercentage = (value: number): string => {
    const formatted = `${value}%`;
    return isNepali ? toNepaliNumerals(formatted) : formatted;
  };

  return {
    formatNumber,
    formatWithSeparators,
    formatPercentage,
    isNepali,
  };
};
