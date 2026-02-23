import Staff, { StaffCategory } from '@models/Staff.model';
import { Subject } from '@models/Subject.model';
import Class from '@models/Class.model';
import { logger } from '@utils/logger';

/**
 * Qualification Validation Service
 * Validates teacher qualifications before assignment
 * Requirements: 4.4
 */

export interface QualificationValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

class QualificationValidationService {
  /**
   * Validate if a staff member is qualified to teach a subject
   * Requirements: 4.4
   */
  async validateSubjectAssignment(
    staffId: number,
    subjectId: number,
    classId?: number
  ): Promise<QualificationValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Fetch staff details
      const staff = await Staff.findByPk(staffId);
      if (!staff) {
        errors.push('Staff member not found');
        return { isValid: false, errors, warnings };
      }

      // Check if staff is teaching category
      if (staff.category !== StaffCategory.TEACHING) {
        errors.push('Staff member is not in teaching category');
        return { isValid: false, errors, warnings };
      }

      // Check if staff is active
      if (staff.status !== 'active') {
        errors.push('Staff member is not active');
        return { isValid: false, errors, warnings };
      }

      // Fetch subject details
      const subject = await Subject.findByPk(subjectId);
      if (!subject) {
        errors.push('Subject not found');
        return { isValid: false, errors, warnings };
      }

      // Check if staff has teaching license (warning if missing)
      if (!staff.teachingLicense) {
        warnings.push('Staff member does not have a teaching license on record');
      }

      // Check if staff has qualifications (warning if missing)
      if (!staff.highestQualification) {
        warnings.push('Staff member does not have qualifications on record');
      }

      // Check specialization match (warning if doesn't match)
      if (staff.specialization && subject.nameEn) {
        const specializationLower = staff.specialization.toLowerCase();
        const subjectNameLower = subject.nameEn.toLowerCase();
        
        // Check for common subject-specialization matches
        const hasMatch = this.checkSpecializationMatch(specializationLower, subjectNameLower);
        
        if (!hasMatch) {
          warnings.push(
            `Staff specialization (${staff.specialization}) may not match subject (${subject.nameEn})`
          );
        }
      }

      // If class is provided, validate grade level appropriateness
      if (classId) {
        const classInfo = await Class.findByPk(classId);
        if (classInfo) {
          // Check if qualifications are appropriate for grade level
          const qualificationLevel = this.getQualificationLevel(staff.highestQualification);
          const requiredLevel = this.getRequiredQualificationLevel(classInfo.gradeLevel);
          
          if (qualificationLevel < requiredLevel) {
            warnings.push(
              `Staff qualification level may be insufficient for grade ${classInfo.gradeLevel}`
            );
          }
        }
      }

      // Return validation result
      const isValid = errors.length === 0;
      
      if (isValid) {
        logger.info('Staff qualification validation passed', {
          staffId,
          subjectId,
          classId,
          warningCount: warnings.length
        });
      } else {
        logger.warn('Staff qualification validation failed', {
          staffId,
          subjectId,
          classId,
          errors
        });
      }

