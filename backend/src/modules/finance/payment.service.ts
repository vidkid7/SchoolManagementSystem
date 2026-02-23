import sequelize from '@config/database';
import paymentRepository from './payment.repository';
import invoiceRepository from './invoice.repository';
import { Payment, PaymentMethod, PaymentStatus } from '@models/Payment.model';
import { InstallmentPlan, InstallmentFrequency } from '@models/Payment.model';
import { Invoice, InvoiceStatus } from '@models/Invoice.model';
import QRCode from 'qrcode';
import auditLogger from '@utils/auditLogger';
import { logger } from '@utils/logger';

/**
 * Payment Service
 * Handles payment processing, receipt generation, and installment plans
 * 
 * Requirements: 9.5, 9.7, 9.8, 9.9, 9.11, 38.4
 */

export interface CreatePaymentData {
  invoiceId: number;
  studentId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  transactionId?: string;
  gatewayResponse?: any;
  receivedBy: number;
  remarks?: string;
  installmentNumber?: number;
  installmentPlanId?: number;
}

export interface CreateInstallmentPlanData {
  invoiceId: number;
  studentId: number;
  numberOfInstallments: number;
  frequency: InstallmentFrequency;
  startDate: string;
  createdBy: number;
}

class PaymentService {
  /**
   * Generate unique receipt number
   * Format: RCP-{YEAR}-{SEQUENTIAL}
   */
  async generateReceiptNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const bsYear = currentYear + 57; // Approximate BS year
    
    // Find the last receipt number for this year
    const lastPayment = await Payment.findOne({
      where: {
        receiptNumber: {
          $like: `RCP-${bsYear}-%`
        }
      },
      order: [['receiptNumber', 'DESC']]
    });

    let sequential = 1;
    if (lastPayment) {
      const parts = lastPayment.receiptNumber.split('-');
      if (parts.length === 3) {
        sequential = parseInt(parts[2], 10) + 1;
      }
    }

