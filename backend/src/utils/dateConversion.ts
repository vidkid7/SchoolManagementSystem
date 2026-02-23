import { BSCalendar } from '../models/BSCalendar.model';
import { logger } from './logger';
import { Op } from 'sequelize';

/**
 * Date Conversion Utility
 * Provides functions for converting between Bikram Sambat (BS) and Anno Domini (AD) calendar systems
 * 
 * Requirements: N4.7
 * 
 * Reference date: 2000-01-01 BS = 1943-04-14 AD (Baisakh 1, 2000 BS)
 */

/**
 * BS Date interface
 */
export interface BSDate {
  yearBS: number;
  monthBS: number;
  dayBS: number;
}

/**
 * Reference date for BS-AD conversion
 * 2000-01-01 BS = 1943-04-14 AD (Baisakh 1, 2000 BS)
 */
const AD_EPOCH_DATE = new Date('1943-04-14');
const BS_EPOCH_YEAR = 2000;
const BS_EPOCH_MONTH = 1;
const BS_EPOCH_DAY = 1;

/**
 * Validate if a BS date is valid
 * 
 * @param yearBS - BS year (2000-2100)
 * @param monthBS - BS month (1-12)
 * @param dayBS - BS day (1-32)
 * @returns true if the date is valid, false otherwise
 */
export async function isValidBSDate(
  yearBS: number,
  monthBS: number,
  dayBS: number
): Promise<boolean> {
  try {
    // Check year range
    if (yearBS < 2000 || yearBS > 2100) {
      return false;
    }

    // Check month range
    if (monthBS < 1 || monthBS > 12) {
      return false;
    }

    // Check day is positive
    if (dayBS < 1) {
      return false;
    }

    // Get the month data from the lookup table
    const monthData = await BSCalendar.findOne({
      where: { yearBs: yearBS, monthBs: monthBS }
    });

    if (!monthData) {
      return false;
    }

    // Check if day is within the valid range for this month
    return dayBS <= monthData.daysInMonth;
  } catch (error) {
    logger.error('Error validating BS date:', error);
    return false;
  }
}

/**
 * Convert BS date to AD date
 * 
 * @param yearBS - BS year (2000-2100)
 * @param monthBS - BS month (1-12)
 * @param dayBS - BS day (1-32)
 * @returns AD Date object
 * @throws Error if the BS date is invalid
 */
export async function convertBSToAD(
  yearBS: number,
  monthBS: number,
  dayBS: number
): Promise<Date> {
  try {
    // Validate the BS date
    const isValid = await isValidBSDate(yearBS, monthBS, dayBS);
    if (!isValid) {
      throw new Error(
        `Invalid BS date: ${yearBS}-${monthBS}-${dayBS}. ` +
        `Year must be 2000-2100, month must be 1-12, and day must be valid for the month.`
      );
    }

    // Calculate total days from epoch to the target date
    let totalDays = 0;

    // Add days from complete years
    if (yearBS > BS_EPOCH_YEAR) {
      const yearData = await BSCalendar.findAll({
        where: {
          yearBs: {
            [Op.gte]: BS_EPOCH_YEAR,
            [Op.lt]: yearBS
          }
        },
        order: [['yearBs', 'ASC'], ['monthBs', 'ASC']]
      });

      for (const month of yearData) {
        // Skip months before epoch in the epoch year
        if (month.yearBs === BS_EPOCH_YEAR && month.monthBs < BS_EPOCH_MONTH) {
          continue;
        }
        totalDays += month.daysInMonth;
      }
    }

    // Add days from complete months in the target year
    if (monthBS > 1) {
      const monthData = await BSCalendar.findAll({
        where: {
          yearBs: yearBS,
          monthBs: {
            [Op.gte]: yearBS === BS_EPOCH_YEAR ? BS_EPOCH_MONTH : 1,
            [Op.lt]: monthBS
          }
        },
        order: [['monthBs', 'ASC']]
      });

      for (const month of monthData) {
        totalDays += month.daysInMonth;
      }
    }

    // Add remaining days in the target month
    // Subtract 1 because epoch day is day 1, not day 0
    totalDays += dayBS - BS_EPOCH_DAY;

    // Calculate AD date by adding days to epoch
    const adDate = new Date(AD_EPOCH_DATE);
    adDate.setDate(adDate.getDate() + totalDays);

    return adDate;
  } catch (error) {
    logger.error('Error converting BS to AD:', error);
    throw error;
  }
}

/**
 * Convert AD date to BS date
 * 
 * @param adDate - AD Date object
 * @returns BS date object with yearBS, monthBS, dayBS
 * @throws Error if the AD date is out of supported range
 */
