/**
 * ECA Enrollment Service
 * Business logic for ECA enrollment management
 * 
 * Features:
 * - Student enrollment with capacity checking
 * - Multiple ECA enrollment support
 * - Participation and attendance tracking
 * - Enrollment validation and business rules
 * 
 * Requirements: 11.3, 11.4
 */

import ecaEnrollmentRepository from './ecaEnrollment.repository';
import ECA from '@models/ECA.model';
import ECAEnrollment, { ECAEnrollmentCreationAttributes } from '@models/ECAEnrollment.model';
import { logger } from '@utils/logger';
import { Request } from 'express';

interface EnrollmentInput {
  ecaId: number;
  studentId: number;
  enrollmentDate?: Date;
  remarks?: string;
}

interface EnrollmentFilters {
  ecaId?: number;
  studentId?: number;
  status?: 'active' | 'withdrawn' | 'completed';
  enrollmentDateFrom?: Date;
  enrollmentDateTo?: Date;
}

class ECAEnrollmentService {
  /**
   * Enroll a student in an ECA
   * Validates capacity and checks for duplicate enrollment
   * 
   * @param enrollmentData - Enrollment data
   * @param userId - User ID performing the enrollment
   * @param req - Express request object
   * @returns Created enrollment
   * @throws Error if validation fails
   */
  async enrollStudent(
    enrollmentData: EnrollmentInput,
    userId?: number,
    req?: Request
  ): Promise<ECAEnrollment> {
    try {
      const { ecaId, studentId, enrollmentDate, remarks } = enrollmentData;

      // 1. Check if ECA exists
      const eca = await ECA.findByPk(ecaId);
      if (!eca) {
        throw new Error(`ECA with ID ${ecaId} not found`);
      }

      // 2. Check if ECA is active
      if (eca.status !== 'active') {
        throw new Error(`ECA "${eca.name}" is not active for enrollment`);
      }

      // 3. Check if student is already enrolled (Requirement 11.3)
      const existingEnrollment = await ecaEnrollmentRepository.isStudentEnrolled(
        ecaId,
        studentId
      );

      if (existingEnrollment) {
        throw new Error(
          `Student is already enrolled in ECA "${eca.name}"`
        );
      }

      // 4. Check capacity before enrollment (Requirement 11.3)
      if (!eca.hasCapacity()) {
        throw new Error(
          `ECA "${eca.name}" has reached its capacity of ${eca.capacity} students`
        );
      }

      // 5. Create enrollment
      const enrollmentCreateData: ECAEnrollmentCreationAttributes = {
        ecaId,
        studentId,
        enrollmentDate: enrollmentDate || new Date(),
        status: 'active',
        attendanceCount: 0,
        totalSessions: 0,
        remarks
      };

      const enrollment = await ecaEnrollmentRepository.create(
        enrollmentCreateData,
        userId,
        req
      );

      // 6. Increment ECA enrollment count
      await eca.incrementEnrollment();

      logger.info('Student enrolled in ECA successfully', {
        enrollmentId: enrollment.enrollmentId,
        ecaId,
        studentId,
        ecaName: eca.name
      });

      return enrollment;
    } catch (error) {
      logger.error('Error enrolling student in ECA', {
        error,
        enrollmentData
      });
      throw error;
    }
  }

  /**
   * Withdraw a student from an ECA
   * 
   * @param enrollmentId - Enrollment ID
   * @param remarks - Withdrawal remarks
   * @param userId - User ID performing the withdrawal
   * @param req - Express request object
   * @returns Updated enrollment
   * @throws Error if enrollment not found or already withdrawn
   */
  async withdrawStudent(
    enrollmentId: number,
    remarks?: string,
    userId?: number,
    req?: Request
  ): Promise<ECAEnrollment> {
    try {
      // 1. Find enrollment
      const enrollment = await ecaEnrollmentRepository.findById(enrollmentId);
      if (!enrollment) {
        throw new Error(`Enrollment with ID ${enrollmentId} not found`);
      }

      // 2. Check if already withdrawn or completed
      if (enrollment.status === 'withdrawn') {
        throw new Error('Enrollment is already withdrawn');
      }

      if (enrollment.status === 'completed') {
        throw new Error('Cannot withdraw a completed enrollment');
      }

      // 3. Withdraw enrollment
      const updatedEnrollment = await ecaEnrollmentRepository.withdraw(
        enrollmentId,
        remarks,
        userId,
        req
      );

      if (!updatedEnrollment) {
        throw new Error('Failed to withdraw enrollment');
      }

      // 4. Decrement ECA enrollment count
      const eca = await ECA.findByPk(enrollment.ecaId);
      if (eca) {
        await eca.decrementEnrollment();
      }

      logger.info('Student withdrawn from ECA', {
        enrollmentId,
        ecaId: enrollment.ecaId,
        studentId: enrollment.studentId
      });

      return updatedEnrollment;
    } catch (error) {
      logger.error('Error withdrawing student from ECA', {
        error,
        enrollmentId
      });
      throw error;
    }
  }

