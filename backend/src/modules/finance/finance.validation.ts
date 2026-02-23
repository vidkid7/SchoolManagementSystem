import Joi from 'joi';
import { PAGINATION } from '@config/constants';

/**
 * Finance Validation Schemas
 * Joi validation schemas for finance API endpoints
 * Requirements: 9.1-9.16
 */

// ==================== Fee Structure Validation ====================

export const createFeeStructureSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required()
    .messages({ 'any.required': 'Fee structure name is required' }),
  applicableClasses: Joi.array().items(Joi.number().integer().min(1).max(12)).min(1).required()
    .messages({ 'any.required': 'Applicable classes are required' }),
  applicableShifts: Joi.array().items(Joi.string().valid('morning', 'day', 'evening')).min(1).required()
    .messages({ 'any.required': 'Applicable shifts are required' }),
  academicYearId: Joi.number().integer().positive().required()
    .messages({ 'any.required': 'Academic year ID is required' }),
  description: Joi.string().trim().max(500).allow('', null).optional(),
  feeComponents: Joi.array().items(
    Joi.object({
      name: Joi.string().trim().min(1).max(255).required(),
      type: Joi.string().valid(
        'admission',
        'annual',
        'monthly',
        'exam',
        'transport',
        'hostel',
        'library',
        'lab',
        'eca',
        'development'
      ).required(),
      amount: Joi.number().positive().required(),
      frequency: Joi.string().valid('one_time', 'monthly', 'quarterly', 'annual').required(),
      isMandatory: Joi.boolean().required(),
      description: Joi.string().trim().max(500).allow('', null).optional()
    })
  ).min(1).required()
    .messages({ 'any.required': 'At least one fee component is required' })
});

export const updateFeeStructureSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).optional(),
  applicableClasses: Joi.array().items(Joi.number().integer().min(1).max(12)).min(1).optional(),
  applicableShifts: Joi.array().items(Joi.string().valid('morning', 'day', 'evening')).min(1).optional(),
  isActive: Joi.boolean().optional(),
  description: Joi.string().trim().max(500).allow('', null).optional()
}).min(1).messages({ 'object.min': 'At least one field must be provided for update' });

export const feeStructureQuerySchema = Joi.object({
  academicYearId: Joi.number().integer().positive().optional(),
  isActive: Joi.string().valid('true', 'false').optional(),
  gradeLevel: Joi.number().integer().min(1).max(12).optional(),
  shift: Joi.string().valid('morning', 'day', 'evening').optional()
});

export const feeStructureIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
    .messages({ 'any.required': 'Fee structure ID is required' })
});

// ==================== Invoice Validation ====================

export const generateInvoiceSchema = Joi.object({
  studentId: Joi.number().integer().positive().required()
    .messages({ 'any.required': 'Student ID is required' }),
  feeStructureId: Joi.number().integer().positive().required()
    .messages({ 'any.required': 'Fee structure ID is required' }),
  academicYearId: Joi.number().integer().positive().required()
    .messages({ 'any.required': 'Academic year ID is required' }),
  dueDate: Joi.date().iso().required()
    .messages({ 'any.required': 'Due date is required' }),
  discount: Joi.number().min(0).optional(),
  discountReason: Joi.string().trim().max(500).allow('', null).optional()
});

export const bulkGenerateInvoicesSchema = Joi.object({
  studentIds: Joi.array().items(Joi.number().integer().positive()).min(1).required()
    .messages({ 'any.required': 'Student IDs are required' }),
  feeStructureId: Joi.number().integer().positive().required()
    .messages({ 'any.required': 'Fee structure ID is required' }),
  academicYearId: Joi.number().integer().positive().required()
    .messages({ 'any.required': 'Academic year ID is required' }),
  dueDate: Joi.date().iso().required()
    .messages({ 'any.required': 'Due date is required' })
});

