import AttendanceRepository from './attendance.repository';
import AttendanceRecord, {
  AttendanceStatus,
  SyncStatus,
  AttendanceRecordCreationAttributes
} from '@models/AttendanceRecord.model';
import { logger } from '@utils/logger';
import { Request } from 'express';
import Student from '@models/Student.model';
import User from '@models/User.model';
import smsService from '@services/sms.service';

/**
 * Attendance Service
 * Business logic for attendance management
 * 
 * Features:
 * - Mark individual attendance
 * - Mark all students present (bulk operation)
 * - Attendance correction within 24-hour window
 * - Duplicate attendance validation
 * - Attendance calculation and percentage tracking
 * - Low attendance alerts (below 75%)
 * - Attendance summary reports
 * 
 * Requirements: 6.2, 6.3, 6.6, 6.7, 6.8
 */
class AttendanceService {
  /**
   * Mark attendance for a single student
   * 
   * Validates:
   * - No duplicate attendance for same student/date/period
   * - Correction window (24 hours) for updates
   * 
   * @param attendanceData - Attendance data
   * @param userId - User ID marking attendance
   * @param req - Express request object
   * @returns Created or updated attendance record
   * @throws Error if validation fails
   * 
   * Requirements: 6.2, 6.6
   */
  async markAttendance(
    attendanceData: {
      studentId: number;
      classId: number;
      date: Date;
      dateBS?: string;
      status: AttendanceStatus;
      periodNumber?: number;
      remarks?: string;
    },
    userId: number,
    req?: Request
  ): Promise<AttendanceRecord> {
    try {
      // Check if attendance already exists for this student/date/period
      const existingAttendance = await AttendanceRepository.findByStudentAndDate(
        attendanceData.studentId,
        attendanceData.date,
        attendanceData.periodNumber
      );

      if (existingAttendance) {
        // Attendance exists - check if correction is allowed (within 24 hours)
        const canCorrect = this.canCorrectAttendance(existingAttendance.markedAt);

        if (!canCorrect) {
          throw new Error(
            'Attendance correction is only allowed within 24 hours of marking. ' +
            `This attendance was marked at ${existingAttendance.markedAt.toISOString()}.`
          );
        }

        // Update existing attendance
        logger.info('Correcting existing attendance', {
          attendanceId: existingAttendance.attendanceId,
          studentId: attendanceData.studentId,
          oldStatus: existingAttendance.status,
          newStatus: attendanceData.status
        });

        const updated = await AttendanceRepository.update(
          existingAttendance.attendanceId,
          {
            status: attendanceData.status,
            remarks: attendanceData.remarks,
            markedBy: userId,
            markedAt: new Date()
          },
          userId,
          req
        );

        if (!updated) {
          throw new Error('Failed to update attendance record');
        }

        return updated;
      }

      // Create new attendance record
      const newAttendance: AttendanceRecordCreationAttributes = {
        studentId: attendanceData.studentId,
        classId: attendanceData.classId,
        date: attendanceData.date,
        dateBS: attendanceData.dateBS,
        status: attendanceData.status,
        periodNumber: attendanceData.periodNumber,
        markedBy: userId,
        markedAt: new Date(),
        remarks: attendanceData.remarks,
        syncStatus: SyncStatus.SYNCED
      };

      const created = await AttendanceRepository.create(newAttendance, userId, req);

      logger.info('Attendance marked successfully', {
        attendanceId: created.attendanceId,
        studentId: attendanceData.studentId,
        status: attendanceData.status
      });

      return created;
    } catch (error) {
      logger.error('Error marking attendance', { error, attendanceData });
      throw error;
    }
  }

