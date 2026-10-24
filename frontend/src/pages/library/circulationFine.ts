const DAY_MS = 24 * 60 * 60 * 1000;
export const LIBRARY_FINE_PER_DAY = 5;

export function getOverdueDays(dueDate: string | Date, now = new Date()): number {
  const dueTime = new Date(dueDate).getTime();
  if (!Number.isFinite(dueTime)) return 0;
  return Math.max(0, Math.ceil((now.getTime() - dueTime) / DAY_MS));
}

export function calculateOverdueFine(dueDate: string | Date, now = new Date()): number {
  return getOverdueDays(dueDate, now) * LIBRARY_FINE_PER_DAY;
}
