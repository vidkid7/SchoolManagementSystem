import LeaveApplicationRepository from './leaveApplication.repository';
import AttendanceRepository from './attendance.repository';
import LeaveApplication, {
  LeaveStatus,
  LeaveApplicationCreationAttributes
} from '@models/LeaveApplication.model';
import { AttendanceStatus, AttendanceRecordCreationAttributes } from '@models/AttendanceRecord.model';
import Student from '@models/Student.model';
import User from '@models/User.model';
import { logger } from '@utils/logger';
import { Request } from 'express';
import smsService from '@services/sms.service';

/**
 * Leave Application Service
 * Business logic for leave application management
 * 
 * Features:
 * - Leave application submission
 * - Approval workflow (pending → approved/rejected)
 * - Auto-mark attendance as "excused" for approved leave dates
 * - Send notifications on status changes
 * 
 * Requirements: 6.11, 6.12
 */
class LeaveApplicationService {
  /**
   * Apply for leave
   * Creates a new leave application with pending status
   * 
   * @param leaveData - Leave application data
   * @param userId - User ID applying for leave (student or parent)
   * @param req - Express request object
   * @returns Created leave application
   * @throws Error if validation fails
   * 
   * Requirements: 6.11
   */
  async applyForLeave(
    leaveData: {
      studentId: number;
      startDate: Date;
      endDate: Date;
      startDateBS?: string;
      endDateBS?: string;
      reason: string;
      remarks?: string;
    },
    userId: number,
    req?: Request
  ): Promise<LeaveApplication> {
    try {
      // Validate dates
      if (leaveData.endDate < leaveData.startDate) {
        throw new Error('End date must be after or equal to start date');
      }

      // Check for overlapping approved leaves
      const overlapping = await LeaveApplicationRepository.findOverlapping(
        leaveData.studentId,
        leaveData.startDate,
        leaveData.endDate,
        LeaveStatus.APPROVED
      );

      if (overlapping.length > 0) {
        throw new Error(
          'There is already an approved leave application for this date range'
        );
      }

      // Create leave application
      const newLeave: LeaveApplicationCreationAttributes = {
        studentId: leaveData.studentId,
        startDate: leaveData.startDate,
        endDate: leaveData.endDate,
        startDateBS: leaveData.startDateBS,
        endDateBS: leaveData.endDateBS,
        reason: leaveData.reason,
        appliedBy: userId,
        appliedAt: new Date(),
        status: LeaveStatus.PENDING,
        remarks: leaveData.remarks
      };

      const created = await LeaveApplicationRepository.create(newLeave, userId, req);

      logger.info('Leave application submitted', {
        leaveId: created.leaveId,
        studentId: leaveData.studentId,
        startDate: leaveData.startDate,
        endDate: leaveData.endDate
      });

      // Send notification to student and class teacher
      await this.sendLeaveApplicationNotification(created);

      return created;
    } catch (error) {
      logger.error('Error applying for leave', { error, leaveData });
      throw error;
    }
  }

  /**
   * Approve leave application
   * Updates status to approved and auto-marks attendance as excused
   * 
   * @param leaveId - Leave application ID
   * @param approvedBy - User ID approving the leave
   * @param remarks - Optional remarks
   * @param req - Express request object
   * @returns Updated leave application
   * @throws Error if leave not found or already processed
   * 
   * Requirements: 6.12
   */
  async approveLeave(
    leaveId: number,
    approvedBy: number,
    remarks?: string,
    req?: Request
  ): Promise<LeaveApplication> {
    try {
      const leave = await LeaveApplicationRepository.findById(leaveId);

      if (!leave) {
        throw new Error(`Leave application with ID ${leaveId} not found`);
      }

      if (!leave.isPending()) {
        throw new Error(
          `Leave application is already ${leave.status}. Only pending applications can be approved.`
        );
      }

      // Update leave status
      const updated = await LeaveApplicationRepository.update(
        leaveId,
        {
          status: LeaveStatus.APPROVED,
          approvedBy,
          approvedAt: new Date(),
          remarks
        },
        approvedBy,
        req
      );

      if (!updated) {
        throw new Error('Failed to update leave application');
      }

      logger.info('Leave application approved', {
        leaveId,
        studentId: leave.studentId,
        approvedBy
      });

      // Auto-mark attendance as excused for approved leave dates
      await this.markAttendanceAsExcused(updated);

      // Send approval notification
      await this.sendLeaveApprovalNotification(updated);

      return updated;
    } catch (error) {
      logger.error('Error approving leave', { error, leaveId });
      throw error;
    }
  }

