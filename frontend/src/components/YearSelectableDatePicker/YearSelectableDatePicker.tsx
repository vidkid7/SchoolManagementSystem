import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import type { TextFieldProps } from '@mui/material/TextField';

export function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function formatDateOnly(value: Date | null): string {
  if (!value || Number.isNaN(value.getTime())) return '';
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

export interface YearSelectableDatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  label: string;
  error?: boolean;
  helperText?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

/** A Gregorian date picker that opens on the year view for quick year selection. */
export function YearSelectableDatePicker({
  value,
  onChange,
  label,
  error = false,
  helperText,
  required = false,
  disabled = false,
  fullWidth = true,
}: YearSelectableDatePickerProps) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DatePicker
        label={label}
        value={value}
        onChange={onChange}
        views={['year', 'month', 'day']}
        openTo="year"
        disabled={disabled}
        slotProps={{
          textField: {
            fullWidth,
            required,
            error,
            helperText,
          } as TextFieldProps,
        }}
      />
    </LocalizationProvider>
  );
}