export const updateInvoiceSchema = Joi.object({
  discount: Joi.number().min(0).optional(),
  discountReason: Joi.string().trim().max(500).allow('', null).optional()
}).min(1).messages({ 'object.min': 'At least one field must be provided for update' });

export const invoiceQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(PAGINATION.DEFAULT_PAGE).optional(),
  limit: Joi.number().integer().min(1).max(PAGINATION.MAX_PAGE_SIZE).default(PAGINATION.DEFAULT_PAGE_SIZE).optional(),
  studentId: Joi.number().integer().positive().optional(),
  academicYearId: Joi.number().integer().positive().optional(),
  status: Joi.string().valid('pending', 'partial', 'paid', 'overdue', 'cancelled').optional(),
  sortBy: Joi.string().valid('invoiceNumber', 'studentId', 'dueDate', 'totalAmount', 'balance', 'createdAt').default('createdAt').optional(),
  sortOrder: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC').optional()
});

export const invoiceIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
    .messages({ 'any.required': 'Invoice ID is required' })
});

// ==================== Payment Validation ====================

export const processPaymentSchema = Joi.object({
  invoiceId: Joi.number().integer().positive().required()
    .messages({ 'any.required': 'Invoice ID is required' }),
  studentId: Joi.number().integer().positive().required()
    .messages({ 'any.required': 'Student ID is required' }),
  amount: Joi.number().positive().required()
    .messages({ 'any.required': 'Payment amount is required' }),
  paymentMethod: Joi.string().valid('cash', 'bank_transfer', 'esewa', 'khalti', 'ime_pay').required()
    .messages({ 'any.required': 'Payment method is required' }),
  paymentDate: Joi.date().iso().required()
    .messages({ 'any.required': 'Payment date is required' }),
  transactionId: Joi.string().trim().max(255).allow('', null).optional(),
  gatewayResponse: Joi.object().allow(null).optional(),
  remarks: Joi.string().trim().max(500).allow('', null).optional(),
  installmentNumber: Joi.number().integer().positive().optional(),
  installmentPlanId: Joi.number().integer().positive().optional()
});

export const paymentQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(PAGINATION.DEFAULT_PAGE).optional(),
  limit: Joi.number().integer().min(1).max(PAGINATION.MAX_PAGE_SIZE).default(PAGINATION.DEFAULT_PAGE_SIZE).optional(),
  studentId: Joi.number().integer().positive().optional(),
  invoiceId: Joi.number().integer().positive().optional(),
  paymentMethod: Joi.string().valid('cash', 'bank_transfer', 'esewa', 'khalti', 'ime_pay').optional(),
  status: Joi.string().valid('pending', 'completed', 'failed', 'refunded').optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  sortBy: Joi.string().valid('receiptNumber', 'studentId', 'amount', 'paymentDate', 'createdAt').default('createdAt').optional(),
  sortOrder: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC').optional()
});

export const paymentIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
    .messages({ 'any.required': 'Payment ID is required' })
});

export const studentIdParamSchema = Joi.object({
  studentId: Joi.number().integer().positive().required()
    .messages({ 'any.required': 'Student ID is required' })
});

// ==================== Refund Validation ====================

export const processRefundSchema = Joi.object({
  paymentId: Joi.number().integer().positive().required()
    .messages({ 'any.required': 'Payment ID is required' }),
  reason: Joi.string().trim().min(1).max(500).required()
    .messages({ 'any.required': 'Refund reason is required' }),
  remarks: Joi.string().trim().max(500).allow('', null).optional()
});

// ==================== Report Validation ====================

export const collectionReportQuerySchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  academicYearId: Joi.number().integer().positive().optional()
});

export const pendingFeesReportQuerySchema = Joi.object({
  academicYearId: Joi.number().integer().positive().optional(),
  classId: Joi.number().integer().positive().optional()
});

export const defaultersListQuerySchema = Joi.object({
  academicYearId: Joi.number().integer().positive().optional(),
  minBalance: Joi.number().positive().optional()
});
