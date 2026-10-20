/**
 * Date formatting utilities
 */

/** Formats a date as YYYY-MM-DD in the user's local calendar, for date-only inputs. */
export function formatLocalDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Returns a human-readable relative time string (e.g. "2 minutes ago").
 */
export function formatDistanceToNow(dateStr?: string | Date | number | null): string {
  if (!dateStr) return 'just now';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const timestamp = date instanceof Date ? date.getTime() : Number(date);
  if (!Number.isFinite(timestamp)) return 'just now';

  const diffMs = Math.max(0, Date.now() - timestamp);
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
