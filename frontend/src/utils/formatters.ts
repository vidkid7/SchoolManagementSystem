/**
 * Number and Currency Formatting Utilities
 * 
 * Provides formatting functions for numbers and currency in both Nepali and English.
 * 
 * Requirements: 30.6, 30.8
 */

/**
 * Nepali numerals mapping (0-9)
 */
const NEPALI_NUMERALS: Record<string, string> = {
  '0': '०',
  '1': '१',
  '2': '२',
  '3': '३',
  '4': '४',
  '5': '५',
  '6': '६',
  '7': '७',
  '8': '८',
  '9': '९',
};

/**
 * Convert English numerals to Nepali numerals
 * 
 * @param value - String containing English numerals
 * @returns String with Nepali numerals
 * 
 * @example
 * toNepaliNumerals('123') // '१२३'
 * toNepaliNumerals('12,345.67') // '१२,३४५.६७'
 */
export function toNepaliNumerals(value: string): string {
  return value.replace(/[0-9]/g, (digit) => NEPALI_NUMERALS[digit] || digit);
}

/**
 * Format number with thousand separators (Indian numbering system)
 * 
 * Nepal uses the Indian numbering system with separators at:
 * - First separator after 3 digits from right (thousands)
 * - Subsequent separators every 2 digits (lakhs, crores)
 * 
 * Examples: 1,000 | 10,000 | 1,00,000 | 10,00,000 | 1,00,00,000
 * 
 * @param value - Number or string to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string with thousand separators
 * 
 * @example
 * formatNumberWithSeparators(1234567.89) // '12,34,567.89'
 * formatNumberWithSeparators(1000) // '1,000.00'
 * formatNumberWithSeparators(100000) // '1,00,000.00'
 */
export function formatNumberWithSeparators(
  value: number | string,
  decimals: number = 2
): string {
  // Convert to number if string
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  // Handle invalid numbers
  if (isNaN(num)) {
    return '0.00';
  }
  
  // Handle negative numbers
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  
  // Split into integer and decimal parts
  const [integerPart, decimalPart] = absNum.toFixed(decimals).split('.');
  
  // Apply Indian numbering system separators
  let formattedInteger = '';
  const length = integerPart.length;
  
  // Process from right to left
  for (let i = length - 1, count = 0; i >= 0; i--, count++) {
    // Add comma after first 3 digits, then every 2 digits
    if (count === 3 || (count > 3 && (count - 3) % 2 === 0)) {
      formattedInteger = ',' + formattedInteger;
    }
    formattedInteger = integerPart[i] + formattedInteger;
  }
  
  // Add negative sign if needed
  if (isNegative) {
    formattedInteger = '-' + formattedInteger;
  }
  
  // Combine integer and decimal parts
  return decimals > 0 ? `${formattedInteger}.${decimalPart}` : formattedInteger;
}

/**
 * Format number in Nepali script (optional feature)
 * 
 * @param value - Number or string to format
 * @param decimals - Number of decimal places (default: 2)
 * @param useNepaliNumerals - Whether to use Nepali numerals (default: false)
 * @returns Formatted number string
 * 
 * @example
 * formatNumber(1234567.89) // '12,34,567.89'
 * formatNumber(1234567.89, 2, true) // '१२,३४,५६७.८९'
 */
export function formatNumber(
  value: number | string,
  decimals: number = 2,
  useNepaliNumerals: boolean = false
): string {
  const formatted = formatNumberWithSeparators(value, decimals);
  return useNepaliNumerals ? toNepaliNumerals(formatted) : formatted;
}

/**
 * Format currency in Nepali Rupees
 * 
 * @param amount - Amount to format
 * @param language - Language code ('ne' for Nepali, 'en' for English)
 * @param decimals - Number of decimal places (default: 2)
 * @param useNepaliNumerals - Whether to use Nepali numerals for Nepali language (default: false)
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(1234567.89, 'en') // 'Rs. 12,34,567.89'
 * formatCurrency(1234567.89, 'ne') // 'रू 12,34,567.89'
 * formatCurrency(1234567.89, 'ne', 2, true) // 'रू १२,३४,५६७.८९'
 */
