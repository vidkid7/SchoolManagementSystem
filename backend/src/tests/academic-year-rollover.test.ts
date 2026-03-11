import NepaliDate from 'nepali-date-converter';

describe('Nepali Calendar - BS/AD Conversion', () => {
  test('converts BS 2081-01-01 (Baisakh 1) to correct AD date', () => {
    const bsDate = new NepaliDate(2081, 0, 1); // month is 0-indexed
    const adDate = bsDate.toJsDate();
    // BS 2081 Baisakh 1 = April 13, 2024 AD
    expect(adDate.getFullYear()).toBe(2024);
    expect(adDate.getMonth()).toBe(3); // April (0-indexed)
    expect(adDate.getDate()).toBe(13);
  });

  test('converts AD date back to BS correctly', () => {
    const adDate = new Date(2024, 3, 13); // April 13, 2024
    const bsDate = new NepaliDate(adDate);
    expect(bsDate.getYear()).toBe(2081);
    expect(bsDate.getMonth()).toBe(0); // Baisakh
    expect(bsDate.getDate()).toBe(1);
  });

  test('handles BS 2080 last day (Chaitra 30) correctly', () => {
    // BS 2080 ends on Chaitra 30 (or 31 depending on year)
    // The last day of 2080 should convert to the day before 2081 Baisakh 1
    const firstOfNext = new NepaliDate(2081, 0, 1);
    const adFirstOfNext = firstOfNext.toJsDate();
    const adLastOfPrev = new Date(adFirstOfNext.getTime() - 24 * 60 * 60 * 1000);
    const bsLastOfPrev = new NepaliDate(adLastOfPrev);
    expect(bsLastOfPrev.getYear()).toBe(2080);
    expect(bsLastOfPrev.getMonth()).toBe(11); // Chaitra (last month, 0-indexed)
  });

  test('BS 2082 Baisakh 1 converts correctly', () => {
    const bsDate = new NepaliDate(2082, 0, 1);
    const adDate = bsDate.toJsDate();
    expect(adDate.getFullYear()).toBe(2025);
    expect(adDate.getMonth()).toBe(3); // April
  });
});

describe('Academic Year Assignment', () => {
  // Helper to determine which academic year a date belongs to
  function getAcademicYear(bsYear: number, bsMonth: number): string {
    // Academic year runs from Baisakh (month 0) to Chaitra (month 11)
    // So the academic year label is "{bsYear}-{bsYear+1}"
    return `${bsYear}-${bsYear + 1}`;
  }

  test('first day of BS 2081 belongs to academic year 2081-2082', () => {
    const bsDate = new NepaliDate(2081, 0, 1);
    expect(getAcademicYear(bsDate.getYear(), bsDate.getMonth())).toBe('2081-2082');
  });

  test('last day of BS 2080 belongs to academic year 2080-2081', () => {
    const firstOfNext = new NepaliDate(2081, 0, 1);
    const adLastOfPrev = new Date(firstOfNext.toJsDate().getTime() - 24 * 60 * 60 * 1000);
    const bsLastOfPrev = new NepaliDate(adLastOfPrev);
    expect(getAcademicYear(bsLastOfPrev.getYear(), bsLastOfPrev.getMonth())).toBe('2080-2081');
  });

  test('middle of academic year (Kartik) stays in same year', () => {
    const bsDate = new NepaliDate(2081, 6, 15); // Kartik 15, 2081
    expect(getAcademicYear(bsDate.getYear(), bsDate.getMonth())).toBe('2081-2082');
  });

  test('attendance record on year boundary gets correct assignment', () => {
    // Simulate creating attendance on last day of academic year
    const lastDayOf2080 = new NepaliDate(2080, 11, 30); // Chaitra 30
    const firstDayOf2081 = new NepaliDate(2081, 0, 1); // Baisakh 1

    const ayForLastDay = getAcademicYear(lastDayOf2080.getYear(), lastDayOf2080.getMonth());
    const ayForFirstDay = getAcademicYear(firstDayOf2081.getYear(), firstDayOf2081.getMonth());

    expect(ayForLastDay).toBe('2080-2081');
    expect(ayForFirstDay).toBe('2081-2082');
    expect(ayForLastDay).not.toBe(ayForFirstDay);
  });
});

describe('BS Calendar Data Integrity', () => {
  test('each BS year has exactly 12 months', () => {
    for (let year = 2070; year <= 2090; year++) {
      // Creating a date in each month should work
      for (let month = 0; month < 12; month++) {
        expect(() => new NepaliDate(year, month, 1)).not.toThrow();
      }
    }
  });

  test('BS months have between 29 and 32 days', () => {
    for (let year = 2078; year <= 2085; year++) {
      for (let month = 0; month < 12; month++) {
        // Day 29 should always stay in the same month
        const d29 = new NepaliDate(year, month, 29);
        expect(d29.getMonth()).toBe(month);

        // Day 33 overflows to the next month (library doesn't throw)
        const d33 = new NepaliDate(year, month, 33);
        expect(d33.getMonth()).not.toBe(month);
      }
    }
  });

  test('consecutive years have consistent day counts', () => {
    // Total days in a BS year should be between 365 and 366
    for (let year = 2078; year <= 2085; year++) {
      const start = new NepaliDate(year, 0, 1).toJsDate();
      const end = new NepaliDate(year + 1, 0, 1).toJsDate();
      const daysDiff = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
      expect(daysDiff).toBeGreaterThanOrEqual(364);
      expect(daysDiff).toBeLessThanOrEqual(367);
    }
  });
});
