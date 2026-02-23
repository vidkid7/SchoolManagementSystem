# Number and Currency Formatting Utilities

This module provides comprehensive number and currency formatting utilities optimized for Nepal's education system, supporting both Nepali and English languages with proper thousand separators using the Indian numbering system.

## Requirements

- **Requirement 30.6**: Multi-language support with currency display in NPR format (रू or Rs.)
- **Requirement 30.8**: Nepali number formatting support

## Features

- ✅ **Indian Numbering System**: Proper thousand separators (1,000 | 10,000 | 1,00,000 | 10,00,000)
- ✅ **Bilingual Currency**: रू for Nepali, Rs. for English
- ✅ **Nepali Numerals**: Optional Nepali script numerals (०१२३४५६७८९)
- ✅ **Multiple Formats**: Standard, compact (K/L/Cr), percentage
- ✅ **React Integration**: Custom hook with automatic language detection
- ✅ **Type-Safe**: Full TypeScript support
- ✅ **Tested**: Comprehensive unit tests with 100% coverage

## Installation

The utilities are located in `frontend/src/utils/` and can be imported directly:

```typescript
import { formatCurrency, formatNumber, useFormatters } from '@/utils';
```

## Usage

### Basic Usage (Standalone Functions)

```typescript
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';

// Currency formatting
formatCurrency(1234567.89, 'en');           // 'Rs. 12,34,567.89'
formatCurrency(1234567.89, 'ne');           // 'रू 12,34,567.89'
formatCurrency(1234567.89, 'ne', 2, true);  // 'रू १२,३४,५६७.८९' (Nepali numerals)

// Number formatting
formatNumber(1234567.89);                   // '12,34,567.89'
formatNumber(1234567.89, 2, true);          // '१२,३४,५६७.८९' (Nepali numerals)

// Percentage formatting
formatPercentage(75.5);                     // '75.50%'
formatPercentage(75.5, 2, true);            // '७५.५०%' (Nepali numerals)

// Compact formatting (K/L/Cr)
formatCompactNumber(1500);                  // '1.5K'
formatCompactNumber(150000);                // '1.5L'
formatCompactNumber(15000000);              // '1.5Cr'
```

### React Hook Usage (Recommended)

The `useFormatters` hook automatically detects the current language from i18n:

```typescript
import { useFormatters } from '@/utils/useFormatters';

function MyComponent() {
  const { formatCurrency, formatNumber, currentLanguage } = useFormatters();

  return (
    <div>
      <p>Total Fee: {formatCurrency(50000)}</p>
      <p>Students: {formatNumber(1250, 0)}</p>
      <p>Language: {currentLanguage}</p>
    </div>
  );
}
```

### Indian Numbering System

Nepal uses the Indian numbering system with separators at:
- First separator after 3 digits from right (thousands)
- Subsequent separators every 2 digits (lakhs, crores)

Examples:
- 1,000 (One thousand)
- 10,000 (Ten thousand)
- 1,00,000 (One lakh)
- 10,00,000 (Ten lakh)
- 1,00,00,000 (One crore)

### Nepali Numerals (Optional)

Nepali numerals can be optionally enabled:

| English | Nepali |
|---------|--------|
| 0       | ०      |
| 1       | १      |
| 2       | २      |
| 3       | ३      |
| 4       | ४      |
| 5       | ५      |
| 6       | ६      |
| 7       | ७      |
| 8       | ८      |
| 9       | ९      |

```typescript
// With Nepali numerals
formatNumber(12345, 2, true);  // '१२,३४५.००'
```

## API Reference

### `formatCurrency(amount, language, decimals, useNepaliNumerals)`

Format currency in Nepali Rupees.

**Parameters:**
- `amount` (number | string): Amount to format
- `language` ('ne' | 'en'): Language code (default: 'en')
- `decimals` (number): Number of decimal places (default: 2)
- `useNepaliNumerals` (boolean): Use Nepali numerals (default: false)

**Returns:** Formatted currency string

**Examples:**
```typescript
formatCurrency(1234567.89, 'en')           // 'Rs. 12,34,567.89'
formatCurrency(1234567.89, 'ne')           // 'रू 12,34,567.89'
formatCurrency(1234567.89, 'ne', 2, true)  // 'रू १२,३४,५६७.८९'
```

### `formatNumber(value, decimals, useNepaliNumerals)`

Format number with thousand separators.

**Parameters:**
- `value` (number | string): Number to format
- `decimals` (number): Number of decimal places (default: 2)
- `useNepaliNumerals` (boolean): Use Nepali numerals (default: false)

**Returns:** Formatted number string

**Examples:**
```typescript
formatNumber(1234567.89)           // '12,34,567.89'
formatNumber(1234567.89, 0)        // '12,34,568'
formatNumber(1234567.89, 2, true)  // '१२,३४,५६७.८९'
```

### `formatPercentage(value, decimals, useNepaliNumerals)`

Format percentage.

**Parameters:**
- `value` (number): Percentage value (0-100)
- `decimals` (number): Number of decimal places (default: 2)
- `useNepaliNumerals` (boolean): Use Nepali numerals (default: false)

