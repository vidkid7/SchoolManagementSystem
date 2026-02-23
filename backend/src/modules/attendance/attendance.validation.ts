import Joi from 'joi';
import { PAGINATION } from '@config/constants';

/**
 * Attendance Validation Schemas
 * Joi validation schemas for attendance API endpoints
 * Requirements: 6.1-6.14
 */

// ==================== Student Attendance Validation ====================

export const markAttendanceSchema = Joi.object({
  studentId: Joi.number().integer().positive().required()
    .messages({ 'any.required': 'Student ID is required' }),
  classId: Joi.number().integer().positive().required()
    .messages({ 'any.required': 'Class ID is required' }),
  date: Joi.date().iso().required()
    .messages({ 'any.required': 'Date is required' }),
  dateBS: Joi.string().trim().pattern(/^\d{4}-\d{2}-\d{2}$/).optional()
    .messages({ 'string.pattern.base': 'Date BS must be in YYYY-MM-DD format' }),
  status: Joi.string().valid('present', 'absent', 'late', 'excused').required()
    .messages({ 'any.required': 'Attendance status is required' }),
  periodNumber: Joi.number().integer().min(1).max(10).optional(),
  remarks: Joi.string().trim().max(500).allow('', null).optional()
});

export const markAllPresentSchema = Joi.object({
  classId: Joi.number().integer().positive().required()
    .messages({ 'any.required': 'Class ID is required' }),
  studentIds: Joi.array().items(Joi.number().integer().positive()).min(1).required()
    .messages({ 'any.required': 'Student IDs are required' }),
  date: Joi.date().iso().required()
    .messages({ 'any.required': 'Date is required' }),
  dateBS: Joi.string().trim().pattern(/^\d{4}-\d{2}-\d{2}$/).optional()
    .messages({ 'string.pattern.base': 'Date BS must be in YYYY-MM-DD format' }),
  periodNumber: Joi.number().integer().min(1).max(10).optional()
});

export const classAttendanceQuerySchema = Joi.object({
  date: Joi.date().iso().required()
    .messages({ 'any.required': 'Date is required' }),
  periodNumber: Joi.number().integer().min(1).max(10).optional()
});

export const classIdParamSchema = Joi.object({
  classId: Joi.number().integer().positive().required()
    .messages({ 'any.required': 'Class ID is required' })
});

export const attendanceReportQuerySchema = Joi.object({
  studentId: Joi.number().integer().positive().optional(),
  classId: Joi.number().integer().positive().optional(),
  status: Joi.string().valid('present', 'absent', 'late', 'excused').optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().optional(),
  periodNumber: Joi.number().integer().min(1).max(10).optional(),
  page: Joi.number().integer().min(1).default(PAGINATION.DEFAULT_PAGE).optional(),
  limit: Joi.number().integer().min(1).max(PAGINATION.MAX_PAGE_SIZE).default(PAGINATION.DEFAULT_PAGE_SIZE).optional(),
  sortBy: Joi.string().valid('date', 'studentId', 'status', 'createdAt').default('date').optional(),
  sortOrder: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC').optional()
});

export const bulkAttendanceSchema = Joi.object({
  records: Joi.array().items(
    Joi.object({
      studentId: Joi.number().integer().positive().required(),
      classId: Joi.number().integer().positive().required(),
      date: Joi.date().iso().required(),
      dateBS: Joi.string().trim().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
      status: Joi.string().valid('present', 'absent', 'late', 'excused').required(),
      periodNumber: Joi.number().integer().min(1).max(10).optional(),
      remarks: Joi.string().trim().max(500).allow('', null).optional()
    })
  ).min(1).required()
    .messages({ 'any.required': 'Attendance records are required' })
});

export const syncAttendanceSchema = Joi.object({
  records: Joi.array().items(
    Joi.object({
      studentId: Joi.number().integer().positive().required(),
      classId: Joi.number().integer().positive().required(),
      date: Joi.date().iso().required(),
      dateBS: Joi.string().trim().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
      status: Joi.string().valid('present', 'absent', 'late', 'excused').required(),
      periodNumber: Joi.number().integer().min(1).max(10).optional(),
      remarks: Joi.string().trim().max(500).allow('', null).optional(),
      markedAt: Joi.date().iso().optional()
    })
  ).min(1).required()
    .messages({ 'any.required': 'Attendance records are required' })
});

