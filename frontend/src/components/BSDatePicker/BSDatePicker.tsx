import React, { useState, useCallback, useMemo } from 'react';
import {
  TextField,
  Box,
  IconButton,
  Popover,
  Paper,
  Typography,
  Grid,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  styled
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  CalendarToday,
  SwapHoriz
} from '@mui/icons-material';
import NepaliDate from 'nepali-date-converter';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';

/**
 * BS Date Picker Component
 * 
 * A custom React date picker component for selecting Bikram Sambat (BS) dates
 * with support for toggling between BS and AD calendar views.
 * 
 * Features:
 * - Display Nepali month names (बैशाख, जेठ, असार, etc.)
 * - Toggle between BS and AD calendar views
 * - Integration with React Hook Form
 * - Material-UI design patterns
 * - Dual date display format: "2081-10-24 BS (2025-02-06 AD)"
 * 
 * Requirements: N4.2, N4.3, N4.4, N4.8
 */

// Nepali month names
const NEPALI_MONTHS = [
  { en: 'Baisakh', np: 'बैशाख' },
  { en: 'Jestha', np: 'जेठ' },
  { en: 'Asar', np: 'असार' },
  { en: 'Shrawan', np: 'श्रावण' },
  { en: 'Bhadra', np: 'भाद्र' },
  { en: 'Aswin', np: 'आश्विन' },
  { en: 'Kartik', np: 'कार्तिक' },
  { en: 'Mangsir', np: 'मंसिर' },
  { en: 'Poush', np: 'पौष' },
  { en: 'Magh', np: 'माघ' },
  { en: 'Falgun', np: 'फाल्गुन' },
  { en: 'Chaitra', np: 'चैत्र' }
];

// Styled components
const CalendarPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  minWidth: 320,
  maxWidth: 400
}));

const CalendarHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(2)
}));

const DayButton = styled(Button)<{ selected?: boolean; today?: boolean }>(
  ({ theme, selected, today }) => ({
    minWidth: 36,
    height: 36,
    padding: 0,
    borderRadius: '50%',
    ...(selected && {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      '&:hover': {
        backgroundColor: theme.palette.primary.dark
      }
    }),
    ...(today &&
      !selected && {
        border: `2px solid ${theme.palette.primary.main}`
      })
  })
);

const WeekDayLabel = styled(Typography)(({ theme }) => ({
  textAlign: 'center',
  fontWeight: 600,
  color: theme.palette.text.secondary,
  fontSize: '0.875rem'
}));

export interface BSDatePickerProps {
  value?: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
  defaultCalendarView?: 'BS' | 'AD';
}

/**
 * Standalone BS Date Picker Component
 */
export const BSDatePicker: React.FC<BSDatePickerProps> = ({
  value,
  onChange,
  label = 'Date',
  error = false,
  helperText,
  disabled = false,
  required = false,
  minDate,
  maxDate,
  defaultCalendarView = 'BS'
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [calendarView, setCalendarView] = useState<'BS' | 'AD'>(
    defaultCalendarView
  );
  const [viewDate, setViewDate] = useState<Date>(value || new Date());

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!disabled) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDateSelect = (date: Date) => {
    onChange(date);
    handleClose();
  };

  const handleCalendarViewToggle = (
    _event: React.MouseEvent<HTMLElement>,
    newView: 'BS' | 'AD' | null
  ) => {
    if (newView !== null) {
      setCalendarView(newView);
    }
  };

  // Format display value
  const displayValue = useMemo(() => {
    if (!value) return '';

    try {
      // Check if value is a valid date
      if (!(value instanceof Date) || isNaN(value.getTime())) {
        return '';
      }

      const nepaliDate = new NepaliDate(value);
      const bsYear = nepaliDate.getYear();
      const bsMonth = nepaliDate.getMonth() + 1;
      const bsDay = nepaliDate.getDate();
      const adYear = value.getFullYear();
      const adMonth = String(value.getMonth() + 1).padStart(2, '0');
      const adDay = String(value.getDate()).padStart(2, '0');

      return `${bsYear}-${String(bsMonth).padStart(2, '0')}-${String(bsDay).padStart(2, '0')} BS (${adYear}-${adMonth}-${adDay} AD)`;
    } catch (error) {
      // Silently handle dates outside valid Nepali calendar range (2000/01/01 - 2090/12/30)
      return '';
    }
  }, [value]);

  return (
    <>
      <TextField
        fullWidth
        label={label}
        value={displayValue}
        onClick={handleClick}
        error={error}
        helperText={helperText}
        disabled={disabled}
        required={required}
        InputProps={{
          readOnly: true,
          endAdornment: (
            <IconButton size="small" disabled={disabled}>
              <CalendarToday />
            </IconButton>
          )
        }}
      />
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
      >
        <CalendarPaper>
          <BSCalendarView
            value={value}
            viewDate={viewDate}
            onViewDateChange={setViewDate}
            onDateSelect={handleDateSelect}
            calendarView={calendarView}
            onCalendarViewChange={handleCalendarViewToggle}
            minDate={minDate}
            maxDate={maxDate}
          />
        </CalendarPaper>
      </Popover>
    </>
  );
};

interface BSCalendarViewProps {
  value: Date | null | undefined;
  viewDate: Date;
  onViewDateChange: (date: Date) => void;
  onDateSelect: (date: Date) => void;
  calendarView: 'BS' | 'AD';
  onCalendarViewChange: (
    event: React.MouseEvent<HTMLElement>,
    newView: 'BS' | 'AD' | null
  ) => void;
  minDate?: Date;
  maxDate?: Date;
}