  /**
   * Reject leave application
   * Updates status to rejected with rejection reason
   * 
   * @param leaveId - Leave application ID
   * @param rejectedBy - User ID rejecting the leave
   * @param rejectionReason - Reason for rejection
   * @param req - Express request object
   * @returns Updated leave application
   * @throws Error if leave not found or already processed
   * 
   * Requirements: 6.12
   */
  async rejectLeave(
    leaveId: number,
    rejectedBy: number,
    rejectionReason: string,
    req?: Request
  ): Promise<LeaveApplication> {
    try {
      const leave = await LeaveApplicationRepository.findById(leaveId);

      if (!leave) {
        throw new Error(`Leave application with ID ${leaveId} not found`);
      }

      if (!leave.isPending()) {
        throw new Error(
          `Leave application is already ${leave.status}. Only pending applications can be rejected.`
        );
      }

      if (!rejectionReason || rejectionReason.trim().length === 0) {
        throw new Error('Rejection reason is required');
      }

      // Update leave status
      const updated = await LeaveApplicationRepository.update(
        leaveId,
        {
          status: LeaveStatus.REJECTED,
          approvedBy: rejectedBy,
          approvedAt: new Date(),
          rejectionReason
        },
        rejectedBy,
        req
      );

      if (!updated) {
        throw new Error('Failed to update leave application');
      }

      logger.info('Leave application rejected', {
        leaveId,
        studentId: leave.studentId,
        rejectedBy,
        rejectionReason
      });

      // Send rejection notification
      await this.sendLeaveRejectionNotification(updated);

      return updated;
    } catch (error) {
      logger.error('Error rejecting leave', { error, leaveId });
      throw error;
    }
  }

  /**
   * Auto-mark attendance as excused for approved leave dates
   * Creates or updates attendance records for each day in the leave period
   * 
   * @param leave - Approved leave application
   * @returns Number of attendance records created/updated
   * 
   * Requirements: 6.12
   */
  private async markAttendanceAsExcused(leave: LeaveApplication): Promise<number> {
    try {
      if (!leave.isApproved()) {
        throw new Error('Only approved leaves can mark attendance as excused');
      }

      // Get student details to find class ID
      const student = await Student.findByPk(leave.studentId);

      if (!student) {
        throw new Error(`Student with ID ${leave.studentId} not found`);
      }

      const classId = student.currentClassId;

      if (!classId) {
        logger.warn('Student has no current class, skipping attendance marking', {
          studentId: leave.studentId,
          leaveId: leave.leaveId
        });
        return 0;
      }

      // Generate all dates in the leave period
      const dates = this.generateDateRange(leave.startDate, leave.endDate);

      let recordsProcessed = 0;

      for (const date of dates) {
        try {
          // Check if attendance already exists for this date
          const existingAttendance = await AttendanceRepository.findByStudentAndDate(
            leave.studentId,
            date
          );

          if (existingAttendance) {
            // Update existing attendance to excused
            await AttendanceRepository.update(
              existingAttendance.attendanceId,
              {
                status: AttendanceStatus.EXCUSED,
                remarks: `Leave approved: ${leave.reason}`
              },
              leave.approvedBy,
              undefined
            );

            logger.info('Updated existing attendance to excused', {
              attendanceId: existingAttendance.attendanceId,
              studentId: leave.studentId,
              date
            });
          } else {
            // Create new attendance record as excused
            const attendanceData: AttendanceRecordCreationAttributes = {
              studentId: leave.studentId,
              classId,
              date,
              status: AttendanceStatus.EXCUSED,
              markedBy: leave.approvedBy!,
              markedAt: new Date(),
              remarks: `Leave approved: ${leave.reason}`
            };

            await AttendanceRepository.create(attendanceData, leave.approvedBy, undefined);

            logger.info('Created new attendance record as excused', {
              studentId: leave.studentId,
              date
            });
          }

          recordsProcessed++;
        } catch (error) {
          logger.error('Error marking attendance as excused for date', {
            error,
            studentId: leave.studentId,
            date,
            leaveId: leave.leaveId
          });
          // Continue with other dates even if one fails
        }
      }

      logger.info('Completed marking attendance as excused for leave', {
        leaveId: leave.leaveId,
        studentId: leave.studentId,
        totalDays: dates.length,
        recordsProcessed
      });

      return recordsProcessed;
    } catch (error) {
      logger.error('Error marking attendance as excused', {
        error,
        leaveId: leave.leaveId
      });
      throw error;
    }
  }

