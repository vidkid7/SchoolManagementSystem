import Student, { StudentStatus } from '@models/Student.model';
import AcademicHistory, { CompletionStatus } from '@models/AcademicHistory.model';
import { logger } from '@utils/logger';
import auditLogger from '@utils/auditLogger';
import { Request } from 'express';
import sequelize from '@config/database';
import { Transaction } from 'sequelize';

/**
 * Promotion Eligibility Criteria
 */
export interface PromotionEligibilityCriteria {
  minAttendancePercentage?: number;
  minGpa?: number;
  requirePassingGrades?: boolean;
}

/**
 * Promotion Result
 */
export interface PromotionResult {
  success: boolean;
  studentId: number;
  studentCode: string;
  fromGrade: number;
  toGrade: number;
  eligible: boolean;
  reason?: string;
  historyId?: number;
}

/**
 * Bulk Promotion Result
 */
export interface BulkPromotionResult {
  totalStudents: number;
  promoted: number;
  failed: number;
  results: PromotionResult[];
}

/**
 * Student Promotion Service
 * Handles student promotion to next grade level with academic history tracking
 * Requirements: 2.10
 */
class PromotionService {
  /**
   * Default promotion eligibility criteria
   */
  private readonly DEFAULT_CRITERIA: PromotionEligibilityCriteria = {
    minAttendancePercentage: 75,
    minGpa: 1.6, // As per NEB requirements for Class 10 to 11 promotion
    requirePassingGrades: true
  };

  /**
   * Validate promotion eligibility
   * @param student - Student to validate
   * @param academicData - Academic performance data
   * @param criteria - Eligibility criteria
   * @returns Eligibility result with reason
   */
  private validateEligibility(
    student: Student,
    academicData: {
      attendancePercentage?: number;
      gpa?: number;
      hasFailingGrades?: boolean;
    },
    criteria: PromotionEligibilityCriteria = this.DEFAULT_CRITERIA
  ): { eligible: boolean; reason?: string } {
    // Check if student is active
    if (student.status !== StudentStatus.ACTIVE) {
      return {
        eligible: false,
        reason: `Student status is ${student.status}, not active`
      };
    }

    // Check if student is in Class 12 (cannot promote beyond)
    if (!student.currentClassId) {
      return {
        eligible: false,
        reason: 'Student is not assigned to any class'
      };
    }

    // Check attendance requirement
    if (criteria.minAttendancePercentage && academicData.attendancePercentage !== undefined) {
      if (academicData.attendancePercentage < criteria.minAttendancePercentage) {
        return {
          eligible: false,
          reason: `Attendance ${academicData.attendancePercentage}% is below minimum ${criteria.minAttendancePercentage}%`
        };
      }
    }

    // Check GPA requirement
    if (criteria.minGpa && academicData.gpa !== undefined) {
      if (academicData.gpa < criteria.minGpa) {
        return {
          eligible: false,
          reason: `GPA ${academicData.gpa} is below minimum ${criteria.minGpa}`
        };
      }
    }

    // Check for failing grades
    if (criteria.requirePassingGrades && academicData.hasFailingGrades) {
      return {
        eligible: false,
        reason: 'Student has failing grades in one or more subjects'
      };
    }

    return { eligible: true };
  }

  /**
   * Promote a single student to next grade level
   * @param studentId - Student ID
   * @param academicYearId - Current academic year ID
   * @param nextClassId - Next class ID to promote to
   * @param academicData - Academic performance data
   * @param criteria - Promotion eligibility criteria
   * @param userId - User performing the promotion
   * @param req - Express request object
   * @returns Promotion result
   */
  async promoteStudent(
    studentId: number,
    academicYearId: number,
    nextClassId: number,
    academicData: {
      currentClassId: number;
      currentGradeLevel: number;
      rollNumber?: number;
      attendancePercentage?: number;
      gpa?: number;
      totalMarks?: number;
      rank?: number;
      hasFailingGrades?: boolean;
    },
    criteria: PromotionEligibilityCriteria = this.DEFAULT_CRITERIA,
    userId?: number,
    req?: Request
  ): Promise<PromotionResult> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      // Find student
      const student = await Student.findByPk(studentId, { transaction });
      
