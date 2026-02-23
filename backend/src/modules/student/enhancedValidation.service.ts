import { StudentCreationAttributes, StudentStatus } from '@models/Student.model';
import StudentRepository from './student.repository';
import { logger } from '@utils/logger';
import NepaliDate from 'nepali-date-converter';

/**
 * Validation Result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Enhanced Validation Service
 * Provides advanced validation logic for student data
 */
class EnhancedValidationService {
  /**
   * Validate age is appropriate for grade level
   * @param dateOfBirth - Date of birth
   * @param gradeLevel - Grade level (1-12)
   * @returns Validation result
   */
  validateAgeForGrade(dateOfBirth: Date, gradeLevel: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const age = this.calculateAge(dateOfBirth);
      const expectedAge = gradeLevel + 5; // Grade 1 = 6 years old

      // Strict validation: age should be within ±2 years of expected
      if (age < expectedAge - 2) {
        errors.push(
          `Student age (${age}) is too young for Grade ${gradeLevel}. ` +
          `Expected age range: ${expectedAge - 2} to ${expectedAge + 2} years.`
        );
      } else if (age > expectedAge + 2) {
        warnings.push(
          `Student age (${age}) is older than typical for Grade ${gradeLevel}. ` +
          `Expected age range: ${expectedAge - 2} to ${expectedAge + 2} years.`
        );
      } else if (age === expectedAge - 2 || age === expectedAge + 2) {
        warnings.push(
          `Student age (${age}) is at the edge of acceptable range for Grade ${gradeLevel}.`
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      logger.error('Error validating age for grade', { error, dateOfBirth, gradeLevel });
      return {
        isValid: false,
        errors: ['Failed to validate age for grade'],
        warnings: []
      };
    }
  }

  /**
   * Validate roll number is unique within class
   * @param classId - Class ID
   * @param rollNumber - Roll number
   * @param excludeStudentId - Student ID to exclude (for updates)
   * @returns Validation result
   */
  async validateRollNumberUniqueness(
    classId: number,
    rollNumber: number,
    excludeStudentId?: number
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const { students } = await StudentRepository.findAll(
        { classId, status: StudentStatus.ACTIVE },
        { limit: 1000, offset: 0 }
      );

      const duplicate = students.find(s => 
        s.rollNumber === rollNumber && 
        s.studentId !== excludeStudentId
      );

      if (duplicate) {
        errors.push(
          `Roll number ${rollNumber} is already assigned to ` +
          `${duplicate.firstNameEn} ${duplicate.lastNameEn} (${duplicate.studentCode}) ` +
          'in this class.'
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      logger.error('Error validating roll number uniqueness', { 
        error, 
        classId, 
        rollNumber 
      });
      return {
        isValid: false,
        errors: ['Failed to validate roll number uniqueness'],
        warnings: []
      };
    }
  }

  /**
   * Validate BS date matches AD date
   * @param dateBS - Nepali date (BS) in YYYY-MM-DD format
   * @param dateAD - Gregorian date (AD)
   * @returns Validation result
   */
  validateBSADDateMatch(dateBS: string, dateAD: Date): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Parse BS date
      const [yearBS, monthBS, dayBS] = dateBS.split('-').map(Number);
      
      // Convert BS to AD
      const nepaliDate = new NepaliDate(yearBS, monthBS - 1, dayBS);
      const convertedAD = nepaliDate.toJsDate();

      // Compare dates (allow 1 day difference for timezone issues)
      const diffDays = Math.abs(
        (convertedAD.getTime() - dateAD.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays > 1) {
        errors.push(
          `BS date (${dateBS}) does not match AD date (${dateAD.toISOString().split('T')[0]}). ` +
          `BS date converts to ${convertedAD.toISOString().split('T')[0]}.`
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      logger.error('Error validating BS/AD date match', { error, dateBS, dateAD });
      return {
        isValid: false,
        errors: ['Invalid BS date format or conversion failed'],
        warnings: []
      };
    }
  }

  /**
   * Validate SEE symbol number format
   * @param symbolNumber - SEE symbol number
   * @returns Validation result
   */
  validateSEESymbolNumber(symbolNumber: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // SEE symbol number format: typically 7-10 digits
    const symbolPattern = /^\d{7,10}$/;

    if (!symbolPattern.test(symbolNumber)) {
      errors.push(
        'Invalid SEE symbol number format. ' +
        'Symbol number should be 7-10 digits.'
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate NEB registration number format
   * @param nebRegistrationNumber - NEB registration number
   * @returns Validation result
   */
  validateNEBRegistrationNumber(nebRegistrationNumber: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // NEB registration format: typically alphanumeric, 8-15 characters
    const nebPattern = /^[A-Z0-9]{8,15}$/i;

    if (!nebPattern.test(nebRegistrationNumber)) {
      errors.push(
        'Invalid NEB registration number format. ' +
        'Registration number should be 8-15 alphanumeric characters.'
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Comprehensive validation for student data
   * @param studentData - Student data to validate
   * @param excludeStudentId - Student ID to exclude (for updates)
   * @returns Validation result
   */
  async validateStudentData(
    studentData: Partial<StudentCreationAttributes>,
    excludeStudentId?: number
  ): Promise<ValidationResult> {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    try {
      // Validate age for grade
      if (studentData.dateOfBirthAD && studentData.admissionClass) {
        const ageValidation = this.validateAgeForGrade(
          new Date(studentData.dateOfBirthAD),
          studentData.admissionClass
        );
        allErrors.push(...ageValidation.errors);
        allWarnings.push(...ageValidation.warnings);
      }

      // Validate roll number uniqueness
      if (studentData.currentClassId && studentData.rollNumber) {
        const rollValidation = await this.validateRollNumberUniqueness(
          studentData.currentClassId,
          studentData.rollNumber,
          excludeStudentId
        );
        allErrors.push(...rollValidation.errors);
        allWarnings.push(...rollValidation.warnings);
      }

      // Validate BS/AD date match
      if (studentData.dateOfBirthBS && studentData.dateOfBirthAD) {
        const dateValidation = this.validateBSADDateMatch(
          studentData.dateOfBirthBS,
          new Date(studentData.dateOfBirthAD)
        );
        allErrors.push(...dateValidation.errors);
        allWarnings.push(...dateValidation.warnings);
      }

      // Validate SEE symbol number
      if (studentData.symbolNumber) {
        const symbolValidation = this.validateSEESymbolNumber(
          studentData.symbolNumber
        );
        allErrors.push(...symbolValidation.errors);
        allWarnings.push(...symbolValidation.warnings);
      }

      // Validate NEB registration number
      if (studentData.nebRegistrationNumber) {
        const nebValidation = this.validateNEBRegistrationNumber(
          studentData.nebRegistrationNumber
        );
        allErrors.push(...nebValidation.errors);
        allWarnings.push(...nebValidation.warnings);
      }

      return {
        isValid: allErrors.length === 0,
        errors: allErrors,
        warnings: allWarnings
      };
    } catch (error) {
      logger.error('Error in comprehensive validation', { error, studentData });
      return {
        isValid: false,
        errors: ['Validation failed due to system error'],
        warnings: []
      };
    }
  }

  /**
   * Calculate age from date of birth
   * @param dateOfBirth - Date of birth
   * @returns Age in years
   */
  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Get next available roll number for a class
   * @param classId - Class ID
   * @returns Next available roll number
   */
  async getNextRollNumber(classId: number): Promise<number> {
    try {
      const { students } = await StudentRepository.findAll(
        { classId, status: StudentStatus.ACTIVE },
        { limit: 1000, offset: 0 }
      );

      if (students.length === 0) return 1;

      const maxRoll = Math.max(...students.map(s => s.rollNumber || 0));
      return maxRoll + 1;
    } catch (error) {
      logger.error('Error getting next roll number', { error, classId });
      return 1;
    }
  }
}

export default new EnhancedValidationService();
