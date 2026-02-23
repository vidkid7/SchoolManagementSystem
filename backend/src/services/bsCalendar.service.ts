import { BSCalendar } from '../models/BSCalendar.model';
import { logger } from '../utils/logger';

/**
 * BS Calendar Service
 * Provides functionality to populate and manage Bikram Sambat calendar data
 * 
 * Requirements: N4.1, N4.7
 */

/**
 * BS Calendar data structure
 * Each entry represents days in each month for a specific BS year
 * Data source: Official Nepal Calendar (https://nepalicalendar.rat32.com/)
 */
interface BSYearData {
  year: number;
  months: number[]; // Array of 12 numbers representing days in each month
}

/**
 * Accurate BS calendar data for years 2000-2100 BS
 * This data is based on the official Nepal calendar
 * Each array contains 12 numbers representing days in months 1-12 (Baisakh to Chaitra)
 */
const BS_CALENDAR_DATA: BSYearData[] = [
  // 2000-2009 BS
  { year: 2000, months: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31] },
  { year: 2001, months: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30] },
  { year: 2002, months: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30] },
  { year: 2003, months: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31] },
  { year: 2004, months: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31] },
  { year: 2005, months: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30] },
  { year: 2006, months: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30] },
  { year: 2007, months: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31] },
  { year: 2008, months: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31] },
  { year: 2009, months: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30] },
  
  // 2010-2019 BS
  { year: 2010, months: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30] },
  { year: 2011, months: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31] },
  { year: 2012, months: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30] },
  { year: 2013, months: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30] },
  { year: 2014, months: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30] },
  { year: 2015, months: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31] },
  { year: 2016, months: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30] },
  { year: 2017, months: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30] },
  { year: 2018, months: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30] },
  { year: 2019, months: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31] },
  
  // 2020-2029 BS
  { year: 2020, months: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30] },
  { year: 2021, months: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30] },
  { year: 2022, months: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30] },
  { year: 2023, months: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31] },
  { year: 2024, months: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30] },
  { year: 2025, months: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30] },
  { year: 2026, months: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31] },
  { year: 2027, months: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31] },
  { year: 2028, months: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30] },
  { year: 2029, months: [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30] },
  
  // 2030-2039 BS
  { year: 2030, months: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31] },
  { year: 2031, months: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31] },
  { year: 2032, months: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30] },
  { year: 2033, months: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30] },
  { year: 2034, months: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31] },
  { year: 2035, months: [30, 32, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31] },
  { year: 2036, months: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30] },
  { year: 2037, months: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30] },
  { year: 2038, months: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31] },
  { year: 2039, months: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30] },
  
  // 2040-2049 BS
  { year: 2040, months: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30] },
  { year: 2041, months: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30] },
  { year: 2042, months: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31] },
  { year: 2043, months: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30] },
  { year: 2044, months: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30] },
  { year: 2045, months: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30] },
  { year: 2046, months: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31] },
  { year: 2047, months: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30] },
  { year: 2048, months: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30] },
  { year: 2049, months: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30] },
  
  // 2050-2059 BS
  { year: 2050, months: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31] },
  { year: 2051, months: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30] },
  { year: 2052, months: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30] },
  { year: 2053, months: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30] },
  { year: 2054, months: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31] },
  { year: 2055, months: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30] },
  { year: 2056, months: [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30] },
  { year: 2057, months: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31] },
  { year: 2058, months: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31] },
  { year: 2059, months: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30] },
  
  // 2060-2069 BS
  { year: 2060, months: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30] },
  { year: 2061, months: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31] },
  { year: 2062, months: [30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31] },
  { year: 2063, months: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30] },
  { year: 2064, months: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30] },
  { year: 2065, months: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31] },
  { year: 2066, months: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31] },
  { year: 2067, months: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30] },
  { year: 2068, months: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30] },
  { year: 2069, months: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31] },
  
  // 2070-2079 BS
  { year: 2070, months: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30] },
  { year: 2071, months: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30] },
  { year: 2072, months: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30] },
  { year: 2073, months: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31] },
  { year: 2074, months: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30] },
  { year: 2075, months: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30] },
  { year: 2076, months: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30] },
  { year: 2077, months: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31] },
  { year: 2078, months: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30] },
  { year: 2079, months: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30] },
  
  // 2080-2089 BS
  { year: 2080, months: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30] },
  { year: 2081, months: [31, 31, 32, 32, 31, 30, 30, 30, 29, 30, 30, 30] },
  { year: 2082, months: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30] },
  { year: 2083, months: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30] },
  { year: 2084, months: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30] },
  { year: 2085, months: [31, 32, 31, 32, 30, 31, 30, 30, 29, 30, 30, 30] },
  { year: 2086, months: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30] },
  { year: 2087, months: [31, 31, 32, 31, 31, 31, 30, 30, 29, 30, 30, 30] },
  { year: 2088, months: [30, 31, 32, 32, 30, 31, 30, 30, 29, 30, 30, 30] },
  { year: 2089, months: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30] },
  
  // 2090-2099 BS
  { year: 2090, months: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30] },
  { year: 2091, months: [31, 31, 32, 31, 31, 31, 30, 30, 29, 30, 30, 30] },
  { year: 2092, months: [30, 31, 32, 32, 31, 30, 30, 30, 29, 30, 30, 30] },
  { year: 2093, months: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30] },
  { year: 2094, months: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30] },
  { year: 2095, months: [31, 31, 32, 31, 31, 31, 30, 29, 30, 30, 30, 30] },
  { year: 2096, months: [30, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30] },
  { year: 2097, months: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30] },
  { year: 2098, months: [31, 31, 32, 31, 31, 31, 29, 30, 29, 30, 29, 31] },
  { year: 2099, months: [31, 31, 32, 31, 31, 31, 30, 29, 29, 30, 30, 30] },
  
  // 2100 BS
  { year: 2100, months: [31, 32, 31, 32, 30, 31, 30, 29, 30, 29, 30, 30] }
];