      if (!student) {
        await transaction.rollback();
        return {
          success: false,
          studentId,
          studentCode: '',
          fromGrade: 0,
          toGrade: 0,
          eligible: false,
          reason: 'Student not found'
        };
      }

      // Validate eligibility
      const eligibilityCheck = this.validateEligibility(student, academicData, criteria);
      
      const nextGradeLevel = academicData.currentGradeLevel + 1;

      // Create academic history record
      const history = await AcademicHistory.create({
        studentId: student.studentId,
        academicYearId,
        classId: academicData.currentClassId,
        gradeLevel: academicData.currentGradeLevel,
        rollNumber: academicData.rollNumber,
        attendancePercentage: academicData.attendancePercentage,
        gpa: academicData.gpa,
        totalMarks: academicData.totalMarks,
        rank: academicData.rank,
        completionStatus: eligibilityCheck.eligible ? CompletionStatus.PROMOTED : CompletionStatus.FAILED,
        promotionEligible: eligibilityCheck.eligible,
        promotedToClass: eligibilityCheck.eligible ? nextGradeLevel : undefined,
        remarks: eligibilityCheck.reason,
        promotedBy: userId,
        promotedAt: eligibilityCheck.eligible ? new Date() : undefined
      }, { transaction });

      // If eligible, update student's current class
      if (eligibilityCheck.eligible) {
        const oldValue = student.toJSON();

        await student.update({
          currentClassId: nextClassId
        }, { transaction });

        const newValue = student.toJSON();

        // Log audit entry
        await auditLogger.logUpdate(
          'student',
          student.studentId,
          oldValue,
          newValue,
          userId,
          req
        );

        logger.info('Student promoted successfully', {
          studentId: student.studentId,
          studentCode: student.studentCode,
          fromGrade: academicData.currentGradeLevel,
          toGrade: nextGradeLevel,
          historyId: history.historyId
        });
      } else {
        logger.info('Student promotion failed - not eligible', {
          studentId: student.studentId,
          studentCode: student.studentCode,
          reason: eligibilityCheck.reason
        });
      }

      await transaction.commit();

