import { formatBSDate, formatDate, formatDateForInput, parseBSDate, parseDate } from './studentDateUtils';

describe('student date conversion', () => {
  it('keeps date-only values on the same calendar day', () => {
    const date = parseDate('2019-10-17');

    expect(formatDate(date)).toBe('2019-10-17');
    expect(formatDateForInput('2019-10-17T00:00:00.000Z')).toBe('2019-10-17');
  });

  it('round-trips a Nepali date without shifting the day', () => {
    const adDate = parseBSDate('2076-06-30');

    expect(adDate).not.toBeNull();
    expect(formatBSDate(adDate)).toBe('2076-06-30');
    expect(formatDate(adDate)).toBe('2019-10-17');
  });
});
