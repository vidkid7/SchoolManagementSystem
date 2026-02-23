import sequelize from '@config/database';
import refundRepository from './refund.repository';
import paymentRepository from './payment.repository';
import invoiceRepository from './invoice.repository';
import Refund, { RefundStatus } from '@models/Refund.model';
import { Payment, PaymentStatus } from '@models/Payment.model';
import { Invoice } from '@models/Invoice.model';

/**
 * Refund Service
 * Handles refund workflow with approval process
 * 
 * Requirements: 9.14
 */

export interface CreateRefundRequestData {
  paymentId: number;
  reason: string;
  requestedBy: number;
  remarks?: string;
}

export interface ApproveRefundData {
  refundId: number;
  approvedBy: number;
  remarks?: string;
}

export interface RejectRefundData {
  refundId: number;
  rejectedBy: number;
  rejectionReason: string;
}

class RefundService {
  /**
   * Create refund request
   * Creates a pending refund request that requires approval
   */
  async createRefundRequest(
    requestData: CreateRefundRequestData
  ): Promise<Refund> {
    const transaction = await sequelize.transaction();

    try {
      // Validate payment exists
      const payment = await paymentRepository.findById(requestData.paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      // Check if payment is completed
      if (payment.status !== PaymentStatus.COMPLETED) {
        throw new Error('Only completed payments can be refunded');
      }

      // Check if payment already has a pending or approved refund
      const hasPendingRefund = await refundRepository.hasPendingRefund(requestData.paymentId);
      if (hasPendingRefund) {
        throw new Error('Payment already has a pending refund request');
      }

      const hasApprovedRefund = await refundRepository.hasApprovedRefund(requestData.paymentId);
      if (hasApprovedRefund) {
        throw new Error('Payment already has an approved refund');
      }

      // Create refund request
      const refund = await refundRepository.create(
        {
          paymentId: requestData.paymentId,
          invoiceId: payment.invoiceId,
          studentId: payment.studentId,
          amount: Number(payment.amount),
          reason: requestData.reason,
          requestedBy: requestData.requestedBy,
          remarks: requestData.remarks,
          status: RefundStatus.PENDING
        },
        transaction
      );

      await transaction.commit();

      return refund;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Approve refund request
   * Approves the refund but doesn't process it yet
   */
  async approveRefund(
    approvalData: ApproveRefundData
  ): Promise<Refund> {
    const transaction = await sequelize.transaction();

    try {
      // Get refund
      const refund = await refundRepository.findById(approvalData.refundId);
      if (!refund) {
        throw new Error('Refund request not found');
      }

      // Check if refund is pending
      if (!refund.isPending()) {
        throw new Error(`Refund is ${refund.status}, cannot approve`);
      }

      // Approve refund
      refund.approve(approvalData.approvedBy);
      if (approvalData.remarks) {
        refund.remarks = `${refund.remarks || ''}\nApproval remarks: ${approvalData.remarks}`;
      }
      await refund.save({ transaction });

      await transaction.commit();

      return refund;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Reject refund request
   */
  async rejectRefund(
    rejectionData: RejectRefundData
  ): Promise<Refund> {
    const transaction = await sequelize.transaction();

    try {
      // Get refund
      const refund = await refundRepository.findById(rejectionData.refundId);
      if (!refund) {
        throw new Error('Refund request not found');
      }

      // Check if refund is pending
      if (!refund.isPending()) {
        throw new Error(`Refund is ${refund.status}, cannot reject`);
      }

      // Reject refund
      refund.reject(rejectionData.rejectedBy, rejectionData.rejectionReason);
      await refund.save({ transaction });

      await transaction.commit();

      return refund;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Process approved refund
   * Actually processes the refund by updating payment and invoice
   */
  async processRefund(
    refundId: number
  ): Promise<{ refund: Refund; payment: Payment; invoice: Invoice }> {
    const transaction = await sequelize.transaction();

    try {
      // Get refund
      const refund = await refundRepository.findById(refundId);
      if (!refund) {
        throw new Error('Refund request not found');
      }

      // Check if refund is approved
      if (!refund.isApproved()) {
        throw new Error(`Refund must be approved before processing. Current status: ${refund.status}`);
      }

      // Get payment
      const payment = await paymentRepository.findById(refund.paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      // Check if payment is already refunded (safety check)
      if (payment.status !== PaymentStatus.COMPLETED) {
        throw new Error(`Payment status is ${payment.status}, expected COMPLETED`);
      }

      // Get invoice
      const invoice = await invoiceRepository.findById(refund.invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Update payment status to refunded
      payment.markAsRefunded();
      payment.remarks = `${payment.remarks || ''}\nRefunded: ${refund.reason}`;
      await payment.save({ transaction });

      // Update invoice balance (add back the refunded amount)
      const currentPaid = Number(invoice.paidAmount);
      const refundAmount = Number(refund.amount);
      invoice.paidAmount = currentPaid - refundAmount;
      invoice.balance = invoice.calculateBalance();
      invoice.status = invoice.updateStatus();
      await invoice.save({ transaction });

      // Mark refund as completed
      refund.markAsCompleted();
      await refund.save({ transaction });

      await transaction.commit();

      return { refund, payment, invoice };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get refund by ID
   */
  async getRefundById(refundId: number): Promise<Refund | null> {
    return refundRepository.findById(refundId);
  }

  /**
   * Get refund by payment ID
   */
  async getRefundByPaymentId(paymentId: number): Promise<Refund | null> {
    return refundRepository.findByPaymentId(paymentId);
  }

  /**
   * Get all pending refunds
   */
  async getPendingRefunds(): Promise<Refund[]> {
    return refundRepository.findPending();
  }

  /**
   * Get refunds by student ID
   */
  async getRefundsByStudentId(studentId: number): Promise<Refund[]> {
    return refundRepository.findByStudentId(studentId);
  }

  /**
   * Get refunds by invoice ID
   */
  async getRefundsByInvoiceId(invoiceId: number): Promise<Refund[]> {
    return refundRepository.findByInvoiceId(invoiceId);
  }

  /**
   * Get refund statistics
   */
  async getRefundStatistics(startDate?: Date, endDate?: Date): Promise<any> {
    return refundRepository.getStatistics(startDate, endDate);
  }

  /**
   * Cancel refund request (only if pending)
   */
  async cancelRefundRequest(refundId: number): Promise<Refund> {
    const transaction = await sequelize.transaction();

    try {
      const refund = await refundRepository.findById(refundId);
      if (!refund) {
        throw new Error('Refund request not found');
      }

      if (!refund.isPending()) {
        throw new Error(`Cannot cancel refund with status: ${refund.status}`);
      }

      await refundRepository.delete(refundId, transaction);

      await transaction.commit();

      return refund;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

export default new RefundService();
