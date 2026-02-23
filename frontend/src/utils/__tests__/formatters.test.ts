/**
 * Unit Tests for Number and Currency Formatting Utilities
 * 
 * Tests formatting functions for Nepali and English number/currency display
 * 
 * Requirements: 30.6, 30.8
 */

import {
  toNepaliNumerals,
  formatNumberWithSeparators,
  formatNumber,
  formatCurrency,
  parseFormattedNumber,
  parseCurrency,
  formatPercentage,
  formatCompactNumber,
} from '../formatters';

describe('toNepaliNumerals', () => {
  it('should convert English numerals to Nepali numerals', () => {
    expect(toNepaliNumerals('0')).toBe('०');
    expect(toNepaliNumerals('1')).toBe('१');
    expect(toNepaliNumerals('123')).toBe('१२३');
    expect(toNepaliNumerals('9876543210')).toBe('९८७६५४३२१०');
  });

  it('should preserve non-numeric characters', () => {
    expect(toNepaliNumerals('12,345.67')).toBe('१२,३४५.६७');
    expect(toNepaliNumerals('Rs. 1000')).toBe('Rs. १०००');
  });

  it('should handle empty string', () => {
    expect(toNepaliNumerals('')).toBe('');
  });
});

describe('formatNumberWithSeparators', () => {
  it('should format numbers with Indian numbering system separators', () => {
    // Thousands
    expect(formatNumberWithSeparators(1000)).toBe('1,000.00');
    expect(formatNumberWithSeparators(9999)).toBe('9,999.00');
    
    // Ten thousands
    expect(formatNumberWithSeparators(10000)).toBe('10,000.00');
    expect(formatNumberWithSeparators(99999)).toBe('99,999.00');
    
    // Lakhs
    expect(formatNumberWithSeparators(100000)).toBe('1,00,000.00');
    expect(formatNumberWithSeparators(999999)).toBe('9,99,999.00');
    
    // Ten lakhs
    expect(formatNumberWithSeparators(1000000)).toBe('10,00,000.00');
    expect(formatNumberWithSeparators(9999999)).toBe('99,99,999.00');
    
    // Crores
    expect(formatNumberWithSeparators(10000000)).toBe('1,00,00,000.00');
    expect(formatNumberWithSeparators(99999999)).toBe('9,99,99,999.00');
  });

  it('should handle decimal places', () => {
    expect(formatNumberWithSeparators(1234567.89, 2)).toBe('12,34,567.89');
    expect(formatNumberWithSeparators(1234567.89, 0)).toBe('12,34,568');
    expect(formatNumberWithSeparators(1234567.89, 3)).toBe('12,34,567.890');
  });

  it('should handle string input', () => {
    expect(formatNumberWithSeparators('1234567.89')).toBe('12,34,567.89');
    expect(formatNumberWithSeparators('1000')).toBe('1,000.00');
  });

  it('should handle zero and small numbers', () => {
    expect(formatNumberWithSeparators(0)).toBe('0.00');
    expect(formatNumberWithSeparators(1)).toBe('1.00');
    expect(formatNumberWithSeparators(99)).toBe('99.00');
    expect(formatNumberWithSeparators(999)).toBe('999.00');
  });

  it('should handle negative numbers', () => {
    expect(formatNumberWithSeparators(-1234567.89)).toBe('-12,34,567.89');
    expect(formatNumberWithSeparators(-1000)).toBe('-1,000.00');
  });

  it('should handle invalid input', () => {
    expect(formatNumberWithSeparators('invalid')).toBe('0.00');
    expect(formatNumberWithSeparators(NaN)).toBe('0.00');
  });
});

describe('formatNumber', () => {
  it('should format numbers with English numerals by default', () => {
    expect(formatNumber(1234567.89)).toBe('12,34,567.89');
    expect(formatNumber(1000)).toBe('1,000.00');
  });

  it('should format numbers with Nepali numerals when requested', () => {
    expect(formatNumber(1234567.89, 2, true)).toBe('१२,३४,५६७.८९');
    expect(formatNumber(1000, 2, true)).toBe('१,०००.००');
  });

  it('should respect decimal places', () => {
    expect(formatNumber(1234.5678, 0)).toBe('1,235');
    expect(formatNumber(1234.5678, 1)).toBe('1,234.6');
    expect(formatNumber(1234.5678, 3)).toBe('1,234.568');
  });
});

