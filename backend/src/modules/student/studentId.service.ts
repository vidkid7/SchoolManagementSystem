import { Transaction } from 'sequelize';
import sequelize from '@config/database';
import { env } from '@config/env';
import { logger } from '@utils/logger';
import Student from '@models/Student.model';

/**
 * Student ID Generation Service
 * Generates unique student IDs with format: {school_prefix}-{admission_year}-{sequential_number}
 * Requirements: 2.2
 * 
 * Features:
 * - Thread-safe ID generation using database transactions
 * - Automatic sequential numbering per admission year
 * - Configurable school prefix from environment
 * - Handles concurrent ID generation safely
 */
class StudentIdService {
  /**
   * Generate a unique student ID
   * Format: {school_prefix}-{admission_year}-{sequential_number}
   * Example: SCH001-2024-0001
   * 
   * @param admissionDate - Date of admission
   * @param transaction - Optional database transaction for atomicity
   * @returns Generated unique student ID
   */
  async generateStudentId(admissionDate: Date, transaction?: Transaction): Promise<string> {
    try {
      const schoolPrefix = env.DEFAULT_SCHOOL_CODE;
      const admissionYear = admissionDate.getFullYear();

      // Use transaction to ensure thread-safety
      const t = transaction || await sequelize.transaction();

      try {
        // Find the highest sequential number for this year
        // Using FOR UPDATE to lock the rows and prevent race conditions
        const lastStudent = await Student.findOne({
          where: sequelize.where(
            sequelize.fn('YEAR', sequelize.col('admission_date')),
            admissionYear
          ),
          order: [['student_code', 'DESC']],
          lock: transaction ? undefined : t.LOCK.UPDATE,
          transaction: t
        });

        let sequentialNumber = 1;

        if (lastStudent && lastStudent.studentCode) {
          // Extract sequential number from last student code
          // Format: PREFIX-YEAR-SEQNUM
          const parts = lastStudent.studentCode.split('-');
          if (parts.length === 3) {
            const lastSeqNum = parseInt(parts[2], 10);
            if (!isNaN(lastSeqNum)) {
              sequentialNumber = lastSeqNum + 1;
            }
          }
        }

        // Format sequential number with leading zeros (4 digits)
        const formattedSeqNum = sequentialNumber.toString().padStart(4, '0');
        
        // Generate student ID
        const studentId = `${schoolPrefix}-${admissionYear}-${formattedSeqNum}`;

        // Commit transaction if we created it
        if (!transaction) {
          await t.commit();
        }

        logger.info('Student ID generated', { 
          studentId, 
          admissionYear, 
          sequentialNumber 
        });

        return studentId;
      } catch (error) {
        // Rollback transaction if we created it
        if (!transaction) {
          await t.rollback();
        }
        throw error;
      }
    } catch (error) {
      logger.error('Error generating student ID', { error, admissionDate });
      throw new Error('Failed to generate student ID');
    }
  }

  /**
   * Validate student ID format
   * @param studentId - Student ID to validate
   * @returns True if valid, false otherwise
   */
  validateStudentIdFormat(studentId: string): boolean {
    // Format: PREFIX-YEAR-SEQNUM
    // Example: SCH001-2024-0001
    const pattern = /^[A-Z0-9]+-\d{4}-\d{4}$/;
    return pattern.test(studentId);
  }

  /**
   * Parse student ID components
   * @param studentId - Student ID to parse
   * @returns Object with prefix, year, and sequential number
   */
  parseStudentId(studentId: string): { 
    prefix: string; 
    year: number; 
    sequentialNumber: number 
  } | null {
    if (!this.validateStudentIdFormat(studentId)) {
      return null;
    }

    const parts = studentId.split('-');
    return {
      prefix: parts[0],
      year: parseInt(parts[1], 10),
      sequentialNumber: parseInt(parts[2], 10)
    };
  }

  /**
   * Get next available sequential number for a given year
   * @param admissionYear - Admission year
   * @returns Next sequential number
   */
  async getNextSequentialNumber(admissionYear: number): Promise<number> {
    try {
      const lastStudent = await Student.findOne({
        where: sequelize.where(
          sequelize.fn('YEAR', sequelize.col('admission_date')),
          admissionYear
        ),
        order: [['student_code', 'DESC']]
      });

      if (!lastStudent || !lastStudent.studentCode) {
        return 1;
      }

      const parts = lastStudent.studentCode.split('-');
      if (parts.length === 3) {
        const lastSeqNum = parseInt(parts[2], 10);
        if (!isNaN(lastSeqNum)) {
          return lastSeqNum + 1;
        }
      }

      return 1;
    } catch (error) {
      logger.error('Error getting next sequential number', { error, admissionYear });
      throw error;
    }
  }

  /**
   * Count students admitted in a specific year
   * @param admissionYear - Admission year
   * @returns Count of students
   */
  async countStudentsByAdmissionYear(admissionYear: number): Promise<number> {
    try {
      return await Student.count({
        where: sequelize.where(
          sequelize.fn('YEAR', sequelize.col('admission_date')),
          admissionYear
        )
      });
    } catch (error) {
      logger.error('Error counting students by admission year', { error, admissionYear });
      throw error;
    }
  }
}

export default new StudentIdService();

