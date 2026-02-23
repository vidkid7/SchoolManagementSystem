/**
 * ECA Enrollment Repository
 * Handles all database operations for ECAEnrollment entity
 * 
 * Features:
 * - Student enrollment in multiple ECAs
 * - Capacity checking before enrollment
 * - Participation and attendance tracking
 * - Comprehensive filtering and querying
 * 
 * Requirements: 11.3, 11.4
 */

import { Op, WhereOptions } from 'sequelize';
import ECAEnrollment, {
  ECAEnrollmentAttributes,
  ECAEnrollmentCreationAttributes
} from '@models/ECAEnrollment.model';
import ECA from '@models/ECA.model';
import { logger } from '@utils/logger';
import auditLogger from '@utils/auditLogger';
import { Request } from 'express';

class ECAEnrollmentRepository {
  /**
   * Create a new ECA enrollment
   * @param enrollmentData - Enrollment creation data
   * @param userId - User ID who created the enrollment
   * @param req - Express request object for audit logging
   * @returns Created enrollment instance
   */
  async create(
    enrollmentData: ECAEnrollmentCreationAttributes,
    userId?: number,
    req?: Request
  ): Promise<ECAEnrollment> {
    try {
      const enrollment = await ECAEnrollment.create(enrollmentData);
      logger.info('ECA enrollment created', {
        enrollmentId: enrollment.enrollmentId,
        ecaId: enrollment.ecaId,
        studentId: enrollment.studentId
      });

      // Log audit entry for create operation
      await auditLogger.logCreate(
        'eca_enrollment',
        enrollment.enrollmentId,
        enrollment.toJSON(),
        userId,
        req
      );

      return enrollment;
    } catch (error) {
      logger.error('Error creating ECA enrollment', { error, enrollmentData });
      throw error;
    }
  }

  /**
   * Find enrollment by ID
   * @param enrollmentId - Enrollment ID
   * @returns Enrollment instance or null
   */
  async findById(enrollmentId: number): Promise<ECAEnrollment | null> {
    try {
      return await ECAEnrollment.findByPk(enrollmentId);
    } catch (error) {
      logger.error('Error finding enrollment by ID', { error, enrollmentId });
      throw error;
    }
  }

  /**
   * Find enrollment by ECA and student
   * @param ecaId - ECA ID
   * @param studentId - Student ID
   * @returns Enrollment instance or null
   */
  async findByEcaAndStudent(
    ecaId: number,
    studentId: number
  ): Promise<ECAEnrollment | null> {
    try {
      return await ECAEnrollment.findOne({
        where: { ecaId, studentId }
      });
    } catch (error) {
      logger.error('Error finding enrollment by ECA and student', {
        error,
        ecaId,
        studentId
      });
      throw error;
    }
  }

  /**
   * Find all enrollments for a student
   * @param studentId - Student ID
   * @param status - Optional status filter
   * @returns Array of enrollments
   */
  async findByStudent(
    studentId: number,
    status?: 'active' | 'withdrawn' | 'completed'
  ): Promise<ECAEnrollment[]> {
    try {
      const where: WhereOptions<ECAEnrollmentAttributes> = { studentId };

      if (status) {
        where.status = status;
      }

      return await ECAEnrollment.findAll({
        where,
        order: [['enrollmentDate', 'DESC']]
      });
    } catch (error) {
      logger.error('Error finding enrollments by student', {
        error,
        studentId,
        status
      });
      throw error;
    }
  }

  /**
   * Find all enrollments for an ECA
   * @param ecaId - ECA ID
   * @param status - Optional status filter
   * @returns Array of enrollments
   */
  async findByEca(
    ecaId: number,
    status?: 'active' | 'withdrawn' | 'completed'
  ): Promise<ECAEnrollment[]> {
    try {
      const where: WhereOptions<ECAEnrollmentAttributes> = { ecaId };

      if (status) {
        where.status = status;
      }

      return await ECAEnrollment.findAll({
        where,
        order: [['enrollmentDate', 'ASC']]
      });
    } catch (error) {
      logger.error('Error finding enrollments by ECA', { error, ecaId, status });
      throw error;
    }
  }

  /**
   * Count active enrollments for an ECA
   * @param ecaId - ECA ID
   * @returns Number of active enrollments
   */
  async countActiveEnrollments(ecaId: number): Promise<number> {
    try {
      return await ECAEnrollment.count({
        where: {
          ecaId,
          status: 'active'
        }
      });
    } catch (error) {
      logger.error('Error counting active enrollments', { error, ecaId });
      throw error;
    }
  }

  /**
   * Count active enrollments for a student
   * @param studentId - Student ID
   * @returns Number of active enrollments
   */
  async countActiveEnrollmentsForStudent(studentId: number): Promise<number> {
    try {
      return await ECAEnrollment.count({
        where: {
          studentId,
          status: 'active'
        }
      });
    } catch (error) {
      logger.error('Error counting active enrollments for student', {
        error,
        studentId
      });
      throw error;
    }
  }