describe('formatCurrency', () => {
  it('should format currency in English with Rs. symbol', () => {
    expect(formatCurrency(1234567.89, 'en')).toBe('Rs. 12,34,567.89');
    expect(formatCurrency(1000, 'en')).toBe('Rs. 1,000.00');
    expect(formatCurrency(0, 'en')).toBe('Rs. 0.00');
  });

  it('should format currency in Nepali with रू symbol', () => {
    expect(formatCurrency(1234567.89, 'ne')).toBe('रू 12,34,567.89');
    expect(formatCurrency(1000, 'ne')).toBe('रू 1,000.00');
  });

  it('should format currency in Nepali with Nepali numerals when requested', () => {
    expect(formatCurrency(1234567.89, 'ne', 2, true)).toBe('रू १२,३४,५६७.८९');
    expect(formatCurrency(1000, 'ne', 2, true)).toBe('रू १,०००.००');
  });

  it('should handle string input', () => {
    expect(formatCurrency('1234567.89', 'en')).toBe('Rs. 12,34,567.89');
    expect(formatCurrency('1000', 'ne')).toBe('रू 1,000.00');
  });

  it('should respect decimal places', () => {
    expect(formatCurrency(1234.5678, 'en', 0)).toBe('Rs. 1,235');
    expect(formatCurrency(1234.5678, 'en', 1)).toBe('Rs. 1,234.6');
    expect(formatCurrency(1234.5678, 'ne', 3)).toBe('रू 1,234.568');
  });

  it('should handle negative amounts', () => {
    expect(formatCurrency(-1234.56, 'en')).toBe('Rs. -1,234.56');
    expect(formatCurrency(-1234.56, 'ne')).toBe('रू -1,234.56');
  });

  it('should default to English when language not specified', () => {
    expect(formatCurrency(1000)).toBe('Rs. 1,000.00');
  });
});

describe('parseFormattedNumber', () => {
  it('should parse English formatted numbers', () => {
    expect(parseFormattedNumber('12,34,567.89')).toBe(1234567.89);
    expect(parseFormattedNumber('1,000.00')).toBe(1000);
    expect(parseFormattedNumber('999')).toBe(999);
  });

  it('should parse Nepali formatted numbers', () => {
    expect(parseFormattedNumber('१२,३४,५६७.८९')).toBe(1234567.89);
    expect(parseFormattedNumber('१,०००.००')).toBe(1000);
    expect(parseFormattedNumber('९९९')).toBe(999);
  });

  it('should handle numbers without separators', () => {
    expect(parseFormattedNumber('1234567.89')).toBe(1234567.89);
    expect(parseFormattedNumber('1000')).toBe(1000);
  });

  it('should handle invalid input', () => {
    expect(parseFormattedNumber('invalid')).toBe(0);
    expect(parseFormattedNumber('')).toBe(0);
  });
});

describe('parseCurrency', () => {
  it('should parse English currency strings', () => {
    expect(parseCurrency('Rs. 12,34,567.89')).toBe(1234567.89);
    expect(parseCurrency('Rs. 1,000.00')).toBe(1000);
  });

  it('should parse Nepali currency strings', () => {
    expect(parseCurrency('रू 12,34,567.89')).toBe(1234567.89);
    expect(parseCurrency('रू १२,३४,५६७.८९')).toBe(1234567.89);
    expect(parseCurrency('रू १,०००.००')).toBe(1000);
  });

  it('should handle currency without spaces', () => {
    expect(parseCurrency('Rs.1000')).toBe(1000);
    expect(parseCurrency('रू१०००')).toBe(1000);
  });

  it('should handle invalid input', () => {
    expect(parseCurrency('invalid')).toBe(0);
    expect(parseCurrency('')).toBe(0);
  });
});

