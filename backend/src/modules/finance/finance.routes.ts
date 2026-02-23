import { Router } from 'express';
import financeController from './finance.controller';
import { authenticate, authorize } from '@middleware/auth';
import { validate } from '@middleware/validation';
import { UserRole } from '@models/User.model';
import {
  createFeeStructureSchema,
  updateFeeStructureSchema,
  feeStructureQuerySchema,
  feeStructureIdParamSchema,
  generateInvoiceSchema,
  bulkGenerateInvoicesSchema,
  updateInvoiceSchema,
  invoiceQuerySchema,
  invoiceIdParamSchema,
  processPaymentSchema,
  paymentQuerySchema,
  paymentIdParamSchema,
  studentIdParamSchema,
  processRefundSchema,
  collectionReportQuerySchema,
  pendingFeesReportQuerySchema,
  defaultersListQuerySchema
} from './finance.validation';

const router = Router();

/**
 * Finance API Routes
 * Requirements: 9.1-9.16
 */

// ==================== Dashboard ====================

/**
 * @route   GET /api/v1/finance/statistics
 * @desc    Get finance dashboard statistics
 * @access  Private (School_Admin, Accountant)
 */
router.get(
  '/statistics',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT),
  financeController.getStatistics
);

/**
 * @route   GET /api/v1/finance/recent-transactions
 * @desc    Get recent transactions
 * @access  Private (School_Admin, Accountant)
 */
router.get(
  '/recent-transactions',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT),
  financeController.getRecentTransactions
);

// ==================== Fee Structures ====================

/**
 * @route   GET /api/v1/finance/fee-structures
 * @desc    Get all fee structures with filters
 * @access  Private (School_Admin, Accountant)
 */
router.get(
  '/fee-structures',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT),
  validate(feeStructureQuerySchema, 'query'),
  financeController.getAllFeeStructures
);

/**
 * @route   GET /api/v1/finance/fee-structures/:id
 * @desc    Get fee structure by ID
 * @access  Private (School_Admin, Accountant)
 */
router.get(
  '/fee-structures/:id',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT),
  validate(feeStructureIdParamSchema, 'params'),
  financeController.getFeeStructureById
);

/**
 * @route   POST /api/v1/finance/fee-structures
 * @desc    Create fee structure
 * @access  Private (School_Admin)
 */
router.post(
  '/fee-structures',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  validate(createFeeStructureSchema, 'body'),
  financeController.createFeeStructure
);

/**
 * @route   PUT /api/v1/finance/fee-structures/:id
 * @desc    Update fee structure
 * @access  Private (School_Admin)
 */
router.put(
  '/fee-structures/:id',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  validate(feeStructureIdParamSchema, 'params'),
  validate(updateFeeStructureSchema, 'body'),
  financeController.updateFeeStructure
);

// ==================== Invoices ====================

/**
 * @route   GET /api/v1/finance/invoices
 * @desc    Get all invoices with filters and pagination
 * @access  Private (School_Admin, Accountant, Parent, Student)
 */
router.get(
  '/invoices',
  authenticate,
  authorize(
    UserRole.SCHOOL_ADMIN,
    UserRole.ACCOUNTANT,
    UserRole.PARENT,
    UserRole.STUDENT
  ),
  validate(invoiceQuerySchema, 'query'),
  financeController.getAllInvoices
);

/**
 * @route   GET /api/v1/finance/invoices/:id
 * @desc    Get invoice by ID
 * @access  Private (School_Admin, Accountant, Parent, Student)
 */
router.get(
  '/invoices/:id',
  authenticate,
  authorize(
    UserRole.SCHOOL_ADMIN,
    UserRole.ACCOUNTANT,
    UserRole.PARENT,
    UserRole.STUDENT
  ),
  validate(invoiceIdParamSchema, 'params'),
  financeController.getInvoiceById
);

/**
 * @route   POST /api/v1/finance/invoices
 * @desc    Generate invoice
 * @access  Private (School_Admin, Accountant)
 */
router.post(
  '/invoices',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT),
  validate(generateInvoiceSchema, 'body'),
  financeController.generateInvoice
);

/**
 * @route   POST /api/v1/finance/invoices/bulk-generate
 * @desc    Bulk generate invoices for multiple students
 * @access  Private (School_Admin, Accountant)
 */
router.post(
  '/invoices/bulk-generate',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT),
  validate(bulkGenerateInvoicesSchema, 'body'),
  financeController.bulkGenerateInvoices
);

/**
 * @route   PUT /api/v1/finance/invoices/:id
 * @desc    Update invoice (apply discount)
 * @access  Private (School_Admin, Accountant)
 */
router.put(
  '/invoices/:id',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT),
  validate(invoiceIdParamSchema, 'params'),
  validate(updateInvoiceSchema, 'body'),
  financeController.updateInvoice
);

// ==================== Payments ====================

/**
 * @route   GET /api/v1/finance/payments
 * @desc    Get all payments with filters and pagination
 * @access  Private (School_Admin, Accountant)
 */
router.get(
  '/payments',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT),
  validate(paymentQuerySchema, 'query'),
  financeController.getAllPayments
);

/**
 * @route   GET /api/v1/finance/payments/:id
 * @desc    Get payment by ID
 * @access  Private (School_Admin, Accountant, Parent, Student)
 */
router.get(
  '/payments/:id',
  authenticate,
  authorize(
    UserRole.SCHOOL_ADMIN,
    UserRole.ACCOUNTANT,
    UserRole.PARENT,
    UserRole.STUDENT
  ),
  validate(paymentIdParamSchema, 'params'),
  financeController.getPaymentById
);

/**
 * @route   GET /api/v1/finance/payments/student/:studentId
 * @desc    Get payment history for a student
 * @access  Private (School_Admin, Accountant, Parent, Student)
 */
router.get(
  '/payments/student/:studentId',
  authenticate,
  authorize(
    UserRole.SCHOOL_ADMIN,
    UserRole.ACCOUNTANT,
    UserRole.PARENT,
    UserRole.STUDENT
  ),
  validate(studentIdParamSchema, 'params'),
  financeController.getStudentPaymentHistory
);

/**
 * @route   POST /api/v1/finance/payments
 * @desc    Process payment
 * @access  Private (School_Admin, Accountant)
 */
router.post(
  '/payments',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT),
  validate(processPaymentSchema, 'body'),
  financeController.processPayment
);

// ==================== Refunds ====================

/**
 * @route   POST /api/v1/finance/refunds
 * @desc    Process refund
 * @access  Private (School_Admin, Accountant)
 */
router.post(
  '/refunds',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT),
  validate(processRefundSchema, 'body'),
  financeController.processRefund
);

// ==================== Reports ====================

/**
 * @route   GET /api/v1/finance/reports/collection
 * @desc    Get collection summary report
 * @access  Private (School_Admin, Accountant)
 */
router.get(
  '/reports/collection',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT),
  validate(collectionReportQuerySchema, 'query'),
  financeController.getCollectionReport
);

/**
 * @route   GET /api/v1/finance/reports/pending
 * @desc    Get pending fees report
 * @access  Private (School_Admin, Accountant)
 */
router.get(
  '/reports/pending',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT),
  validate(pendingFeesReportQuerySchema, 'query'),
  financeController.getPendingFeesReport
);

/**
 * @route   GET /api/v1/finance/reports/defaulters
 * @desc    Get defaulters list
 * @access  Private (School_Admin, Accountant)
 */
router.get(
  '/reports/defaulters',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT),
  validate(defaultersListQuerySchema, 'query'),
  financeController.getDefaultersList
);

export default router;
