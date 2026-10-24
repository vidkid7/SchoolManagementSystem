import NepaliDate from 'nepali-date-converter';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const BS_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parse a stored BS date-only value into the Gregorian Date used by the picker. */
export function parseBSDate(value: string | undefined): Date | null {
  if (!value) return null;
  const match = value.match(BS_DATE_PATTERN);
  if (!match) return null;

  const [, year, month, day] = match;
  try {
    return new NepaliDate(Number(year), Number(month) - 1, Number(day)).toJsDate();
  } catch {
    return null;
  }
}

/** Format the picker date back to the BS YYYY-MM-DD value expected by the API. */
export function formatBSDate(value: Date | null): string {
  if (!value || Number.isNaN(value.getTime())) return '';
  try {
    const nepaliDate = new NepaliDate(value);
    return `${nepaliDate.getYear()}-${String(nepaliDate.getMonth() + 1).padStart(2, '0')}-${String(nepaliDate.getDate()).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

/** Format a staff date-only value in the school's Nepal timezone. */
export function toNepalDateOnly(value: unknown): string {
  if (typeof value === 'string' && DATE_ONLY_PATTERN.test(value)) {
    return value;
  }

  const date = value instanceof Date ? value : new Date(String(value ?? ''));
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: string) => parts.find(item => item.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}