  /**
   * Mark all students in a class as present
   * Creates N attendance records for N students
   * 
   * @param classId - Class ID
   * @param studentIds - Array of student IDs in the class
   * @param date - Attendance date
   * @param dateBS - Date in Bikram Sambat format (optional)
   * @param periodNumber - Period number (optional, for period-wise attendance)
   * @param userId - User ID marking attendance
   * @param req - Express request object
   * @returns Array of created attendance records
   * 
   * Requirements: 6.3
   */
  async markAllPresent(
    classId: number,
    studentIds: number[],
    date: Date,
    dateBS: string | undefined,
    periodNumber: number | undefined,
    userId: number,
    req?: Request
  ): Promise<AttendanceRecord[]> {
    try {
      if (!studentIds || studentIds.length === 0) {
        throw new Error('No students provided for marking attendance');
      }

      logger.info('Marking all students present', {
        classId,
        studentCount: studentIds.length,
        date,
        periodNumber
      });

      // Check for existing attendance records
      const existingRecords = await AttendanceRepository.findByClassAndDate(
        classId,
        date,
        periodNumber
      );

      // Create a map of existing attendance by student ID
      const existingMap = new Map<number, AttendanceRecord>();
      for (const record of existingRecords) {
        existingMap.set(record.studentId, record);
      }

      const recordsToCreate: AttendanceRecordCreationAttributes[] = [];
      const recordsToUpdate: Array<{ record: AttendanceRecord; newStatus: AttendanceStatus }> = [];

      // Process each student
      for (const studentId of studentIds) {
        const existing = existingMap.get(studentId);

        if (existing) {
          // Check if correction is allowed
          const canCorrect = this.canCorrectAttendance(existing.markedAt);

          if (!canCorrect) {
            logger.warn('Cannot correct attendance - outside 24-hour window', {
              attendanceId: existing.attendanceId,
              studentId,
              markedAt: existing.markedAt
            });
            continue; // Skip this student
          }

          // Only update if status is different
          if (existing.status !== AttendanceStatus.PRESENT) {
            recordsToUpdate.push({
              record: existing,
              newStatus: AttendanceStatus.PRESENT
            });
          }
        } else {
          // Create new record
          recordsToCreate.push({
            studentId,
            classId,
            date,
            dateBS,
            status: AttendanceStatus.PRESENT,
            periodNumber,
            markedBy: userId,
            markedAt: new Date(),
            syncStatus: SyncStatus.SYNCED
          });
        }
      }

      // Bulk create new records
      const createdRecords = recordsToCreate.length > 0
        ? await AttendanceRepository.bulkCreate(recordsToCreate, userId, req)
        : [];

      // Update existing records
      const updatedRecords: AttendanceRecord[] = [];
      for (const { record, newStatus } of recordsToUpdate) {
        const updated = await AttendanceRepository.update(
          record.attendanceId,
          {
            status: newStatus,
            markedBy: userId,
            markedAt: new Date()
          },
          userId,
          req
        );

        if (updated) {
          updatedRecords.push(updated);
        }
      }

      const allRecords = [...createdRecords, ...updatedRecords];

      logger.info('Mark all present completed', {
        classId,
        totalStudents: studentIds.length,
        created: createdRecords.length,
        updated: updatedRecords.length,
        skipped: studentIds.length - allRecords.length
      });

      return allRecords;
    } catch (error) {
      logger.error('Error marking all present', {
        error,
        classId,
        studentCount: studentIds.length
      });
      throw error;
    }
  }

