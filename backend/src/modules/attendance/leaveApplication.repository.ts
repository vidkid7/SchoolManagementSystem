import { Op, WhereOptions } from 'sequelize';
import LeaveApplication, {
  LeaveStatus,
  LeaveApplicationAttributes,
  LeaveApplicationCreationAttributes
} from '@models/LeaveApplication.model';
import { logger } from '@utils/logger';
import auditLogger from '@utils/auditLogger';
import { Request } from 'express';

/**
 * Leave Application Repository
 * Handles all database operations for LeaveApplication entity
 * 
 * Features:
 * - Leave application CRUD operations
 * - Approval workflow support
 * - Comprehensive filtering and querying
 * - Audit trail for all operations
 * 
 * Requirements: 6.11, 6.12
 */
class LeaveApplicationRepository {
  /**
   * Create a new leave application
   * @param leaveData - Leave application creation data
   * @param userId - User ID who created the record
   * @param req - Express request object for audit logging
   * @returns Created leave application instance
   */
  async create(
    leaveData: LeaveApplicationCreationAttributes,
    userId?: number,
    req?: Request
  ): Promise<LeaveApplication> {
    try {
      const leave = await LeaveApplication.create(leaveData);
      logger.info('Leave application created', {
        leaveId: leave.leaveId,
        studentId: leave.studentId,
        startDate: leave.startDate,
        endDate: leave.endDate,
        status: leave.status
      });

      // Log audit entry for create operation
      await auditLogger.logCreate(
        'leave_application',
        leave.leaveId,
        leave.toJSON(),
        userId,
        req
      );

      return leave;
    } catch (error) {
      logger.error('Error creating leave application', { error, leaveData });
      throw error;
    }
  }

  /**
   * Find leave application by ID
   * @param leaveId - Leave application ID
   * @returns Leave application instance or null
   */
  async findById(leaveId: number): Promise<LeaveApplication | null> {
    try {
      return await LeaveApplication.findByPk(leaveId);
    } catch (error) {
      logger.error('Error finding leave application by ID', { error, leaveId });
      throw error;
    }
  }

