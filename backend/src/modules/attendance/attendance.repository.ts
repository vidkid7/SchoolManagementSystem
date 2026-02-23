import { Op, WhereOptions } from 'sequelize';
import AttendanceRecord, { 
  AttendanceStatus, 
  SyncStatus, 
  AttendanceRecordAttributes, 
  AttendanceRecordCreationAttributes 
} from '@models/AttendanceRecord.model';
import { logger } from '@utils/logger';
import auditLogger from '@utils/auditLogger';
import { Request } from 'express';

/**
 * Attendance Repository
 * Handles all database operations for AttendanceRecord entity
 * 
 * Features:
 * - Period-wise and day-wise attendance support
 * - Offline sync capabilities
 * - Audit trail for all operations
 * - Comprehensive filtering and querying
 * 
 * Requirements: 6.1, 6.2, 6.14, 28.1
 */
class AttendanceRepository {
  /**
   * Create a new attendance record
   * @param attendanceData - Attendance creation data
   * @param userId - User ID who created the record
   * @param req - Express request object for audit logging
   * @returns Created attendance record instance
   */
  async create(
    attendanceData: AttendanceRecordCreationAttributes,
    userId?: number,
    req?: Request
  ): Promise<AttendanceRecord> {
    try {
      const attendance = await AttendanceRecord.create(attendanceData);
      logger.info('Attendance record created', {
        attendanceId: attendance.attendanceId,
        studentId: attendance.studentId,
        date: attendance.date,
        status: attendance.status
      });

      // Log audit entry for create operation
      await auditLogger.logCreate(
        'attendance',
        attendance.attendanceId,
        attendance.toJSON(),
        userId,
        req
      );

      return attendance;
    } catch (error) {
      logger.error('Error creating attendance record', { error, attendanceData });
      throw error;
    }
  }

  /**
   * Find attendance record by ID
   * @param attendanceId - Attendance ID
   * @returns Attendance record instance or null
   */
  async findById(attendanceId: number): Promise<AttendanceRecord | null> {
    try {
      return await AttendanceRecord.findByPk(attendanceId);
    } catch (error) {
      logger.error('Error finding attendance by ID', { error, attendanceId });
      throw error;
    }
  }

  /**
   * Find attendance record for a specific student on a specific date
   * @param studentId - Student ID
   * @param date - Date
   * @param periodNumber - Period number (optional, for period-wise attendance)
   * @returns Attendance record instance or null
   */
  async findByStudentAndDate(
    studentId: number,
    date: Date,
    periodNumber?: number
  ): Promise<AttendanceRecord | null> {
    try {
      const where: WhereOptions<AttendanceRecordAttributes> = {
        studentId,
        date
      };

      if (periodNumber !== undefined) {
        where.periodNumber = periodNumber;
      }

      return await AttendanceRecord.findOne({ where });
    } catch (error) {
      logger.error('Error finding attendance by student and date', {
        error,
        studentId,
        date,
        periodNumber
      });
      throw error;
    }
  }

  /**
   * Find all attendance records for a class on a specific date
   * @param classId - Class ID
   * @param date - Date
   * @param periodNumber - Period number (optional, for period-wise attendance)
   * @returns Array of attendance records
   */
  async findByClassAndDate(
    classId: number,
    date: Date,
    periodNumber?: number
  ): Promise<AttendanceRecord[]> {
    try {
      const where: WhereOptions<AttendanceRecordAttributes> = {
        classId,
        date
      };

      if (periodNumber !== undefined) {
        where.periodNumber = periodNumber;
      }

      return await AttendanceRecord.findAll({
        where,
        order: [['studentId', 'ASC']]
      });
    } catch (error) {
      logger.error('Error finding attendance by class and date', {
        error,
        classId,
        date,
        periodNumber
      });
      throw error;
    }
  }