  /**
   * Generate array of dates between start and end date (inclusive)
   * 
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Array of dates
   */
  private generateDateRange(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  /**
   * Send notification when leave application is submitted
   * 
   * @param leave - Leave application
   */
  private async sendLeaveApplicationNotification(leave: LeaveApplication): Promise<void> {
    try {
      const student = await Student.findByPk(leave.studentId);

      if (!student) {
        logger.warn('Student not found for leave notification', {
          studentId: leave.studentId
        });
        return;
      }

      const studentName = student.getFullNameEn();
      const dateRange = leave.getDisplayDateRange();

      // Notify class teacher and admins
      const classTeachers = await User.findAll({
        where: { role: 'class_teacher' }
      });

      const admins = await User.findAll({
        where: { role: 'school_admin' }
      });

      const recipients = [...classTeachers, ...admins]
        .filter(user => user.phoneNumber)
        .map(user => ({
          recipient: user.phoneNumber!,
          message: `Leave Application: ${studentName} has applied for leave from ${dateRange}. Reason: ${leave.reason.substring(0, 100)}${leave.reason.length > 100 ? '...' : ''}`
        }));

      if (recipients.length > 0) {
        await smsService.sendBulkSMS(recipients);
        logger.info('Leave application notifications sent', {
          leaveId: leave.leaveId,
          recipientCount: recipients.length
        });
      }
    } catch (error) {
      logger.error('Error sending leave application notification', {
        error,
        leaveId: leave.leaveId
      });
      // Don't throw - notification failure shouldn't fail the main operation
    }
  }

  /**
   * Send notification when leave is approved
   * 
   * @param leave - Approved leave application
   */
  private async sendLeaveApprovalNotification(leave: LeaveApplication): Promise<void> {
    try {
      const student = await Student.findByPk(leave.studentId);

      if (!student) {
        logger.warn('Student not found for approval notification', {
          studentId: leave.studentId
        });
        return;
      }

      const studentName = student.getFullNameEn();
      const dateRange = leave.getDisplayDateRange();

      // Notify parent (try father's phone first, then mother's)
      const parentPhone = student.fatherPhone || student.motherPhone;

      if (parentPhone) {
        const message = `Leave Approved: ${studentName}'s leave application for ${dateRange} has been approved.`;
        await smsService.sendSMS(parentPhone, message);

        logger.info('Leave approval notification sent to parent', {
          leaveId: leave.leaveId,
          studentId: leave.studentId,
          parentPhone
        });
      } else {
        logger.warn('No parent phone number available for approval notification', {
          leaveId: leave.leaveId,
          studentId: leave.studentId
        });
      }
    } catch (error) {
      logger.error('Error sending leave approval notification', {
        error,
        leaveId: leave.leaveId
      });
      // Don't throw - notification failure shouldn't fail the main operation
    }
  }

  /**
   * Send notification when leave is rejected
   * 
   * @param leave - Rejected leave application
   */
  private async sendLeaveRejectionNotification(leave: LeaveApplication): Promise<void> {
    try {
      const student = await Student.findByPk(leave.studentId);

      if (!student) {
        logger.warn('Student not found for rejection notification', {
          studentId: leave.studentId
        });
        return;
      }

      const studentName = student.getFullNameEn();
      const dateRange = leave.getDisplayDateRange();

      // Notify parent (try father's phone first, then mother's)
      const parentPhone = student.fatherPhone || student.motherPhone;

      if (parentPhone) {
        const message = `Leave Rejected: ${studentName}'s leave application for ${dateRange} has been rejected. Reason: ${leave.rejectionReason}`;
        await smsService.sendSMS(parentPhone, message);

        logger.info('Leave rejection notification sent to parent', {
          leaveId: leave.leaveId,
          studentId: leave.studentId,
          parentPhone
        });
      } else {
        logger.warn('No parent phone number available for rejection notification', {
          leaveId: leave.leaveId,
          studentId: leave.studentId
        });
      }
    } catch (error) {
      logger.error('Error sending leave rejection notification', {
        error,
        leaveId: leave.leaveId
      });
      // Don't throw - notification failure shouldn't fail the main operation
    }
  }

  /**
   * Get leave application by ID
   * 
   * @param leaveId - Leave application ID
   * @returns Leave application or null
   */
  async getLeaveById(leaveId: number): Promise<LeaveApplication | null> {
    try {
      return await LeaveApplicationRepository.findById(leaveId);
    } catch (error) {
      logger.error('Error getting leave by ID', { error, leaveId });
      throw error;
    }
  }

  /**
   * Get all leave applications with filters
   * 
   * @param filters - Optional filters
   * @param page - Page number
   * @param limit - Items per page
   * @returns Leave applications with pagination
   */
  async getLeaveApplications(
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
      return await LeaveApplicationRepository.findWithPagination(filters, page, limit);
    } catch (error) {
      logger.error('Error getting leave applications', { error, filters });
      throw error;
    }
  }