      return {
        success: eligibilityCheck.eligible,
        studentId: student.studentId,
        studentCode: student.studentCode,
        fromGrade: academicData.currentGradeLevel,
        toGrade: nextGradeLevel,
        eligible: eligibilityCheck.eligible,
        reason: eligibilityCheck.reason,
        historyId: history.historyId
      };

    } catch (error) {
      await transaction.rollback();
      logger.error('Error promoting student', { error, studentId });
      throw error;
    }
  }

  /**
   * Promote entire class to next grade level (bulk promotion)
   * @param classId - Current class ID
   * @param academicYearId - Current academic year ID
   * @param nextClassId - Next class ID to promote to
   * @param studentsData - Array of student academic data
   * @param criteria - Promotion eligibility criteria
   * @param userId - User performing the promotion
   * @param req - Express request object
   * @returns Bulk promotion result
   */
  async promoteClass(
    classId: number,
    academicYearId: number,
    nextClassId: number,
    studentsData: Array<{
      studentId: number;
      currentGradeLevel: number;
      rollNumber?: number;
      attendancePercentage?: number;
      gpa?: number;
      totalMarks?: number;
      rank?: number;
      hasFailingGrades?: boolean;
    }>,
    criteria: PromotionEligibilityCriteria = this.DEFAULT_CRITERIA,
    userId?: number,
    req?: Request
  ): Promise<BulkPromotionResult> {
    logger.info('Starting bulk class promotion', {
      classId,
      academicYearId,
      nextClassId,
      totalStudents: studentsData.length
    });

    const results: PromotionResult[] = [];
    let promoted = 0;
    let failed = 0;

    // Process each student
    for (const studentData of studentsData) {
      try {
        const result = await this.promoteStudent(
          studentData.studentId,
          academicYearId,
          nextClassId,
          {
            currentClassId: classId,
            currentGradeLevel: studentData.currentGradeLevel,
            rollNumber: studentData.rollNumber,
            attendancePercentage: studentData.attendancePercentage,
            gpa: studentData.gpa,
            totalMarks: studentData.totalMarks,
            rank: studentData.rank,
            hasFailingGrades: studentData.hasFailingGrades
          },
          criteria,
          userId,
          req
        );

        results.push(result);

        if (result.success) {
          promoted++;
        } else {
          failed++;
        }
      } catch (error) {
        logger.error('Error promoting student in bulk operation', {
          error,
          studentId: studentData.studentId
        });
        
        results.push({
          success: false,
          studentId: studentData.studentId,
          studentCode: '',
          fromGrade: studentData.currentGradeLevel,
          toGrade: studentData.currentGradeLevel + 1,
          eligible: false,
          reason: 'Error during promotion: ' + (error as Error).message
        });
        
        failed++;
      }
    }

    logger.info('Bulk class promotion completed', {
      classId,
      totalStudents: studentsData.length,
      promoted,
      failed
    });

    return {
      totalStudents: studentsData.length,
      promoted,
      failed,
      results
    };
  }

  /**
   * Get student's academic history
   * @param studentId - Student ID
   * @returns Array of academic history records
   */
  async getStudentHistory(studentId: number): Promise<AcademicHistory[]> {
    try {
      return await AcademicHistory.findAll({
        where: { studentId },
        order: [['academicYearId', 'DESC']]
      });
    } catch (error) {
      logger.error('Error fetching student academic history', { error, studentId });
      throw error;
    }
  }

  /**
   * Get promotion statistics for a class
   * @param classId - Class ID
   * @param academicYearId - Academic year ID
   * @returns Promotion statistics
   */
  async getClassPromotionStats(
    classId: number,
    academicYearId: number
  ): Promise<{
    total: number;
    promoted: number;
    failed: number;
    pending: number;
  }> {
    try {
      const total = await AcademicHistory.count({
        where: {
          classId,
          academicYearId
        }
      });

      const promoted = await AcademicHistory.count({
        where: {
          classId,
          academicYearId,
          completionStatus: CompletionStatus.PROMOTED
        }
      });

      const failed = await AcademicHistory.count({
        where: {
          classId,
          academicYearId,
          completionStatus: CompletionStatus.FAILED
        }
      });

      return {
        total,
        promoted,
        failed,
        pending: total - promoted - failed
      };
    } catch (error) {
      logger.error('Error fetching class promotion statistics', { error, classId, academicYearId });
      throw error;
    }
  }

  /**
   * Check if student has been promoted for a specific academic year
   * @param studentId - Student ID
   * @param academicYearId - Academic year ID
   * @returns True if promoted, false otherwise
   */
  async isStudentPromoted(studentId: number, academicYearId: number): Promise<boolean> {
    try {
      const history = await AcademicHistory.findOne({
        where: {
          studentId,
          academicYearId,
          completionStatus: CompletionStatus.PROMOTED
        }
      });

      return history !== null;
    } catch (error) {
      logger.error('Error checking student promotion status', { error, studentId, academicYearId });
      throw error;
    }
  }

  /**
   * Rollback a promotion (for corrections)
   * @param historyId - Academic history ID
   * @param userId - User performing the rollback
   * @param req - Express request object
   * @returns True if successful
   */
  async rollbackPromotion(
    historyId: number,
    userId?: number,
    req?: Request
  ): Promise<boolean> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      const history = await AcademicHistory.findByPk(historyId, { transaction });

      if (!history || history.completionStatus !== CompletionStatus.PROMOTED) {
        await transaction.rollback();
        return false;
      }

      const student = await Student.findByPk(history.studentId, { transaction });

      if (!student) {
        await transaction.rollback();
        return false;
      }

      // Revert student to previous class
      const oldValue = student.toJSON();

      await student.update({
        currentClassId: history.classId
      }, { transaction });

      const newValue = student.toJSON();

      // Update history record
      await history.update({
        completionStatus: CompletionStatus.COMPLETED,
        promotedToClass: undefined,
        remarks: (history.remarks || '') + ' [PROMOTION ROLLED BACK]'
      }, { transaction });

      // Log audit entry
      await auditLogger.logUpdate(
        'student',
        student.studentId,
        oldValue,
        newValue,
        userId,
        req
      );

      await transaction.commit();

      logger.info('Promotion rolled back successfully', {
        historyId,
        studentId: student.studentId
      });

      return true;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error rolling back promotion', { error, historyId });
      throw error;
    }
  }
}

export default new PromotionService();