  /**
   * Check if attendance can be corrected (within 24-hour window)
   * 
   * @param markedAt - Timestamp when attendance was originally marked
   * @returns True if correction is allowed, false otherwise
   * 
   * Requirements: 6.6
   */
  canCorrectAttendance(markedAt: Date): boolean {
    const now = new Date();
    const hoursSinceMarked = (now.getTime() - markedAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceMarked <= 24;
  }

  /**
   * Validate that no duplicate attendance exists
   * 
   * @param studentId - Student ID
   * @param date - Attendance date
   * @param periodNumber - Period number (optional)
   * @param excludeAttendanceId - Attendance ID to exclude (for updates)
   * @returns True if duplicate exists, false otherwise
   */
  async hasDuplicateAttendance(
    studentId: number,
    date: Date,
    periodNumber?: number,
    excludeAttendanceId?: number
  ): Promise<boolean> {
    try {
      return await AttendanceRepository.attendanceExists(
        studentId,
        date,
        periodNumber,
        excludeAttendanceId
      );
    } catch (error) {
      logger.error('Error checking duplicate attendance', {
        error,
        studentId,
        date,
        periodNumber
      });
      throw error;
    }
  }

  /**
   * Get attendance for a class on a specific date
   * 
   * @param classId - Class ID
   * @param date - Attendance date
   * @param periodNumber - Period number (optional)
   * @returns Array of attendance records
   */
  async getClassAttendance(
    classId: number,
    date: Date,
    periodNumber?: number
  ): Promise<AttendanceRecord[]> {
    try {
      return await AttendanceRepository.findByClassAndDate(classId, date, periodNumber);
    } catch (error) {
      logger.error('Error getting class attendance', { error, classId, date, periodNumber });
      throw error;
    }
  }

  /**
   * Get attendance for a student within a date range
   * 
   * @param studentId - Student ID
   * @param dateFrom - Start date
   * @param dateTo - End date
   * @returns Array of attendance records
   */
  async getStudentAttendance(
    studentId: number,
    dateFrom: Date,
    dateTo: Date
  ): Promise<AttendanceRecord[]> {
    try {
      return await AttendanceRepository.findByStudentAndDateRange(
        studentId,
        dateFrom,
        dateTo
      );
    } catch (error) {
      logger.error('Error getting student attendance', {
        error,
        studentId,
        dateFrom,
        dateTo
      });
      throw error;
    }
  }

  /**
   * Calculate attendance summary for a student
   * 
   * @param studentId - Student ID
   * @param dateFrom - Start date (optional)
   * @param dateTo - End date (optional)
   * @returns Attendance summary with counts and percentage
   */
  async getAttendanceSummary(
    studentId: number,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<{
    studentId: number;
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    excusedDays: number;
    attendancePercentage: number;
  }> {
    try {
      const counts = await AttendanceRepository.countByStatusForStudent(
        studentId,
        dateFrom,
        dateTo
      );

      const percentage = await AttendanceRepository.calculateAttendancePercentage(
        studentId,
        dateFrom,
        dateTo
      );

      return {
        studentId,
        totalDays: counts.total,
        presentDays: counts.present,
        absentDays: counts.absent,
        lateDays: counts.late,
        excusedDays: counts.excused,
        attendancePercentage: percentage
      };
    } catch (error) {
      logger.error('Error getting attendance summary', {
        error,
        studentId,
        dateFrom,
        dateTo
      });
      throw error;
    }
  }

  /**
   * Delete attendance record
   * Only allowed within 24-hour window
   * 
   * @param attendanceId - Attendance ID
   * @param userId - User ID deleting the record
   * @param req - Express request object
   * @returns True if deleted, false if not found or not allowed
   */
  async deleteAttendance(
    attendanceId: number,
    userId: number,
    req?: Request
  ): Promise<boolean> {
    try {
      const attendance = await AttendanceRepository.findById(attendanceId);

      if (!attendance) {
        return false;
      }

      // Check if deletion is allowed (within 24 hours)
      const canDelete = this.canCorrectAttendance(attendance.markedAt);

      if (!canDelete) {
        throw new Error(
          'Attendance deletion is only allowed within 24 hours of marking. ' +
          `This attendance was marked at ${attendance.markedAt.toISOString()}.`
        );
      }

      return await AttendanceRepository.delete(attendanceId, userId, req);
    } catch (error) {
      logger.error('Error deleting attendance', { error, attendanceId });
      throw error;
    }
  }

  /**
   * Calculate attendance percentage for a student
   * Formula: (present + late) / total_days × 100
   * 
   * @param studentId - Student ID
   * @param dateFrom - Start date (optional)
   * @param dateTo - End date (optional)
   * @returns Attendance percentage (0-100)
   * 
   * Requirements: 6.7
   */
  async calculateAttendancePercentage(
    studentId: number,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<number> {
    try {
      return await AttendanceRepository.calculateAttendancePercentage(
        studentId,
        dateFrom,
        dateTo
      );
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
   * Check attendance and trigger alerts if below threshold
   * Sends SMS notifications to parents and admin when attendance falls below 75%
   * 
   * @param studentId - Student ID
   * @param dateFrom - Start date for calculation (optional)
   * @param dateTo - End date for calculation (optional)
   * @returns Object with attendance percentage and alert status
   * 
   * Requirements: 6.7, 6.8
   */
  async checkAndAlertLowAttendance(
    studentId: number,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<{
    studentId: number;
    attendancePercentage: number;
    belowThreshold: boolean;
    alertSent: boolean;
    alertDetails?: {
      parentNotified: boolean;
      adminNotified: boolean;
    };
  }> {
    try {
      const ATTENDANCE_THRESHOLD = 75;

      // Calculate attendance percentage
      const attendancePercentage = await this.calculateAttendancePercentage(
        studentId,
        dateFrom,
        dateTo
      );

      const belowThreshold = attendancePercentage < ATTENDANCE_THRESHOLD;

      if (!belowThreshold) {
        return {
          studentId,
          attendancePercentage,
          belowThreshold: false,
          alertSent: false
        };
      }

      // Fetch student details with parent contact information
      const student = await Student.findByPk(studentId);

      if (!student) {
        throw new Error(`Student with ID ${studentId} not found`);
      }

      const studentName = student.getFullNameEn();

      // Send SMS to parent (try father's phone first, then mother's)
      let parentNotified = false;
      const parentPhone = student.fatherPhone || student.motherPhone;

      if (parentPhone) {
        const parentResult = await smsService.sendLowAttendanceAlert(
          parentPhone,
          studentName,
          attendancePercentage
        );
        parentNotified = parentResult.success;

        if (parentNotified) {
          logger.info('Low attendance alert sent to parent', {
            studentId,
            studentName,
            parentPhone,
            attendancePercentage
          });
        } else {
          logger.warn('Failed to send low attendance alert to parent', {
            studentId,
            studentName,
            parentPhone,
            error: parentResult.error
          });
        }
      } else {
        logger.warn('No parent phone number available for low attendance alert', {
          studentId,
          studentName
        });
      }

      // Send SMS to admin users (school_admin role)
      let adminNotified = false;
      const adminUsers = await User.findAll({
        where: { role: 'school_admin' }
      });

      if (adminUsers.length > 0) {
        const adminMessages = adminUsers
          .filter(admin => admin.phoneNumber)
          .map(admin => ({
            recipient: admin.phoneNumber!,
            message: `Low Attendance Alert: ${studentName} (ID: ${student.studentCode}) has ${attendancePercentage.toFixed(1)}% attendance. Threshold: ${ATTENDANCE_THRESHOLD}%.`
          }));

        if (adminMessages.length > 0) {
          const adminResults = await smsService.sendBulkSMS(adminMessages);
          adminNotified = adminResults.some(result => result.success);

          logger.info('Low attendance alert sent to admins', {
            studentId,
            studentName,
            adminCount: adminMessages.length,
            successCount: adminResults.filter(r => r.success).length
          });
        }
      } else {
        logger.warn('No admin users found for low attendance alert', {
          studentId,
          studentName
        });
      }

      return {
        studentId,
        attendancePercentage,
        belowThreshold: true,
        alertSent: parentNotified || adminNotified,
        alertDetails: {
          parentNotified,
          adminNotified
        }
      };
    } catch (error) {
      logger.error('Error checking and alerting low attendance', {
        error,
        studentId,
        dateFrom,
        dateTo
      });
      throw error;
    }
  }

  /**
   * Generate attendance summary report for a student
   * Includes detailed breakdown and percentage calculation
   * 
   * @param studentId - Student ID
   * @param dateFrom - Start date (optional)
   * @param dateTo - End date (optional)
   * @returns Detailed attendance summary report
   * 
   * Requirements: 6.7
   */
  async generateAttendanceSummaryReport(
    studentId: number,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<{
    studentId: number;
    studentName?: string;
    dateRange: {
      from: Date | null;
      to: Date | null;
    };
    summary: {
      totalDays: number;
      presentDays: number;
      absentDays: number;
      lateDays: number;
      excusedDays: number;
      attendancePercentage: number;
    };
    status: {
      meetsThreshold: boolean;
      threshold: number;
      difference: number;
    };
    generatedAt: Date;
  }> {
    try {
      const ATTENDANCE_THRESHOLD = 75;

      // Get attendance summary
      const summary = await this.getAttendanceSummary(studentId, dateFrom, dateTo);

      // Get student details
      const student = await Student.findByPk(studentId);
      const studentName = student ? student.getFullNameEn() : undefined;

      const meetsThreshold = summary.attendancePercentage >= ATTENDANCE_THRESHOLD;
      const difference = summary.attendancePercentage - ATTENDANCE_THRESHOLD;

      return {
        studentId,
        studentName,
        dateRange: {
          from: dateFrom || null,
          to: dateTo || null
        },
        summary: {
          totalDays: summary.totalDays,
          presentDays: summary.presentDays,
          absentDays: summary.absentDays,
          lateDays: summary.lateDays,
          excusedDays: summary.excusedDays,
          attendancePercentage: summary.attendancePercentage
        },
        status: {
          meetsThreshold,
          threshold: ATTENDANCE_THRESHOLD,
          difference: parseFloat(difference.toFixed(2))
        },
        generatedAt: new Date()
      };
    } catch (error) {
      logger.error('Error generating attendance summary report', {
        error,
        studentId,
        dateFrom,
        dateTo
      });
      throw error;
    }
  }

  /**
   * Batch check attendance for multiple students and send alerts
   * Useful for scheduled jobs to check all students' attendance
   * 
   * @param studentIds - Array of student IDs to check
   * @param dateFrom - Start date for calculation (optional)
   * @param dateTo - End date for calculation (optional)
   * @returns Array of results for each student
   * 
   * Requirements: 6.7, 6.8
   */
  async batchCheckLowAttendance(
    studentIds: number[],
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<Array<{
    studentId: number;
    attendancePercentage: number;
    belowThreshold: boolean;
    alertSent: boolean;
  }>> {
    try {
      const results = [];

      for (const studentId of studentIds) {
        try {
          const result = await this.checkAndAlertLowAttendance(
            studentId,
            dateFrom,
            dateTo
          );
          results.push({
            studentId: result.studentId,
            attendancePercentage: result.attendancePercentage,
            belowThreshold: result.belowThreshold,
            alertSent: result.alertSent
          });
        } catch (error) {
          logger.error('Error checking attendance for student in batch', {
            error,
            studentId
          });
          // Continue with other students even if one fails
        }
      }

      logger.info('Batch attendance check completed', {
        totalStudents: studentIds.length,
        processed: results.length,
        belowThreshold: results.filter(r => r.belowThreshold).length,
        alertsSent: results.filter(r => r.alertSent).length
      });

      return results;
    } catch (error) {
      logger.error('Error in batch attendance check', {
        error,
        studentCount: studentIds.length
      });
      throw error;
    }
  }

  // ==================== Staff Attendance Methods ====================

  /**
   * Mark attendance for a single staff member
   */
  async markStaffAttendance(
    attendanceData: {
      staffId: number;
      date: Date;
      status: 'present' | 'absent' | 'late' | 'on_leave' | 'half_day';
      checkInTime?: string;
      checkOutTime?: string;
      workingHours?: number;
      remarks?: string;
    },
    userId: number
  ): Promise<any> {
    try {
      const { StaffAttendance } = require('@models/StaffAttendance.model');
      
      // Check if attendance already exists for this staff and date
      const existing = await StaffAttendance.findOne({
        where: {
          staffId: attendanceData.staffId,
          date: attendanceData.date,
        },
      });

      let attendance;
      if (existing) {
        // Update existing record
        await existing.update({
          ...attendanceData,
          markedBy: userId,
        });
        attendance = existing;
        logger.info('Staff attendance updated', {
          staffAttendanceId: existing.staffAttendanceId,
          staffId: attendanceData.staffId,
          status: attendanceData.status,
        });
      } else {
        // Create new record
        attendance = await StaffAttendance.create({
          ...attendanceData,
          markedBy: userId,
        });
        logger.info('Staff attendance marked', {
          staffAttendanceId: attendance.staffAttendanceId,
          staffId: attendanceData.staffId,
          status: attendanceData.status,
        });
      }

      return attendance;
    } catch (error) {
      logger.error('Error marking staff attendance', { error, attendanceData });
      throw error;
    }
  }

  /**
   * Mark attendance for multiple staff members (bulk operation)
   */
  async markBulkStaffAttendance(
    date: Date,
    records: Array<{
      staffId: number;
      status: 'present' | 'absent' | 'late' | 'on_leave' | 'half_day';
      checkInTime?: string;
      checkOutTime?: string;
      workingHours?: number;
      remarks?: string;
    }>,
    userId: number
  ): Promise<any[]> {
    try {
      const results = [];

      for (const record of records) {
        const attendance = await this.markStaffAttendance(
          {
            ...record,
            date,
          },
          userId
        );
        results.push(attendance);
      }

      logger.info('Bulk staff attendance marked', {
        date,
        totalRecords: records.length,
        markedBy: userId,
      });

      return results;
    } catch (error) {
      logger.error('Error marking bulk staff attendance', { error, date, recordCount: records.length });
      throw error;
    }
  }

  /**
   * Get staff attendance report
   */
  async getStaffAttendanceReport(filters: {
    staffId?: number;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  }): Promise<any> {
    try {
      const { StaffAttendance } = require('@models/StaffAttendance.model');
      const Staff = require('@models/Staff.model').default;
      const { Op } = require('sequelize');
      
      const where: any = {};
      
      if (filters.staffId) {
        where.staffId = filters.staffId;
      }
      
      if (filters.dateFrom || filters.dateTo) {
        where.date = {};
        if (filters.dateFrom) {
          where.date[Op.gte] = filters.dateFrom;
        }
        if (filters.dateTo) {
          where.date[Op.lte] = filters.dateTo;
        }
      }

      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const offset = (page - 1) * limit;

      const { count, rows } = await StaffAttendance.findAndCountAll({
        where,
        include: [
          {
            model: Staff,
            as: 'staff',
            attributes: ['staffId', 'firstNameEn', 'middleNameEn', 'lastNameEn', 'position', 'department'],
          },
        ],
        order: [['date', 'DESC']],
        limit,
        offset,
      });

      return {
        records: rows,
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      };
    } catch (error) {
      logger.error('Error getting staff attendance report', { error, filters });
      throw error;
    }
  }
}

export default new AttendanceService();

