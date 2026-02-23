import { Transaction } from 'sequelize';
import Refund, { RefundAttributes, RefundCreationAttributes, RefundStatus } from '@models/Refund.model';

/**
 * Refund Repository
 * Handles database operations for refunds
 * 
 * Requirements: 9.14
 */

export interface RefundFilters {
  studentId?: number;
  invoiceId?: number;
  paymentId?: number;
  status?: RefundStatus;
  requestedBy?: number;
  approvedBy?: number;
}

class RefundRepository {
  /**
   * Create a new refund request
   */
  async create(
    refundData: RefundCreationAttributes,
    transaction?: Transaction
  ): Promise<Refund> {
    return Refund.create(refundData, { transaction });
  }

  /**
   * Find refund by ID
   */
  async findById(refundId: number): Promise<Refund | null> {
    return Refund.findByPk(refundId);
  }

  /**
   * Find refund by payment ID
   */
  async findByPaymentId(paymentId: number): Promise<Refund | null> {
    return Refund.findOne({
      where: { paymentId },
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Find all refunds with filters
   */
  async findAll(filters: RefundFilters = {}): Promise<Refund[]> {
    const where: any = {};

    if (filters.studentId) {
      where.studentId = filters.studentId;
    }

    if (filters.invoiceId) {
      where.invoiceId = filters.invoiceId;
    }

    if (filters.paymentId) {
      where.paymentId = filters.paymentId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.requestedBy) {
      where.requestedBy = filters.requestedBy;
    }

    if (filters.approvedBy) {
      where.approvedBy = filters.approvedBy;
    }

    return Refund.findAll({
      where,
      order: [['requestedAt', 'DESC']]
    });
  }

  /**
   * Find pending refunds
   */
  async findPending(): Promise<Refund[]> {
    return this.findAll({ status: RefundStatus.PENDING });
  }

  /**
   * Find refunds by student ID
   */
  async findByStudentId(studentId: number): Promise<Refund[]> {
    return this.findAll({ studentId });
  }

  /**
   * Find refunds by invoice ID
   */
  async findByInvoiceId(invoiceId: number): Promise<Refund[]> {
    return this.findAll({ invoiceId });
  }

  /**
   * Update refund
   */
  async update(
    refundId: number,
    updates: Partial<RefundAttributes>,
    transaction?: Transaction
  ): Promise<Refund | null> {
    const refund = await Refund.findByPk(refundId);
    if (!refund) {
      return null;
    }

    await refund.update(updates, { transaction });
    return refund;
  }

  /**
   * Delete refund
   */
  async delete(refundId: number, transaction?: Transaction): Promise<boolean> {
    const refund = await Refund.findByPk(refundId);
    if (!refund) {
      return false;
    }

    await refund.destroy({ transaction });
    return true;
  }

  /**
   * Check if payment has pending refund
   */
  async hasPendingRefund(paymentId: number): Promise<boolean> {
    const count = await Refund.count({
      where: {
        paymentId,
        status: RefundStatus.PENDING
      }
    });
    return count > 0;
  }

  /**
   * Check if payment has approved refund
   */
  async hasApprovedRefund(paymentId: number): Promise<boolean> {
    const count = await Refund.count({
      where: {
        paymentId,
        status: RefundStatus.APPROVED
      }
    });
    return count > 0;
  }

  /**
   * Get refund statistics
   */
  async getStatistics(startDate?: Date, endDate?: Date): Promise<any> {
    const where: any = {};

    if (startDate && endDate) {
      where.requestedAt = {
        $gte: startDate,
        $lte: endDate
      };
    }

    const refunds = await Refund.findAll({ where });

    const stats = {
      total: refunds.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      completed: 0,
      totalAmount: 0,
      approvedAmount: 0,
      completedAmount: 0
    };

    refunds.forEach(refund => {
      const amount = Number(refund.amount);
      stats.totalAmount += amount;

      switch (refund.status) {
        case RefundStatus.PENDING:
          stats.pending++;
          break;
        case RefundStatus.APPROVED:
          stats.approved++;
          stats.approvedAmount += amount;
          break;
        case RefundStatus.REJECTED:
          stats.rejected++;
          break;
        case RefundStatus.COMPLETED:
          stats.completed++;
          stats.completedAmount += amount;
          break;
      }
    });

    return stats;
  }
}

export default new RefundRepository();
