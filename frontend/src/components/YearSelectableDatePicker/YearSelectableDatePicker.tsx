import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Box, TextField } from '@mui/material';
import type { TextFieldProps } from '@mui/material/TextField';
import { useState } from 'react';

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
  const [pendingTime, setPendingTime] = useState('');
  const dateTime = parseDateTimeLocal(value);
  const timeValue = dateTime
    ? `${String(dateTime.getHours()).padStart(2, '0')}:${String(dateTime.getMinutes()).padStart(2, '0')}`
    : pendingTime;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) 140px' }, gap: 1 }}>
        <DatePicker
          label={String(textFieldProps.label ?? '')}
          value={dateTime}
          onChange={(date) => {
            if (!date) {
              onChange?.({ target: { value: '' } });
              return;
            }
            const [hours = '09', minutes = '00'] = (timeValue || '09:00').split(':');
            const next = new Date(date.getFullYear(), date.getMonth(), date.getDate(), Number(hours), Number(minutes));
            onChange?.({ target: { value: formatDateTimeLocal(next) } });
          }}
          views={['year', 'month', 'day']}
          openTo="year"
          disabled={textFieldProps.disabled}
          minDate={parseDateTimeLocal((textFieldProps.inputProps as { min?: string } | undefined)?.min) ?? undefined}
          maxDate={parseDateTimeLocal((textFieldProps.inputProps as { max?: string } | undefined)?.max) ?? undefined}
          slotProps={{
            textField: {
              ...textFieldProps,
              fullWidth: true,
              required: textFieldProps.required,
              error: textFieldProps.error,
              helperText: textFieldProps.helperText,
            } as TextFieldProps,
          }}
        />
        <TextField
          label="Time"
          type="time"
          value={timeValue}
          disabled={textFieldProps.disabled}
          required={textFieldProps.required}
          fullWidth
          InputLabelProps={{ shrink: true }}
          onChange={(event) => {
            const nextTime = event.target.value;
            setPendingTime(nextTime);
            if (!dateTime || !nextTime) return;
            const [hours, minutes] = nextTime.split(':').map(Number);
            const next = new Date(dateTime.getFullYear(), dateTime.getMonth(), dateTime.getDate(), hours, minutes);
            onChange?.({ target: { value: formatDateTimeLocal(next) } });
          }}
        />
      </Box>
    </LocalizationProvider>
  );
}