  /**
   * Get pending leave applications
   * 
   * @param studentId - Optional student ID filter
   * @param limit - Maximum number of records
   * @returns Array of pending leave applications
   */
  async getPendingLeaves(studentId?: number, limit: number = 100): Promise<LeaveApplication[]> {
    try {
      return await LeaveApplicationRepository.findPending(studentId, limit);
    } catch (error) {
      logger.error('Error getting pending leaves', { error, studentId });
      throw error;
    }
  }

  /**
   * Get leave applications by status
   * 
   * @param status - Leave status filter
   * @param limit - Maximum number of records
   * @returns Array of leave applications
   */
  async getLeavesByStatus(status: string, limit: number = 100): Promise<LeaveApplication[]> {
    try {
      return await LeaveApplicationRepository.findByStatus(status as LeaveStatus, limit);
    } catch (error) {
      logger.error('Error getting leaves by status', { error, status });
      throw error;
    }
  }

  /**
   * Get leave applications for a student
   * 
   * @param studentId - Student ID
   * @param status - Optional status filter
   * @returns Array of leave applications
   */
  async getStudentLeaves(
    studentId: number,
    status?: LeaveStatus
  ): Promise<LeaveApplication[]> {
    try {
      return await LeaveApplicationRepository.findByStudent(studentId, status);
    } catch (error) {
      logger.error('Error getting student leaves', { error, studentId, status });
      throw error;
    }
  }

  /**
   * Cancel leave application
   * Only pending applications can be cancelled
   * 
   * @param leaveId - Leave application ID
   * @param userId - User ID cancelling the leave
   * @param req - Express request object
   * @returns True if cancelled, false if not found
   */
  async cancelLeave(leaveId: number, userId: number, req?: Request): Promise<boolean> {
    try {
      const leave = await LeaveApplicationRepository.findById(leaveId);

      if (!leave) {
        return false;
      }

      if (!leave.canCancel()) {
        throw new Error('Only pending leave applications can be cancelled');
      }

      return await LeaveApplicationRepository.delete(leaveId, userId, req);
    } catch (error) {
      logger.error('Error cancelling leave', { error, leaveId });
      throw error;
    }
  }

  /**
   * Get leave statistics for a student
   * 
   * @param studentId - Student ID
   * @param dateFrom - Start date (optional)
   * @param dateTo - End date (optional)
   * @returns Leave statistics
   */
  async getLeaveStatistics(
    studentId: number,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<{
    studentId: number;
    pending: number;
    approved: number;
    rejected: number;
    total: number;
    totalApprovedDays: number;
  }> {
    try {
      const counts = await LeaveApplicationRepository.countByStatusForStudent(
        studentId,
        dateFrom,
        dateTo
      );

      // Calculate total approved days
      const approvedLeaves = await LeaveApplicationRepository.findByStudent(
        studentId,
        LeaveStatus.APPROVED
      );

      let totalApprovedDays = 0;
      for (const leave of approvedLeaves) {
        // Filter by date range if provided
        if (dateFrom && leave.endDate < dateFrom) continue;
        if (dateTo && leave.startDate > dateTo) continue;

        totalApprovedDays += leave.getDurationInDays();
      }

      return {
        studentId,
        ...counts,
        totalApprovedDays
      };
    } catch (error) {
      logger.error('Error getting leave statistics', {
        error,
        studentId,
        dateFrom,
        dateTo
      });
      throw error;
    }
  }
}

export default new LeaveApplicationService();
