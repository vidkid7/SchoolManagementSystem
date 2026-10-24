import { calculateOverdueFine, getOverdueDays, LIBRARY_FINE_PER_DAY } from './circulationFine';

describe('circulation fine estimate', () => {
  const now = new Date('2026-10-22T12:00:00.000Z');

  it('uses the backend daily rate and rounds a partial overdue day up', () => {
    expect(LIBRARY_FINE_PER_DAY).toBe(5);
    expect(getOverdueDays('2026-10-22T11:59:59.000Z', now)).toBe(1);
    expect(calculateOverdueFine('2026-10-22T11:59:59.000Z', now)).toBe(5);
  });

  it('returns no fine before or on the due date and ignores invalid dates', () => {
    expect(calculateOverdueFine('2026-10-23T12:00:00.000Z', now)).toBe(0);
    expect(calculateOverdueFine('not-a-date', now)).toBe(0);
  });
});