    return `RCP-${bsYear}-${sequential.toString().padStart(5, '0')}`;
  }

  /**
   * Generate QR code for receipt verification
   * Contains: receipt number, student ID, amount, date
   */
  async generateReceiptQRCode(payment: Payment): Promise<string> {
    const qrData = {
      receiptNumber: payment.receiptNumber,
      studentId: payment.studentId,
      amount: Number(payment.amount),
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod,
      invoiceId: payment.invoiceId
    };

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 200,
      margin: 1
    });

    return qrCodeDataUrl;
  }

  /**
   * Process payment and update invoice balance
   * Requirements: 38.4 - Log financial transactions
   */
  async processPayment(
    paymentData: CreatePaymentData,
    userId?: number
  ): Promise<{ payment: Payment; invoice: Invoice }> {
    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      // Validate invoice exists and has balance
      const invoice = await invoiceRepository.findById(paymentData.invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Check if invoice is cancelled
      if (invoice.status === InvoiceStatus.CANCELLED) {
        throw new Error('Cannot process payment for cancelled invoice');
      }

      // Validate payment amount
      const balance = invoice.calculateBalance();
      if (paymentData.amount <= 0) {
        throw new Error('Payment amount must be greater than zero');
      }

      if (paymentData.amount > balance) {
        throw new Error(`Payment amount (${paymentData.amount}) exceeds invoice balance (${balance})`);
      }

      // Generate receipt number
      const receiptNumber = await this.generateReceiptNumber();

      // Create payment record
      const payment = await paymentRepository.create(
        {
          ...paymentData,
          receiptNumber,
          status: PaymentStatus.COMPLETED
        },
        transaction
      );

      // Generate QR code
      const qrCode = await this.generateReceiptQRCode(payment);
      await payment.update({ qrCode }, { transaction });

      // Update invoice balance
      invoice.recordPayment(paymentData.amount);
      await invoice.save({ transaction });

      // If installment payment, check if plan is completed
      if (paymentData.installmentPlanId) {
        const plan = await paymentRepository.findInstallmentPlanById(paymentData.installmentPlanId);
        if (plan) {
          const remainingInstallments = await plan.getRemainingInstallments();
          if (remainingInstallments === 0) {
            plan.markAsCompleted();
            await plan.save({ transaction });
          }
        }
      }

      await transaction.commit();

      // Log financial transaction (Requirement 38.4)
      try {
        await auditLogger.logCreate(
          'payment',
          payment.paymentId,
          {
            receiptNumber: payment.receiptNumber,
            invoiceId: payment.invoiceId,
            studentId: payment.studentId,
            amount: payment.amount,
            paymentMethod: payment.paymentMethod,
            paymentDate: payment.paymentDate,
            transactionId: payment.transactionId,
            receivedBy: payment.receivedBy,
            status: payment.status
          },
          userId || paymentData.receivedBy
        );

        logger.info('Financial transaction logged', {
          paymentId: payment.paymentId,
          receiptNumber: payment.receiptNumber,
          amount: payment.amount,
          method: payment.paymentMethod
        });
      } catch (auditError) {
        // Don't fail payment if audit logging fails
        logger.error('Failed to log financial transaction', { 
          error: auditError, 
          paymentId: payment.paymentId 
        });
      }

      return { payment, invoice };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Process cash payment
   */
  async processCashPayment(
    invoiceId: number,
    studentId: number,
    amount: number,
    paymentDate: string,
    receivedBy: number,
    remarks?: string
  ): Promise<{ payment: Payment; invoice: Invoice }> {
    return this.processPayment({
      invoiceId,
      studentId,
      amount,
      paymentMethod: PaymentMethod.CASH,
      paymentDate,
      receivedBy,
      remarks
    });
  }

  /**
   * Process bank transfer payment
   */
  async processBankTransferPayment(
    invoiceId: number,
    studentId: number,
    amount: number,
    paymentDate: string,
    transactionId: string,
    receivedBy: number,
    remarks?: string
  ): Promise<{ payment: Payment; invoice: Invoice }> {
    // Check for duplicate transaction ID
    const existingPayment = await paymentRepository.findByTransactionId(transactionId);
    if (existingPayment) {
      throw new Error(`Payment with transaction ID ${transactionId} already exists`);
    }

    return this.processPayment({
      invoiceId,
      studentId,
      amount,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      paymentDate,
      transactionId,
      receivedBy,
      remarks
    });
  }

  /**
   * Create installment plan
   */
  async createInstallmentPlan(
    planData: CreateInstallmentPlanData
  ): Promise<InstallmentPlan> {
    const transaction = await sequelize.transaction();

    try {
      // Validate invoice exists
      const invoice = await invoiceRepository.findById(planData.invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Check if invoice already has an installment plan
      const existingPlan = await paymentRepository.findInstallmentPlanByInvoiceId(planData.invoiceId);
      if (existingPlan && existingPlan.isActive()) {
        throw new Error('Invoice already has an active installment plan');
      }

      // Calculate installment amount
      const totalAmount = invoice.calculateBalance();
      if (totalAmount <= 0) {
        throw new Error('Invoice has no balance to create installment plan');
      }

      const installmentAmount = totalAmount / planData.numberOfInstallments;

      // Create installment plan
      const plan = await paymentRepository.createInstallmentPlan(
        {
          ...planData,
          totalAmount,
          installmentAmount
        },
        transaction
      );

      await transaction.commit();

      return plan;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Process installment payment
   */
  async processInstallmentPayment(
    installmentPlanId: number,
    installmentNumber: number,
    paymentMethod: PaymentMethod,
    paymentDate: string,
    receivedBy: number,
    transactionId?: string,
    remarks?: string
  ): Promise<{ payment: Payment; invoice: Invoice; plan: InstallmentPlan }> {
    const transaction = await sequelize.transaction();

    try {
      // Get installment plan
      const plan = await paymentRepository.findInstallmentPlanById(installmentPlanId);
      if (!plan) {
        throw new Error('Installment plan not found');
      }

      if (!plan.isActive()) {
        throw new Error('Installment plan is not active');
      }

      // Check if installment number is valid
      if (installmentNumber < 1 || installmentNumber > plan.numberOfInstallments) {
        throw new Error(`Invalid installment number. Must be between 1 and ${plan.numberOfInstallments}`);
      }

      // Check if this installment has already been paid
      const existingPayment = await Payment.findOne({
        where: {
          installmentPlanId,
          installmentNumber,
          status: PaymentStatus.COMPLETED
        }
      });

      if (existingPayment) {
        throw new Error(`Installment ${installmentNumber} has already been paid`);
      }

      // Process payment
      const result = await this.processPayment({
        invoiceId: plan.invoiceId,
        studentId: plan.studentId,
        amount: Number(plan.installmentAmount),
        paymentMethod,
        paymentDate,
        transactionId,
        receivedBy,
        remarks,
        installmentNumber,
        installmentPlanId
      });

      await transaction.commit();

      return {
        ...result,
        plan
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: number): Promise<Payment | null> {
    return paymentRepository.findById(paymentId);
  }

  /**
   * Get payment by receipt number
   */
  async getPaymentByReceiptNumber(receiptNumber: string): Promise<Payment | null> {
    return paymentRepository.findByReceiptNumber(receiptNumber);
  }

  /**
   * Get payments by student ID
   */
  async getPaymentsByStudentId(studentId: number): Promise<Payment[]> {
    return paymentRepository.findByStudentId(studentId);
  }

  /**
   * Get payments by invoice ID
   */
  async getPaymentsByInvoiceId(invoiceId: number): Promise<Payment[]> {
    return paymentRepository.findByInvoiceId(invoiceId);
  }

  /**
   * Get installment plan by ID
   */
  async getInstallmentPlanById(planId: number): Promise<InstallmentPlan | null> {
    return paymentRepository.findInstallmentPlanById(planId);
  }

  /**
   * Get installment plan by invoice ID
   */
  async getInstallmentPlanByInvoiceId(invoiceId: number): Promise<InstallmentPlan | null> {
    return paymentRepository.findInstallmentPlanByInvoiceId(invoiceId);
  }

  /**
   * Cancel installment plan
   */
  async cancelInstallmentPlan(planId: number): Promise<InstallmentPlan> {
    const plan = await paymentRepository.findInstallmentPlanById(planId);
    if (!plan) {
      throw new Error('Installment plan not found');
    }

    if (plan.isCompleted()) {
      throw new Error('Cannot cancel completed installment plan');
    }

    plan.markAsCancelled();
    await plan.save();

    return plan;
  }

  /**
   * Verify receipt by QR code
   */
  async verifyReceipt(receiptNumber: string): Promise<Payment | null> {
    return paymentRepository.findByReceiptNumber(receiptNumber);
  }

  /**
   * Get payment statistics
   */
  async getPaymentStatistics(startDate?: string, endDate?: string): Promise<any> {
    return paymentRepository.getPaymentStatsByMethod(startDate, endDate);
  }

  /**
   * Refund payment
   */
  /**
   * Refund a payment
   * Requirements: 38.4 - Log financial transactions
   */
  async refundPayment(
    paymentId: number,
    refundedBy: number,
    reason: string
  ): Promise<{ payment: Payment; invoice: Invoice }> {
    const transaction = await sequelize.transaction();

    try {
      // Get payment
      const payment = await paymentRepository.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status === PaymentStatus.REFUNDED) {
        throw new Error('Payment has already been refunded');
      }

      if (payment.status !== PaymentStatus.COMPLETED) {
        throw new Error('Only completed payments can be refunded');
      }

      // Get invoice
      const invoice = await invoiceRepository.findById(payment.invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Store old value for audit
      const oldValue = {
        status: payment.status,
        paidAmount: invoice.paidAmount,
        balance: invoice.balance
      };

      // Update payment status
      payment.markAsRefunded();
      payment.remarks = `${payment.remarks || ''}\nRefunded by user ${refundedBy}: ${reason}`;
      await payment.save({ transaction });

      // Update invoice balance (add back the refunded amount)
      const currentPaid = Number(invoice.paidAmount);
      const refundAmount = Number(payment.amount);
      invoice.paidAmount = currentPaid - refundAmount;
      invoice.balance = invoice.calculateBalance();
      invoice.status = invoice.updateStatus();
      await invoice.save({ transaction });

      await transaction.commit();

      // Log refund transaction (Requirement 38.4)
      try {
        await auditLogger.logUpdate(
          'payment',
          payment.paymentId,
          oldValue,
          {
            status: payment.status,
            refundedBy,
            reason,
            refundAmount,
            paidAmount: invoice.paidAmount,
            balance: invoice.balance
          },
          refundedBy
        );

        logger.info('Payment refund logged', {
          paymentId: payment.paymentId,
          receiptNumber: payment.receiptNumber,
          refundAmount,
          refundedBy
        });
      } catch (auditError) {
        logger.error('Failed to log payment refund', { 
          error: auditError, 
          paymentId: payment.paymentId 
        });
      }

      return { payment, invoice };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

export default new PaymentService();