  /**
   * Check if student is already enrolled in an ECA
   * @param ecaId - ECA ID
   * @param studentId - Student ID
   * @param excludeEnrollmentId - Enrollment ID to exclude (for updates)
   * @returns True if enrolled, false otherwise
   */
  async isStudentEnrolled(
    ecaId: number,
    studentId: number,
    excludeEnrollmentId?: number
  ): Promise<boolean> {
    try {
      const where: WhereOptions<ECAEnrollmentAttributes> = {
        ecaId,
        studentId,
        status: 'active'
      };

      if (excludeEnrollmentId) {
        where.enrollmentId = { [Op.ne]: excludeEnrollmentId };
      }

      const count = await ECAEnrollment.count({ where });
      return count > 0;
    } catch (error) {
      logger.error('Error checking student enrollment', {
        error,
        ecaId,
        studentId
      });
      throw error;
    }
  }

  /**
   * Update enrollment by ID
   * @param enrollmentId - Enrollment ID
   * @param updateData - Data to update
   * @param userId - User ID who updated the enrollment
   * @param req - Express request object for audit logging
   * @returns Updated enrollment instance or null
   */
  async update(
    enrollmentId: number,
    updateData: Partial<ECAEnrollmentAttributes>,
    userId?: number,
    req?: Request
  ): Promise<ECAEnrollment | null> {
    try {
      const enrollment = await ECAEnrollment.findByPk(enrollmentId);

      if (!enrollment) {
        return null;
      }

      // Capture old value before update for audit logging
      const oldValue = enrollment.toJSON();

      await enrollment.update(updateData);
      logger.info('ECA enrollment updated', {
        enrollmentId,
        updatedFields: Object.keys(updateData)
      });

      // Capture new value after update
      const newValue = enrollment.toJSON();

      // Log audit entry for update operation
      await auditLogger.logUpdate(
        'eca_enrollment',
        enrollmentId,
        oldValue,
        newValue,
        userId,
        req
      );

      return enrollment;
    } catch (error) {
      logger.error('Error updating ECA enrollment', {
        error,
        enrollmentId,
        updateData
      });
      throw error;
    }
  }

  /**
   * Withdraw enrollment (set status to withdrawn)
   * @param enrollmentId - Enrollment ID
   * @param remarks - Withdrawal remarks
   * @param userId - User ID who withdrew the enrollment
   * @param req - Express request object for audit logging
   * @returns Updated enrollment instance or null
   */
  async withdraw(
    enrollmentId: number,
    remarks?: string,
    userId?: number,
    req?: Request
  ): Promise<ECAEnrollment | null> {
    try {
      const updateData: Partial<ECAEnrollmentAttributes> = {
        status: 'withdrawn'
      };

      if (remarks) {
        updateData.remarks = remarks;
      }

      return await this.update(enrollmentId, updateData, userId, req);
    } catch (error) {
      logger.error('Error withdrawing ECA enrollment', { error, enrollmentId });
      throw error;
    }
  }

  /**
   * Mark attendance for an enrollment
   * @param enrollmentId - Enrollment ID
   * @param present - Whether student was present
   * @returns Updated enrollment instance or null
   */
  async markAttendance(
    enrollmentId: number,
    present: boolean
  ): Promise<ECAEnrollment | null> {
    try {
      const enrollment = await ECAEnrollment.findByPk(enrollmentId);

      if (!enrollment) {
        return null;
      }

      if (present) {
        await enrollment.markAttendance();
      } else {
        await enrollment.markAbsent();
      }

      logger.info('ECA attendance marked', {
        enrollmentId,
        present,
        attendanceCount: enrollment.attendanceCount,
        totalSessions: enrollment.totalSessions
      });

      return enrollment;
    } catch (error) {
      logger.error('Error marking ECA attendance', { error, enrollmentId, present });
      throw error;
    }
  }

