import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import sequelize from '@config/database';
import { BSCalendar } from '../../models/BSCalendar.model';
import { BSCalendarService } from '../bsCalendar.service';

describe('BSCalendarService', () => {
  beforeAll(async () => {
    // Disable foreign key checks temporarily
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Sync database schema
    await sequelize.sync({ force: true });
    
    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  });

  afterAll(async () => {
    // Close database connection
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up bs_calendar table before each test
    await BSCalendar.destroy({ where: {}, force: true });
  });

  describe('populateCalendar', () => {
    it('should populate calendar with data for years 2000-2100 BS', async () => {
      await BSCalendarService.populateCalendar();

      const count = await BSCalendar.count();
      // 101 years (2000-2100) × 12 months = 1212 records
      expect(count).toBe(1212);
    });

    it('should not duplicate data if called multiple times', async () => {
      await BSCalendarService.populateCalendar();
      const firstCount = await BSCalendar.count();

      await BSCalendarService.populateCalendar();
      const secondCount = await BSCalendar.count();

      expect(firstCount).toBe(secondCount);
      expect(firstCount).toBe(1212);
    });

    it('should populate with correct month names', async () => {
      await BSCalendarService.populateCalendar();

      const baisakhRecord = await BSCalendar.findOne({
        where: { yearBS: 2080, monthBS: 1 }
      });

      expect(baisakhRecord).not.toBeNull();
      expect(baisakhRecord?.monthNameEn).toBe('Baisakh');
      expect(baisakhRecord?.monthNameNp).toBe('बैशाख');
    });

    it('should populate with valid days in month (29-32)', async () => {
      await BSCalendarService.populateCalendar();

      const allRecords = await BSCalendar.findAll();

      for (const record of allRecords) {
        expect(record.daysInMonth).toBeGreaterThanOrEqual(29);
        expect(record.daysInMonth).toBeLessThanOrEqual(32);
      }
    });

    it('should have continuous AD dates without gaps', async () => {
      await BSCalendarService.populateCalendar();

      const records = await BSCalendar.findAll({
        where: { yearBS: 2080 },
        order: [['monthBS', 'ASC']]
      });

      // Check that end date of one month is followed by start date of next month
      for (let i = 0; i < records.length - 1; i++) {
        const currentEnd = new Date(records[i].endDateAd);
        const nextStart = new Date(records[i + 1].startDateAd);
        
        // Next month should start the day after current month ends
        const expectedNextStart = new Date(currentEnd);
        expectedNextStart.setDate(expectedNextStart.getDate() + 1);
        
        expect(nextStart.toDateString()).toBe(expectedNextStart.toDateString());
      }
    });

    it('should have correct number of days between start and end dates', async () => {
      await BSCalendarService.populateCalendar();

      const records = await BSCalendar.findAll({
        where: { yearBS: 2080 }
      });

      for (const record of records) {
        const start = new Date(record.startDateAd);
        const end = new Date(record.endDateAd);
        const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        expect(daysDiff).toBe(record.daysInMonth);
      }
    });
  });

  describe('getYearData', () => {
    beforeEach(async () => {
      await BSCalendarService.populateCalendar();
    });

    it('should return 12 months for a valid year', async () => {
      const yearData = await BSCalendarService.getYearData(2080);

      expect(yearData).toHaveLength(12);
      expect(yearData.every(m => m.yearBs === 2080)).toBe(true);
    });

    it('should return months in correct order', async () => {
      const yearData = await BSCalendarService.getYearData(2080);

      for (let i = 0; i < yearData.length; i++) {
        expect(yearData[i].monthBs).toBe(i + 1);
      }
    });

    it('should return empty array for non-existent year', async () => {
      const yearData = await BSCalendarService.getYearData(1999);

      expect(yearData).toHaveLength(0);
    });

    it('should return data for boundary years (2000 and 2100)', async () => {
      const year2000 = await BSCalendarService.getYearData(2000);
      const year2100 = await BSCalendarService.getYearData(2100);

      expect(year2000).toHaveLength(12);
      expect(year2100).toHaveLength(12);
    });
  });

  describe('getMonthData', () => {
    beforeEach(async () => {
      await BSCalendarService.populateCalendar();
    });

    it('should return correct month data', async () => {
      const monthData = await BSCalendarService.getMonthData(2080, 1);

      expect(monthData).not.toBeNull();
      expect(monthData?.yearBs).toBe(2080);
      expect(monthData?.monthBs).toBe(1);
      expect(monthData?.monthNameEn).toBe('Baisakh');
    });

    it('should return null for non-existent month', async () => {
      const monthData = await BSCalendarService.getMonthData(2080, 13);

      expect(monthData).toBeNull();
    });

    it('should return null for non-existent year', async () => {
      const monthData = await BSCalendarService.getMonthData(1999, 1);

      expect(monthData).toBeNull();
    });

    it('should return data for all 12 months', async () => {
      for (let month = 1; month <= 12; month++) {
        const monthData = await BSCalendarService.getMonthData(2080, month);
        
        expect(monthData).not.toBeNull();
        expect(monthData?.monthBs).toBe(month);
      }
    });
  });

  describe('getTotalDaysInYear', () => {
    beforeEach(async () => {
      await BSCalendarService.populateCalendar();
    });

    it('should calculate total days in a BS year', async () => {
      const totalDays = await BSCalendarService.getTotalDaysInYear(2080);

      // BS years typically have 365 or 366 days
      expect(totalDays).toBeGreaterThanOrEqual(365);
      expect(totalDays).toBeLessThanOrEqual(366);
    });

    it('should return 0 for non-existent year', async () => {
      const totalDays = await BSCalendarService.getTotalDaysInYear(1999);

      expect(totalDays).toBe(0);
    });

    it('should calculate correctly for multiple years', async () => {
      const years = [2000, 2050, 2080, 2100];
      
      for (const year of years) {
        const totalDays = await BSCalendarService.getTotalDaysInYear(year);
        
        expect(totalDays).toBeGreaterThanOrEqual(365);
        expect(totalDays).toBeLessThanOrEqual(366);
      }
    });
  });

  describe('isValidBSDate', () => {
    beforeEach(async () => {
      await BSCalendarService.populateCalendar();
    });

    it('should validate correct BS dates', async () => {
      const isValid = await BSCalendarService.isValidBSDate(2080, 1, 15);

      expect(isValid).toBe(true);
    });

    it('should reject year below 2000', async () => {
      const isValid = await BSCalendarService.isValidBSDate(1999, 1, 15);

      expect(isValid).toBe(false);
    });

    it('should reject year above 2100', async () => {
      const isValid = await BSCalendarService.isValidBSDate(2101, 1, 15);

      expect(isValid).toBe(false);
    });

    it('should reject month below 1', async () => {
      const isValid = await BSCalendarService.isValidBSDate(2080, 0, 15);

      expect(isValid).toBe(false);
    });

    it('should reject month above 12', async () => {
      const isValid = await BSCalendarService.isValidBSDate(2080, 13, 15);

      expect(isValid).toBe(false);
    });

    it('should reject day below 1', async () => {
      const isValid = await BSCalendarService.isValidBSDate(2080, 1, 0);

      expect(isValid).toBe(false);
    });

    it('should reject day exceeding days in month', async () => {
      // Get actual days in Baisakh 2080
      const monthData = await BSCalendarService.getMonthData(2080, 1);
      const daysInMonth = monthData?.daysInMonth || 31;

      const isValid = await BSCalendarService.isValidBSDate(2080, 1, daysInMonth + 1);

      expect(isValid).toBe(false);
    });

    it('should accept last day of month', async () => {
      const monthData = await BSCalendarService.getMonthData(2080, 1);
      const daysInMonth = monthData?.daysInMonth || 31;

      const isValid = await BSCalendarService.isValidBSDate(2080, 1, daysInMonth);

      expect(isValid).toBe(true);
    });

    it('should validate dates across different months', async () => {
      for (let month = 1; month <= 12; month++) {
        const monthData = await BSCalendarService.getMonthData(2080, month);
        const daysInMonth = monthData?.daysInMonth || 30;

        // First day should be valid
        expect(await BSCalendarService.isValidBSDate(2080, month, 1)).toBe(true);
        
        // Last day should be valid
        expect(await BSCalendarService.isValidBSDate(2080, month, daysInMonth)).toBe(true);
        
        // Day beyond last should be invalid
        expect(await BSCalendarService.isValidBSDate(2080, month, daysInMonth + 1)).toBe(false);
      }
    });
  });

  describe('getAllData', () => {
    beforeEach(async () => {
      await BSCalendarService.populateCalendar();
    });

    it('should return all calendar records', async () => {
      const allData = await BSCalendarService.getAllData();

      expect(allData).toHaveLength(1212); // 101 years × 12 months
    });

    it('should return records in correct order', async () => {
      const allData = await BSCalendarService.getAllData();

      // Check first record
      expect(allData[0].yearBs).toBe(2000);
      expect(allData[0].monthBs).toBe(1);

      // Check last record
      expect(allData[allData.length - 1].yearBs).toBe(2100);
      expect(allData[allData.length - 1].monthBs).toBe(12);
    });

    it('should have continuous year progression', async () => {
      const allData = await BSCalendarService.getAllData();

      let currentYear = 2000;
      let currentMonth = 1;

      for (const record of allData) {
        expect(record.yearBs).toBe(currentYear);
        expect(record.monthBs).toBe(currentMonth);

        currentMonth++;
        if (currentMonth > 12) {
          currentMonth = 1;
          currentYear++;
        }
      }
    });
  });

  describe('Data Accuracy', () => {
    beforeEach(async () => {
      await BSCalendarService.populateCalendar();
    });

    it('should have correct reference date (2000-01-01 BS = 1943-04-14 AD)', async () => {
      const firstRecord = await BSCalendar.findOne({
        where: { yearBS: 2000, monthBS: 1 }
      });

      expect(firstRecord).not.toBeNull();
      
      const startDate = new Date(firstRecord!.startDateAd);
      const expectedDate = new Date('1943-04-14');
      
      expect(startDate.toDateString()).toBe(expectedDate.toDateString());
    });

    it('should have all months with valid day counts', async () => {
      const allData = await BSCalendarService.getAllData();

      for (const record of allData) {
        expect(record.daysInMonth).toBeGreaterThanOrEqual(29);
        expect(record.daysInMonth).toBeLessThanOrEqual(32);
      }
    });

    it('should have correct month names for all records', async () => {
      const allData = await BSCalendarService.getAllData();

      for (const record of allData) {
        const expectedNameEn = BSCalendar.getMonthNameEn(record.monthBs);
        const expectedNameNp = BSCalendar.getMonthNameNp(record.monthBs);

        expect(record.monthNameEn).toBe(expectedNameEn);
        expect(record.monthNameNp).toBe(expectedNameNp);
      }
    });
  });
});