export async function convertADToBS(adDate: Date): Promise<BSDate> {
  try {
    // Validate AD date is within supported range
    const minADDate = new Date(AD_EPOCH_DATE);
    
    // Calculate max AD date (end of 2100 BS)
    const maxBSData = await BSCalendar.findOne({
      where: { yearBs: 2100, monthBs: 12 }
    });
    
    if (!maxBSData) {
      throw new Error('BS calendar data not found for year 2100');
    }
    
    const maxADDate = new Date(maxBSData.endDateAd);

    if (adDate < minADDate || adDate > maxADDate) {
      throw new Error(
        `AD date ${adDate.toISOString().split('T')[0]} is out of supported range. ` +
        `Supported range: ${minADDate.toISOString().split('T')[0]} to ${maxADDate.toISOString().split('T')[0]}`
      );
    }

    // Find the BS month that contains this AD date
    const monthData = await BSCalendar.findOne({
      where: {
        startDateAd: {
          [Op.lte]: adDate
        },
        endDateAd: {
          [Op.gte]: adDate
        }
      }
    });

    if (!monthData) {
      throw new Error(`No BS calendar data found for AD date: ${adDate.toISOString().split('T')[0]}`);
    }

    // Calculate the day within the month
    const startDate = new Date(monthData.startDateAd);
    const diffTime = adDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const dayBS = diffDays + 1; // Days are 1-indexed

    return {
      yearBS: monthData.yearBs,
      monthBS: monthData.monthBs,
      dayBS: dayBS
    };
  } catch (error) {
    logger.error('Error converting AD to BS:', error);
    throw error;
  }
}

/**
 * Nepali numeral mapping
 */
const NEPALI_NUMERALS: { [key: string]: string } = {
  '0': '०',
  '1': '१',
  '2': '२',
  '3': '३',
  '4': '४',
  '5': '५',
  '6': '६',
  '7': '७',
  '8': '८',
  '9': '९'
};

/**
 * Convert English numerals to Nepali numerals
 * 
 * @param num - Number or string to convert
 * @returns String with Nepali numerals
 */
export function toNepaliNumerals(num: number | string): string {
  const str = num.toString();
  return str.split('').map(char => NEPALI_NUMERALS[char] || char).join('');
}

/**
 * Convert Nepali numerals to English numerals
 * 
 * @param str - String with Nepali numerals
 * @returns String with English numerals
 */
export function toEnglishNumerals(str: string): string {
  const reverseMap: { [key: string]: string } = {};
  Object.entries(NEPALI_NUMERALS).forEach(([eng, nep]) => {
    reverseMap[nep] = eng;
  });
  
  return str.split('').map(char => reverseMap[char] || char).join('');
}

/**
 * Format BS date as string
 * 
 * @param yearBS - BS year
 * @param monthBS - BS month
 * @param dayBS - BS day
 * @param format - Format type: 'short' (YYYY-MM-DD), 'long' (DD Month YYYY), 'nepali' (Nepali month name)
 * @param useNepaliNumerals - Whether to use Nepali numerals (०१२३...) instead of English (0123...)
 * @returns Formatted date string
 */
export function formatBSDate(
  yearBS: number,
  monthBS: number,
  dayBS: number,
  format: 'short' | 'long' | 'nepali' = 'short',
  useNepaliNumerals: boolean = false
): string {
  const year = yearBS.toString().padStart(4, '0');
  const month = monthBS.toString().padStart(2, '0');
  const day = dayBS.toString().padStart(2, '0');

  let result: string;

  switch (format) {
    case 'short':
      result = `${year}-${month}-${day}`;
      break;
    
    case 'long': {
      const monthNameEn = BSCalendar.getMonthNameEn(monthBS);
      result = `${day} ${monthNameEn} ${year}`;
      break;
    }
    
    case 'nepali': {
      const monthNameNp = BSCalendar.getMonthNameNp(monthBS);
      result = `${day} ${monthNameNp} ${year}`;
      break;
    }
    
    default:
      result = `${year}-${month}-${day}`;
  }

  // Convert to Nepali numerals if requested
  if (useNepaliNumerals) {
    result = toNepaliNumerals(result);
  }

  return result;
}

/**
 * Format date in dual format (BS and AD)
 * 
 * @param yearBS - BS year
 * @param monthBS - BS month
 * @param dayBS - BS day
 * @param options - Formatting options
 * @returns Formatted string in format "YYYY-MM-DD BS (YYYY-MM-DD AD)"
 */
export async function formatDualDate(
  yearBS: number,
  monthBS: number,
  dayBS: number,
  options?: {
    bsFormat?: 'short' | 'long' | 'nepali';
    useNepaliNumerals?: boolean;
    separator?: string;
  }
): Promise<string> {
  try {
    const {
      bsFormat = 'short',
      useNepaliNumerals = false,
      separator = ' '
    } = options || {};

    const bsDateStr = formatBSDate(yearBS, monthBS, dayBS, bsFormat, useNepaliNumerals);
    const adDate = await convertBSToAD(yearBS, monthBS, dayBS);
    const adDateStr = adDate.toISOString().split('T')[0];
    
    const bsLabel = useNepaliNumerals ? 'बि.सं.' : 'BS';
    const adLabel = useNepaliNumerals ? 'ई.सं.' : 'AD';
    
    return `${bsDateStr}${separator}${bsLabel}${separator}(${adDateStr}${separator}${adLabel})`;
  } catch (error) {
    logger.error('Error formatting dual date:', error);
    throw error;
  }
}