  /**
   * Find all attendance records with optional filters and pagination
   * @param filters - Optional filters
   * @param options - Pagination and sorting options
   * @returns Array of attendance records and total count
   */
  // eslint-disable-next-line max-lines-per-function
  async findAll(
    filters?: {
      studentId?: number;
      classId?: number;
      status?: AttendanceStatus;
      syncStatus?: SyncStatus;
      dateFrom?: Date;
      dateTo?: Date;
      periodNumber?: number;
      markedBy?: number;
    },
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<{ records: AttendanceRecord[]; total: number }> {
    try {
      const where: WhereOptions<AttendanceRecordAttributes> = {};

      // Apply filters
      if (filters?.studentId) {
        where.studentId = filters.studentId;
      }

      if (filters?.classId) {
        where.classId = filters.classId;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.syncStatus) {
        where.syncStatus = filters.syncStatus;
      }

      if (filters?.periodNumber !== undefined) {
        where.periodNumber = filters.periodNumber;
      }

      if (filters?.markedBy) {
        where.markedBy = filters.markedBy;
      }

      // Date range filter
      if (filters?.dateFrom || filters?.dateTo) {
        const dateFilter: any = {};
        if (filters.dateFrom) {
          dateFilter[Op.gte] = filters.dateFrom;
        }
        if (filters.dateTo) {
          dateFilter[Op.lte] = filters.dateTo;
        }
        where.date = dateFilter;
      }

      // Set pagination defaults (default 20, max 100)
      const limit = Math.min(options?.limit || 20, 100);
      const offset = options?.offset || 0;
      const orderBy = options?.orderBy || 'date';
      const orderDirection = options?.orderDirection || 'DESC';

      // Execute query with parameterized filters
      const { rows: records, count: total } = await AttendanceRecord.findAndCountAll({
        where,
        limit,
        offset,
        order: [[orderBy, orderDirection]]
      });

      return { records, total };
    } catch (error) {
      logger.error('Error finding all attendance records', { error, filters, options });
      throw error;
    }
  }

  /**
   * Update attendance record by ID
   * @param attendanceId - Attendance ID
   * @param updateData - Data to update
   * @param userId - User ID who updated the record
   * @param req - Express request object for audit logging
   * @returns Updated attendance record instance or null
   */
  async update(
    attendanceId: number,
    updateData: Partial<AttendanceRecordAttributes>,
    userId?: number,
    req?: Request
  ): Promise<AttendanceRecord | null> {
    try {
      const attendance = await AttendanceRecord.findByPk(attendanceId);

      if (!attendance) {
        return null;
      }

      // Capture old value before update for audit logging
      const oldValue = attendance.toJSON();

      await attendance.update(updateData);
      logger.info('Attendance record updated', {
        attendanceId,
        updatedFields: Object.keys(updateData)
      });

      // Capture new value after update
      const newValue = attendance.toJSON();

      // Log audit entry for update operation
      await auditLogger.logUpdate(
        'attendance',
        attendanceId,
        oldValue,
        newValue,
        userId,
        req
      );

      return attendance;
    } catch (error) {
      logger.error('Error updating attendance record', { error, attendanceId, updateData });
      throw error;
    }
  }

  /**
   * Delete attendance record by ID (soft delete)
   * @param attendanceId - Attendance ID
   * @param userId - User ID who deleted the record
   * @param req - Express request object for audit logging
   * @returns True if deleted, false if not found
   */
  async delete(attendanceId: number, userId?: number, req?: Request): Promise<boolean> {
    try {
      const attendance = await AttendanceRecord.findByPk(attendanceId);

      if (!attendance) {
        return false;
      }

      // Capture old value before deletion for audit logging
      const oldValue = attendance.toJSON();

      await attendance.destroy(); // Soft delete due to paranoid mode
      logger.info('Attendance record soft deleted', { attendanceId });

      // Log audit entry for delete operation
      await auditLogger.logDelete(
        'attendance',
        attendanceId,
        oldValue,
        userId,
        req
      );

      return true;
    } catch (error) {
      logger.error('Error deleting attendance record', { error, attendanceId });
      throw error;
    }
  }

  /**
   * Bulk create attendance records
   * @param recordsData - Array of attendance creation data
   * @param userId - User ID who created the records
   * @param req - Express request object for audit logging
   * @returns Array of created attendance records
   */
  async bulkCreate(
    recordsData: AttendanceRecordCreationAttributes[],
    userId?: number,
    req?: Request
  ): Promise<AttendanceRecord[]> {
    try {
      const records = await AttendanceRecord.bulkCreate(recordsData, {
        validate: true,
        individualHooks: true
      });

      logger.info('Bulk attendance records created', { count: records.length });

      // Log audit entries for bulk create
      for (const record of records) {
        await auditLogger.logCreate(
          'attendance',
          record.attendanceId,
          record.toJSON(),
          userId,
          req
        );
      }

      return records;
    } catch (error) {
      logger.error('Error bulk creating attendance records', {
        error,
        count: recordsData.length
      });
      throw error;
    }
  }

  /**
   * Find attendance records by student ID for a date range
   * @param studentId - Student ID
   * @param dateFrom - Start date
   * @param dateTo - End date
   * @returns Array of attendance records
   */
  async findByStudentAndDateRange(
    studentId: number,
    dateFrom: Date,
    dateTo: Date
  ): Promise<AttendanceRecord[]> {
    try {
      return await AttendanceRecord.findAll({
        where: {
          studentId,
          date: {
            [Op.gte]: dateFrom,
            [Op.lte]: dateTo
          }
        },
        order: [['date', 'ASC']]
      });
    } catch (error) {
      logger.error('Error finding attendance by student and date range', {
        error,
        studentId,
        dateFrom,
        dateTo
      });
      throw error;
    }
  }

  /**
   * Find attendance records by class ID for a date range
   * @param classId - Class ID
   * @param dateFrom - Start date
   * @param dateTo - End date
   * @returns Array of attendance records
   */
  async findByClassAndDateRange(
    classId: number,
    dateFrom: Date,
    dateTo: Date
  ): Promise<AttendanceRecord[]> {
    try {
      return await AttendanceRecord.findAll({
        where: {
          classId,
          date: {
            [Op.gte]: dateFrom,
            [Op.lte]: dateTo
          }
        },
        order: [['date', 'ASC'], ['studentId', 'ASC']]
      });
    } catch (error) {
      logger.error('Error finding attendance by class and date range', {
        error,
        classId,
        dateFrom,
        dateTo
      });
      throw error;
    }
  }

  /**
   * Count attendance records by status for a student
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
    present: number;
    absent: number;
    late: number;
    excused: number;
    total: number;
  }> {
    try {
      const where: WhereOptions<AttendanceRecordAttributes> = { studentId };

      if (dateFrom || dateTo) {
        const dateFilter: any = {};
        if (dateFrom) {
          dateFilter[Op.gte] = dateFrom;
        }
        if (dateTo) {
          dateFilter[Op.lte] = dateTo;
        }
        where.date = dateFilter;
      }

      const [present, absent, late, excused, total] = await Promise.all([
        AttendanceRecord.count({ where: { ...where, status: AttendanceStatus.PRESENT } }),
        AttendanceRecord.count({ where: { ...where, status: AttendanceStatus.ABSENT } }),
        AttendanceRecord.count({ where: { ...where, status: AttendanceStatus.LATE } }),
        AttendanceRecord.count({ where: { ...where, status: AttendanceStatus.EXCUSED } }),
        AttendanceRecord.count({ where })
      ]);

      return { present, absent, late, excused, total };
    } catch (error) {
      logger.error('Error counting attendance by status for student', {
        error,
        studentId,
        dateFrom,
        dateTo
      });
      throw error;
    }
  }

  /**
   * Calculate attendance percentage for a student
   * @param studentId - Student ID
   * @param dateFrom - Start date (optional)
   * @param dateTo - End date (optional)
   * @returns Attendance percentage (0-100)
   */
  async calculateAttendancePercentage(
    studentId: number,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<number> {
    try {
      const counts = await this.countByStatusForStudent(studentId, dateFrom, dateTo);

      if (counts.total === 0) {
        return 0;
      }

      // Present + Late count as present for percentage calculation
      const presentCount = counts.present + counts.late;
      const percentage = (presentCount / counts.total) * 100;

      return Math.round(percentage * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      logger.error('Error calculating attendance percentage', {
        error,
        studentId,
        dateFrom,
        dateTo
      });
      throw error;
    }
  }

  /**
   * Find pending sync records (for offline support)
   * @param limit - Maximum number of records to return
   * @returns Array of pending attendance records
   */
  async findPendingSync(limit: number = 100): Promise<AttendanceRecord[]> {
    try {
      return await AttendanceRecord.findAll({
        where: {
          syncStatus: SyncStatus.PENDING
        },
        limit,
        order: [['createdAt', 'ASC']]
      });
    } catch (error) {
      logger.error('Error finding pending sync records', { error, limit });
      throw error;
    }
  }

  /**
   * Find error sync records (for offline support)
   * @param limit - Maximum number of records to return
   * @returns Array of error attendance records
   */
  async findErrorSync(limit: number = 100): Promise<AttendanceRecord[]> {
    try {
      return await AttendanceRecord.findAll({
        where: {
          syncStatus: SyncStatus.ERROR
        },
        limit,
        order: [['createdAt', 'ASC']]
      });
    } catch (error) {
      logger.error('Error finding error sync records', { error, limit });
      throw error;
    }
  }

  /**
   * Update sync status for a record
   * @param attendanceId - Attendance ID
   * @param syncStatus - New sync status
   * @returns Updated attendance record or null
   */
  async updateSyncStatus(
    attendanceId: number,
    syncStatus: SyncStatus
  ): Promise<AttendanceRecord | null> {
    try {
      const attendance = await AttendanceRecord.findByPk(attendanceId);

      if (!attendance) {
        return null;
      }

      attendance.syncStatus = syncStatus;
      await attendance.save();

      logger.info('Attendance sync status updated', { attendanceId, syncStatus });

      return attendance;
    } catch (error) {
      logger.error('Error updating sync status', { error, attendanceId, syncStatus });
      throw error;
    }
  }

  /**
   * Bulk update sync status for multiple records
   * @param attendanceIds - Array of attendance IDs
   * @param syncStatus - New sync status
   * @returns Number of updated records
   */
  async bulkUpdateSyncStatus(
    attendanceIds: number[],
    syncStatus: SyncStatus
  ): Promise<number> {
    try {
      const [affectedCount] = await AttendanceRecord.update(
        { syncStatus },
        {
          where: {
            attendanceId: {
              [Op.in]: attendanceIds
            }
          }
        }
      );

      logger.info('Bulk attendance sync status updated', {
        count: affectedCount,
        syncStatus
      });

      return affectedCount;
    } catch (error) {
      logger.error('Error bulk updating sync status', {
        error,
        attendanceIds,
        syncStatus
      });
      throw error;
    }
  }

  /**
   * Check if attendance exists for student on date
   * @param studentId - Student ID
   * @param date - Date
   * @param periodNumber - Period number (optional)
   * @param excludeAttendanceId - Attendance ID to exclude (for updates)
   * @returns True if exists, false otherwise
   */
  async attendanceExists(
    studentId: number,
    date: Date,
    periodNumber?: number,
    excludeAttendanceId?: number
  ): Promise<boolean> {
    try {
      const where: WhereOptions<AttendanceRecordAttributes> = {
        studentId,
        date
      };

      if (periodNumber !== undefined) {
        where.periodNumber = periodNumber;
      }

      if (excludeAttendanceId) {
        where.attendanceId = { [Op.ne]: excludeAttendanceId };
      }

      const count = await AttendanceRecord.count({ where });
      return count > 0;
    } catch (error) {
      logger.error('Error checking attendance existence', {
        error,
        studentId,
        date,
        periodNumber
      });
      throw error;
    }
  }

  /**
   * Get attendance records with pagination metadata
   * @param filters - Optional filters
   * @param page - Page number (1-indexed)
   * @param limit - Items per page (default 20, max 100)
   * @returns Attendance records with pagination metadata
   */
  async findWithPagination(
    filters?: {
      studentId?: number;
      classId?: number;
      status?: AttendanceStatus;
      dateFrom?: Date;
      dateTo?: Date;
    },
    page: number = 1,
    limit: number = 20
  ): Promise<{
    records: AttendanceRecord[];
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
      logger.error('Error finding attendance with pagination', {
        error,
        filters,
        page,
        limit
      });
      throw error;
    }
  }
}

export default new AttendanceRepository();