/**
 * Reference date for BS-AD conversion
 * 2000-01-01 BS = 1943-04-14 AD (Baisakh 1, 2000 BS)
 */
const AD_EPOCH_DATE = new Date('1943-04-14');

export class BSCalendarService {
  /**
   * Populate the BS calendar table with data for years 2000-2100 BS
   */
  public static async populateCalendar(): Promise<void> {
    try {
      logger.info('Starting BS calendar population...');

      // Check if data already exists
      const existingCount = await BSCalendar.count();
      if (existingCount > 0) {
        logger.info(`BS calendar already populated with ${existingCount} records`);
        return;
      }

      const records: any[] = [];
      let currentADDate = new Date(AD_EPOCH_DATE);

      // Process each year
      for (const yearData of BS_CALENDAR_DATA) {
        // Process each month
        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
          const monthBS = monthIndex + 1;
          const daysInMonth = yearData.months[monthIndex];
          
          // Calculate start and end dates in AD
          const startDateAD = new Date(currentADDate);
          
          // Calculate end date by adding days
          const endDateAD = new Date(currentADDate);
          endDateAD.setDate(endDateAD.getDate() + daysInMonth - 1);
          
          records.push({
            yearBS: yearData.year,
            monthBS: monthBS,
            daysInMonth: daysInMonth,
            startDateAD: startDateAD,
            endDateAD: endDateAD,
            monthNameEn: BSCalendar.getMonthNameEn(monthBS),
            monthNameNp: BSCalendar.getMonthNameNp(monthBS)
          });
          
          // Move to next month
          currentADDate.setDate(currentADDate.getDate() + daysInMonth);
        }
      }

      // Bulk insert all records
      await BSCalendar.bulkCreate(records, { ignoreDuplicates: true });
      
      logger.info(`Successfully populated BS calendar with ${records.length} records (${BS_CALENDAR_DATA.length} years)`);
    } catch (error) {
      logger.error('Error populating BS calendar:', error);
      throw error;
    }
  }

  /**
   * Get calendar data for a specific BS year
   */
  public static async getYearData(yearBS: number): Promise<BSCalendar[]> {
    return await BSCalendar.findAll({
      where: { yearBS },
      order: [['monthBS', 'ASC']]
    });
  }

  /**
   * Get calendar data for a specific BS month
   */
  public static async getMonthData(yearBS: number, monthBS: number): Promise<BSCalendar | null> {
    return await BSCalendar.findOne({
      where: { yearBS, monthBS }
    });
  }

  /**
   * Get total days in a BS year
   */
  public static async getTotalDaysInYear(yearBS: number): Promise<number> {
    const yearData = await this.getYearData(yearBS);
    return yearData.reduce((total, month) => total + month.daysInMonth, 0);
  }

  /**
   * Validate if a BS date is valid
   */
  public static async isValidBSDate(yearBS: number, monthBS: number, dayBS: number): Promise<boolean> {
    if (yearBS < 2000 || yearBS > 2100) return false;
    if (monthBS < 1 || monthBS > 12) return false;
    if (dayBS < 1) return false;

    const monthData = await this.getMonthData(yearBS, monthBS);
    if (!monthData) return false;

    return dayBS <= monthData.daysInMonth;
  }

  /**
   * Get all calendar data (for testing/debugging)
   */
  public static async getAllData(): Promise<BSCalendar[]> {
    return await BSCalendar.findAll({
      order: [['yearBS', 'ASC'], ['monthBS', 'ASC']]
    });
  }
}
