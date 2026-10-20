import { formatMaintenanceStatus, MAINTENANCE_STATUS_OPTIONS } from './transportMaintenance';

describe('transport maintenance status contract', () => {
  it('uses the API status value for in-progress records', () => {
    expect(MAINTENANCE_STATUS_OPTIONS).toContainEqual({ value: 'in_progress', label: 'In Progress' });
    expect(MAINTENANCE_STATUS_OPTIONS.map(({ value }) => value)).not.toContain('in-progress');
  });

  it('formats persisted underscore statuses for display', () => {
    expect(formatMaintenanceStatus('in_progress')).toBe('in progress');
  });
});