  /**
   * Find all leave applications with optional filters and pagination
   * @param filters - Optional filters
   * @param options - Pagination and sorting options
   * @returns Array of leave applications and total count
   */
  async findAll(
    filters?: {
      studentId?: number;
      status?: LeaveStatus;
      appliedBy?: number;
      approvedBy?: number;
      dateFrom?: Date;
      dateTo?: Date;
    },
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<{ records: LeaveApplication[]; total: number }> {
    try {
      const where: WhereOptions<LeaveApplicationAttributes> = {};

      // Apply filters
      if (filters?.studentId) {
        where.studentId = filters.studentId;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.appliedBy) {
        where.appliedBy = filters.appliedBy;
      }

      if (filters?.approvedBy) {
        where.approvedBy = filters.approvedBy;
      }

      // Date range filter (for leave dates)
      if (filters?.dateFrom || filters?.dateTo) {
        const dateFilter: any = {};
        if (filters.dateFrom) {
          dateFilter[Op.gte] = filters.dateFrom;
        }
        if (filters.dateTo) {
          dateFilter[Op.lte] = filters.dateTo;
        }
        where.startDate = dateFilter;
      }

      // Set pagination defaults (default 20, max 100)
      const limit = Math.min(options?.limit || 20, 100);
      const offset = options?.offset || 0;
      const orderBy = options?.orderBy || 'appliedAt';
      const orderDirection = options?.orderDirection || 'DESC';

      // Execute query with parameterized filters
      const { rows: records, count: total } = await LeaveApplication.findAndCountAll({
        where,
        limit,
        offset,
        order: [[orderBy, orderDirection]]
      });

      return { records, total };
    } catch (error) {
      logger.error('Error finding all leave applications', { error, filters, options });
      throw error;
    }
  }

  /**
   * Find pending leave applications
   * @param studentId - Optional student ID filter
   * @param limit - Maximum number of records to return
   * @returns Array of pending leave applications
   */
  async findPending(studentId?: number, limit: number = 100): Promise<LeaveApplication[]> {
    try {
      const where: WhereOptions<LeaveApplicationAttributes> = {
        status: LeaveStatus.PENDING
      };

      if (studentId) {
        where.studentId = studentId;
      }

      return await LeaveApplication.findAll({
        where,
        limit,
        order: [['appliedAt', 'ASC']],
        include: [
          {
            model: require('@models/Student.model').default,
            as: 'student',
            attributes: ['studentId', 'firstNameEn', 'middleNameEn', 'lastNameEn', 'studentCode']
          }
        ]
      });
    } catch (error) {
      logger.error('Error finding pending leave applications', { error, studentId, limit });
      throw error;
    }
  }

  /**
   * Find leave applications by status
   * @param status - Leave status filter
   * @param limit - Maximum number of records to return
   * @returns Array of leave applications
   */
  async findByStatus(status: LeaveStatus, limit: number = 100): Promise<LeaveApplication[]> {
    try {
      return await LeaveApplication.findAll({
        where: { status },
        limit,
        order: [['appliedAt', 'DESC']],
        include: [
          {
            model: require('@models/Student.model').default,
            as: 'student',
            attributes: ['studentId', 'firstNameEn', 'middleNameEn', 'lastNameEn', 'studentCode']
          }
        ]
      });
    } catch (error) {
      logger.error('Error finding leave applications by status', { error, status, limit });
      throw error;
    }
  }

  /**
   * Find leave applications by student ID
   * @param studentId - Student ID
   * @param status - Optional status filter
   * @returns Array of leave applications
   */
  async findByStudent(
    studentId: number,
    status?: LeaveStatus
  ): Promise<LeaveApplication[]> {
    try {
      const where: WhereOptions<LeaveApplicationAttributes> = { studentId };

      if (status) {
        where.status = status;
      }

      return await LeaveApplication.findAll({
        where,
        order: [['appliedAt', 'DESC']]
      });
    } catch (error) {
      logger.error('Error finding leave applications by student', {
        error,
        studentId,
        status
      });
      throw error;
    }
  }

  /**
   * Find leave applications that overlap with a date range
   * @param studentId - Student ID
   * @param startDate - Start date
   * @param endDate - End date
   * @param status - Optional status filter (default: approved)
   * @returns Array of overlapping leave applications
   */
  async findOverlapping(
    studentId: number,
    startDate: Date,
    endDate: Date,
    status: LeaveStatus = LeaveStatus.APPROVED
  ): Promise<LeaveApplication[]> {
    try {
      return await LeaveApplication.findAll({
        where: {
          studentId,
          status,
          [Op.or]: [
            {
              // Leave starts within the range
              startDate: {
                [Op.between]: [startDate, endDate]
              }
            },
            {
              // Leave ends within the range
              endDate: {
                [Op.between]: [startDate, endDate]
              }
            },
            {
              // Leave spans the entire range
              [Op.and]: [
                { startDate: { [Op.lte]: startDate } },
                { endDate: { [Op.gte]: endDate } }
              ]
            }
          ]
        },
        order: [['startDate', 'ASC']]
      });
    } catch (error) {
      logger.error('Error finding overlapping leave applications', {
        error,
        studentId,
        startDate,
        endDate,
        status
      });
      throw error;
    }
  }

  /**
   * Update leave application by ID
   * @param leaveId - Leave application ID
   * @param updateData - Data to update
   * @param userId - User ID who updated the record
   * @param req - Express request object for audit logging
   * @returns Updated leave application instance or null
   */
  async update(
    leaveId: number,
    updateData: Partial<LeaveApplicationAttributes>,
    userId?: number,
    req?: Request
  ): Promise<LeaveApplication | null> {
    try {
      const leave = await LeaveApplication.findByPk(leaveId);

      if (!leave) {
        return null;
      }

      // Capture old value before update for audit logging
      const oldValue = leave.toJSON();

      await leave.update(updateData);
      logger.info('Leave application updated', {
        leaveId,
        updatedFields: Object.keys(updateData)
      });

      // Capture new value after update
      const newValue = leave.toJSON();

      // Log audit entry for update operation
      await auditLogger.logUpdate(
        'leave_application',
        leaveId,
        oldValue,
        newValue,
        userId,
        req
      );

      return leave;
    } catch (error) {
      logger.error('Error updating leave application', { error, leaveId, updateData });
      throw error;
    }
  }

  /**
   * Delete leave application by ID (soft delete)
   * @param leaveId - Leave application ID
   * @param userId - User ID who deleted the record
   * @param req - Express request object for audit logging
   * @returns True if deleted, false if not found
   */
  async delete(leaveId: number, userId?: number, req?: Request): Promise<boolean> {
    try {
      const leave = await LeaveApplication.findByPk(leaveId);

      if (!leave) {
        return false;
      }

      // Capture old value before deletion for audit logging
      const oldValue = leave.toJSON();

      await leave.destroy(); // Soft delete due to paranoid mode
      logger.info('Leave application soft deleted', { leaveId });

      // Log audit entry for delete operation
      await auditLogger.logDelete(
        'leave_application',
        leaveId,
        oldValue,
        userId,
        req
      );

      return true;
    } catch (error) {
      logger.error('Error deleting leave application', { error, leaveId });
      throw error;
    }
  }

  /**
   * Get leave applications with pagination metadata
   * @param filters - Optional filters
   * @param page - Page number (1-indexed)
   * @param limit - Items per page (default 20, max 100)
   * @returns Leave applications with pagination metadata
   */
  async findWithPagination(
    filters?: {
      studentId?: number;
      status?: LeaveStatus;
      dateFrom?: Date;
      dateTo?: Date;
    },
    page: number = 1,
    limit: number = 20
  ): Promise<{
    records: LeaveApplication[];
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

      const { records, total } = await this.findAll(filters, {
        limit: safeLimit,
        offset
      });

      return {
        records,
        pagination: {
          page,
          limit: safeLimit,
          total,
          totalPages: Math.ceil(total / safeLimit)
        }
      };
    } catch (error) {
      logger.error('Error finding leave applications with pagination', {
        error,
        filters,
        page,
        limit
      });
      throw error;
    }
  }

  /**
   * Count leave applications by status for a student
   * @param studentId - Student ID
   * @param dateFrom - Start date (optional)
   * @param dateTo - End date (optional)
   * @returns Object with counts by status
   */
  async countByStatusForStudent(
    studentId: number,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<{
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  }> {
    try {
      const where: WhereOptions<LeaveApplicationAttributes> = { studentId };

      if (dateFrom || dateTo) {
        const dateFilter: any = {};
        if (dateFrom) {
          dateFilter[Op.gte] = dateFrom;
        }
        if (dateTo) {
          dateFilter[Op.lte] = dateTo;
        }
        where.startDate = dateFilter;
      }

      const [pending, approved, rejected, total] = await Promise.all([
        LeaveApplication.count({ where: { ...where, status: LeaveStatus.PENDING } }),
        LeaveApplication.count({ where: { ...where, status: LeaveStatus.APPROVED } }),
        LeaveApplication.count({ where: { ...where, status: LeaveStatus.REJECTED } }),
        LeaveApplication.count({ where })
      ]);

      return { pending, approved, rejected, total };
    } catch (error) {
      logger.error('Error counting leave applications by status for student', {
        error,
        studentId,
        dateFrom,
        dateTo
      });
      throw error;
    }
  }
}

export default new LeaveApplicationRepository();