const BSCalendarView: React.FC<BSCalendarViewProps> = ({
  value,
  viewDate,
  onViewDateChange,
  onDateSelect,
  calendarView,
  onCalendarViewChange,
  minDate,
  maxDate
}) => {
  const nepaliViewDate = useMemo(
    () => new NepaliDate(viewDate),
    [viewDate]
  );

  const currentYear = nepaliViewDate.getYear();
  const currentMonth = nepaliViewDate.getMonth();

  const handlePreviousMonth = useCallback(() => {
    const newDate = new NepaliDate(currentYear, currentMonth - 1, 1);
    onViewDateChange(newDate.toJsDate());
  }, [currentYear, currentMonth, onViewDateChange]);

  const handleNextMonth = useCallback(() => {
    const newDate = new NepaliDate(currentYear, currentMonth + 1, 1);
    onViewDateChange(newDate.toJsDate());
  }, [currentYear, currentMonth, onViewDateChange]);

  const handleToday = useCallback(() => {
    const today = new Date();
    onViewDateChange(today);
    onDateSelect(today);
  }, [onViewDateChange, onDateSelect]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];
    const firstDayOfMonth = new NepaliDate(currentYear, currentMonth, 1);
    
    // Get days in month by checking when the next month starts
    let daysInMonth = 30; // Default
    try {
      // Try to create the next month's first day to determine current month's length
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const nextMonthFirst = new NepaliDate(nextYear, nextMonth, 1);
      const currentMonthLast = new Date(nextMonthFirst.toJsDate().getTime() - 24 * 60 * 60 * 1000);
      const lastDayNepali = new NepaliDate(currentMonthLast);
      daysInMonth = lastDayNepali.getDate();
    } catch (error) {
      // Fallback: try days 29-32 to find the last valid day
      for (let testDay = 32; testDay >= 29; testDay--) {
        try {
          new NepaliDate(currentYear, currentMonth, testDay);
          daysInMonth = testDay;
          break;
        } catch {
          continue;
        }
      }
    }
    
    const firstDayOfWeek = firstDayOfMonth.toJsDate().getDay();

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      try {
        const date = new NepaliDate(currentYear, currentMonth, day);
        days.push(date.toJsDate());
      } catch (error) {
        // Skip invalid days
        break;
      }
    }

    return days;
  }, [currentYear, currentMonth]);

  const isDateSelected = useCallback(
    (date: Date | null): boolean => {
      if (!date || !value) return false;
      return (
        date.getFullYear() === value.getFullYear() &&
        date.getMonth() === value.getMonth() &&
        date.getDate() === value.getDate()
      );
    },
    [value]
  );

  const isToday = useCallback((date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  }, []);

  const isDateDisabled = useCallback(
    (date: Date | null): boolean => {
      if (!date) return true;
      if (minDate && date < minDate) return true;
      if (maxDate && date > maxDate) return true;
      return false;
    },
    [minDate, maxDate]
  );

  const monthName =
    calendarView === 'BS'
      ? NEPALI_MONTHS[currentMonth].np
      : NEPALI_MONTHS[currentMonth].en;

  return (
    <Box>
      {/* Calendar view toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <ToggleButtonGroup
          value={calendarView}
          exclusive
          onChange={onCalendarViewChange}
          size="small"
        >
          <ToggleButton value="BS">
            <Typography variant="body2">BS</Typography>
          </ToggleButton>
          <ToggleButton value="AD">
            <Typography variant="body2">AD</Typography>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Calendar header */}
      <CalendarHeader>
        <IconButton size="small" onClick={handlePreviousMonth}>
          <ChevronLeft />
        </IconButton>
        <Typography variant="subtitle1" fontWeight={600}>
          {monthName} {currentYear}
        </Typography>
        <IconButton size="small" onClick={handleNextMonth}>
          <ChevronRight />
        </IconButton>
      </CalendarHeader>

      {/* Week day labels */}
      <Grid container spacing={0.5} sx={{ mb: 1 }}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <Grid item xs key={day}>
            <WeekDayLabel>{day}</WeekDayLabel>
          </Grid>
        ))}
      </Grid>

      {/* Calendar days */}
      <Grid container spacing={0.5}>
        {calendarDays.map((date, index) => (
          <Grid item xs key={index}>
            {date ? (
              <DayButton
                size="small"
                selected={isDateSelected(date)}
                today={isToday(date)}
                disabled={isDateDisabled(date)}
                onClick={() => !isDateDisabled(date) && onDateSelect(date)}
              >
                {date.getDate()}
              </DayButton>
            ) : (
              <Box sx={{ minWidth: 36, height: 36 }} />
            )}
          </Grid>
        ))}
      </Grid>

      {/* Today button */}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Button size="small" onClick={handleToday} startIcon={<CalendarToday />}>
          Today
        </Button>
      </Box>
    </Box>
  );
};

/**
 * BS Date Picker with React Hook Form integration
 */
export interface BSDatePickerFieldProps<T extends FieldValues>
  extends Omit<BSDatePickerProps, 'value' | 'onChange'> {
  name: Path<T>;
  control: Control<T>;
}

export function BSDatePickerField<T extends FieldValues>({
  name,
  control,
  ...props
}: BSDatePickerFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <BSDatePicker
          {...props}
          value={field.value}
          onChange={field.onChange}
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
        />
      )}
    />
  );
}

export default BSDatePicker;
