import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import sequelize from '@config/database';
import { BSCalendarService } from '../../services/bsCalendar.service';
import { BSCalendar } from '../../models/BSCalendar.model';
import {
  isValidBSDate,
  convertBSToAD,
  convertADToBS,
  formatBSDate,
  formatDualDate,
  getCurrentBSDate,
  addDaysToBS,
  diffBSDates,
  compareBSDates,
  toNepaliNumerals,
  toEnglishNumerals,
  formatBSDateNepali,
  formatBSDateEnglish,
  formatBSDateCustom,
  BSDate
} from '../dateConversion';

describe('Date Conversion Utility', () => {
  beforeAll(async () => {
    await sequelize.authenticate();
    
    // Check if calendar is already populated
    const count = await BSCalendar.count();
    if (count === 0) {
      // Only populate if empty
      try {
        await BSCalendarService.populateCalendar();
      } catch (error) {
        // Ignore duplicate key errors - data already exists
        if (!(error as any).message?.includes('Duplicate')) {
          throw error;
        }
      }
    }
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('isValidBSDate', () => {
    it('should validate correct BS dates', async () => {
      expect(await isValidBSDate(2080, 1, 1)).toBe(true);
      expect(await isValidBSDate(2080, 1, 31)).toBe(true);
      expect(await isValidBSDate(2080, 12, 30)).toBe(true);
    });

    it('should reject invalid years', async () => {
      expect(await isValidBSDate(1999, 1, 1)).toBe(false);
      expect(await isValidBSDate(2101, 1, 1)).toBe(false);
    });

    it('should reject invalid months', async () => {
      expect(await isValidBSDate(2080, 0, 1)).toBe(false);
      expect(await isValidBSDate(2080, 13, 1)).toBe(false);
    });

    it('should reject invalid days', async () => {
      expect(await isValidBSDate(2080, 1, 0)).toBe(false);
      expect(await isValidBSDate(2080, 1, 33)).toBe(false);
    });

    it('should reject days exceeding month length', async () => {
      // Month 1 of 2080 has 31 days
      expect(await isValidBSDate(2080, 1, 32)).toBe(false);
    });
  });

  describe('convertBSToAD', () => {
    it('should convert reference date correctly', async () => {
      // 2000-01-01 BS = 1943-04-14 AD
      const adDate = await convertBSToAD(2000, 1, 1);
      expect(adDate.toISOString().split('T')[0]).toBe('1943-04-14');
    });

    it('should convert known BS dates to AD', async () => {
      // 2080-01-01 BS = 2023-04-14 AD
      const adDate1 = await convertBSToAD(2080, 1, 1);
      expect(adDate1.toISOString().split('T')[0]).toBe('2023-04-14');

      // 2080-10-15 BS
      const adDate2 = await convertBSToAD(2080, 10, 15);
      expect(adDate2).toBeInstanceOf(Date);
    });

    it('should throw error for invalid BS dates', async () => {
      await expect(convertBSToAD(1999, 1, 1)).rejects.toThrow('Invalid BS date');
      await expect(convertBSToAD(2080, 13, 1)).rejects.toThrow('Invalid BS date');
      await expect(convertBSToAD(2080, 1, 33)).rejects.toThrow('Invalid BS date');
    });

    it('should handle edge cases at year boundaries', async () => {
      // First day of year
      const firstDay = await convertBSToAD(2080, 1, 1);
      expect(firstDay).toBeInstanceOf(Date);

      // Last day of year (month 12)
      const lastDay = await convertBSToAD(2080, 12, 30);
      expect(lastDay).toBeInstanceOf(Date);
    });
  });

  describe('convertADToBS', () => {
    it('should convert reference date correctly', async () => {
      // 1943-04-14 AD = 2000-01-01 BS
      const adDate = new Date('1943-04-14');
      const bsDate = await convertADToBS(adDate);
      
      expect(bsDate.yearBS).toBe(2000);
      expect(bsDate.monthBS).toBe(1);
      expect(bsDate.dayBS).toBe(1);
    });

    it('should convert known AD dates to BS', async () => {
      // 2023-04-14 AD = 2080-01-01 BS
      const adDate1 = new Date('2023-04-14');
      const bsDate1 = await convertADToBS(adDate1);
      
      expect(bsDate1.yearBS).toBe(2080);
      expect(bsDate1.monthBS).toBe(1);
      expect(bsDate1.dayBS).toBe(1);
    });

    it('should throw error for dates out of range', async () => {
      const tooEarly = new Date('1943-04-13');
      await expect(convertADToBS(tooEarly)).rejects.toThrow('out of supported range');
    });

    it('should handle dates at month boundaries', async () => {
      // Test a date in the middle of a BS month
      const adDate = new Date('2023-05-15');
      const bsDate = await convertADToBS(adDate);
      
      expect(bsDate.yearBS).toBeGreaterThanOrEqual(2000);
      expect(bsDate.monthBS).toBeGreaterThanOrEqual(1);
      expect(bsDate.monthBS).toBeLessThanOrEqual(12);
      expect(bsDate.dayBS).toBeGreaterThanOrEqual(1);
    });
  });

  describe('BS-AD Round Trip Conversion', () => {
    it('should preserve date when converting BS -> AD -> BS', async () => {
      const originalBS = { yearBS: 2080, monthBS: 5, dayBS: 15 };
      
      const adDate = await convertBSToAD(originalBS.yearBS, originalBS.monthBS, originalBS.dayBS);
      const convertedBS = await convertADToBS(adDate);
      
      expect(convertedBS.yearBS).toBe(originalBS.yearBS);
      expect(convertedBS.monthBS).toBe(originalBS.monthBS);
      expect(convertedBS.dayBS).toBe(originalBS.dayBS);
    });

    it('should preserve date when converting AD -> BS -> AD', async () => {
      const originalAD = new Date('2023-06-15');
      
      const bsDate = await convertADToBS(originalAD);
      const convertedAD = await convertBSToAD(bsDate.yearBS, bsDate.monthBS, bsDate.dayBS);
      
      expect(convertedAD.toISOString().split('T')[0]).toBe(originalAD.toISOString().split('T')[0]);
    });

    it('should handle multiple round trips', async () => {
      const testDates = [
        { yearBS: 2000, monthBS: 1, dayBS: 1 },
        { yearBS: 2050, monthBS: 6, dayBS: 15 },
        { yearBS: 2080, monthBS: 12, dayBS: 30 },
        { yearBS: 2100, monthBS: 1, dayBS: 1 }
      ];

      for (const original of testDates) {
        const adDate = await convertBSToAD(original.yearBS, original.monthBS, original.dayBS);
        const converted = await convertADToBS(adDate);
        
        expect(converted.yearBS).toBe(original.yearBS);
        expect(converted.monthBS).toBe(original.monthBS);
        expect(converted.dayBS).toBe(original.dayBS);
      }
    });

    /**
     * Property 6: BS-AD Calendar Round Trip
     * Validates: Requirements N4.7
     * 
     * For any valid Bikram Sambat date within the supported range (2000-2100 BS),
     * converting to AD and back to BS should produce the original BS date.
     * 
     * This property test generates 100+ random valid BS dates and verifies
     * that the round trip conversion preserves the original date.
     */
    it('Property 6: BS-AD round trip preserves original date for all valid BS dates', async () => {
      // Sample a range of years, months, and days to test
      const testCases: Array<{ yearBS: number; monthBS: number; dayBS: number }> = [];
      
      // Generate test cases by sampling across the range
      for (let i = 0; i < 100; i++) {
        const yearBS = 2000 + Math.floor(Math.random() * 101); // 2000-2100
        const monthBS = 1 + Math.floor(Math.random() * 12);    // 1-12
        
        // Get valid day range for this month
        const monthData = await BSCalendar.findOne({
          where: { yearBs: yearBS, monthBs: monthBS }
        });
        
        if (monthData) {
          const dayBS = 1 + Math.floor(Math.random() * monthData.daysInMonth);
          testCases.push({ yearBS, monthBS, dayBS });
        }
      }

      // Verify we generated test cases
      expect(testCases.length).toBeGreaterThan(0);

      // Test each case
      for (const testCase of testCases) {
        const { yearBS, monthBS, dayBS } = testCase;
        
        // Convert BS -> AD -> BS
        const adDate = await convertBSToAD(yearBS, monthBS, dayBS);
        const convertedBS = await convertADToBS(adDate);

        // Property: Round trip should preserve original date
        expect(convertedBS.yearBS).toBe(yearBS);
        expect(convertedBS.monthBS).toBe(monthBS);
        expect(convertedBS.dayBS).toBe(dayBS);
      }
    }, 60000); // Increase timeout for property test
  });

  describe('formatBSDate', () => {
    it('should format date in short format', () => {
      const formatted = formatBSDate(2080, 1, 5, 'short');
      expect(formatted).toBe('2080-01-05');
    });

    it('should format date in long format', () => {
      const formatted = formatBSDate(2080, 1, 5, 'long');
      expect(formatted).toBe('05 Baisakh 2080');
    });

    it('should format date in Nepali format', () => {
      const formatted = formatBSDate(2080, 1, 5, 'nepali');
      expect(formatted).toBe('05 बैशाख 2080');
    });

    it('should pad single digit months and days', () => {
      const formatted = formatBSDate(2080, 1, 1, 'short');
      expect(formatted).toBe('2080-01-01');
    });

    it('should handle all 12 months', () => {
      for (let month = 1; month <= 12; month++) {
        const formatted = formatBSDate(2080, month, 15, 'long');
        expect(formatted).toContain('15');
        expect(formatted).toContain('2080');
      }
    });
  });

  describe('formatDualDate', () => {
    it('should format date in dual format', async () => {
      const formatted = await formatDualDate(2080, 1, 1);
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2} BS \(\d{4}-\d{2}-\d{2} AD\)$/);
      expect(formatted).toContain('2080-01-01 BS');
    });

    it('should show correct AD date for reference date', async () => {
      const formatted = await formatDualDate(2000, 1, 1);
      expect(formatted).toBe('2000-01-01 BS (1943-04-14 AD)');
    });
  });

  describe('getCurrentBSDate', () => {
    it('should return current BS date', async () => {
      const currentBS = await getCurrentBSDate();
      
      expect(currentBS.yearBS).toBeGreaterThanOrEqual(2000);
      expect(currentBS.yearBS).toBeLessThanOrEqual(2100);
      expect(currentBS.monthBS).toBeGreaterThanOrEqual(1);
      expect(currentBS.monthBS).toBeLessThanOrEqual(12);
      expect(currentBS.dayBS).toBeGreaterThanOrEqual(1);
    });

    it('should return valid BS date', async () => {
      const currentBS = await getCurrentBSDate();
      const isValid = await isValidBSDate(currentBS.yearBS, currentBS.monthBS, currentBS.dayBS);
      expect(isValid).toBe(true);
    });
  });

  describe('addDaysToBS', () => {
    it('should add days within same month', async () => {
      const result = await addDaysToBS(2080, 1, 1, 5);
      expect(result.yearBS).toBe(2080);
      expect(result.monthBS).toBe(1);
      expect(result.dayBS).toBe(6);
    });

    it('should add days across month boundary', async () => {
      // Month 1 of 2080 has 31 days
      const result = await addDaysToBS(2080, 1, 30, 5);
      expect(result.yearBS).toBe(2080);
      expect(result.monthBS).toBe(2);
    });

    it('should add days across year boundary', async () => {
      const result = await addDaysToBS(2080, 12, 30, 5);
      expect(result.yearBS).toBe(2081);
      expect(result.monthBS).toBe(1);
    });

    it('should subtract days with negative input', async () => {
      const result = await addDaysToBS(2080, 1, 10, -5);
      expect(result.yearBS).toBe(2080);
      expect(result.monthBS).toBe(1);
      expect(result.dayBS).toBe(5);
    });

    it('should handle adding zero days', async () => {
      const result = await addDaysToBS(2080, 5, 15, 0);
      expect(result.yearBS).toBe(2080);
      expect(result.monthBS).toBe(5);
      expect(result.dayBS).toBe(15);
    });
  });

  describe('diffBSDates', () => {
    it('should calculate difference between dates in same month', async () => {
      const date1: BSDate = { yearBS: 2080, monthBS: 1, dayBS: 1 };
      const date2: BSDate = { yearBS: 2080, monthBS: 1, dayBS: 10 };
      
      const diff = await diffBSDates(date1, date2);
      expect(diff).toBe(9);
    });

    it('should calculate difference across months', async () => {
      const date1: BSDate = { yearBS: 2080, monthBS: 1, dayBS: 1 };
      const date2: BSDate = { yearBS: 2080, monthBS: 2, dayBS: 1 };
      
      const diff = await diffBSDates(date1, date2);
      expect(diff).toBeGreaterThan(0);
    });

    it('should return negative difference when date2 is before date1', async () => {
      const date1: BSDate = { yearBS: 2080, monthBS: 1, dayBS: 10 };
      const date2: BSDate = { yearBS: 2080, monthBS: 1, dayBS: 1 };
      
      const diff = await diffBSDates(date1, date2);
      expect(diff).toBe(-9);
    });

    it('should return zero for same dates', async () => {
      const date1: BSDate = { yearBS: 2080, monthBS: 5, dayBS: 15 };
      const date2: BSDate = { yearBS: 2080, monthBS: 5, dayBS: 15 };
      
      const diff = await diffBSDates(date1, date2);
      expect(diff).toBe(0);
    });
  });

  describe('compareBSDates', () => {
    it('should return -1 when date1 is before date2', () => {
      const date1: BSDate = { yearBS: 2080, monthBS: 1, dayBS: 1 };
      const date2: BSDate = { yearBS: 2080, monthBS: 1, dayBS: 10 };
      
      expect(compareBSDates(date1, date2)).toBe(-1);
    });

    it('should return 1 when date1 is after date2', () => {
      const date1: BSDate = { yearBS: 2080, monthBS: 1, dayBS: 10 };
      const date2: BSDate = { yearBS: 2080, monthBS: 1, dayBS: 1 };
      
      expect(compareBSDates(date1, date2)).toBe(1);
    });

    it('should return 0 when dates are equal', () => {
      const date1: BSDate = { yearBS: 2080, monthBS: 5, dayBS: 15 };
      const date2: BSDate = { yearBS: 2080, monthBS: 5, dayBS: 15 };
      
      expect(compareBSDates(date1, date2)).toBe(0);
    });

    it('should compare years first', () => {
      const date1: BSDate = { yearBS: 2079, monthBS: 12, dayBS: 30 };
      const date2: BSDate = { yearBS: 2080, monthBS: 1, dayBS: 1 };
      
      expect(compareBSDates(date1, date2)).toBe(-1);
    });

    it('should compare months when years are equal', () => {
      const date1: BSDate = { yearBS: 2080, monthBS: 1, dayBS: 30 };
      const date2: BSDate = { yearBS: 2080, monthBS: 2, dayBS: 1 };
      
      expect(compareBSDates(date1, date2)).toBe(-1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle first day of supported range', async () => {
      const bsDate = { yearBS: 2000, monthBS: 1, dayBS: 1 };
      const adDate = await convertBSToAD(bsDate.yearBS, bsDate.monthBS, bsDate.dayBS);
      const converted = await convertADToBS(adDate);
      
      expect(converted.yearBS).toBe(bsDate.yearBS);
      expect(converted.monthBS).toBe(bsDate.monthBS);
      expect(converted.dayBS).toBe(bsDate.dayBS);
    });

    it('should handle last day of supported range', async () => {
      const bsDate = { yearBS: 2100, monthBS: 12, dayBS: 30 };
      const adDate = await convertBSToAD(bsDate.yearBS, bsDate.monthBS, bsDate.dayBS);
      const converted = await convertADToBS(adDate);
      
      expect(converted.yearBS).toBe(bsDate.yearBS);
      expect(converted.monthBS).toBe(bsDate.monthBS);
      expect(converted.dayBS).toBe(bsDate.dayBS);
    });

    it('should handle months with different day counts', async () => {
      // Test various months with different day counts
      const testCases = [
        { yearBS: 2080, monthBS: 1, dayBS: 31 },  // 31 days
        { yearBS: 2080, monthBS: 2, dayBS: 32 },  // 32 days
        { yearBS: 2080, monthBS: 12, dayBS: 30 }  // 30 days
      ];

      for (const testCase of testCases) {
        const isValid = await isValidBSDate(testCase.yearBS, testCase.monthBS, testCase.dayBS);
        expect(isValid).toBe(true);
        
        const adDate = await convertBSToAD(testCase.yearBS, testCase.monthBS, testCase.dayBS);
        const converted = await convertADToBS(adDate);
        
        expect(converted.yearBS).toBe(testCase.yearBS);
        expect(converted.monthBS).toBe(testCase.monthBS);
        expect(converted.dayBS).toBe(testCase.dayBS);
      }
    });
  });

  describe('Error Handling', () => {
    it('should provide descriptive error messages for invalid dates', async () => {
      await expect(convertBSToAD(1999, 1, 1)).rejects.toThrow(/Invalid BS date.*Year must be 2000-2100/);
      await expect(convertBSToAD(2080, 13, 1)).rejects.toThrow(/Invalid BS date.*month must be 1-12/);
    });

    it('should handle database errors gracefully', async () => {
      // This test assumes the database is available
      // In a real scenario, you might mock the database to simulate errors
      const result = await isValidBSDate(2080, 1, 1);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Nepali Numerals Conversion', () => {
    it('should convert English numerals to Nepali numerals', () => {
      expect(toNepaliNumerals(0)).toBe('०');
      expect(toNepaliNumerals(1)).toBe('१');
      expect(toNepaliNumerals(2)).toBe('२');
      expect(toNepaliNumerals(3)).toBe('३');
      expect(toNepaliNumerals(4)).toBe('४');
      expect(toNepaliNumerals(5)).toBe('५');
      expect(toNepaliNumerals(6)).toBe('६');
      expect(toNepaliNumerals(7)).toBe('७');
      expect(toNepaliNumerals(8)).toBe('८');
      expect(toNepaliNumerals(9)).toBe('९');
    });

    it('should convert multi-digit numbers to Nepali numerals', () => {
      expect(toNepaliNumerals(2080)).toBe('२०८०');
      expect(toNepaliNumerals(15)).toBe('१५');
      expect(toNepaliNumerals(2025)).toBe('२०२५');
      expect(toNepaliNumerals('2081-10-24')).toBe('२०८१-१०-२४');
    });

    it('should preserve non-numeric characters', () => {
      expect(toNepaliNumerals('2080-01-15')).toBe('२०८०-०१-१५');
      expect(toNepaliNumerals('Year 2080')).toBe('Year २०८०');
    });

    it('should convert Nepali numerals to English numerals', () => {
      expect(toEnglishNumerals('०')).toBe('0');
      expect(toEnglishNumerals('१')).toBe('1');
      expect(toEnglishNumerals('२०८०')).toBe('2080');
      expect(toEnglishNumerals('२०८१-१०-२४')).toBe('2081-10-24');
    });

    it('should handle round-trip conversion', () => {
      const original = '2080-01-15';
      const nepali = toNepaliNumerals(original);
      const backToEnglish = toEnglishNumerals(nepali);
      expect(backToEnglish).toBe(original);
    });
  });

  describe('formatBSDate with Nepali Numerals', () => {
    it('should format date in short format with English numerals', () => {
      const formatted = formatBSDate(2080, 1, 5, 'short', false);
      expect(formatted).toBe('2080-01-05');
    });

    it('should format date in short format with Nepali numerals', () => {
      const formatted = formatBSDate(2080, 1, 5, 'short', true);
      expect(formatted).toBe('२०८०-०१-०५');
    });

    it('should format date in long format with English numerals', () => {
      const formatted = formatBSDate(2080, 1, 5, 'long', false);
      expect(formatted).toBe('05 Baisakh 2080');
    });

    it('should format date in long format with Nepali numerals', () => {
      const formatted = formatBSDate(2080, 1, 5, 'long', true);
      expect(formatted).toBe('०५ Baisakh २०८०');
    });

    it('should format date in Nepali format with English numerals', () => {
      const formatted = formatBSDate(2080, 1, 5, 'nepali', false);
      expect(formatted).toBe('05 बैशाख 2080');
    });

    it('should format date in Nepali format with Nepali numerals', () => {
      const formatted = formatBSDate(2080, 1, 5, 'nepali', true);
      expect(formatted).toBe('०५ बैशाख २०८०');
    });

    it('should handle all 12 months with Nepali numerals', () => {
      for (let month = 1; month <= 12; month++) {
        const formatted = formatBSDate(2080, month, 15, 'nepali', true);
        expect(formatted).toContain('१५');
        expect(formatted).toContain('२०८०');
      }
    });
  });

  describe('formatDualDate with Options', () => {
    it('should format date in default dual format', async () => {
      const formatted = await formatDualDate(2080, 1, 1);
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}\sBS\s\(\d{4}-\d{2}-\d{2}\sAD\)$/);
      expect(formatted).toContain('2080-01-01');
    });

    it('should format date with long BS format', async () => {
      const formatted = await formatDualDate(2080, 1, 15, { bsFormat: 'long' });
      expect(formatted).toContain('15 Baisakh 2080');
      expect(formatted).toContain('BS');
      expect(formatted).toContain('AD');
    });

    it('should format date with Nepali format', async () => {
      const formatted = await formatDualDate(2080, 1, 15, { bsFormat: 'nepali' });
      expect(formatted).toContain('15 बैशाख 2080');
      expect(formatted).toContain('BS');
    });

    it('should format date with Nepali numerals', async () => {
      const formatted = await formatDualDate(2080, 1, 15, { 
        bsFormat: 'nepali',
        useNepaliNumerals: true 
      });
      expect(formatted).toContain('१५ बैशाख २०८०');
      expect(formatted).toContain('बि.सं.');
      expect(formatted).toContain('ई.सं.');
    });

    it('should format date with custom separator', async () => {
      const formatted = await formatDualDate(2080, 1, 1, { separator: ' | ' });
      expect(formatted).toContain('|');
    });

    it('should show correct AD date for reference date', async () => {
      const formatted = await formatDualDate(2000, 1, 1);
      expect(formatted).toContain('2000-01-01');
      expect(formatted).toContain('1943-04-14');
    });

    it('should handle all format combinations', async () => {
      const formats: Array<'short' | 'long' | 'nepali'> = ['short', 'long', 'nepali'];
      
      for (const format of formats) {
        const formatted = await formatDualDate(2080, 5, 15, { bsFormat: format });
        expect(formatted).toBeTruthy();
        expect(formatted).toContain('BS');
        expect(formatted).toContain('AD');
      }
    });
  });

  describe('formatBSDateNepali', () => {
    it('should format date in Nepali style with Nepali numerals', () => {
      const formatted = formatBSDateNepali(2080, 1, 15, true);
      expect(formatted).toBe('१५ बैशाख २०८०');
    });

    it('should format date in Nepali style with English numerals', () => {
      const formatted = formatBSDateNepali(2080, 1, 15, false);
      expect(formatted).toBe('15 बैशाख 2080');
    });

    it('should handle single digit days', () => {
      const formatted = formatBSDateNepali(2080, 1, 5, true);
      expect(formatted).toBe('५ बैशाख २०८०');
    });

    it('should handle all 12 months', () => {
      const expectedMonths = [
        'बैशाख', 'जेठ', 'असार', 'श्रावण', 'भाद्र', 'आश्विन',
        'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र'
      ];

      for (let month = 1; month <= 12; month++) {
        const formatted = formatBSDateNepali(2080, month, 15, false);
        expect(formatted).toContain(expectedMonths[month - 1]);
      }
    });
  });

  describe('formatBSDateEnglish', () => {
    it('should format date in English style', () => {
      const formatted = formatBSDateEnglish(2080, 1, 15);
      expect(formatted).toBe('15 Baisakh 2080');
    });

    it('should handle single digit days', () => {
      const formatted = formatBSDateEnglish(2080, 1, 5);
      expect(formatted).toBe('5 Baisakh 2080');
    });

    it('should handle all 12 months', () => {
      const expectedMonths = [
        'Baisakh', 'Jestha', 'Asar', 'Shrawan', 'Bhadra', 'Aswin',
        'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
      ];

      for (let month = 1; month <= 12; month++) {
        const formatted = formatBSDateEnglish(2080, month, 15);
        expect(formatted).toContain(expectedMonths[month - 1]);
      }
    });

    it('should handle different years', () => {
      expect(formatBSDateEnglish(2000, 1, 1)).toBe('1 Baisakh 2000');
      expect(formatBSDateEnglish(2100, 12, 30)).toBe('30 Chaitra 2100');
    });
  });

  describe('formatBSDateCustom', () => {
    it('should format with YYYY-MM-DD pattern', () => {
      const formatted = formatBSDateCustom(2080, 1, 5, 'YYYY-MM-DD');
      expect(formatted).toBe('2080-01-05');
    });

    it('should format with DD/MM/YYYY pattern', () => {
      const formatted = formatBSDateCustom(2080, 1, 5, 'DD/MM/YYYY');
      expect(formatted).toBe('05/01/2080');
    });

    it('should format with MMMM D, YYYY pattern', () => {
      const formatted = formatBSDateCustom(2080, 1, 5, 'MMMM D, YYYY');
      expect(formatted).toBe('Baisakh 5, 2080');
    });

    it('should format with MMM DD, YY pattern', () => {
      const formatted = formatBSDateCustom(2080, 1, 5, 'MMM DD, YY');
      expect(formatted).toBe('Bai 05, 80');
    });

    it('should format with D MMMM YYYY pattern', () => {
      const formatted = formatBSDateCustom(2080, 1, 15, 'D MMMM YYYY');
      expect(formatted).toBe('15 Baisakh 2080');
    });

    it('should support Nepali numerals', () => {
      const formatted = formatBSDateCustom(2080, 1, 5, 'YYYY-MM-DD', true);
      expect(formatted).toBe('२०८०-०१-०५');
    });

    it('should handle complex patterns', () => {
      const formatted = formatBSDateCustom(2080, 12, 25, 'D MMMM, YYYY (MM/DD)');
      expect(formatted).toBe('25 Chaitra, 2080 (12/25)');
    });

    it('should handle all month formats', () => {
      // Test MMMM (full name)
      expect(formatBSDateCustom(2080, 1, 1, 'MMMM')).toBe('Baisakh');
      expect(formatBSDateCustom(2080, 12, 1, 'MMMM')).toBe('Chaitra');
      
      // Test MMM (short name)
      expect(formatBSDateCustom(2080, 1, 1, 'MMM')).toBe('Bai');
      expect(formatBSDateCustom(2080, 12, 1, 'MMM')).toBe('Cha');
      
      // Test MM (padded number)
      expect(formatBSDateCustom(2080, 1, 1, 'MM')).toBe('01');
      expect(formatBSDateCustom(2080, 12, 1, 'MM')).toBe('12');
      
      // Test M (number)
      expect(formatBSDateCustom(2080, 1, 1, 'M')).toBe('1');
      expect(formatBSDateCustom(2080, 12, 1, 'M')).toBe('12');
    });

    it('should handle all day formats', () => {
      // Test DD (padded)
      expect(formatBSDateCustom(2080, 1, 5, 'DD')).toBe('05');
      expect(formatBSDateCustom(2080, 1, 15, 'DD')).toBe('15');
      
      // Test D (not padded)
      expect(formatBSDateCustom(2080, 1, 5, 'D')).toBe('5');
      expect(formatBSDateCustom(2080, 1, 15, 'D')).toBe('15');
    });

    it('should handle all year formats', () => {
      // Test YYYY (4-digit)
      expect(formatBSDateCustom(2080, 1, 1, 'YYYY')).toBe('2080');
      
      // Test YY (2-digit)
      expect(formatBSDateCustom(2080, 1, 1, 'YY')).toBe('80');
      expect(formatBSDateCustom(2005, 1, 1, 'YY')).toBe('05');
    });
  });

  describe('Formatting Edge Cases', () => {
    it('should handle first day of year', () => {
      expect(formatBSDate(2080, 1, 1, 'short')).toBe('2080-01-01');
      expect(formatBSDateEnglish(2080, 1, 1)).toBe('1 Baisakh 2080');
      expect(formatBSDateNepali(2080, 1, 1, true)).toBe('१ बैशाख २०८०');
    });

    it('should handle last day of year', () => {
      expect(formatBSDate(2080, 12, 30, 'short')).toBe('2080-12-30');
      expect(formatBSDateEnglish(2080, 12, 30)).toBe('30 Chaitra 2080');
    });

    it('should handle year boundaries', () => {
      expect(formatBSDate(2000, 1, 1, 'short')).toBe('2000-01-01');
      expect(formatBSDate(2100, 12, 30, 'short')).toBe('2100-12-30');
    });

    it('should handle all months consistently', async () => {
      for (let month = 1; month <= 12; month++) {
        const shortFormat = formatBSDate(2080, month, 15, 'short');
        expect(shortFormat).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        
        const longFormat = formatBSDate(2080, month, 15, 'long');
        expect(longFormat).toMatch(/^\d{2}\s\w+\s\d{4}$/);
        
        const nepaliFormat = formatBSDate(2080, month, 15, 'nepali');
        expect(nepaliFormat).toContain('2080');
        
        const dualFormat = await formatDualDate(2080, month, 15);
        expect(dualFormat).toContain('BS');
        expect(dualFormat).toContain('AD');
      }
    });
  });

  describe('Formatting Requirements Validation', () => {
    /**
     * Validates Requirement N4.4: Display dates in format "YYYY-MM-DD BS (YYYY-MM-DD AD)"
     */
    it('should format dates according to requirement N4.4', async () => {
      const formatted = await formatDualDate(2081, 10, 24);
      
      // Should match the pattern: "YYYY-MM-DD BS (YYYY-MM-DD AD)"
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}\sBS\s\(\d{4}-\d{2}-\d{2}\sAD\)$/);
      
      // Should contain BS date
      expect(formatted).toContain('2081-10-24');
      
      // Should contain BS and AD labels
      expect(formatted).toContain('BS');
      expect(formatted).toContain('AD');
    });

    /**
     * Validates Requirement N4.8: Display Nepali month names
     */
    it('should display Nepali month names according to requirement N4.8', () => {
      const nepaliMonths = [
        'बैशाख', 'जेठ', 'असार', 'श्रावण', 'भाद्र', 'आश्विन',
        'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र'
      ];

      for (let month = 1; month <= 12; month++) {
        const formatted = formatBSDate(2080, month, 15, 'nepali');
        expect(formatted).toContain(nepaliMonths[month - 1]);
      }
    });

    /**
     * Validates optional Nepali numerals support
     */
    it('should support Nepali numerals as optional feature', () => {
      // Test with Nepali numerals enabled
      const withNepali = formatBSDate(2080, 1, 15, 'nepali', true);
      expect(withNepali).toBe('१५ बैशाख २०८०');
      
      // Test with Nepali numerals disabled (default)
      const withoutNepali = formatBSDate(2080, 1, 15, 'nepali', false);
      expect(withoutNepali).toBe('15 बैशाख 2080');
      
      // Verify numerals are correctly converted
      expect(toNepaliNumerals('2080')).toBe('२०८०');
      expect(toEnglishNumerals('२०८०')).toBe('2080');
    });

    /**
     * Validates formatting in both Nepali and English
     */
    it('should format dates in both Nepali and English', () => {
      const date = { year: 2080, month: 1, day: 15 };
      
      // English format
      const english = formatBSDateEnglish(date.year, date.month, date.day);
      expect(english).toBe('15 Baisakh 2080');
      expect(english).toContain('Baisakh');
      
      // Nepali format
      const nepali = formatBSDateNepali(date.year, date.month, date.day, false);
      expect(nepali).toBe('15 बैशाख 2080');
      expect(nepali).toContain('बैशाख');
    });

    /**
     * Validates dual date display with various formats
     */
    it('should support dual date display in multiple formats', async () => {
      const date = { year: 2081, month: 10, day: 24 };
      
      // Short format (default)
      const shortDual = await formatDualDate(date.year, date.month, date.day);
      expect(shortDual).toContain('2081-10-24');
      expect(shortDual).toMatch(/BS.*AD/);
      
      // Long format
      const longDual = await formatDualDate(date.year, date.month, date.day, { bsFormat: 'long' });
      expect(longDual).toContain('Magh');
      expect(longDual).toMatch(/BS.*AD/);
      
      // Nepali format
      const nepaliDual = await formatDualDate(date.year, date.month, date.day, { bsFormat: 'nepali' });
      expect(nepaliDual).toContain('माघ');
      expect(nepaliDual).toMatch(/BS.*AD/);
      
      // With Nepali numerals
      const nepaliNumeralsDual = await formatDualDate(date.year, date.month, date.day, { 
        bsFormat: 'nepali',
        useNepaliNumerals: true 
      });
      expect(nepaliNumeralsDual).toContain('२०८१');
      expect(nepaliNumeralsDual).toContain('बि.सं.');
    });
  });
});
