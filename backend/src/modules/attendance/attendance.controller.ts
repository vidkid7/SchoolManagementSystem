import { Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { ValidationError } from '@middleware/errorHandler';
import { sendSuccess, calculatePagination } from '@utils/responseFormatter';
import { HTTP_STATUS, PAGINATION } from '@config/constants';
import { logger } from '@utils/logger';

// Services
import attendanceService from './attendance.service';
import leaveApplicationService from './leaveApplication.service';
import attendanceRepository from './attendance.repository';
import Student from '@models/Student.model';

/**
 * Attendance Controller
 * Handles HTTP requests for attendance management endpoints
 * Requirements: 6.1-6.14
 */
class AttendanceController {
  // ==================== Student Attendance ====================

  /**
   * Mark attendance for a single student
   * POST /api/v1/attendance/student/mark
   */
  markAttendance = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ValidationError('User ID not found in request', []);
    }

    const attendance = await attendanceService.markAttendance(req.body, userId, req);

    logger.info('Attendance marked via API', {
      attendanceId: attendance.attendanceId,
      studentId: attendance.studentId,
      status: attendance.status,
      markedBy: userId
    });

    sendSuccess(res, attendance, 'Attendance marked successfully', HTTP_STATUS.CREATED);
  });

  /**
   * Mark all students in a class as present
   * POST /api/v1/attendance/student/mark-all-present
   */
  markAllPresent = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ValidationError('User ID not found in request', []);
    }

    const { classId, studentIds, date, dateBS, periodNumber } = req.body;

    const records = await attendanceService.markAllPresent(
      classId,
      studentIds,
      new Date(date),
      dateBS,
      periodNumber,
      userId,
      req
    );

    logger.info('Mark all present completed via API', {
      classId,
      totalStudents: studentIds.length,
      recordsCreated: records.length,
      markedBy: userId
    });

    sendSuccess(
      res,
      {
        totalStudents: studentIds.length,
        recordsProcessed: records.length,
        records
      },
      'All students marked present successfully',
      HTTP_STATUS.CREATED
    );
  });

  /**
   * Get class attendance for a specific date
   * GET /api/v1/attendance/student/:classId
   */
  getClassAttendance = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const classId = Number(req.params.classId);
    const { date, periodNumber } = req.query;

    if (!date) {
      throw new ValidationError('Date is required', [
        { field: 'date', message: 'Date query parameter is required' }
      ]);
    }

    const attendanceDate = new Date(date as string);
    const period = periodNumber ? Number(periodNumber) : undefined;

    const records = await attendanceService.getClassAttendance(
      classId,
      attendanceDate,
      period
    );

    // Get all students in the class to show who hasn't been marked
    const students = await Student.findAll({
      where: { currentClassId: classId, status: 'active' }
    });

    const markedStudentIds = new Set(records.map(r => r.studentId));
    const unmarkedStudents = students.filter(s => !markedStudentIds.has(s.studentId));

    sendSuccess(
      res,
      {
        date: attendanceDate,
        classId,
        periodNumber: period,
        totalStudents: students.length,
        markedCount: records.length,
        unmarkedCount: unmarkedStudents.length,
        records,
        unmarkedStudents: unmarkedStudents.map(s => ({
          studentId: s.studentId,
          studentCode: s.studentCode,
          name: s.getFullNameEn()
        }))
      },
      'Class attendance retrieved successfully'
    );
  });

  /**
   * Get attendance reports with filters
   * GET /api/v1/attendance/student/report
   */
  getAttendanceReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_PAGE_SIZE,
      studentId,
      classId,
      status,
      dateFrom,
      dateTo,
      periodNumber,
      sortBy = 'date',
      sortOrder = 'DESC'
    } = req.query;

    const pageNum = Number(page);
    const limitNum = Math.min(Number(limit), PAGINATION.MAX_PAGE_SIZE);
    const offset = (pageNum - 1) * limitNum;

    const filters: any = {};
    if (studentId) filters.studentId = Number(studentId);
    if (classId) filters.classId = Number(classId);
    if (status) filters.status = status as string;
    if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
    if (dateTo) filters.dateTo = new Date(dateTo as string);
    if (periodNumber) filters.periodNumber = Number(periodNumber);

    const { records, total } = await attendanceRepository.findAll(
      filters,
      {
        limit: limitNum,
        offset,
        orderBy: sortBy as string,
        orderDirection: (sortOrder as string).toUpperCase() as 'ASC' | 'DESC'
      }
    );

    // If filtering by student, include summary
    let summary = null;
    if (studentId) {
      summary = await attendanceService.getAttendanceSummary(
        Number(studentId),
        filters.dateFrom,
        filters.dateTo
      );
    }

    const meta = calculatePagination(total, pageNum, limitNum);

    sendSuccess(
      res,
      {
        records,
        summary,
        pagination: meta
      },
      'Attendance report retrieved successfully',
      HTTP_STATUS.OK
    );
  });

  /**
   * Bulk import attendance from Excel
   * POST /api/v1/attendance/student/bulk
   */
  bulkImportAttendance = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ValidationError('User ID not found in request', []);
    }

    const { records } = req.body;

    if (!records || records.length === 0) {
      throw new ValidationError('No attendance records provided', [
        { field: 'records', message: 'At least one attendance record is required' }
      ]);
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ record: any; error: string }>
    };

    for (const record of records) {
      try {
        await attendanceService.markAttendance(
          {
            ...record,
            date: new Date(record.date)
          },
          userId,
          req
        );
        results.successful++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          record,
          error: error.message || 'Unknown error'
        });
        logger.error('Error importing attendance record', { error, record });
      }
    }

    logger.info('Bulk attendance import completed via API', {
      totalRecords: records.length,
      successful: results.successful,
      failed: results.failed,
      importedBy: userId
    });

    const statusCode = results.failed > 0 && results.successful > 0
      ? HTTP_STATUS.OK // Partial success
      : results.successful > 0
        ? HTTP_STATUS.CREATED
        : HTTP_STATUS.BAD_REQUEST;

    sendSuccess(res, results, 'Bulk attendance import completed', statusCode);
  });

  /**
   * Sync offline attendance records
   * POST /api/v1/attendance/student/sync
   */
  syncAttendance = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ValidationError('User ID not found in request', []);
    }

    const { records } = req.body;

    if (!records || records.length === 0) {
      throw new ValidationError('No attendance records provided for sync', [
        { field: 'records', message: 'At least one attendance record is required' }
      ]);
    }

    const results = {
      synced: 0,
      failed: 0,
      errors: [] as Array<{ record: any; error: string }>
    };

    for (const record of records) {
      try {
        await attendanceService.markAttendance(
          {
            ...record,
            date: new Date(record.date)
          },
          userId,
          req
        );
        results.synced++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          record,
          error: error.message || 'Unknown error'
        });
        logger.error('Error syncing attendance record', { error, record });
      }
    }

    logger.info('Attendance sync completed via API', {
      totalRecords: records.length,
      synced: results.synced,
      failed: results.failed,
      syncedBy: userId
    });

    sendSuccess(
      res,
      results,
      'Attendance sync completed',
      results.failed > 0 ? HTTP_STATUS.OK : HTTP_STATUS.CREATED
    );
  });

  // ==================== Leave Applications ====================

  /**
   * Apply for leave
   * POST /api/v1/attendance/leave/apply
   */
  applyForLeave = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ValidationError('User ID not found in request', []);
    }

    const leaveData = {
      ...req.body,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate)
    };

    const leave = await leaveApplicationService.applyForLeave(leaveData, userId, req);

    logger.info('Leave application submitted via API', {
      leaveId: leave.leaveId,
      studentId: leave.studentId,
      startDate: leave.startDate,
      endDate: leave.endDate,
      appliedBy: userId
    });

    sendSuccess(res, leave, 'Leave application submitted successfully', HTTP_STATUS.CREATED);
  });

  /**
   * Get pending leave applications
   * GET /api/v1/attendance/leave/pending
   */
  getPendingLeaves = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { studentId, limit = 100, status } = req.query;

    let leaves;
    if (status && ['pending', 'approved', 'rejected'].includes(status as string)) {
      leaves = await leaveApplicationService.getLeavesByStatus(status as string, Number(limit));
    } else {
      leaves = await leaveApplicationService.getPendingLeaves(
        studentId ? Number(studentId) : undefined,
        Number(limit)
      );
    }

    const formattedLeaves = leaves.map((leave: any) => ({
      id: leave.leaveId,
      studentId: leave.studentId,
      studentName: leave.student 
        ? `${leave.student.firstNameEn || ''} ${leave.student.middleNameEn || ''} ${leave.student.lastNameEn || ''}`.trim().replace(/  +/g, ' ')
        : `Student #${leave.studentId}`,
      studentCode: leave.student?.studentCode,
      startDate: leave.startDate,
      endDate: leave.endDate,
      reason: leave.reason,
      status: leave.status,
      appliedDate: leave.appliedAt,
      leaveType: 'Student Leave',
      remarks: leave.remarks
    }));

    sendSuccess(res, formattedLeaves, 'Leave applications retrieved successfully');
  });

  /**
   * Approve or reject leave application
   * PUT /api/v1/attendance/leave/:id/approve
   */
  approveOrRejectLeave = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const leaveId = Number(req.params.id);
    const userId = req.user?.userId;

    if (!userId) {
      throw new ValidationError('User ID not found in request', []);
    }

    const { action, status, remarks, rejectionReason } = req.body;

    const isApprove = action === 'approve' || status === 'approved';
    const isReject = action === 'reject' || status === 'rejected';

    let leave;
    if (isApprove) {
      leave = await leaveApplicationService.approveLeave(leaveId, userId, remarks, req);
      logger.info('Leave application approved via API', {
        leaveId,
        approvedBy: userId
      });
    } else if (isReject) {
      leave = await leaveApplicationService.rejectLeave(
        leaveId,
        userId,
        rejectionReason || remarks,
        req
      );
      logger.info('Leave application rejected via API', {
        leaveId,
        rejectedBy: userId,
        reason: rejectionReason || remarks
      });
    } else {
      throw new ValidationError('Invalid action', [
        { field: 'action', message: 'Action must be either "approve" or "reject"' }
      ]);
    }

    sendSuccess(
      res,
      leave,
      `Leave application ${action}d successfully`
    );
  });

  // ==================== Staff Attendance ====================

  /**
   * Get staff attendance report
   * GET /api/v1/attendance/staff/report
   */
  getStaffAttendanceReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_PAGE_SIZE,
      staffId,
      dateFrom,
      dateTo
    } = req.query;

    // Note: Staff attendance is not yet implemented in the system
    // This is a placeholder for future implementation
    // For now, return empty data with appropriate message

    logger.warn('Staff attendance report requested but not yet implemented', {
      staffId,
      dateFrom,
      dateTo
    });

    const report = await attendanceService.getStaffAttendanceReport({
      staffId: staffId ? Number(staffId) : undefined,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      page: Number(page),
      limit: Number(limit),
    });

    sendSuccess(
      res,
      report,
      'Staff attendance report retrieved successfully'
    );
  });

  /**
   * Mark attendance for a single staff member
   * POST /api/v1/attendance/staff/mark
   */
  markStaffAttendance = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ValidationError('User ID not found in request', []);
    }

    const attendance = await attendanceService.markStaffAttendance(req.body, userId);

    logger.info('Staff attendance marked via API', {
      staffAttendanceId: attendance.staffAttendanceId,
      staffId: attendance.staffId,
      status: attendance.status,
      markedBy: userId
    });

    sendSuccess(res, attendance, 'Staff attendance marked successfully', HTTP_STATUS.CREATED);
  });

  /**
   * Mark attendance for multiple staff members (bulk operation)
   * POST /api/v1/attendance/staff/bulk
   */
  markBulkStaffAttendance = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ValidationError('User ID not found in request', []);
    }

    const { date, records } = req.body;

    const results = await attendanceService.markBulkStaffAttendance(
      new Date(date),
      records,
      userId
    );

    logger.info('Bulk staff attendance marked via API', {
      date,
      totalRecords: records.length,
      markedBy: userId
    });

    sendSuccess(
      res,
      {
        totalRecords: records.length,
        recordsProcessed: results.length,
        records: results
      },
      'Bulk staff attendance marked successfully',
      HTTP_STATUS.CREATED
    );
  });
}

export default new AttendanceController();
