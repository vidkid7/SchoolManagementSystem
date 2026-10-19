import { getAcademicYearInfo, getCurrentBSAcademicYear } from '../nepaliCalendar';

describe('Nepali academic year calendar dates', () => {
  it('uses the actual BS calendar month lengths for the year boundaries', () => {
    const year = getAcademicYearInfo(2083);

    expect(year.startDateBS).toBe('2083-04-01');
    expect(year.endDateBS).toBe('2084-03-32');
    expect(year.startDateAD.toISOString().slice(0, 10)).toBe('2026-07-17');
    expect(year.endDateAD.toISOString().slice(0, 10)).toBe('2027-07-16');
  });

  it('switches the current academic year on Shrawan 1, including exact boundary days', () => {
    expect(getCurrentBSAcademicYear(new Date('2026-07-16T12:00:00.000Z'))).toBe(2082);
    expect(getCurrentBSAcademicYear(new Date('2026-07-17T00:00:00.000Z'))).toBe(2083);
    expect(getCurrentBSAcademicYear(new Date('2027-07-16T23:59:59.000Z'))).toBe(2083);
    expect(getCurrentBSAcademicYear(new Date('2027-07-17T00:00:00.000Z'))).toBe(2084);
  });
});
