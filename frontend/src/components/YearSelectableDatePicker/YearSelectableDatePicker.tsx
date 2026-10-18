import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
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

export function parseDateTimeLocal(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDateTimeLocal(value: Date | null): string {
  if (!value || Number.isNaN(value.getTime())) return '';
  return `${formatDateOnly(value)}T${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
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
  minDate?: Date | null;
  maxDate?: Date | null;
  textFieldProps?: TextFieldProps;
}

export interface YearSelectableDateFieldProps extends Omit<TextFieldProps, 'value' | 'onChange' | 'type'> {
  value?: string | null;
  // Keep MUI TextField's event callback shape for existing form handlers.
  onChange?: (event: any) => void;
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
  minDate,
  maxDate,
  textFieldProps = {},
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
        minDate={minDate ?? undefined}
        maxDate={maxDate ?? undefined}
        slotProps={{
          textField: {
            ...textFieldProps,
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

/** Drop-in string-valued field for replacing native type=date TextFields. */
export function YearSelectableDateField({ value, onChange, ...textFieldProps }: YearSelectableDateFieldProps) {
  const inputConstraints = textFieldProps.inputProps as { min?: string; max?: string } | undefined;

  return (
    <YearSelectableDatePicker
      label={String(textFieldProps.label ?? '')}
      value={parseDateOnly(value)}
      onChange={(date) => onChange?.({ target: { value: formatDateOnly(date) } })}
      error={textFieldProps.error}
      helperText={textFieldProps.helperText}
      required={textFieldProps.required}
      disabled={textFieldProps.disabled}
      fullWidth={textFieldProps.fullWidth}
      minDate={parseDateOnly(inputConstraints?.min)}
      maxDate={parseDateOnly(inputConstraints?.max)}
      textFieldProps={textFieldProps as unknown as TextFieldProps}
    />
  );
}

export interface YearSelectableDateTimeFieldProps extends Omit<TextFieldProps, 'value' | 'onChange' | 'type'> {
  value?: string | null;
  onChange?: (event: { target: { value: string } }) => void;
}

/** Drop-in local datetime string field with direct year-first navigation. */
export function YearSelectableDateTimeField({ value, onChange, ...textFieldProps }: YearSelectableDateTimeFieldProps) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DateTimePicker
        label={String(textFieldProps.label ?? '')}
        value={parseDateTimeLocal(value)}
        onChange={(date) => onChange?.({ target: { value: formatDateTimeLocal(date) } })}
        views={['year', 'month', 'day', 'hours', 'minutes']}
        openTo="year"
        disabled={textFieldProps.disabled}
        minDateTime={parseDateTimeLocal((textFieldProps.inputProps as { min?: string } | undefined)?.min) ?? undefined}
        maxDateTime={parseDateTimeLocal((textFieldProps.inputProps as { max?: string } | undefined)?.max) ?? undefined}
        slotProps={{
          textField: {
            ...textFieldProps,
            fullWidth: textFieldProps.fullWidth,
            required: textFieldProps.required,
          } as TextFieldProps,
        }}
      />
    </LocalizationProvider>
  );
}
