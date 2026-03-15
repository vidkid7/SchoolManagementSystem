/**
 * Nepali (Bikram Sambat) Calendar Utility
 *
 * Nepal's school academic year runs:
 *   Start: Shrawan 1 (BS month 4, day 1)  ≈ July 16 AD
 *   End:   Ashadh end (BS month 3, last day of next BS year) ≈ July 15 AD
 *
 * BS/AD year relationship (approximate):
 *   After mid-April (Baisakh 1): BS year = AD year + 57
 *   Before mid-April:            BS year = AD year + 56
 *
 * For academic year purposes we use the simpler boundary of July 16:
 *   If AD date >= July 16: academic BS year = AD year + 57
 *   If AD date <  July 16: academic BS year = AD year + 56
 */

export interface AcademicYearInfo {
  /** BS name e.g. "2081-2082" */
  name: string;
  /** Start date in BS string "YYYY-04-01" (Shrawan 1) */
  startDateBS: string;
  /** End date in BS string "YYYY-03-32" (Ashadh last day) */
  endDateBS: string;
  /** Start date in AD (July 16 of bsYear - 57) */
  startDateAD: Date;
  /** End date in AD (July 15 of bsYear - 56) */
  endDateAD: Date;
}

/**
 * Given a Gregorian date, returns the BS academic year number (the starting BS year).
 * Example: July 16 2024 → 2081 (academic year 2081/2082)
 *          March 14 2026 → 2082 (academic year 2082/2083)
 */
export function getCurrentBSAcademicYear(date: Date = new Date()): number {
  const month = date.getMonth() + 1; // 1-indexed
  const day = date.getDate();
  // Shrawan 1 falls on approximately July 16 each year
  if (month > 7 || (month === 7 && day >= 16)) {
    return date.getFullYear() + 57;
  }
  return date.getFullYear() + 56;
}

/**
 * Given a BS academic year start number, returns all info about that academic year.
 * The academic year spans from Shrawan 1 (bsYear) to Ashadh end (bsYear+1).
 */
export function getAcademicYearInfo(bsYear: number): AcademicYearInfo {
  const nextBsYear = bsYear + 1;

  // AD year for Shrawan 1 of bsYear: bsYear - 57 (since Shrawan is after mid-April)
  const startADYear = bsYear - 57;
  // AD year for Ashadh end of nextBsYear: nextBsYear - 57 = bsYear - 56
  const endADYear = bsYear - 56;

  return {
    name: `${bsYear}-${nextBsYear}`,
    startDateBS: `${bsYear}-04-01`,
    endDateBS: `${nextBsYear}-03-32`,
    startDateAD: new Date(startADYear, 6, 16),  // July 16 (month index 6)
    endDateAD: new Date(endADYear, 6, 15),      // July 15 (month index 6)
  };
}

/**
 * Returns the full academic year info for today's date.
 */
export function getCurrentAcademicYearInfo(date: Date = new Date()): AcademicYearInfo {
  return getAcademicYearInfo(getCurrentBSAcademicYear(date));
}

/**
 * Determines whether the given AD date falls within the provided academic year's range.
 */
export function isDateInAcademicYear(date: Date, startDateAD: Date, endDateAD: Date): boolean {
  return date >= startDateAD && date <= endDateAD;
}
