export const MAINTENANCE_STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'overdue', label: 'Overdue' },
] as const;

export function formatMaintenanceStatus(status: string): string {
  return status.replace(/_/g, ' ');
}