export function formatCurrency(
  amount: number | string,
  language: 'ne' | 'en' = 'en',
  decimals: number = 2,
  useNepaliNumerals: boolean = false
): string {
  // Get currency symbol based on language
  const symbol = language === 'ne' ? 'रू' : 'Rs.';
  
  // Format the number
  const formattedAmount = formatNumber(
    amount,
    decimals,
    language === 'ne' && useNepaliNumerals
  );
  
  // Return formatted currency with symbol
  return `${symbol} ${formattedAmount}`;
}

/**
 * Parse formatted number string back to number
 * 
 * Handles both English and Nepali numerals, removes separators
 * 
 * @param value - Formatted number string
 * @returns Parsed number
 * 
 * @example
 * parseFormattedNumber('12,34,567.89') // 1234567.89
 * parseFormattedNumber('१२,३४,५६७.८९') // 1234567.89
 */
export function parseFormattedNumber(value: string): number {
  // Convert Nepali numerals to English
  let normalized = value;
  Object.entries(NEPALI_NUMERALS).forEach(([english, nepali]) => {
    normalized = normalized.replace(new RegExp(nepali, 'g'), english);
  });
  
  // Remove thousand separators
  normalized = normalized.replace(/,/g, '');
  
  // Parse to number
  return parseFloat(normalized) || 0;
}

/**
 * Parse formatted currency string back to number
 * 
 * Removes currency symbols and parses the number
 * 
 * @param value - Formatted currency string
 * @returns Parsed amount
 * 
 * @example
 * parseCurrency('Rs. 12,34,567.89') // 1234567.89
 * parseCurrency('रू १२,३४,५६७.८९') // 1234567.89
 */
export function parseCurrency(value: string): number {
  // Remove currency symbols
  const withoutSymbol = value.replace(/^(Rs\.|रू)\s*/, '');
  
  // Parse the number
  return parseFormattedNumber(withoutSymbol);
}

/**
 * Format percentage
 * 
 * @param value - Percentage value (0-100)
 * @param decimals - Number of decimal places (default: 2)
 * @param useNepaliNumerals - Whether to use Nepali numerals (default: false)
 * @returns Formatted percentage string
 * 
 * @example
 * formatPercentage(75.5) // '75.50%'
 * formatPercentage(75.5, 2, true) // '७५.५०%'
 */
export function formatPercentage(
  value: number,
  decimals: number = 2,
  useNepaliNumerals: boolean = false
): string {
  const formatted = value.toFixed(decimals);
  const result = useNepaliNumerals ? toNepaliNumerals(formatted) : formatted;
  return `${result}%`;
}

/**
 * Format compact number (K, L, Cr notation)
 * 
 * Uses Indian numbering system:
 * - K (Thousand): 1,000
 * - L (Lakh): 1,00,000
 * - Cr (Crore): 1,00,00,000
 * 
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 1)
 * @param useNepaliNumerals - Whether to use Nepali numerals (default: false)
 * @returns Compact formatted string
 * 
 * @example
 * formatCompactNumber(1500) // '1.5K'
 * formatCompactNumber(150000) // '1.5L'
 * formatCompactNumber(15000000) // '1.5Cr'
 */
export function formatCompactNumber(
  value: number,
  decimals: number = 1,
  useNepaliNumerals: boolean = false
): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  let formatted: string;
  
  if (absValue >= 10000000) {
    // Crore (1,00,00,000)
    formatted = (absValue / 10000000).toFixed(decimals) + 'Cr';
  } else if (absValue >= 100000) {
    // Lakh (1,00,000)
    formatted = (absValue / 100000).toFixed(decimals) + 'L';
  } else if (absValue >= 1000) {
    // Thousand (1,000)
    formatted = (absValue / 1000).toFixed(decimals) + 'K';
  } else {
    formatted = absValue.toFixed(decimals);
  }
  
  return sign + (useNepaliNumerals ? toNepaliNumerals(formatted) : formatted);
}