// ==================== Leave Application Validation ====================

export const applyLeaveSchema = Joi.object({
  studentId: Joi.number().integer().positive().required()
    .messages({ 'any.required': 'Student ID is required' }),
  startDate: Joi.date().iso().required()
    .messages({ 'any.required': 'Start date is required' }),
  endDate: Joi.date().iso().required()
    .messages({ 'any.required': 'End date is required' }),
  startDateBS: Joi.string().trim().pattern(/^\d{4}-\d{2}-\d{2}$/).optional()
    .messages({ 'string.pattern.base': 'Start date BS must be in YYYY-MM-DD format' }),
  endDateBS: Joi.string().trim().pattern(/^\d{4}-\d{2}-\d{2}$/).optional()
    .messages({ 'string.pattern.base': 'End date BS must be in YYYY-MM-DD format' }),
  reason: Joi.string().trim().min(10).max(1000).required()
    .messages({ 
      'any.required': 'Leave reason is required',
      'string.min': 'Leave reason must be at least 10 characters'
    }),
  remarks: Joi.string().trim().max(500).allow('', null).optional()
});

export const pendingLeavesQuerySchema = Joi.object({
  studentId: Joi.number().integer().positive().optional(),
  status: Joi.string().valid('pending', 'approved', 'rejected').optional(),
  limit: Joi.number().integer().min(1).max(PAGINATION.MAX_PAGE_SIZE).default(100).optional()
});

export const approveLeaveSchema = Joi.object({
  action: Joi.string().valid('approve', 'reject').optional(),
  status: Joi.string().valid('approved', 'rejected').optional(),
  remarks: Joi.string().trim().max(500).allow('', null).optional(),
  rejectionReason: Joi.string().trim().min(10).max(500).optional()
    .messages({ 
      'string.min': 'Rejection reason must be at least 10 characters'
    })
}).custom((value, helpers) => {
  if (!value.action && !value.status) {
    return helpers.error('any.required');
  }
  return value;
}).messages({
  'any.required': 'Action is required (approve or reject)'
});

export const leaveIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
    .messages({ 'any.required': 'Leave application ID is required' })
});

// ==================== Staff Attendance Validation ====================

export const staffAttendanceReportQuerySchema = Joi.object({
  staffId: Joi.number().integer().positive().optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).default(PAGINATION.DEFAULT_PAGE).optional(),
  limit: Joi.number().integer().min(1).max(PAGINATION.MAX_PAGE_SIZE).default(PAGINATION.DEFAULT_PAGE_SIZE).optional()
});

export const markStaffAttendanceSchema = Joi.object({
  staffId: Joi.number().integer().positive().required()
    .messages({ 'any.required': 'Staff ID is required' }),
  date: Joi.date().iso().required()
    .messages({ 'any.required': 'Date is required' }),
  status: Joi.string().valid('present', 'absent', 'late', 'on_leave', 'half_day').required()
    .messages({ 'any.required': 'Attendance status is required' }),
  checkInTime: Joi.string().trim().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional()
    .messages({ 'string.pattern.base': 'Check-in time must be in HH:MM format' }),
  checkOutTime: Joi.string().trim().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional()
    .messages({ 'string.pattern.base': 'Check-out time must be in HH:MM format' }),
  workingHours: Joi.number().min(0).max(24).optional(),
  remarks: Joi.string().trim().max(500).allow('', null).optional()
});

export const bulkStaffAttendanceSchema = Joi.object({
  date: Joi.date().iso().required()
    .messages({ 'any.required': 'Date is required' }),
  records: Joi.array().items(
    Joi.object({
      staffId: Joi.number().integer().positive().required(),
      status: Joi.string().valid('present', 'absent', 'late', 'on_leave', 'half_day').required(),
      checkInTime: Joi.string().trim().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
      checkOutTime: Joi.string().trim().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
      workingHours: Joi.number().min(0).max(24).optional(),
      remarks: Joi.string().trim().max(500).allow('', null).optional()
    })
  ).min(1).required()
    .messages({ 'any.required': 'Staff attendance records are required' })
});