/**
 * Format date in Nepali style with full month name
 * 
 * @param yearBS - BS year
 * @param monthBS - BS month
 * @param dayBS - BS day
 * @param useNepaliNumerals - Whether to use Nepali numerals
 * @returns Formatted string like "१५ बैशाख २०८०" or "15 Baisakh 2080"
 */
export function formatBSDateNepali(
  yearBS: number,
  monthBS: number,
  dayBS: number,
  useNepaliNumerals: boolean = true
): string {
  const monthNameNp = BSCalendar.getMonthNameNp(monthBS);
  const day = dayBS.toString();
  const year = yearBS.toString();
  
  if (useNepaliNumerals) {
    return `${toNepaliNumerals(day)} ${monthNameNp} ${toNepaliNumerals(year)}`;
  }
  
  return `${day} ${monthNameNp} ${year}`;
}

/**
 * Format date in English style with full month name
 * 
 * @param yearBS - BS year
 * @param monthBS - BS month
 * @param dayBS - BS day
 * @returns Formatted string like "15 Baisakh 2080"
 */
export function formatBSDateEnglish(
  yearBS: number,
  monthBS: number,
  dayBS: number
): string {
  const monthNameEn = BSCalendar.getMonthNameEn(monthBS);
  return `${dayBS} ${monthNameEn} ${yearBS}`;
}

/**
 * Format date with custom pattern
 * Supported tokens:
 * - YYYY: 4-digit year
 * - YY: 2-digit year
 * - MM: 2-digit month
 * - M: month number
 * - MMMM: full month name in English
 * - MMM: short month name in English (first 3 letters)
 * - DD: 2-digit day
 * - D: day number
 * 
 * @param yearBS - BS year
 * @param monthBS - BS month
 * @param dayBS - BS day
 * @param pattern - Format pattern (e.g., "DD/MM/YYYY", "MMMM D, YYYY")
 * @param useNepaliNumerals - Whether to use Nepali numerals
 * @returns Formatted date string
 */
export function formatBSDateCustom(
  yearBS: number,
  monthBS: number,
  dayBS: number,
  pattern: string,
  useNepaliNumerals: boolean = false
): string {
  const monthNameEn = BSCalendar.getMonthNameEn(monthBS);
  const monthNameShort = monthNameEn.substring(0, 3);
  
  let result = pattern
    .replace('YYYY', yearBS.toString().padStart(4, '0'))
    .replace('YY', (yearBS % 100).toString().padStart(2, '0'))
    .replace('MMMM', monthNameEn)
    .replace('MMM', monthNameShort)
    .replace('MM', monthBS.toString().padStart(2, '0'))
    .replace('M', monthBS.toString())
    .replace('DD', dayBS.toString().padStart(2, '0'))
    .replace('D', dayBS.toString());
  
  if (useNepaliNumerals) {
    result = toNepaliNumerals(result);
  }
  
  return result;
}

/**
 * Get current BS date
 * 
 * @returns Current date in BS calendar
 */
export async function getCurrentBSDate(): Promise<BSDate> {
  const today = new Date();
  return await convertADToBS(today);
}

/**
 * Add days to a BS date
 * 
 * @param yearBS - BS year
 * @param monthBS - BS month
 * @param dayBS - BS day
 * @param daysToAdd - Number of days to add (can be negative)
 * @returns New BS date after adding days
 */
export async function addDaysToBS(
  yearBS: number,
  monthBS: number,
  dayBS: number,
  daysToAdd: number
): Promise<BSDate> {
  try {
    // Convert to AD, add days, convert back to BS
    const adDate = await convertBSToAD(yearBS, monthBS, dayBS);
    adDate.setDate(adDate.getDate() + daysToAdd);
    return await convertADToBS(adDate);
  } catch (error) {
    logger.error('Error adding days to BS date:', error);
    throw error;
  }
}

/**
 * Calculate difference in days between two BS dates
 * 
 * @param date1 - First BS date
 * @param date2 - Second BS date
 * @returns Number of days between dates (date2 - date1)
 */
export async function diffBSDates(
  date1: BSDate,
  date2: BSDate
): Promise<number> {
  try {
    const ad1 = await convertBSToAD(date1.yearBS, date1.monthBS, date1.dayBS);
    const ad2 = await convertBSToAD(date2.yearBS, date2.monthBS, date2.dayBS);
    
    const diffTime = ad2.getTime() - ad1.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (error) {
    logger.error('Error calculating difference between BS dates:', error);
    throw error;
  }
}

/**
 * Compare two BS dates
 * 
 * @param date1 - First BS date
 * @param date2 - Second BS date
 * @returns -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export function compareBSDates(date1: BSDate, date2: BSDate): number {
  if (date1.yearBS !== date2.yearBS) {
    return date1.yearBS < date2.yearBS ? -1 : 1;
  }
  if (date1.monthBS !== date2.monthBS) {
    return date1.monthBS < date2.monthBS ? -1 : 1;
  }
  if (date1.dayBS !== date2.dayBS) {
    return date1.dayBS < date2.dayBS ? -1 : 1;
  }
  return 0;
}
