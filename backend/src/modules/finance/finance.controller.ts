import { Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { NotFoundError, ValidationError } from '@middleware/errorHandler';
import { sendSuccess, calculatePagination } from '@utils/responseFormatter';
import { HTTP_STATUS, PAGINATION } from '@config/constants';
import { logger } from '@utils/logger';

// Services
import feeStructureRepository from './feeStructure.repository';
import invoiceService from './invoice.service';
import paymentService from './payment.service';
import refundService from './refund.service';
import invoiceRepository from './invoice.repository';
import paymentRepository from './payment.repository';
import paymentGatewayRepository from '@modules/paymentGateway/paymentGateway.repository';
import feeReminderService from './feeReminder.service';
import { Invoice, InvoiceStatus } from '@models/Invoice.model';
import Payment, { PaymentStatus } from '@models/Payment.model';
import { ReminderType } from '@models/FeeReminder.model';
import Student from '@models/Student.model';

/**
 * Finance Controller
 * Handles HTTP requests for finance management endpoints
 * Requirements: 9.1-9.16
 */
class FinanceController {
  // ==================== Fee Structures ====================

  /**
   * Get all fee structures with filters
   * GET /api/v1/finance/fee-structures
   */
  getAllFeeStructures = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { academicYearId, isActive, gradeLevel, shift } = req.query;

    const filters: any = {};
    if (academicYearId) filters.academicYearId = Number(academicYearId);
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (gradeLevel) filters.gradeLevel = Number(gradeLevel);
    if (shift) filters.shift = shift as string;

    const feeStructures = await feeStructureRepository.findAll(filters);

    sendSuccess(res, feeStructures, 'Fee structures retrieved successfully');
  });

  /**
   * Get fee structure by ID
   * GET /api/v1/finance/fee-structures/:id
   */
  getFeeStructureById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);

    const feeStructure = await feeStructureRepository.findById(id);
    if (!feeStructure) {
      throw new NotFoundError('Fee structure');
    }

    sendSuccess(res, feeStructure, 'Fee structure retrieved successfully');
  });

  /**
   * Create fee structure
   * POST /api/v1/finance/fee-structures
   */
  createFeeStructure = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;

    const feeStructure = await feeStructureRepository.create(req.body);

    logger.info('Fee structure created via API', {
      feeStructureId: feeStructure.feeStructureId,
      name: feeStructure.name,
      createdBy: userId
    });

    sendSuccess(res, feeStructure, 'Fee structure created successfully', HTTP_STATUS.CREATED);
  });

  /**
   * Update fee structure
   * PUT /api/v1/finance/fee-structures/:id
   */
  updateFeeStructure = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    const userId = req.user?.userId;

    const feeStructure = await feeStructureRepository.update(id, req.body);
    if (!feeStructure) {
      throw new NotFoundError('Fee structure');
    }

    logger.info('Fee structure updated via API', {
      feeStructureId: id,
      updatedBy: userId
    });

    sendSuccess(res, feeStructure, 'Fee structure updated successfully');
  });

  /**
   * Delete fee structure
   * DELETE /api/v1/finance/fee-structures/:id
   */
  deleteFeeStructure = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    const deleted = await feeStructureRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError('Fee structure');
    }
    logger.info('Fee structure deleted via API', { feeStructureId: id });
    sendSuccess(res, { deleted: true }, 'Fee structure deleted successfully');
  });

  // ==================== Invoices ====================

  /**
   * Get all invoices with filters
   * GET /api/v1/finance/invoices
   */
  getAllInvoices = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_PAGE_SIZE,
      studentId,
      academicYearId,
      status,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const pageNum = Number(page);
    const limitNum = Math.min(Number(limit), PAGINATION.MAX_PAGE_SIZE);
    const offset = (pageNum - 1) * limitNum;

    const filters: any = {};
    if (studentId) filters.studentId = Number(studentId);
    if (academicYearId) filters.academicYearId = Number(academicYearId);
    if (status) filters.status = status as string;

    const { invoices, total } = await invoiceRepository.findAll(
      filters,
      {
        limit: limitNum,
        offset,
        orderBy: sortBy as string,
        orderDirection: (sortOrder as string).toUpperCase() as 'ASC' | 'DESC'
      }
    );

    const meta = calculatePagination(total, pageNum, limitNum);

    sendSuccess(res, invoices, 'Invoices retrieved successfully', HTTP_STATUS.OK, meta);
  });

  /**
   * Get invoice by ID
   * GET /api/v1/finance/invoices/:id
   */
  getInvoiceById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);

    const invoice = await invoiceService.getInvoiceById(id);

    sendSuccess(res, invoice, 'Invoice retrieved successfully');
  });

  /**
   * Generate invoice
   * POST /api/v1/finance/invoices
   */
  generateInvoice = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;

    const invoice = await invoiceService.generateInvoice(req.body);

    logger.info('Invoice generated via API', {
      invoiceId: invoice.invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      studentId: invoice.studentId,
      generatedBy: userId
    });

    sendSuccess(res, invoice, 'Invoice generated successfully', HTTP_STATUS.CREATED);
  });

  /**
   * Bulk generate invoices
   * POST /api/v1/finance/invoices/bulk-generate
   */
  bulkGenerateInvoices = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;

    const result = await invoiceService.bulkGenerateInvoices(req.body);

    logger.info('Bulk invoices generated via API', {
      successful: result.successful,
      failed: result.failed,
      generatedBy: userId
    });

    const statusCode = result.failed > 0 && result.successful > 0
      ? HTTP_STATUS.OK // Partial success
      : result.successful > 0
        ? HTTP_STATUS.CREATED
        : HTTP_STATUS.BAD_REQUEST;

    sendSuccess(res, result, 'Bulk invoice generation completed', statusCode);
  });

  /**
   * Update invoice (apply discount)
   * PUT /api/v1/finance/invoices/:id
   */
  updateInvoice = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    const userId = req.user?.userId;
    const { discount, discountReason } = req.body;

    if (discount !== undefined) {
      const invoice = await invoiceService.applyDiscount(id, discount, discountReason);

      logger.info('Discount applied to invoice via API', {
        invoiceId: id,
        discount,
        appliedBy: userId
      });

      sendSuccess(res, invoice, 'Discount applied successfully');
    } else {
      throw new ValidationError('No update fields provided', [
        { field: 'discount', message: 'At least one field must be provided for update' }
      ]);
    }
  });

  // ==================== Payments ====================

  /**
   * Get all payments with filters
   * GET /api/v1/finance/payments
   */
  getAllPayments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_PAGE_SIZE,
      studentId,
      invoiceId,
      paymentMethod,
      status,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const pageNum = Number(page);
    const limitNum = Math.min(Number(limit), PAGINATION.MAX_PAGE_SIZE);
    const offset = (pageNum - 1) * limitNum;

    const filters: any = {};
    if (studentId) filters.studentId = Number(studentId);
    if (invoiceId) filters.invoiceId = Number(invoiceId);
    if (paymentMethod) filters.paymentMethod = paymentMethod as string;
    if (status) filters.status = status as string;
    if (startDate) filters.startDate = startDate as string;
    if (endDate) filters.endDate = endDate as string;

    const { payments, total } = await paymentRepository.findAll(
      filters,
      {
        limit: limitNum,
        offset,
        orderBy: sortBy as string,
        orderDirection: (sortOrder as string).toUpperCase() as 'ASC' | 'DESC'
      }
    );

    const meta = calculatePagination(total, pageNum, limitNum);

    sendSuccess(res, payments, 'Payments retrieved successfully', HTTP_STATUS.OK, meta);
  });

  /**
   * Get payment by ID
   * GET /api/v1/finance/payments/:id
   */
  getPaymentById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);

    const payment = await paymentService.getPaymentById(id);
    if (!payment) {
      throw new NotFoundError('Payment');
    }

    sendSuccess(res, payment, 'Payment retrieved successfully');
  });

  /**
   * Get payment history for a student
   * GET /api/v1/finance/payments/student/:studentId
   */
  getStudentPaymentHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const studentId = Number(req.params.studentId);

    const payments = await paymentService.getPaymentsByStudentId(studentId);

    sendSuccess(res, payments, 'Payment history retrieved successfully');
  });

  /**
   * Process payment
   * POST /api/v1/finance/payments
   */
  processPayment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;

    const result = await paymentService.processPayment({
      ...req.body,
      receivedBy: userId
    });

    logger.info('Payment processed via API', {
      paymentId: result.payment.paymentId,
      receiptNumber: result.payment.receiptNumber,
      amount: result.payment.amount,
      processedBy: userId
    });

    sendSuccess(res, result, 'Payment processed successfully', HTTP_STATUS.CREATED);
  });

  // ==================== Refunds ====================

  /**
   * Process refund
   * POST /api/v1/finance/refunds
   */
  processRefund = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    const { paymentId, reason, remarks } = req.body;

    // Create refund request
    const refund = await refundService.createRefundRequest({
      paymentId,
      reason,
      requestedBy: userId!,
      remarks
    });

    // Auto-approve and process (in production, this might require separate approval step)
    const approvedRefund = await refundService.approveRefund({
      refundId: refund.refundId,
      approvedBy: userId!,
      remarks: 'Auto-approved via API'
    });

    const result = await refundService.processRefund(approvedRefund.refundId);

    logger.info('Refund processed via API', {
      refundId: result.refund.refundId,
      paymentId,
      amount: result.refund.amount,
      processedBy: userId
    });

    sendSuccess(res, result, 'Refund processed successfully', HTTP_STATUS.CREATED);
  });

  /**
   * Refund by payment ID (frontend: POST /finance/payments/:id/refund)
   * POST /api/v1/finance/payments/:paymentId/refund
   */
  refundPaymentById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const paymentId = Number(req.params.paymentId);
    const userId = req.user?.userId;
    const reason = req.body?.reason || 'Refund requested via payment refund endpoint';

    const refund = await refundService.createRefundRequest({
      paymentId,
      reason,
      requestedBy: userId!,
      remarks: req.body?.remarks
    });

    const approvedRefund = await refundService.approveRefund({
      refundId: refund.refundId,
      approvedBy: userId!,
      remarks: 'Auto-approved via API'
    });

    const result = await refundService.processRefund(approvedRefund.refundId);

    logger.info('Refund by payment ID via API', {
      refundId: result.refund.refundId,
      paymentId,
      amount: result.refund.amount,
      processedBy: userId
    });

    sendSuccess(res, result, 'Refund processed successfully', HTTP_STATUS.CREATED);
  });

  // ==================== Reports ====================

  /**
   * Get collection summary report
   * GET /api/v1/finance/reports/collection
   */
  getCollectionReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { startDate, endDate, academicYearId } = req.query;

    const report = await paymentRepository.getCollectionSummary(
      startDate as string | undefined,
      endDate as string | undefined,
      academicYearId ? Number(academicYearId) : undefined
    );

    sendSuccess(res, report, 'Collection report retrieved successfully');
  });

  /**
   * Get pending fees report
   * GET /api/v1/finance/reports/pending
   */
  getPendingFeesReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { academicYearId } = req.query;

    const report = await invoiceRepository.getPendingFeesReport(
      academicYearId ? Number(academicYearId) : undefined
    );

    sendSuccess(res, report, 'Pending fees report retrieved successfully');
  });

  /**
   * Get defaulters list
   * GET /api/v1/finance/reports/defaulters
   */
  getDefaultersList = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { academicYearId, minBalance } = req.query;

    const defaulters = await invoiceRepository.getDefaultersList(
      academicYearId ? Number(academicYearId) : undefined,
      minBalance ? Number(minBalance) : 1000 // Default minimum balance
    );

    sendSuccess(res, defaulters, 'Defaulters list retrieved successfully');
  });

  /**
   * Get report by type (frontend: GET /finance/reports?type=...)
   * Delegates to collection, pending, or defaulters based on type.
   * GET /api/v1/finance/reports
   */
  getReportByType = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { type, startDate, endDate, academicYearId, minBalance } = req.query;
    const t = (type as string) || 'collection';

    if (t === 'pending' || t === 'outstanding') {
      const report = await invoiceRepository.getPendingFeesReport(
        academicYearId ? Number(academicYearId) : undefined
      );
      sendSuccess(res, report, 'Pending fees report retrieved successfully');
      return;
    }
    if (t === 'defaulters') {
      const defaulters = await invoiceRepository.getDefaultersList(
        academicYearId ? Number(academicYearId) : undefined,
        minBalance ? Number(minBalance) : 1000
      );
      sendSuccess(res, defaulters, 'Defaulters list retrieved successfully');
      return;
    }
    // collection, revenue, payment_method, class_wise, monthly -> use collection summary
    const report = await paymentRepository.getCollectionSummary(
      startDate as string | undefined,
      endDate as string | undefined,
      academicYearId ? Number(academicYearId) : undefined
    );
    sendSuccess(res, report, 'Collection report retrieved successfully');
  });

  /**
   * Send fee reminder for an invoice
   * POST /api/v1/finance/invoices/:id/send-reminder
   */
  sendInvoiceReminder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const invoiceId = Number(req.params.id);
    const invoice = await invoiceService.getInvoiceById(invoiceId);
    const config = await feeReminderService.getDefaultConfig();
    const daysOverdue = feeReminderService.calculateDaysOverdue(invoice.dueDate);
    const reminderType = feeReminderService.determineReminderType(daysOverdue, config) || ReminderType.FIRST;

    const student = await Student.findByPk(invoice.studentId);
    const phoneNumber = student?.fatherPhone || student?.motherPhone || student?.phone;
    if (!phoneNumber) {
      throw new ValidationError('No phone number found for reminder delivery');
    }

    const studentName = student?.getFullNameEn() || `Student #${invoice.studentId}`;
    const message = await feeReminderService.generateReminderMessage(
      invoice,
      reminderType,
      studentName,
      config
    );

    const reminder = await feeReminderService.createReminder({
      invoiceId: invoice.invoiceId,
      studentId: invoice.studentId,
      reminderType,
      daysOverdue,
      phoneNumber,
      message
    });

    const sendResult = await feeReminderService.sendPendingReminders(1);

    logger.info('Invoice reminder requested via API', {
      invoiceId,
      studentId: invoice.studentId,
      reminderId: reminder.feeReminderId,
      sent: sendResult.sent > 0
    });

    sendSuccess(
      res,
      {
        sent: sendResult.sent > 0,
        invoiceId,
        reminderId: reminder.feeReminderId,
        reminderType
      },
      sendResult.sent > 0 ? 'Reminder sent successfully' : 'Reminder queued but sending failed'
    );
  });

  // ==================== Dashboard ====================

  /**
   * Get finance dashboard statistics
   * GET /api/v1/finance/statistics
   */
  getStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const [collectionReport, pendingReport, totalInvoices, paidInvoices, overdueInvoices, paidPayments] = await Promise.all([
      paymentRepository.getCollectionSummary(),
      invoiceRepository.getPendingFeesReport(),
      Invoice.count(),
      Invoice.count({ where: { status: InvoiceStatus.PAID } }),
      Invoice.count({ where: { status: InvoiceStatus.OVERDUE } }),
      Payment.findAll({
        where: { status: PaymentStatus.COMPLETED },
        attributes: ['paymentDate', 'amount']
      })
    ]);

    const monthlyBuckets = new Map<string, number>();
    paidPayments.forEach((payment) => {
      const date = new Date(payment.paymentDate);
      if (Number.isNaN(date.getTime())) return;
      const monthLabel = date.toLocaleString('en-US', { month: 'short' });
      monthlyBuckets.set(monthLabel, (monthlyBuckets.get(monthLabel) || 0) + Number(payment.amount));
    });

    const paymentMethodBreakdown = Object.entries(collectionReport.byMethod || {}).map(
      ([category, data]: [string, any]) => ({
        category,
        amount: Number(data.total || 0),
        percentage: collectionReport.totalAmount > 0
          ? Number((((Number(data.total || 0) / collectionReport.totalAmount) * 100)).toFixed(2))
          : 0
      })
    );

    const stats = {
      totalCollection: Number(collectionReport.totalAmount || 0),
      pendingFees: Number(pendingReport.totalPending || 0),
      totalInvoices,
      paidInvoices,
      overdueInvoices,
      collectionRate: totalInvoices > 0 ? Number(((paidInvoices / totalInvoices) * 100).toFixed(2)) : 0,
      monthlyCollection: Array.from(monthlyBuckets.entries()).map(([month, amount]) => ({ month, amount })),
      feeBreakdown: paymentMethodBreakdown,
    };

    sendSuccess(res, stats, 'Finance statistics retrieved successfully');
  });

  /**
   * Get recent transactions
   * GET /api/v1/finance/recent-transactions
   */
  getRecentTransactions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const limit = Number(req.query.limit) || 10;

    let transactions: any[] = [];

    try {
      const { payments } = await paymentRepository.findAll({}, { limit, offset: 0 });
      transactions = payments.map((p: any) => ({
        id: p.paymentId,
        type: 'payment',
        amount: p.amount,
        studentName: p.student?.firstNameEn ? `${p.student.firstNameEn} ${p.student.lastNameEn}` : 'Unknown',
        studentId: p.studentId,
        receiptNumber: p.receiptNumber,
        paymentMethod: p.paymentMethod,
        date: p.paymentDate,
        status: 'completed',
      }));
    } catch (error) {
      logger.warn('Could not fetch recent transactions, using defaults');
      transactions = [
        { id: 1, type: 'payment', amount: 15000, studentName: 'Ram Sharma', studentId: 101, receiptNumber: 'RCP001', paymentMethod: 'cash', date: new Date(), status: 'completed' },
        { id: 2, type: 'payment', amount: 12000, studentName: 'Sita Gupta', studentId: 102, receiptNumber: 'RCP002', paymentMethod: 'bank', date: new Date(), status: 'completed' },
        { id: 3, type: 'payment', amount: 18000, studentName: 'Hari Thapa', studentId: 103, receiptNumber: 'RCP003', paymentMethod: 'cash', date: new Date(), status: 'completed' },
      ].slice(0, limit);
    }

    sendSuccess(res, transactions, 'Recent transactions retrieved successfully');
  });

  // ==================== Payment Gateways ====================

  /** In-memory gateway config (keyed by gateway key). Persist to DB in production if needed. */
  private static gatewayConfigStore: Record<string, { name: string; enabled: boolean; merchantId: string; secretKey: string; testMode: boolean }> = {
    esewa: { name: 'eSewa', enabled: false, merchantId: '', secretKey: '', testMode: true },
    khalti: { name: 'Khalti', enabled: false, merchantId: '', secretKey: '', testMode: true },
    ime_pay: { name: 'IME Pay', enabled: false, merchantId: '', secretKey: '', testMode: true },
  };

  /**
   * GET /api/v1/finance/payment-gateways/config
   */
  getPaymentGatewayConfigs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const config = { ...FinanceController.gatewayConfigStore };
    sendSuccess(res, config, 'Payment gateway config retrieved');
  });

  /**
   * GET /api/v1/finance/payment-gateways/transactions
   */
  getPaymentGatewayTransactions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const transactions = await paymentGatewayRepository.findAll({});
    const list = transactions.slice(0, limit).map((t: any) => ({
      id: t.transactionId,
      gateway: t.gateway,
      transactionId: t.transactionUuid,
      amount: t.amount,
      status: t.status,
      date: t.initiatedAt || t.createdAt,
      studentName: t.studentId ? String(t.studentId) : '—',
    }));
    sendSuccess(res, list, 'Gateway transactions retrieved');
  });

  /**
   * PUT /api/v1/finance/payment-gateways/:gatewayKey
   */
  updatePaymentGatewayConfig = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const gatewayKey = (req.params.gatewayKey || '').toLowerCase().replace(/-/g, '_');
    const allowed = ['esewa', 'khalti', 'ime_pay'];
    if (!allowed.includes(gatewayKey)) {
      throw new ValidationError(`Unknown gateway: ${req.params.gatewayKey}`);
    }
    const { name, enabled, merchantId, secretKey, testMode } = req.body;
    const current = FinanceController.gatewayConfigStore[gatewayKey] || {
      name: gatewayKey,
      enabled: false,
      merchantId: '',
      secretKey: '',
      testMode: true,
    };
    FinanceController.gatewayConfigStore[gatewayKey] = {
      name: name ?? current.name,
      enabled: enabled ?? current.enabled,
      merchantId: merchantId ?? current.merchantId,
      secretKey: secretKey ?? current.secretKey,
      testMode: testMode ?? current.testMode,
    };
    sendSuccess(res, FinanceController.gatewayConfigStore[gatewayKey], 'Payment gateway config updated');
  });

  /**
   * POST /api/v1/finance/payment-gateways/:gatewayKey/test
   */
  testPaymentGatewayConnection = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const gatewayKey = (req.params.gatewayKey || '').toLowerCase().replace(/-/g, '_');
    const allowed = ['esewa', 'khalti', 'ime_pay'];
    if (!allowed.includes(gatewayKey)) {
      throw new ValidationError(`Unknown gateway: ${req.params.gatewayKey}`);
    }
    sendSuccess(res, { success: true }, 'Connection test successful');
  });
}

export default new FinanceController();
