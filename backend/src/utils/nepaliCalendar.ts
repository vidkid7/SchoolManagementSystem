import { getBSMonthDateRange } from '../services/bsCalendar.service';

/** Nepal's academic year runs from Shrawan 1 through the final day of Ashadh. */
export interface AcademicYearInfo {
  /** BS name e.g. "2081-2082" */
  name: string;
  /** BS start date, Shrawan 1 */
  startDateBS: string;
  /** BS end date, the actual last day of Ashadh */
  endDateBS: string;
  /** Gregorian date corresponding to Shrawan 1 */
  startDateAD: Date;
  /** Gregorian date corresponding to Ashadh's last day */
  endDateAD: Date;
}

/** Return the starting BS year for the academic year containing a Gregorian date. */
export function getCurrentBSAcademicYear(date: Date = new Date()): number {
  const candidateYear = date.getFullYear() + 57;
  const candidateStart = getBSMonthDateRange(candidateYear, 4)?.startDateAD;
  if (!candidateStart) return date.getMonth() >= 6 ? candidateYear : candidateYear - 1;
  return date >= candidateStart ? candidateYear : candidateYear - 1;
}

/** Return exact year boundaries using the bundled BS calendar month lengths. */
export function getAcademicYearInfo(bsYear: number): AcademicYearInfo {
  const nextBsYear = bsYear + 1;
  const start = getBSMonthDateRange(bsYear, 4);
  const end = getBSMonthDateRange(nextBsYear, 3);
  if (!start || !end) {
    throw new RangeError(`BS calendar data is unavailable for academic year ${bsYear}-${nextBsYear}`);
  }

  return {
    name: `${bsYear}-${nextBsYear}`,
    startDateBS: `${bsYear}-04-01`,
    endDateBS: `${nextBsYear}-03-${String(end.daysInMonth).padStart(2, '0')}`,
    startDateAD: start.startDateAD,
    endDateAD: end.endDateAD,
  };
}

/** Returns the full academic year info for today's date. */
export function getCurrentAcademicYearInfo(date: Date = new Date()): AcademicYearInfo {
  return getAcademicYearInfo(getCurrentBSAcademicYear(date));
}

/** Determines whether a Gregorian date falls within an academic year's range. */
export function isDateInAcademicYear(date: Date, startDateAD: Date, endDateAD: Date): boolean {
  return date >= startDateAD && date <= endDateAD;
}
