import { formatBSDate, parseBSDate, toNepalDateOnly } from './staffDateUtils';

describe('BS date conversion', () => {
  it('round trips a BS date through the picker date value', () => {
    expect(formatBSDate(parseBSDate('2076-06-30'))).toBe('2076-06-30');
  });

  it('returns null for malformed BS dates', () => {
    expect(parseBSDate('not-a-date')).toBeNull();
  });
});

describe('toNepalDateOnly', () => {
  it('keeps date-only values unchanged', () => {
    expect(toNepalDateOnly('2083-06-26')).toBe('2083-06-26');
  });

  it('converts UTC timestamps to the correct Nepal calendar date', () => {
    expect(toNepalDateOnly('2083-06-25T18:15:00.000Z')).toBe('2083-06-26');
  });

  it('returns an empty value for invalid dates', () => {
    expect(toNepalDateOnly('not-a-date')).toBe('');
  });
});
