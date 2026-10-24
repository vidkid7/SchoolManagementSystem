import { formatSchoolDate, toSchoolDateInputValue } from './academicYearDates';

describe('academic year date formatting', () => {
  it('uses the Nepal calendar day for timestamps at Nepal midnight', () => {
    expect(toSchoolDateInputValue('2026-07-16T18:15:00.000Z')).toBe('2026-07-17');
    expect(toSchoolDateInputValue('2027-07-15T18:15:00.000Z')).toBe('2027-07-16');
  });

  it('keeps date-only values stable and renders table dates in Nepal time', () => {
    expect(toSchoolDateInputValue('2026-07-17')).toBe('2026-07-17');
    const renderedDate = formatSchoolDate('2026-07-16T18:15:00.000Z');
    expect(renderedDate).toContain('17');
    expect(renderedDate).toContain('2026');
  });

  it('returns an empty input value for invalid dates', () => {
    expect(toSchoolDateInputValue('not-a-date')).toBe('');
  });
});
