import { validateMaintenanceRecord } from '../maintenanceValidation';

const validRecord = {
  vehicleId: 1,
  type: 'inspection',
  cost: 12.34,
  date: '2026-10-20',
  nextDueDate: '2027-01-10',
  status: 'completed',
};

describe('validateMaintenanceRecord', () => {
  it('accepts a valid maintenance record', () => {
    expect(validateMaintenanceRecord(validRecord)).toBeNull();
    expect(validateMaintenanceRecord({ ...validRecord, cost: 1.15 })).toBeNull();
    expect(validateMaintenanceRecord({
      ...validRecord,
      date: new Date('2026-10-20T00:00:00.000Z'),
      nextDueDate: new Date('2027-01-10T00:00:00.000Z'),
    })).toBeNull();
  });

  it.each([-1, 'not-a-number', 1.234, 100_000_000])('rejects an invalid cost: %s', (cost) => {
    expect(validateMaintenanceRecord({ ...validRecord, cost })).toMatch(/cost must be/);
  });

  it.each(['2026-02-30', '10/20/2026', 'invalid'])('rejects an invalid service date: %s', (date) => {
    expect(validateMaintenanceRecord({ ...validRecord, date })).toMatch(/date must be/);
  });

  it('rejects a next due date before the service date', () => {
    expect(validateMaintenanceRecord({ ...validRecord, nextDueDate: '2026-10-19' }))
      .toBe('nextDueDate must be on or after date');
  });

  it('rejects an unsupported status', () => {
    expect(validateMaintenanceRecord({ ...validRecord, status: 'invalid' })).toMatch(/status must be/);
  });

  it('requires a positive integer vehicle ID and a non-empty type', () => {
    expect(validateMaintenanceRecord({ ...validRecord, vehicleId: 0 })).toMatch(/vehicleId/);
    expect(validateMaintenanceRecord({ ...validRecord, type: '  ' })).toMatch(/type is required/);
  });
});