      return { isValid, errors, warnings };
    } catch (error) {
      logger.error('Error validating staff qualifications', {
        error,
        staffId,
        subjectId,
        classId
      });
      errors.push('Error validating qualifications');
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Validate if a staff member is qualified to be a class teacher
   * Requirements: 4.4
   */
  async validateClassTeacherAssignment(
    staffId: number,
    classId: number
  ): Promise<QualificationValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Fetch staff details
      const staff = await Staff.findByPk(staffId);
      if (!staff) {
        errors.push('Staff member not found');
        return { isValid: false, errors, warnings };
      }

      // Check if staff is teaching category
      if (staff.category !== StaffCategory.TEACHING) {
        errors.push('Staff member is not in teaching category');
        return { isValid: false, errors, warnings };
      }

      // Check if staff is active
      if (staff.status !== 'active') {
        errors.push('Staff member is not active');
        return { isValid: false, errors, warnings };
      }

      // Fetch class details
      const classInfo = await Class.findByPk(classId);
      if (!classInfo) {
        errors.push('Class not found');
        return { isValid: false, errors, warnings };
      }

      // Check if staff has teaching license (warning if missing)
      if (!staff.teachingLicense) {
        warnings.push('Staff member does not have a teaching license on record');
      }

      // Check if staff has qualifications (warning if missing)
      if (!staff.highestQualification) {
        warnings.push('Staff member does not have qualifications on record');
      }

      // Check if qualifications are appropriate for grade level
      const qualificationLevel = this.getQualificationLevel(staff.highestQualification);
      const requiredLevel = this.getRequiredQualificationLevel(classInfo.gradeLevel);
      
      if (qualificationLevel < requiredLevel) {
        warnings.push(
          `Staff qualification level may be insufficient for grade ${classInfo.gradeLevel}`
        );
      }

      // Return validation result
      const isValid = errors.length === 0;
      
      if (isValid) {
        logger.info('Class teacher qualification validation passed', {
          staffId,
          classId,
          warningCount: warnings.length
        });
      } else {
        logger.warn('Class teacher qualification validation failed', {
          staffId,
          classId,
          errors
        });
      }

      return { isValid, errors, warnings };
    } catch (error) {
      logger.error('Error validating class teacher qualifications', {
        error,
        staffId,
        classId
      });
      errors.push('Error validating qualifications');
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Check if specialization matches subject
   * This is a simple heuristic-based matching
   */
  private checkSpecializationMatch(specialization: string, subjectName: string): boolean {
    // Direct match
    if (specialization.includes(subjectName) || subjectName.includes(specialization)) {
      return true;
    }

    // Common subject-specialization mappings
    const mappings: Record<string, string[]> = {
      'mathematics': ['math', 'mathematics', 'statistics', 'applied mathematics'],
      'math': ['math', 'mathematics', 'statistics', 'applied mathematics'],
      'science': ['science', 'physics', 'chemistry', 'biology', 'general science'],
      'physics': ['physics', 'science', 'physical science'],
      'chemistry': ['chemistry', 'science'],
      'biology': ['biology', 'science', 'life science', 'zoology', 'botany'],
      'english': ['english', 'literature', 'linguistics'],
      'nepali': ['nepali', 'nepali literature'],
      'social': ['social', 'sociology', 'history', 'geography', 'political science'],
      'history': ['history', 'social', 'social studies'],
      'geography': ['geography', 'social', 'social studies'],
      'computer': ['computer', 'it', 'information technology', 'computer science'],
      'economics': ['economics', 'commerce', 'business'],
      'accounting': ['accounting', 'commerce', 'business', 'finance'],
      'business': ['business', 'commerce', 'management', 'economics']
    };

    // Check if subject has a mapping
    for (const [key, values] of Object.entries(mappings)) {
      if (subjectName.includes(key)) {
        for (const value of values) {
          if (specialization.includes(value)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Get qualification level (higher is better)
   * 0 = No qualification
   * 1 = Certificate/Diploma
   * 2 = Bachelor's
   * 3 = Master's
   * 4 = PhD
   */
  private getQualificationLevel(qualification?: string): number {
    if (!qualification) {
      return 0;
    }

    const qual = qualification.toLowerCase();

    if (qual.includes('phd') || qual.includes('doctorate')) {
      return 4;
    }
    if (qual.includes('master') || qual.includes('m.ed') || qual.includes('m.sc') || 
        qual.includes('m.a') || qual.includes('mba')) {
      return 3;
    }
    if (qual.includes('bachelor') || qual.includes('b.ed') || qual.includes('b.sc') || 
        qual.includes('b.a') || qual.includes('bba')) {
      return 2;
    }
    if (qual.includes('diploma') || qual.includes('certificate')) {
      return 1;
    }

    return 0;
  }

  /**
   * Get required qualification level for grade
   * Nepal education system requirements
   */
  private getRequiredQualificationLevel(gradeLevel: number): number {
    // Classes 1-5: Certificate/Diploma sufficient
    if (gradeLevel <= 5) {
      return 1;
    }
    // Classes 6-10: Bachelor's recommended
    if (gradeLevel <= 10) {
      return 2;
    }
    // Classes 11-12: Master's recommended
    return 3;
  }

  /**
   * Validate multiple assignments for a staff member
   * Check for conflicts and overload
   */
  async validateMultipleAssignments(
    staffId: number,
    newAssignments: Array<{
      subjectId?: number;
      classId?: number;
      assignmentType: string;
    }>
  ): Promise<QualificationValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const staff = await Staff.findByPk(staffId);
      if (!staff) {
        errors.push('Staff member not found');
        return { isValid: false, errors, warnings };
      }

      // Check if staff is teaching category
      if (staff.category !== StaffCategory.TEACHING) {
        errors.push('Staff member is not in teaching category');
        return { isValid: false, errors, warnings };
      }

      // Check total workload (warning if too many assignments)
      const totalAssignments = newAssignments.length;
      if (totalAssignments > 6) {
        warnings.push(
          `Staff member has ${totalAssignments} assignments, which may be excessive`
        );
      }

      // Validate each assignment
      for (const assignment of newAssignments) {
        if (assignment.subjectId) {
          const result = await this.validateSubjectAssignment(
            staffId,
            assignment.subjectId,
            assignment.classId
          );
          errors.push(...result.errors);
          warnings.push(...result.warnings);
        }
      }

      const isValid = errors.length === 0;
      return { isValid, errors, warnings };
    } catch (error) {
      logger.error('Error validating multiple assignments', { error, staffId });
      errors.push('Error validating multiple assignments');
      return { isValid: false, errors, warnings };
    }
  }
}

export default new QualificationValidationService();
