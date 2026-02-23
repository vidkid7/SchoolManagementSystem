/**
 * Sports Enrollment Repository
 * Handles all database operations for SportsEnrollment entity
 * 
 * Features:
 * - Student enrollment in sports
 * - Team assignment tracking
 * - Practice session attendance tracking
 * - Comprehensive filtering and querying
 * 
 * Requirements: 12.3, 12.4
 */

import { Op, WhereOptions } from 'sequelize';
import SportsEnrollment, {
  SportsEnrollmentAttributes,
  SportsEnrollmentCreationAttributes
} from '@models/SportsEnrollment.model';
import Sport from '@models/Sport.model';
import Team from '@models/Team.model';
import { logger } from '@utils/logger';
import auditLogger from '@utils/auditLogger';
import { Request } from 'express';

class SportsEnrollmentRepository {
  /**
   * Create a new sports enrollment
   * @param enrollmentData - Enrollment creation data
   * @param userId - User ID who created the enrollment
   * @param req - Express request object for audit logging
   * @returns Created enrollment instance
   */
  async create(
    enrollmentData: SportsEnrollmentCreationAttributes,
    userId?: number,
    req?: Request
  ): Promise<SportsEnrollment> {
    try {
      const enrollment = await SportsEnrollment.create(enrollmentData);
      logger.info('Sports enrollment created', {
        enrollmentId: enrollment.enrollmentId,
        sportId: enrollment.sportId,
        studentId: enrollment.studentId,
        teamId: enrollment.teamId
      });

      // Log audit entry for create operation
      await auditLogger.logCreate(
        'sports_enrollment',
        enrollment.enrollmentId,
        enrollment.toJSON(),
        userId,
        req
      );

      return enrollment;
    } catch (error) {
      logger.error('Error creating sports enrollment', { error, enrollmentData });
      throw error;
    }
  }

  /**
   * Find enrollment by ID
   * @param enrollmentId - Enrollment ID
   * @returns Enrollment instance or null
   */
  async findById(enrollmentId: number): Promise<SportsEnrollment | null> {
    try {
      return await SportsEnrollment.findByPk(enrollmentId);
    } catch (error) {
      logger.error('Error finding enrollment by ID', { error, enrollmentId });
      throw error;
    }
  }