  /**
   * Mark attendance for a student in an ECA session
   * Tracks participation and attendance (Requirement 11.4)
   * 
   * @param enrollmentId - Enrollment ID
   * @param present - Whether student was present
   * @returns Updated enrollment
   * @throws Error if enrollment not found or not active
   */
  async markAttendance(
    enrollmentId: number,
    present: boolean
  ): Promise<ECAEnrollment> {
    try {
      // 1. Find enrollment
      const enrollment = await ecaEnrollmentRepository.findById(enrollmentId);
      if (!enrollment) {
        throw new Error(`Enrollment with ID ${enrollmentId} not found`);
      }

      // 2. Check if enrollment is active
      if (enrollment.status !== 'active') {
        throw new Error(
          `Cannot mark attendance for ${enrollment.status} enrollment`
        );
      }

      // 3. Mark attendance
      const updatedEnrollment = await ecaEnrollmentRepository.markAttendance(
        enrollmentId,
        present
      );

      if (!updatedEnrollment) {
        throw new Error('Failed to mark attendance');
      }

      logger.info('ECA attendance marked', {
        enrollmentId,
        present,
        attendancePercentage: updatedEnrollment.getAttendancePercentage()
      });

      return updatedEnrollment;
    } catch (error) {
      logger.error('Error marking ECA attendance', {
        error,
        enrollmentId,
        present
      });
      throw error;
    }
  }

  /**
   * Bulk mark attendance for multiple students
   * 
   * @param attendanceData - Array of enrollment IDs and attendance status
   * @returns Array of updated enrollments
   */
  async bulkMarkAttendance(
    attendanceData: Array<{ enrollmentId: number; present: boolean }>
  ): Promise<ECAEnrollment[]> {
    try {
      const updatedEnrollments: ECAEnrollment[] = [];

      for (const { enrollmentId, present } of attendanceData) {
        try {
          const enrollment = await this.markAttendance(enrollmentId, present);
          updatedEnrollments.push(enrollment);
        } catch (error) {
          logger.warn('Failed to mark attendance for enrollment', {
            enrollmentId,
            error
          });
          // Continue with other enrollments
        }
      }

      logger.info('Bulk ECA attendance marked', {
        total: attendanceData.length,
        successful: updatedEnrollments.length
      });

      return updatedEnrollments;
    } catch (error) {
      logger.error('Error bulk marking ECA attendance', {
        error,
        count: attendanceData.length
      });
      throw error;
    }
  }

  /**
   * Get enrollment by ID
   * 
   * @param enrollmentId - Enrollment ID
   * @returns Enrollment or null
   */
  async getEnrollmentById(enrollmentId: number): Promise<ECAEnrollment | null> {
    try {
      return await ecaEnrollmentRepository.findById(enrollmentId);
    } catch (error) {
      logger.error('Error getting enrollment by ID', { error, enrollmentId });
      throw error;
    }
  }

  /**
   * Get all enrollments for a student
   * Supports multiple ECA enrollment (Requirement 11.3)
   * 
   * @param studentId - Student ID
   * @param status - Optional status filter
   * @returns Array of enrollments
   */
  async getStudentEnrollments(
    studentId: number,
    status?: 'active' | 'withdrawn' | 'completed'
  ): Promise<ECAEnrollment[]> {
    try {
      return await ecaEnrollmentRepository.findByStudent(studentId, status);
    } catch (error) {
      logger.error('Error getting student enrollments', { error, studentId });
      throw error;
    }
  }

  /**
   * Get all enrollments for an ECA
   * 
   * @param ecaId - ECA ID
   * @param status - Optional status filter
   * @returns Array of enrollments
   */
  async getEcaEnrollments(
    ecaId: number,
    status?: 'active' | 'withdrawn' | 'completed'
  ): Promise<ECAEnrollment[]> {
    try {
      return await ecaEnrollmentRepository.findByEca(ecaId, status);
    } catch (error) {
      logger.error('Error getting ECA enrollments', { error, ecaId });
      throw error;
    }
  }