describe('formatPercentage', () => {
  it('should format percentages with English numerals', () => {
    expect(formatPercentage(75.5)).toBe('75.50%');
    expect(formatPercentage(100)).toBe('100.00%');
    expect(formatPercentage(0)).toBe('0.00%');
  });

  it('should format percentages with Nepali numerals when requested', () => {
    expect(formatPercentage(75.5, 2, true)).toBe('७५.५०%');
    expect(formatPercentage(100, 2, true)).toBe('१००.००%');
  });

  it('should respect decimal places', () => {
    expect(formatPercentage(75.5678, 0)).toBe('76%');
    expect(formatPercentage(75.5678, 1)).toBe('75.6%');
    expect(formatPercentage(75.5678, 3)).toBe('75.568%');
  });
});

describe('formatCompactNumber', () => {
  it('should format thousands with K suffix', () => {
    expect(formatCompactNumber(1000)).toBe('1.0K');
    expect(formatCompactNumber(1500)).toBe('1.5K');
    expect(formatCompactNumber(99999)).toBe('100.0K');
  });

  it('should format lakhs with L suffix', () => {
    expect(formatCompactNumber(100000)).toBe('1.0L');
    expect(formatCompactNumber(150000)).toBe('1.5L');
    expect(formatCompactNumber(9999999)).toBe('100.0L');
  });

  it('should format crores with Cr suffix', () => {
    expect(formatCompactNumber(10000000)).toBe('1.0Cr');
    expect(formatCompactNumber(15000000)).toBe('1.5Cr');
    expect(formatCompactNumber(99999999)).toBe('10.0Cr');
  });

  it('should format small numbers without suffix', () => {
    expect(formatCompactNumber(0)).toBe('0.0');
    expect(formatCompactNumber(100)).toBe('100.0');
    expect(formatCompactNumber(999)).toBe('999.0');
  });

  it('should handle negative numbers', () => {
    expect(formatCompactNumber(-1500)).toBe('-1.5K');
    expect(formatCompactNumber(-150000)).toBe('-1.5L');
    expect(formatCompactNumber(-15000000)).toBe('-1.5Cr');
  });

  it('should format with Nepali numerals when requested', () => {
    expect(formatCompactNumber(1500, 1, true)).toBe('१.५K');
    expect(formatCompactNumber(150000, 1, true)).toBe('१.५L');
    expect(formatCompactNumber(15000000, 1, true)).toBe('१.५Cr');
  });

  it('should respect decimal places', () => {
    expect(formatCompactNumber(1234, 0)).toBe('1K');
    expect(formatCompactNumber(1234, 2)).toBe('1.23K');
    expect(formatCompactNumber(123456, 2)).toBe('1.23L');
  });
});

describe('Edge Cases and Integration', () => {
  it('should handle round-trip conversion for English numbers', () => {
    const original = 1234567.89;
    const formatted = formatNumber(original);
    const parsed = parseFormattedNumber(formatted);
    expect(parsed).toBe(original);
  });

  it('should handle round-trip conversion for Nepali numbers', () => {
    const original = 1234567.89;
    const formatted = formatNumber(original, 2, true);
    const parsed = parseFormattedNumber(formatted);
    expect(parsed).toBe(original);
  });

  it('should handle round-trip conversion for currency', () => {
    const original = 1234567.89;
    const formattedEn = formatCurrency(original, 'en');
    const formattedNe = formatCurrency(original, 'ne', 2, true);
    
    expect(parseCurrency(formattedEn)).toBe(original);
    expect(parseCurrency(formattedNe)).toBe(original);
  });

  it('should handle very large numbers', () => {
    const large = 999999999.99;
    expect(formatNumber(large)).toBe('99,99,99,999.99');
    expect(formatCurrency(large, 'en')).toBe('Rs. 99,99,99,999.99');
    expect(formatCompactNumber(large)).toBe('100.0Cr');
  });

  it('should handle very small decimal numbers', () => {
    expect(formatNumber(0.01)).toBe('0.01');
    expect(formatNumber(0.001, 3)).toBe('0.001');
    expect(formatCurrency(0.50, 'en')).toBe('Rs. 0.50');
  });
});