  /**
   * Find enrollment by sport and student
   * @param sportId - Sport ID
   * @param studentId - Student ID
   * @returns Enrollment instance or null
   */
  async findBySportAndStudent(
    sportId: number,
    studentId: number
  ): Promise<SportsEnrollment | null> {
    try {
      return await SportsEnrollment.findOne({
        where: { sportId, studentId, status: 'active' }
      });
    } catch (error) {
      logger.error('Error finding enrollment by sport and student', {
        error,
        sportId,
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
  ): Promise<SportsEnrollment[]> {
    try {
      const where: WhereOptions<SportsEnrollmentAttributes> = { studentId };

      if (status) {
        where.status = status;
      }

      return await SportsEnrollment.findAll({
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
   * Find all enrollments for a sport
   * @param sportId - Sport ID
   * @param status - Optional status filter
   * @returns Array of enrollments
   */
  async findBySport(
    sportId: number,
    status?: 'active' | 'withdrawn' | 'completed'
  ): Promise<SportsEnrollment[]> {
    try {
      const where: WhereOptions<SportsEnrollmentAttributes> = { sportId };

      if (status) {
        where.status = status;
      }

      return await SportsEnrollment.findAll({
        where,
        order: [['enrollmentDate', 'ASC']]
      });
    } catch (error) {
      logger.error('Error finding enrollments by sport', { error, sportId, status });
      throw error;
    }
  }

  /**
   * Find all enrollments for a team
   * @param teamId - Team ID
   * @param status - Optional status filter
   * @returns Array of enrollments
   */
  async findByTeam(
    teamId: number,
    status?: 'active' | 'withdrawn' | 'completed'
  ): Promise<SportsEnrollment[]> {
    try {
      const where: WhereOptions<SportsEnrollmentAttributes> = { teamId };

      if (status) {
        where.status = status;
      }

      return await SportsEnrollment.findAll({
        where,
        order: [['enrollmentDate', 'ASC']]
      });
    } catch (error) {
      logger.error('Error finding enrollments by team', { error, teamId, status });
      throw error;
    }
  }

  /**
   * Count active enrollments for a sport
   * @param sportId - Sport ID
   * @returns Number of active enrollments
   */
  async countActiveEnrollments(sportId: number): Promise<number> {
    try {
      return await SportsEnrollment.count({
        where: {
          sportId,
          status: 'active'
        }
      });
    } catch (error) {
      logger.error('Error counting active enrollments', { error, sportId });
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
      return await SportsEnrollment.count({
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
   * Check if student is already enrolled in a sport
   * @param sportId - Sport ID
   * @param studentId - Student ID
   * @param excludeEnrollmentId - Enrollment ID to exclude (for updates)
   * @returns True if enrolled, false otherwise
   */
  async isStudentEnrolled(
    sportId: number,
    studentId: number,
    excludeEnrollmentId?: number
  ): Promise<boolean> {
    try {
      const where: WhereOptions<SportsEnrollmentAttributes> = {
        sportId,
        studentId,
        status: 'active'
      };

      if (excludeEnrollmentId) {
        where.enrollmentId = { [Op.ne]: excludeEnrollmentId };
      }

      const count = await SportsEnrollment.count({ where });
      return count > 0;
    } catch (error) {
      logger.error('Error checking student enrollment', {
        error,
        sportId,
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
    updateData: Partial<SportsEnrollmentAttributes>,
    userId?: number,
    req?: Request
  ): Promise<SportsEnrollment | null> {
    try {
      const enrollment = await SportsEnrollment.findByPk(enrollmentId);

      if (!enrollment) {
        return null;
      }

      // Capture old value before update for audit logging
      const oldValue = enrollment.toJSON();

      await enrollment.update(updateData);
      logger.info('Sports enrollment updated', {
        enrollmentId,
        updatedFields: Object.keys(updateData)
      });

      // Capture new value after update
      const newValue = enrollment.toJSON();

      // Log audit entry for update operation
      await auditLogger.logUpdate(
        'sports_enrollment',
        enrollmentId,
        oldValue,
        newValue,
        userId,
        req
      );

      return enrollment;
    } catch (error) {
      logger.error('Error updating sports enrollment', {
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
  ): Promise<SportsEnrollment | null> {
    try {
      const updateData: Partial<SportsEnrollmentAttributes> = {
        status: 'withdrawn'
      };

      if (remarks) {
        updateData.remarks = remarks;
      }

      return await this.update(enrollmentId, updateData, userId, req);
    } catch (error) {
      logger.error('Error withdrawing sports enrollment', { error, enrollmentId });
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
  ): Promise<SportsEnrollment | null> {
    try {
      const enrollment = await SportsEnrollment.findByPk(enrollmentId);

      if (!enrollment) {
        return null;
      }

      if (present) {
        await enrollment.markAttendance();
      } else {
        await enrollment.markAbsent();
      }

      logger.info('Sports practice attendance marked', {
        enrollmentId,
        present,
        attendanceCount: enrollment.attendanceCount,
        totalSessions: enrollment.totalSessions
      });

      return enrollment;
    } catch (error) {
      logger.error('Error marking sports attendance', { error, enrollmentId, present });
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
      sportId?: number;
      studentId?: number;
      teamId?: number;
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
  ): Promise<{ enrollments: SportsEnrollment[]; total: number }> {
    try {
      const where: WhereOptions<SportsEnrollmentAttributes> = {};

      // Apply filters
      if (filters?.sportId) {
        where.sportId = filters.sportId;
      }

      if (filters?.studentId) {
        where.studentId = filters.studentId;
      }

      if (filters?.teamId) {
        where.teamId = filters.teamId;
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
      const { rows: enrollments, count: total } = await SportsEnrollment.findAndCountAll({
        where,
        limit,
        offset,
        order: [[orderBy, orderDirection]]
      });

      return { enrollments, total };
    } catch (error) {
      logger.error('Error finding all sports enrollments', { error, filters, options });
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
      sportId?: number;
      studentId?: number;
      teamId?: number;
      status?: 'active' | 'withdrawn' | 'completed';
    },
    page: number = 1,
    limit: number = 20
  ): Promise<{
    enrollments: SportsEnrollment[];
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
   * Get enrollment statistics for a sport
   * @param sportId - Sport ID
   * @returns Enrollment statistics
   */
  async getEnrollmentStats(sportId: number): Promise<{
    total: number;
    active: number;
    withdrawn: number;
    completed: number;
    averageAttendance: number;
  }> {
    try {
      const [total, active, withdrawn, completed, enrollments] = await Promise.all([
        SportsEnrollment.count({ where: { sportId } }),
        SportsEnrollment.count({ where: { sportId, status: 'active' } }),
        SportsEnrollment.count({ where: { sportId, status: 'withdrawn' } }),
        SportsEnrollment.count({ where: { sportId, status: 'completed' } }),
        SportsEnrollment.findAll({ where: { sportId } })
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
      logger.error('Error getting enrollment stats', { error, sportId });
      throw error;
    }
  }

  /**
   * Get student's sports participation summary
   * @param studentId - Student ID
   * @returns Participation summary
   */
  async getStudentParticipationSummary(studentId: number): Promise<{
    totalEnrollments: number;
    activeEnrollments: number;
    completedEnrollments: number;
    averageAttendance: number;
    sports: Array<{
      sportId: number;
      sportName: string;
      teamId?: number;
      teamName?: string;
      status: string;
      attendancePercentage: number;
    }>;
  }> {
    try {
      const enrollments = await SportsEnrollment.findAll({
        where: { studentId },
        include: [
          {
            model: Sport,
            as: 'sport',
            attributes: ['sportId', 'name']
          },
          {
            model: Team,
            as: 'team',
            attributes: ['teamId', 'name'],
            required: false
          }
        ]
      });

      const totalEnrollments = enrollments.length;
      const activeEnrollments = enrollments.filter(e => e.status === 'active').length;
      const completedEnrollments = enrollments.filter(e => e.status === 'completed').length;

      // Calculate average attendance
      let totalAttendancePercentage = 0;
      let enrollmentsWithSessions = 0;

      const sports = enrollments.map(enrollment => {
        const attendancePercentage = enrollment.getAttendancePercentage();

        if (enrollment.totalSessions > 0) {
          totalAttendancePercentage += attendancePercentage;
          enrollmentsWithSessions++;
        }

        return {
          sportId: enrollment.sportId,
          sportName: (enrollment as any).sport?.name || 'Unknown',
          teamId: enrollment.teamId,
          teamName: (enrollment as any).team?.name,
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
        sports
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

export default new SportsEnrollmentRepository();