  /**
   * Get enrollments with filters and pagination
   * 
   * @param filters - Optional filters
   * @param page - Page number
   * @param limit - Items per page
   * @returns Enrollments with pagination metadata
   */
  async getEnrollments(
    filters?: EnrollmentFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    enrollments: ECAEnrollment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      return await ecaEnrollmentRepository.findWithPagination(filters, page, limit);
    } catch (error) {
      logger.error('Error getting enrollments', { error, filters, page, limit });
      throw error;
    }
  }

  /**
   * Get enrollment statistics for an ECA
   * 
   * @param ecaId - ECA ID
   * @returns Enrollment statistics
   */
  async getEnrollmentStats(ecaId: number): Promise<{
    total: number;
    active: number;
    withdrawn: number;
    completed: number;
    averageAttendance: number;
  }> {
    try {
      return await ecaEnrollmentRepository.getEnrollmentStats(ecaId);
    } catch (error) {
      logger.error('Error getting enrollment stats', { error, ecaId });
      throw error;
    }
  }

  /**
   * Get student's ECA participation summary
   * Tracks participation across all ECAs (Requirement 11.4)
   * 
   * @param studentId - Student ID
   * @returns Participation summary
   */
  async getStudentParticipationSummary(studentId: number): Promise<{
    totalEnrollments: number;
    activeEnrollments: number;
    completedEnrollments: number;
    averageAttendance: number;
    ecas: Array<{
      ecaId: number;
      ecaName: string;
      status: string;
      attendancePercentage: number;
    }>;
  }> {
    try {
      return await ecaEnrollmentRepository.getStudentParticipationSummary(studentId);
    } catch (error) {
      logger.error('Error getting student participation summary', {
        error,
        studentId
      });
      throw error;
    }
  }

  /**
   * Complete an enrollment
   * Marks enrollment as completed at end of academic year
   * 
   * @param enrollmentId - Enrollment ID
   * @param userId - User ID performing the completion
   * @param req - Express request object
   * @returns Updated enrollment
   */
  async completeEnrollment(
    enrollmentId: number,
    userId?: number,
    req?: Request
  ): Promise<ECAEnrollment> {
    try {
      const enrollment = await ecaEnrollmentRepository.findById(enrollmentId);
      if (!enrollment) {
        throw new Error(`Enrollment with ID ${enrollmentId} not found`);
      }

      if (enrollment.status !== 'active') {
        throw new Error(
          `Cannot complete enrollment with status: ${enrollment.status}`
        );
      }

      const updatedEnrollment = await ecaEnrollmentRepository.update(
        enrollmentId,
        { status: 'completed' },
        userId,
        req
      );

      if (!updatedEnrollment) {
        throw new Error('Failed to complete enrollment');
      }

      // Decrement ECA enrollment count
      const eca = await ECA.findByPk(enrollment.ecaId);
      if (eca) {
        await eca.decrementEnrollment();
      }

      logger.info('Enrollment completed', {
        enrollmentId,
        ecaId: enrollment.ecaId,
        studentId: enrollment.studentId
      });

      return updatedEnrollment;
    } catch (error) {
      logger.error('Error completing enrollment', { error, enrollmentId });
      throw error;
    }
  }

  /**
   * Update enrollment remarks
   * 
   * @param enrollmentId - Enrollment ID
   * @param remarks - New remarks
   * @param userId - User ID performing the update
   * @param req - Express request object
   * @returns Updated enrollment
   */
  async updateRemarks(
    enrollmentId: number,
    remarks: string,
    userId?: number,
    req?: Request
  ): Promise<ECAEnrollment> {
    try {
      const enrollment = await ecaEnrollmentRepository.update(
        enrollmentId,
        { remarks },
        userId,
        req
      );

      if (!enrollment) {
        throw new Error(`Enrollment with ID ${enrollmentId} not found`);
      }

      logger.info('Enrollment remarks updated', { enrollmentId });

      return enrollment;
    } catch (error) {
      logger.error('Error updating enrollment remarks', {
        error,
        enrollmentId
      });
      throw error;
    }
  }

  /**
   * Check if student can enroll in an ECA
   * Validates capacity and existing enrollment
   * 
   * @param ecaId - ECA ID
   * @param studentId - Student ID
   * @returns Validation result with message
   */
  async canEnroll(
    ecaId: number,
    studentId: number
  ): Promise<{ canEnroll: boolean; message?: string }> {
    try {
      // Check if ECA exists
      const eca = await ECA.findByPk(ecaId);
      if (!eca) {
        return { canEnroll: false, message: 'ECA not found' };
      }

      // Check if ECA is active
      if (eca.status !== 'active') {
        return { canEnroll: false, message: 'ECA is not active' };
      }

      // Check if already enrolled
      const isEnrolled = await ecaEnrollmentRepository.isStudentEnrolled(
        ecaId,
        studentId
      );

      if (isEnrolled) {
        return { canEnroll: false, message: 'Student is already enrolled' };
      }

      // Check capacity
      if (!eca.hasCapacity()) {
        return {
          canEnroll: false,
          message: `ECA has reached capacity (${eca.capacity})`
        };
      }

      return { canEnroll: true };
    } catch (error) {
      logger.error('Error checking enrollment eligibility', {
        error,
        ecaId,
        studentId
      });
      throw error;
    }
  }
}

export default new ECAEnrollmentService();
