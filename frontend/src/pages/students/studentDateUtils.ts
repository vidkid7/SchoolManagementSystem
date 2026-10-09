import NepaliDate from 'nepali-date-converter';

export const parseDate = (value: string | undefined): Date | null => {
  if (!value) return null;
  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

export const formatDate = (date: Date | null): string => {
  if (!date) return '';
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
};

export const parseBSDate = (value: string | undefined): Date | null => {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return parseDate(value);

  const [, year, month, day] = match;
  try {
    return new NepaliDate(Number(year), Number(month) - 1, Number(day)).toJsDate();
  } catch {
    return null;
  }
};

export const formatBSDate = (date: Date | null): string => {
  if (!date) return '';
  try {
    const nepaliDate = new NepaliDate(date);
    return [
      nepaliDate.getYear(),
      String(nepaliDate.getMonth() + 1).padStart(2, '0'),
      String(nepaliDate.getDate()).padStart(2, '0')
    ].join('-');
  } catch {
    return '';
  }
};

export const formatDateForInput = (value: string | undefined): string => {
  if (!value) return '';
  // Keep the calendar date from SQL/ISO date strings instead of shifting it
  // through UTC, which can move the displayed date in non-UTC time zones.
  const datePart = value.match(/^(\d{4}-\d{2}-\d{2})(?:$|T)/);
  if (datePart) return datePart[1];
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  return formatDate(date);
};
