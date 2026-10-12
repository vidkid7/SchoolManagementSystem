const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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