  /**
   * Find all enrollments with optional filters and pagination
   * @param filters - Optional filters
   * @param options - Pagination and sorting options
   * @returns Array of enrollments and total count
   */
  async findAll(
    filters?: {
      ecaId?: number;
      studentId?: number;
      status?: 'active' | 'withdrawn' | 'completed';
      enrollmentDateFrom?: Date;
      enrollmentDateTo?: Date;
    },
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<{ enrollments: ECAEnrollment[]; total: number }> {
    try {
      const where: WhereOptions<ECAEnrollmentAttributes> = {};

      // Apply filters
      if (filters?.ecaId) {
        where.ecaId = filters.ecaId;
      }

      if (filters?.studentId) {
        where.studentId = filters.studentId;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      // Date range filter
      if (filters?.enrollmentDateFrom || filters?.enrollmentDateTo) {
        const dateFilter: any = {};
        if (filters.enrollmentDateFrom) {
          dateFilter[Op.gte] = filters.enrollmentDateFrom;
        }
        if (filters.enrollmentDateTo) {
          dateFilter[Op.lte] = filters.enrollmentDateTo;
        }
        where.enrollmentDate = dateFilter;
      }

      // Set pagination defaults (default 20, max 100)
      const limit = Math.min(options?.limit || 20, 100);
      const offset = options?.offset || 0;
      const orderBy = options?.orderBy || 'enrollmentDate';
      const orderDirection = options?.orderDirection || 'DESC';

      // Execute query with parameterized filters
      const { rows: enrollments, count: total } = await ECAEnrollment.findAndCountAll({
        where,
        limit,
        offset,
        order: [[orderBy, orderDirection]]
      });

      return { enrollments, total };
    } catch (error) {
      logger.error('Error finding all ECA enrollments', { error, filters, options });
      throw error;
    }
  }

  /**
   * Get enrollments with pagination metadata
   * @param filters - Optional filters
   * @param page - Page number (1-indexed)
   * @param limit - Items per page (default 20, max 100)
   * @returns Enrollments with pagination metadata
   */
  async findWithPagination(
    filters?: {
      ecaId?: number;
      studentId?: number;
      status?: 'active' | 'withdrawn' | 'completed';
    },
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
      // Ensure limit doesn't exceed max
      const safeLimit = Math.min(limit, 100);
      const offset = (page - 1) * safeLimit;

      const { enrollments, total } = await this.findAll(filters, {
        limit: safeLimit,
        offset
      });

      return {
        enrollments,
        pagination: {
          page,
          limit: safeLimit,
          total,
          totalPages: Math.ceil(total / safeLimit)
        }
      };
    } catch (error) {
      logger.error('Error finding enrollments with pagination', {
        error,
        filters,
        page,
        limit
      });
      throw error;
    }
  }

  /**
   * Get enrollment statistics for an ECA
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
      const [total, active, withdrawn, completed, enrollments] = await Promise.all([
        ECAEnrollment.count({ where: { ecaId } }),
        ECAEnrollment.count({ where: { ecaId, status: 'active' } }),
        ECAEnrollment.count({ where: { ecaId, status: 'withdrawn' } }),
        ECAEnrollment.count({ where: { ecaId, status: 'completed' } }),
        ECAEnrollment.findAll({ where: { ecaId } })
      ]);

      // Calculate average attendance percentage
      let totalAttendancePercentage = 0;
      let enrollmentsWithSessions = 0;

      for (const enrollment of enrollments) {
        if (enrollment.totalSessions > 0) {
          totalAttendancePercentage += enrollment.getAttendancePercentage();
          enrollmentsWithSessions++;
        }
      }

      const averageAttendance =
        enrollmentsWithSessions > 0
          ? Math.round((totalAttendancePercentage / enrollmentsWithSessions) * 100) / 100
          : 0;

      return {
        total,
        active,
        withdrawn,
        completed,
        averageAttendance
      };
    } catch (error) {
      logger.error('Error getting enrollment stats', { error, ecaId });
      throw error;
    }
  }

  /**
   * Get student's ECA participation summary
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
      const enrollments = await ECAEnrollment.findAll({
        where: { studentId },
        include: [
          {
            model: ECA,
            as: 'eca',
            attributes: ['ecaId', 'name']
          }
        ]
      });

      const totalEnrollments = enrollments.length;
      const activeEnrollments = enrollments.filter(e => e.status === 'active').length;
      const completedEnrollments = enrollments.filter(e => e.status === 'completed').length;

      // Calculate average attendance
      let totalAttendancePercentage = 0;
      let enrollmentsWithSessions = 0;

      const ecas = enrollments.map(enrollment => {
        const attendancePercentage = enrollment.getAttendancePercentage();

        if (enrollment.totalSessions > 0) {
          totalAttendancePercentage += attendancePercentage;
          enrollmentsWithSessions++;
        }

        return {
          ecaId: enrollment.ecaId,
          ecaName: (enrollment as any).eca?.name || 'Unknown',
          status: enrollment.status,
          attendancePercentage
        };
      });

      const averageAttendance =
        enrollmentsWithSessions > 0
          ? Math.round((totalAttendancePercentage / enrollmentsWithSessions) * 100) / 100
          : 0;

      return {
        totalEnrollments,
        activeEnrollments,
        completedEnrollments,
        averageAttendance,
        ecas
      };
    } catch (error) {
      logger.error('Error getting student participation summary', {
        error,
        studentId
      });
      throw error;
    }
  }
}

export default new ECAEnrollmentRepository();
