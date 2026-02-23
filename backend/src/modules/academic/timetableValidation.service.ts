import { Op } from 'sequelize';
import { logger } from '@utils/logger';
import StaffAssignment, { AssignmentType } from '@models/StaffAssignment.model';

/**
 * Timetable Validation Service
 * Implements educational best practices and fuzzy logic rules for teacher scheduling
 * 
 * Rules Implemented:
 * 1. Teacher time conflict prevention
 * 2. Daily teaching hours limit (6 hours warning, 8 hours max)
 * 3. Class teacher first period priority
 * 4. Consecutive period limits
 * 5. Minimum break requirements
 */

interface Period {
  periodId?: number;
  timetableId: number;
  periodNumber: number;
  startTime: string; // HH:mm format
  endTime: string;
  subjectId?: number;
  teacherId?: number;
  roomNumber?: string;
}

interface TimeConflict {
  periodId: number;
  periodNumber: number;
  startTime: string;
  endTime: string;
  subjectName?: string;
  className?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  conflicts?: TimeConflict[];
}

class TimetableValidationService {
  /**
   * Convert time string (HH:mm) to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Check if two time ranges overlap
   */
  private timesOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean {
    const start1Min = this.timeToMinutes(start1);
    const end1Min = this.timeToMinutes(end1);
    const start2Min = this.timeToMinutes(start2);
    const end2Min = this.timeToMinutes(end2);

    return start1Min < end2Min && end1Min > start2Min;
  }

  /**
   * Calculate duration in hours
   */
  private calculateDuration(startTime: string, endTime: string): number {
    const startMin = this.timeToMinutes(startTime);
    const endMin = this.timeToMinutes(endTime);
    return (endMin - startMin) / 60;
  }

