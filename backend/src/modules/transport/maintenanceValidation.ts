const MAINTENANCE_STATUSES = new Set(['scheduled', 'in_progress', 'completed', 'cancelled', 'overdue']);

export interface MaintenanceRecordInput {
  vehicleId?: unknown;
  type?: unknown;
  cost?: unknown;
  date?: unknown;
  nextDueDate?: unknown;
  status?: unknown;
}

function isValidDateOnly(value: unknown): boolean {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function validateMaintenanceRecord(input: MaintenanceRecordInput): string | null {
  const vehicleId = Number(input.vehicleId);
  if (!Number.isInteger(vehicleId) || vehicleId <= 0) return 'vehicleId must be a positive integer';

  if (typeof input.type !== 'string' || !input.type.trim() || input.type.trim().length > 120) {
    return 'type is required and must be at most 120 characters';
  }

  if (input.cost !== undefined && input.cost !== null && input.cost !== '') {
    const cost = Number(input.cost);
    const cents = cost * 100;
    if (!Number.isFinite(cost) || cost < 0 || cost > 99_999_999.99 || Math.abs(Math.round(cents) - cents) > 1e-8) {
      return 'cost must be a non-negative amount with at most two decimal places';
    }
  }

  if (input.date !== undefined && input.date !== null && input.date !== '' && !isValidDateOnly(input.date)) {
    return 'date must be a valid YYYY-MM-DD date';
  }

  if (input.nextDueDate !== undefined && input.nextDueDate !== null && input.nextDueDate !== '') {
    if (!isValidDateOnly(input.nextDueDate)) return 'nextDueDate must be a valid YYYY-MM-DD date';
    if (typeof input.date === 'string' && isValidDateOnly(input.date) && String(input.nextDueDate) < input.date) {
      return 'nextDueDate must be on or after date';
    }
  }

  if (input.status !== undefined && input.status !== null && !MAINTENANCE_STATUSES.has(String(input.status))) {
    return 'status must be scheduled, in_progress, completed, cancelled, or overdue';
  }

  return null;
}