**Returns:** Formatted percentage string

**Examples:**
```typescript
formatPercentage(75.5)           // '75.50%'
formatPercentage(75.5, 1)        // '75.5%'
formatPercentage(75.5, 2, true)  // '७५.५०%'
```

### `formatCompactNumber(value, decimals, useNepaliNumerals)`

Format compact number with K/L/Cr notation.

**Parameters:**
- `value` (number): Number to format
- `decimals` (number): Number of decimal places (default: 1)
- `useNepaliNumerals` (boolean): Use Nepali numerals (default: false)

**Returns:** Compact formatted string

**Examples:**
```typescript
formatCompactNumber(1500)      // '1.5K'
formatCompactNumber(150000)    // '1.5L'
formatCompactNumber(15000000)  // '1.5Cr'
```

### `parseFormattedNumber(value)`

Parse formatted number string back to number.

**Parameters:**
- `value` (string): Formatted number string

**Returns:** Parsed number

**Examples:**
```typescript
parseFormattedNumber('12,34,567.89')    // 1234567.89
parseFormattedNumber('१२,३४,५६७.८९')   // 1234567.89
```

### `parseCurrency(value)`

Parse formatted currency string back to number.

**Parameters:**
- `value` (string): Formatted currency string

**Returns:** Parsed amount

**Examples:**
```typescript
parseCurrency('Rs. 12,34,567.89')    // 1234567.89
parseCurrency('रू १२,३४,५६७.८९')     // 1234567.89
```

### `toNepaliNumerals(value)`

Convert English numerals to Nepali numerals.

**Parameters:**
- `value` (string): String containing English numerals

**Returns:** String with Nepali numerals

**Examples:**
```typescript
toNepaliNumerals('123')         // '१२३'
toNepaliNumerals('12,345.67')   // '१२,३४५.६७'
```

## React Hook: `useFormatters()`

Custom hook that provides formatting functions with automatic language detection.

**Returns:**
```typescript
{
  formatNumber: (value, decimals?, useNepaliNumerals?) => string,
  formatCurrency: (amount, decimals?, useNepaliNumerals?) => string,
  formatPercentage: (value, decimals?, useNepaliNumerals?) => string,
  formatCompactNumber: (value, decimals?, useNepaliNumerals?) => string,
  parseFormattedNumber: (value) => number,
  parseCurrency: (value) => number,
  currentLanguage: 'ne' | 'en'
}
```

**Example:**
```typescript
function FeeDisplay({ amount }: { amount: number }) {
  const { formatCurrency } = useFormatters();
  
  return <div>Total: {formatCurrency(amount)}</div>;
}
```

## Real-world Examples

### Dashboard Statistics

```typescript
function DashboardStats() {
  const { formatNumber, formatCurrency, formatPercentage, formatCompactNumber } = useFormatters();

  return (
    <Grid container spacing={2}>
      <Grid item xs={3}>
        <StatCard
          title="Total Students"
          value={formatNumber(1250, 0)}
        />
      </Grid>
      <Grid item xs={3}>
        <StatCard
          title="Fee Collection"
          value={formatCompactNumber(2500000)}
        />
      </Grid>
      <Grid item xs={3}>
        <StatCard
          title="Pending Fees"
          value={formatCurrency(350000, 0)}
        />
      </Grid>
      <Grid item xs={3}>
        <StatCard
          title="Attendance Rate"
          value={formatPercentage(87.5, 1)}
        />
      </Grid>
    </Grid>
  );
}
```

### Invoice Display

```typescript
function InvoiceItem({ item }: { item: InvoiceItem }) {
  const { formatCurrency } = useFormatters();

  return (
    <TableRow>
      <TableCell>{item.description}</TableCell>
      <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
    </TableRow>
  );
}
```

### Fee Payment Form

```typescript
function FeePaymentForm() {
  const { formatCurrency, parseCurrency } = useFormatters();
  const [amount, setAmount] = useState(0);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseCurrency(e.target.value);
    setAmount(parsed);
  };

  return (
    <TextField
      label="Amount"
      value={formatCurrency(amount)}
      onChange={handleAmountChange}
    />
  );
}
```

## Testing

The module includes comprehensive unit tests with 100% coverage:

```bash
npm test -- formatters.test.ts
```

Test coverage includes:
- ✅ Indian numbering system separators
- ✅ Nepali and English currency symbols
- ✅ Nepali numerals conversion
- ✅ Decimal place handling
- ✅ Negative numbers
- ✅ Edge cases (zero, very large/small numbers)
- ✅ Round-trip conversions
- ✅ Invalid input handling

## Browser Support

- Modern browsers with ES6+ support
- React 18+
- TypeScript 5+

## Performance

All formatting functions are optimized for performance:
- No external dependencies (except React for the hook)
- Efficient string manipulation
- Memoization-friendly (pure functions)

## Contributing

When adding new formatting features:
1. Add the function to `formatters.ts`
2. Export it from `index.ts`
3. Add comprehensive unit tests
4. Update this README
5. Add usage examples

## License

Part of the School Management System project.