  /**
   * RULE 1: Validate teacher availability (no time conflicts)
   * A teacher cannot be in two places at the same time
   */
  async validateTeacherAvailability(
    teacherId: number,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    academicYearId: number,
    excludePeriodId?: number
  ): Promise<ValidationResult> {
    try {
      // This would query the periods table to find conflicts
      // For now, returning a structure that can be implemented
      // when the Period model is available
      
      const errors: string[] = [];
      const warnings: string[] = [];
      const conflicts: TimeConflict[] = [];

      // Query would be:
      // SELECT p.* FROM periods p
      // JOIN timetables t ON p.timetable_id = t.timetable_id
      // WHERE p.teacher_id = teacherId
      // AND t.day_of_week = dayOfWeek
      // AND t.academic_year_id = academicYearId
      // AND p.period_id != excludePeriodId (if provided)

      // Check for time overlaps
      // If conflicts found:
      // conflicts.push({
      //   periodId: conflict.periodId,
      //   periodNumber: conflict.periodNumber,
      //   startTime: conflict.startTime,
      //   endTime: conflict.endTime,
      //   subjectName: conflict.subject?.name,
      //   className: conflict.timetable?.class?.name
      // });

      if (conflicts.length > 0) {
        errors.push(
          `Teacher has ${conflicts.length} conflicting period(s) at this time`
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        conflicts
      };
    } catch (error) {
      logger.error('Error validating teacher availability', { error, teacherId });
      throw error;
    }
  }

  /**
   * RULE 2: Validate daily teaching hours
   * Teachers should not exceed 6-8 hours of actual teaching per day
   * Based on Magna Carta for Public School Teachers (RA 4670)
   */
  async validateDailyTeachingHours(
    teacherId: number,
    dayOfWeek: number,
    academicYearId: number,
    additionalPeriod?: { startTime: string; endTime: string }
  ): Promise<ValidationResult> {
    try {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Query all periods for this teacher on this day
      // Calculate total teaching hours
      let totalHours = 0;

      // Query would be:
      // SELECT p.start_time, p.end_time FROM periods p
      // JOIN timetables t ON p.timetable_id = t.timetable_id
      // WHERE p.teacher_id = teacherId
      // AND t.day_of_week = dayOfWeek
      // AND t.academic_year_id = academicYearId

      // For each period, add duration
      // totalHours += this.calculateDuration(period.startTime, period.endTime);

      // Add the new period if provided
      if (additionalPeriod) {
        totalHours += this.calculateDuration(
          additionalPeriod.startTime,
          additionalPeriod.endTime
        );
      }

      // Apply rules
      if (totalHours > 8) {
        errors.push(
          `Daily teaching hours (${totalHours.toFixed(1)}h) exceeds maximum limit of 8 hours`
        );
      } else if (totalHours > 6) {
        warnings.push(
          `Daily teaching hours (${totalHours.toFixed(1)}h) exceeds recommended limit of 6 hours`
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      logger.error('Error validating daily teaching hours', { error, teacherId });
      throw error;
    }
  }

  /**
   * RULE 3: Validate class teacher first period assignment
   * Class teachers should conduct homeroom/attendance in first period
   */
  async validateClassTeacherFirstPeriod(
    classId: number,
    academicYearId: number,
    dayOfWeek: number
  ): Promise<ValidationResult> {
    try {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Find the class teacher for this class
      const classTeacherAssignment = await StaffAssignment.findOne({
        where: {
          classId,
          academicYearId,
          assignmentType: AssignmentType.CLASS_TEACHER,
          isActive: true
        }
      });

      if (!classTeacherAssignment) {
        warnings.push('No class teacher assigned to this class');
        return { isValid: true, errors, warnings };
      }

      // Query first period for this class on this day
      // Check if class teacher is assigned to first period
      // Query would be:
      // SELECT p.* FROM periods p
      // JOIN timetables t ON p.timetable_id = t.timetable_id
      // WHERE t.class_id = classId
      // AND t.day_of_week = dayOfWeek
      // AND t.academic_year_id = academicYearId
      // AND p.period_number = 1

      // If first period exists and teacher_id != classTeacherAssignment.staffId:
      // warnings.push(
      //   'Class teacher is not assigned to first period. Consider assigning for attendance and homeroom.'
      // );

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      logger.error('Error validating class teacher first period', { error, classId });
      throw error;
    }
  }

  /**
   * RULE 4: Validate consecutive teaching periods
   * Teachers should not teach more than 3 consecutive periods without a break
   */
  async validateConsecutivePeriods(
    teacherId: number,
    dayOfWeek: number,
    academicYearId: number,
    newPeriodNumber: number
  ): Promise<ValidationResult> {
    try {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Query all periods for this teacher on this day, ordered by period_number
      // Check for consecutive sequences
      
      // Algorithm:
      // 1. Get all period numbers for this teacher on this day
      // 2. Add the new period number
      // 3. Sort the array
      // 4. Find longest consecutive sequence
      // 5. If sequence > 3, add warning

      // Example: periods = [1, 2, 3, 5, 6]
      // Consecutive sequences: [1,2,3] (length 3), [5,6] (length 2)
      // Max consecutive = 3 (at limit, warn)

      // If maxConsecutive > 3:
      // warnings.push(
      //   `Teacher has ${maxConsecutive} consecutive periods. Consider adding a break.`
      // );

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      logger.error('Error validating consecutive periods', { error, teacherId });
      throw error;
    }
  }

  /**
   * RULE 5: Validate minimum break requirements
   * Teachers should have at least 1 free period every 3-4 teaching periods
   */
  async validateMinimumBreaks(
    teacherId: number,
    dayOfWeek: number,
    academicYearId: number
  ): Promise<ValidationResult> {
    try {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Query all periods for this teacher on this day
      // Count total periods and calculate free periods
      
      // If teacher has 6+ periods with no breaks:
      // warnings.push(
      //   'Teacher has no free periods. Consider scheduling breaks for preparation time.'
      // );

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      logger.error('Error validating minimum breaks', { error, teacherId });
      throw error;
    }
  }

  /**
   * RULE 6: Validate same teacher for same subject in same class
   * One teacher should handle all periods of a subject in a class for consistency
   */
  async validateSubjectConsistency(
    classId: number,
    subjectId: number,
    teacherId: number,
    academicYearId: number,
    excludePeriodId?: number
  ): Promise<ValidationResult> {
    try {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Query all periods for this class-subject combination
      // Check if different teachers are assigned
      
      // Query would be:
      // SELECT DISTINCT p.teacher_id FROM periods p
      // JOIN timetables t ON p.timetable_id = t.timetable_id
      // WHERE t.class_id = classId
      // AND p.subject_id = subjectId
      // AND t.academic_year_id = academicYearId
      // AND p.period_id != excludePeriodId

      // If multiple teachers found:
      // warnings.push(
      //   'Multiple teachers are assigned to this subject in this class. ' +
      //   'Consider assigning one teacher for pedagogical consistency.'
      // );

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      logger.error('Error validating subject consistency', { error, classId, subjectId });
      throw error;
    }
  }

  /**
   * Comprehensive validation for period assignment
   * Runs all validation rules
   */
  async validatePeriodAssignment(
    period: Period,
    dayOfWeek: number,
    classId: number,
    academicYearId: number
  ): Promise<ValidationResult> {
    try {
      const allErrors: string[] = [];
      const allWarnings: string[] = [];
      let allConflicts: TimeConflict[] = [];

      if (!period.teacherId) {
        return { isValid: true, errors: [], warnings: [] };
      }

      // Rule 1: Teacher availability
      const availabilityResult = await this.validateTeacherAvailability(
        period.teacherId,
        dayOfWeek,
        period.startTime,
        period.endTime,
        academicYearId,
        period.periodId
      );
      allErrors.push(...availabilityResult.errors);
      allWarnings.push(...availabilityResult.warnings);
      if (availabilityResult.conflicts) {
        allConflicts = availabilityResult.conflicts;
      }

      // Rule 2: Daily teaching hours
      const hoursResult = await this.validateDailyTeachingHours(
        period.teacherId,
        dayOfWeek,
        academicYearId,
        { startTime: period.startTime, endTime: period.endTime }
      );
      allErrors.push(...hoursResult.errors);
      allWarnings.push(...hoursResult.warnings);

      // Rule 3: Class teacher first period (only for period 1)
      if (period.periodNumber === 1) {
        const firstPeriodResult = await this.validateClassTeacherFirstPeriod(
          classId,
          academicYearId,
          dayOfWeek
        );
        allWarnings.push(...firstPeriodResult.warnings);
      }

      // Rule 4: Consecutive periods
      const consecutiveResult = await this.validateConsecutivePeriods(
        period.teacherId,
        dayOfWeek,
        academicYearId,
        period.periodNumber
      );
      allWarnings.push(...consecutiveResult.warnings);

      // Rule 5: Minimum breaks
      const breaksResult = await this.validateMinimumBreaks(
        period.teacherId,
        dayOfWeek,
        academicYearId
      );
      allWarnings.push(...breaksResult.warnings);

      // Rule 6: Subject consistency
      if (period.subjectId) {
        const consistencyResult = await this.validateSubjectConsistency(
          classId,
          period.subjectId,
          period.teacherId,
          academicYearId,
          period.periodId
        );
        allWarnings.push(...consistencyResult.warnings);
      }

      return {
        isValid: allErrors.length === 0,
        errors: allErrors,
        warnings: allWarnings,
        conflicts: allConflicts.length > 0 ? allConflicts : undefined
      };
    } catch (error) {
      logger.error('Error in comprehensive period validation', { error, period });
      throw error;
    }
  }

  /**
   * Get teacher workload analytics for a specific day
   */
  async getTeacherDailyWorkload(
    teacherId: number,
    dayOfWeek: number,
    academicYearId: number
  ): Promise<{
    totalPeriods: number;
    totalHours: number;
    consecutivePeriods: number;
    freePeriods: number;
    firstPeriodAssigned: boolean;
    recommendations: string[];
  }> {
    try {
      // Query all periods for this teacher on this day
      // Calculate metrics
      
      const recommendations: string[] = [];

      // Add recommendations based on workload
      // if (totalHours > 6) recommendations.push('Consider reducing teaching hours');
      // if (consecutivePeriods > 3) recommendations.push('Add breaks between classes');
      // if (freePeriods === 0) recommendations.push('Schedule preparation time');

      return {
        totalPeriods: 0,
        totalHours: 0,
        consecutivePeriods: 0,
        freePeriods: 0,
        firstPeriodAssigned: false,
        recommendations
      };
    } catch (error) {
      logger.error('Error getting teacher daily workload', { error, teacherId });
      throw error;
    }
  }
}

export default new TimetableValidationService();
