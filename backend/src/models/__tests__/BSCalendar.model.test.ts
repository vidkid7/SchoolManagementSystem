import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import sequelize from '@config/database';
import { BSCalendar } from '../BSCalendar.model';

describe('BSCalendar Model', () => {
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

  describe('Model Structure', () => {
    it('should create a BS calendar record with all required fields', async () => {
      const record = await BSCalendar.create({
        yearBs: 2080,
        monthBs: 1,
        daysInMonth: 31,
        startDateAd: new Date('2023-04-14'),
        endDateAd: new Date('2023-05-14'),
        monthNameEn: 'Baisakh',
        monthNameNp: 'बैशाख'
      });

      expect(record.id).toBeDefined();
      expect(record.yearBs).toBe(2080);
      expect(record.monthBs).toBe(1);
      expect(record.daysInMonth).toBe(31);
      expect(record.monthNameEn).toBe('Baisakh');
      expect(record.monthNameNp).toBe('बैशाख');
      expect(record.createdAt).toBeDefined();
      expect(record.updatedAt).toBeDefined();
    });

    it('should enforce year validation (2000-2100)', async () => {
      await expect(
        BSCalendar.create({
          yearBS: 1999, // Invalid: below minimum
          monthBS: 1,
          daysInMonth: 31,
          startDateAD: new Date('1942-04-14'),
          endDateAD: new Date('1942-05-14'),
          monthNameEn: 'Baisakh',
          monthNameNp: 'बैशाख'
        })
      ).rejects.toThrow();

      await expect(
        BSCalendar.create({
          yearBS: 2101, // Invalid: above maximum
          monthBS: 1,
          daysInMonth: 31,
          startDateAD: new Date('2044-04-14'),
          endDateAD: new Date('2044-05-14'),
          monthNameEn: 'Baisakh',
          monthNameNp: 'बैशाख'
        })
      ).rejects.toThrow();
    });

    it('should enforce month validation (1-12)', async () => {
      await expect(
        BSCalendar.create({
          yearBS: 2080,
          monthBS: 0, // Invalid: below minimum
          daysInMonth: 31,
          startDateAD: new Date('2023-04-14'),
          endDateAD: new Date('2023-05-14'),
          monthNameEn: 'Invalid',
          monthNameNp: 'Invalid'
        })
      ).rejects.toThrow();

      await expect(
        BSCalendar.create({
          yearBS: 2080,
          monthBS: 13, // Invalid: above maximum
          daysInMonth: 31,
          startDateAD: new Date('2023-04-14'),
          endDateAD: new Date('2023-05-14'),
          monthNameEn: 'Invalid',
          monthNameNp: 'Invalid'
        })
      ).rejects.toThrow();
    });

    it('should enforce days validation (29-32)', async () => {
      await expect(
        BSCalendar.create({
          yearBS: 2080,
          monthBS: 1,
          daysInMonth: 28, // Invalid: below minimum
          startDateAD: new Date('2023-04-14'),
          endDateAD: new Date('2023-05-11'),
          monthNameEn: 'Baisakh',
          monthNameNp: 'बैशाख'
        })
      ).rejects.toThrow();

      await expect(
        BSCalendar.create({
          yearBS: 2080,
          monthBS: 1,
          daysInMonth: 33, // Invalid: above maximum
          startDateAD: new Date('2023-04-14'),
          endDateAD: new Date('2023-05-16'),
          monthNameEn: 'Baisakh',
          monthNameNp: 'बैशाख'
        })
      ).rejects.toThrow();
    });

    it('should enforce unique constraint on year_bs and month_bs combination', async () => {
      await BSCalendar.create({
        yearBS: 2080,
        monthBS: 1,
        daysInMonth: 31,
        startDateAD: new Date('2023-04-14'),
        endDateAD: new Date('2023-05-14'),
        monthNameEn: 'Baisakh',
        monthNameNp: 'बैशाख'
      });

      // Attempt to create duplicate
      await expect(
        BSCalendar.create({
          yearBS: 2080,
          monthBS: 1,
          daysInMonth: 31,
          startDateAD: new Date('2023-04-14'),
          endDateAD: new Date('2023-05-14'),
          monthNameEn: 'Baisakh',
          monthNameNp: 'बैशाख'
        })
      ).rejects.toThrow();
    });
  });

  describe('Static Helper Methods', () => {
    it('should return correct English month names', () => {
      expect(BSCalendar.getMonthNameEn(1)).toBe('Baisakh');
      expect(BSCalendar.getMonthNameEn(2)).toBe('Jestha');
      expect(BSCalendar.getMonthNameEn(3)).toBe('Asar');
      expect(BSCalendar.getMonthNameEn(4)).toBe('Shrawan');
      expect(BSCalendar.getMonthNameEn(5)).toBe('Bhadra');
      expect(BSCalendar.getMonthNameEn(6)).toBe('Aswin');
      expect(BSCalendar.getMonthNameEn(7)).toBe('Kartik');
      expect(BSCalendar.getMonthNameEn(8)).toBe('Mangsir');
      expect(BSCalendar.getMonthNameEn(9)).toBe('Poush');
      expect(BSCalendar.getMonthNameEn(10)).toBe('Magh');
      expect(BSCalendar.getMonthNameEn(11)).toBe('Falgun');
      expect(BSCalendar.getMonthNameEn(12)).toBe('Chaitra');
    });

    it('should return correct Nepali month names', () => {
      expect(BSCalendar.getMonthNameNp(1)).toBe('बैशाख');
      expect(BSCalendar.getMonthNameNp(2)).toBe('जेठ');
      expect(BSCalendar.getMonthNameNp(3)).toBe('असार');
      expect(BSCalendar.getMonthNameNp(4)).toBe('श्रावण');
      expect(BSCalendar.getMonthNameNp(5)).toBe('भाद्र');
      expect(BSCalendar.getMonthNameNp(6)).toBe('आश्विन');
      expect(BSCalendar.getMonthNameNp(7)).toBe('कार्तिक');
      expect(BSCalendar.getMonthNameNp(8)).toBe('मंसिर');
      expect(BSCalendar.getMonthNameNp(9)).toBe('पौष');
      expect(BSCalendar.getMonthNameNp(10)).toBe('माघ');
      expect(BSCalendar.getMonthNameNp(11)).toBe('फाल्गुन');
      expect(BSCalendar.getMonthNameNp(12)).toBe('चैत्र');
    });

    it('should return empty string for invalid month numbers', () => {
      expect(BSCalendar.getMonthNameEn(0)).toBe('');
      expect(BSCalendar.getMonthNameEn(13)).toBe('');
      expect(BSCalendar.getMonthNameNp(0)).toBe('');
      expect(BSCalendar.getMonthNameNp(13)).toBe('');
    });
  });

  describe('Data Integrity', () => {
    it('should store dates correctly', async () => {
      const startDate = new Date('2023-04-14');
      const endDate = new Date('2023-05-14');

      const record = await BSCalendar.create({
        yearBS: 2080,
        monthBS: 1,
        daysInMonth: 31,
        startDateAD: startDate,
        endDateAD: endDate,
        monthNameEn: 'Baisakh',
        monthNameNp: 'बैशाख'
      });

      expect(record.startDateAd.toISOString()).toBe(startDate.toISOString());
      expect(record.endDateAd.toISOString()).toBe(endDate.toISOString());
    });

    it('should handle all valid days in month values (29-32)', async () => {
      const validDays = [29, 30, 31, 32];
      
      for (const days of validDays) {
        const record = await BSCalendar.create({
          yearBS: 2080,
          monthBS: validDays.indexOf(days) + 1,
          daysInMonth: days,
          startDateAD: new Date('2023-04-14'),
          endDateAD: new Date('2023-05-14'),
          monthNameEn: 'Test',
          monthNameNp: 'परीक्षण'
        });

        expect(record.daysInMonth).toBe(days);
      }
    });
  });

  describe('Query Operations', () => {
    beforeEach(async () => {
      // Create test data for year 2080
      for (let month = 1; month <= 12; month++) {
        await BSCalendar.create({
          yearBS: 2080,
          monthBS: month,
          daysInMonth: 30 + (month % 2),
          startDateAD: new Date(`2023-${month.toString().padStart(2, '0')}-01`),
          endDateAD: new Date(`2023-${month.toString().padStart(2, '0')}-${30 + (month % 2)}`),
          monthNameEn: BSCalendar.getMonthNameEn(month),
          monthNameNp: BSCalendar.getMonthNameNp(month)
        });
      }
    });

    it('should find records by year', async () => {
      const records = await BSCalendar.findAll({
        where: { yearBS: 2080 }
      });

      expect(records).toHaveLength(12);
      expect(records.every(r => r.yearBs === 2080)).toBe(true);
    });

    it('should find specific month record', async () => {
      const record = await BSCalendar.findOne({
        where: { yearBS: 2080, monthBS: 1 }
      });

      expect(record).not.toBeNull();
      expect(record?.yearBs).toBe(2080);
      expect(record?.monthBs).toBe(1);
      expect(record?.monthNameEn).toBe('Baisakh');
    });

    it('should order records correctly', async () => {
      const records = await BSCalendar.findAll({
        where: { yearBS: 2080 },
        order: [['monthBS', 'ASC']]
      });

      for (let i = 0; i < records.length; i++) {
        expect(records[i].monthBs).toBe(i + 1);
      }
    });
  });
});
